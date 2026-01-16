// Install dependencies: npm install express socket.io mysql2 dotenv cors
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
      : "*",
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true, ts: Date.now() });
});

const distDir = path.join(__dirname, "client", "dist");
const distIndex = path.join(distDir, "index.html");
const shouldServeClient =
  process.env.SERVE_CLIENT === "true" && fs.existsSync(distIndex);

// If you want the backend to serve the built frontend too:
// - set SERVE_CLIENT=true
// - ensure client is built into client/dist
if (shouldServeClient) {
  app.use(express.static(distDir));
} else {
  // Render-friendly default: frontend hosted elsewhere.
  app.get("/", (req, res) => {
    res.status(200).json({ ok: true, service: "binaryblitz-backend" });
  });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
      : "*",
    methods: ["GET", "POST"],
  },
});

// Database Connection (Alwaysdata)
// Supported env vars:
// - DB_HOST
// - DB_PORT (optional)
// - DB_USER (alias: DB_USERNAME)
// - DB_PASS (alias: DB_PASSWORD)
// - DB_NAME (alias: DB_DATABASE)
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

let db;
let dbInitInFlight = false;
let dbRetryTimer;

function hasDbConfig(config) {
  return Boolean(
    config.host && config.user && config.password && config.database
  );
}

async function initDB() {
  if (dbInitInFlight) return;
  if (!hasDbConfig(dbConfig)) {
    console.warn(
      "DB not configured (missing DB_HOST/DB_USER/DB_PASS/DB_NAME). Running without persistence."
    );
    db = null;
    return;
  }

  dbInitInFlight = true;
  try {
    db = await mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    // Verify that the pool can actually connect.
    const conn = await db.getConnection();
    await conn.ping();
    conn.release();

    console.log("Connected to Alwaysdata DB");
  } catch (err) {
    console.error("DB Connection Failed (running without persistence):", err);
    try {
      await db?.end?.();
    } catch {
      // ignore
    }
    db = null;

    // Retry in the background.
    clearTimeout(dbRetryTimer);
    dbRetryTimer = setTimeout(() => {
      initDB().catch(() => {
        // ignore
      });
    }, 15000);
  } finally {
    dbInitInFlight = false;
  }
}
initDB();

// Game State
let gameState = {
  status: "WAITING",
  round: 1,
  players: {},
  roundDuration: 10,
};

function isAdminSocket(socket) {
  return socket.rooms && socket.rooms.has("admin_room");
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Send immediate feedback so client knows server is awake
  socket.emit("server_awake");

  socket.on("join_game", (data) => {
    if (gameState.status !== "WAITING") {
      socket.emit("game_error", "Game already started");
      return;
    }
    if (gameState.round > 2) {
      socket.emit("game_error", "Game finished");
      return;
    }
    if (Object.keys(gameState.players).length >= 10) {
      socket.emit("game_error", "Game is full (10 players)");
      return;
    }

    const existing = Object.values(gameState.players).find(
      (p) => p.name === data.name
    );
    if (existing) {
      socket.emit("game_error", "Name taken");
      return;
    }

    gameState.players[socket.id] = {
      name: data.name,
      scoreR1: 0,
      scoreR2: 0,
      socketId: socket.id,
    };

    socket.emit("joined_success", { round: gameState.round });
    io.to("admin_room").emit("update_admin", getAdminData());
  });

  socket.on("admin_join", (secret) => {
    if (!process.env.ADMIN_SECRET) {
      // Allow local/dev if ADMIN_SECRET is not set.
      socket.join("admin_room");
      socket.emit("update_admin", getAdminData());
      return;
    }

    if (secret !== process.env.ADMIN_SECRET) {
      socket.emit("admin_auth_failed");
      return;
    }

    socket.join("admin_room");
    socket.emit("update_admin", getAdminData());
  });

  socket.on("admin_start_game", () => {
    if (!isAdminSocket(socket)) return;
    if (gameState.status !== "WAITING" && gameState.status !== "ROUND_OVER")
      return;

    gameState.status = "COUNTDOWN";
    io.emit("game_state_change", gameState.status);

    setTimeout(() => {
      gameState.status = "PLAYING";
      io.emit("game_state_change", gameState.status);

      setTimeout(async () => {
        gameState.status = "ROUND_OVER";
        io.emit("game_state_change", gameState.status);
        io.to("admin_room").emit("update_admin", getAdminData());
        await saveScoresToDB();
      }, gameState.roundDuration * 1000);
    }, 3000);
  });

  socket.on("submit_score", (data) => {
    if (gameState.players[socket.id]) {
      if (gameState.round === 1) {
        gameState.players[socket.id].scoreR1 = data.score;
      } else {
        gameState.players[socket.id].scoreR2 = data.score;
      }
      io.to("admin_room").emit("update_admin", getAdminData());
    }
  });

  socket.on("admin_next_round", () => {
    if (!isAdminSocket(socket)) return;
    if (gameState.round !== 1) return;
    if (gameState.status !== "ROUND_OVER") return;
    gameState.round = 2;
    gameState.status = "WAITING";
    io.emit("round_change", 2);
    io.emit("game_state_change", "WAITING");
    io.to("admin_room").emit("update_admin", getAdminData());
  });

  socket.on("admin_show_graphs", () => {
    if (!isAdminSocket(socket)) return;
    if (gameState.round !== 2) return;
    if (gameState.status !== "ROUND_OVER") return;
    gameState.status = "SHOW_GRAPHS";
    io.emit("game_state_change", "SHOW_GRAPHS");
    io.to("admin_room").emit("update_admin", getAdminData());
  });

  socket.on("admin_restart", async () => {
    if (!isAdminSocket(socket)) return;
    gameState = {
      status: "WAITING",
      round: 1,
      players: {},
      roundDuration: 10,
    };

    if (db) {
      try {
        await db.execute("TRUNCATE TABLE game_scores");
      } catch (err) {
        console.error("Failed to clear DB table game_scores:", err);
      }
    }

    io.emit("reset_game");
    io.to("admin_room").emit("update_admin", getAdminData());
  });

  socket.on("disconnect", () => {
    delete gameState.players[socket.id];
    io.to("admin_room").emit("update_admin", getAdminData());
  });
});

function getAdminData() {
  return {
    gameState: gameState.status,
    round: gameState.round,
    players: Object.values(gameState.players),
  };
}

async function saveScoresToDB() {
  if (!db) return;
  const players = Object.values(gameState.players);

  try {
    for (const p of players) {
      const sql = `
        INSERT INTO game_scores (player_name, score_r1, score_r2)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE score_r1 = ?, score_r2 = ?
      `;
      await db.execute(sql, [
        p.name,
        p.scoreR1,
        p.scoreR2,
        p.scoreR1,
        p.scoreR2,
      ]);
    }
  } catch (err) {
    console.error("Failed to save scores to DB (continuing):", err);

    // If the DB went away, drop the pool and retry connecting.
    const transientCodes = new Set([
      "ECONNREFUSED",
      "PROTOCOL_CONNECTION_LOST",
      "ETIMEDOUT",
      "ENOTFOUND",
      "EAI_AGAIN",
    ]);
    if (transientCodes.has(err?.code)) {
      try {
        await db?.end?.();
      } catch {
        // ignore
      }
      db = null;
      initDB().catch(() => {
        // ignore
      });
    }
  }
}

// If serving the client build, send index.html for SPA routes.
if (shouldServeClient) {
  app.get("*", (req, res) => {
    res.sendFile(distIndex);
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

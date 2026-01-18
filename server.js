// Install dependencies: npm install
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Load backend env (Render uses dashboard env vars; locally use .env)
dotenv.config({ path: path.join(__dirname, ".env") });

const max_users = process.env.MAX_USERS
  ? parseInt(process.env.MAX_USERS, 10)
  : 10;

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

// Optional: serve the built frontend from this server.
// For your Vercel-frontend setup, leave SERVE_CLIENT unset/false.
const distDir = path.join(__dirname, "client", "dist");
const distIndex = path.join(distDir, "index.html");
const shouldServeClient =
  process.env.SERVE_CLIENT === "true" && fs.existsSync(distIndex);

if (shouldServeClient) {
  app.use(express.static(distDir));
  app.get("*", (req, res) => res.sendFile(distIndex));
} else {
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

// NOTE: schemaless/in-memory only.
let gameState = {
  status: "WAITING",
  round: 1,
  players: {},
  roundDuration: 10,
};

function isAdminSocket(socket) {
  return socket.rooms && socket.rooms.has("admin_room");
}

function getAdminData() {
  return {
    gameState: gameState.status,
    round: gameState.round,
    players: Object.values(gameState.players),
  };
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
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
    if (Object.keys(gameState.players).length >= max_users) {
      socket.emit("game_error", `Game is full (${max_users} players)`);
      return;
    }

    const name = String(data?.name || "").trim();
    if (!name) {
      socket.emit("game_error", "Name required");
      return;
    }

    const existing = Object.values(gameState.players).find(
      (p) => p.name === name
    );
    if (existing) {
      socket.emit("game_error", "Name taken");
      return;
    }

    gameState.players[socket.id] = {
      name,
      scoreR1: 0,
      scoreR2: 0,
      socketId: socket.id,
    };

    socket.emit("joined_success", { round: gameState.round });
    io.to("admin_room").emit("update_admin", getAdminData());
  });

  socket.on("admin_join", (secret) => {
    if (!process.env.ADMIN_SECRET) {
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

      setTimeout(() => {
        gameState.status = "ROUND_OVER";
        io.emit("game_state_change", gameState.status);
        io.to("admin_room").emit("update_admin", getAdminData());
      }, gameState.roundDuration * 1000);
    }, 3000);
  });

  socket.on("submit_score", (data) => {
    if (gameState.status == "WAITING") return;
    const player = gameState.players[socket.id];
    if (!player) return;
    const score = Number(data?.score);
    if (!Number.isFinite(score)) return;

    if (gameState.round === 1) player.scoreR1 = score;
    else player.scoreR2 = score;

    io.to("admin_room").emit("update_admin", getAdminData());
  });

  socket.on("admin_next_round", () => {
    if (!isAdminSocket(socket)) return;
    if (gameState.round !== 1) return;
    if (gameState.status !== "ROUND_OVER") return;

    // Advance the round
    gameState.status = "WAITING";
    gameState.round = 2;

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

  socket.on("admin_restart", () => {
    if (!isAdminSocket(socket)) return;
    gameState = {
      status: "WAITING",
      round: 1,
      players: {},
      roundDuration: 10,
    };
    io.emit("reset_game");
    io.to("admin_room").emit("update_admin", getAdminData());
  });

  socket.on("disconnect", () => {
    delete gameState.players[socket.id];
    io.to("admin_room").emit("update_admin", getAdminData());
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

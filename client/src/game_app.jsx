import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  Play,
  RefreshCw,
  Trophy,
  Users,
  Timer,
  Activity,
  Lock,
  Zap,
  Wifi,
} from "lucide-react";
import MedianDisplay from "./components/MedianDisplay";

function getDefaultServerUrl() {
  const envUrl = import.meta.env.VITE_SERVER_URL;
  if (envUrl) return envUrl;

  // Local dev convenience: Vite runs on 5173, backend on 3001.
  if (window.location.hostname === "localhost") return "http://localhost:3001";

  // Production fallback when served by backend.
  return window.location.origin;
}

// --- COMPONENTS ---

const AdminPanel = ({ socketData, onAction, authState }) => {
  const { gameState, round, players } = socketData;
  const [showAverage, setShowAverage] = useState(false);
  const sortedPlayers = [...players].sort((a, b) => b.scoreR1 - a.scoreR1);
  const [hidePlayers, setHidePlayers] = useState(false);

  const graphData = [...players]
    .sort((a, b) => a.scoreR1 - b.scoreR1)
    .map((p) => ({
      name: p.name,
      R1: p.scoreR1,
      R2: p.scoreR2,
      Change: p.scoreR2 - p.scoreR1,
    }));

  const toggleHide = () => {
    setHidePlayers(!hidePlayers);
  };
  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-6 overflow-y-auto">
      <div className="mb-8 border-b border-slate-700 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-purple-400">
            <Lock className="w-6 h-6" /> Game Master
          </h1>
          <p className="text-slate-400 text-sm mt-1">Secret URL Active</p>
        </div>
        <div className="flex gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              gameState === "PLAYING"
                ? "bg-green-500 text-black animate-pulse"
                : "bg-slate-700"
            }`}
          >
            {gameState}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600">
            Round {round}
          </span>
        </div>
      </div>

      {authState !== "ok" && (
        <div className="mb-6 bg-red-500/10 border border-red-500 text-red-200 p-4 rounded-lg">
          <div className="font-bold">Admin link not authorized</div>
          <div className="text-sm text-red-200/80">
            This admin URL (or server env) is incorrect.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-slate-400 text-xs uppercase font-bold mb-2">
            Game Flow
          </h3>
          {gameState === "WAITING" || gameState === "ROUND_OVER" ? (
            <button
              onClick={() => onAction("admin_start_game")}
              disabled={authState !== "ok"}
              className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded flex justify-center items-center gap-2 transition-all"
            >
              <Play size={18} /> Start Round {round}
            </button>
          ) : (
            <div className="w-full bg-slate-700 text-slate-400 font-bold py-3 rounded flex justify-center items-center gap-2 cursor-not-allowed">
              <Activity size={18} className="animate-spin" /> Game in Progress
            </div>
          )}
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-slate-400 text-xs uppercase font-bold mb-2">
            Round Management
          </h3>
          {round === 1 && gameState === "ROUND_OVER" ? (
            <button
              onClick={() => onAction("admin_next_round")}
              disabled={authState !== "ok"}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded flex justify-center items-center gap-2 transition-all"
            >
              Prepare Round 2
            </button>
          ) : round === 2 && gameState === "ROUND_OVER" ? (
            <button
              onClick={() => onAction("admin_show_graphs")}
              disabled={authState !== "ok"}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded flex justify-center items-center gap-2 transition-all"
            >
              <Activity size={18} /> Show Graphs
            </button>
          ) : (
            <div className="text-center text-slate-500 text-sm py-3">
              Waiting for round end
            </div>
          )}
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-slate-400 text-xs uppercase font-bold mb-2">
            Median Score
          </h3>
          <div className="text-center">
            <button
              onClick={() => setShowAverage(true)}
              disabled={authState !== "ok"}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded"
            >
              Show Median
            </button>
            {showAverage && <MedianDisplay sortedPlayers={sortedPlayers} />}
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-slate-400 text-xs uppercase font-bold mb-2">
            Reset
          </h3>
          <button
            onClick={() => onAction("admin_restart")}
            disabled={authState !== "ok"}
            className="w-full border border-red-500 text-red-500 hover:bg-red-500/10 font-bold py-3 rounded flex justify-center items-center gap-2 transition-all"
          >
            <RefreshCw size={18} /> Reset All
          </button>
        </div>
      </div>

      {gameState === "SHOW_GRAPHS" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-in fade-in zoom-in duration-500">
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 h-80">
            <h3 className="text-white font-bold mb-4">
              Graph 1: Round 1 Ranking
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                  }}
                />
                <Bar dataKey="R1" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 h-80">
            <h3 className="text-white font-bold mb-4">
              Graph 2: Score Improvement
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                  }}
                />
                <ReferenceLine y={0} stroke="#fff" />
                <Bar dataKey="Change">
                  {graphData.map((e, i) => (
                    <Cell
                      key={i}
                      fill={e.Change >= 0 ? "#4ade80" : "#f87171"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <button
        className="flex items-center gap-2 px-4 py-2 mb-4 text-sm font-medium transition-colors rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
        onClick={toggleHide}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          className="inline-block"
        >
          <path
            d="M10 50 Q50 10 90 50 Q50 90 10 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
          />
          <circle cx="50" cy="50" r="15" fill="currentColor" />
          <circle cx="50" cy="50" r="7" fill="white" />
        </svg>
        {hidePlayers ? "Show Players" : "Hide Players"}
      </button>
      {!hidePlayers && (
        <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 p-4 overflow-hidden flex flex-col">
          <h3 className="text-slate-400 text-xs uppercase font-bold mb-4">
            Players ({players.length})
          </h3>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">R1</th>
                  <th className="pb-2">R2</th>
                  <th className="pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((p, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2">{p.scoreR1}</td>
                    <td className="py-2">{p.scoreR2}</td>
                    <td className="py-2 text-purple-400 font-bold">
                      {p.scoreR1 + p.scoreR2}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const PlayerView = ({ socket, onJoin, joined, gameState, round }) => {
  const [name, setName] = useState("");
  const [joinError, setJoinError] = useState(null);
  const [inputString, setInputString] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [countdown, setCountdown] = useState(null);
  const [myResult, setMyResult] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    socket.on("game_error", (msg) => setJoinError(msg));
    return () => {
      socket.off?.("game_error");
    };
  }, [socket]);

  useEffect(() => {
    if (gameState === "COUNTDOWN") {
      setScore(0);
      setInputString("");
      let count = 3;
      setCountdown(count);
      const int = setInterval(() => {
        count--;
        if (count > 0) setCountdown(count);
        else {
          setCountdown("GO!");
          clearInterval(int);
        }
      }, 1000);
      return () => clearInterval(int);
    }
    if (gameState === "PLAYING") {
      setCountdown(null);
      setTimeLeft(10);
      inputRef.current?.focus();
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
    if (gameState === "ROUND_OVER") {
      socket.emit("submit_score", { name, score });
      setMyResult(score);
    }
    if (gameState === "WAITING") {
      setMyResult(null);
    }
  }, [gameState, round]);

  const handleInput = (char) => {
    if (gameState !== "PLAYING") return;
    const newInput = inputString + char;
    setInputString(newInput);
    if (
      char === "0" &&
      inputString.length > 0 &&
      inputString[inputString.length - 1] === "1"
    ) {
      setScore((prev) => prev + 10);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "1") handleInput("1");
      if (e.key === "0") handleInput("0");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputString, gameState]);

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white p-6">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 text-center">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-2">Binary Blitz</h1>
          <p className="text-slate-400 mb-8">Test your speed.</p>
          <input
            type="text"
            placeholder="Enter Display Name"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-4 text-white mb-4 text-center text-lg"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {joinError && (
            <div className="text-red-300 text-sm mb-4">{joinError}</div>
          )}
          <button
            onClick={() => {
              if (name) onJoin(name);
            }}
            disabled={!name}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-lg"
          >
            Join Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full bg-slate-900 text-white relative overflow-hidden"
      tabIndex={0}
      ref={inputRef}
    >
      <div className="p-4 flex justify-between items-center bg-slate-800/50 backdrop-blur-md z-10">
        <div className="font-bold flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          {name}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-slate-400">Round {round}</div>
          <div className="font-mono text-2xl font-bold text-yellow-400">
            {score} pts
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {gameState === "WAITING" && (
          <div className="text-center animate-pulse">
            <h2 className="text-4xl font-bold text-slate-300 mb-4">
              Waiting for Host
            </h2>
          </div>
        )}
        {gameState === "COUNTDOWN" && (
          <div className="text-center scale-150">
            <h2 className="text-9xl font-black text-white">{countdown}</h2>
          </div>
        )}
        {gameState === "SHOW_GRAPHS" && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Look at Main Screen
            </h2>
          </div>
        )}
        {gameState === "ROUND_OVER" && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-2">Round Over</h2>
            <p className="text-xl text-slate-300">
              Score:{" "}
              <span className="text-yellow-400 font-bold">{myResult}</span>
            </p>
          </div>
        )}
        {gameState === "PLAYING" && (
          <div className="w-full max-w-md flex flex-col items-center gap-8">
            <div className="flex items-center gap-2 text-red-400 mb-4">
              <Timer className="w-6 h-6 animate-pulse" />
              <span className="text-4xl font-mono font-bold">{timeLeft}s</span>
            </div>
            <div className="flex gap-4 w-full">
              <button
                onMouseDown={() => handleInput("1")}
                className="flex-1 aspect-square bg-slate-800 border-b-4 border-slate-600 active:border-b-0 active:translate-y-1 rounded-2xl flex items-center justify-center text-6xl font-black hover:bg-slate-700 select-none"
              >
                1
              </button>
              <button
                onMouseDown={() => handleInput("0")}
                className="flex-1 aspect-square bg-slate-800 border-b-4 border-slate-600 active:border-b-0 active:translate-y-1 rounded-2xl flex items-center justify-center text-6xl font-black hover:bg-slate-700 select-none"
              >
                0
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function SocketGate({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectError, setConnectError] = useState(null);

  useEffect(() => {
    const serverUrl = getDefaultServerUrl();
    const newSocket = io(serverUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      timeout: 20000,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      setConnectError(null);
      setIsConnected(true);
    });
    newSocket.on("server_awake", () => {
      setConnectError(null);
      setIsConnected(true);
    });
    newSocket.on("connect_error", (err) => {
      setConnectError(err?.message || "Unable to connect");
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  if (!isConnected) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white">
        <Wifi className="w-16 h-16 text-purple-500 animate-pulse mb-4" />
        <h1 className="text-2xl font-bold mb-2">Connecting to Server...</h1>
        <p className="text-slate-500 max-w-sm text-center">
          If the server is sleeping (Render), this may take up to 30 seconds.
        </p>
        {connectError && (
          <p className="text-red-300 text-sm mt-4">{connectError}</p>
        )}
      </div>
    );
  }

  return children(socket);
}

function PlayerPage({ socket }) {
  const [joined, setJoined] = useState(false);
  const [gameState, setGameState] = useState("WAITING");
  const [round, setRound] = useState(1);

  useEffect(() => {
    if (!socket) return;
    socket.on("game_state_change", (state) => setGameState(state));
    socket.on("round_change", (r) => setRound(r));
    socket.on("joined_success", () => setJoined(true));
    socket.on("reset_game", () => {
      setJoined(false);
      setGameState("WAITING");
      setRound(1);
    });
    return () => {
      socket.off?.("game_state_change");
      socket.off?.("round_change");
      socket.off?.("joined_success");
      socket.off?.("reset_game");
    };
  }, [socket]);

  const handleJoin = (name) => socket.emit("join_game", { name });

  return (
    <PlayerView
      socket={socket}
      onJoin={handleJoin}
      joined={joined}
      gameState={gameState}
      round={round}
    />
  );
}

function AdminPage({ socket }) {
  const { adminSecret } = useParams();
  const [authState, setAuthState] = useState("pending");
  const [adminData, setAdminData] = useState({
    gameState: "WAITING",
    round: 1,
    players: [],
  });

  const serverUrl = useMemo(() => getDefaultServerUrl(), []);

  useEffect(() => {
    if (!socket) return;

    socket.on("update_admin", (payload) => {
      setAdminData(payload);
      setAuthState("ok");
    });
    socket.on("admin_auth_failed", () => {
      setAuthState("failed");
    });

    socket.emit("admin_join", adminSecret);

    return () => {
      socket.off?.("update_admin");
      socket.off?.("admin_auth_failed");
    };
  }, [socket, adminSecret]);

  // Keep Render awake while admin page is open.
  useEffect(() => {
    const ping = async () => {
      try {
        await fetch(`${serverUrl}/health`, { cache: "no-store" });
      } catch {
        // ignore
      }
    };

    ping();
    const interval = setInterval(ping, 45000);
    return () => clearInterval(interval);
  }, [serverUrl]);

  const handleAdminAction = (action, payload) => socket.emit(action, payload);

  return (
    <AdminPanel
      socketData={adminData}
      onAction={handleAdminAction}
      authState={authState}
    />
  );
}

export default function GameApp() {
  return (
    <BrowserRouter>
      <SocketGate>
        {(socket) => (
          <div className="w-full h-screen font-sans bg-black">
            <Routes>
              <Route path="/" element={<Navigate to="/game" replace />} />
              <Route path="/game" element={<PlayerPage socket={socket} />} />
              <Route
                path="/game/:adminSecret"
                element={<AdminPage socket={socket} />}
              />
              <Route path="*" element={<Navigate to="/game" replace />} />
            </Routes>
          </div>
        )}
      </SocketGate>
    </BrowserRouter>
  );
}

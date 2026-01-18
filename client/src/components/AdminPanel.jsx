import { useState } from "react";
import { Lock } from "lucide-react";
import MedianDisplay from "./MedianDisplay.jsx";
import Graph1 from "./Graph1.jsx";
import Graph2 from "./Graph2.jsx";
import PlayerSummary from "./PlayerSummary.jsx";
import { Play, Activity, RefreshCw } from "lucide-react";
export default function AdminPanel({ socketData, onAction, authState }) {
  const { gameState, round, players } = socketData;
  const [showAverage, setShowAverage] = useState(false);
  const sortedPlayers = [...players].sort((a, b) => b.scoreR1 - a.scoreR1);
  console.log(players);

  const graphData = [...players]
    .sort((a, b) => a.scoreR1 - b.scoreR1)
    .map((p) => ({
      name: p.name,
      R1: p.scoreR1,
      R2: p.scoreR2,
      Change: p.scoreR2 - p.scoreR1,
    }));

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white p-6">
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
          <Graph1 graphData={graphData} />
          <Graph2 graphData={graphData} />
        </div>
      )}
      <PlayerSummary players={players} sortedPlayers={sortedPlayers} />
    </div>
  );
}

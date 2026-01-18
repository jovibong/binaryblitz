import { Trophy } from "lucide-react";

export default function PlayerLogin({ name, setName, onJoin, joinError }) {
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

import { useState } from "react";
export default function PlayerSummary({ players, sortedPlayers }) {
  const [hidePlayers, setHidePlayers] = useState(false);
  const toggleHide = () => {
    setHidePlayers(!hidePlayers);
  };
  return (
    <>
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
    </>
  );
}

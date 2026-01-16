export default function MedianDisplay({ sortedPlayers }) {
  const medianScoreRound1 =
    sortedPlayers.length > 0
      ? (() => {
          const mid = Math.floor(sortedPlayers.length / 2);

          const median =
            sortedPlayers.length % 2 !== 0
              ? sortedPlayers[mid].scoreR1
              : (sortedPlayers[mid - 1].scoreR1 + sortedPlayers[mid].scoreR1) /
                2;

          return Number(median).toFixed(1);
        })()
      : 0;

  return (
    <div className="text-3xl font-bold text-white mt-3">
      {medianScoreRound1} pts
    </div>
  );
}

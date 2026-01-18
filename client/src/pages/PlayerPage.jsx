import { useState, useEffect } from "react";
import PlayerView from "../components/PlayerView.jsx";
export default function PlayerPage({ socket }) {
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

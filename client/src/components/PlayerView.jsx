import { useState, useEffect, useRef } from "react";
import { Timer } from "lucide-react";
import PlayerLogin from "./PlayerLogin.jsx";
export default function PlayerView({
  socket,
  onJoin,
  joined,
  gameState,
  round,
}) {
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
      <PlayerLogin
        name={name}
        setName={setName}
        onJoin={onJoin}
        joinError={joinError}
      />
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
}

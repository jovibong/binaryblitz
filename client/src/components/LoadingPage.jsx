import { Wifi } from "lucide-react";
export default function LoadingPage({ connectError }) {
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

export default function getDefaultServerUrl() {
  const envUrl = import.meta.env.VITE_SERVER_URL;
  if (envUrl) return envUrl;

  // Local dev convenience: Vite runs on 5173, backend on 3001.
  if (window.location.hostname === "localhost") return "http://localhost:3001";

  // Production fallback when served by backend.
  return window.location.origin;
}

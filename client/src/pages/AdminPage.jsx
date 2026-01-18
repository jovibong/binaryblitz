import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getDefaultServerUrl } from "../utils/serverUrl.js";
import AdminPanel from "../components/AdminPanel";
export default function AdminPage({ socket }) {
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

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import PlayerPage from "./pages/PlayerPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";

export default function GameApp() {
  return (
    <BrowserRouter>
      <SocketProvider>
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
      </SocketProvider>
    </BrowserRouter>
  );
}

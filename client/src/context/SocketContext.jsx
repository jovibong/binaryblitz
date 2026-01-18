import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import LoadingPage from "../components/LoadingPage.jsx";
import getDefaultServerUrl from "../utils/serverUrl.js";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectError, setConnectError] = useState(null);

  useEffect(() => {
    const serverUrl = getDefaultServerUrl();
    const newSocket = io(serverUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      timeout: 20000,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      setConnectError(null);
      setIsConnected(true);
    });

    newSocket.on("connect_error", (err) => {
      setConnectError(err?.message || "Unable to connect");
    });

    return () => newSocket.disconnect();
  }, []);

  // While connecting, show the loading screen
  if (!isConnected) {
    return <LoadingPage connectError={connectError} />;
  }

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

import React, { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);

  if (!socketRef.current) {
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: false,
    });
  }

  useEffect(() => {
    const socket = socketRef.current;
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket) throw new Error("useSocket must be used within SocketProvider");
  return socket;
};

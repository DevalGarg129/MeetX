import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import { RoomProvider } from "./context/RoomContext";
import LandingPage from "./pages/LandingPage";
import LobbyPage from "./components/lobby/LobbyPage";
import RoomPage from "./components/room/RoomPage";
import Navbar from "./components/shared/Navbar";
import "./styles/global.css";

const App = () => {
  return (
    <SocketProvider>
      <RoomProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing */}
            <Route
              path="/"
              element={
                <>
                  <Navbar />
                  <LandingPage />
                </>
              }
            />

            {/* Feature 1: Lobby / waiting room */}
            <Route
              path="/lobby/:roomCode"
              element={
                <>
                  <Navbar />
                  <LobbyPage />
                </>
              }
            />

            {/* Main room */}
            <Route path="/room/:roomCode" element={<RoomPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </RoomProvider>
    </SocketProvider>
  );
};

export default App;

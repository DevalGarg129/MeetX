import React from "react";
import { useSocket } from "../../context/SocketContext";
import { useRoom } from "../../context/RoomContext";

const EMOJIS = ["👍", "❤️", "😂", "🎉", "👏", "🔥", "😮", "🙌"];

const ReactionsPicker = ({ onClose }) => {
  const socket = useSocket();
  const { roomCode, userName, addReaction } = useRoom();

  const send = (emoji) => {
    // Local: show on own tile immediately
    addReaction({ socketId: "local", name: userName, emoji });

    // Broadcast via socket
    socket.emit("reaction:send", { roomCode, emoji });
    onClose();
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 10px)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        borderRadius: 40,
        padding: "8px 14px",
        display: "flex", gap: 4,
        boxShadow: "var(--shadow)",
        zIndex: 200,
        animation: "slideUp 0.2s ease",
        whiteSpace: "nowrap",
      }}
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => send(emoji)}
          style={{
            fontSize: 22, cursor: "pointer",
            border: "none", background: "transparent",
            width: 38, height: 38, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.14s, background 0.14s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.35)";
            e.currentTarget.style.background = "var(--surface2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          {emoji}
        </button>
      ))}
      <style>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(16px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ReactionsPicker;

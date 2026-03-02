import React, { useEffect, useRef, useState } from "react";
import { useRoom } from "../../context/RoomContext";
import { useSocket } from "../../context/SocketContext";

const ChatPanel = () => {
  const { messages, addMessage, roomCode, userName } = useRoom();
  const socket = useSocket();
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");

    // Optimistic local add
    addMessage({ senderName: userName, text: trimmed, sentAt: new Date().toISOString(), isOwn: true });

    // Emit to server
    socket.emit("chat:message", { roomCode, senderName: userName, text: trimmed });
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Messages */}
      <div
        style={{
          flex: 1, overflowY: "auto",
          padding: 14, display: "flex",
          flexDirection: "column", gap: 12,
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, marginTop: 40 }}>
            No messages yet. Say hi! 👋
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "12px 14px",
          borderTop: "1px solid var(--border)",
          display: "flex", gap: 8, alignItems: "center",
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Send a message…"
          style={{
            flex: 1, padding: "9px 14px",
            background: "var(--bg3)", border: "1px solid var(--border)",
            borderRadius: 24, color: "var(--text)",
            fontFamily: "var(--font-body)", fontSize: 13,
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          maxLength={500}
        />
        <button className="icon-btn sm" onClick={sendMessage} title="Send">
          ➤
        </button>
      </div>
    </div>
  );
};

const MessageBubble = ({ message }) => {
  const isSystem = message.type === "system";
  const isOwn = message.isOwn;

  if (isSystem) {
    return (
      <div style={{ textAlign: "center", fontSize: 11, color: "var(--text3)", padding: "2px 0" }}>
        {message.text}
      </div>
    );
  }

  const time = message.sentAt
    ? new Date(message.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "now";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        alignItems: isOwn ? "flex-end" : "flex-start",
        maxWidth: "82%",
        alignSelf: isOwn ? "flex-end" : "flex-start",
      }}
    >
      <div style={{ fontSize: 10, color: "var(--text3)" }}>
        {isOwn ? "You" : message.senderName} · {time}
      </div>
      <div
        style={{
          padding: "9px 13px",
          borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          fontSize: 13, lineHeight: 1.5,
          background: isOwn
            ? "linear-gradient(135deg, var(--accent), var(--accent2))"
            : "var(--bg3)",
          color: isOwn ? "#fff" : "var(--text)",
          wordBreak: "break-word",
        }}
      >
        {message.text}
      </div>
    </div>
  );
};

export default ChatPanel;

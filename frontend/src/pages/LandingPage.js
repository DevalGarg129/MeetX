import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, getRoom } from "../utils/api";
import { useRoom } from "../context/RoomContext";
import ToastContainer from "../components/shared/ToastContainer";
import useToast from "../hooks/useToast";

const LandingPage = () => {
  const navigate = useNavigate();
  const { setRoomCode, setRoomName, setUserName } = useRoom();
  const { toasts, showToast, removeToast } = useToast();

  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Start a brand-new meeting
  const handleNewMeeting = async () => {
    if (!name.trim()) { showToast("⚠️", "Please enter your name"); return; }
    setLoading(true);
    try {
      const res = await createRoom(name.trim(), `${name.trim()}'s Meeting`);
      const { roomCode, roomName } = res.data;
      setRoomCode(roomCode);
      setRoomName(roomName);
      setUserName(name.trim());
      navigate(`/lobby/${roomCode}`);
    } catch (err) {
      showToast("❌", "Could not create room. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  // Join an existing meeting
  const handleJoinMeeting = async () => {
    if (!name.trim()) { showToast("⚠️", "Please enter your name"); return; }
    if (!joinCode.trim()) { showToast("⚠️", "Please enter a meeting code"); return; }
    setLoading(true);
    try {
      const res = await getRoom(joinCode.trim().toLowerCase());
      const { roomCode, roomName } = res.data;
      setRoomCode(roomCode);
      setRoomName(roomName);
      setUserName(name.trim());
      navigate(`/lobby/${roomCode}`);
    } catch (err) {
      showToast("❌", "Room not found or no longer active.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnterKey = (e, action) => {
    if (e.key === "Enter") action();
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="bg-grid" />
      <div className="bg-orb orb1" />
      <div className="bg-orb orb2" />

      <div
        className="fade-in"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "100px 20px 60px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Hero */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(79,142,247,0.1)",
            border: "1px solid rgba(79,142,247,0.22)",
            color: "var(--accent)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "1px",
            textTransform: "uppercase",
            padding: "6px 16px",
            borderRadius: 20,
            marginBottom: 28,
          }}
        >
          🚀 WebRTC Powered · Real-time Conferencing
        </div>

        <h1
          style={{
            fontFamily: "var(--font-head)",
            fontSize: "clamp(40px, 7vw, 84px)",
            fontWeight: 800,
            lineHeight: 1.0,
            letterSpacing: "-2px",
            marginBottom: 22,
            background: "linear-gradient(160deg, #fff 0%, rgba(255,255,255,0.55) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Connect.<br />Collaborate.<br />
          <span
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Meet Now.
          </span>
        </h1>

        <p
          style={{
            fontSize: 17,
            color: "var(--text2)",
            lineHeight: 1.75,
            maxWidth: 520,
            margin: "0 auto 44px",
          }}
        >
          Crystal-clear video meetings with real-time chat, screen sharing,
          reactions & live audio meters — all in your browser. No downloads.
        </p>

        {/* Room Card */}
        <div className="card" style={{ padding: 32, width: "100%", maxWidth: 420 }}>
          <h3 style={{ marginBottom: 22, fontSize: 18 }}>🎥 Start or Join a Meeting</h3>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Your Name</label>
            <input
              className="form-input"
              placeholder="Enter your display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => handleEnterKey(e, handleNewMeeting)}
              maxLength={40}
            />
          </div>

          <button
            className="btn btn-primary w-full"
            style={{ padding: "13px 0", marginBottom: 16 }}
            onClick={handleNewMeeting}
            disabled={loading}
          >
            {loading ? "Creating…" : "✨ New Meeting"}
          </button>

          <div className="divider" style={{ marginBottom: 16 }}>or join with code</div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Meeting Code</label>
            <input
              className="form-input"
              placeholder="e.g. abc-xyz-123"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => handleEnterKey(e, handleJoinMeeting)}
              maxLength={20}
            />
          </div>

          <button
            className="btn btn-outline w-full"
            style={{ padding: "13px 0" }}
            onClick={handleJoinMeeting}
            disabled={loading}
          >
            Join Meeting
          </button>
        </div>

        {/* Feature chips */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 32 }}>
          {[
            { icon: "🖥️", label: "Screen Share", color: "var(--accent)" },
            { icon: "💬", label: "Live Chat",    color: "var(--accent2)" },
            { icon: "🎉", label: "Reactions",    color: "var(--success)" },
            { icon: "✋", label: "Raise Hand",   color: "var(--warn)" },
            { icon: "🎤", label: "Audio Meter",  color: "var(--danger)" },
            { icon: "🏠", label: "Lobby Preview", color: "var(--text2)" },
          ].map((f) => (
            <div
              key={f.label}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 20,
                background: "var(--surface)", border: "1px solid var(--border)",
                fontSize: 12, color: "var(--text2)",
              }}
            >
              <span style={{ fontSize: 14 }}>{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

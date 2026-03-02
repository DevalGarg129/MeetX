import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import { useRoom } from "../../context/RoomContext";
import { getRoom } from "../../utils/api";
import useAudioMeter from "../../hooks/useAudioMeter";
import useToast from "../../hooks/useToast";
import ToastContainer from "../shared/ToastContainer";

const LobbyPage = () => {
  const { roomCode: paramCode } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const { userName, setUserName, roomCode, setRoomCode, setRoomName, setMicOn, setCamOn } = useRoom();
  const { toasts, showToast, removeToast } = useToast();

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [localMic, setLocalMic] = useState(true);
  const [localCam, setLocalCam] = useState(true);
  const [displayName, setDisplayName] = useState(userName || "");
  const [lobbyInfo, setLobbyInfo] = useState({ participantCount: 0, participants: [] });
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState({ mics: [], cameras: [] });

  // Feature 5: Audio meter in lobby
  const { level } = useAudioMeter(streamRef.current);

  // Load room info
  useEffect(() => {
    const code = paramCode || roomCode;
    if (!code) { navigate("/"); return; }
    setRoomCode(code);

    getRoom(code)
      .then((res) => setRoomInfo(res.data))
      .catch(() => showToast("⚠️", "Room not found"));

    socket.emit("lobby:check", { roomCode: code });
    socket.on("lobby:info", (info) => setLobbyInfo(info));
    return () => socket.off("lobby:info");
  }, []);

  // Start camera preview
  useEffect(() => {
    const startPreview = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        setDevices({
          mics: allDevices.filter((d) => d.kind === "audioinput"),
          cameras: allDevices.filter((d) => d.kind === "videoinput"),
        });
      } catch (e) {
        showToast("⚠️", "Camera/mic not available");
      }
    };
    startPreview();

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleMic = () => {
    const next = !localMic;
    setLocalMic(next);
    if (streamRef.current) streamRef.current.getAudioTracks().forEach((t) => (t.enabled = next));
  };

  const toggleCam = () => {
    const next = !localCam;
    setLocalCam(next);
    if (streamRef.current) streamRef.current.getVideoTracks().forEach((t) => (t.enabled = next));
  };

  const handleJoin = () => {
    if (!displayName.trim()) { showToast("⚠️", "Enter your name to continue"); return; }
    setLoading(true);
    setUserName(displayName.trim());
    setMicOn(localMic);
    setCamOn(localCam);
    setRoomName(roomInfo?.roomName || "MeetX Room");
    navigate(`/room/${paramCode || roomCode}`);
  };

  const code = paramCode || roomCode;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="bg-grid" />
      <div className="bg-orb orb1" />
      <div className="bg-orb orb2" />

      <div
        className="fade-in"
        style={{
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "100vh", padding: "80px 20px 40px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: 20, width: "100%", maxWidth: 920,
          }}
        >
          {/* ── Camera preview panel ── */}
          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            <h3 style={{ fontSize: 17 }}>Camera & Audio Preview</h3>

            {/* Video */}
            <div
              style={{
                position: "relative", background: "#000",
                borderRadius: "var(--radius)", aspectRatio: "16/9",
                overflow: "hidden",
              }}
            >
              <video
                ref={videoRef}
                autoPlay muted playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: localCam ? "block" : "none" }}
              />
              {!localCam && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, color: "var(--text3)" }}>
                  📷
                </div>
              )}
            </div>

            {/* Toggle buttons */}
            <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
              <button
                onClick={toggleMic}
                className={`icon-btn lg ${!localMic ? "danger" : ""}`}
                title={localMic ? "Mute" : "Unmute"}
              >
                {localMic ? "🎤" : "🔇"}
              </button>
              <button
                onClick={toggleCam}
                className={`icon-btn lg ${!localCam ? "danger" : ""}`}
                title={localCam ? "Turn off camera" : "Turn on camera"}
              >
                {localCam ? "📷" : "🚫"}
              </button>
            </div>

            {/* Feature 5: Audio Level Meter */}
            <div style={{ background: "var(--bg3)", borderRadius: "var(--radius-sm)", padding: 14 }}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Microphone Level
              </div>
              <AudioMeterBars level={level} />
            </div>

            {/* Device selects */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <DeviceRow icon="🎤" label="Microphone" options={devices.mics} />
              <DeviceRow icon="📷" label="Camera" options={devices.cameras} />
            </div>
          </div>

          {/* ── Info / Join panel ── */}
          <div className="card" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 5 }}>READY TO JOIN</div>
              <h2 style={{ fontSize: 20 }}>{roomInfo?.roomName || "Meeting Room"}</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <InfoRow label="Room Code" value={<span style={{ color: "var(--accent)", fontFamily: "monospace" }}>{code}</span>} />
              <InfoRow label="Status" value={<span style={{ color: "var(--success)", display: "flex", alignItems: "center", gap: 6 }}><span className="live-dot" />Live</span>} />
              <InfoRow label="Participants" value={`${lobbyInfo.participantCount} already in room`} />
            </div>

            {/* Participant avatars */}
            {lobbyInfo.participants.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  In Meeting
                </div>
                <div style={{ display: "flex", gap: -6, alignItems: "center" }}>
                  {lobbyInfo.participants.slice(0, 4).map((p, i) => (
                    <div key={i} style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700, border: "2px solid var(--bg2)",
                      marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i,
                    }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {lobbyInfo.participants.length > 4 && (
                    <span style={{ fontSize: 12, color: "var(--text2)", marginLeft: 8 }}>
                      +{lobbyInfo.participants.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Your Name in Meeting</label>
              <input
                className="form-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="Display name"
                maxLength={40}
              />
            </div>

            <button
              className="btn btn-primary w-full"
              style={{ padding: "14px 0", fontSize: 15 }}
              onClick={handleJoin}
              disabled={loading}
            >
              {loading ? "Joining…" : "🚀 Join Now"}
            </button>
            <button
              className="btn btn-ghost w-full"
              style={{ padding: "11px 0" }}
              onClick={() => navigate("/")}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────

const AudioMeterBars = ({ level }) => {
  const NUM = 18;
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 30 }}>
      {Array.from({ length: NUM }).map((_, i) => {
        const threshold = i / NUM;
        const active = level > threshold;
        const color = level > 0.75 ? "var(--danger)" : level > 0.45 ? "var(--warn)" : "var(--accent)";
        return (
          <div
            key={i}
            style={{
              width: 4,
              height: active ? `${Math.min(8 + level * 22, 30)}px` : "4px",
              background: active ? color : "var(--border)",
              borderRadius: 2,
              transition: "height 0.08s, background 0.12s",
            }}
          />
        );
      })}
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "9px 12px", background: "var(--bg3)", borderRadius: "var(--radius-xs)",
  }}>
    <span style={{ fontSize: 12, color: "var(--text2)" }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
  </div>
);

const DeviceRow = ({ icon, label, options }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
    <select className="form-select" style={{ flex: 1 }}>
      {options.length > 0
        ? options.map((d, i) => <option key={i} value={d.deviceId}>{d.label || `${label} ${i + 1}`}</option>)
        : <option>{label} (default)</option>
      }
    </select>
  </div>
);

export default LobbyPage;

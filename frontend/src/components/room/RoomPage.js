import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import { useRoom } from "../../context/RoomContext";
import useWebRTC from "../../hooks/useWebRTC";
import useToast from "../../hooks/useToast";
import VideoTile from "./VideoTile";
import ControlsBar from "./ControlsBar";
import Sidebar from "./Sidebar";
import ToastContainer from "../shared/ToastContainer";

const RoomPage = () => {
  const { roomCode: paramCode } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const {
    roomCode, roomName, userName,
    micOn, setMicOn, camOn, setCamOn,
    handRaised, setHandRaised,
    screenSharing, setScreenSharing,
    sidebarTab, setSidebarTab,
    participants, addParticipant, removeParticipant, updateParticipant,
    addMessage, addReaction, reactions,
    resetRoom,
  } = useRoom();

  const { toasts, showToast, removeToast } = useToast();

  const {
    localStream, remoteStreams,
    startLocalStream, callPeer,
    toggleMic, toggleCam,
    startScreenShare, stopScreenShare,
    cleanup,
  } = useWebRTC(roomCode || paramCode);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Speaking states: socketId -> bool
  const [speaking, setSpeaking] = useState({});

  // ─── Mount: join room ────────────────────────────────────────────────
  useEffect(() => {
    const code = paramCode || roomCode;
    if (!code || !userName) {
      navigate(`/lobby/${paramCode || ""}`);
      return;
    }

    const initRoom = async () => {
      const stream = await startLocalStream(micOn, camOn);
      socket.emit("room:join", {
        roomCode: code,
        userName,
        micOn,
        camOn,
      });
    };

    initRoom();
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    return () => {
      clearInterval(timerRef.current);
    };
  }, []); // eslint-disable-line

  // ─── Socket: room events ─────────────────────────────────────────────
  useEffect(() => {
    const code = paramCode || roomCode;

    // New user joined → call them
    socket.on("room:user-joined", ({ socketId, name, micOn: m, camOn: c }) => {
      addParticipant({ socketId, name, micOn: m, camOn: c, handRaised: false });
      callPeer(socketId);
      showToast("👤", `${name} joined the meeting`);
    });

    // Existing participants list
    socket.on("room:existing-participants", ({ participants: list }) => {
      list.forEach((p) => addParticipant(p));
    });

    // Someone left
    socket.on("room:user-left", ({ socketId, name }) => {
      removeParticipant(socketId);
      setSpeaking((prev) => { const n = { ...prev }; delete n[socketId]; return n; });
      showToast("👋", `${name || "Someone"} left the meeting`);
    });

    // Media toggles
    socket.on("media:user-toggled-mic", ({ socketId, micOn: m }) => {
      updateParticipant(socketId, { micOn: m });
    });
    socket.on("media:user-toggled-cam", ({ socketId, camOn: c }) => {
      updateParticipant(socketId, { camOn: c });
    });

    // Feature 2: Incoming chat messages
    socket.on("chat:message", (msg) => {
      if (msg.senderName !== userName) {
        addMessage({ ...msg, isOwn: false });
      }
    });
    socket.on("chat:system", ({ text }) => {
      addMessage({ type: "system", text, id: Date.now() });
    });

    // Feature 3: Screen share notifications
    socket.on("screenshare:started", ({ name }) => {
      showToast("🖥️", `${name} started screen sharing`);
    });
    socket.on("screenshare:stopped", ({ socketId }) => {
      showToast("🖥️", "Screen sharing stopped");
    });

    // Feature 4: Reactions
    socket.on("reaction:received", ({ socketId, name, emoji }) => {
      addReaction({ socketId, name, emoji });
    });

    // Feature 4: Hand raise
    socket.on("hand:changed", ({ socketId, name, raised }) => {
      updateParticipant(socketId, { handRaised: raised });
      if (raised) showToast("✋", `${name} raised their hand`);
    });

    // Feature 5: Speaking state
    socket.on("audio:user-speaking", ({ socketId, isSpeaking }) => {
      setSpeaking((prev) => ({ ...prev, [socketId]: isSpeaking }));
    });

    return () => {
      socket.off("room:user-joined");
      socket.off("room:existing-participants");
      socket.off("room:user-left");
      socket.off("media:user-toggled-mic");
      socket.off("media:user-toggled-cam");
      socket.off("chat:message");
      socket.off("chat:system");
      socket.off("screenshare:started");
      socket.off("screenshare:stopped");
      socket.off("reaction:received");
      socket.off("hand:changed");
      socket.off("audio:user-speaking");
    };
  }, [socket, roomCode, paramCode]); // eslint-disable-line

  // ─── Control handlers ────────────────────────────────────────────────
  const handleToggleMic = useCallback(() => {
    const next = !micOn;
    setMicOn(next);
    toggleMic(next);
  }, [micOn, setMicOn, toggleMic]);

  const handleToggleCam = useCallback(() => {
    const next = !camOn;
    setCamOn(next);
    toggleCam(next);
  }, [camOn, setCamOn, toggleCam]);

  const handleScreenShare = useCallback(async () => {
    if (screenSharing) {
      await stopScreenShare();
      setScreenSharing(false);
      showToast("🖥️", "Screen sharing stopped");
    } else {
      const stream = await startScreenShare();
      if (stream) {
        setScreenSharing(true);
        showToast("🖥️", "Screen sharing started");
      }
    }
  }, [screenSharing, startScreenShare, stopScreenShare, setScreenSharing]);

  const handleToggleHand = useCallback(() => {
    const next = !handRaised;
    setHandRaised(next);
    socket.emit("hand:raise", { roomCode: paramCode || roomCode, raised: next });
    showToast("✋", next ? "Hand raised" : "Hand lowered");
  }, [handRaised, setHandRaised, socket, roomCode, paramCode]);

  const handleToggleSidebar = useCallback((tab) => {
    setSidebarTab((prev) => (prev === tab ? null : tab));
  }, [setSidebarTab]);

  const handleLeave = useCallback(() => {
    cleanup();
    resetRoom();
    socket.emit("room:leave", { roomCode: paramCode || roomCode });
    navigate("/");
    showToast("👋", "You left the meeting");
  }, [cleanup, resetRoom, navigate, socket, roomCode, paramCode]);

  // ─── Timer format ────────────────────────────────────────────────────
  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
  };

  // ─── Video grid layout ───────────────────────────────────────────────
  const totalTiles = 1 + Object.keys(remoteStreams).length;
  const gridCols = totalTiles === 1 ? "1fr" : totalTiles <= 4 ? "1fr 1fr" : "repeat(3, 1fr)";

  // Get local reaction
  const localReaction = reactions.find((r) => r.socketId === "local")?.emoji;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)" }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* ── Header ── */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 24px",
          background: "rgba(10,12,20,0.9)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
          flexShrink: 0,
        }}
      >
        <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 700 }}>
          MeetX · <span style={{ color: "var(--accent)", fontFamily: "monospace", fontSize: 14 }}>{paramCode || roomCode}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {screenSharing && (
            <span className="badge badge-success">🖥️ Sharing</span>
          )}
          <span className="live-dot" />
          <span style={{ fontSize: 13, color: "var(--text2)", fontVariantNumeric: "tabular-nums" }}>
            {formatTime(elapsed)}
          </span>
          <button
            className="icon-btn sm"
            title="Copy invite link"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              showToast("🔗", "Meeting link copied!");
            }}
          >
            🔗
          </button>
        </div>
      </div>

      {/* ── Body: video grid + sidebar ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Video Grid */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: gridCols,
            gap: 8,
            padding: 12,
            alignContent: "start",
            overflowY: "auto",
          }}
        >
          {/* Local tile */}
          <VideoTile
            stream={localStream}
            name={userName}
            isLocal
            micOn={micOn}
            camOn={camOn}
            isSpeaking={speaking["local"]}
            handRaised={handRaised}
            reaction={localReaction}
          />

          {/* Remote tiles */}
          {participants.map((p) => {
            const pReaction = reactions.find((r) => r.socketId === p.socketId)?.emoji;
            return (
              <VideoTile
                key={p.socketId}
                stream={remoteStreams[p.socketId] || null}
                name={p.name}
                micOn={p.micOn}
                camOn={p.camOn}
                isSpeaking={speaking[p.socketId]}
                handRaised={p.handRaised}
                reaction={pReaction}
              />
            );
          })}
        </div>

        {/* Sidebar */}
        {sidebarTab && (
          <Sidebar onClose={() => setSidebarTab(null)} />
        )}
      </div>

      {/* ── Controls ── */}
      <ControlsBar
        localStream={localStream}
        onToggleMic={handleToggleMic}
        onToggleCam={handleToggleCam}
        onScreenShare={handleScreenShare}
        onToggleHand={handleToggleHand}
        onToggleSidebar={handleToggleSidebar}
        onLeave={() => setShowLeaveModal(true)}
        isScreenSharing={screenSharing}
      />

      {/* ── Leave modal ── */}
      {showLeaveModal && (
        <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 12 }}>Leave Meeting?</h3>
            <p style={{ color: "var(--text2)", lineHeight: 1.6, marginBottom: 24 }}>
              Are you sure you want to leave? Other participants will continue without you.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowLeaveModal(false)}>
                Stay
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleLeave}>
                Leave Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPage;

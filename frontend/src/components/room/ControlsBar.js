import React, { useState } from "react";
import { useRoom } from "../../context/RoomContext";
import ReactionsPicker from "./ReactionsPicker";
import useAudioMeter from "../../hooks/useAudioMeter";

const ControlsBar = ({
  localStream,
  onToggleMic,
  onToggleCam,
  onScreenShare,
  onToggleHand,
  onToggleSidebar,
  onLeave,
  isScreenSharing,
}) => {
  const { micOn, camOn, handRaised, sidebarTab } = useRoom();
  const [showReactions, setShowReactions] = useState(false);

  // Feature 5: live level in control bar
  const { level } = useAudioMeter(localStream);
  const lvlColor = level > 0.75 ? "var(--danger)" : level > 0.4 ? "var(--warn)" : "var(--success)";

  return (
    <div
      style={{
        display: "flex", alignItems: "center",
        padding: "14px 24px",
        background: "rgba(10,12,20,0.92)",
        borderTop: "1px solid var(--border)",
        backdropFilter: "blur(14px)",
        gap: 10,
        flexWrap: "wrap",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* ── Left group: Mic + Cam ── */}
      <div style={{ display: "flex", gap: 10, marginRight: "auto" }}>
        {/* Mic with audio level bar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}>
          <div style={{ width: 54, height: 3, background: "var(--bg3)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${level * 100}%`, background: lvlColor, borderRadius: 2, transition: "width 0.08s" }} />
          </div>
          <CtrlBtn
            icon={micOn ? "🎤" : "🔇"}
            label={micOn ? "Mute" : "Unmute"}
            active={!micOn}
            isDanger={!micOn}
            onClick={onToggleMic}
          />
        </div>
        <CtrlBtn
          icon={camOn ? "📷" : "🚫"}
          label={camOn ? "Hide Camera" : "Show Camera"}
          active={!camOn}
          isDanger={!camOn}
          onClick={onToggleCam}
        />
      </div>

      {/* ── Center group: Screen / Reactions / Hand / Chat / Participants ── */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <CtrlBtn
          icon="🖥️"
          label={isScreenSharing ? "Stop Share" : "Share Screen"}
          active={isScreenSharing}
          onClick={onScreenShare}
        />

        {/* Reactions — has picker above it */}
        <div style={{ position: "relative" }}>
          <CtrlBtn
            icon="😊"
            label="Reactions"
            active={showReactions}
            onClick={() => setShowReactions((v) => !v)}
          />
          {showReactions && (
            <ReactionsPicker onClose={() => setShowReactions(false)} />
          )}
        </div>

        <CtrlBtn
          icon="✋"
          label={handRaised ? "Lower Hand" : "Raise Hand"}
          active={handRaised}
          onClick={onToggleHand}
        />
        <CtrlBtn
          icon="💬"
          label="Chat"
          active={sidebarTab === "chat"}
          onClick={() => onToggleSidebar("chat")}
        />
        <CtrlBtn
          icon="👥"
          label="Participants"
          active={sidebarTab === "participants"}
          onClick={() => onToggleSidebar("participants")}
        />
      </div>

      {/* ── Right group: Leave ── */}
      <div style={{ marginLeft: "auto" }}>
        <button
          className="btn btn-danger"
          style={{ padding: "10px 22px", gap: 8 }}
          onClick={onLeave}
        >
          📞 Leave
        </button>
      </div>
    </div>
  );
};

const CtrlBtn = ({ icon, label, active, isDanger, onClick }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
    <button
      className={`icon-btn lg ${active && !isDanger ? "active" : ""} ${isDanger ? "danger" : ""}`}
      onClick={onClick}
      title={label}
    >
      {icon}
    </button>
    <span style={{ fontSize: 10, color: "var(--text3)", whiteSpace: "nowrap" }}>{label}</span>
  </div>
);

export default ControlsBar;

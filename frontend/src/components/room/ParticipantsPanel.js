import React from "react";
import { useRoom } from "../../context/RoomContext";

const ParticipantsPanel = () => {
  const { participants, userName } = useRoom();

  const gradients = [
    "linear-gradient(135deg,#4f8ef7,#7c5cf6)",
    "linear-gradient(135deg,#f74f6a,#f7c94f)",
    "linear-gradient(135deg,#4ff7a0,#4f8ef7)",
    "linear-gradient(135deg,#f7c94f,#7c5cf6)",
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
      {/* Self */}
      <ParticipantRow
        name={userName}
        isLocal
        micOn
        camOn
        gradient={gradients[0]}
      />

      {/* Remote peers */}
      {participants.map((p, i) => (
        <ParticipantRow
          key={p.socketId}
          name={p.name}
          micOn={p.micOn}
          camOn={p.camOn}
          handRaised={p.handRaised}
          gradient={gradients[(i + 1) % gradients.length]}
        />
      ))}

      {participants.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, marginTop: 40 }}>
          Waiting for others to join…
        </div>
      )}
    </div>
  );
};

const ParticipantRow = ({ name, isLocal, micOn, camOn, handRaised, gradient }) => (
  <div
    style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "9px 12px", borderRadius: "var(--radius-xs)",
      transition: "background 0.15s",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
  >
    <div
      style={{
        width: 36, height: 36, borderRadius: "50%",
        background: gradient,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 700, flexShrink: 0,
      }}
    >
      {name?.charAt(0).toUpperCase()}
    </div>

    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 500 }}>
        {name}
        {isLocal && (
          <span style={{ fontSize: 11, color: "var(--accent)", marginLeft: 6 }}>(You · Host)</span>
        )}
      </div>
      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>
        {micOn ? "Mic on" : "Muted"}{!camOn ? " · Camera off" : ""}
      </div>
    </div>

    <div style={{ display: "flex", gap: 5 }}>
      {!micOn && <span style={{ fontSize: 13 }}>🔇</span>}
      {!camOn && <span style={{ fontSize: 13 }}>🚫</span>}
      {handRaised && <span style={{ fontSize: 13 }}>✋</span>}
    </div>
  </div>
);

export default ParticipantsPanel;

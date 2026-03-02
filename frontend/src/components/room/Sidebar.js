import React from "react";
import { useRoom } from "../../context/RoomContext";
import ChatPanel from "./ChatPanel";
import ParticipantsPanel from "./ParticipantsPanel";

const TABS = [
  { id: "chat",         label: "💬 Chat" },
  { id: "participants", label: "👥 People" },
];

const Sidebar = ({ onClose }) => {
  const { sidebarTab, setSidebarTab, participants, messages } = useRoom();

  const unread = messages.length;

  return (
    <div
      style={{
        width: 310,
        flexShrink: 0,
        borderLeft: "1px solid var(--border)",
        background: "var(--bg2)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", position: "relative" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSidebarTab(tab.id)}
            style={{
              flex: 1, padding: "13px 8px",
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500,
              color: sidebarTab === tab.id ? "var(--accent)" : "var(--text2)",
              borderBottom: `2px solid ${sidebarTab === tab.id ? "var(--accent)" : "transparent"}`,
              transition: "color 0.2s, border-color 0.2s",
              fontFamily: "var(--font-body)",
            }}
          >
            {tab.label}
            {tab.id === "participants" && participants.length > 0 && (
              <span
                style={{
                  marginLeft: 5, fontSize: 10, padding: "1px 5px",
                  background: "var(--surface2)", borderRadius: 10,
                  color: "var(--text3)",
                }}
              >
                {participants.length + 1}
              </span>
            )}
          </button>
        ))}
        {/* Close button */}
        <button
          onClick={onClose}
          className="icon-btn sm"
          style={{ margin: "8px 10px", flexShrink: 0 }}
          title="Close"
        >
          ✕
        </button>
      </div>

      {/* Panel content */}
      {sidebarTab === "chat" && <ChatPanel />}
      {sidebarTab === "participants" && <ParticipantsPanel />}
    </div>
  );
};

export default Sidebar;

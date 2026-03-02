import React, { useEffect, useRef } from "react";

/**
 * VideoTile
 * Displays a single participant's video (or avatar if cam is off).
 * Shows speaking ring, hand-raised badge, mic-off indicator.
 */
const VideoTile = ({
  stream,
  name,
  isLocal = false,
  micOn = true,
  camOn = true,
  isSpeaking = false,
  handRaised = false,
  reaction = null,
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const gradients = [
    "linear-gradient(135deg,#4f8ef7,#7c5cf6)",
    "linear-gradient(135deg,#f74f6a,#f7c94f)",
    "linear-gradient(135deg,#4ff7a0,#4f8ef7)",
    "linear-gradient(135deg,#f7c94f,#7c5cf6)",
  ];
  const grad = gradients[(name?.charCodeAt(0) || 0) % gradients.length];

  return (
    <div
      style={{
        position: "relative",
        background: "var(--bg2)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        aspectRatio: "16/9",
        border: `2px solid ${isSpeaking ? "var(--success)" : "var(--border)"}`,
        boxShadow: isSpeaking ? "0 0 0 3px rgba(79,247,160,0.18)" : "none",
        transition: "border-color 0.25s, box-shadow 0.25s",
      }}
    >
      {/* Video element */}
      {camOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: isLocal ? "scaleX(-1)" : "none",
          }}
        />
      ) : (
        /* Avatar fallback */
        <div
          style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--bg3)",
          }}
        >
          <div
            style={{
              width: 72, height: 72, borderRadius: "50%",
              background: grad,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 700, color: "#fff",
            }}
          >
            {initial}
          </div>
        </div>
      )}

      {/* Hand raised badge */}
      {handRaised && (
        <div
          style={{
            position: "absolute", top: 10, left: 10,
            background: "rgba(247,201,79,0.92)",
            padding: "3px 10px", borderRadius: 20,
            fontSize: 12, color: "#000", fontWeight: 600,
            display: "flex", alignItems: "center", gap: 4,
            animation: "bounceIn 0.3s",
          }}
        >
          ✋ Hand Raised
        </div>
      )}

      {/* Reaction bubble */}
      {reaction && (
        <div
          style={{
            position: "absolute", top: 10, right: 10,
            fontSize: 32,
            animation: "reactionPop 2.1s forwards",
            pointerEvents: "none",
          }}
        >
          {reaction}
        </div>
      )}

      {/* Bottom overlay: name + badges */}
      <div
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "20px 12px 10px",
          background: "linear-gradient(transparent, rgba(0,0,0,0.72))",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
          {isSpeaking && (
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
          )}
          {name}{isLocal && " (You)"}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {!micOn && (
            <span
              style={{
                width: 22, height: 22, borderRadius: "50%",
                background: "rgba(247,79,106,0.35)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 11,
              }}
            >
              🔇
            </span>
          )}
        </div>
      </div>

      {/* Inline keyframes via style tag */}
      <style>{`
        @keyframes bounceIn {
          0%{transform:scale(0)} 80%{transform:scale(1.1)} 100%{transform:scale(1)}
        }
        @keyframes reactionPop {
          0%{transform:scale(0) translateY(0);opacity:1}
          50%{transform:scale(1.3) translateY(-16px);opacity:1}
          100%{transform:scale(0.7) translateY(-44px);opacity:0}
        }
      `}</style>
    </div>
  );
};

export default VideoTile;

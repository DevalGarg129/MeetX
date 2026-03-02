import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 40px",
        background: "rgba(10,12,20,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        onClick={() => navigate("/")}
        style={{
          fontFamily: "var(--font-head)",
          fontSize: "22px",
          fontWeight: 800,
          background: "linear-gradient(135deg, #fff 0%, var(--accent) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          cursor: "pointer",
          letterSpacing: "-0.5px",
        }}
      >
        Meet<span style={{ WebkitTextFillColor: "var(--accent)" }}>X</span>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span className="badge badge-success">
          <span className="live-dot" style={{ width: 6, height: 6 }}></span>
          Live
        </span>
        <button
          className="btn btn-outline"
          style={{ fontSize: 13, padding: "8px 18px" }}
          onClick={() => navigate("/")}
        >
          Home
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

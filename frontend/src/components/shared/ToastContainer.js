import React from "react";

const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast"
          onClick={() => onRemove(t.id)}
          style={{ cursor: "pointer" }}
        >
          <span style={{ fontSize: 18 }}>{t.icon}</span>
          <span style={{ flex: 1, fontSize: 13 }}>{t.message}</span>
          <span style={{ color: "var(--text3)", fontSize: 16 }}>×</span>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;

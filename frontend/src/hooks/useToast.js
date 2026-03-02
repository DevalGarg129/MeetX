import { useState, useCallback } from "react";

let toastId = 0;

const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((icon, message, duration = 3000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, icon, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
};

export default useToast;

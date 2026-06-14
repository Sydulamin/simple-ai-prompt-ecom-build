import { useState, useCallback } from 'react';

let _setToasts = null;

// Module-level singleton so any component can call toast() directly
export const toast = {
  success: (msg) => _setToasts?.((p) => [...p, { id: Date.now(), type: 'success', msg }]),
  error:   (msg) => _setToasts?.((p) => [...p, { id: Date.now(), type: 'error',   msg }]),
  info:    (msg) => _setToasts?.((p) => [...p, { id: Date.now(), type: 'info',    msg }]),
};

export const useToastProvider = () => {
  const [toasts, setToasts] = useState([]);
  _setToasts = setToasts;

  const dismiss = useCallback((id) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  return { toasts, dismiss };
};

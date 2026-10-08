/**
 * useToast — toast notification queue.
 *
 * Usage:
 *   const { toasts, toast, dismiss } = useToast();
 *   toast.success('Ranking submitted!');
 *   toast.error('Something went wrong.');
 *   toast.info('Rankings locked — phase advanced.');
 *
 * Toasts auto-dismiss after `duration` ms (default 4000).
 * Render <ToastContainer toasts={toasts} onDismiss={dismiss} /> at the app root.
 */
import { useState, useCallback, useRef } from 'react';

let _id = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const toast = {
    success: (msg, dur)  => add(msg, 'success', dur),
    error:   (msg, dur)  => add(msg, 'error',   dur ?? 6000),
    info:    (msg, dur)  => add(msg, 'info',    dur),
    warning: (msg, dur)  => add(msg, 'warning', dur),
  };

  return { toasts, toast, dismiss };
}

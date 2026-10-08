/**
 * useLocalStorage — useState backed by localStorage.
 *
 * Usage:
 *   const [theme, setTheme] = useLocalStorage('theme', 'light');
 */
import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* storage full — silent */ }
  }, [key, value]);

  return [value, setValue];
}

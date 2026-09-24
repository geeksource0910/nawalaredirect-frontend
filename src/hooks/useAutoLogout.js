import { useEffect, useRef, useCallback, useState } from 'react';

const TIMEOUT_DURATION = 60 * 60 * 1000; // 1 jam
const WARNING_BEFORE = 5 * 60 * 1000;    // warning 5 menit sebelum
const DEBOUNCE_MS = 500;                  // FIX: throttle reset agar mousemove tidak fire ratusan kali/detik

export function useAutoLogout(onLogout) {
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const debounceRef = useRef(null); // FIX: tambah debounce ref
  const [warning, setWarning] = useState(false);

  const resetTimer = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearTimeout(warningRef.current);
    setWarning(false);

    warningRef.current = setTimeout(() => {
      setWarning(true);
    }, TIMEOUT_DURATION - WARNING_BEFORE);

    timeoutRef.current = setTimeout(() => {
      localStorage.removeItem('nawala_token');
      localStorage.setItem('nawala_logout_reason', 'session_expired');
      onLogout();
    }, TIMEOUT_DURATION);
  }, [onLogout]);

  // FIX: debounced handler — tidak panggil resetTimer lebih dari 1x per 500ms
  const debouncedReset = useCallback(() => {
    if (debounceRef.current) return;
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      resetTimer();
    }, DEBOUNCE_MS);
  }, [resetTimer]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, debouncedReset, { passive: true }));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, debouncedReset));
      clearTimeout(timeoutRef.current);
      clearTimeout(warningRef.current);
      clearTimeout(debounceRef.current);
    };
  }, [resetTimer, debouncedReset]);

  return { warning, resetTimer };
}

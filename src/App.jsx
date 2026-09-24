import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Statistics from './pages/Statistics';
import { authAPI } from './api';
import { useAutoLogout } from './hooks/useAutoLogout';

function WarningBanner({ onStay }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: '#b45309', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 20px', fontSize: 12, fontWeight: 500,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    }}>
      <span>⚠️ Sesi akan berakhir dalam 5 menit karena tidak aktif.</span>
      <button onClick={onStay} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
        Tetap Login
      </button>
    </div>
  );
}

function AuthenticatedApp({ onLogout }) {
  const [page, setPage] = useState('dashboard');
  const { warning, resetTimer } = useAutoLogout(onLogout);

  if (page === 'statistics') return (
    <>
      {warning && <WarningBanner onStay={resetTimer} />}
      {/* FIX: pass onLogout ke Statistics supaya sidebar logout bisa jalan */}
      <Statistics onBack={() => setPage('dashboard')} onLogout={onLogout} />
    </>
  );

  return (
    <>
      {warning && <WarningBanner onStay={resetTimer} />}
      <Dashboard onLogout={onLogout} onStats={() => setPage('statistics')} />
    </>
  );
}

export default function App() {
  const [auth, setAuth]       = useState(false);
  const [checking, setChecking] = useState(true);
  const [expiredMsg, setExpiredMsg] = useState(false);

  useEffect(() => {
    const reason = localStorage.getItem('nawala_logout_reason');
    if (reason === 'session_expired') {
      setExpiredMsg(true);
      localStorage.removeItem('nawala_logout_reason');
    }
    const token = localStorage.getItem('nawala_token');
    if (!token) { setChecking(false); return; }
    authAPI.verify()
      .then(() => setAuth(true))
      .catch(() => localStorage.removeItem('nawala_token'))
      .finally(() => setChecking(false));
  }, []);

  if (checking) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 13 }}>
      Memuat...
    </div>
  );

  function handleLogout() {
    localStorage.removeItem('nawala_token');
    setAuth(false); setExpiredMsg(false);
  }

  if (!auth) return <Login onLogin={() => { setAuth(true); setExpiredMsg(false); }} expiredMsg={expiredMsg} />;
  return <AuthenticatedApp onLogout={handleLogout} />;
}

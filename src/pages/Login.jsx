import { useState } from 'react';
import { authAPI } from '../api';

export default function Login({ onLogin, expiredMsg }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.login(username, password);
      localStorage.setItem('nawala_token', res.data.token);
      onLogin();
    } catch (err) {
      setError(err.response?.data?.error || 'Login gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>⬡</div>
        <div style={S.title}>NawalaRedirect</div>
        <div style={S.sub}>Domain Gateway Control Panel</div>

        {/* Pesan session expired */}
        {expiredMsg && (
          <div style={S.expiredBanner}>
            🔒 Sesi kamu telah berakhir karena tidak aktif. Silakan login kembali.
          </div>
        )}

        {error && <div style={S.errorBanner}>{error}</div>}

        <div style={S.form}>
          <div style={S.field}>
            <label style={S.label}>Username</label>
            <input
              style={S.input}
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleLogin(e)}
            />
          </div>
          <div style={S.field}>
            <label style={S.label}>Password</label>
            <input
              style={S.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleLogin(e)}
            />
          </div>
          <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 380, boxShadow: 'var(--shadow)', textAlign: 'center' },
  logo: { width: 52, height: 52, background: 'var(--accent)', color: 'white', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 16px' },
  title: { fontWeight: 700, fontSize: 20, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 4 },
  sub: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 },
  expiredBanner: { background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: '#b45309', borderRadius: 8, padding: '10px 14px', fontSize: 12, marginBottom: 16, textAlign: 'left', lineHeight: 1.5 },
  errorBanner: { background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)', color: 'var(--red)', borderRadius: 8, padding: '10px 14px', fontSize: 12, marginBottom: 16 },
  form: { display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 500, color: 'var(--text-dim)' },
  input: { border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, outline: 'none', color: 'var(--text)', background: 'var(--bg)', width: '100%' },
  btn: { background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, padding: '12px', cursor: 'pointer', fontSize: 14, fontWeight: 600, marginTop: 4 },
};

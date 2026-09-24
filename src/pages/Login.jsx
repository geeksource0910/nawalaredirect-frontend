import { useState } from 'react';
import { authAPI } from '../api';

export default function Login({ onLogin, expiredMsg }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authAPI.login(username, password);
      localStorage.setItem('nawala_token', res.data.token);
      onLogin();
    } catch (err) {
      setError(err.response?.data?.error || 'Login gagal');
    } finally { setLoading(false); }
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logoWrap}>
          <div style={S.logo}>⬡</div>
        </div>
        <div style={S.title}>NawalaRedirect</div>
        <div style={S.sub}>Domain Gateway Control Panel</div>

        {expiredMsg && (
          <div style={S.warn}>Sesi berakhir karena tidak aktif. Silakan login kembali.</div>
        )}
        {error && <div style={S.err}>{error}</div>}

        <div style={S.form}>
          <div style={S.field}>
            <label style={S.label}>Username</label>
            <input style={S.input} type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="admin" autoFocus onKeyDown={e => e.key === 'Enter' && handleLogin(e)} />
          </div>
          <div style={S.field}>
            <label style={S.label}>Password</label>
            <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin(e)} />
          </div>
          <button style={{ ...S.btn, opacity: loading ? 0.6 : 1 }} onClick={handleLogin} disabled={loading}>
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </div>
      </div>
    </div>
  );
}

const S = {
  page:    { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:    { background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '36px 32px', width: '100%', maxWidth: 360, textAlign: 'center' },
  logoWrap:{ marginBottom: 16 },
  logo:    { width: 44, height: 44, background: 'var(--accent)', color: '#fff', borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
  title:   { fontWeight: 600, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 4 },
  sub:     { fontSize: 12, color: 'var(--text-dim)', marginBottom: 24 },
  warn:    { background: 'var(--yellow-dim)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--yellow)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 12, marginBottom: 16, textAlign: 'left' },
  err:     { background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 12, marginBottom: 16 },
  form:    { display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' },
  field:   { display: 'flex', flexDirection: 'column', gap: 6 },
  label:   { fontSize: 12, fontWeight: 500, color: 'var(--text-dim)' },
  input:   { border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, outline: 'none', color: 'var(--text)', background: 'var(--bg3)', width: '100%' },
  btn:     { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '11px', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginTop: 4 },
};

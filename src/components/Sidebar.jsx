import { useState, useEffect } from 'react';
import { domainAPI } from '../api';

const API_URL = import.meta.env.VITE_API_URL || '';

function NavItem({ label, active, onClick, icon }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
        fontSize: 13, fontWeight: 500, marginBottom: 1,
        color: active ? 'var(--accent)' : hov ? 'var(--text)' : 'var(--text-dim)',
        background: active ? 'var(--accent-dim)' : hov ? 'var(--bg3)' : 'transparent',
        transition: 'all 0.12s',
      }}
    >
      <span style={{ fontSize: 11, opacity: 0.7 }}>{icon}</span>
      {label}
    </div>
  );
}

function StatusDot({ color, glow }) {
  return (
    <span style={{
      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
      background: color,
      boxShadow: 'none',
      display: 'inline-block',
    }} />
  );
}

export default function Sidebar({ activePage = 'dashboard', onDashboard, onStats, onLogout }) {
  const [stats, setStats] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const loadStats = () =>
      domainAPI.getStats().then(r => setStats(r.data.stats)).catch(() => {});
    loadStats();
    const si = setInterval(loadStats, 30000);
    const ti = setInterval(() => setTime(new Date()), 1000);
    return () => { clearInterval(si); clearInterval(ti); };
  }, []);

  return (
    <aside style={S.sidebar}>
      {/* Logo */}
      <div style={S.logo}>
        <div style={S.logoIcon}>⬡</div>
        <div>
          <div style={S.logoName}>NawalaRedirect</div>
          <div style={S.logoSub}>Domain Gateway</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={S.nav}>
        <NavItem icon="▤" label="Dashboard"  active={activePage === 'dashboard'}  onClick={onDashboard} />
        <NavItem icon="▦" label="Statistik"  active={activePage === 'statistics'} onClick={onStats} />
      </nav>

      <div style={S.sep} />

      {/* System status */}
      <div style={S.section}>
        <div style={S.sectionHead}>Status Sistem</div>
        {stats ? (
          <>
            <div style={S.statusRow}>
              <StatusDot color="var(--green)" glow={stats.active > 0} />
              <span style={S.statusLabel}>{stats.active} aktif</span>
            </div>
            <div style={S.statusRow}>
              <StatusDot color={stats.blocked > 0 ? 'var(--red)' : 'var(--text-muted)'} glow={stats.blocked > 0} />
              <span style={{ ...S.statusLabel, color: stats.blocked > 0 ? 'var(--red)' : 'var(--text-muted)' }}>
                {stats.blocked} nawala
              </span>
            </div>
            <div style={S.statusRow}>
              <StatusDot color="var(--text-muted)" />
              <span style={{ ...S.statusLabel, color: 'var(--text-muted)' }}>{stats.inactive} nonaktif</span>
            </div>
            <div style={S.miniStat}>
              <span style={S.miniLabel}>Redirect hari ini</span>
              <span style={S.miniValue}>{stats.todayRedirects}</span>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Memuat...</div>
        )}
      </div>

      <div style={S.sep} />

      {/* Gateway */}
      <div style={S.section}>
        <div style={S.sectionHead}>Gateway</div>
        <a href={API_URL} target="_blank" rel="noreferrer" style={S.gatewayUrl}>
          {(API_URL || '—').replace('https://', '')} ↗
        </a>
      </div>

      <div style={{ flex: 1 }} />
      <div style={S.sep} />

      {/* Bottom */}
      <div style={S.bottom}>
        <div style={S.clock}>{time.toLocaleTimeString('id-ID', { hour12: false })}</div>
        <div style={S.clockDate}>
          {time.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
        <button onClick={onLogout} style={S.logoutBtn}>Keluar</button>
      </div>
    </aside>
  );
}

const S = {
  sidebar: {
    width: 220, height: '100vh', position: 'sticky', top: 0,
    background: 'var(--bg2)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'auto',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '15px 14px', borderBottom: '1px solid var(--border)',
  },
  logoIcon: {
    width: 30, height: 30, background: 'var(--accent)', color: '#fff',
    borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, flexShrink: 0,
  },
  logoName: { fontWeight: 600, fontSize: 13, color: 'var(--text)', letterSpacing: '-0.2px' },
  logoSub:  { fontSize: 10, color: 'var(--text-muted)', marginTop: 1 },
  nav:      { padding: '10px 8px 6px' },
  sep:      { height: 1, background: 'var(--border)' },
  section:  { padding: '12px 14px' },
  sectionHead: { fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.04em' },
  statusRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 },
  statusLabel: { fontSize: 12, color: 'var(--text-dim)' },
  miniStat: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)',
  },
  miniLabel: { fontSize: 11, color: 'var(--text-muted)' },
  miniValue: { fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--mono)' },
  gatewayUrl: {
    fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--mono)',
    textDecoration: 'none', wordBreak: 'break-all', display: 'block',
    lineHeight: 1.5, marginTop: 2,
  },
  bottom:    { padding: '14px 14px 16px' },
  clock:     { fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: 'var(--text)', letterSpacing: 1, marginBottom: 2 },
  clockDate: { fontSize: 10, color: 'var(--text-dim)', marginBottom: 12 },
  logoutBtn: {
    width: '100%', background: 'transparent', border: '1px solid var(--border2)',
    color: 'var(--text-dim)', padding: '7px', borderRadius: 'var(--radius)',
    cursor: 'pointer', fontSize: 12, fontWeight: 500,
  },
};

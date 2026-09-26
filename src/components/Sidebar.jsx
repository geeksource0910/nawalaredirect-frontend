import { useState, useEffect } from 'react';
import { domainAPI } from '../api';
import { useIsMobile } from '../hooks/useIsMobile';

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

function StatusDot({ color }) {
  return (
    <span style={{
      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
      background: color, display: 'inline-block',
    }} />
  );
}

export default function Sidebar({ activePage = 'dashboard', onDashboard, onStats, onLogout, isOpen = false, onClose }) {
  const [stats, setStats] = useState(null);
  const [time, setTime]   = useState(new Date());
  const isMobile          = useIsMobile();

  useEffect(() => {
    const loadStats = () =>
      domainAPI.getStats().then(r => setStats(r.data.stats)).catch(() => {});
    loadStats();
    const si = setInterval(loadStats, 30000);
    const ti = setInterval(() => setTime(new Date()), 1000);
    return () => { clearInterval(si); clearInterval(ti); };
  }, []);

  /* Close sidebar after nav on mobile */
  const handleNav = (fn) => { fn?.(); if (isMobile) onClose?.(); };

  const mobileSidebarStyle = {
    ...S.sidebar,
    position: 'fixed',
    top: 0, left: 0,
    zIndex: 1001,
    height: '100dvh',
    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.25s ease',
    boxShadow: isOpen ? '4px 0 24px rgba(0,0,0,0.16)' : 'none',
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 1000,
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            transition: 'opacity 0.25s ease',
          }}
        />
      )}

      <aside style={isMobile ? mobileSidebarStyle : S.sidebar}>
        {/* Logo row */}
        <div style={S.logo}>
          <div style={S.logoIcon}>⬡</div>
          <div style={{ flex: 1 }}>
            <div style={S.logoName}>NawalaRedirect</div>
            <div style={S.logoSub}>Domain Gateway</div>
          </div>
          {/* Close button inside sidebar (mobile only) */}
          {isMobile && (
            <button onClick={onClose} style={S.closeBtn}>✕</button>
          )}
        </div>

        {/* Nav */}
        <nav style={S.nav}>
          <NavItem icon="▤" label="Dashboard"  active={activePage === 'dashboard'}  onClick={() => handleNav(onDashboard)} />
          <NavItem icon="▦" label="Statistik"  active={activePage === 'statistics'} onClick={() => handleNav(onStats)} />
        </nav>

        <div style={S.sep} />

        {/* System status */}
        <div style={S.section}>
          <div style={S.sectionHead}>Status Sistem</div>
          {stats ? (
            <>
              <div style={S.statusRow}>
                <StatusDot color="var(--green)" />
                <span style={S.statusLabel}>{stats.active} aktif</span>
              </div>
              <div style={S.statusRow}>
                <StatusDot color={stats.blocked > 0 ? 'var(--red)' : 'var(--text-muted)'} />
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
    </>
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
  logoName:  { fontWeight: 600, fontSize: 13, color: 'var(--text)', letterSpacing: '-0.2px' },
  logoSub:   { fontSize: 10, color: 'var(--text-muted)', marginTop: 1 },
  closeBtn:  { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: '4px 6px', borderRadius: 4, flexShrink: 0 },
  nav:       { padding: '10px 8px 6px' },
  sep:       { height: 1, background: 'var(--border)' },
  section:   { padding: '12px 14px' },
  sectionHead: { fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.04em' },
  statusRow:   { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 },
  statusLabel: { fontSize: 12, color: 'var(--text-dim)' },
  miniStat: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)',
  },
  miniLabel:  { fontSize: 11, color: 'var(--text-muted)' },
  miniValue:  { fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--mono)' },
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

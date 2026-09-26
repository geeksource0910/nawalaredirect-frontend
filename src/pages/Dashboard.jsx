import { useState, useEffect, useCallback } from 'react';
import { domainAPI } from '../api';
import StatCard from '../components/StatCard';
import DomainRow from '../components/DomainRow';
import AddDomainForm from '../components/AddDomainForm';
import Sidebar from '../components/Sidebar';
import { useIsMobile } from '../hooks/useIsMobile';

// ── Add Domain Modal ────────────────────────────────────────────────────────
function AddModal({ show, onClose, groups, onAdded, isMobile }) {
  if (!show) return null;
  return (
    <div
      style={isMobile ? MS.overlayMobile : MS.overlay}
      onClick={e => !isMobile && e.target === e.currentTarget && onClose()}
    >
      <div style={isMobile ? MS.modalMobile : MS.modal}>
        <div style={MS.header}>
          <div>
            <div style={MS.title}>Tambah Domain</div>
            <div style={MS.sub}>Domain akan otomatis aktif setelah ditambahkan</div>
          </div>
          <button style={MS.close} onClick={onClose}>✕</button>
        </div>
        <AddDomainForm
          groups={groups}
          onAdded={async () => { await onAdded(); onClose(); }}
        />
      </div>
    </div>
  );
}

const MS = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 999, padding: 24, backdropFilter: 'blur(6px)',
  },
  overlayMobile: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    zIndex: 999, backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'var(--bg2)', border: '1px solid var(--border2)',
    borderRadius: 12, width: '100%', maxWidth: 580,
    boxShadow: '0 32px 80px rgba(0,0,0,0.15)',
    animation: 'fadeUp 0.18s ease',
    overflow: 'hidden',
  },
  modalMobile: {
    background: 'var(--bg2)', borderRadius: '16px 16px 0 0',
    width: '100%', maxHeight: '92dvh', overflow: 'auto',
    animation: 'fadeUp 0.22s ease',
    boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
  },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '18px 20px', borderBottom: '1px solid var(--border)',
  },
  title: { fontWeight: 600, fontSize: 14, color: 'var(--text)' },
  sub:   { fontSize: 11, color: 'var(--text-dim)', marginTop: 3 },
  close: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15, padding: '2px 4px', borderRadius: 4 },
};

// ── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard({ onLogout, onStats }) {
  const [domains, setDomains]           = useState([]);
  const [stats, setStats]               = useState(null);
  const [groupStats, setGroupStats]     = useState([]);
  const [groups, setGroups]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [checkingAll, setCheckingAll]   = useState(false);
  const [checkingISP, setCheckingISP]   = useState(false);
  const [filter, setFilter]             = useState('all');
  const [search, setSearch]             = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [lastUpdate, setLastUpdate]     = useState(null);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const isMobile                        = useIsMobile();

  const fetchData = useCallback(async () => {
    try {
      const [dRes, sRes, gRes] = await Promise.all([
        domainAPI.getAll(),
        domainAPI.getStats(),
        domainAPI.getGroups(),
      ]);
      setDomains(dRes.data.data || []);
      setStats(sRes.data.stats);
      setGroupStats(sRes.data.groupStats || []);
      setGroups(gRes.data.groups || []);
      setLastUpdate(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const t = setInterval(fetchData, 60000);
    return () => clearInterval(t);
  }, [fetchData]);

  async function handleCheckAll() {
    setCheckingAll(true);
    try { await domainAPI.checkAll(); await fetchData(); }
    catch { alert('Check gagal'); }
    finally { setCheckingAll(false); }
  }

  async function handleCheckAllISP() {
    setCheckingISP(true);
    try { await domainAPI.checkAllISP(); await fetchData(); }
    catch { alert('ISP check gagal'); }
    finally { setCheckingISP(false); }
  }

  const applyFilter = (list) => {
    let result = list;
    if (filter === 'active')   result = result.filter(d => d.is_active === 1 && d.is_blocked === 0);
    if (filter === 'blocked')  result = result.filter(d => d.is_blocked === 1);
    if (filter === 'inactive') result = result.filter(d => d.is_active === 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d => d.url.toLowerCase().includes(q) || (d.label || '').toLowerCase().includes(q));
    }
    return result;
  };

  const noGroup = domains.filter(d => !d.group_name || d.group_name === '');
  const groupEntries = [
    ...groups.map(g => ({ name: g, domains: domains.filter(d => d.group_name === g) })),
    ...(noGroup.length > 0 ? [{ name: '', domains: noGroup }] : []),
  ].map(e => ({ ...e, domains: applyFilter(e.domains) }))
   .filter(e => e.domains.length > 0);

  const totalFiltered = groupEntries.reduce((a, e) => a + e.domains.length, 0);

  /* ── Layout ── */
  const px    = isMobile ? 14 : 24;
  const padY  = isMobile ? 12 : 20;

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      <Sidebar
        activePage="dashboard"
        onDashboard={() => {}}
        onStats={onStats}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Main ── */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Page header */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          padding: `${padY}px ${px}px`,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg2)',
          gap: isMobile ? 10 : 12,
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          {/* Title row (with hamburger on mobile) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={S.hamburger}
                aria-label="Buka menu"
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>☰</span>
              </button>
            )}
            <div>
              <h1 style={S.pageTitle}>Domain Overview</h1>
              <p style={S.pageSub}>
                {lastUpdate
                  ? `${totalFiltered} domain · diperbarui ${lastUpdate.toLocaleTimeString('id-ID')}`
                  : 'Memuat...'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{
            display: 'flex', gap: 6, flexWrap: 'wrap',
            width: isMobile ? '100%' : 'auto',
          }}>
            <button
              style={{ ...S.btn2, opacity: checkingISP ? 0.5 : 1, flex: isMobile ? 1 : undefined }}
              onClick={handleCheckAllISP}
              disabled={checkingISP}
            >
              {checkingISP ? 'Checking...' : '🇮🇩 ISP'}
            </button>
            <button
              style={{ ...S.btn2, opacity: checkingAll ? 0.5 : 1, flex: isMobile ? 1 : undefined }}
              onClick={handleCheckAll}
              disabled={checkingAll}
            >
              {checkingAll ? '...' : '↻ Cek'}
            </button>
            <button
              style={{ ...S.btnPrimary, flex: isMobile ? 1 : undefined }}
              onClick={() => setShowModal(true)}
            >
              + Tambah
            </button>
          </div>
        </div>

        <div style={{ padding: `${padY}px ${px}px`, flex: 1 }}>
          {/* Stat cards — 2 col on mobile, auto-fill on desktop */}
          {stats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 8, marginBottom: 16,
            }}>
              <StatCard label="Total Domain"      value={stats.total}          icon="◈" color="var(--text)" />
              <StatCard label="Aktif"             value={stats.active}         icon="●" color="var(--green)" />
              <StatCard label="Nawala"            value={stats.blocked}        icon="✕" color="var(--red)" />
              <StatCard label="Nonaktif"          value={stats.inactive}       icon="⏸" color="var(--text-dim)" />
              <StatCard label="Redirect hari ini" value={stats.todayRedirects} icon="⇒" color="var(--accent)" />
              <StatCard label="Total redirect"    value={stats.totalRedirects} icon="∑" color="var(--text-dim)" />
            </div>
          )}

          {/* Filter + Search — tabs scroll horizontally on mobile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? 4 : 0 }}>
            <div style={{ display: 'flex', gap: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 3, flexShrink: 0 }}>
              {[['all', 'Semua'], ['active', 'Aktif'], ['blocked', 'Nawala'], ['inactive', 'Nonaktif']].map(([v, l]) => (
                <button
                  key={v}
                  style={{
                    background: filter === v ? 'var(--bg3)' : 'transparent',
                    border: 'none',
                    color: filter === v ? 'var(--text)' : 'var(--text-muted)',
                    padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                    borderRadius: 5, whiteSpace: 'nowrap',
                    boxShadow: filter === v ? '0 0 0 1px var(--border2)' : 'none',
                  }}
                  onClick={() => setFilter(v)}
                >
                  {l}
                </button>
              ))}
            </div>
            {/* Search — always visible but takes remaining space */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ position: 'absolute', left: 10, fontSize: 11, pointerEvents: 'none', opacity: 0.5 }}>🔍</span>
              <input
                style={{
                  border: '1px solid var(--border2)', borderRadius: 'var(--radius)',
                  padding: '6px 30px 6px 28px', fontSize: 12, outline: 'none',
                  color: 'var(--text)', background: 'var(--bg2)',
                  width: isMobile ? 160 : 220,
                }}
                placeholder="Cari URL atau label..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11 }}
                  onClick={() => setSearch('')}
                >✕</button>
              )}
            </div>
          </div>

          {/* Domain groups */}
          {loading ? (
            <div style={S.empty}>Memuat data...</div>
          ) : groupEntries.length === 0 ? (
            <div style={S.empty}>
              {search ? `Tidak ada domain yang cocok dengan "${search}"` : 'Tidak ada domain ditemukan.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {groupEntries.map(entry => {
                const gStats      = groupStats.find(g => g.group === entry.name);
                const priorityDom = entry.domains.find(d => d.is_priority === 1);
                const API_URL_VAL = import.meta.env.VITE_API_URL || '';
                return (
                  <div key={entry.name || '__nogroup__'} style={S.groupCard}>
                    {/* Group header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderBottom: '1px solid var(--border)',
                      background: 'var(--bg)', flexWrap: 'wrap', gap: 6,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={S.groupName}>{entry.name || 'Tanpa Group'}</span>
                        {entry.name && (
                          <a
                            href={`${API_URL_VAL}/${entry.name}`}
                            target="_blank"
                            rel="noreferrer"
                            style={S.groupLink}
                          >
                            /{entry.name} ↗
                          </a>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <span style={{ fontSize: 11, color: 'var(--green)' }}>✓ {gStats?.active ?? '—'}</span>
                        <span style={{ fontSize: 11, color: 'var(--red)' }}>✕ {gStats?.blocked ?? '—'}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>∑ {gStats?.total ?? entry.domains.length}</span>
                      </div>
                    </div>

                    {/* Priority bar */}
                    {priorityDom && (
                      <div style={S.priorityBar}>
                        <span style={{ fontSize: 11, color: 'var(--yellow)', fontWeight: 600 }}>★ Aktif sekarang</span>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--mono)', marginLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {priorityDom.url.replace('https://', '')}
                        </span>
                      </div>
                    )}

                    {/* Table — horizontal scroll on mobile */}
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table style={{ ...S.table, minWidth: 480 }}>
                        <thead>
                          <tr style={{ background: 'var(--bg)' }}>
                            <th style={S.th} width={28}></th>
                            <th style={S.th} width={24}></th>
                            <th style={S.th}>URL</th>
                            <th style={S.th} width={80}>Status</th>
                            <th style={S.th} width={50}>Cek</th>
                            <th style={S.th} width={160}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.domains.map(d => (
                            <DomainRow key={d.id} domain={d} onRefresh={fetchData} groups={groups} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={S.footer}>
            Auto-refresh 60 detik · Health check 10 menit · Laporan Telegram 4 jam
          </div>
        </div>
      </div>

      {/* Add modal */}
      <AddModal
        show={showModal}
        onClose={() => setShowModal(false)}
        groups={groups}
        onAdded={fetchData}
        isMobile={isMobile}
      />
    </div>
  );
}

const S = {
  pageTitle: { fontWeight: 600, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.3px' },
  pageSub:   { fontSize: 12, color: 'var(--text-dim)', marginTop: 3 },
  hamburger: {
    background: 'none', border: '1px solid var(--border2)',
    borderRadius: 7, color: 'var(--text-dim)', cursor: 'pointer',
    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  btnPrimary: {
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius)', padding: '8px 14px',
    fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  btn2: {
    background: 'var(--bg3)', border: '1px solid var(--border2)',
    color: 'var(--text-dim)', borderRadius: 'var(--radius)',
    padding: '7px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
  },

  groupCard:   { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)' },
  groupName:   { fontWeight: 600, fontSize: 12, color: 'var(--text)', textTransform: 'capitalize' },
  groupLink:   { fontSize: 10, color: 'var(--accent)', textDecoration: 'none', fontFamily: 'var(--mono)' },
  priorityBar: { display: 'flex', alignItems: 'center', padding: '5px 14px', background: 'var(--yellow-dim)', borderBottom: '1px solid rgba(245,158,11,0.1)', overflow: 'hidden' },
  table:       { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
  th:          { fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid var(--border)', userSelect: 'none', whiteSpace: 'nowrap' },
  empty:       { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '48px 24px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' },
  footer:      { marginTop: 20, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0', borderTop: '1px solid var(--border)' },
};

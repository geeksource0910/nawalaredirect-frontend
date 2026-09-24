import { useState, useEffect, useCallback } from 'react';
import { domainAPI } from '../api';
import StatCard from '../components/StatCard';
import DomainRow from '../components/DomainRow';
import AddDomainForm from '../components/AddDomainForm';
import Sidebar from '../components/Sidebar';

// ── Add Domain Modal ────────────────────────────────────────────────────────
function AddModal({ show, onClose, groups, onAdded }) {
  if (!show) return null;
  return (
    <div
      style={MS.overlay}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={MS.modal}>
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
  modal: {
    background: 'var(--bg2)', border: '1px solid var(--border2)',
    borderRadius: 12, width: '100%', maxWidth: 580,
    boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
    animation: 'fadeUp 0.18s ease',
    overflow: 'hidden',
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
  const [domains, setDomains]         = useState([]);
  const [stats, setStats]             = useState(null);
  const [groupStats, setGroupStats]   = useState([]);
  const [groups, setGroups]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [checkingAll, setCheckingAll] = useState(false);
  const [checkingISP, setCheckingISP] = useState(false);
  const [filter, setFilter]           = useState('all');
  const [search, setSearch]           = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [lastUpdate, setLastUpdate]   = useState(null);

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

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      <Sidebar
        activePage="dashboard"
        onDashboard={() => {}}
        onStats={onStats}
        onLogout={onLogout}
      />

      {/* ── Main ── */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Page header */}
        <div style={S.pageHeader}>
          <div>
            <h1 style={S.pageTitle}>Domain Overview</h1>
            <p style={S.pageSub}>
              {lastUpdate
                ? `${totalFiltered} domain · diperbarui ${lastUpdate.toLocaleTimeString('id-ID')}`
                : 'Memuat...'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              style={{ ...S.btn2, opacity: checkingISP ? 0.5 : 1 }}
              onClick={handleCheckAllISP}
              disabled={checkingISP}
            >
              {checkingISP ? 'Checking...' : '🇮🇩 Cek Semua ISP'}
            </button>
            <button
              style={{ ...S.btn2, opacity: checkingAll ? 0.5 : 1 }}
              onClick={handleCheckAll}
              disabled={checkingAll}
            >
              {checkingAll ? 'Checking...' : '↻ Cek Semua'}
            </button>
            <button style={S.btnPrimary} onClick={() => setShowModal(true)}>
              + Tambah Domain
            </button>
          </div>
        </div>

        <div style={S.content}>
          {/* Stat cards */}
          {stats && (
            <div style={S.statsRow}>
              <StatCard label="Total Domain"      value={stats.total}          icon="◈" color="var(--text)" />
              <StatCard label="Aktif"             value={stats.active}         icon="●" color="var(--green)" />
              <StatCard label="Nawala"            value={stats.blocked}        icon="✕" color="var(--red)" />
              <StatCard label="Nonaktif"          value={stats.inactive}       icon="⏸" color="var(--text-dim)" />
              <StatCard label="Redirect hari ini" value={stats.todayRedirects} icon="⇒" color="var(--accent)" />
              <StatCard label="Total redirect"    value={stats.totalRedirects} icon="∑" color="var(--text-dim)" />
            </div>
          )}

          {/* Filter + Search bar */}
          <div style={S.filterBar}>
            <div style={S.tabs}>
              {[['all', 'Semua'], ['active', 'Aktif'], ['blocked', 'Nawala'], ['inactive', 'Nonaktif']].map(([v, l]) => (
                <button
                  key={v}
                  style={{ ...S.tab, ...(filter === v ? S.tabActive : {}) }}
                  onClick={() => setFilter(v)}
                >
                  {l}
                </button>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            <div style={S.searchWrap}>
              <span style={S.searchIcon}>🔍</span>
              <input
                style={S.searchInput}
                placeholder="Cari URL atau label..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button style={S.clearBtn} onClick={() => setSearch('')}>✕</button>
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
                const gStats       = groupStats.find(g => g.group === entry.name);
                const priorityDom  = entry.domains.find(d => d.is_priority === 1);
                const API_URL      = import.meta.env.VITE_API_URL || '';
                return (
                  <div key={entry.name || '__nogroup__'} style={S.groupCard}>
                    {/* Group header */}
                    <div style={S.groupHead}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={S.groupName}>{entry.name || 'Tanpa Group'}</span>
                        {entry.name && (
                          <a
                            href={`${API_URL}/${entry.name}`}
                            target="_blank"
                            rel="noreferrer"
                            style={S.groupLink}
                          >
                            /{entry.name} ↗
                          </a>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ fontSize: 11, color: 'var(--green)' }}>✓ {gStats?.active ?? '—'} aktif</span>
                        <span style={{ fontSize: 11, color: 'var(--red)' }}>✕ {gStats?.blocked ?? '—'} nawala</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>∑ {gStats?.total ?? entry.domains.length}</span>
                      </div>
                    </div>

                    {/* Priority bar */}
                    {priorityDom && (
                      <div style={S.priorityBar}>
                        <span style={{ fontSize: 11, color: 'var(--yellow)', fontWeight: 600 }}>★ Aktif sekarang</span>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--mono)', marginLeft: 8 }}>
                          {priorityDom.url.replace('https://', '')}
                        </span>
                      </div>
                    )}

                    {/* Table */}
                    <table style={S.table}>
                      <thead>
                        <tr style={{ background: 'var(--bg)' }}>
                          <th style={S.th} width={28}></th>
                          <th style={S.th} width={24}></th>
                          <th style={S.th}>URL</th>
                          <th style={S.th} width={80}>Status</th>
                          <th style={S.th} width={50}>Cek</th>
                          <th style={S.th} width={180}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.domains.map(d => (
                          <DomainRow key={d.id} domain={d} onRefresh={fetchData} groups={groups} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}

          <div style={S.footer}>
            Auto-refresh setiap 60 detik · Health check setiap 10 menit · Laporan Telegram setiap 4 jam
          </div>
        </div>
      </div>

      {/* Add modal */}
      <AddModal
        show={showModal}
        onClose={() => setShowModal(false)}
        groups={groups}
        onAdded={fetchData}
      />
    </div>
  );
}

const S = {
  pageHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1px solid var(--border)',
    background: 'var(--bg2)', flexWrap: 'wrap', gap: 12,
    position: 'sticky', top: 0, zIndex: 10,
  },
  pageTitle: { fontWeight: 600, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.3px' },
  pageSub:   { fontSize: 12, color: 'var(--text-dim)', marginTop: 3 },
  btnPrimary: {
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius)', padding: '8px 16px',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
  },
  btn2: {
    background: 'var(--bg3)', border: '1px solid var(--border2)',
    color: 'var(--text-dim)', borderRadius: 'var(--radius)',
    padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
  },
  content:  { padding: '20px 24px', flex: 1 },
  statsRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 },

  filterBar:   { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' },
  tabs:        { display: 'flex', gap: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 3 },
  tab:         { background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 500, borderRadius: 5 },
  tabActive:   { background: 'var(--bg3)', color: 'var(--text)', boxShadow: '0 0 0 1px var(--border2)' },
  searchWrap:  { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon:  { position: 'absolute', left: 10, fontSize: 11, pointerEvents: 'none', opacity: 0.5 },
  searchInput: {
    border: '1px solid var(--border2)', borderRadius: 'var(--radius)',
    padding: '6px 30px 6px 28px', fontSize: 12, outline: 'none',
    color: 'var(--text)', background: 'var(--bg2)', width: 220,
  },
  clearBtn: { position: 'absolute', right: 8, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11 },

  groupCard:   { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)' },
  groupHead:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' },
  groupName:   { fontWeight: 600, fontSize: 12, color: 'var(--text)', textTransform: 'capitalize' },
  groupLink:   { fontSize: 10, color: 'var(--accent)', textDecoration: 'none', fontFamily: 'var(--mono)' },
  priorityBar: { display: 'flex', alignItems: 'center', padding: '5px 14px', background: 'var(--yellow-dim)', borderBottom: '1px solid rgba(245,158,11,0.1)' },
  table:       { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
  th:          { fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid var(--border)', userSelect: 'none' },
  empty:       { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '48px 24px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' },
  footer:      { marginTop: 20, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0', borderTop: '1px solid var(--border)' },
};

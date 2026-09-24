import { useState, useEffect, useCallback } from 'react';
import { domainAPI } from '../api';
import StatCard from '../components/StatCard';
import DomainRow from '../components/DomainRow';
import AddDomainForm from '../components/AddDomainForm';

// FIX: pakai import.meta.env langsung, tidak duplikat deklarasi dari api.js
const API_URL = import.meta.env.VITE_API_URL || '';

export default function Dashboard({ onLogout, onStats }) {
  const [domains, setDomains] = useState([]);
  const [stats, setStats] = useState(null);
  const [groupStats, setGroupStats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingAll, setCheckingAll] = useState(false);
  const [checkingAllISP, setCheckingAllISP] = useState(false);
  const [filter, setFilter] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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
    setCheckingAllISP(true);
    try { await domainAPI.checkAllISP(); await fetchData(); }
    catch { alert('ISP check gagal'); }
    finally { setCheckingAllISP(false); }
  }

  const applyFilter = (list) => list.filter(d => {
    if (filter === 'all') return true;
    if (filter === 'active') return d.is_active === 1 && d.is_blocked === 0;
    if (filter === 'blocked') return d.is_blocked === 1;
    if (filter === 'inactive') return d.is_active === 0;
    return true;
  });

  const noGroup = domains.filter(d => !d.group_name || d.group_name === '');
  const allGroupEntries = [
    ...groups.map(g => ({ name: g, domains: domains.filter(d => d.group_name === g) })),
    ...(noGroup.length > 0 ? [{ name: '', domains: noGroup }] : []),
  ].map(e => ({ ...e, domains: applyFilter(e.domains) }))
    .filter(e => e.domains.length > 0);

  return (
    <div style={S.page}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.logoMark}>⬡</div>
          <div>
            <div style={S.logoTitle}>NawalaRedirect</div>
            <div style={S.logoSub}>Domain Gateway Control Panel</div>
          </div>
        </div>
        <div style={S.headerRight}>
          <div style={S.clockBox}>
            <div style={S.clock}>{time.toLocaleTimeString('id-ID', { hour12: false })}</div>
            <div style={S.clockDate}>{time.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
          <div style={S.gatewayBox}>
            <div style={S.gatewayLabel}>Gateway URL</div>
            <a href={API_URL} target="_blank" rel="noreferrer" style={S.gatewayUrl}>{API_URL.replace('https://', '')}</a>
          </div>
          <button onClick={onStats} style={{ ...S.headerBtn, color: '#2563eb', borderColor: 'rgba(37,99,235,0.3)' }}>📊 Statistik</button>
          <button onClick={onLogout} style={S.headerBtn}>Keluar</button>
        </div>
      </header>

      <main style={S.main}>
        {/* Stats */}
        {stats && (
          <div style={S.statsRow}>
            <StatCard label="Total Domain" value={stats.total} icon="◈" />
            <StatCard label="Aktif" value={stats.active} icon="●" color="var(--green)" />
            <StatCard label="Nawala" value={stats.blocked} icon="✕" color="var(--red)" />
            <StatCard label="Nonaktif" value={stats.inactive} icon="⏸" color="var(--text-muted)" />
            <StatCard label="Redirect Hari Ini" value={stats.todayRedirects} icon="⇒" color="var(--blue)" />
            <StatCard label="Total Redirect" value={stats.totalRedirects} icon="∑" color="var(--text-dim)" />
          </div>
        )}

        {/* Add form */}
        <AddDomainForm onAdded={fetchData} groups={groups} />

        {/* List header */}
        <div style={S.listHeader}>
          <div style={S.listTitle}>
            Daftar Domain
            {lastUpdate && <span style={S.lastUpdate}> · diperbarui {lastUpdate.toLocaleTimeString('id-ID')}</span>}
          </div>
          <div style={S.controls}>
            <div style={S.tabs}>
              {[['all', 'Semua'], ['active', 'Aktif'], ['blocked', 'Nawala'], ['inactive', 'Nonaktif']].map(([v, l]) => (
                <button key={v} style={{ ...S.tab, ...(filter === v ? S.tabActive : {}) }} onClick={() => setFilter(v)}>{l}</button>
              ))}
            </div>
            <button style={{ ...S.actionBtn, color: '#2563eb', borderColor: 'rgba(37,99,235,0.3)', background: 'rgba(37,99,235,0.05)', opacity: checkingAllISP ? 0.6 : 1 }} onClick={handleCheckAllISP} disabled={checkingAllISP}>
              {checkingAllISP ? 'Checking...' : '🇮🇩 Cek ISP'}
            </button>
            <button style={{ ...S.actionBtn, opacity: checkingAll ? 0.6 : 1 }} onClick={handleCheckAll} disabled={checkingAll}>
              {checkingAll ? 'Checking...' : '↻ Cek Semua'}
            </button>
          </div>
        </div>

        {/* Group tables */}
        {loading ? (
          <div style={S.empty}>Memuat data...</div>
        ) : allGroupEntries.length === 0 ? (
          <div style={S.empty}>Tidak ada domain ditemukan.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {allGroupEntries.map(entry => {
              const gStats = groupStats.find(g => g.group === entry.name);
              const priorityDomain = entry.domains.find(d => d.is_priority === 1);
              return (
                <div key={entry.name || '__nogroup__'} style={S.groupCard}>
                  {/* Group header */}
                  <div style={S.groupHeader}>
                    <div style={S.groupLeft}>
                      <span style={S.groupName}>{entry.name || 'Tanpa Group'}</span>
                      {entry.name && (
                        <a href={`${API_URL}/${entry.name}`} target="_blank" rel="noreferrer" style={S.groupLink}>
                          /{entry.name} ↗
                        </a>
                      )}
                    </div>
                    <div style={S.groupStats}>
                      <span style={{ color: '#15803d', fontSize: 12 }}>✓ {gStats?.active ?? '-'}</span>
                      <span style={{ color: '#b91c1c', fontSize: 12 }}>✕ {gStats?.blocked ?? '-'}</span>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>∑ {gStats?.total ?? entry.domains.length}</span>
                    </div>
                  </div>

                  {/* Prioritas bar */}
                  {priorityDomain && (
                    <div style={S.priorityBar}>
                      <span style={S.priorityLabel}>★ Aktif:</span>
                      <span style={S.priorityUrl}>{priorityDomain.url.replace('https://', '')}</span>
                    </div>
                  )}

                  {/* Table */}
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={{ ...S.th, width: 28 }}></th>
                        <th style={{ ...S.th, width: 28 }}></th>
                        <th style={S.th}>URL</th>
                        <th style={{ ...S.th, width: 80 }}>Status</th>
                        <th style={{ ...S.th, width: 56 }}>Cek</th>
                        <th style={{ ...S.th, width: 170 }}>Aksi</th>
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
      </main>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 12 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  logoMark: { width: 36, height: 36, background: 'var(--accent)', color: 'white', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 },
  logoTitle: { fontWeight: 600, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.3px' },
  logoSub: { fontSize: 11, color: 'var(--text-muted)', marginTop: 1 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  clockBox: { textAlign: 'right' },
  clock: { fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: 'var(--text)', letterSpacing: 2 },
  clockDate: { fontSize: 11, color: 'var(--text-muted)', marginTop: 1 },
  gatewayBox: { borderLeft: '1px solid var(--border)', paddingLeft: 16 },
  gatewayLabel: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 },
  gatewayUrl: { fontSize: 12, color: 'var(--blue)', textDecoration: 'none', fontFamily: 'var(--mono)' },
  headerBtn: { background: 'transparent', border: '1px solid var(--border2)', color: 'var(--text-dim)', padding: '7px 14px', cursor: 'pointer', fontSize: 13, borderRadius: 'var(--radius)', fontWeight: 500 },
  main: { flex: 1, padding: '20px 24px', maxWidth: 1200, width: '100%', margin: '0 auto' },
  statsRow: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 },
  listHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, margin: '16px 0 12px' },
  listTitle: { fontWeight: 600, fontSize: 14, color: 'var(--text)' },
  lastUpdate: { color: 'var(--text-muted)', fontSize: 12, fontWeight: 400 },
  controls: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  tabs: { display: 'flex', gap: 2, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 3 },
  tab: { background: 'transparent', border: 'none', color: 'var(--text-dim)', padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 500, borderRadius: 6 },
  tabActive: { background: 'var(--bg2)', color: 'var(--text)', boxShadow: 'var(--shadow)' },
  actionBtn: { background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text-dim)', padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 500, borderRadius: 'var(--radius)' },

  groupCard: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)' },
  groupHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' },
  groupLeft: { display: 'flex', flexDirection: 'column', gap: 2 },
  groupName: { fontWeight: 600, fontSize: 13, color: 'var(--text)', textTransform: 'capitalize' },
  groupLink: { fontSize: 11, color: 'var(--blue)', textDecoration: 'none', fontFamily: 'var(--mono)' },
  groupStats: { display: 'flex', gap: 10, fontWeight: 500 },
  priorityBar: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', background: 'rgba(245,158,11,0.05)', borderBottom: '1px solid rgba(245,158,11,0.15)' },
  priorityLabel: { fontSize: 11, color: '#b45309', fontWeight: 600 },
  priorityUrl: { fontSize: 11, color: '#78350f', fontFamily: 'var(--mono)' },

  table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
  th: { fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textAlign: 'left', padding: '7px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', userSelect: 'none' },

  empty: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '48px 24px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' },
  footer: { marginTop: 20, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' },
};

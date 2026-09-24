import { useState } from 'react';
import { domainAPI } from '../api';
import api from '../api';

export default function DomainRow({ domain, onRefresh, groups = [] }) {
  const [checking, setChecking] = useState(false);
  const [checkingISP, setCheckingISP] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [settingPriority, setSettingPriority] = useState(false);
  const [editingGroup, setEditingGroup] = useState(false);
  const [groupInput, setGroupInput] = useState(domain.group_name || '');
  const [ispResult, setIspResult] = useState(null);

  const isBlocked = domain.is_blocked === 1;
  const isInactive = domain.is_active === 0;
  const isPriority = domain.is_priority === 1;
  const dotColor = isBlocked ? '#dc2626' : isInactive ? '#9ca3af' : '#16a34a';

  async function handleCheck() {
    setChecking(true);
    try { await domainAPI.checkOne(domain.id); await onRefresh(); }
    catch (e) { alert('Check gagal: ' + (e.response?.data?.error || e.message)); }
    finally { setChecking(false); }
  }

  async function handleCheckISP() {
    setCheckingISP(true);
    setIspResult(null);
    try {
      const res = await api.post(`/api/domains/${domain.id}/check-isp`);
      setIspResult(res.data);
      await onRefresh();
    } catch (e) { alert('Cek gagal: ' + (e.response?.data?.error || e.message)); }
    finally { setCheckingISP(false); }
  }

  async function handleToggle() {
    setToggling(true);
    try { await domainAPI.update(domain.id, { is_active: domain.is_active === 1 ? 0 : 1 }); await onRefresh(); }
    catch { alert('Update gagal'); }
    finally { setToggling(false); }
  }

  async function handleDelete() {
    if (!confirm(`Hapus domain:\n${domain.url}?`)) return;
    setDeleting(true);
    try { await domainAPI.delete(domain.id); await onRefresh(); }
    catch { alert('Hapus gagal'); }
    finally { setDeleting(false); }
  }

  async function handleSetPriority() {
    if (isPriority) return;
    setSettingPriority(true);
    try { await api.post(`/api/domains/${domain.id}/set-priority`); await onRefresh(); }
    catch { alert('Gagal set prioritas'); }
    finally { setSettingPriority(false); }
  }

  async function handleSaveGroup() {
    try {
      await domainAPI.setGroup(domain.id, groupInput);
      setEditingGroup(false);
      await onRefresh();
    } catch { alert('Gagal simpan group'); }
  }

  const statusLabel = isBlocked ? 'Nawala' : isInactive ? 'Nonaktif' : 'Aktif';
  const statusStyle = isBlocked
    ? { background: '#fee2e2', color: '#b91c1c' }
    : isInactive
      ? { background: '#f3f4f6', color: '#6b7280' }
      : { background: '#dcfce7', color: '#15803d' };

  return (
    <>
      <tr style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        {/* Dot status */}
        <td style={S.td}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, display: 'inline-block' }} />
        </td>
        {/* Bintang prioritas */}
        <td style={S.td}>
          <button onClick={handleSetPriority} disabled={settingPriority || isPriority}
            title={isPriority ? 'Domain prioritas' : 'Jadikan prioritas'}
            style={{
              background: 'transparent', border: 'none', cursor: isPriority ? 'default' : 'pointer',
              fontSize: 14, color: isPriority ? '#f59e0b' : 'var(--color-border-secondary)', padding: 0, lineHeight: 1
            }}>
            {isPriority ? '★' : '☆'}
          </button>
        </td>
        {/* URL */}
        <td style={{ ...S.td, maxWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-primary)' }}>
              {domain.url}
            </span>
            {isPriority && <span style={{ ...S.badge, background: '#fef3c7', color: '#b45309', flexShrink: 0 }}>Prioritas</span>}
          </div>
          {/* ISP result inline */}
          {ispResult && (
            <div style={{ fontSize: 10, marginTop: 3, color: ispResult.isBlocked ? '#b91c1c' : '#15803d', fontWeight: 500 }}>
              {ispResult.isBlocked ? '🚫 Nawala/Kominfo' : '✅ Aman (via TrustPositif)'}
            </div>
          )}
          {/* Edit group inline */}
          {editingGroup && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <input style={S.editInput} list="group-list" value={groupInput}
                onChange={e => setGroupInput(e.target.value)}
                placeholder="nama group" autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSaveGroup()} />
              <datalist id="group-list">{groups.map(g => <option key={g} value={g} />)}</datalist>
              <button style={S.saveBtn} onClick={handleSaveGroup}>OK</button>
              <button style={S.cancelBtn} onClick={() => setEditingGroup(false)}>Batal</button>
            </div>
          )}
        </td>
        {/* Status */}
        <td style={S.td}>
          <span style={{ ...S.badge, ...statusStyle }}>{statusLabel}</span>
        </td>
        {/* Waktu cek */}
        <td style={{ ...S.td, fontSize: 11, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
          {domain.last_checked ? new Date(domain.last_checked).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
        </td>
        {/* Aksi */}
        <td style={S.td}>
          <div style={{ display: 'flex', gap: 3 }}>
            <button style={S.btn} onClick={() => setEditingGroup(!editingGroup)} title="Set group">Grp</button>
            <button style={{ ...S.btn, color: checkingISP ? 'var(--color-text-secondary)' : '#2563eb' }}
              onClick={handleCheckISP} disabled={checkingISP} title="Cek Nawala">
              {checkingISP ? '...' : '🇮🇩'}
            </button>
            <button style={S.btn} onClick={handleCheck} disabled={checking} title="Basic check">
              {checking ? '…' : '↻'}
            </button>
            <button style={S.btn} onClick={handleToggle} disabled={toggling}>
              {domain.is_active === 1 ? '⏸' : '▶'}
            </button>
            <button style={{ ...S.btn, color: '#b91c1c' }} onClick={handleDelete} disabled={deleting}>
              {deleting ? '…' : '✕'}
            </button>
          </div>
        </td>
      </tr>
    </>
  );
}

const S = {
  td: { padding: '8px 12px', verticalAlign: 'middle' },
  badge: { fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap' },
  btn: { background: 'transparent', border: '0.5px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '3px 7px', fontSize: 11, borderRadius: 5 },
  editInput: { border: '0.5px solid var(--color-border-secondary)', borderRadius: 5, padding: '3px 8px', fontSize: 11, outline: 'none', color: 'var(--color-text-primary)', width: 140, background: 'var(--color-background-primary)' },
  saveBtn: { background: 'var(--color-background-info)', color: 'var(--color-text-info)', border: 'none', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 500 },
  cancelBtn: { background: 'transparent', border: '0.5px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 11 },
};

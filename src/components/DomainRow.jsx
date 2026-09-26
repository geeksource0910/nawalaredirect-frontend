import { useState } from 'react';
import { domainAPI } from '../api';
import api from '../api';
import { useIsMobile } from '../hooks/useIsMobile';

export default function DomainRow({ domain, onRefresh, groups = [] }) {
  const [checking, setChecking]           = useState(false);
  const [checkingISP, setCheckingISP]     = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [toggling, setToggling]           = useState(false);
  const [settingPriority, setSP]          = useState(false);
  const [editingGroup, setEditingGroup]   = useState(false);
  const [groupInput, setGroupInput]       = useState(domain.group_name || '');
  const [ispResult, setIspResult]         = useState(null);
  const [hovered, setHovered]             = useState(false);
  const isMobile                          = useIsMobile();

  const isBlocked  = domain.is_blocked === 1;
  const isInactive = domain.is_active  === 0;
  const isPriority = domain.is_priority === 1;

  const dotColor   = isBlocked ? 'var(--red)' : isInactive ? 'var(--text-muted)' : 'var(--green)';
  const dotGlow    = 'none'; // no glow on light mode
  const badgeStyle = isBlocked
    ? { background: 'var(--red-dim)',   color: 'var(--red)',      border: '1px solid rgba(239,68,68,0.2)' }
    : isInactive
      ? { background: 'var(--bg3)',     color: 'var(--text-dim)', border: '1px solid var(--border2)' }
      : { background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.2)' };
  const badgeLabel = isBlocked ? 'Nawala' : isInactive ? 'Nonaktif' : 'Aktif';

  async function handleCheck() {
    setChecking(true);
    try { await domainAPI.checkOne(domain.id); await onRefresh(); }
    catch (e) { alert('Check gagal: ' + (e.response?.data?.error || e.message)); }
    finally { setChecking(false); }
  }

  async function handleCheckISP() {
    setCheckingISP(true); setIspResult(null);
    try {
      const res = await api.post(`/api/domains/${domain.id}/check-isp`);
      setIspResult(res.data); await onRefresh();
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
    setSP(true);
    try { await api.post(`/api/domains/${domain.id}/set-priority`); await onRefresh(); }
    catch { alert('Gagal set prioritas'); }
    finally { setSP(false); }
  }

  async function handleSaveGroup() {
    try { await domainAPI.setGroup(domain.id, groupInput); setEditingGroup(false); await onRefresh(); }
    catch { alert('Gagal simpan group'); }
  }

  return (
    <>
      <tr
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderBottom: '1px solid var(--border)',
          background: hovered ? 'var(--bg3)' : 'transparent',
          transition: 'background 0.1s',
        }}
      >
        {/* Status dot */}
        <td style={S.td} width={28}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, display: 'inline-block', boxShadow: dotGlow }} />
        </td>

        {/* Priority star */}
        <td style={S.td} width={24}>
          <button
            onClick={handleSetPriority}
            disabled={settingPriority || isPriority}
            title={isPriority ? 'Domain prioritas' : 'Jadikan prioritas'}
            style={{ background: 'none', border: 'none', cursor: isPriority ? 'default' : 'pointer', fontSize: 13, padding: 0, color: isPriority ? 'var(--yellow)' : 'var(--text-muted)', lineHeight: 1 }}
          >
            {isPriority ? '★' : '☆'}
          </button>
        </td>

        {/* URL + sub info */}
        <td style={{ ...S.td, maxWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
              {domain.url.replace('https://', '')}
            </span>
            {isPriority && (
              <span style={{ ...S.chip, background: 'var(--yellow-dim)', color: 'var(--yellow)', border: '1px solid rgba(245,158,11,0.2)', flexShrink: 0 }}>
                Prioritas
              </span>
            )}
          </div>
          {/* ISP result inline */}
          {ispResult && (
            <div style={{ fontSize: 10, marginTop: 2, fontWeight: 500, color: ispResult.isBlocked ? 'var(--red)' : 'var(--green)' }}>
              {ispResult.isBlocked ? '🚫 Nawala' : '✅ Aman (TrustPositif)'}
            </div>
          )}
          {/* Edit group */}
          {editingGroup && (
            <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
              <input
                style={S.editInput}
                list="grp-list"
                value={groupInput}
                onChange={e => setGroupInput(e.target.value)}
                placeholder="nama group"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSaveGroup()}
              />
              <datalist id="grp-list">{groups.map(g => <option key={g} value={g} />)}</datalist>
              <button style={S.saveBtn} onClick={handleSaveGroup}>OK</button>
              <button style={S.cancelBtn} onClick={() => setEditingGroup(false)}>✕</button>
            </div>
          )}
        </td>

        {/* Status badge */}
        <td style={S.td} width={80}>
          <span style={{ ...S.chip, ...badgeStyle }}>{badgeLabel}</span>
        </td>

        {/* Last check */}
        <td style={{ ...S.td, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }} width={50}>
          {domain.last_checked
            ? new Date(domain.last_checked).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            : '—'}
        </td>

        {/* Actions — fade in on hover */}
        <td style={{ ...S.td, textAlign: 'right' }} width={180}>
          <div style={{
            display: 'flex', gap: 3, justifyContent: 'flex-end',
            opacity: (isMobile || hovered) ? 1 : 0,
            transition: 'opacity 0.15s',
            pointerEvents: (isMobile || hovered) ? 'auto' : 'none',
          }}>
            <ActionBtn label="Grp"  onClick={() => setEditingGroup(!editingGroup)} />
            <ActionBtn
              label={checkingISP ? '...' : '🇮🇩'}
              onClick={handleCheckISP}
              disabled={checkingISP}
              color="var(--accent)"
              title="Cek Nawala"
            />
            <ActionBtn label={checking ? '…' : '↻'}  onClick={handleCheck}  disabled={checking} title="Basic check" />
            <ActionBtn label={toggling ? '…' : (domain.is_active === 1 ? '⏸' : '▶')} onClick={handleToggle} disabled={toggling} />
            <ActionBtn label={deleting ? '…' : '✕'}  onClick={handleDelete} disabled={deleting} color="var(--red)" />
          </div>
        </td>
      </tr>
    </>
  );
}

function ActionBtn({ label, onClick, disabled, color, title }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'var(--bg2)' : 'transparent',
        border: '1px solid var(--border2)',
        color: color || (hov ? 'var(--text)' : 'var(--text-dim)'),
        cursor: 'pointer', padding: '3px 7px',
        fontSize: 11, borderRadius: 5,
        transition: 'all 0.1s',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  );
}

const S = {
  td: { padding: '8px 10px', verticalAlign: 'middle' },
  chip: { fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap' },
  editInput: {
    border: '1px solid var(--border2)', borderRadius: 5,
    padding: '3px 8px', fontSize: 11, outline: 'none',
    color: 'var(--text)', width: 130, background: 'var(--bg3)',
  },
  saveBtn: {
    background: 'var(--accent-dim)', color: 'var(--accent)',
    border: 'none', borderRadius: 5, padding: '3px 8px',
    cursor: 'pointer', fontSize: 11, fontWeight: 500,
  },
  cancelBtn: {
    background: 'transparent', border: '1px solid var(--border2)',
    color: 'var(--text-muted)', borderRadius: 5,
    padding: '3px 6px', cursor: 'pointer', fontSize: 11,
  },
};

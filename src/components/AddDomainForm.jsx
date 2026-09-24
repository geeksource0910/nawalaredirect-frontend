import { useState } from 'react';
import { domainAPI } from '../api';

export default function AddDomainForm({ onAdded, groups = [] }) {
  const [url, setUrl]           = useState('');
  const [label, setLabel]       = useState('');
  const [group, setGroup]       = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [useNew, setUseNew]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState('');

  const finalGroup = useNew ? newGroup : group;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim()) { setErr('URL wajib diisi'); return; }
    setErr(''); setLoading(true);
    try {
      await domainAPI.add(url.trim(), label.trim(), finalGroup.trim());
      setUrl(''); setLabel('');
      await onAdded();
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Gagal tambah domain');
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} style={S.form}>
      <div style={S.row}>
        <div style={S.fieldWide}>
          <label style={S.label}>URL Domain</label>
          <div style={S.inputGroup}>
            <span style={S.prefix}>https://</span>
            <input
              style={S.inputInner}
              placeholder="domain-kamu.com"
              value={url.replace(/^https?:\/\//, '')}
              onChange={e => setUrl('https://' + e.target.value)}
            />
          </div>
        </div>
        <div style={S.fieldMid}>
          <label style={S.label}>Label <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opsional)</span></label>
          <input style={S.input} placeholder="nama toko" value={label} onChange={e => setLabel(e.target.value)} />
        </div>
        <div style={S.fieldMid}>
          <label style={S.label}>
            Group
            <button type="button" style={S.toggleBtn} onClick={() => setUseNew(!useNew)}>
              {useNew ? '← Existing' : '+ Baru'}
            </button>
          </label>
          {useNew
            ? <input style={S.input} placeholder="nama group baru" value={newGroup} onChange={e => setNewGroup(e.target.value)} />
            : (
              <select style={S.select} value={group} onChange={e => setGroup(e.target.value)}>
                <option value="">— Tanpa group —</option>
                {groups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            )
          }
        </div>
        <div style={S.fieldBtn}>
          <label style={{ ...S.label, opacity: 0 }}>x</label>
          <button style={{ ...S.btn, opacity: loading ? 0.6 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Menambahkan...' : '+ Tambah'}
          </button>
        </div>
      </div>
      {err && <div style={S.err}>⚠ {err}</div>}
    </form>
  );
}

const S = {
  form: {},
  row: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', padding: '18px 20px' },
  fieldWide: { flex: 2, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 5 },
  fieldMid:  { flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 5 },
  fieldBtn:  { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 11, fontWeight: 500, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 },
  toggleBtn: { fontSize: 10, background: 'transparent', border: '1px solid var(--border2)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 4, cursor: 'pointer' },
  inputGroup: { display: 'flex', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg3)' },
  prefix:     { padding: '9px 10px', background: 'var(--bg)', borderRight: '1px solid var(--border2)', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' },
  inputInner: { flex: 1, border: 'none', padding: '9px 12px', fontSize: 13, outline: 'none', color: 'var(--text)', background: 'var(--bg3)' },
  input:  { border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '9px 12px', fontSize: 13, outline: 'none', color: 'var(--text)', background: 'var(--bg3)', width: '100%' },
  select: { border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '9px 12px', fontSize: 13, outline: 'none', color: 'var(--text)', background: 'var(--bg3)', width: '100%' },
  btn: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' },
  err: { margin: '0 20px 16px', fontSize: 12, color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius)', padding: '8px 12px' },
};

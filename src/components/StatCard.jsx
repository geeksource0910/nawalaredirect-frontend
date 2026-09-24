export default function StatCard({ label, value, color = 'var(--text)', icon }) {
  return (
    <div style={S.card}>
      <div style={S.top}>
        <span style={{ ...S.icon, color }}>{icon}</span>
        <span style={S.label}>{label}</span>
      </div>
      <div style={{ ...S.value, color }}>{value ?? '—'}</div>
    </div>
  );
}

const S = {
  card: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '14px 16px',
    flex: 1, minWidth: 100,
  },
  top: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 },
  icon: { fontSize: 12 },
  label: { fontSize: 11, color: 'var(--text-dim)', fontWeight: 500 },
  value: { fontSize: 28, fontWeight: 600, fontFamily: 'var(--mono)', letterSpacing: '-1px', lineHeight: 1 },
};

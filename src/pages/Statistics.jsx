import { useState, useEffect } from 'react';
import { statsAPI } from '../api';
import Sidebar from '../components/Sidebar';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const RADIAN = Math.PI / 180;

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return percent > 0.06 ? (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
}

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e8e8e4', borderRadius: 6, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      {label && <div style={{ color: '#71717a', marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#0f0f0f', fontWeight: 500 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

export default function Statistics({ onBack, onLogout }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    statsAPI.getDetailed()
      .then(res => setData(res.data))
      .catch(err => { console.error(err); setError('Gagal memuat statistik. Coba refresh halaman.'); })
      .finally(() => setLoading(false));
  }, []);

  const pieData = (data?.redirectPerGroup || []).map((r, i) => ({
    name: r.group_name || 'Tanpa Group',
    value: parseInt(r.count) || 0, // FIX: PostgreSQL COUNT returns string
    color: COLORS[i % COLORS.length],
  }));

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    // FIX: PostgreSQL DATE bisa return sebagai ISO datetime atau Date object
    const found = (data?.redirectPerDay || []).find(r => {
      const rDate = String(r.date).split('T')[0];
      return rDate === dateStr;
    });
    return {
      date: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
      total: parseInt(found?.count) || 0,
      dateStr,
    };
  });

  const groups = [...new Set((data?.redirectGroupPerDay || []).map(r => r.group_name || 'Tanpa Group'))];
  const groupedBarData = last7Days.map(day => {
    const obj = { date: day.date };
    groups.forEach(g => {
      // FIX: normalize date yang sama
      const found = (data?.redirectGroupPerDay || []).find(r => {
        const rDate = String(r.date).split('T')[0];
        return rDate === day.dateStr && (r.group_name || 'Tanpa Group') === g;
      });
      obj[g] = parseInt(found?.count) || 0;
    });
    return obj;
  });

  const total = pieData.reduce((a, b) => a + b.value, 0); // sekarang beneran sum angka

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      <Sidebar
        activePage="statistics"
        onDashboard={onBack}
        onStats={() => {}}
        onLogout={onLogout}
      />

      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={S.pageHeader}>
          <div>
            <h1 style={S.pageTitle}>Statistik Redirect</h1>
            <p style={S.pageSub}>Data redirect per group & domain</p>
          </div>
          <div style={{ ...S.badge, fontVariantNumeric: 'tabular-nums' }}>
            Total <strong style={{ color: 'var(--text)' }}>{total}</strong> redirect
          </div>
        </div>

        <div style={S.content}>
          {loading ? (
            <div style={S.center}>Memuat statistik...</div>
          ) : error ? (
            <div style={{ ...S.center, color: 'var(--red)' }}>{error}</div>
          ) : total === 0 ? (
            <div style={S.center}>Belum ada data redirect.</div>
          ) : (
            <>
              <div style={S.row2}>
                <div style={S.card}>
                  <div style={S.cardTitle}>Redirect per Group</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" labelLine={false} label={<CustomLabel />}>
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<DarkTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, color: '#52525b' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Top Domain</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(data?.topDomains || []).map((d, i) => {
                      const pct = Math.round((d.count / (data.topDomains[0]?.count || 1)) * 100);
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', flexShrink: 0 }}>{i + 1}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                              {d.redirected_to.replace('https://', '')}
                            </div>
                            <div style={{ height: 3, background: 'var(--border2)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: COLORS[i % COLORS.length], transition: 'width .3s' }} />
                            </div>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--mono)', flexShrink: 0 }}>{d.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={S.card}>
                <div style={S.cardTitle}>Redirect 7 Hari Terakhir</div>
                <ResponsiveContainer width="100%" height={230}>
                  {groups.length > 1 ? (
                    <BarChart data={groupedBarData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e4" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#71717a' }} allowDecimals={false} />
                      <Tooltip content={<DarkTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, color: '#52525b' }} />
                      {groups.map((g, i) => (
                        <Bar key={g} dataKey={g} stackId="a" fill={COLORS[i % COLORS.length]}
                          radius={i === groups.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                      ))}
                    </BarChart>
                  ) : (
                    <BarChart data={last7Days} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e4" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#71717a' }} allowDecimals={false} />
                      <Tooltip content={<DarkTooltip />} />
                      <Bar dataKey="total" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Redirect" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>
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
  badge:     { fontSize: 12, color: 'var(--text-dim)', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: 'var(--radius)' },
  content:   { padding: '20px 24px' },
  row2:      { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 },
  card:      { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px', flex: 1, minWidth: 280, marginBottom: 12 },
  cardTitle: { fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 14 },
  center:    { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-dim)', fontSize: 13 },
};

import { useState, useEffect } from 'react';
import { statsAPI } from '../api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

const RADIAN = Math.PI / 180;
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return percent > 0.05 ? (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
}

export default function Statistics({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // FIX: tambah error state

  useEffect(() => {
    statsAPI.getDetailed()
      .then(res => setData(res.data))
      .catch(err => {
        console.error(err);
        // FIX: tampilkan error ke user, bukan cuma console.error
        setError('Gagal memuat statistik. Coba refresh halaman.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={S.page}>
      <div style={S.loading}>Memuat statistik...</div>
    </div>
  );

  // FIX: tampilkan pesan error kalau fetch gagal
  if (error) return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.headerLeft}>
          <button style={S.backBtn} onClick={onBack}>← Kembali</button>
        </div>
      </header>
      <div style={{ ...S.loading, color: '#b91c1c' }}>{error}</div>
    </div>
  );

  // Prepare pie data
  const pieData = (data?.redirectPerGroup || []).map((r, i) => ({
    name: r.group_name || 'Tanpa Group',
    value: r.count,
    color: COLORS[i % COLORS.length],
  }));

  // Prepare bar data (7 hari)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const found = (data?.redirectPerDay || []).find(r => r.date === dateStr);
    last7Days.push({
      date: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
      total: found?.count || 0,
    });
  }

  // Prepare grouped bar data
  const groups = [...new Set((data?.redirectGroupPerDay || []).map(r => r.group_name || 'Tanpa Group'))];
  const groupedBarData = last7Days.map((day, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const obj = { date: day.date };
    groups.forEach(g => {
      const found = (data?.redirectGroupPerDay || []).find(r => r.date === dateStr && (r.group_name || 'Tanpa Group') === g);
      obj[g] = found?.count || 0;
    });
    return obj;
  });

  const totalRedirects = pieData.reduce((a, b) => a + b.value, 0);

  return (
    <div style={S.page}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <button style={S.backBtn} onClick={onBack}>← Kembali</button>
          <div>
            <div style={S.title}>Statistik Redirect</div>
            <div style={S.sub}>Data redirect per group & domain</div>
          </div>
        </div>
        <div style={S.totalBadge}>
          Total: <strong>{totalRedirects}</strong> redirect
        </div>
      </header>

      <div style={S.divider} />

      <main style={S.main}>
        {totalRedirects === 0 ? (
          <div style={S.empty}>Belum ada data redirect. Mulai bagikan link domain master kamu!</div>
        ) : (
          <>
            <div style={S.row2col}>
              {/* Pie Chart */}
              <div style={S.card}>
                <div style={S.cardTitle}>Redirect per Group</div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={110}
                      dataKey="value" labelLine={false} label={<CustomLabel />}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val, name) => [`${val} redirect`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Domains */}
              <div style={S.card}>
                <div style={S.cardTitle}>Top Domain</div>
                <div style={S.topList}>
                  {(data?.topDomains || []).length === 0 ? (
                    <div style={S.emptySmall}>Belum ada data</div>
                  ) : (data?.topDomains || []).map((d, i) => {
                    const maxCount = data.topDomains[0]?.count || 1;
                    const pct = Math.round((d.count / maxCount) * 100);
                    return (
                      <div key={i} style={S.topItem}>
                        <div style={S.topRank}>{i + 1}</div>
                        <div style={S.topInfo}>
                          <div style={S.topUrl}>{d.redirected_to.replace('https://', '')}</div>
                          <div style={S.topBar}>
                            <div style={{...S.topBarFill, width: `${pct}%`, background: COLORS[i % COLORS.length]}} />
                          </div>
                        </div>
                        <div style={S.topCount}>{d.count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bar Chart - 7 hari */}
            <div style={S.card}>
              <div style={S.cardTitle}>Redirect 7 Hari Terakhir</div>
              <ResponsiveContainer width="100%" height={250}>
                {groups.length > 1 ? (
                  <BarChart data={groupedBarData} margin={{top:5, right:20, bottom:5, left:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{fontSize:11}} />
                    <YAxis tick={{fontSize:11}} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {groups.map((g, i) => (
                      <Bar key={g} dataKey={g} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === groups.length - 1 ? [4,4,0,0] : [0,0,0,0]} />
                    ))}
                  </BarChart>
                ) : (
                  <BarChart data={last7Days} margin={{top:5, right:20, bottom:5, left:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{fontSize:11}} />
                    <YAxis tick={{fontSize:11}} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#6366f1" radius={[4,4,0,0]} name="Redirect" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const S = {
  page: { minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', background:'var(--bg2)', borderBottom:'1px solid var(--border)', flexWrap:'wrap', gap:12 },
  headerLeft: { display:'flex', alignItems:'center', gap:16 },
  backBtn: { background:'transparent', border:'1px solid var(--border2)', color:'var(--text-dim)', padding:'7px 14px', cursor:'pointer', fontSize:13, borderRadius:'var(--radius)', fontWeight:500 },
  title: { fontWeight:600, fontSize:16, color:'var(--text)' },
  sub: { fontSize:11, color:'var(--text-muted)', marginTop:1 },
  totalBadge: { fontSize:13, color:'var(--text-dim)', background:'var(--bg)', border:'1px solid var(--border)', padding:'6px 14px', borderRadius:'var(--radius)' },
  divider: { height:1, background:'var(--border)' },
  main: { flex:1, padding:'20px 24px', maxWidth:1100, width:'100%', margin:'0 auto' },
  row2col: { display:'flex', gap:16, flexWrap:'wrap', marginBottom:16 },
  card: { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'18px 20px', boxShadow:'var(--shadow)', flex:1, minWidth:280 },
  cardTitle: { fontWeight:600, fontSize:14, color:'var(--text)', marginBottom:16 },
  topList: { display:'flex', flexDirection:'column', gap:10 },
  topItem: { display:'flex', alignItems:'center', gap:10 },
  topRank: { width:22, height:22, borderRadius:'50%', background:'var(--bg)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'var(--text-dim)', flexShrink:0 },
  topInfo: { flex:1, minWidth:0 },
  topUrl: { fontSize:12, color:'var(--text)', fontFamily:'var(--mono)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 },
  topBar: { height:4, background:'var(--bg)', borderRadius:2, overflow:'hidden' },
  topBarFill: { height:'100%', borderRadius:2, transition:'width .3s' },
  topCount: { fontSize:13, fontWeight:600, color:'var(--text)', flexShrink:0 },
  loading: { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text-muted)', fontSize:14 },
  empty: { textAlign:'center', color:'var(--text-muted)', fontSize:14, padding:'60px 24px' },
  emptySmall: { color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'20px 0' },
};

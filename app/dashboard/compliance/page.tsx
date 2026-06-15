'use client';
import { useEffect, useState } from 'react';
import { useApi } from '../../context/api-context';

export default function CompliancePage() {
  const { get } = useApi();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    get('/compliance').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px' };
  const lbl = { fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 };

  return (
    <div style={{ padding: 40, maxWidth: 880 }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ ...lbl, marginBottom: 6 }}>Compliance</p>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>Monthly Review</h1>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{currentMonth}</p>
      </div>
      {loading ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading…</p>
      ) : !data ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--amber)' }}>Failed to load compliance data.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Hours', val: Number(data.total_hours).toFixed(1), pass: null },
              { label: 'Supervised', val: Number(data.supervision_pct).toFixed(1) + '%', pass: data.meets_supervision },
              { label: 'Restricted %', val: Number(data.restricted_pct).toFixed(1) + '%', pass: data.meets_restricted },
            ].map(s => (
              <div key={s.label} style={card}>
                <p style={lbl}>{s.label}</p>
                <p style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 600, margin: 0, lineHeight: 1, color: s.pass === null ? 'var(--ink)' : s.pass ? 'var(--spruce)' : 'var(--amber)' }}>{s.val}</p>
              </div>
            ))}
          </div>
          <div style={{ ...card, marginBottom: 24 }}>
            <p style={{ ...lbl, marginBottom: 20 }}>BACB Requirements</p>
            {[
              { label: 'Supervision >= 5% of hours', pass: data.meets_supervision, val: Number(data.supervision_pct).toFixed(1) + '%' },
              { label: 'Restricted hours <= 50% of total', pass: data.meets_restricted, val: Number(data.restricted_pct).toFixed(1) + '%' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.pass ? 'var(--spruce)' : 'var(--amber)' }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)' }}>{r.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 500, color: 'var(--ink)' }}>{r.val}</span>
                  <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 11, background: r.pass ? 'rgba(26,122,80,0.1)' : 'rgba(255,160,0,0.1)', color: r.pass ? 'var(--spruce)' : 'var(--amber)' }}>{r.pass ? 'Met' : 'Action needed'}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={card}>
            <p style={{ ...lbl, marginBottom: 20 }}>Hours Breakdown</p>
            {[['Unrestricted', data.unrestricted_hours],['Restricted', data.restricted_hours],['Supervised', data.supervised_hours],['Total', data.total_hours]].map(([label, val], i, arr) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>{Number(val).toFixed(1)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useApi } from '../../context/api-context';

export default function CompliancePage() {
  const { get } = useApi();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const month = new Date().toISOString().slice(0,7);

  useEffect(() => {
    get('/compliance').then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const d = data as any;

  return (
    <div style={{ padding: 40, maxWidth: 860 }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 6 }}>Compliance</p>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>Monthly Review</h1>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 32 }}>{month}</p>

      {loading ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading…</p>
      ) : !d ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--amber)' }}>No data yet — log some hours first.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Hours', val: Number(d.total_hours||0).toFixed(1), color: 'var(--ink)' },
              { label: 'Supervision %', val: Number(d.supervision_pct||0).toFixed(1)+'%', color: d.meets_supervision ? 'var(--spruce)' : 'var(--amber)' },
              { label: 'Restricted %', val: Number(d.restricted_pct||0).toFixed(1)+'%', color: d.meets_restricted ? 'var(--spruce)' : 'var(--amber)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px' }}>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 4 }}>{s.label}</p>
                <p style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 600, color: s.color, margin: 0, lineHeight: 1 }}>{s.val}</p>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px', marginBottom: 24 }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 20 }}>BACB Requirements</p>
            {[
              { label: 'Supervision >= 5% of hours', pass: d.meets_supervision, val: Number(d.supervision_pct||0).toFixed(1)+'%' },
              { label: 'Restricted hours <= 50% of total', pass: d.meets_restricted, val: Number(d.restricted_pct||0).toFixed(1)+'%' },
            ].map((r, i, arr) => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.pass ? 'var(--spruce)' : 'var(--amber)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)' }}>{r.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 500, color: 'var(--ink)' }}>{r.val}</span>
                  <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 11, background: r.pass ? 'rgba(26,122,80,0.1)' : 'rgba(255,160,0,0.1)', color: r.pass ? 'var(--spruce)' : 'var(--amber)' }}>{r.pass ? 'Met' : 'Action needed'}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px' }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 20 }}>Hours Breakdown</p>
            {[['Unrestricted', d.unrestricted_hours],['Restricted', d.restricted_hours],['Supervised', d.supervised_hours],['Total', d.total_hours]].map(([label, val], i, arr) => (
              <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 500, color: 'var(--ink)' }}>{Number(val||0).toFixed(1)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

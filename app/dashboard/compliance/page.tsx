'use client';
import { useEffect, useState } from 'react';
import { useApi } from '../../context/api-context';

export default function CompliancePage() {
  const { get } = useApi();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const month = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    get('/compliance').then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const d = data;

  const card = (label: string, value: string, sub?: string, color?: string) => (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px' }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 600, color: color || 'var(--ink)', margin: 0, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{sub}</p>}
    </div>
  );

  const badge = (pass: boolean, label: string, val: string) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: pass ? 'var(--spruce)' : 'var(--amber)', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 500, color: 'var(--ink)' }}>{val}</span>
        <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: pass ? 'rgba(26,122,80,0.1)' : 'rgba(255,160,0,0.1)', color: pass ? 'var(--spruce)' : 'var(--amber)' }}>{pass ? 'Met' : 'Action needed'}</span>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Compliance</p>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>Monthly Review</h1>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 32 }}>{month}</p>

      {loading ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading...</p>
      ) : !d ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--amber)' }}>No data yet — log some hours first.</p>
      ) : (
        <>
          {/* Top stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {card('Total Hours', Number(d.totalHours||0).toFixed(1), `${((d.totalHours/2000)*100).toFixed(1)}% of 2,000`)}
            {card('Supervised', Number(d.supervisedHours||0).toFixed(1) + ' hrs', `${Number(d.supervisionPct||0).toFixed(1)}%`, d.supervisionMet ? 'var(--spruce)' : 'var(--amber)')}
            {card('Independent', Number(d.independentHours||0).toFixed(1) + ' hrs', `${d.totalHours > 0 ? (100 - d.supervisionPct).toFixed(1) : 0}%`)}
            {card('Restricted', Number(d.restrictedPct||0).toFixed(1) + '%', d.restrictedMet ? 'Within limit' : 'Over 50% limit', d.restrictedMet ? 'var(--spruce)' : 'var(--amber)')}
          </div>

          {/* Monthly compliance checks */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px', marginBottom: 24 }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 20 }}>BACB Requirements — {month}</p>
            {badge(d.supervisionMet, 'Supervision ≥ 5% of hours', Number(d.supervisionPct||0).toFixed(1) + '%')}
            {badge(d.restrictedMet, 'Restricted hours ≤ 50% of total', Number(d.restrictedPct||0).toFixed(1) + '%')}
            {badge(d.supervisionContacts >= 2, 'Supervision contacts this month', `${d.supervisionContacts} contact${d.supervisionContacts !== 1 ? 's' : ''}`)}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.monthlyObservationMet ? 'var(--spruce)' : 'var(--amber)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)' }}>Monthly observation completed</span>
              </div>
              <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: d.monthlyObservationMet ? 'rgba(26,122,80,0.1)' : 'rgba(255,160,0,0.1)', color: d.monthlyObservationMet ? 'var(--spruce)' : 'var(--amber)' }}>{d.monthlyObservationMet ? 'Completed' : 'Not yet this month'}</span>
            </div>
          </div>

          {/* Hours breakdown + pace */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px' }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 20 }}>Hours Breakdown</p>
              {[['Unrestricted', d.unrestricted], ['Restricted', d.restricted], ['Supervised', d.supervisedHours], ['Independent', d.independentHours], ['Total', d.totalHours]].map(([label, val]) => (
                <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: label !== 'Total' ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: label === 'Total' ? 600 : 500, color: 'var(--ink)' }}>{Number(val||0).toFixed(1)}</span>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px' }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 20 }}>Hours Pace</p>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{Number(d.totalHours||0).toFixed(0)} / 2,000 hrs</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{((d.totalHours/2000)*100).toFixed(1)}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, var(--spruce), #5BC891)', width: `${Math.min((d.totalHours/2000)*100, 100)}%` }} />
                </div>
              </div>
              {d.projectedCompletionDate === 'complete' ? (
                <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--spruce)' }}>✓ 2,000 hours complete!</p>
              ) : d.projectedCompletionDate ? (
                <>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Projected completion</p>
                  <p style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{d.projectedCompletionDate}</p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>based on current pace</p>
                </>
              ) : (
                <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>Log more hours to see projection</p>
              )}
            </div>
          </div>

          {/* Task list coverage */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', margin: 0 }}>Task List Coverage</p>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>{d.taskListCoverageCount} / {d.taskListCoverage?.length || 9} areas</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {(d.taskListCoverage || []).map((t: any) => (
                <div key={t.area} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: t.covered ? 'rgba(26,122,80,0.08)' : 'var(--bg)', border: `1px solid ${t.covered ? 'rgba(26,122,80,0.2)' : 'var(--border)'}` }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.covered ? 'var(--spruce)' : 'var(--border)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: t.covered ? 'var(--spruce)' : 'var(--muted)' }}>{t.area}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

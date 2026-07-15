'use client';
import { useState, useEffect } from 'react';
import { useApi } from '../context/api-context';
import { useCompliance } from '../context/compliance-context';

export default function DashboardPage() {
  const api = useApi();
  const { data, refetch } = useCompliance();
  const [isMobile, setIsMobile] = useState(false);
  const [trackBusy, setTrackBusy] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const month = new Date().toISOString().slice(0, 7);
  const monthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const d = data;
  const targetHours = d?.totalHoursRequired || 2000;
  const track = d?.track || 'supervised';

  async function setTrack(newTrack: 'supervised' | 'concentrated') {
    if (newTrack === track || trackBusy) return;
    setTrackBusy(true);
    try {
      await api.patch('/professionals/track', { track: newTrack });
      await refetch();
    } catch {}
    finally { setTrackBusy(false); }
  }

  const statCard = (label: string, value: string, sub?: string, color?: string) => (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '14px 16px' : '20px 24px', minWidth: 0 }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 22 : 28, fontWeight: 700, color: color || 'var(--ink)', margin: 0, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{sub}</p>}
    </div>
  );

  const reqRow = (label: string, pass: boolean | undefined, val: string, last?: boolean) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: pass === undefined ? 'var(--border)' : pass ? 'var(--spruce)' : 'var(--amber)', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>{val}</span>
        {pass !== undefined && (
          <span style={{ padding: '2px 10px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: pass ? 'rgba(26,122,80,0.1)' : 'rgba(255,160,0,0.1)', color: pass ? 'var(--spruce)' : 'var(--amber)' }}>
            {pass ? '✓' : '!'}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: isMobile ? '20px 16px' : 40, maxWidth: 900, width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>{monthLabel} · Supervised Fieldwork</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-.02em' }}>Your compliance dashboard</h1>
        </div>
        <a href="/dashboard/fieldwork?role=bcba" style={{ background: 'var(--spruce)', color: '#fff', font: '600 13px var(--sans)', padding: '11px 20px', borderRadius: 10, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7 }}>+ Log hours</a>
      </div>

      {/* Fieldwork track toggle */}
      <div style={{ display: 'inline-flex', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 3, marginBottom: 24, gap: 2 }}>
        <button onClick={() => setTrack('supervised')} disabled={trackBusy} style={{ border: 0, background: track === 'supervised' ? 'var(--spruce)' : 'transparent', color: track === 'supervised' ? '#fff' : 'var(--muted)', font: '600 12px var(--sans)', padding: '8px 16px', borderRadius: 8, cursor: trackBusy ? 'not-allowed' : 'pointer' }}>
          Supervised · 2,000 hrs
        </button>
        <button onClick={() => setTrack('concentrated')} disabled={trackBusy} style={{ border: 0, background: track === 'concentrated' ? 'var(--spruce)' : 'transparent', color: track === 'concentrated' ? '#fff' : 'var(--muted)', font: '600 12px var(--sans)', padding: '8px 16px', borderRadius: 8, cursor: trackBusy ? 'not-allowed' : 'pointer' }}>
          Concentrated · 1,500 hrs
        </button>
      </div>

      {/* Top 6 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
        {statCard('Total Hours', d ? Number(d.totalHours||0).toFixed(1) : '—', d ? `${((d.totalHours/targetHours)*100).toFixed(1)}% of ${targetHours.toLocaleString()}` : undefined)}
        {statCard('Supervised', d ? Number(d.supervisedHours||0).toFixed(1) + ' hrs' : '—', d ? `${Number(d.supervisionPct||0).toFixed(1)}% of total` : undefined, d?.supervisionMet ? 'var(--spruce)' : d ? 'var(--amber)' : undefined)}
        {statCard('Independent', d ? Number(d.independentHours||0).toFixed(1) + ' hrs' : '—', d ? `${d.totalHours > 0 ? (100 - d.supervisionPct).toFixed(1) : 0}% of total` : undefined)}
        {statCard('Restricted %', d ? Number(d.restrictedPct||0).toFixed(1) + '%' : '—', d?.restrictedMet ? 'Within 40% limit' : 'Over limit', d?.restrictedMet ? 'var(--spruce)' : d ? 'var(--amber)' : undefined)}
        {statCard('Contacts This Month', d ? String(d.supervisionContacts || 0) : '—', d ? `${d.contactsMet ? 'Minimum met' : `Min. ${d.contactsRequired ?? '—'} required`}` : undefined, d?.contactsMet ? 'var(--spruce)' : d ? 'var(--amber)' : undefined)}
        {statCard('Projected Completion', d?.projectedCompletionDate === 'complete' ? 'Done ✓' : d?.projectedCompletionDate ? new Date(d.projectedCompletionDate + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—', 'at current pace', d?.projectedCompletionDate === 'complete' ? 'var(--spruce)' : undefined)}
      </div>

      {/* BACB Requirements + Hours pace */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 16 }}>BACB Requirements</p>
          {reqRow(track === 'concentrated' ? 'Supervision ≥ 10%' : 'Supervision ≥ 5%', d?.supervisionMet, d ? Number(d.supervisionPct||0).toFixed(1) + '%' : '—')}
          {reqRow('Restricted ≤ 40%', d?.restrictedMet, d ? Number(d.restrictedPct||0).toFixed(1) + '%' : '—')}
          {reqRow('Supervision contacts', d ? d.contactsMet : undefined, d ? `${d.supervisionContacts} of ${d.contactsRequired ?? '—'} this month` : '—')}
          {reqRow('Monthly observation', d?.monthlyObservationMet, d?.monthlyObservationMet ? 'Completed' : 'Not yet', true)}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 16 }}>Hours Pace</p>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{d ? Number(d.totalHours||0).toFixed(0) : 0} / {targetHours.toLocaleString()} hrs</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{d ? ((d.totalHours/targetHours)*100).toFixed(1) : 0}%</span>
            </div>
            <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, var(--spruce), #5BC891)', width: `${d ? Math.min((d.totalHours/targetHours)*100, 100) : 0}%`, transition: 'width .6s ease' }} />
            </div>
          </div>
          {[['Unrestricted', d?.unrestricted], ['Restricted', d?.restricted], ['Supervised', d?.supervisedHours], ['Independent', d?.independentHours]].map(([label, val]) => (
            <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{label}</span>
              <span style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{val !== undefined && val !== null ? Number(val).toFixed(1) : '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Task list coverage */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', margin: 0 }}>Task List Coverage</p>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>{d?.taskListCoverageCount || 0} / {d?.taskListCoverage?.length || 9} areas</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
          {(d?.taskListCoverage || Array(9).fill({ area: '...', covered: false })).map((t: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: t.covered ? 'rgba(26,122,80,0.08)' : 'var(--bg)', border: `1px solid ${t.covered ? 'rgba(26,122,80,0.2)' : 'var(--border)'}`, minWidth: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.covered ? 'var(--spruce)' : 'var(--border)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: t.covered ? 'var(--spruce)' : 'var(--muted)' }}>{t.area}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
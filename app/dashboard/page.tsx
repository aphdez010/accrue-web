'use client';
import { useState, useEffect } from 'react';
import { useApi } from '../context/api-context';

type Trainee = { id: number; full_name: string; cred: 'BCBA' | 'BCaBA'; track?: string; is_responsible?: boolean };
type Pending = { cred: 'BCBA' | 'BCaBA'; kind: 'M-FVF' | 'F-FVF'; trainee: string; period: string; href: string };

const skey = (cred: string, id: number) => cred + ':' + id;

export default function SupervisorDashboardPage() {
  const { get } = useApi();
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState<Trainee[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [status, setStatus] = useState<Record<string, any>>({});
  const [view, setView] = useState<string>('all');
  const [nowMs] = useState(() => Date.now());

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const monthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  async function load() {
    setLoading(true);
    try {
      const [bcbaRes, bcabaRes] = await Promise.all([
        get('/supervisors/my-trainees').catch(() => ({ trainees: [] })),
        get('/bcaba/supervisor/trainees').catch(() => []),
      ]);
      // Per-trainee compliance status for both credentials, merged under
      // collision-safe composite keys (BCBA professional ids and BCaBA trainee
      // ids live in separate id spaces and can overlap).
      Promise.all([
        get('/supervisors/trainee-status').catch(() => ({ trainees: [] })),
        get('/bcaba/supervisor/trainee-status').catch(() => ({ trainees: [] })),
      ]).then(([b, c]: any[]) => {
        const map: Record<string, any> = {};
        ((b?.trainees) || []).forEach((s: any) => { map[skey('BCBA', s.professional_id)] = { ...s, cred: 'BCBA' }; });
        ((c?.trainees) || []).forEach((s: any) => { map[skey('BCaBA', s.id)] = { ...s, cred: 'BCaBA' }; });
        setStatus(map);
      }).catch(() => {});

      const bcbaTrainees: Trainee[] = ((bcbaRes as any)?.trainees || []).map((t: any) => ({
        id: t.professional_id, full_name: t.full_name || 'Trainee', cred: 'BCBA',
        track: t.bcba_supervision_track, is_responsible: t.is_responsible,
      }));
      const bcabaTrainees: Trainee[] = (Array.isArray(bcabaRes) ? bcabaRes : []).map((t: any) => ({
        id: t.id, full_name: t.full_name || 'Trainee', cred: 'BCaBA', track: t.fieldwork_type,
      }));
      setRoster([...bcbaTrainees, ...bcabaTrainees]);

      const q: Pending[] = [];
      const periodOf = (v: any) => v.month_year || v.period_start || v.period_end || '';
      for (const t of bcbaTrainees) {
        const [m, f] = await Promise.all([
          get('/bcba-monthly-verification?traineeId=' + t.id).catch(() => ({ verifications: [] })),
          get('/bcba-final-verification?traineeId=' + t.id).catch(() => ({ finalVerifications: [] })),
        ]);
        ((m as any)?.verifications || []).filter((v: any) => v.status === 'draft').forEach((v: any) =>
          q.push({ cred: 'BCBA', kind: 'M-FVF', trainee: t.full_name, period: periodOf(v), href: '/dashboard/bcba/trainees' }));
        ((f as any)?.finalVerifications || []).filter((v: any) => v.status === 'draft').forEach((v: any) =>
          q.push({ cred: 'BCBA', kind: 'F-FVF', trainee: t.full_name, period: periodOf(v), href: '/dashboard/bcba/trainees' }));
      }
      for (const t of bcabaTrainees) {
        const [m, f] = await Promise.all([
          get('/bcaba-monthly-verification?traineeId=' + t.id).catch(() => ({ verifications: [] })),
          get('/bcaba-final-verification?traineeId=' + t.id).catch(() => ({ finalVerifications: [] })),
        ]);
        ((m as any)?.verifications || []).filter((v: any) => v.status === 'draft').forEach((v: any) =>
          q.push({ cred: 'BCaBA', kind: 'M-FVF', trainee: t.full_name, period: periodOf(v), href: '/dashboard/bcaba/trainees' }));
        (((f as any)?.finalVerifications || (f as any)?.verifications || []) as any[]).filter((v: any) => v.status === 'draft').forEach((v: any) =>
          q.push({ cred: 'BCaBA', kind: 'F-FVF', trainee: t.full_name, period: periodOf(v), href: '/dashboard/bcaba/trainees' }));
      }
      setPending(q);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const statOf = (t: Trainee) => status[skey(t.cred, t.id)];
  const bcbaCount = roster.filter(t => t.cred === 'BCBA').length;
  const bcabaCount = roster.filter(t => t.cred === 'BCaBA').length;
  const total = roster.length;
  const statusVals: any[] = Object.values(status);
  const withData = statusVals.length;
  const atRiskCount = statusVals.filter(s => s?.atRisk).length;
  const onTrackCount = statusVals.filter(s => s?.monthState === 'on_track').length;
  const avgCompletion = withData ? Math.round(statusVals.reduce((a, s) => a + (s.pctComplete || 0), 0) / withData) : 0;
  const monthsUntil = (d: string) => (new Date(d).getTime() - nowMs) / (1000 * 60 * 60 * 24 * 30.44);
  const nearingDeadline = statusVals.filter(s => s?.fieldworkDeadline && monthsUntil(s.fieldworkDeadline) >= 0 && monthsUntil(s.fieldworkDeadline) <= 6).length;

  const selected = view === 'all' ? null : (roster.find(t => skey(t.cred, t.id) === view) || null);
  const selStatus = selected ? statOf(selected) : null;

  const bar = (pctVal: number, color = 'var(--spruce)', h = 6) => (
    <div style={{ height: h, background: 'var(--bg)', borderRadius: h / 2, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: Math.max(2, Math.min(100, pctVal)) + '%', height: '100%', background: color, borderRadius: h / 2, transition: 'width .4s ease' }} />
    </div>
  );

  const metricCard = (glyph: string, label: string, value: string, footer?: React.ReactNode, accent?: string) => (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '16px' : '18px 20px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', margin: 0 }}>{label}</p>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: accent || 'var(--muted)', opacity: .8 }}>{glyph}</span>
      </div>
      <p style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 24 : 30, fontWeight: 700, color: accent || 'var(--ink)', margin: 0, lineHeight: 1 }}>{value}</p>
      {footer && <div style={{ marginTop: 'auto' }}>{footer}</div>}
    </div>
  );

  const credBadge = (cred: 'BCBA' | 'BCaBA') => (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.04em', padding: '2px 8px', borderRadius: 20, background: cred === 'BCBA' ? 'rgba(26,122,80,0.1)' : 'rgba(70,130,180,0.12)', color: cred === 'BCBA' ? 'var(--spruce)' : '#3d6b8e' }}>{cred}</span>
  );

  const th: React.CSSProperties = { textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', padding: '0 14px 10px 0', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)', padding: '12px 14px 12px 0', whiteSpace: 'nowrap', borderTop: '1px solid var(--border)', verticalAlign: 'middle' };
  const pct = (v: number, ok: boolean) => <span style={{ color: ok ? 'var(--spruce)' : 'var(--amber)' }}>{Number(v).toFixed(1)}%</span>;
  const monthChip = (state: string) => {
    const map: Record<string, { bg: string; c: string; t: string }> = {
      on_track: { bg: 'rgba(26,122,80,0.1)', c: 'var(--spruce)', t: 'On track' },
      at_risk: { bg: 'rgba(255,160,0,0.12)', c: 'var(--amber)', t: 'At risk' },
      not_started: { bg: 'rgba(0,0,0,0.05)', c: 'var(--muted)', t: 'Not started' },
    };
    const s = map[state] || map.not_started;
    return <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '3px 9px', borderRadius: 20, background: s.bg, color: s.c }}>{s.t}</span>;
  };
  const fmtDeadline = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';
  const reasonText = (r: string): string => (({
    no_observation: 'No monthly observation logged this month',
    under_min_hours: 'Under the 20-hour monthly minimum',
    over_max_hours: 'Over the monthly maximum hours',
    insufficient_contacts: 'Not enough supervision contacts',
    group_exceeds_individual: 'Group supervision exceeds individual',
    supervision_pct_below_min: 'Supervision below the required percentage',
  } as Record<string, string>)[r] || r.replace(/_/g, ' '));

  const addBtn = (label: string, href: string, primary?: boolean) => (
    <a href={href} style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, padding: '10px 18px', borderRadius: 10, textDecoration: 'none', border: '1px solid ' + (primary ? 'var(--spruce)' : 'var(--border)'), background: primary ? 'var(--spruce)' : 'transparent', color: primary ? '#fff' : 'var(--ink)' }}>{label}</a>
  );

  // Monthly bar chart for a set of trainees — reused by the cohort view and the per-trainee view.
  const monthlyChart = (list: Trainee[]) => {
    const withM = list.filter(t => ((statOf(t)?.months) || []).some((m: any) => m.rawHours > 0));
    if (withM.length === 0) return <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>No monthly fieldwork logged yet — once hours are logged, each month shows here.</p>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {withM.map((t, i) => {
          const stt = statOf(t);
          const months = ((stt.months as any[]) || []).slice(-12);
          const peak = Math.max(...months.map((m: any) => m.rawHours), 1);
          return (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' as const }}>
                {credBadge(t.cred)}
                <span style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{t.full_name}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>{months.length} mo · {Number(stt.totalEligibleHours).toFixed(0)} eligible hrs</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
                {months.map((m: any, j: number) => {
                  const h = Math.max(3, Math.round((m.rawHours / peak) * 44));
                  const color = (m.rawHours === 0 || m.eligibleHours === 0) ? 'var(--border)' : m.eligibleHours < m.rawHours ? 'var(--amber)' : 'var(--spruce)';
                  const label = new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
                  return (
                    <div key={j} title={label + ' ' + m.month.slice(0, 4) + ' · ' + m.rawHours + ' hrs logged, ' + m.eligibleHours + ' eligible'} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 6, flex: '1 1 0', minWidth: 20, height: '100%' }}>
                      <div style={{ width: '100%', maxWidth: 28, height: h, background: color, borderRadius: 3, transition: 'height .3s ease' }} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)' }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '18px' : '22px 26px', minWidth: 0 };
  const sectionLabel: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', margin: 0 };
  const legend = (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
      {[['var(--spruce)', 'Counted'], ['var(--amber)', 'Adjusted'], ['var(--border)', 'Not counted']].map(([c, label]) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />{label}
        </span>
      ))}
    </div>
  );

  return (
    <div style={{ padding: isMobile ? '20px 16px' : 40, maxWidth: 1000, width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
      {/* Header + view switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' as const, marginBottom: 20 }}>
        <div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>{monthLabel} · Supervision</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-.02em' }}>{selected ? selected.full_name : 'Supervisor dashboard'}</h1>
        </div>
        {roster.length > 0 && (
          <select value={view} onChange={e => setView(e.target.value)} style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 14px', cursor: 'pointer', maxWidth: 260 }}>
            <option value="all">All trainees (overview)</option>
            {roster.map(t => <option key={skey(t.cred, t.id)} value={skey(t.cred, t.id)}>{t.full_name} · {t.cred}</option>)}
          </select>
        )}
      </div>

      {view === 'all' ? (
        <>
          {/* Program band */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
            {metricCard('◷', 'Trainees', loading ? '—' : String(total),
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', margin: 0 }}>{bcbaCount} BCBA · {bcabaCount} BCaBA</p>)}
            {metricCard('↗', 'Avg Completion', loading ? '—' : avgCompletion + '%', bar(avgCompletion))}
            {metricCard('◉', 'On Track', loading ? '—' : onTrackCount + '/' + (withData || 0),
              bar(withData ? (onTrackCount / withData) * 100 : 0, atRiskCount > 0 ? 'var(--amber)' : 'var(--spruce)'),
              atRiskCount > 0 ? 'var(--amber)' : undefined)}
            {metricCard('⚑', 'Nearing Deadline', loading ? '—' : String(nearingDeadline),
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', margin: 0 }}>within 6 months</p>,
              nearingDeadline > 0 ? 'var(--amber)' : undefined)}
          </div>

          {/* Needs your signature */}
          <div style={{ ...card, marginBottom: 16 }}>
            <p style={{ ...sectionLabel, marginBottom: 14 }}>Needs your signature{pending.length ? ' (' + pending.length + ')' : ''}</p>
            {loading ? (
              <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>Loading...</p>
            ) : pending.length === 0 ? (
              <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>Nothing waiting on you right now.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pending.map((p, i) => (
                  <a key={i} href={p.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--amber)', textDecoration: 'none', flexWrap: 'wrap' as const }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      {credBadge(p.cred)}
                      <span style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{p.trainee}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{p.kind}{p.period ? ' · ' + p.period : ''}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--spruce)' }}>Review &amp; sign &rarr;</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Trainee metrics */}
          <div style={card}>
            <p style={{ ...sectionLabel, marginBottom: 16 }}>Trainee metrics</p>
            {loading ? (
              <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>Loading...</p>
            ) : roster.length === 0 ? (
              <div style={{ textAlign: 'center', padding: isMobile ? '32px 8px' : '48px 24px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 28, color: 'var(--spruce)', opacity: .5, marginBottom: 12 }}>◷</div>
                <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px' }}>No trainees on your roster yet</h3>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--muted)', margin: '0 auto 20px', maxWidth: 380, lineHeight: 1.5 }}>
                  Add a trainee to start tracking their fieldwork against the BACB rules — hours, supervision percentage, restricted ceiling, and their 5-year deadline, all in one place.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' as const }}>
                  {addBtn('Add a BCBA trainee', '/dashboard/bcba/trainees', true)}
                  {addBtn('Add a BCaBA trainee', '/dashboard/bcaba/trainees')}
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 680 }}>
                  <thead>
                    <tr>
                      {['Trainee', 'Cred', 'Track', 'Progress', '% Done', 'Supervision', 'Restricted', 'This month', 'Deadline'].map(h => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((t, i) => {
                      const s = statOf(t);
                      return (
                        <tr key={i} style={{ background: s?.atRisk ? 'rgba(255,160,0,0.05)' : 'transparent', cursor: 'pointer' }} onClick={() => setView(skey(t.cred, t.id))}>
                          <td style={{ ...td, whiteSpace: 'normal' }}>
                            <span style={{ color: 'var(--ink)', fontWeight: 600, fontFamily: 'var(--sans)', fontSize: 13 }}>{t.full_name}</span>
                            {t.is_responsible && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', marginLeft: 6 }}>Resp.</span>}
                          </td>
                          <td style={td}>{credBadge(t.cred)}</td>
                          <td style={{ ...td, textTransform: 'capitalize' }}>{s?.track || t.track || '—'}</td>
                          <td style={{ ...td, minWidth: 120 }}>
                            {s ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {bar(s.pctComplete, s.atRisk ? 'var(--amber)' : 'var(--spruce)', 5)}
                                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{Number(s.totalEligibleHours).toFixed(0)} / {s.totalHoursRequired} hrs</span>
                              </div>
                            ) : '—'}
                          </td>
                          <td style={td}>{s ? s.pctComplete + '%' : '—'}</td>
                          <td style={td}>{s ? pct(s.supervisionPct, s.supervisionMet) : '—'}</td>
                          <td style={td}>{s ? pct(s.restrictedPct, s.restrictedMet) : '—'}</td>
                          <td style={td}>{s ? monthChip(s.monthState) : <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                          <td style={td}>{s ? fmtDeadline(s.fieldworkDeadline) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Monthly review */}
          <div style={{ ...card, marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 8, marginBottom: 18 }}>
              <p style={sectionLabel}>Monthly review</p>
              {legend}
            </div>
            {loading ? <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>Loading...</p> : monthlyChart(roster)}
          </div>
        </>
      ) : selected ? (
        <>
          {/* Per-trainee header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const, marginBottom: 16 }}>
            {credBadge(selected.cred)}
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'capitalize' }}>{selStatus?.track || selected.track || ''} track</span>
            {selected.is_responsible && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 10px', borderRadius: 20, background: 'rgba(26,122,80,0.1)', color: 'var(--spruce)' }}>Responsible supervisor</span>}
            <button onClick={() => setView('all')} style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--spruce)', background: 'none', border: 'none', cursor: 'pointer' }}>&larr; All trainees</button>
          </div>

          {!selStatus ? (
            <div style={card}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>No compliance data for this trainee yet — it appears once they log fieldwork.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
                {metricCard('↗', 'Completion', selStatus.pctComplete + '%', bar(selStatus.pctComplete, selStatus.atRisk ? 'var(--amber)' : 'var(--spruce)'), selStatus.atRisk ? 'var(--amber)' : undefined)}
                {metricCard('◷', 'Eligible Hours', Number(selStatus.totalEligibleHours).toFixed(0),
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', margin: 0 }}>of {selStatus.totalHoursRequired} required</p>)}
                {metricCard('◉', 'Supervision', Number(selStatus.supervisionPct).toFixed(1) + '%',
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: selStatus.supervisionMet ? 'var(--spruce)' : 'var(--amber)', margin: 0 }}>{selStatus.supervisionMet ? 'meets minimum' : 'below minimum'}</p>,
                  selStatus.supervisionMet ? undefined : 'var(--amber)')}
                {metricCard('◷', 'Restricted', Number(selStatus.restrictedPct).toFixed(1) + '%',
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: selStatus.restrictedMet ? 'var(--spruce)' : 'var(--amber)', margin: 0 }}>{selStatus.restrictedMet ? 'within limit' : 'over limit'}</p>,
                  selStatus.restrictedMet ? undefined : 'var(--amber)')}
              </div>

              {/* This month + deadline strip */}
              <div style={{ ...card, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={sectionLabel}>This month</span>
                  {monthChip(selStatus.monthState)}
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{Number(selStatus.hoursThisMonth || 0).toFixed(0)} hrs logged</span>
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>Deadline {fmtDeadline(selStatus.fieldworkDeadline)}</span>
              </div>

              {selStatus.monthState === 'at_risk' && (selStatus.reasons || []).length > 0 && (
                <div style={{ ...card, marginBottom: 16, border: '1px solid var(--amber)' }}>
                  <p style={{ ...sectionLabel, color: 'var(--amber)', marginBottom: 10 }}>This month needs attention</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(selStatus.reasons || []).map((r: string, i: number) => (
                      <span key={i} style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)' }}>• {reasonText(r)}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Their monthly review */}
              <div style={{ ...card, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 8, marginBottom: 18 }}>
                  <p style={sectionLabel}>Monthly review</p>
                  {legend}
                </div>
                {monthlyChart([selected])}
              </div>

              {/* Their pending forms */}
              <div style={card}>
                <p style={{ ...sectionLabel, marginBottom: 14 }}>Forms &amp; signatures</p>
                {(() => {
                  const mine = pending.filter(p => p.trainee === selected.full_name);
                  const href = selected.cred === 'BCBA' ? '/dashboard/bcba/trainees' : '/dashboard/bcaba/trainees';
                  if (mine.length === 0) return (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>No drafts waiting on your signature.</span>
                      <a href={href} style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--spruce)', textDecoration: 'none' }}>Open their forms &rarr;</a>
                    </div>
                  );
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {mine.map((p, i) => (
                        <a key={i} href={p.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--amber)', textDecoration: 'none', flexWrap: 'wrap' as const }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>{p.kind}{p.period ? ' · ' + p.period : ''}</span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--spruce)' }}>Review &amp; sign &rarr;</span>
                        </a>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

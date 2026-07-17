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
  const onTrackN = statusVals.filter(s => s?.monthState === 'on_track').length;
  const atRiskN = statusVals.filter(s => s?.monthState === 'at_risk').length;
  const notStartedN = statusVals.filter(s => s?.monthState === 'not_started').length;
  const avgCompletion = withData ? Math.round(statusVals.reduce((a, s) => a + (s.pctComplete || 0), 0) / withData) : 0;
  const monthsUntil = (d: string) => (new Date(d).getTime() - nowMs) / (1000 * 60 * 60 * 24 * 30.44);
  const nearingDeadline = statusVals.filter(s => s?.fieldworkDeadline && monthsUntil(s.fieldworkDeadline) >= 0 && monthsUntil(s.fieldworkDeadline) <= 6).length;
  const sortedRoster = [...roster].sort((a, b) => ((statOf(b)?.pctComplete || 0) - (statOf(a)?.pctComplete || 0)));

  const selected = view === 'all' ? null : (roster.find(t => skey(t.cred, t.id) === view) || null);
  const selStatus = selected ? statOf(selected) : null;

  const bar = (pctVal: number, color = 'var(--spruce)', h = 6) => (
    <div style={{ height: h, background: 'var(--bg)', borderRadius: h / 2, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: Math.max(2, Math.min(100, pctVal)) + '%', height: '100%', background: color, borderRadius: h / 2, transition: 'width .4s ease' }} />
    </div>
  );

  const statusColor = (s: any) => !s ? 'var(--border)' : s.monthState === 'at_risk' ? 'var(--amber)' : s.monthState === 'not_started' ? 'var(--border)' : 'var(--spruce)';

  // SVG donut — segments drawn as dashed circle arcs, total in the center.
  const donut = (segs: { value: number; color: string }[], centerTop: string, centerBot: string) => {
    const totalV = segs.reduce((a, s) => a + s.value, 0) || 1;
    const R = 42; const C = 2 * Math.PI * R; let off = 0;
    return (
      <div style={{ position: 'relative', width: 104, height: 104, flex: 'none' }}>
        <svg width="104" height="104" viewBox="0 0 104 104" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="52" cy="52" r={R} fill="none" stroke="var(--bg)" strokeWidth="12" />
          {segs.filter(s => s.value > 0).map((s, i) => {
            const len = (s.value / totalV) * C;
            const seg = <circle key={i} cx="52" cy="52" r={R} fill="none" stroke={s.color} strokeWidth="12" strokeDasharray={len + ' ' + (C - len)} strokeDashoffset={-off} />;
            off += len; return seg;
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{centerTop}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)' }}>{centerBot}</span>
        </div>
      </div>
    );
  };

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
                  const hgt = Math.max(3, Math.round((m.rawHours / peak) * 44));
                  const color = (m.rawHours === 0 || m.eligibleHours === 0) ? 'var(--border)' : m.eligibleHours < m.rawHours ? 'var(--amber)' : 'var(--spruce)';
                  const label = new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
                  return (
                    <div key={j} title={label + ' ' + m.month.slice(0, 4) + ' · ' + m.rawHours + ' hrs logged, ' + m.eligibleHours + ' eligible'} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 6, flex: '1 1 0', minWidth: 20, height: '100%' }}>
                      <div style={{ width: '100%', maxWidth: 28, height: hgt, background: color, borderRadius: 3, transition: 'height .3s ease' }} />
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

  const emptyState = (
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
  );

  return (
    <div style={{ padding: isMobile ? '20px 16px' : 40, maxWidth: 1000, width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
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
          {/* Cohort snapshot */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1.1fr) minmax(0,1fr)', gap: 12, marginBottom: 16 }}>
            <div style={card}>
              <p style={{ ...sectionLabel, marginBottom: 14 }}>Cohort this month</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' as const }}>
                {donut([
                  { value: onTrackN, color: 'var(--spruce)' },
                  { value: atRiskN, color: 'var(--amber)' },
                  { value: notStartedN, color: 'var(--border)' },
                ], loading ? '—' : String(withData || total), 'trainees')}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {[['var(--spruce)', 'On track', onTrackN], ['var(--amber)', 'At risk', atRiskN], ['var(--border)', 'Not started', notStartedN]].map((row: any) => (
                    <span key={row[1]} style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
                      <span style={{ width: 9, height: 9, borderRadius: 2, background: row[0], display: 'inline-block' }} />{row[1]} <b style={{ color: 'var(--ink)', fontWeight: 700 }}>{loading ? '—' : row[2]}</b>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 12 }}>
              <div style={{ ...card, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ ...sectionLabel, marginBottom: 10 }}>Avg completion</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{loading ? '—' : avgCompletion + '%'}</span>
                  <div style={{ flex: 1 }}>{bar(avgCompletion)}</div>
                </div>
              </div>
              <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ ...sectionLabel, marginBottom: 8 }}>Nearing deadline</p>
                  <span style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 700, color: nearingDeadline > 0 ? 'var(--amber)' : 'var(--ink)', lineHeight: 1 }}>{loading ? '—' : String(nearingDeadline)}</span>
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: nearingDeadline > 0 ? 'var(--amber)' : 'var(--muted)', opacity: .8 }}>⚑</span>
              </div>
            </div>
          </div>

          {/* Cohort progress board */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap' as const, gap: 8 }}>
              <p style={sectionLabel}>Cohort progress</p>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>toward hour goal · tap a row for detail</span>
            </div>
            {loading ? (
              <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>Loading...</p>
            ) : roster.length === 0 ? emptyState : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {sortedRoster.map((t, i) => {
                  const s = statOf(t);
                  const pctV = s?.pctComplete || 0;
                  return (
                    <div key={i} onClick={() => setView(skey(t.cred, t.id))} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                      <div style={{ width: isMobile ? 118 : 156, flex: 'none', display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                        {credBadge(t.cred)}
                        <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.full_name}</span>
                      </div>
                      <div style={{ flex: 1, height: 14, background: 'var(--bg)', borderRadius: 7, overflow: 'hidden' }}>
                        <div style={{ width: Math.max(2, Math.min(100, pctV)) + '%', height: '100%', background: statusColor(s), borderRadius: 7, transition: 'width .5s ease' }} />
                      </div>
                      <span style={{ width: 38, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{pctV}%</span>
                      {!isMobile && <span style={{ width: 116, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{s ? Number(s.totalEligibleHours).toFixed(0) + ' / ' + s.totalHoursRequired + ' hrs' : '—'}</span>}
                    </div>
                  );
                })}
              </div>
            )}
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

          {/* Monthly review */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 8, marginBottom: 18 }}>
              <p style={sectionLabel}>Monthly review</p>
              {legend}
            </div>
            {loading ? <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>Loading...</p> : monthlyChart(roster)}
          </div>
        </>
      ) : selected ? (
        <>
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

              <div style={{ ...card, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 8, marginBottom: 18 }}>
                  <p style={sectionLabel}>Monthly review</p>
                  {legend}
                </div>
                {monthlyChart([selected])}
              </div>

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

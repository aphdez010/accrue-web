'use client';
import { useState, useEffect } from 'react';
import { useApi } from '../context/api-context';

type Trainee = { id: number; full_name: string; cred: 'BCBA' | 'BCaBA'; track?: string; is_responsible?: boolean };
type Pending = { cred: 'BCBA' | 'BCaBA'; kind: 'M-FVF' | 'F-FVF'; trainee: string; period: string; href: string };

export default function SupervisorDashboardPage() {
  const { get } = useApi();
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState<Trainee[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [status, setStatus] = useState<Record<number, any>>({});

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const monthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [bcbaRes, bcabaRes] = await Promise.all([
        get('/supervisors/my-trainees').catch(() => ({ trainees: [] })),
        get('/bcaba/supervisor/trainees').catch(() => []),
      ]);
      get('/supervisors/trainee-status').then((r: any) => {
        const map: Record<number, any> = {};
        ((r?.trainees) || []).forEach((s: any) => { map[s.professional_id] = s; });
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

  const bcbaCount = roster.filter(t => t.cred === 'BCBA').length;
  const bcabaCount = roster.filter(t => t.cred === 'BCaBA').length;
  const statusVals: any[] = Object.values(status);
  const withData = statusVals.length;
  const atRiskCount = statusVals.filter(s => s?.atRisk).length;
  const onTrackCount = statusVals.filter(s => s?.monthState === 'on_track').length;
  const avgCompletion = withData ? Math.round(statusVals.reduce((a, s) => a + (s.pctComplete || 0), 0) / withData) : 0;
  const monthsUntil = (d: string) => (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44);
  const nearingDeadline = statusVals.filter(s => s?.fieldworkDeadline && monthsUntil(s.fieldworkDeadline) >= 0 && monthsUntil(s.fieldworkDeadline) <= 6).length;

  const card = (label: string, value: string, sub?: string, color?: string) => (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '14px 16px' : '18px 22px', minWidth: 0 }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 22 : 26, fontWeight: 700, color: color || 'var(--ink)', margin: 0, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginTop: 5 }}>{sub}</p>}
    </div>
  );

  const credBadge = (cred: 'BCBA' | 'BCaBA') => (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.04em', padding: '2px 8px', borderRadius: 20, background: cred === 'BCBA' ? 'rgba(26,122,80,0.1)' : 'rgba(70,130,180,0.12)', color: cred === 'BCBA' ? 'var(--spruce)' : '#3d6b8e' }}>{cred}</span>
  );

  const th: React.CSSProperties = { textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', padding: '0 14px 10px 0', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)', padding: '11px 14px 11px 0', whiteSpace: 'nowrap', borderTop: '1px solid var(--border)' };

  const pct = (v: number, ok: boolean) => (
    <span style={{ color: ok ? 'var(--spruce)' : 'var(--amber)' }}>{Number(v).toFixed(1)}%</span>
  );
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

  return (
    <div style={{ padding: isMobile ? '20px 16px' : 40, maxWidth: 1000, width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>{monthLabel} · Supervision</p>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-.02em' }}>Supervisor dashboard</h1>
      </div>

      {/* Program band */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        {card('Trainees', loading ? '—' : String(bcbaCount + bcabaCount), `${bcbaCount} BCBA · ${bcabaCount} BCaBA`)}
        {card('Avg Completion', loading ? '—' : avgCompletion + '%', 'eligible hrs vs target')}
        {card('On Track', loading ? '—' : `${onTrackCount}/${withData || 0}`, 'this month', atRiskCount > 0 ? 'var(--amber)' : undefined)}
        {card('Nearing Deadline', loading ? '—' : String(nearingDeadline), 'within 6 months', nearingDeadline > 0 ? 'var(--amber)' : undefined)}
      </div>

      {/* Needs your signature */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '20px' : '22px 26px', marginBottom: 16, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 14 }}>Needs your signature{pending.length ? ` (${pending.length})` : ''}</p>
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

      {/* Trainee metrics table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '18px' : '22px 26px', minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 16 }}>Trainee metrics</p>
        {loading ? (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>Loading...</p>
        ) : roster.length === 0 ? (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            No trainees yet. Add them under <a href="/dashboard/bcba/trainees" style={{ color: 'var(--spruce)' }}>My BCBA Trainees</a> or <a href="/dashboard/bcaba/trainees" style={{ color: 'var(--spruce)' }}>My BCaBA Trainees</a>.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 640 }}>
              <thead>
                <tr>
                  {['Trainee', 'Cred', 'Track', 'Hours', '% Done', 'Supervision', 'Restricted', 'This month', 'Deadline'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roster.map((t, i) => {
                  const s = status[t.id];
                  const href = t.cred === 'BCBA' ? '/dashboard/bcba/trainees' : '/dashboard/bcaba/trainees';
                  return (
                    <tr key={i} style={{ background: s?.atRisk ? 'rgba(255,160,0,0.05)' : 'transparent' }}>
                      <td style={{ ...td, whiteSpace: 'normal' }}>
                        <a href={href} style={{ color: 'var(--ink)', textDecoration: 'none', fontWeight: 600, fontFamily: 'var(--sans)', fontSize: 13 }}>{t.full_name}</a>
                        {t.is_responsible && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', marginLeft: 6 }}>Resp.</span>}
                      </td>
                      <td style={td}>{credBadge(t.cred)}</td>
                      <td style={{ ...td, textTransform: 'capitalize' }}>{s?.track || t.track || '—'}</td>
                      <td style={td}>{s ? `${Number(s.totalEligibleHours).toFixed(0)} / ${s.totalHoursRequired}` : '—'}</td>
                      <td style={td}>{s ? `${s.pctComplete}%` : '—'}</td>
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
        {!loading && bcabaCount > 0 && (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginTop: 14, lineHeight: 1.4 }}>
            BCaBA compliance metrics run on a separate model and aren't populated here yet — BCaBA rows show name/track only.
          </p>
        )}
      </div>
    </div>
  );
}

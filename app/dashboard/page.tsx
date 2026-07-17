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

  const card = (label: string, value: string) => (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '14px 16px' : '20px 24px', minWidth: 0 }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 22 : 28, fontWeight: 700, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>{value}</p>
    </div>
  );

  const credBadge = (cred: 'BCBA' | 'BCaBA') => (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.04em', padding: '2px 8px', borderRadius: 20, background: cred === 'BCBA' ? 'rgba(26,122,80,0.1)' : 'rgba(70,130,180,0.12)', color: cred === 'BCBA' ? 'var(--spruce)' : 'var(--sky, #3d6b8e)' }}>{cred}</span>
  );

  return (
    <div style={{ padding: isMobile ? '20px 16px' : 40, maxWidth: 900, width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>{monthLabel} · Supervision</p>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-.02em' }}>Supervisor dashboard</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {card('BCBA Trainees', loading ? '—' : String(bcbaCount))}
        {card('BCaBA Trainees', loading ? '—' : String(bcabaCount))}
        {card('Pending Signatures', loading ? '—' : String(pending.length))}
      </div>

      {/* Needs your signature */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '20px' : '24px 28px', marginBottom: 16, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 16 }}>Needs your signature</p>
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

      {/* Your trainees */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '20px' : '24px 28px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' as const, gap: 8 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', margin: 0 }}>Your trainees</p>
        </div>
        {loading ? (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>Loading...</p>
        ) : roster.length === 0 ? (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            No trainees yet. Add BCBA trainees under <a href="/dashboard/bcba/trainees" style={{ color: 'var(--spruce)' }}>My BCBA Trainees</a> or BCaBA trainees under <a href="/dashboard/bcaba/trainees" style={{ color: 'var(--spruce)' }}>My BCaBA Trainees</a>.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {roster.map((t, i) => (
              <a key={i} href={t.cred === 'BCBA' ? '/dashboard/bcba/trainees' : '/dashboard/bcaba/trainees'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '11px 14px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  {credBadge(t.cred)}
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{t.full_name}</span>
                  {t.is_responsible && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)' }}>Responsible</span>}
                </div>
                {t.track && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', textTransform: 'capitalize' as const }}>{t.track}</span>}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

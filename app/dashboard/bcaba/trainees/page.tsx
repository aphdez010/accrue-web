'use client';
import { useEffect, useState, useMemo } from 'react';
import { useApi } from '../../../context/api-context';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad(n: number) { return n < 10 ? '0' + n : String(n); }

type Trainee = { id: number; full_name: string; fieldwork_type: string; target_hours: number };

export default function SupervisorTraineesPage() {
  const { get } = useApi();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [selectedTraineeId, setSelectedTraineeId] = useState<number | null>(null);
  const [loadingTrainees, setLoadingTrainees] = useState(true);
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [compliance, setCompliance] = useState<any>(null);
  const [err, setErr] = useState('');

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const monthYear = `${viewYear}-${pad(viewMonth + 1)}-01`;
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  useEffect(() => {
    get('/bcaba/supervisor/trainees').then((r: any) => {
      const list = Array.isArray(r) ? r : [];
      setTrainees(list);
      if (list.length > 0) setSelectedTraineeId(list[0].id);
    }).catch(() => {}).finally(() => setLoadingTrainees(false));
  }, []);

  useEffect(() => {
    if (!selectedTraineeId) return;
    setErr('');
    get('/bcaba/trainees/' + selectedTraineeId + '/monthly/' + monthYear).then((r: any) => {
      setEntries(Array.isArray(r?.entries) ? r.entries : []);
      setSummary(r?.summary || null);
      setCompliance(r?.compliance || null);
    }).catch((e: any) => setErr(e.message || 'Could not load entries'));
  }, [selectedTraineeId, viewYear, viewMonth]);

  const unrestrictedPct = summary ? Math.round((summary.unrestrictedPct || 0) * 100) : 0;

  const hoursByDay = useMemo(() => {
    const map: Record<number, { total: number; restrictionTypes: Set<string>; supFormats: Set<string> }> = {};
    entries.forEach((e: any) => {
      const d = String(e.entry_date || '').slice(0, 10);
      const day = Number(d.slice(8, 10));
      if (!day) return;
      if (!map[day]) map[day] = { total: 0, restrictionTypes: new Set(), supFormats: new Set() };
      map[day].total += Number(e.hours || 0);
      if (e.restriction_type) map[day].restrictionTypes.add(e.restriction_type);
      if (e.supervision_format) map[day].supFormats.add(e.supervision_format);
    });
    return map;
  }, [entries]);

  const calendarCells = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  function goPrevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function goNextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }
  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  const todayStr = today.toISOString().slice(0, 10);
  const isCurrentMonthView = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const selectedTrainee = trainees.find(t => t.id === selectedTraineeId);

  return (
    <div style={{ padding: isMobile ? '20px 16px' : 40, maxWidth: 960, width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>My Trainees</p>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 24px' }}>Trainee Fieldwork Calendar</h1>

      {loadingTrainees ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading trainees...</p>
      ) : trainees.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>No trainees are currently assigned to you as supervisor.</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 24, minWidth: 0, maxWidth: 320 }}>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 6 }}>Trainee</label>
            <select
              value={selectedTraineeId ?? ''}
              onChange={e => setSelectedTraineeId(Number(e.target.value))}
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', outline: 'none', cursor: 'pointer' }}
            >
              {trainees.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>

          {err && (
            <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid var(--amber)', borderRadius: 10, padding: '14px 18px', marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)', margin: 0 }}>{err}</p>
            </div>
          )}

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '16px 12px' : '24px 28px', marginBottom: 24, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap' as const, gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={goPrevMonth} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink)' }}>‹</button>
                <h2 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 600, color: 'var(--ink)', margin: 0, minWidth: 150, textAlign: 'center' as const }}>{monthLabel}</h2>
                <button onClick={goNextMonth} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink)' }}>›</button>
              </div>
              {!isCurrentMonthView && (
                <button onClick={goToday} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>Today</button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: isMobile ? 4 : 6, marginBottom: 8 }}>
              {WEEKDAYS.map(w => (
                <div key={w} style={{ textAlign: 'center' as const, fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, color: 'var(--muted)', padding: '4px 0' }}>{isMobile ? w.slice(0, 1) : w}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: isMobile ? 4 : 6 }}>
              {calendarCells.map((day, i) => {
                if (day === null) return <div key={i} />;
                const iso = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
                const dayData = hoursByDay[day];
                const isToday = iso === todayStr;
                return (
                  <div
                    key={i}
                    style={{
                      aspectRatio: '1',
                      minHeight: isMobile ? 44 : 64,
                      border: isToday ? '1px solid var(--spruce)' : '1px solid var(--border)',
                      borderRadius: 8,
                      background: dayData ? 'rgba(26,122,80,0.06)' : 'var(--bg)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                      gap: 2,
                    }}
                  >
                    <span style={{ fontFamily: 'var(--mono)', fontSize: isMobile ? 11 : 12, color: isToday ? 'var(--spruce)' : 'var(--ink)', fontWeight: isToday ? 700 : 400 }}>{day}</span>
                    {dayData && (
                      <>
                        <span style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 10 : 12, fontWeight: 600, color: 'var(--spruce)' }}>{dayData.total.toFixed(1)}h</span>
                        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
                          {Array.from(dayData.restrictionTypes).map((r: string) => (
                            <span key={r} title={r === 'unrestricted' ? 'Unrestricted' : 'Restricted'} style={{ fontFamily: 'var(--mono)', fontSize: 8, lineHeight: 1, padding: '1px 3px', borderRadius: 3, background: r === 'unrestricted' ? 'rgba(26,122,80,0.15)' : 'rgba(0,0,0,0.06)', color: r === 'unrestricted' ? 'var(--spruce)' : 'var(--muted)' }}>
                              {r === 'unrestricted' ? 'U' : 'R'}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Total Hours</p>
              <p style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>{summary ? Number(summary.totalHours).toFixed(1) : '0.0'}</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Unrestricted %</p>
              <p style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 600, color: unrestrictedPct >= 40 ? 'var(--spruce)' : 'var(--amber)', margin: 0, lineHeight: 1 }}>{unrestrictedPct}%</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Target Hours</p>
              <p style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1.3 }}>{selectedTrainee?.target_hours ?? '—'}</p>
            </div>
          </div>

          {compliance && !compliance.compliant && compliance.issues?.length > 0 && (
            <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid var(--amber)', borderRadius: 10, padding: '14px 18px', marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)', margin: 0 }}>
                Open items this month: {compliance.issues.map((i: string) => i.replace(/_/g, ' ')).join(', ')}
              </p>
            </div>
          )}

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '16px 12px' : '28px 32px', minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 20 }}>{monthLabel} — Entries</p>
            {entries.length === 0 ? (
              <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', padding: '16px 0' }}>No entries yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: isMobile ? 11 : 13 }}>
                  <thead>
                    <tr>{['Date', 'Type', 'Format', 'Hours', 'Restriction', 'Client', 'Supervisor'].map(h => (
                      <th key={h} style={{ textAlign: 'left' as const, fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', paddingBottom: 12, borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {entries.map((e, i) => (
                      <tr key={e.id || i} style={{ borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>{String(e.entry_date || '').slice(0, 10)}</td>
                        <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{e.entry_type}</td>
                        <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{e.supervision_format}</td>
                        <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--display)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{Number(e.hours || 0).toFixed(1)}</td>
                        <td style={{ padding: '12px 16px 12px 0' }}>
                          <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontFamily: 'var(--mono)', background: e.restriction_type === 'unrestricted' ? 'rgba(26,122,80,0.1)' : 'rgba(0,0,0,0.05)', color: e.restriction_type === 'unrestricted' ? 'var(--spruce)' : 'var(--muted)' }}>{e.restriction_type || '-'}</span>
                        </td>
                        <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{e.client_present ? 'Yes' : 'No'}</td>
                        <td style={{ padding: '12px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{e.supervisor_present ? 'Present' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
'use client';
import { useEffect, useState, useMemo } from 'react';
import { useApi } from '../../context/api-context';

const ENTRY_TYPES = ['supervised', 'observation'];
const SUP_FORMATS = ['individual', 'group'];
const RESTRICTION_TYPES = ['unrestricted', 'restricted'];
const SYNC_TYPES = ['asynchronous', 'synchronized'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const inp = { width: '100%', maxWidth: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' as const, WebkitAppearance: 'none' as const };
const lbl = { display: 'block' as const, fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 6 };

const TRAINEE_ID = 1;
const SUPERVISOR_ID = 1;

function pad(n: number) { return n < 10 ? '0' + n : String(n); }

export default function BcabaPage() {
  const { get, post } = useApi();
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [compliance, setCompliance] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const monthYear = `${viewYear}-${pad(viewMonth + 1)}-01`;
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState('');
  const [entryType, setEntryType] = useState('supervised');
  const [supFormat, setSupFormat] = useState('individual');
  const [restrictionType, setRestrictionType] = useState('unrestricted');
  const [clientPresent, setClientPresent] = useState(false);
  const [entrySyncType, setEntrySyncType] = useState('synchronized');
  const [supervisorPresent, setSupervisorPresent] = useState(false);
  const [notes, setNotes] = useState('');

  const load = () => get('/bcaba/trainees/' + TRAINEE_ID + '/monthly/' + monthYear).then((r: any) => {
    setEntries(Array.isArray(r?.entries) ? r.entries : []);
    setSummary(r?.summary || null);
    setCompliance(r?.compliance || null);
  }).catch(() => {});

  useEffect(() => { load(); }, [viewYear, viewMonth]);

  async function submit() {
    if (!date || !hours) return;
    setBusy(true); setErr('');
    try {
      await post('/bcaba/fieldwork-entries', {
        traineeId: TRAINEE_ID,
        supervisorId: SUPERVISOR_ID,
        entryDate: date,
        entryType,
        hours: parseFloat(hours),
        activityCategory: 'direct_client_work',
        supervisionFormat: supFormat,
        notes: notes || null,
        restrictionType,
        clientPresent,
        entrySyncType,
        supervisorPresent,
      });
      setHours(''); setNotes(''); setClientPresent(false); setSupervisorPresent(false);
      setOk(true); setTimeout(() => setOk(false), 3000);
      load();
    } catch (e: any) { setErr(e.message || 'Error'); }
    finally { setBusy(false); }
  }

  const unrestrictedPct = summary ? Math.round((summary.unrestrictedPct || 0) * 100) : 0;

  const hoursByDay = useMemo(() => {
    const map: Record<number, { total: number; unrestricted: number; restricted: number; count: number; restrictionTypes: Set<string>; supFormats: Set<string> }> = {};
    entries.forEach((e: any) => {
      const d = String(e.entry_date || '').slice(0, 10);
      const day = Number(d.slice(8, 10));
      if (!day) return;
      if (!map[day]) map[day] = { total: 0, unrestricted: 0, restricted: 0, count: 0, restrictionTypes: new Set(), supFormats: new Set() };
      map[day].total += Number(e.hours || 0);
      if (e.restriction_type === 'unrestricted') map[day].unrestricted += Number(e.hours || 0);
      if (e.restriction_type === 'restricted') map[day].restricted += Number(e.hours || 0);
      map[day].count += 1;
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

  function selectDay(day: number) {
    const iso = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    setDate(iso);
    const form = document.getElementById('bcaba-log-form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const todayStr = today.toISOString().slice(0, 10);
  const isCurrentMonthView = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <div style={{ padding: isMobile ? '20px 16px' : 40, maxWidth: 960, width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>BCaBA Fieldwork</p>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 24px' }}>Fieldwork Calendar</h1>

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
            <div key={w} style={{ textAlign: 'center' as const, fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', padding: '4px 0' }}>{isMobile ? w.slice(0, 1) : w}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: isMobile ? 4 : 6 }}>
          {calendarCells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const iso = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
            const dayData = hoursByDay[day];
            const isToday = iso === todayStr;
            const isSelected = iso === date;
            return (
              <button
                key={i}
                onClick={() => selectDay(day)}
                style={{
                  minHeight: isMobile ? 60 : 86,
                  border: isSelected ? '2px solid var(--spruce)' : isToday ? '1px solid var(--spruce)' : '1px solid var(--border)',
                  borderRadius: 8,
                  background: dayData ? 'rgba(26,122,80,0.06)' : 'var(--bg)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                  gap: 2,
                  position: 'relative' as const,
                }}
              >
                <span style={{ fontFamily: 'var(--mono)', fontSize: isMobile ? 11 : 12, color: isToday ? 'var(--spruce)' : 'var(--ink)', fontWeight: isToday ? 700 : 400 }}>{day}</span>
                {dayData && (
                  <>
                    <span style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 10 : 12, fontWeight: 600, color: 'var(--spruce)' }}>{dayData.total.toFixed(1)}h</span>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 2, alignItems: 'center', width: '100%' }}>
                      {Array.from(dayData.restrictionTypes).map((r: string) => (
                        <span key={r} style={{ fontFamily: 'var(--mono)', fontSize: 8.5, lineHeight: 1.3, padding: '1px 6px', borderRadius: 4, whiteSpace: 'nowrap' as const, background: r === 'unrestricted' ? 'rgba(26,122,80,0.15)' : 'rgba(0,0,0,0.06)', color: r === 'unrestricted' ? 'var(--spruce)' : 'var(--muted)' }}>
                          {r === 'unrestricted' ? 'Unrestricted' : 'Restricted'}
                        </span>
                      ))}
                      {Array.from(dayData.supFormats).map((f: string) => (
                        <span key={f} style={{ fontFamily: 'var(--mono)', fontSize: 8.5, lineHeight: 1.3, padding: '1px 6px', borderRadius: 4, whiteSpace: 'nowrap' as const, background: 'rgba(45,143,214,0.12)', color: 'var(--sky)' }}>
                          {f === 'individual' ? 'Individual' : 'Group'}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' as const }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(26,122,80,0.15)', border: '1px solid var(--border)' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>Hours logged</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, border: '1px solid var(--spruce)' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>Today</span>
          </div>
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
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Individual / Group</p>
          <p style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1.3 }}>
            {summary ? Number(summary.individualHours).toFixed(1) : '0.0'} / {summary ? Number(summary.groupHours).toFixed(1) : '0.0'}
          </p>
        </div>
      </div>

      {compliance && !compliance.compliant && compliance.issues?.length > 0 && (
        <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid var(--amber)', borderRadius: 10, padding: '14px 18px', marginBottom: 24 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)', margin: 0 }}>
            Open items this month: {compliance.issues.map((i: string) => i.replace(/_/g, ' ')).join(', ')}
          </p>
        </div>
      )}

      <div id="bcaba-log-form" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '20px 16px' : '28px 32px', marginBottom: 24, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 20 }}>Log Entry — {date}</p>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
          </div>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Hours</label>
            <input type="number" step="0.25" min="0" placeholder="e.g. 4" value={hours} onChange={e => setHours(e.target.value)} style={inp} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Entry Type</label>
            <select value={entryType} onChange={e => setEntryType(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {ENTRY_TYPES.map(t => <option key={t} value={t}>{t === 'supervised' ? 'Supervised session' : 'Observation'}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Supervision Format</label>
            <select value={supFormat} onChange={e => setSupFormat(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {SUP_FORMATS.map(f => <option key={f} value={f}>{f === 'individual' ? 'Individual' : 'Group'}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Entry Sync Type</label>
            <select value={entrySyncType} onChange={e => setEntrySyncType(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {SYNC_TYPES.map(s => <option key={s} value={s}>{s === 'asynchronous' ? 'Asynchronous' : 'Synchronized'}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {RESTRICTION_TYPES.map(r => (
            <button key={r} onClick={() => setRestrictionType(r)} style={{ flex: 1, border: '1px solid var(--border)', background: restrictionType === r ? 'var(--spruce)' : 'transparent', color: restrictionType === r ? '#fff' : 'var(--muted)', font: '600 12px var(--sans)', padding: '10px 12px', borderRadius: 8, cursor: 'pointer' }}>
              {r === 'unrestricted' ? 'Unrestricted' : 'Restricted'}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div onClick={() => setClientPresent(s => !s)} style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid ' + (clientPresent ? 'var(--spruce)' : 'var(--border)'), background: clientPresent ? 'var(--spruce)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              {clientPresent && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>Client present during this session</span>
          </label>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div onClick={() => setSupervisorPresent(s => !s)} style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid ' + (supervisorPresent ? 'var(--spruce)' : 'var(--border)'), background: supervisorPresent ? 'var(--spruce)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              {supervisorPresent && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>Supervisor present</span>
          </label>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Notes (optional)</label>
          <input placeholder="Any additional notes" value={notes} onChange={e => setNotes(e.target.value)} style={inp} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
          <button onClick={submit} disabled={busy || !hours || !date} style={{ background: busy ? 'var(--muted)' : 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 28px', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '.06em', cursor: busy ? 'not-allowed' : 'pointer' }}>
            {busy ? 'Logging...' : 'Log Entry'}
          </button>
          {ok && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--spruce)' }}>✓ Entry logged</span>}
          {err && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)' }}>{err}</span>}
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '16px 12px' : '28px 32px', minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 20 }}>{monthLabel} — Entries</p>
        {entries.length === 0 ? (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', padding: '16px 0' }}>No entries yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' as const }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: isMobile ? 11 : 13 }}>
              <thead>
                <tr>{['Date', 'Type', 'Format', 'Hours', 'Restriction', 'Client'].map(h => (
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
                    <td style={{ padding: '12px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{e.client_present ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
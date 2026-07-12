'use client';
import { useEffect, useState, useMemo } from 'react';
import { useApi } from '../../context/api-context';

const TYPES = ['Unrestricted Hours','Restricted Hours','Experience — Other'];
const SETTINGS = ['Home','Center','School','Community','Telehealth','Other'];
const SUP_FORMATS = ['In person','Virtual','With Client','N/A'];
const SYNC_TYPES = ['Asynchronous','Synchronized'];
const GROUP_TYPES = ['Individual','Group'];
const TASK_AREAS = [
  'A. Measurement','B. Skill Acquisition','C. Behavior Reduction',
  'D. Documentation & Reporting','E. Professional Conduct',
  'F. Behavior Assessment','G. Behavior-Change Procedures',
  'H. Selecting & Implementing Interventions','I. Personnel Supervision',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const inp = { width: '100%', maxWidth: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' as const, WebkitAppearance: 'none' as const };
const lbl = { display: 'block' as const, fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 6 };

function pad(n: number) { return n < 10 ? '0' + n : String(n); }

function calcHours(start: string, end: string) {
  if (!start || !end) return '';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? (diff / 60).toFixed(2) : '';
}

export default function FieldworkPage() {
  const { get, post, patch } = useApi();
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const [track, setTrackState] = useState<'supervised' | 'concentrated'>('supervised');
  const [trackBusy, setTrackBusy] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    get('/professionals/me').then((pro: any) => {
      if (pro?.bcba_supervision_track === 'concentrated') setTrackState('concentrated');
    }).catch(() => {});
  }, []);

  async function setTrack(newTrack: 'supervised' | 'concentrated') {
    if (newTrack === track || trackBusy) return;
    setTrackBusy(true);
    try {
      await patch('/professionals/track', { track: newTrack });
      setTrackState(newTrack);
    } catch {}
    finally { setTrackBusy(false); }
  }

  const targetHours = track === 'concentrated' ? 1500 : 2000;

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const monthParam = `${viewYear}-${pad(viewMonth + 1)}`;
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hours, setHours] = useState('');
  const [type, setType] = useState('Unrestricted Hours');
  const [entrySyncType, setEntrySyncType] = useState('Synchronized');
  const [supervised, setSupervised] = useState(false);
  const [supervisorName, setSupervisorName] = useState('');
  const [supFormat, setSupFormat] = useState('In person');
  const [supervisionGroupType, setSupervisionGroupType] = useState('Individual');
  const [supervisorPresent, setSupervisorPresent] = useState(false);
  const [setting, setSetting] = useState('Center');
  const [activityDesc, setActivityDesc] = useState('');
  const [taskArea, setTaskArea] = useState('');
  const [taskAreaNum, setTaskAreaNum] = useState('');
  const [monthlyObs, setMonthlyObs] = useState(false);
  const [observationMinutes, setObservationMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [entryFieldworkType, setEntryFieldworkType] = useState<'supervised' | 'concentrated'>(track);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  useEffect(() => {
    if (!editingId) setEntryFieldworkType(track);
  }, [track, editingId]);

  function startEdit(e: any) {
    setEditingId(e.id);
    setDate(String(e.entry_date || '').slice(0, 10));
    setStartTime(e.start_time || '');
    setEndTime(e.end_time || '');
    setHours(e.hours != null ? String(e.hours) : '');
    setType(e.experience_type || 'Unrestricted Hours');
    setEntrySyncType(e.entry_sync_type || 'Synchronized');
    setSupervised(!!e.supervised);
    setSupervisorName(e.supervisor_name || '');
    setSupFormat(e.supervision_format || 'In person');
    setSupervisionGroupType(e.supervision_group_type || 'Individual');
    setSupervisorPresent(!!e.supervisor_present);
    setSetting(e.setting || 'Center');
    setActivityDesc(e.activity_description || '');
    setTaskArea(e.task_list_area || '');
    setTaskAreaNum(e.task_list_area_number != null ? String(e.task_list_area_number) : '');
    setMonthlyObs(!!e.monthly_observation);
    setObservationMinutes(e.observation_minutes != null ? String(e.observation_minutes) : '');
    setNotes(e.notes || '');
    setEntryFieldworkType(e.fieldwork_type === 'concentrated' ? 'concentrated' : 'supervised');
    const form = document.getElementById('fieldwork-log-form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cancelEdit() {
    setEditingId(null);
    setDate(new Date().toISOString().slice(0, 10));
    setType('Unrestricted Hours');
    setEntrySyncType('Synchronized');
    setSupFormat('In person');
    setSupervisionGroupType('Individual');
    setSupervisorPresent(false);
    setSetting('Center');
    setHours(''); setStartTime(''); setEndTime(''); setNotes('');
    setActivityDesc(''); setTaskArea(''); setTaskAreaNum('');
    setSupervised(false); setMonthlyObs(false);
    setObservationMinutes('');
    setSupervisorName('');
    setEntryFieldworkType(track);
  }

  useEffect(() => {
    if (startTime && endTime) {
      const h = calcHours(startTime, endTime);
      if (h) setHours(h);
    }
  }, [startTime, endTime]);

  const load = () => get('/fieldwork?month=' + monthParam).then((r: any) => {
    const list = Array.isArray(r) ? r : Array.isArray(r?.entries) ? r.entries : [];
    setEntries(list);
    setTotal(list.reduce((s: number, e: any) => s + Number(e.hours || 0), 0));
  }).catch(() => {});

  useEffect(() => { load(); }, [viewYear, viewMonth]);

  async function submit() {
    if (!date || !hours) return;
    setBusy(true); setErr('');
    try {
      const body = {
        entry_date: date, hours: parseFloat(hours), experience_type: type,
        supervised, notes: notes || null,
        activity_description: activityDesc || null,
        start_time: startTime || null, end_time: endTime || null,
        setting, supervision_format: supervised ? supFormat : null,
        task_list_area: taskArea || null,
        task_list_area_number: taskAreaNum ? parseInt(taskAreaNum) : null,
        monthly_observation: monthlyObs,
        observation_minutes: monthlyObs && observationMinutes ? parseInt(observationMinutes) : null,
        entry_sync_type: entrySyncType,
        supervisor_present: supervisorPresent,
        supervisor_name: supervised ? (supervisorName || null) : null,
        supervision_group_type: supervised ? supervisionGroupType : null,
        fieldwork_type: entryFieldworkType,
      };
      if (editingId) {
        await patch('/fieldwork/' + editingId, body);
      } else {
        await post('/fieldwork', body);
      }
      setEditingId(null);
      setHours(''); setStartTime(''); setEndTime(''); setNotes('');
      setActivityDesc(''); setTaskArea(''); setTaskAreaNum('');
      setSupervised(false); setMonthlyObs(false); setObservationMinutes('');
      setSupervisorName('');
      setOk(true); setTimeout(() => setOk(false), 3000);
      load();
    } catch (e: any) { setErr(e.message || 'Error'); }
    finally { setBusy(false); }
  }

  const derivedStats = useMemo(() => {
    const totalHours = entries.reduce((s, e) => s + Number(e.hours || 0), 0);
    const unrestrictedHours = entries.filter(e => e.experience_type === 'Unrestricted Hours').reduce((s, e) => s + Number(e.hours || 0), 0);
    const individualHours = entries.filter(e => e.supervised && e.supervision_group_type === 'Individual').reduce((s, e) => s + Number(e.hours || 0), 0);
    const groupHours = entries.filter(e => e.supervised && e.supervision_group_type === 'Group').reduce((s, e) => s + Number(e.hours || 0), 0);
    const unrestrictedPct = totalHours > 0 ? Math.round((unrestrictedHours / totalHours) * 100) : 0;
    return { totalHours, unrestrictedPct, individualHours, groupHours };
  }, [entries]);

  const hoursByDay = useMemo(() => {
    const map: Record<number, { total: number; count: number; types: Set<string>; groupTypes: Set<string> }> = {};
    entries.forEach((e: any) => {
      const d = String(e.entry_date || '').slice(0, 10);
      const day = Number(d.slice(8, 10));
      if (!day) return;
      if (!map[day]) map[day] = { total: 0, count: 0, types: new Set(), groupTypes: new Set() };
      map[day].total += Number(e.hours || 0);
      map[day].count += 1;
      if (e.experience_type) map[day].types.add(e.experience_type);
      if (e.supervised && e.supervision_group_type) map[day].groupTypes.add(e.supervision_group_type);
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
    const form = document.getElementById('fieldwork-log-form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const todayStr = today.toISOString().slice(0, 10);
  const isCurrentMonthView = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <div style={{ padding: isMobile ? '20px 16px' : 40, maxWidth: 960, width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Fieldwork</p>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 20px' }}>Fieldwork Calendar</h1>

      {/* Fieldwork track toggle */}
      <div style={{ display: 'inline-flex', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 3, marginBottom: 24, gap: 2 }}>
        <button onClick={() => setTrack('supervised')} disabled={trackBusy} style={{ border: 0, background: track === 'supervised' ? 'var(--spruce)' : 'transparent', color: track === 'supervised' ? '#fff' : 'var(--muted)', font: '600 12px var(--sans)', padding: '8px 16px', borderRadius: 8, cursor: trackBusy ? 'not-allowed' : 'pointer' }}>
          Supervised · 2,000 hrs
        </button>
        <button onClick={() => setTrack('concentrated')} disabled={trackBusy} style={{ border: 0, background: track === 'concentrated' ? 'var(--spruce)' : 'transparent', color: track === 'concentrated' ? '#fff' : 'var(--muted)', font: '600 12px var(--sans)', padding: '8px 16px', borderRadius: 8, cursor: trackBusy ? 'not-allowed' : 'pointer' }}>
          Concentrated · 1,500 hrs
        </button>
      </div>

      {/* Calendar */}
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
                      {Array.from(dayData.types).map((t: string) => (
                        <span key={t} style={{ fontFamily: 'var(--mono)', fontSize: 8.5, lineHeight: 1.3, padding: '1px 6px', borderRadius: 4, whiteSpace: 'nowrap' as const, background: t === 'Unrestricted Hours' ? 'rgba(26,122,80,0.15)' : 'rgba(0,0,0,0.06)', color: t === 'Unrestricted Hours' ? 'var(--spruce)' : 'var(--muted)' }}>
                          {t.replace(' Hours', '')}
                        </span>
                      ))}
                      {Array.from(dayData.groupTypes).map((g: string) => (
                        <span key={g} style={{ fontFamily: 'var(--mono)', fontSize: 8.5, lineHeight: 1.3, padding: '1px 6px', borderRadius: 4, whiteSpace: 'nowrap' as const, background: 'rgba(45,143,214,0.12)', color: 'var(--sky)' }}>
                          {g}
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

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Total Hours</p>
          <p style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>{derivedStats.totalHours.toFixed(1)}</p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{((derivedStats.totalHours / targetHours) * 100).toFixed(1)}% of {targetHours.toLocaleString()}</p>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Unrestricted %</p>
          <p style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 600, color: derivedStats.unrestrictedPct >= 60 ? 'var(--spruce)' : 'var(--amber)', margin: 0, lineHeight: 1 }}>{derivedStats.unrestrictedPct}%</p>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Individual / Group</p>
          <p style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1.3 }}>
            {derivedStats.individualHours.toFixed(1)} / {derivedStats.groupHours.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Log entry form */}
      <div id="fieldwork-log-form" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '20px 16px' : '28px 32px', marginBottom: 24, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 20 }}>{editingId ? 'Edit Entry' : 'Log Entry'} — {date}</p>

        {/* Row 1: Date + Start + End + Hours */}
        {isMobile ? (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div style={{ minWidth: 0 }}>
                <label style={lbl}>Start Time</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <label style={lbl}>End Time</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Hours</label>
              <input type="number" step="0.25" min="0" placeholder="Auto or manual" value={hours} onChange={e => setHours(e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
            </div>
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div style={{ minWidth: 0 }}><label style={lbl}>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} /></div>
            <div style={{ minWidth: 0 }}><label style={lbl}>Start Time</label><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inp} /></div>
            <div style={{ minWidth: 0 }}><label style={lbl}>End Time</label><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inp} /></div>
            <div style={{ minWidth: 0 }}><label style={lbl}>Hours</label><input type="number" step="0.25" min="0" placeholder="Auto or manual" value={hours} onChange={e => setHours(e.target.value)} style={inp} /></div>
          </div>
        )}

        {/* Row 2: Type + Entry Sync Type + Setting */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Experience Type</label>
            <select value={type} onChange={e => setType(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Entry Type</label>
            <select value={entrySyncType} onChange={e => setEntrySyncType(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {SYNC_TYPES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Setting</label>
            <select value={setting} onChange={e => setSetting(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {SETTINGS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Row 3: Activity Description */}
        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>Activity Description</label>
          <textarea value={activityDesc} onChange={e => setActivityDesc(e.target.value)} placeholder="Describe the activity (e.g. DTT with client, performance evaluation with feedback)" style={{ ...inp, minHeight: 72, resize: 'vertical' }} />
        </div>

        {/* Row 4: Task List Area */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Task List Area</label>
            <select value={taskArea} onChange={e => setTaskArea(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option value="">Select area...</option>
              {TASK_AREAS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Task List Item #</label>
            <input type="number" min="1" placeholder="e.g. 4" value={taskAreaNum} onChange={e => setTaskAreaNum(e.target.value)} style={inp} />
          </div>
        </div>

        {/* Row 5: Supervised toggle + format + group type */}
        <div style={{ display: 'grid', gridTemplateColumns: supervised ? 'repeat(auto-fit, minmax(160px, 1fr))' : '1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div onClick={() => setSupervised(s => !s)} style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid ' + (supervised ? 'var(--spruce)' : 'var(--border)'), background: supervised ? 'var(--spruce)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                {supervised && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>Supervised session</span>
            </label>
          </div>
          {supervised && (
            <div style={{ minWidth: 0 }}>
              <label style={lbl}>Supervision Format</label>
              <select value={supFormat} onChange={e => setSupFormat(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {SUP_FORMATS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          )}
          {supervised && (
            <div style={{ minWidth: 0 }}>
              <label style={lbl}>Supervision Type</label>
              <select value={supervisionGroupType} onChange={e => setSupervisionGroupType(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {GROUP_TYPES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          )}
        </div>

        {supervised && (
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>Supervisor Name</label>
            <input type="text" placeholder="e.g. Dr. Smith" value={supervisorName} onChange={e => setSupervisorName(e.target.value)} style={inp} />
          </div>
        )}

        {/* Supervisor Present */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div onClick={() => setSupervisorPresent(s => !s)} style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid ' + (supervisorPresent ? 'var(--spruce)' : 'var(--border)'), background: supervisorPresent ? 'var(--spruce)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              {supervisorPresent && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>Supervisor present</span>
          </label>
        </div>

        {/* Monthly observation + minutes */}
        <div style={{ display: 'grid', gridTemplateColumns: monthlyObs ? '1fr 200px' : '1fr', gap: 16, marginBottom: 20, alignItems: 'end' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div onClick={() => setMonthlyObs(s => !s)} style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid ' + (monthlyObs ? 'var(--spruce)' : 'var(--border)'), background: monthlyObs ? 'var(--spruce)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              {monthlyObs && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>Monthly observation (supervisor present)</span>
          </label>
          {monthlyObs && (
            <div style={{ minWidth: 0 }}>
              <label style={lbl}>Observation Minutes</label>
              <input type="number" min="0" placeholder="e.g. 30" value={observationMinutes} onChange={e => setObservationMinutes(e.target.value)} style={inp} />
            </div>
          )}
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Notes (optional)</label>
          <input type="text" placeholder="Any additional notes" value={notes} onChange={e => setNotes(e.target.value)} style={inp} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button onClick={submit} disabled={busy || !hours || !date} style={{ background: busy ? 'var(--muted)' : 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 28px', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '.06em', cursor: busy ? 'not-allowed' : 'pointer' }}>
            {busy ? (editingId ? 'Updating...' : 'Logging...') : (editingId ? 'Update Entry' : 'Log Entry')}
          </button>
          {editingId && (
            <button onClick={cancelEdit} style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 20px', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '.06em', cursor: 'pointer' }}>
              Cancel
            </button>
          )}
          {ok && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--spruce)' }}>✓ Entry logged</span>}
          {err && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)' }}>{err}</span>}
        </div>
      </div>

      {/* Entries table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '16px 12px' : '28px 32px', minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 20 }}>{monthLabel} — Entries</p>
        {entries.length === 0 ? (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', padding: '16px 0' }}>No entries yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? 11 : 13 }}>
            <thead>
              <tr>{['Date','Description','Setting','Hours','Supv','Task Area','Obs',''].map(h => (
                <th key={h} style={{ textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', paddingBottom: 12, borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id || i} style={{ borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>{String(e.entry_date||'').slice(0,10)}</td>
                  <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', maxWidth: 180 }}>{e.activity_description || e.experience_type || '—'}</td>
                  <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{e.setting || '—'}</td>
                  <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--display)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{Number(e.hours||0).toFixed(1)}</td>
                  <td style={{ padding: '12px 16px 12px 0' }}>
                    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontFamily: 'var(--mono)', background: e.supervised ? 'rgba(26,122,80,0.1)' : 'rgba(0,0,0,0.05)', color: e.supervised ? 'var(--spruce)' : 'var(--muted)' }}>{e.supervised ? e.supervision_format || 'Yes' : 'No'}</span>
                  </td>
                  <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{e.task_list_area ? `${e.task_list_area}${e.task_list_area_number ? ' #'+e.task_list_area_number : ''}` : '—'}</td>
                  <td style={{ padding: '12px 0', fontFamily: 'var(--mono)', fontSize: 11 }}>{e.monthly_observation ? <span style={{ color: 'var(--spruce)' }}>✓{e.observation_minutes ? ` ${e.observation_minutes}m` : ''}</span> : '—'}</td>
                  <td style={{ padding: '12px 0 12px 16px' }}>
                    <button onClick={() => startEdit(e)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', cursor: 'pointer' }}>
                      Edit
                    </button>
                  </td>
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
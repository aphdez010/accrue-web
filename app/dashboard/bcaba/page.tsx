'use client';
import { useEffect, useState, useMemo } from 'react';
import { useApi } from '../../context/api-context';

const ENTRY_TYPES = ['supervised', 'independent', 'observation'];
const SUP_FORMATS = ['individual', 'group'];
const RESTRICTION_TYPES = ['unrestricted', 'restricted'];
const SYNC_TYPES = ['asynchronous', 'synchronized'];
const SUP_MODALITIES = ['Face to Face', 'Video Call', 'With Client'];
const SETTINGS = ['Home', 'Center', 'School', 'Community', 'Telehealth', 'Other'];

// Curated loggable fieldwork activities (paraphrased, not BACB's copyrighted TCO
// text), grouped by the 6th-ed. Test Content Outline domains. Each carries a
// SUGGESTED restricted/unrestricted tag: restricted = direct implementation of
// services with a client; unrestricted = assessment, design, analysis,
// supervision, and admin. Suggestions only — the trainee confirms.
const ACTIVITY_LIBRARY: { label: string; type: 'restricted' | 'unrestricted' }[] = [
  { label: 'Direct implementation of a skill-acquisition program with a client', type: 'restricted' },
  { label: 'Direct implementation of a behavior intervention plan with a client', type: 'restricted' },
  { label: 'Running discrete-trial teaching (DTT) directly with a client', type: 'restricted' },
  { label: 'Running natural-environment teaching (NET) directly with a client', type: 'restricted' },
  { label: 'Directly implementing differential reinforcement with a client', type: 'restricted' },
  { label: 'Directly implementing prompting and prompt-fading with a client', type: 'restricted' },
  { label: 'Directly implementing chaining procedures with a client', type: 'restricted' },
  { label: 'Directly implementing a token economy with a client', type: 'restricted' },
  { label: 'Directly implementing extinction, response cost, or time-out with a client', type: 'restricted' },
  { label: 'Conducting a preference assessment directly with a client', type: 'restricted' },
  { label: 'Collecting data during a direct client session', type: 'restricted' },
  { label: 'Directly implementing discrimination training with a client', type: 'restricted' },
  { label: 'Conducting a functional behavior assessment (FBA)', type: 'unrestricted' },
  { label: 'Conducting a functional analysis', type: 'unrestricted' },
  { label: 'Conducting a skills assessment (e.g., VB-MAPP, ABLLS-R)', type: 'unrestricted' },
  { label: 'Designing or writing a skill-acquisition program', type: 'unrestricted' },
  { label: 'Designing or writing a behavior intervention plan (BIP)', type: 'unrestricted' },
  { label: 'Graphing client data', type: 'unrestricted' },
  { label: 'Interpreting graphed data and making data-based decisions', type: 'unrestricted' },
  { label: 'Selecting or designing a measurement / data-collection system', type: 'unrestricted' },
  { label: 'Creating operational definitions of behavior', type: 'unrestricted' },
  { label: 'Writing treatment or progress reports', type: 'unrestricted' },
  { label: 'Treatment planning and goal selection', type: 'unrestricted' },
  { label: 'Conducting a procedural-integrity / fidelity check', type: 'unrestricted' },
  { label: 'Training or supervising RBTs / behavior technicians', type: 'unrestricted' },
  { label: 'Delivering caregiver or parent training', type: 'unrestricted' },
  { label: 'Observing a session and providing performance feedback', type: 'unrestricted' },
  { label: 'Team meeting or case consultation', type: 'unrestricted' },
  { label: 'Reviewing records at the outset of a case', type: 'unrestricted' },
  { label: 'Selecting or recommending interventions based on assessment', type: 'unrestricted' },
  { label: 'Applying a single-case experimental design', type: 'unrestricted' },
  { label: 'Reviewing literature / professional development', type: 'unrestricted' },
  { label: 'Addressing an ethical consideration or case', type: 'unrestricted' },
  { label: 'Planning culturally responsive services', type: 'unrestricted' },
  { label: 'Modeling a procedure for staff (behavioral skills training)', type: 'unrestricted' },
  { label: 'Performance management of a supervisee', type: 'unrestricted' },
  { label: 'Designing or evaluating a preference assessment', type: 'unrestricted' },
  { label: 'Designing or evaluating a descriptive assessment', type: 'unrestricted' },
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const inp = { width: '100%', maxWidth: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' as const, WebkitAppearance: 'none' as const };
const lbl = { display: 'block' as const, fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 6 };

function pad(n: number) { return n < 10 ? '0' + n : String(n); }

export default function BcabaPage() {
  const { get, post, patch, del } = useApi();
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [compliance, setCompliance] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Real identity, resolved via /bcaba/me — NOT professionals.id, which is a
  // different table's primary key and does not correspond to bcaba_trainees.id.
  const [myTraineeId, setMyTraineeId] = useState<number | null>(null);
  const [loadingIdentity, setLoadingIdentity] = useState(true);
  const [responsibleSupervisorId, setResponsibleSupervisorId] = useState<number | null>(null);
  const [identityErr, setIdentityErr] = useState('');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setLoadingIdentity(true);
    get('/bcaba/me').then((trainee: any) => {
      if (!trainee?.id) {
        setIdentityErr('Could not determine your trainee record. Contact support if this persists.');
        return;
      }
      setMyTraineeId(trainee.id);
      if (trainee.fieldwork_type) { setFieldworkType(trainee.fieldwork_type); setTrackState(trainee.fieldwork_type === 'concentrated' ? 'concentrated' : 'supervised'); }
      return get('/bcaba/trainees/' + trainee.id + '/supervisors').then((r: any) => {
        const list = Array.isArray(r?.supervisors) ? r.supervisors : [];
        const responsible = list.find((s: any) => s.is_responsible_supervisor);
        if (responsible) setResponsibleSupervisorId(responsible.id);
        else setIdentityErr('No responsible supervisor is on file yet. Add one before logging hours.');
      });
    }).catch((e: any) => {
      console.error('Failed to resolve trainee/supervisor identity:', e);
      setIdentityErr(e?.message || 'Could not load your supervisor information. Please try again.');
    }).finally(() => setLoadingIdentity(false));
  }, []);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const monthYear = `${viewYear}-${pad(viewMonth + 1)}-01`;
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState('');
  const [entryType, setEntryType] = useState('supervised');
  const [fieldworkType, setFieldworkType] = useState('supervised');
  const [track, setTrackState] = useState<'supervised' | 'concentrated'>('supervised');
  const [trackBusy, setTrackBusy] = useState(false);
  const [supFormat, setSupFormat] = useState('individual');
  const [restrictionType, setRestrictionType] = useState('unrestricted');
  const [entrySyncType, setEntrySyncType] = useState('synchronized');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [supervisionModality, setSupervisionModality] = useState('Face to Face');
  const [supervisorName, setSupervisorName] = useState('');
  const [setting, setSetting] = useState('Center');
  const [observationMinutes, setObservationMinutes] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [suggestedType, setSuggestedType] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [combinedProgress, setCombinedProgress] = useState<any>(null);
  const [byType, setByType] = useState<any>(null);

  const load = () => {
    if (!myTraineeId) return;
    get('/bcaba/trainees/' + myTraineeId + '/monthly/' + monthYear).then((r: any) => {
      setEntries(Array.isArray(r?.entries) ? r.entries : []);
      setSummary(r?.summary || null);
      setCompliance(r?.compliance || null);
      setByType(r?.byType || null);
      setCombinedProgress(r?.combinedProgress || null);
    }).catch((e: any) => console.error('Failed to load monthly entries:', e));
  };

  useEffect(() => { load(); }, [viewYear, viewMonth, myTraineeId]);

  async function submit() {
    if (!date || !hours || !myTraineeId || !responsibleSupervisorId) return;
    setBusy(true); setErr('');
    try {
      const body = {
        traineeId: myTraineeId,
        supervisorId: responsibleSupervisorId,
        entryDate: date,
        entryType,
        hours: parseFloat(hours),
        activityCategory: 'direct_client_work',
        supervisionFormat: supFormat,
        activityDescription: activityDesc || null,
        notes: notes || null,
        restrictionType,
        entrySyncType,
        fieldworkType,
        startTime: startTime || null,
        endTime: endTime || null,
        supervisionModality: entryType !== 'independent' ? supervisionModality : null,
        supervisorName: entryType !== 'independent' ? (supervisorName || null) : null,
        setting: entryType === 'observation' ? setting : null,
        observationMinutes: entryType === 'observation' && observationMinutes ? parseInt(observationMinutes) : null,
      };
      if (editingId) {
        await patch('/bcaba/fieldwork-entries/' + editingId, body);
      } else {
        await post('/bcaba/fieldwork-entries', body);
      }
      cancelEdit();
      setOk(true); setTimeout(() => setOk(false), 3000);
      load();
    } catch (e: any) { setErr(e.message || 'Error'); }
    finally { setBusy(false); }
  }

  const calcHours = (s: string, en: string) => {
    if (!s || !en) return;
    const [sh, sm] = s.split(':').map(Number);
    const [eh, em] = en.split(':').map(Number);
    if ([sh, sm, eh, em].some(n => isNaN(n))) return;
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    if (mins > 0) setHours(String(Math.round((mins / 60) * 100) / 100));
  };

  function pickActivity(val: string) {
    const match = ACTIVITY_LIBRARY.find(a => a.label === val);
    if (match) { setActivityDesc(val); setRestrictionType(match.type); setSuggestedType(match.type); }
  }

  async function changeTrack(newTrack: 'supervised' | 'concentrated') {
    if (newTrack === track || trackBusy || !myTraineeId) return;
    setTrackBusy(true); setErr('');
    try {
      await patch('/bcaba/trainees/' + myTraineeId + '/track', { track: newTrack });
      setTrackState(newTrack);
      setFieldworkType(newTrack);
      load();
    } catch (e: any) {
      setErr(e.message || 'Failed to change track');
    } finally {
      setTrackBusy(false);
    }
  }

  function startEdit(e: any) {
    setEditingId(e.id);
    setDate(String(e.entry_date || '').slice(0, 10));
    setHours(e.hours != null ? String(e.hours) : '');
    setEntryType(e.entry_type || 'supervised');
    setFieldworkType(e.fieldwork_type || 'supervised');
    setSupFormat(e.supervision_format || 'individual');
    setRestrictionType(e.restriction_type || 'unrestricted');
    setEntrySyncType(e.entry_sync_type || 'synchronized');
    setStartTime(e.start_time || '');
    setEndTime(e.end_time || '');
    setSupervisionModality(e.supervision_modality || 'Face to Face');
    setSupervisorName(e.supervisor_name || '');
    setSetting(e.setting || 'Center');
    setObservationMinutes(e.observation_minutes != null ? String(e.observation_minutes) : '');
    setActivityDesc(e.activity_description || '');
    setNotes(e.notes || '');
    const form = document.getElementById('bcaba-log-form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cancelEdit() {
    setEditingId(null);
    setHours(''); setNotes('');
    setActivityDesc(''); setSuggestedType(null);
    setEntryType('supervised'); setSupFormat('individual'); setRestrictionType('unrestricted');
    setEntrySyncType('synchronized');
    setStartTime(''); setEndTime(''); setSupervisionModality('Face to Face'); setSupervisorName(''); setSetting('Center'); setObservationMinutes('');
    setFieldworkType(track);
  }

  async function deleteEntry(id: number | string) {
    if (!confirm('Delete this fieldwork entry? This cannot be undone.')) return;
    try {
      await del('/bcaba/fieldwork-entries/' + id);
      load();
    } catch (e: any) {
      setErr(e.message || 'Failed to delete entry');
    }
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
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px' }}>Fieldwork Calendar</h1>

      <div style={{ display: 'inline-flex', gap: 4, background: 'var(--bg)', padding: 4, borderRadius: 10, marginBottom: 24 }}>
        <button onClick={() => changeTrack('supervised')} disabled={trackBusy} style={{ border: 0, background: track === 'supervised' ? 'var(--spruce)' : 'transparent', color: track === 'supervised' ? '#fff' : 'var(--muted)', font: '600 12px var(--sans)', padding: '8px 16px', borderRadius: 8, cursor: trackBusy ? 'not-allowed' : 'pointer' }}>
          Supervised · 1,300 hrs
        </button>
        <button onClick={() => changeTrack('concentrated')} disabled={trackBusy} style={{ border: 0, background: track === 'concentrated' ? 'var(--spruce)' : 'transparent', color: track === 'concentrated' ? '#fff' : 'var(--muted)', font: '600 12px var(--sans)', padding: '8px 16px', borderRadius: 8, cursor: trackBusy ? 'not-allowed' : 'pointer' }}>
          Concentrated · 1,000 hrs
        </button>
      </div>

      {identityErr && (
        <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid var(--amber)', borderRadius: 10, padding: '14px 18px', marginBottom: 24 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)', margin: 0 }}>{identityErr}</p>
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
          <p style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>
            {summary ? Number(summary.totalHours).toFixed(1) : '0.0'}
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 400, color: 'var(--muted)', marginLeft: 6 }}>/ 130 max</span>
          </p>
          <div style={{ height: 5, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden', marginTop: 12 }}>
            <div style={{ width: Math.min(100, ((summary ? Number(summary.totalHours) : 0) / 130) * 100) + '%', height: '100%', background: (summary ? Number(summary.totalHours) : 0) > 130 ? 'var(--amber)' : 'var(--spruce)', borderRadius: 3 }} />
          </div>
          {summary && Number(summary.totalHours) > 130 && (
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--amber)', margin: '7px 0 0', lineHeight: 1.4 }}>{(Number(summary.totalHours) - 130).toFixed(1)} hrs over the monthly cap — only 130 count this month</p>
          )}
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Supervised</p>
          <p style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>{summary ? Number(summary.supervisedHours).toFixed(1) : '0.0'}<span style={{ fontSize: 14, color: 'var(--muted)', marginLeft: 4 }}>hrs</span></p>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Independent</p>
          <p style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>{summary ? Number(summary.independentHours).toFixed(1) : '0.0'}<span style={{ fontSize: 14, color: 'var(--muted)', marginLeft: 4 }}>hrs</span></p>
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

      {combinedProgress && (combinedProgress.supervisedHours > 0 || combinedProgress.concentratedHours > 0) && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '16px 12px' : '20px 28px', marginBottom: 24, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 10 }}>All-Time Combined Progress</p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: '0 0 8px' }}>
            {Number(combinedProgress.supervisedHours).toFixed(1)} Supervised hrs + {Number(combinedProgress.concentratedHours).toFixed(1)} Concentrated hrs × 1.3 = <strong style={{ color: 'var(--ink)' }}>{Number(combinedProgress.combinedTotal).toFixed(1)}</strong> hrs toward your {track === 'concentrated' ? '1,000' : '1,300'}-hr target
          </p>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--bg)', overflow: 'hidden' as const }}>
            <div style={{ height: '100%', width: `${Math.min(100, (combinedProgress.combinedTotal / (track === 'concentrated' ? 1000 : 1300)) * 100)}%`, background: combinedProgress.meetsRequirement ? 'var(--spruce)' : 'var(--sky)' }} />
          </div>
        </div>
      )}

      {compliance && !compliance.compliant && compliance.issues?.length > 0 && (
        <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid var(--amber)', borderRadius: 10, padding: '14px 18px', marginBottom: 24 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)', margin: 0 }}>
            Open items this month: {compliance.issues.map((i: string) => i.replace(/_/g, ' ')).join(', ')}
          </p>
        </div>
      )}

      {byType && byType.supervised.summary.totalHours > 0 && byType.concentrated.summary.totalHours > 0 && (
        <div style={{ background: 'rgba(45,143,214,0.06)', border: '1px solid var(--sky)', borderRadius: 10, padding: '14px 18px', marginBottom: 24 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--sky)', margin: '0 0 8px' }}>
            You logged both tracks this month — each is checked against its own rules:
          </p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: '0 0 4px' }}>
            Supervised: {Number(byType.supervised.summary.totalHours).toFixed(1)} hrs — {byType.supervised.compliance.compliant ? 'compliant' : `open: ${byType.supervised.compliance.issues.map((i: string) => i.replace(/_/g, ' ')).join(', ')}`}
          </p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: 0 }}>
            Concentrated: {Number(byType.concentrated.summary.totalHours).toFixed(1)} hrs — {byType.concentrated.compliance.compliant ? 'compliant' : `open: ${byType.concentrated.compliance.issues.map((i: string) => i.replace(/_/g, ' ')).join(', ')}`}
          </p>
        </div>
      )}

      <div id="bcaba-log-form" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '20px 16px' : '28px 32px', marginBottom: 24, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 20 }}>{editingId ? 'Edit Entry' : 'Log Entry'} — {date}</p>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
          </div>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Start Time</label>
            <input type="time" value={startTime} onChange={e => { setStartTime(e.target.value); calcHours(e.target.value, endTime); }} style={inp} />
          </div>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>End Time</label>
            <input type="time" value={endTime} onChange={e => { setEndTime(e.target.value); calcHours(startTime, e.target.value); }} style={inp} />
          </div>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Hours</label>
            <input type="number" step="0.25" min="0" placeholder="e.g. 4" value={hours} onChange={e => setHours(e.target.value)} style={inp} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Session Type</label>
            <select value={entryType} onChange={e => setEntryType(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {ENTRY_TYPES.map(t => <option key={t} value={t}>{t === 'supervised' ? 'Supervised session' : t === 'independent' ? 'Independent (unsupervised)' : 'Observation'}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Supervision Format</label>
            <select value={supervisionModality} onChange={e => setSupervisionModality(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {SUP_MODALITIES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Individual or Group</label>
            <select value={supFormat} onChange={e => setSupFormat(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {SUP_FORMATS.map(f => <option key={f} value={f}>{f === 'individual' ? 'Individual' : 'Group'}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Supervisor Name</label>
            <input placeholder="e.g. Dr. Smith" value={supervisorName} onChange={e => setSupervisorName(e.target.value)} style={inp} />
          </div>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Entry Sync Type</label>
            <select value={entrySyncType} onChange={e => setEntrySyncType(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {SYNC_TYPES.map(s => <option key={s} value={s}>{s === 'asynchronous' ? 'Asynchronous' : 'Synchronized'}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Quick pick activity — optional</label>
          <input list="bcaba-activity-list" placeholder="Type or choose a common activity to auto-suggest restricted/unrestricted..." onChange={e => pickActivity(e.target.value)} style={inp} />
          <datalist id="bcaba-activity-list">
            {ACTIVITY_LIBRARY.map(a => <option key={a.label} value={a.label} />)}
          </datalist>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>Activity Description</label>
          <textarea value={activityDesc} onChange={e => setActivityDesc(e.target.value)} placeholder="Describe the activity (e.g. DTT with client, performance evaluation with feedback)" style={{ ...inp, minHeight: 72, resize: 'vertical' as const }} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: suggestedType ? 6 : 16 }}>
          {RESTRICTION_TYPES.map(r => (
            <button key={r} onClick={() => { setRestrictionType(r); setSuggestedType(null); }} style={{ flex: 1, border: '1px solid var(--border)', background: restrictionType === r ? 'var(--spruce)' : 'transparent', color: restrictionType === r ? '#fff' : 'var(--muted)', font: '600 12px var(--sans)', padding: '10px 12px', borderRadius: 8, cursor: 'pointer' }}>
              {r === 'unrestricted' ? 'Unrestricted' : 'Restricted'}
            </button>
          ))}
        </div>
        {suggestedType && (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', margin: '0 0 16px', lineHeight: 1.4 }}>
            Suggested <strong style={{ color: 'var(--ink)' }}>{suggestedType}</strong> from the activity — a hint only; change it above if your clinical judgment differs.
          </p>
        )}

        {entryType === 'observation' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div style={{ minWidth: 0 }}>
              <label style={lbl}>Setting</label>
              <select value={setting} onChange={e => setSetting(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {SETTINGS.map(st => <option key={st}>{st}</option>)}
              </select>
            </div>
            <div style={{ minWidth: 0 }}>
              <label style={lbl}>Observation Time</label>
              <input type="number" min="0" placeholder="e.g. 30 min" value={observationMinutes} onChange={e => setObservationMinutes(e.target.value)} style={inp} />
            </div>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Notes (optional)</label>
          <input placeholder="Any additional notes" value={notes} onChange={e => setNotes(e.target.value)} style={inp} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
          <button onClick={submit} disabled={busy || !hours || !date || !myTraineeId || !responsibleSupervisorId} style={{ background: busy ? 'var(--muted)' : 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 28px', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '.06em', cursor: (busy || !myTraineeId || !responsibleSupervisorId) ? 'not-allowed' : 'pointer' }}>
            {busy ? (editingId ? 'Updating...' : 'Logging...') : loadingIdentity ? 'Loading...' : (editingId ? 'Update Entry' : 'Log Entry')}
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

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '16px 12px' : '28px 32px', minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 20 }}>{monthLabel} — Entries</p>
        {entries.length === 0 ? (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', padding: '16px 0' }}>No entries yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' as const }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: isMobile ? 11 : 13 }}>
              <thead>
                <tr>{['Date', 'Type', 'Track', 'Format', 'Hours', 'Restriction', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left' as const, fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', paddingBottom: 12, borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={e.id || i} style={{ borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>{String(e.entry_date || '').slice(0, 10)}</td>
                    <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{e.entry_type}</td>
                    <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{(e.fieldwork_type || 'supervised') === 'concentrated' ? 'Concentrated' : 'Supervised'}</td>
                    <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{e.supervision_format}</td>
                    <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--display)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{Number(e.hours || 0).toFixed(1)}</td>
                    <td style={{ padding: '12px 16px 12px 0' }}>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontFamily: 'var(--mono)', background: e.restriction_type === 'unrestricted' ? 'rgba(26,122,80,0.1)' : 'rgba(0,0,0,0.05)', color: e.restriction_type === 'unrestricted' ? 'var(--spruce)' : 'var(--muted)' }}>{e.restriction_type || '-'}</span>
                    </td>
                    <td style={{ padding: '12px 0', whiteSpace: 'nowrap' as const }}>
                      <button onClick={() => startEdit(e)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', cursor: 'pointer', marginRight: 6 }}>
                        Edit
                      </button>
                      <button onClick={() => deleteEntry(e.id)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--amber)', cursor: 'pointer' }}>
                        Delete
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
'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useApi } from '../../context/api-context';
import { BCBA_TCO_6TH_ED, BCBA_TCO_DOMAIN_LABELS } from '../../lib/bcba-tco';

const TYPES = ['Unrestricted Hours','Restricted Hours','Experience — Other'];
const SETTINGS = ['Home','Center','School','Community','Telehealth','Other'];
const SUP_FORMATS = ['In person','Virtual','With Client','N/A'];
const SYNC_TYPES = ['Asynchronous','Synchronized'];
const GROUP_TYPES = ['Individual','Group'];
const TASK_AREAS = BCBA_TCO_DOMAIN_LABELS;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const inp = { width: '100%', maxWidth: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' as const, WebkitAppearance: 'none' as const };
const lbl = { display: 'block' as const, fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 6 };
const helpTxt = { fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--muted)', margin: '4px 0 0 30px', lineHeight: 1.5 };

function pad(n: number) { return n < 10 ? '0' + n : String(n); }

function calcHours(start: string, end: string) {
  if (!start || !end) return '';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? (diff / 60).toFixed(2) : '';
}

type Supervisor = {
  id: number;
  professional_id: number;
  supervisor_name: string;
  supervisor_credential: string | null;
  is_responsible: boolean;
  supervision_start_date: string | null;
  supervision_end_date: string | null;
  contract_document_id: number | null;
  contract_file_name?: string | null;
  contract_file_url?: string | null;
  supervisor_training_date: string | null;
  supervisor_certification_date?: string | null;
  consulting_supervisor_name?: string | null;
  consulting_supervisor_last_consultation_date?: string | null;
  qualification?: {
    isFirstYear: boolean | null;
    needsConsultingSupervisor: boolean;
    consultingSupervisorMet: boolean | null;
    reason: string | null;
  };
};

export default function FieldworkPage() {
  const { get, post, patch } = useApi();
  const { getToken } = useAuth();
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
  const [setting, setSetting] = useState('Center');
  const [activityDesc, setActivityDesc] = useState('');
  const [taskArea, setTaskArea] = useState('');
  const [taskAreaNum, setTaskAreaNum] = useState('');
  const [monthlyObs, setMonthlyObs] = useState(false);
  const [observationMinutes, setObservationMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [entryFieldworkType, setEntryFieldworkType] = useState<'supervised' | 'concentrated'>(track);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  // Supervisors panel state
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(true);
  const [supervisorErr, setSupervisorErr] = useState('');
  const [reassigningId, setReassigningId] = useState<number | null>(null);
  const [contractUploadingFor, setContractUploadingFor] = useState<number | null>(null);
  const [contractSignedDateFor, setContractSignedDateFor] = useState<Record<number, string>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Training date state, keyed by supervisor id
  const [trainingDateFor, setTrainingDateFor] = useState<Record<number, string>>({});
  const [savingTrainingFor, setSavingTrainingFor] = useState<number | null>(null);

  // Qualification state (certification date + consulting supervisor), keyed by supervisor id
  const [certDateFor, setCertDateFor] = useState<Record<number, string>>({});
  const [consultingNameFor, setConsultingNameFor] = useState<Record<number, string>>({});
  const [consultingDateFor, setConsultingDateFor] = useState<Record<number, string>>({});
  const [savingQualificationsFor, setSavingQualificationsFor] = useState<number | null>(null);

  function loadSupervisors() {
    setLoadingSupervisors(true);
    setSupervisorErr('');
    get('/supervisors').then((r: any) => {
      setSupervisors(Array.isArray(r?.supervisors) ? r.supervisors : []);
    }).catch((e: any) => setSupervisorErr(e.message || 'Could not load supervisors')).finally(() => setLoadingSupervisors(false));
  }

  useEffect(() => { loadSupervisors(); }, []);

  async function handleMakeResponsible(supervisorId: number) {
    setReassigningId(supervisorId);
    setSupervisorErr('');
    try {
      await patch('/supervisors/' + supervisorId + '/make-responsible', {});
      loadSupervisors();
    } catch (e: any) {
      setSupervisorErr(e.message || 'Failed to reassign Responsible Supervisor');
    } finally {
      setReassigningId(null);
    }
  }

  async function handleContractUpload(supervisorId: number, file: File) {
    setContractUploadingFor(supervisorId);
    setSupervisorErr('');
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const base = apiUrl.replace(/\/api$/, '');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'supervision_contract');
      const uploadRes = await fetch(`${base}/vault/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();
      const vaultDocumentId = uploadData?.document?.id;
      if (!vaultDocumentId) throw new Error('Upload succeeded but no document id was returned');

      await patch('/supervisors/' + supervisorId + '/contract', {
        vaultDocumentId,
        contractSignedDate: contractSignedDateFor[supervisorId] || undefined,
      });
      loadSupervisors();
    } catch (e: any) {
      setSupervisorErr(e.message || 'Failed to attach contract');
    } finally {
      setContractUploadingFor(null);
    }
  }

  async function handleSaveTrainingDate(supervisorId: number) {
    const trainingDate = trainingDateFor[supervisorId];
    if (!trainingDate) return;
    setSavingTrainingFor(supervisorId);
    setSupervisorErr('');
    try {
      await patch('/supervisors/' + supervisorId + '/training', { trainingDate });
      loadSupervisors();
    } catch (e: any) {
      setSupervisorErr(e.message || 'Failed to save training date');
    } finally {
      setSavingTrainingFor(null);
    }
  }

  async function handleSaveQualifications(supervisorId: number) {
    setSavingQualificationsFor(supervisorId);
    setSupervisorErr('');
    try {
      await patch('/supervisors/' + supervisorId + '/qualifications', {
        certificationDate: certDateFor[supervisorId] || undefined,
        consultingSupervisorName: consultingNameFor[supervisorId] ?? undefined,
        consultingSupervisorLastConsultationDate: consultingDateFor[supervisorId] || undefined,
      });
      loadSupervisors();
    } catch (e: any) {
      setSupervisorErr(e.message || 'Failed to save qualification info');
    } finally {
      setSavingQualificationsFor(null);
    }
  }

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
      loadSupervisors();
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

      {/* Supervisors panel */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '16px 12px' : '24px 28px', marginBottom: 24, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 16 }}>Supervisors</p>

        {supervisorErr && (
          <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid var(--amber)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)', margin: 0 }}>{supervisorErr}</p>
          </div>
        )}

        {loadingSupervisors ? (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>Loading supervisors...</p>
        ) : supervisors.length === 0 ? (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>No supervisors on file yet. Log a supervised entry with a supervisor name below to add one.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {supervisors.map(s => {
              const hasContract = !!s.contract_document_id;
              const hasTraining = !!s.supervisor_training_date;
              return (
                <div key={s.id} style={{ padding: '12px 14px', borderRadius: 8, background: s.is_responsible ? 'rgba(26,122,80,0.06)' : 'var(--bg)', border: '1px solid ' + (s.is_responsible ? 'rgba(26,122,80,0.2)' : 'var(--border)') }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 10 }}>
                    <div>
                      <p style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 500, color: 'var(--ink)', margin: '0 0 2px' }}>{s.supervisor_name}</p>
                      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: 0 }}>{s.supervisor_credential || 'No credential on file'}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: s.is_responsible ? 'rgba(26,122,80,0.1)' : 'rgba(0,0,0,0.05)', color: s.is_responsible ? 'var(--spruce)' : 'var(--muted)' }}>
                        {s.is_responsible ? 'Responsible' : 'Contributing'}
                      </span>
                      {!s.is_responsible && (
                        <button
                          onClick={() => handleMakeResponsible(s.id)}
                          disabled={reassigningId === s.id}
                          style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink)', cursor: reassigningId === s.id ? 'not-allowed' : 'pointer' }}
                        >
                          {reassigningId === s.id ? 'Updating...' : 'Make Responsible'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Contract status + upload */}
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid ' + (s.is_responsible ? 'rgba(26,122,80,0.15)' : 'var(--border)'), display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 8 }}>
                    {hasContract ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: 'rgba(26,122,80,0.1)', color: 'var(--spruce)' }}>✓ Contract on file</span>
                        {s.supervision_start_date && (
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>
                            signed {new Date(s.supervision_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                        {s.contract_file_url && (
                          <a href={s.contract_file_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--sky)' }}>View file</a>
                        )}
                      </div>
                    ) : (
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: 'rgba(255,160,0,0.1)', color: 'var(--amber)' }}>! No contract on file</span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="date"
                        value={contractSignedDateFor[s.id] || ''}
                        onChange={e => setContractSignedDateFor(prev => ({ ...prev, [s.id]: e.target.value }))}
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink)' }}
                      />
                      <input
                        ref={el => { fileInputRefs.current[s.id] = el; }}
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleContractUpload(s.id, f); }}
                      />
                      <button
                        onClick={() => fileInputRefs.current[s.id]?.click()}
                        disabled={contractUploadingFor === s.id}
                        style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink)', cursor: contractUploadingFor === s.id ? 'not-allowed' : 'pointer' }}
                      >
                        {contractUploadingFor === s.id ? 'Uploading...' : hasContract ? 'Replace file' : 'Upload contract'}
                      </button>
                    </div>
                  </div>

                  {/* Training date status + save */}
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid ' + (s.is_responsible ? 'rgba(26,122,80,0.15)' : 'var(--border)'), display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 8 }}>
                    {hasTraining ? (
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: 'rgba(26,122,80,0.1)', color: 'var(--spruce)' }}>
                        ✓ 8-hr training completed {new Date(s.supervisor_training_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    ) : (
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: 'rgba(255,160,0,0.1)', color: 'var(--amber)' }}>! 8-hr Supervisor Training not on file</span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="date"
                        value={trainingDateFor[s.id] || ''}
                        onChange={e => setTrainingDateFor(prev => ({ ...prev, [s.id]: e.target.value }))}
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink)' }}
                      />
                      <button
                        onClick={() => handleSaveTrainingDate(s.id)}
                        disabled={savingTrainingFor === s.id || !trainingDateFor[s.id]}
                        style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink)', cursor: savingTrainingFor === s.id || !trainingDateFor[s.id] ? 'not-allowed' : 'pointer' }}
                      >
                        {savingTrainingFor === s.id ? 'Saving...' : hasTraining ? 'Update date' : 'Save date'}
                      </button>
                    </div>
                  </div>

                  {/* Qualifications: certification date + consulting supervisor (first-year rule) */}
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid ' + (s.is_responsible ? 'rgba(26,122,80,0.15)' : 'var(--border)') }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 8, marginBottom: 8 }}>
                      {s.supervisor_certification_date ? (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>
                          Certified {new Date(s.supervisor_certification_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {s.qualification?.isFirstYear && ' · first-year'}
                        </span>
                      ) : (
                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: 'rgba(255,160,0,0.1)', color: 'var(--amber)' }}>! Certification date not on file</span>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="date"
                          value={certDateFor[s.id] ?? s.supervisor_certification_date ?? ''}
                          onChange={e => setCertDateFor(prev => ({ ...prev, [s.id]: e.target.value }))}
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink)' }}
                        />
                        <button
                          onClick={() => handleSaveQualifications(s.id)}
                          disabled={savingQualificationsFor === s.id || !certDateFor[s.id]}
                          style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink)', cursor: savingQualificationsFor === s.id || !certDateFor[s.id] ? 'not-allowed' : 'pointer' }}
                        >
                          {savingQualificationsFor === s.id ? 'Saving...' : 'Save cert. date'}
                        </button>
                      </div>
                    </div>

                    {s.qualification?.needsConsultingSupervisor && (
                      <div>
                        {s.qualification.consultingSupervisorMet ? (
                          <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: 'rgba(26,122,80,0.1)', color: 'var(--spruce)', marginBottom: 8 }}>
                            ✓ Consulting supervisor: {s.consulting_supervisor_name}
                          </span>
                        ) : (
                          <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: 'rgba(255,160,0,0.1)', color: 'var(--amber)', marginBottom: 8 }}>
                            ! Certified &lt;1 year — needs a consulting supervisor with current monthly consultation
                          </span>
                        )}
                        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', margin: '0 0 8px' }}>
                          Per BACB Handbook: supervisors certified less than one year must receive monthly consultation from a qualified consulting supervisor to provide fieldwork supervision.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 160px auto', gap: 6 }}>
                          <input
                            type="text"
                            placeholder="Consulting supervisor name"
                            value={consultingNameFor[s.id] ?? s.consulting_supervisor_name ?? ''}
                            onChange={e => setConsultingNameFor(prev => ({ ...prev, [s.id]: e.target.value }))}
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink)' }}
                          />
                          <input
                            type="date"
                            value={consultingDateFor[s.id] ?? s.consulting_supervisor_last_consultation_date ?? ''}
                            onChange={e => setConsultingDateFor(prev => ({ ...prev, [s.id]: e.target.value }))}
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink)' }}
                          />
                          <button
                            onClick={() => handleSaveQualifications(s.id)}
                            disabled={savingQualificationsFor === s.id}
                            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink)', cursor: savingQualificationsFor === s.id ? 'not-allowed' : 'pointer' }}
                          >
                            {savingQualificationsFor === s.id ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

        {/* Row 4: Task List Area — per BCBA Test Content Outline (6th ed.) */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: 12, marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>TCO Domain</label>
            <select value={taskArea} onChange={e => { setTaskArea(e.target.value); setTaskAreaNum(''); }} style={{ ...inp, cursor: 'pointer' }}>
              <option value="">Select domain...</option>
              {TASK_AREAS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Task</label>
            <select
              value={taskAreaNum}
              onChange={e => setTaskAreaNum(e.target.value)}
              disabled={!taskArea}
              style={{ ...inp, cursor: taskArea ? 'pointer' : 'not-allowed', opacity: taskArea ? 1 : 0.5 }}
            >
              <option value="">{taskArea ? 'Select task...' : 'Select a domain first'}</option>
              {taskArea && BCBA_TCO_6TH_ED.find(d => `${d.code}. ${d.name}` === taskArea)?.tasks.map(t => (
                <option key={t.num} value={t.num}>{t.num} — {t.text}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 5: Supervised toggle + format + group type */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'grid', gridTemplateColumns: supervised ? 'repeat(auto-fit, minmax(160px, 1fr))' : '1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div onClick={() => setSupervised(s => !s)} style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid ' + (supervised ? 'var(--spruce)' : 'var(--border)'), background: supervised ? 'var(--spruce)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  {supervised && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>Supervised session</span>
              </label>
              <p style={helpTxt}>Check this if the hours logged count toward your supervised-hours total (feeds your BACB percentage requirement).</p>
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
        </div>

        {supervised && (
          <div style={{ marginTop: 16, marginBottom: 20 }}>
            <label style={lbl}>Supervisor Name</label>
            <input type="text" placeholder="e.g. Dr. Smith" value={supervisorName} onChange={e => setSupervisorName(e.target.value)} style={inp} />
          </div>
        )}

        {/* Monthly observation + minutes */}
        <div style={{ display: 'grid', gridTemplateColumns: monthlyObs ? '1fr 200px' : '1fr', gap: 16, marginBottom: 4, marginTop: supervised ? 0 : 20, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div onClick={() => setMonthlyObs(s => !s)} style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid ' + (monthlyObs ? 'var(--spruce)' : 'var(--border)'), background: monthlyObs ? 'var(--spruce)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                {monthlyObs && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>Monthly observation completed</span>
            </label>
            <p style={helpTxt}>This is the once-per-month required direct observation of you working with a client.</p>
          </div>
          {monthlyObs && (
            <div style={{ minWidth: 0 }}>
              <label style={lbl}>Observation Minutes</label>
              <input type="number" min="0" placeholder="e.g. 30" value={observationMinutes} onChange={e => setObservationMinutes(e.target.value)} style={inp} />
            </div>
          )}
        </div>

        <div style={{ marginBottom: 24 }} />

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
              <tr>{['Date','Description','Setting','Hours','Supervised','Format','Task Area','Obs',''].map(h => (
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
                    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontFamily: 'var(--mono)', background: e.supervised ? 'rgba(26,122,80,0.1)' : 'rgba(0,0,0,0.05)', color: e.supervised ? 'var(--spruce)' : 'var(--muted)' }}>{e.supervised ? 'Yes' : 'No'}</span>
                  </td>
                  <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{e.supervised ? (e.supervision_format || '—') : '—'}</td>
                  <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{e.task_list_area ? `${e.task_list_area}${e.task_list_area_number ? ' #'+e.task_list_area_number : ''}` : '—'}</td>
                  <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--mono)', fontSize: 11 }}>{e.monthly_observation ? <span style={{ color: 'var(--spruce)' }}>✓{e.observation_minutes ? ` ${e.observation_minutes}m` : ''}</span> : '—'}</td>
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
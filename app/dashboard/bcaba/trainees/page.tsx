'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useApi } from '../../../context/api-context';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad(n: number) { return n < 10 ? '0' + n : String(n); }

type Trainee = { id: number; full_name: string; fieldwork_type: string; target_hours: number };
type Supervisor = {
  id: number;
  trainee_id: number;
  supervisor_user_id: string | null;
  supervisor_name: string;
  bacb_account_id: string | null;
  is_responsible_supervisor: boolean;
  active: boolean;
  relationship_status: string;
  contract_document_id: number | null;
  contract_signed_date: string | null;
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

export default function SupervisorTraineesPage() {
  const { get, post, patch } = useApi();
  const { getToken } = useAuth();
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

  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [supervisorErr, setSupervisorErr] = useState('');
  const [showAddSupervisor, setShowAddSupervisor] = useState(false);
  const [newSupervisorName, setNewSupervisorName] = useState('');
  const [newSupervisorBacbId, setNewSupervisorBacbId] = useState('');
  const [addingSupervisor, setAddingSupervisor] = useState(false);
  const [reassigningId, setReassigningId] = useState<number | null>(null);

  const [showAddTrainee, setShowAddTrainee] = useState(false);
  const [addingTrainee, setAddingTrainee] = useState(false);
  const [addTraineeErr, setAddTraineeErr] = useState('');
  const [newTraineeEmail, setNewTraineeEmail] = useState('');
  const [newTraineeBacbId, setNewTraineeBacbId] = useState('');
  const [newTraineePathway, setNewTraineePathway] = useState('standard');
  const [newTraineeFieldworkType, setNewTraineeFieldworkType] = useState('supervised');
  const [newTraineeStartDate, setNewTraineeStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [newTraineeTargetHours, setNewTraineeTargetHours] = useState('1300');

  // Contract upload state, keyed by supervisor id
  const [contractUploadingFor, setContractUploadingFor] = useState<number | null>(null);
  const [contractSignedDateFor, setContractSignedDateFor] = useState<Record<number, string>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Training date state, keyed by supervisor id
  const [trainingDateFor, setTrainingDateFor] = useState<Record<number, string>>({});
  const [savingTrainingFor, setSavingTrainingFor] = useState<number | null>(null);
  const [certDateFor, setCertDateFor] = useState<Record<number, string>>({});
  const [consultingNameFor, setConsultingNameFor] = useState<Record<number, string>>({});
  const [consultingDateFor, setConsultingDateFor] = useState<Record<number, string>>({});
  const [savingQualificationsFor, setSavingQualificationsFor] = useState<number | null>(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const monthYear = `${viewYear}-${pad(viewMonth + 1)}-01`;
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  function loadTrainees() {
    setLoadingTrainees(true);
    get('/bcaba/supervisor/trainees').then((r: any) => {
      const list = Array.isArray(r) ? r : [];
      setTrainees(list);
      if (list.length > 0 && !selectedTraineeId) setSelectedTraineeId(list[0].id);
    }).catch(() => {}).finally(() => setLoadingTrainees(false));
  }

  useEffect(() => { loadTrainees(); }, []);

  useEffect(() => {
    if (!selectedTraineeId) return;
    setErr('');
    get('/bcaba/trainees/' + selectedTraineeId + '/monthly/' + monthYear).then((r: any) => {
      setEntries(Array.isArray(r?.entries) ? r.entries : []);
      setSummary(r?.summary || null);
      setCompliance(r?.compliance || null);
    }).catch((e: any) => setErr(e.message || 'Could not load entries'));
  }, [selectedTraineeId, viewYear, viewMonth]);

  function loadSupervisors() {
    if (!selectedTraineeId) return;
    setLoadingSupervisors(true);
    setSupervisorErr('');
    get('/bcaba/trainees/' + selectedTraineeId + '/supervisors').then((r: any) => {
      setSupervisors(Array.isArray(r?.supervisors) ? r.supervisors : []);
    }).catch((e: any) => setSupervisorErr(e.message || 'Could not load supervisors')).finally(() => setLoadingSupervisors(false));
  }

  useEffect(() => {
    loadSupervisors();
    setShowAddSupervisor(false);
    setNewSupervisorName('');
    setNewSupervisorBacbId('');
  }, [selectedTraineeId]);

  async function handleAddSupervisor() {
    if (!selectedTraineeId || !newSupervisorName.trim()) return;
    setAddingSupervisor(true);
    setSupervisorErr('');
    try {
      await post('/bcaba/trainees/' + selectedTraineeId + '/supervisors', {
        supervisorName: newSupervisorName.trim(),
        bacbAccountId: newSupervisorBacbId.trim() || undefined,
      });
      setNewSupervisorName('');
      setNewSupervisorBacbId('');
      setShowAddSupervisor(false);
      loadSupervisors();
    } catch (e: any) {
      setSupervisorErr(e.message || 'Failed to add supervisor');
    } finally {
      setAddingSupervisor(false);
    }
  }

  async function handleMakeResponsible(supervisorId: number) {
    if (!selectedTraineeId) return;
    setReassigningId(supervisorId);
    setSupervisorErr('');
    try {
      await patch('/bcaba/trainees/' + selectedTraineeId + '/supervisors/' + supervisorId + '/make-responsible', {});
      loadSupervisors();
    } catch (e: any) {
      setSupervisorErr(e.message || 'Failed to reassign Responsible Supervisor');
    } finally {
      setReassigningId(null);
    }
  }

  async function handleContractUpload(supervisorId: number, file: File) {
    if (!selectedTraineeId) return;
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

      await patch('/bcaba/trainees/' + selectedTraineeId + '/supervisors/' + supervisorId + '/contract', {
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
    if (!selectedTraineeId) return;
    const trainingDate = trainingDateFor[supervisorId];
    if (!trainingDate) return;
    setSavingTrainingFor(supervisorId);
    setSupervisorErr('');
    try {
      await patch('/bcaba/trainees/' + selectedTraineeId + '/supervisors/' + supervisorId + '/training', {
        trainingDate,
      });
      loadSupervisors();
    } catch (e: any) {
      setSupervisorErr(e.message || 'Failed to save training date');
    } finally {
      setSavingTrainingFor(null);
    }
  }

  async function handleSaveQualifications(supervisorId: number) {
    if (!selectedTraineeId) return;
    setSavingQualificationsFor(supervisorId);
    setSupervisorErr('');
    try {
      await patch('/bcaba/trainees/' + selectedTraineeId + '/supervisors/' + supervisorId + '/qualifications', {
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

  function resetAddTraineeForm() {
    setNewTraineeEmail('');
    setNewTraineeBacbId('');
    setNewTraineePathway('standard');
    setNewTraineeFieldworkType('supervised');
    setNewTraineeStartDate(new Date().toISOString().slice(0, 10));
    setNewTraineeTargetHours('1300');
    setAddTraineeErr('');
  }

  async function handleAddTrainee() {
    if (!newTraineeEmail.trim()) return;
    setAddingTrainee(true);
    setAddTraineeErr('');
    try {
      const result: any = await post('/bcaba/trainees', {
        traineeEmail: newTraineeEmail.trim(),
        bacbAccountId: newTraineeBacbId.trim() || undefined,
        pathway: newTraineePathway,
        fieldworkType: newTraineeFieldworkType,
        fieldworkStartDate: newTraineeStartDate,
        targetHours: parseInt(newTraineeTargetHours, 10) || 1300,
      });
      resetAddTraineeForm();
      setShowAddTrainee(false);
      loadTrainees();
      if (result?.trainee?.id) setSelectedTraineeId(result.trainee.id);
    } catch (e: any) {
      setAddTraineeErr(e.message || 'Failed to add trainee');
    } finally {
      setAddingTrainee(false);
    }
  }

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

  const fieldInp = { width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' as const };
  const fieldLbl = { display: 'block' as const, fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 6 };

  return (
    <div style={{ padding: isMobile ? '20px 16px' : 40, maxWidth: 960, width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const, marginBottom: 24 }}>
        <div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>My Trainees</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>Trainee Fieldwork Calendar</h1>
        </div>
        <button
          onClick={() => { setShowAddTrainee(s => !s); if (showAddTrainee) resetAddTraineeForm(); }}
          style={{ background: showAddTrainee ? 'transparent' : 'var(--spruce)', color: showAddTrainee ? 'var(--ink)' : '#fff', border: showAddTrainee ? '1px solid var(--border)' : 'none', borderRadius: 8, padding: '10px 20px', fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer' }}
        >
          {showAddTrainee ? 'Cancel' : '+ Add Trainee'}
        </button>
      </div>

      {showAddTrainee && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '16px 12px' : '24px 28px', marginBottom: 24 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 16 }}>Add a Trainee</p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
            The trainee must already have a Supervisd account (they sign up like any other user first). Enter the email they used to register.
          </p>

          {addTraineeErr && (
            <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid var(--amber)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)', margin: 0 }}>{addTraineeErr}</p>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={fieldLbl}>Trainee Email</label>
            <input type="email" placeholder="trainee@example.com" value={newTraineeEmail} onChange={e => setNewTraineeEmail(e.target.value)} style={fieldInp} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={fieldLbl}>BACB ID (optional)</label>
              <input type="text" placeholder="e.g. 1-23-45678" value={newTraineeBacbId} onChange={e => setNewTraineeBacbId(e.target.value)} style={fieldInp} />
            </div>
            <div>
              <label style={fieldLbl}>Target Hours</label>
              <input type="number" min="1" value={newTraineeTargetHours} onChange={e => setNewTraineeTargetHours(e.target.value)} style={fieldInp} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={fieldLbl}>Pathway</label>
              <select value={newTraineePathway} onChange={e => setNewTraineePathway(e.target.value)} style={{ ...fieldInp, cursor: 'pointer' }}>
                <option value="standard">Standard</option>
                <option value="practicum">Practicum</option>
                <option value="intensive_practicum">Intensive Practicum</option>
              </select>
            </div>
            <div>
              <label style={fieldLbl}>Fieldwork Type</label>
              <select value={newTraineeFieldworkType} onChange={e => setNewTraineeFieldworkType(e.target.value)} style={{ ...fieldInp, cursor: 'pointer' }}>
                <option value="supervised">Supervised</option>
                <option value="concentrated">Concentrated</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={fieldLbl}>Fieldwork Start Date</label>
            <input type="date" value={newTraineeStartDate} onChange={e => setNewTraineeStartDate(e.target.value)} style={fieldInp} />
          </div>

          <button
            onClick={handleAddTrainee}
            disabled={addingTrainee || !newTraineeEmail.trim()}
            style={{ background: addingTrainee || !newTraineeEmail.trim() ? 'var(--muted)' : 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 24px', fontFamily: 'var(--mono)', fontSize: 12, cursor: addingTrainee || !newTraineeEmail.trim() ? 'not-allowed' : 'pointer' }}
          >
            {addingTrainee ? 'Adding...' : 'Add Trainee'}
          </button>
        </div>
      )}

      {loadingTrainees ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading trainees...</p>
      ) : trainees.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>No trainees are currently assigned to you as supervisor. Click &quot;+ Add Trainee&quot; above to get started.</p>
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

          {/* Supervisors panel */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '16px 12px' : '24px 28px', marginBottom: 24, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap' as const, gap: 8 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', margin: 0 }}>Supervisors</p>
              <button
                onClick={() => setShowAddSupervisor(s => !s)}
                style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink)' }}
              >
                {showAddSupervisor ? 'Cancel' : '+ Add supervisor'}
              </button>
            </div>

            {supervisorErr && (
              <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid var(--amber)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)', margin: 0 }}>{supervisorErr}</p>
              </div>
            )}

            {showAddSupervisor && (
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', marginBottom: 16, display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Supervisor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Jones"
                    value={newSupervisorName}
                    onChange={e => setNewSupervisorName(e.target.value)}
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' as const }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>BACB ID (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1-23-45678"
                    value={newSupervisorBacbId}
                    onChange={e => setNewSupervisorBacbId(e.target.value)}
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' as const }}
                  />
                </div>
                <button
                  onClick={handleAddSupervisor}
                  disabled={addingSupervisor || !newSupervisorName.trim()}
                  style={{ background: addingSupervisor || !newSupervisorName.trim() ? 'var(--muted)' : 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: 'var(--mono)', fontSize: 12, cursor: addingSupervisor || !newSupervisorName.trim() ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}
                >
                  {addingSupervisor ? 'Adding...' : 'Add supervisor'}
                </button>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                  Only the current Responsible Supervisor can add additional supervisors. New supervisors are added as contributing (not responsible) by default.
                </p>
              </div>
            )}

            {loadingSupervisors ? (
              <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>Loading supervisors...</p>
            ) : supervisors.length === 0 ? (
              <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>No supervisor records found for this trainee.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {supervisors.map(s => {
                  const hasContract = !!s.contract_document_id;
                  const hasTraining = !!s.supervisor_training_date;
                  return (
                    <div key={s.id} style={{ padding: '12px 14px', borderRadius: 8, background: s.is_responsible_supervisor ? 'rgba(26,122,80,0.06)' : 'var(--bg)', border: '1px solid ' + (s.is_responsible_supervisor ? 'rgba(26,122,80,0.2)' : 'var(--border)') }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 10 }}>
                        <div>
                          <p style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 500, color: 'var(--ink)', margin: '0 0 2px' }}>{s.supervisor_name}</p>
                          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: 0 }}>{s.bacb_account_id || 'No BACB ID on file'}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: s.is_responsible_supervisor ? 'rgba(26,122,80,0.1)' : 'rgba(0,0,0,0.05)', color: s.is_responsible_supervisor ? 'var(--spruce)' : 'var(--muted)' }}>
                            {s.is_responsible_supervisor ? 'Responsible' : 'Contributing'}
                          </span>
                          {!s.is_responsible_supervisor && (
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
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid ' + (s.is_responsible_supervisor ? 'rgba(26,122,80,0.15)' : 'var(--border)'), display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 8 }}>
                        {hasContract ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                            <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: 'rgba(26,122,80,0.1)', color: 'var(--spruce)' }}>✓ Contract on file</span>
                            {s.contract_signed_date && (
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>
                                signed {new Date(s.contract_signed_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                              </span>
                            )}
                            {s.contract_file_url && (
                              <a href={s.contract_file_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--sky)' }}>View file</a>
                            )}
                          </div>
                        ) : (
                          <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: 'rgba(255,160,0,0.1)', color: 'var(--amber)' }}>! No contract on file</span>
                        )}

                        {s.supervisor_user_id && (
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
                        )}
                      </div>

                      {/* Training date status + save */}
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid ' + (s.is_responsible_supervisor ? 'rgba(26,122,80,0.15)' : 'var(--border)'), display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 8 }}>
                        {hasTraining ? (
                          <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: 'rgba(26,122,80,0.1)', color: 'var(--spruce)' }}>
                            ✓ 8-hr training completed {new Date(s.supervisor_training_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                          </span>
                        ) : (
                          <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: 'rgba(255,160,0,0.1)', color: 'var(--amber)' }}>! 8-hr Supervisor Training not on file</span>
                        )}

                        {s.supervisor_user_id && (
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
                        )}
                      </div>

                      {/* Qualifications: certification date + consulting supervisor (first-year rule) */}
                      {s.supervisor_user_id && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid ' + (s.is_responsible_supervisor ? 'rgba(26,122,80,0.15)' : 'var(--border)') }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 8, marginBottom: 8 }}>
                            {s.supervisor_certification_date ? (
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>
                                Certified {new Date(s.supervisor_certification_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
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
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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
                      minHeight: isMobile ? 60 : 86,
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
                    <tr>{['Date', 'Type', 'Format', 'Hours', 'Restriction'].map(h => (
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
                        <td style={{ padding: '12px 0' }}>
                          <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontFamily: 'var(--mono)', background: e.restriction_type === 'unrestricted' ? 'rgba(26,122,80,0.1)' : 'rgba(0,0,0,0.05)', color: e.restriction_type === 'unrestricted' ? 'var(--spruce)' : 'var(--muted)' }}>{e.restriction_type || '-'}</span>
                        </td>
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
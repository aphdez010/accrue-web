'use client';
import { useEffect, useState } from 'react';
import { useApi } from '../../context/api-context';

const TYPES = ['Unrestricted Hours','Restricted Hours','Supervision – Individual','Supervision – Group','Experience – Other'];
const SETTINGS = ['Home','Center','School','Community','Telehealth','Other'];
const SUP_FORMATS = ['In person','Virtual','N/A'];
const TASK_AREAS = [
  'A. Measurement','B. Skill Acquisition','C. Behavior Reduction',
  'D. Documentation & Reporting','E. Professional Conduct',
  'F. Behavior Assessment','G. Behavior-Change Procedures',
  'H. Selecting & Implementing Interventions','I. Personnel Supervision',
];

const inp = { width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' as const };
const lbl = { display: 'block' as const, fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 6 };

function calcHours(start: string, end: string) {
  if (!start || !end) return '';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? (diff / 60).toFixed(2) : '';
}

export default function FieldworkPage() {
  const { get, post } = useApi();
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const month = new Date().toISOString().slice(0, 7);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hours, setHours] = useState('');
  const [type, setType] = useState('Unrestricted Hours');
  const [supervised, setSupervised] = useState(false);
  const [supervisorName, setSupervisorName] = useState('');
  const [supFormat, setSupFormat] = useState('In person');
  const [setting, setSetting] = useState('Center');
  const [activityDesc, setActivityDesc] = useState('');
  const [taskArea, setTaskArea] = useState('');
  const [taskAreaNum, setTaskAreaNum] = useState('');
  const [monthlyObs, setMonthlyObs] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (startTime && endTime) {
      const h = calcHours(startTime, endTime);
      if (h) setHours(h);
    }
  }, [startTime, endTime]);

  const load = () => get('/fieldwork?month=' + month).then((r: any) => {
    const list = Array.isArray(r) ? r : Array.isArray(r?.entries) ? r.entries : [];
    setEntries(list);
    setTotal(list.reduce((s: number, e: any) => s + Number(e.hours || 0), 0));
  }).catch(() => {});

  useEffect(() => { load(); }, []);

  async function submit() {
    if (!date || !hours) return;
    setBusy(true); setErr('');
    try {
      await post('/fieldwork', {
        entry_date: date, hours: parseFloat(hours), experience_type: type,
        supervised, notes: notes || null,
        activity_description: activityDesc || null,
        start_time: startTime || null, end_time: endTime || null,
        setting, supervision_format: supervised ? supFormat : null,
        task_list_area: taskArea || null,
        task_list_area_number: taskAreaNum ? parseInt(taskAreaNum) : null,
        monthly_observation: monthlyObs,
      });
      setHours(''); setStartTime(''); setEndTime(''); setNotes('');
      setActivityDesc(''); setTaskArea(''); setTaskAreaNum('');
      setSupervised(false); setMonthlyObs(false);
      setOk(true); setTimeout(() => setOk(false), 3000);
      load();
    } catch(e: any) { setErr(e.message || 'Error'); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ padding: isMobile ? '20px 16px' : 40, maxWidth: 900 }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Fieldwork</p>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 32px' }}>Log Entry</h1>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '20px 16px' : '28px 32px', marginBottom: 24 }}>

        {/* Row 1: Date + Start + End + Hours */}
        {isMobile ? (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div>
                <label style={lbl}>Start Time</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div><label style={lbl}>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Start Time</label><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>End Time</label><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Hours</label><input type="number" step="0.25" min="0" placeholder="Auto or manual" value={hours} onChange={e => setHours(e.target.value)} style={inp} /></div>
          </div>
        )}

        {/* Row 2: Type + Setting */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={lbl}>Experience Type</label>
            <select value={type} onChange={e => setType(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
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
          <div>
            <label style={lbl}>Task List Area</label>
            <select value={taskArea} onChange={e => setTaskArea(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option value="">Select area...</option>
              {TASK_AREAS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Task List Item #</label>
            <input type="number" min="1" placeholder="e.g. 4" value={taskAreaNum} onChange={e => setTaskAreaNum(e.target.value)} style={inp} />
          </div>
        </div>

        {/* Row 5: Supervised toggle + format */}
        <div style={{ display: 'grid', gridTemplateColumns: supervised ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div onClick={() => setSupervised(s => !s)} style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid ' + (supervised ? 'var(--spruce)' : 'var(--border)'), background: supervised ? 'var(--spruce)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                {supervised && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>Supervised session</span>
            </label>
          </div>
          {supervised && (
            <div>
              <label style={lbl}>Supervision Format</label>
              <select value={supFormat} onChange={e => setSupFormat(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {SUP_FORMATS.map(f => <option key={f}>{f}</option>)}
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

        {/* Monthly observation */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div onClick={() => setMonthlyObs(s => !s)} style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid ' + (monthlyObs ? 'var(--spruce)' : 'var(--border)'), background: monthlyObs ? 'var(--spruce)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              {monthlyObs && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>Monthly observation (supervisor present)</span>
          </label>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Notes (optional)</label>
          <input type="text" placeholder="Any additional notes" value={notes} onChange={e => setNotes(e.target.value)} style={inp} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={submit} disabled={busy || !hours || !date} style={{ background: busy ? 'var(--muted)' : 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 28px', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '.06em', cursor: busy ? 'not-allowed' : 'pointer' }}>
            {busy ? 'Logging...' : 'Log Entry'}
          </button>
          {ok && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--spruce)' }}>✓ Entry logged</span>}
          {err && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)' }}>{err}</span>}
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Total Hours</p>
          <p style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>{total.toFixed(1)}</p>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Entries</p>
          <p style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>{entries.length}</p>
        </div>
      </div>

      {/* Entries table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '16px 12px' : '28px 32px' }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 20 }}>{month} — Entries</p>
        {entries.length === 0 ? (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', padding: '16px 0' }}>No entries yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? 11 : 13 }}>
            <thead>
              <tr>{['Date','Description','Setting','Hours','Supv','Task Area','Obs'].map(h => (
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
                  <td style={{ padding: '12px 0', fontFamily: 'var(--mono)', fontSize: 11 }}>{e.monthly_observation ? <span style={{ color: 'var(--spruce)' }}>✓</span> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

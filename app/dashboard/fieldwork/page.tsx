'use client';
import { useEffect, useState } from 'react';
import { useApi } from '../../context/api-context';

export default function FieldworkPage() {
  const { get, post } = useApi();
  const [entries, setEntries] = useState<any[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    entry_date: '',
    hours: '',
    activity_type: 'Unrestricted Hours',
    notes: '',
    is_supervised: false,
    supervisor_name: '',
  });

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    setForm(f => ({ ...f, entry_date: new Date().toISOString().slice(0, 10) }));
    load();
  }, []);

  async function load() {
    try {
      const res = await get('/fieldwork?month=' + currentMonth);
      const list = res?.entries ?? res ?? [];
      setEntries(list);
      setTotalHours(list.reduce((s, e) => s + Number(e.hours), 0));
    } catch (e) {}
  }

  async function handleSubmit() {
    if (!form.entry_date || !form.hours) return;
    setSubmitting(true);
    setError(null);
    try {
      await post('/fieldwork', {
        entry_date: form.entry_date,
        hours: parseFloat(form.hours),
        activity_type: form.activity_type,
        notes: form.notes || null,
        is_supervised: form.is_supervised,
        supervisor_name: form.supervisor_name || null,
      });
      setForm(f => ({ ...f, hours: '', notes: '', is_supervised: false, supervisor_name: '' }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      load();
    } catch (e) {
      setError(e.message || 'Failed to log entry');
    } finally {
      setSubmitting(false);
    }
  }

  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px' };
  const lbl = { display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 };
  const inp = { width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ padding: 40, maxWidth: 880 }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Fieldwork</p>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>Log Entry</h1>
      </div>

      <div style={{ ...card, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div>
            <label style={lbl}>Date</label>
            <input type="date" value={form.entry_date} onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))} style={inp} />
          </div>
          <div>
            <label style={lbl}>Hours</label>
            <input type="number" step="0.25" min="0" placeholder="e.g. 2.5" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} style={inp} />
          </div>
          <div>
            <label style={lbl}>Experience Type</label>
            <select value={form.activity_type} onChange={e => setForm(f => ({ ...f, activity_type: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
              {['Unrestricted Hours','Restricted Hours','Supervision – Individual','Supervision – Group','Experience – Other'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div onClick={() => setForm(f => ({ ...f, is_supervised: !f.is_supervised }))} style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid ' + (form.is_supervised ? 'var(--spruce)' : 'var(--border)'), background: form.is_supervised ? 'var(--spruce)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {form.is_supervised && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>Supervised</span>
            </label>
          </div>
        </div>
        {form.is_supervised && (
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>Supervisor Name</label>
            <input type="text" placeholder="e.g. Dr. Smith" value={form.supervisor_name} onChange={e => setForm(f => ({ ...f, supervisor_name: e.target.value }))} style={inp} />
          </div>
        )}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Notes</label>
          <input type="text" placeholder="Optional" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={inp} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={handleSubmit} disabled={submitting || !form.hours || !form.entry_date} style={{ background: submitting ? 'var(--muted)' : 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 28px', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.06em', cursor: submitting ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'Logging…' : 'Log Entry'}
          </button>
          {success && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--spruce)' }}>✓ Entry logged</span>}
          {error && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)' }}>{error}</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={card}><p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Total Hours</p><p style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{totalHours.toFixed(1)}</p></div>
        <div style={card}><p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Entries</p><p style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{entries.length}</p></div>
      </div>

      <div style={card}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 20 }}>{currentMonth} — Entries</p>
        {entries.length === 0 ? (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', padding: '16px 0' }}>No entries yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Date','Type','Hours','Supervised','Notes'].map(h => <th key={h} style={{ textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', paddingBottom: 12, borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{h}</th>)}</tr></thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '14px 16px 14px 0', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>{e.entry_date?.slice(0,10)}</td>
                  <td style={{ padding: '14px 16px 14px 0', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>{e.activity_type}</td>
                  <td style={{ padding: '14px 16px 14px 0', fontFamily: 'var(--display)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{Number(e.hours).toFixed(1)}</td>
                  <td style={{ padding: '14px 16px 14px 0' }}><span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontFamily: 'var(--mono)', background: e.is_supervised ? 'rgba(26,122,80,0.1)' : 'rgba(0,0,0,0.05)', color: e.is_supervised ? 'var(--spruce)' : 'var(--muted)' }}>{e.is_supervised ? 'Yes' : 'No'}</span></td>
                  <td style={{ padding: '14px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{e.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useApi } from '../../context/api-context';

const TYPES = ['Unrestricted Hours','Restricted Hours','Supervision - Individual','Supervision - Group','Experience - Other'];

export default function FieldworkPage() {
  const api = useApi();
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('');
  const [type, setType] = useState('Unrestricted Hours');
  const [notes, setNotes] = useState('');
  const [supervised, setSupervised] = useState(false);
  const [supervisor, setSupervisor] = useState('');
  const month = new Date().toISOString().slice(0,7);

  useEffect(() => {
    setDate(new Date().toISOString().slice(0,10));
    load();
  }, []);

  async function load() {
    try {
      const r = await api.get('/fieldwork?month=' + month);
      const list = r?.entries ?? r ?? [];
      setEntries(list);
      setTotal(list.reduce((s, e) => s + Number(e.hours), 0));
    } catch(_) {}
  }

  async function submit() {
    if (!date || !hours) return;
    setBusy(true); setErr('');
    try {
      await api.post('/fieldwork', { entry_date: date, hours: parseFloat(hours), activity_type: type, notes: notes||null, is_supervised: supervised, supervisor_name: supervisor||null });
      setHours(''); setNotes(''); setSupervised(false); setSupervisor('');
      setOk(true); setTimeout(() => setOk(false), 3000);
      load();
    } catch(e) { setErr(e.message || 'Error'); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ padding: 40, maxWidth: 860 }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Fieldwork</p>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 32px' }}>Log Entry</h1>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 6 }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 6 }}>Hours</label>
            <input type="number" step="0.25" min="0" placeholder="e.g. 2.5" value={hours} onChange={e => setHours(e.target.value)} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 6 }}>Experience Type</label>
            <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div onClick={() => setSupervised(s => !s)} style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid ' + (supervised ? 'var(--spruce)' : 'var(--border)'), background: supervised ? 'var(--spruce)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                {supervised && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>Supervised</span>
            </label>
          </div>
        </div>

        {supervised && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 6 }}>Supervisor Name</label>
            <input type="text" placeholder="e.g. Dr. Smith" value={supervisor} onChange={e => setSupervisor(e.target.value)} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 6 }}>Notes</label>
          <input type="text" placeholder="Optional" value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={submit} disabled={busy || !hours || !date} style={{ background: busy ? 'var(--muted)' : 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 28px', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.06em', cursor: busy ? 'not-allowed' : 'pointer' }}>
            {busy ? 'Logging...' : 'Log Entry'}
          </button>
          {ok && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--spruce)' }}>Entry logged</span>}
          {err && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)' }}>{err}</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Total Hours</p>
          <p style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>{total.toFixed(1)}</p>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Entries</p>
          <p style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>{entries.length}</p>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px' }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 20 }}>{month} - Entries</p>
        {entries.length === 0 ? (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', padding: '16px 0' }}>No entries yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Date','Type','Hours','Supervised','Notes'].map(h => (
                <th key={h} style={{ textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', paddingBottom: 12, borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '14px 16px 14px 0', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>{String(e.entry_date||'').slice(0,10)}</td>
                  <td style={{ padding: '14px 16px 14px 0', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>{e.activity_type}</td>
                  <td style={{ padding: '14px 16px 14px 0', fontFamily: 'var(--display)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{Number(e.hours).toFixed(1)}</td>
                  <td style={{ padding: '14px 16px 14px 0' }}>
                    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontFamily: 'var(--mono)', background: e.is_supervised ? 'rgba(26,122,80,0.1)' : 'rgba(0,0,0,0.05)', color: e.is_supervised ? 'var(--spruce)' : 'var(--muted)' }}>{e.is_supervised ? 'Yes' : 'No'}</span>
                  </td>
                  <td style={{ padding: '14px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{e.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

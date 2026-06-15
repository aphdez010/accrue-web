'use client';
import { useEffect, useState } from 'react';
import { useApi } from '../../context/api-context';

type RBT = { id: number; name: string; };

export default function FormsPage() {
  const { get, post } = useApi();
  const [rbts, setRbts] = useState<RBT[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    supervisee_id: '', contact_date: new Date().toISOString().slice(0, 10),
    duration_minutes: '', contact_type: 'individual', notes: ''
  });

  useEffect(() => {
    get('/roster').then(r => setRbts(Array.isArray(r) ? r.map((x: any) => ({ id: x.id, name: x.name })) : [])).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!form.supervisee_id || !form.duration_minutes) return;
    setSaving(true);
    try {
      await post('/forms', { ...form, supervisee_id: Number(form.supervisee_id), duration_minutes: Number(form.duration_minutes) });
      setSaved(true);
      setForm({ supervisee_id: '', contact_date: new Date().toISOString().slice(0, 10), duration_minutes: '', contact_type: 'individual', notes: '' });
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {}
    setSaving(false);
  };

  const field = { fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', width: '100%', boxSizing: 'border-box' as const, outline: 'none' };

  return (
    <div style={{ padding: 40, maxWidth: 600 }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>BCBA</p>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>Log Supervision Contact</h1>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 32 }}>Record a completed supervision session</p>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Supervisee</p>
          <select style={field} value={form.supervisee_id} onChange={e => setForm(f => ({ ...f, supervisee_id: e.target.value }))}>
            <option value="">Select RBT...</option>
            {rbts.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Date</p>
            <input type="date" style={field} value={form.contact_date} onChange={e => setForm(f => ({ ...f, contact_date: e.target.value }))} />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Duration (minutes)</p>
            <input type="number" style={field} placeholder="60" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} />
          </div>
        </div>
        <div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Contact Type</p>
          <select style={field} value={form.contact_type} onChange={e => setForm(f => ({ ...f, contact_type: e.target.value }))}>
            <option value="individual">Individual</option>
            <option value="group">Group</option>
          </select>
        </div>
        <div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Notes (optional)</p>
          <textarea style={{ ...field, minHeight: 80, resize: 'vertical' }} placeholder="Session notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
        <button onClick={handleSubmit} disabled={saving || !form.supervisee_id || !form.duration_minutes}
          style={{ background: saved ? 'rgba(26,122,80,0.15)' : 'var(--spruce)', color: saved ? 'var(--spruce)' : '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontFamily: 'var(--mono)', fontSize: 13, cursor: 'pointer', opacity: (!form.supervisee_id || !form.duration_minutes) ? 0.5 : 1 }}>
          {saved ? '✓ Contact logged' : saving ? 'Saving...' : 'Log supervision contact'}
        </button>
      </div>
    </div>
  );
}

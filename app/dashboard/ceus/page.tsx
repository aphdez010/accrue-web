'use client';
import { useEffect, useState } from 'react';
import { useApi } from '../../context/api-context';

type CEU = { id: number; course_title: string; provider: string; hours: number; completion_date: string; category: string; };

const CATEGORIES = ['ethics', 'supervision', 'behavior_analysis', 'general'];
const CATEGORY_LABELS: Record<string, string> = { ethics: 'Ethics', supervision: 'Supervision', behavior_analysis: 'Behavior Analysis', general: 'General' };

export default function CEUsPage() {
  const { get, post } = useApi();
  const [ceus, setCeus] = useState<CEU[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ course_title: '', provider: '', hours: '', completion_date: new Date().toISOString().slice(0, 10), category: 'general' });

  const load = () => get('/ceus').then(r => setCeus(Array.isArray(r) ? r : [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const totalHours = ceus.reduce((sum, c) => sum + Number(c.hours || 0), 0);

  const handleSubmit = async () => {
    if (!form.course_title || !form.hours) return;
    setSaving(true);
    try {
      await post('/ceus', { ...form, hours: Number(form.hours) });
      setSaved(true);
      setForm({ course_title: '', provider: '', hours: '', completion_date: new Date().toISOString().slice(0, 10), category: 'general' });
      setShowForm(false);
      load();
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {}
    setSaving(false);
  };

  const field = { fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', width: '100%', boxSizing: 'border-box' as const, outline: 'none' };

  return (
    <div style={{ padding: 40, maxWidth: 800 }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>BCBA</p>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>My CEUs</h1>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{totalHours.toFixed(1)} hrs total · {ceus.length} course{ceus.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} style={{ background: 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ Add CEU'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Course Title</p>
            <input style={field} placeholder="e.g. Ethics in ABA Practice" value={form.course_title} onChange={e => setForm(f => ({ ...f, course_title: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Provider</p>
              <input style={field} placeholder="e.g. BACB, ABAI" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Hours</p>
              <input type="number" style={field} placeholder="1.5" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Completion Date</p>
              <input type="date" style={field} value={form.completion_date} onChange={e => setForm(f => ({ ...f, completion_date: e.target.value }))} />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Category</p>
              <select style={field} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleSubmit} disabled={saving || !form.course_title || !form.hours}
            style={{ background: 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontFamily: 'var(--mono)', fontSize: 13, cursor: 'pointer', opacity: (!form.course_title || !form.hours) ? 0.5 : 1 }}>
            {saving ? 'Saving...' : 'Save CEU'}
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading...</p>
      ) : ceus.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '40px 32px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>No CEUs logged yet. Click + Add CEU to get started.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {ceus.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: i < ceus.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <p style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 500, color: 'var(--ink)', margin: '0 0 2px' }}>{c.course_title}</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: 0 }}>{c.provider || '—'} · {CATEGORY_LABELS[c.category] || c.category}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <span style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>{Number(c.hours).toFixed(1)}<span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 2 }}>hrs</span></span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{new Date(c.completion_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

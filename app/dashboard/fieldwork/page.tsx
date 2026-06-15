'use client';
import React, { useEffect, useState } from 'react';
import { useEffect, useState } from 'react';
import { useApi } from '@/context/api-context';

interface FieldworkEntry {
  id: number;
  entry_date: string;
  hours: number;
  activity_type: string;
  supervisor_name?: string;
  notes?: string;
  is_supervised: boolean;
}

const ACTIVITY_TYPES = [
  'Unrestricted Hours',
  'Restricted Hours',
  'Supervision – Individual',
  'Supervision – Group',
  'Experience – Other',
];

export default function FieldworkPage() {
  const { get, post } = useApi();
  const [entries, setEntries] = useState<FieldworkEntry[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);

  const [form, setForm] = useState({
    entry_date: today,
    hours: '',
    activity_type: 'Unrestricted Hours',
    notes: '',
    is_supervised: false,
    supervisor_name: '',
  });

  async function load() {
    try {
      const res = await get(`/entries?month=${currentMonth}`);
      const list: FieldworkEntry[] = res?.entries ?? [];
      setEntries(list);
      setTotalHours(list.reduce((sum, e) => sum + Number(e.hours), 0));
    } catch (e: any) {
      setError(e.message ?? 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit() {
    if (!form.entry_date || !form.hours || !form.activity_type) return;
    setSubmitting(true);
    setError(null);
    try {
      await post('/entries', {
        entry_date: form.entry_date,
        hours: parseFloat(form.hours),
        activity_type: form.activity_type,
        notes: form.notes || null,
        is_supervised: form.is_supervised,
        supervisor_name: form.supervisor_name || null,
      });
      setForm({ entry_date: today, hours: '', activity_type: 'Unrestricted Hours', notes: '', is_supervised: false, supervisor_name: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await load();
    } catch (e: any) {
      setError(e.message ?? 'Failed to log entry');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Styles ───────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '28px 32px',
  };

  const fieldLabel: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--mono)',
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
    marginBottom: 6,
  };

  const input: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 14px',
    fontFamily: 'var(--mono)',
    fontSize: 13,
    color: 'var(--ink)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    fontFamily: 'var(--mono)',
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
    paddingBottom: 12,
    borderBottom: '1px solid var(--border)',
    fontWeight: 500,
  };

  const tdStyle: React.CSSProperties = {
    padding: '14px 16px 14px 0',
    fontFamily: 'var(--mono)',
    fontSize: 12,
    color: 'var(--ink)',
    verticalAlign: 'middle',
  };

  return (
    <div style={{ padding: '40px', maxWidth: 880 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
          Fieldwork
        </p>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
          Log Entry
        </h1>
      </div>

      {/* Form */}
      <div style={{ ...card, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          <div>
            <label style={fieldLabel}>Date</label>
            <input
              type="date"
              value={form.entry_date}
              onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))}
              style={input}
            />
          </div>

          <div>
            <label style={fieldLabel}>Hours</label>
            <input
              type="number"
              step="0.25"
              min="0"
              placeholder="e.g. 2.5"
              value={form.hours}
              onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
              style={input}
            />
          </div>

          <div>
            <label style={fieldLabel}>Experience Type</label>
            <select
              value={form.activity_type}
              onChange={e => setForm(f => ({ ...f, activity_type: e.target.value }))}
              style={{ ...input, cursor: 'pointer' }}
            >
              {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div
                onClick={() => setForm(f => ({ ...f, is_supervised: !f.is_supervised }))}
                style={{
                  width: 20, height: 20, borderRadius: 4,
                  border: `2px solid ${form.is_supervised ? 'var(--spruce)' : 'var(--border)'}`,
                  background: form.is_supervised ? 'var(--spruce)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {form.is_supervised && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>Supervised</span>
            </label>
          </div>
        </div>

        {form.is_supervised && (
          <div style={{ marginBottom: 20 }}>
            <label style={fieldLabel}>Supervisor Name</label>
            <input
              type="text"
              placeholder="e.g. Dr. Smith"
              value={form.supervisor_name}
              onChange={e => setForm(f => ({ ...f, supervisor_name: e.target.value }))}
              style={input}
            />
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={fieldLabel}>Notes</label>
          <input
            type="text"
            placeholder="Optional"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            style={input}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.hours || !form.entry_date}
            style={{
              background: submitting ? 'var(--muted)' : 'var(--spruce)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '11px 28px',
              fontFamily: 'var(--mono)',
              fontSize: 12,
              letterSpacing: '0.06em',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            {submitting ? 'Logging…' : 'Log Entry'}
          </button>

          {success && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--spruce)' }}>
              ✓ Entry logged
            </span>
          )}
          {error && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)' }}>
              {error}
            </span>
          )}
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={card}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>
            Total Hours
          </p>
          <p style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>
            {totalHours.toFixed(1)}
          </p>
        </div>
        <div style={card}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>
            Entries
          </p>
          <p style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>
            {entries.length}
          </p>
        </div>
      </div>

      {/* Entries table */}
      <div style={card}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 20 }}>
          {currentMonth} — Entries
        </p>

        {loading ? (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading…</p>
        ) : entries.length === 0 ? (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', padding: '16px 0' }}>No entries yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Date', 'Type', 'Hours', 'Supervised', 'Notes'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={tdStyle}>{e.entry_date?.slice(0, 10)}</td>
                  <td style={tdStyle}>{e.activity_type}</td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--display)', fontSize: 14, fontWeight: 500 }}>
                    {Number(e.hours).toFixed(1)}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontFamily: 'var(--mono)',
                      background: e.is_supervised ? 'rgba(26,122,80,0.1)' : 'rgba(0,0,0,0.05)',
                      color: e.is_supervised ? 'var(--spruce)' : 'var(--muted)',
                    }}>
                      {e.is_supervised ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.notes ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
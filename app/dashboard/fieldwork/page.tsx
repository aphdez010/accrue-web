'use client';

import { useState, useEffect } from 'react';
import { useApi } from '../../context/api-context';

const EXPERIENCE_TYPES = [
  'Unrestricted Hours',
  'Restricted Hours',
  'Supervision',
];

interface FieldworkEntry {
  id: number;
  entry_date: string;
  experience_type: string;
  hours: number;
  supervised: boolean;
  notes: string | null;
}

export default function FieldworkPage() {
  const api = useApi();
  const [entries, setEntries] = useState<FieldworkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    entry_date: '',
    experience_type: EXPERIENCE_TYPES[0],
    hours: '',
    supervised: false,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/fieldwork')
      .then(setEntries)
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit() {
    if (!form.entry_date || !form.hours) return;
    setSaving(true);
    try {
      const entry = await api.post('/fieldwork', {
        ...form,
        hours: parseFloat(form.hours),
      });
      setEntries([entry, ...entries]);
      setForm({ entry_date: '', experience_type: EXPERIENCE_TYPES[0], hours: '', supervised: false, notes: '' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    await api.del(`/fieldwork/${id}`);
    setEntries(entries.filter(e => e.id !== id));
  }

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Fieldwork</h1>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Log Entry</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Date</label>
            <input type="date" value={form.entry_date}
              onChange={e => setForm({ ...form, entry_date: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A7A50]" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Hours</label>
            <input type="number" step="0.5" min="0" value={form.hours}
              onChange={e => setForm({ ...form, hours: e.target.value })}
              placeholder="e.g. 2.5"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A7A50]" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Experience Type</label>
            <select value={form.experience_type}
              onChange={e => setForm({ ...form, experience_type: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A7A50]">
              {EXPERIENCE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
              <input type="checkbox" checked={form.supervised}
                onChange={e => setForm({ ...form, supervised: e.target.checked })}
                className="accent-[#1A7A50]" />
              Supervised
            </label>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Notes</label>
            <input type="text" value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A7A50]" />
          </div>
        </div>
        <button onClick={handleSubmit} disabled={saving}
          className="mt-4 bg-[#1A7A50] text-white text-sm px-5 py-2 rounded-lg hover:bg-[#155f3e] disabled:opacity-50">
          {saving ? 'Saving...' : 'Log Entry'}
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex gap-8">
        <div>
          <p className="text-xs text-gray-500">Total Hours</p>
          <p className="text-2xl font-semibold text-gray-900">{totalHours.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Entries</p>
          <p className="text-2xl font-semibold text-gray-900">{entries.length}</p>
        </div>
      </div>

      {/* Table */}
      {loading ? <p className="text-sm text-gray-400">Loading...</p> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Hours</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Supervised</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No entries yet</td></tr>
              )}
              {entries.map(e => (
                <tr key={e.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">{e.entry_date}</td>
                  <td className="px-4 py-3">{e.experience_type}</td>
                  <td className="px-4 py-3">{e.hours}</td>
                  <td className="px-4 py-3">{e.supervised ? '✓' : '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{e.notes || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(e.id)}
                      className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

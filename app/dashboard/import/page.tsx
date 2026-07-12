'use client';
import { useState } from 'react';
import { useApi } from '../../context/api-context';

const REQUIRED = ['entry_date', 'hours', 'experience_type'];

const SAMPLE = `entry_date,hours,experience_type,supervised,supervisor_name,notes
2026-06-01,2.5,Unrestricted Hours,false,,Morning session
2026-06-02,1.0,Supervision - Individual,true,Dr. Smith,Weekly supervision
2026-06-03,3.0,Restricted Hours,false,,Afternoon session`;

interface CsvRow {
  entry_date?: string;
  hours?: string;
  experience_type?: string;
  supervised?: string;
  supervisor_name?: string;
  notes?: string;
  [key: string]: string | undefined;
}

function parseCSV(text: string): CsvRow[] {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase().replace(/ /g, '_'));
  return lines.slice(1).map((line: string) => {
    const vals = line.split(',');
    const row: CsvRow = {};
    headers.forEach((h: string, i: number) => { row[h] = (vals[i] || '').trim(); });
    return row;
  });
}

function validate(rows: CsvRow[]): string[] {
  const errors: string[] = [];
  rows.forEach((row: CsvRow, i: number) => {
    REQUIRED.forEach(f => {
      if (!row[f]) errors.push(`Row ${i + 2}: missing ${f}`);
    });
    if (row.hours && isNaN(parseFloat(row.hours))) errors.push(`Row ${i + 2}: hours must be a number`);
    if (row.entry_date && !/^\d{4}-\d{2}-\d{2}$/.test(row.entry_date)) errors.push(`Row ${i + 2}: entry_date must be YYYY-MM-DD`);
  });
  return errors;
}

export default function ImportPage() {
  const { post } = useApi();
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File | null | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result;
      if (typeof result !== 'string') return;
      const parsed = parseCSV(result);
      const errs = validate(parsed);
      setErrors(errs);
      setRows(parsed);
      setDone(0); setFailed(0); setFinished(false);
    };
    reader.readAsText(file);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  async function runImport() {
    if (errors.length > 0 || rows.length === 0) return;
    setImporting(true); setDone(0); setFailed(0); setFinished(false);
    let d = 0, f = 0;
    for (const row of rows) {
      try {
        await post('/fieldwork', {
          entry_date: row.entry_date,
          hours: parseFloat(row.hours || '0'),
          experience_type: row.experience_type,
          supervised: row.supervised === 'true',
          supervisor_name: row.supervisor_name || null,
          notes: row.notes || null,
        });
        d++; setDone(d);
      } catch (_) { f++; setFailed(f); }
    }
    setImporting(false); setFinished(true);
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'supervisd_import_sample.csv'; a.click();
  }

  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px' };
  const lbl = { fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--muted)' };

  return (
    <div style={{ padding: 40, maxWidth: 860 }}>
      <p style={{ ...lbl, marginBottom: 6 }}>Import</p>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 8px' }}>Import History</h1>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 32 }}>Bulk upload fieldwork entries from a CSV file.</p>

      <div style={{ ...card, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={lbl}>Upload CSV</p>
          <button onClick={downloadSample} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', cursor: 'pointer' }}>
            Download sample
          </button>
        </div>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('csv-input')?.click()}
          style={{ border: '2px dashed ' + (dragging ? 'var(--spruce)' : 'var(--border)'), borderRadius: 10, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(26,122,80,0.04)' : 'transparent', transition: 'all 0.15s' }}
        >
          <p style={{ fontFamily: 'var(--display)', fontSize: 16, color: 'var(--muted)', marginBottom: 6 }}>Drop CSV here or click to browse</p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>Accepts .csv files</p>
          <input id="csv-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />
        </div>
      </div>

      {errors.length > 0 && (
        <div style={{ ...card, marginBottom: 24, borderColor: 'var(--amber)' }}>
          <p style={{ ...lbl, color: 'var(--amber)', marginBottom: 12 }}>Validation errors — fix before importing</p>
          {errors.map((e, i) => (
            <p key={i} style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)', marginBottom: 4 }}>{e}</p>
          ))}
        </div>
      )}

      {rows.length > 0 && errors.length === 0 && (
        <div style={{ ...card, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={lbl}>{rows.length} rows ready</p>
            {finished ? (
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--spruce)' }}>Done — {done} imported{failed > 0 ? ', ' + failed + ' failed' : ''}</span>
            ) : (
              <button onClick={runImport} disabled={importing} style={{ background: importing ? 'var(--muted)' : 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.06em', cursor: importing ? 'not-allowed' : 'pointer' }}>
                {importing ? `Importing ${done}/${rows.length}...` : `Import ${rows.length} entries`}
              </button>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Date', 'Hours', 'Type', 'Supervised', 'Supervisor', 'Notes'].map(h => (
                <th key={h} style={{ textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', paddingBottom: 12, borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>{row.entry_date}</td>
                  <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--display)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{row.hours}</td>
                  <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>{row.experience_type}</td>
                  <td style={{ padding: '12px 16px 12px 0' }}>
                    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontFamily: 'var(--mono)', background: row.supervised === 'true' ? 'rgba(26,122,80,0.1)' : 'rgba(0,0,0,0.05)', color: row.supervised === 'true' ? 'var(--spruce)' : 'var(--muted)' }}>{row.supervised === 'true' ? 'Yes' : 'No'}</span>
                  </td>
                  <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{row.supervisor_name || '-'}</td>
                  <td style={{ padding: '12px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{row.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && errors.length === 0 && (
        <div style={{ ...card }}>
          <p style={{ ...lbl, marginBottom: 16 }}>CSV Format</p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Required columns: <span style={{ color: 'var(--ink)' }}>entry_date, hours, experience_type</span></p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>Optional: supervised (true/false), supervisor_name, notes</p>
        </div>
      )}

      {rows.length === 0 && (
        <div style={card}>
          <p style={{ ...lbl, marginBottom: 16 }}>CSV Format</p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Required columns: <span style={{ color: 'var(--ink)' }}>entry_date, hours, experience_type</span></p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Optional: supervised (true/false), supervisor_name, notes</p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>Date format: YYYY-MM-DD</p>
        </div>
      )}
    </div>
  );
}
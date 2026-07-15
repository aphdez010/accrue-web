'use client';
import { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '@clerk/nextjs';
import { useApi } from '../../../context/api-context';

function pad(n: number) { return n < 10 ? '0' + n : String(n); }

const statusColors: Record<string, { bg: string; color: string }> = {
  draft: { bg: 'rgba(0,0,0,0.05)', color: 'var(--muted)' },
  finalized: { bg: 'rgba(26,122,80,0.1)', color: 'var(--spruce)' },
};

type Trainee = { id: number; full_name: string; target_hours?: number };

export default function MonthlyVerificationPage() {
  const { get, post, patch } = useApi();
  const { getToken } = useAuth();

  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loadingTrainees, setLoadingTrainees] = useState(true);
  const [selectedTraineeId, setSelectedTraineeId] = useState<number | null>(null);

  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [err, setErr] = useState('');
  const [edits, setEdits] = useState<Record<number, { contactsCount?: string; observationCompleted?: boolean }>>({});
  const [signingId, setSigningId] = useState<number | null>(null);
  const sigRef = useRef<any>(null);

  const today = new Date();
  const monthYear = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
  const monthLabel = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  function loadTrainees() {
    setLoadingTrainees(true);
    get('/bcaba/supervisor/trainees').then((r: any) => {
      const list = Array.isArray(r) ? r : [];
      setTrainees(list);
      if (list.length > 0) setSelectedTraineeId(prev => prev ?? list[0].id);
    }).catch((e: any) => {
      console.error('Failed to load trainees:', e);
    }).finally(() => setLoadingTrainees(false));
  }

  useEffect(() => { loadTrainees(); }, []);

  const load = () => {
    if (!selectedTraineeId) return;
    setLoading(true);
    setErr('');
    get('/bcaba-monthly-verification?traineeId=' + selectedTraineeId).then((r: any) => {
      setVerifications(Array.isArray(r?.verifications) ? r.verifications : []);
    }).catch((e: any) => {
      console.error('Failed to load monthly verifications (traineeId=' + selectedTraineeId + '):', e);
      setErr(e?.message ? `Failed to load monthly verifications: ${e.message}` : 'Failed to load monthly verifications. Please try again.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [selectedTraineeId]);

  async function draftMonthly() {
    if (!selectedTraineeId) return;
    setDrafting(true); setErr('');
    try {
      const r: any = await post('/bcaba-monthly-verification/draft', { traineeId: selectedTraineeId, monthYear });
      if (r?.error) setErr(r.error);
      load();
    } catch (e: any) {
      console.error('Failed to draft monthly verification:', e);
      setErr(e.message || 'Failed to draft monthly verification');
    } finally {
      setDrafting(false);
    }
  }

  async function saveEdits(id: number) {
    const edit = edits[id];
    if (!edit) return;
    try {
      await patch(`/bcaba-monthly-verification/${id}`, {
        contactsCount: edit.contactsCount !== undefined ? parseInt(edit.contactsCount, 10) : undefined,
        observationCompleted: edit.observationCompleted,
      });
      load();
    } catch (e: any) {
      console.error('Failed to save M-FVF edits:', e);
      setErr(e.message || 'Failed to save changes');
    }
  }

  function openSignModal(id: number) {
    setSigningId(id);
  }

  async function submitSignature() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setErr('Please sign before submitting');
      return;
    }
    const sigDataUrl = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
    try {
      await patch(`/bcaba-monthly-verification/${signingId}/sign`, { role: 'supervisor', signature: sigDataUrl });
      setSigningId(null);
      load();
    } catch (e: any) {
      console.error('Failed to sign M-FVF:', e);
      setErr(e.message || 'Failed to sign');
    }
  }

  async function downloadPdf(id: number, monthLabel: string) {
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const res = await fetch(`${apiUrl}/bcaba-monthly-verification/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mfvf-${monthLabel.replace(' ', '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('Failed to download M-FVF PDF:', e);
      setErr(e.message || 'Failed to download PDF');
    }
  }

  return (
    <div style={{ padding: 40, maxWidth: 960, width: '100%', boxSizing: 'border-box' }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>BCaBA Fieldwork</p>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 24px' }}>Monthly Verification (M-FVF)</h1>

      {loadingTrainees ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading trainees...</p>
      ) : trainees.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>No trainees are currently assigned to you as supervisor.</p>
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 12 }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', margin: 0 }}>{monthLabel}</p>
            <button onClick={draftMonthly} disabled={drafting || !selectedTraineeId} style={{ background: 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: 'var(--mono)', fontSize: 12, cursor: (drafting || !selectedTraineeId) ? 'not-allowed' : 'pointer', opacity: (drafting || !selectedTraineeId) ? 0.6 : 1 }}>
              {drafting ? 'Drafting...' : `Draft ${monthLabel} M-FVF`}
            </button>
          </div>

          {err && (
            <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid var(--amber)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)', margin: 0 }}>{err}</p>
              <button
                onClick={load}
                style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)', background: 'transparent', border: '1px solid var(--amber)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                ↻ Retry
              </button>
            </div>
          )}

          {loading ? (
            <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading...</p>
          ) : err ? null : verifications.length === 0 ? (
            <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>No monthly verifications yet. Click &quot;Draft {monthLabel} M-FVF&quot; to generate one from logged fieldwork hours.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
              {verifications.map(v => {
                const edit = edits[v.id] || {};
                const contactsValue = edit.contactsCount !== undefined ? edit.contactsCount : String(v.contacts_count ?? 0);
                const obsValue = edit.observationCompleted !== undefined ? edit.observationCompleted : v.observation_completed;
                return (
                  <div key={v.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 12, marginBottom: 12 }}>
                      <div>
                        <p style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                          {new Date(v.month_year).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                        </p>
                        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>
                          Supervised: {Number(v.supervised_hours).toFixed(1)}h · Independent: {Number(v.independent_hours).toFixed(1)}h · Individual: {Number(v.individual_supervision_hours).toFixed(1)}h · Group: {Number(v.group_supervision_hours).toFixed(1)}h
                        </p>
                      </div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase' as const, background: statusColors[v.status]?.bg, color: statusColors[v.status]?.color }}>
                        {v.status}
                      </span>
                    </div>

                    {v.status === 'draft' && (
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>Contacts:</label>
                          <input
                            type="number"
                            min="0"
                            value={contactsValue}
                            onChange={e => setEdits(prev => ({ ...prev, [v.id]: { ...prev[v.id], contactsCount: e.target.value } }))}
                            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', width: 60 }}
                          />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={!!obsValue}
                            onChange={e => setEdits(prev => ({ ...prev, [v.id]: { ...prev[v.id], observationCompleted: e.target.checked } }))}
                          />
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink)' }}>Observation completed</span>
                        </label>
                        <button onClick={() => saveEdits(v.id)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink)', cursor: 'pointer' }}>
                          Save
                        </button>
                        <div style={{ flex: 1 }} />
                        <button onClick={() => openSignModal(v.id)} style={{ background: 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer' }}>
                          Sign as Supervisor
                        </button>
                      </div>
                    )}

                    {v.status === 'draft' && v.supervisor_signed_at && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--sky)', margin: 0 }}>✓ Supervisor signed — waiting on trainee signature</p>
                        <button onClick={() => downloadPdf(v.id, new Date(v.month_year).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }))} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 12px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', cursor: 'pointer' }}>
                          Download PDF
                        </button>
                      </div>
                    )}

                    {v.status === 'finalized' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12 }}>
                        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--spruce)', margin: 0 }}>
                          ✓ Fully signed — trainee {new Date(v.trainee_signed_at).toLocaleDateString()}, supervisor {new Date(v.supervisor_signed_at).toLocaleDateString()}
                        </p>
                        <button onClick={() => downloadPdf(v.id, new Date(v.month_year).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }))} style={{ background: 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer' }}>
                          Download PDF
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Signature Modal */}
      {signingId !== null && (
        <div onClick={() => setSigningId(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,32,24,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(15,32,24,0.15)' }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Sign to Certify</p>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Supervisor Signature</h2>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
              Sign below to certify the fieldwork hours and compliance information in this report are accurate to the best of your knowledge.
            </p>

            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 8, backgroundColor: '#fafafa' }}>
              <SignatureCanvas
                ref={sigRef}
                penColor="#0F2018"
                canvasProps={{ width: 456, height: 160, style: { display: 'block' } }}
              />
            </div>

            <button
              onClick={() => sigRef.current?.clear()}
              style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, padding: 0 }}
            >
              ↺ Clear signature
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setSigningId(null)}
                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={submitSignature}
                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: 'var(--spruce)', color: '#fff', border: 'none', fontFamily: 'var(--mono)', fontSize: 13, cursor: 'pointer' }}
              >
                Submit Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
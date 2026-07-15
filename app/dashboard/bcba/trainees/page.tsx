'use client';
import { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useApi } from '../../../context/api-context';

const statusColors: Record<string, { bg: string; color: string }> = {
  draft: { bg: 'rgba(0,0,0,0.05)', color: 'var(--muted)' },
  finalized: { bg: 'rgba(26,122,80,0.1)', color: 'var(--spruce)' },
};

export default function BcbaSupervisorTraineesPage() {
  const { get, patch } = useApi();
  const [trainees, setTrainees] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loadingTrainees, setLoadingTrainees] = useState(true);
  const [mfvfs, setMfvfs] = useState<any[]>([]);
  const [ffvfs, setFfvfs] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [err, setErr] = useState('');

  const [signing, setSigning] = useState<{ kind: 'mfvf' | 'ffvf'; id: number } | null>(null);
  const sigRef = useRef<any>(null);

  useEffect(() => {
    setLoadingTrainees(true);
    get('/supervisors/my-trainees').then((r: any) => {
      const list = Array.isArray(r?.trainees) ? r.trainees : [];
      setTrainees(list);
      if (list.length > 0) setSelectedId(list[0].professional_id);
    }).catch((e: any) => setErr(e.message || 'Failed to load trainees')).finally(() => setLoadingTrainees(false));
  }, []);

  const loadRecords = () => {
    if (!selectedId) return;
    setLoadingRecords(true);
    setErr('');
    Promise.all([
      get('/bcba-monthly-verification?traineeId=' + selectedId),
      get('/bcba-final-verification?traineeId=' + selectedId),
    ]).then(([m, f]: any[]) => {
      setMfvfs(Array.isArray(m?.verifications) ? m.verifications : []);
      setFfvfs(Array.isArray(f?.finalVerifications) ? f.finalVerifications : []);
    }).catch((e: any) => setErr(e.message || 'Failed to load records')).finally(() => setLoadingRecords(false));
  };

  useEffect(() => { loadRecords(); }, [selectedId]);

  async function submitSignature() {
    if (!sigRef.current || sigRef.current.isEmpty() || !signing) {
      setErr('Please sign before submitting');
      return;
    }
    const sigDataUrl = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
    const path = signing.kind === 'mfvf' ? '/bcba-monthly-verification/' : '/bcba-final-verification/';
    try {
      await patch(path + signing.id + '/sign', { role: 'supervisor', signature: sigDataUrl });
      setSigning(null);
      loadRecords();
    } catch (e: any) {
      setErr(e.message || 'Failed to sign');
    }
  }

  async function downloadPdf(kind: 'mfvf' | 'ffvf', id: number) {
    try {
      const token = await (window as any).Clerk?.session?.getToken();
      const path = kind === 'mfvf' ? 'bcba-monthly-verification' : 'bcba-final-verification';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${path}/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${path}-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErr('Failed to download PDF');
    }
  }

  const selectedTrainee = trainees.find(t => t.professional_id === selectedId);
  const mfvfDrafts = mfvfs.filter(v => v.status === 'draft');
  const mfvfFinalized = mfvfs.filter(v => v.status === 'finalized');
  const ffvfDrafts = ffvfs.filter(v => v.status === 'draft');
  const ffvfFinalized = ffvfs.filter(v => v.status === 'finalized');

  return (
    <div style={{ padding: 40, maxWidth: 900, width: '100%', boxSizing: 'border-box' }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>BCBA Supervision</p>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 24px' }}>My BCBA Trainees</h1>

      {err && (
        <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid var(--amber)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)', margin: 0 }}>{err}</p>
        </div>
      )}

      {loadingTrainees ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading...</p>
      ) : trainees.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            No BCBA trainees have linked your account as their supervisor yet. A trainee links you from their Fieldwork page's Supervisors panel using your account email.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' as const }}>
            {trainees.map((t: any) => (
              <button
                key={t.professional_id}
                onClick={() => setSelectedId(t.professional_id)}
                style={{ border: '1px solid var(--border)', background: selectedId === t.professional_id ? 'var(--spruce)' : 'transparent', color: selectedId === t.professional_id ? '#fff' : 'var(--ink)', font: '600 12px var(--sans)', padding: '8px 16px', borderRadius: 20, cursor: 'pointer' }}
              >
                {t.full_name}{t.is_responsible ? ' (Responsible)' : ''}
              </button>
            ))}
          </div>

          {loadingRecords ? (
            <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading records...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 32 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 600, color: 'var(--ink)', margin: '0 0 12px' }}>Monthly Verification (M-FVF)</h2>
                {mfvfs.length === 0 ? (
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>No M-FVF drafts from {selectedTrainee?.full_name} yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                    {mfvfDrafts.map((v: any) => (
                      <div key={v.id} style={{ background: 'var(--surface)', border: '1px solid var(--amber)', borderRadius: 12, padding: '18px 22px' }}>
                        <p style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>
                          {new Date(v.month_year).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                        </p>
                        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: '0 0 12px' }}>
                          Supervised: {Number(v.supervised_hours).toFixed(1)}h · Independent: {Number(v.independent_hours).toFixed(1)}h · Contacts: {v.contacts_count} · Observation: {v.observation_completed ? 'Yes' : 'No'}
                        </p>
                        {v.trainee_signed_at && !v.supervisor_signed_at ? (
                          <button onClick={() => setSigning({ kind: 'mfvf', id: v.id })} style={{ background: 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer' }}>
                            Review & Sign
                          </button>
                        ) : (
                          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: 0 }}>Waiting on trainee to sign first</p>
                        )}
                      </div>
                    ))}
                    {mfvfFinalized.map((v: any) => (
                      <div key={v.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 22px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 8 }}>
                          <p style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                            {new Date(v.month_year).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                          </p>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase' as const, background: statusColors.finalized.bg, color: statusColors.finalized.color }}>finalized</span>
                        </div>
                        <button onClick={() => downloadPdf('mfvf', v.id)} style={{ marginTop: 10, background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--sky)', cursor: 'pointer' }}>
                          Download PDF ↓
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 600, color: 'var(--ink)', margin: '0 0 12px' }}>Final Verification (F-FVF)</h2>
                {ffvfs.length === 0 ? (
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>No F-FVF drafts from {selectedTrainee?.full_name} yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                    {ffvfDrafts.map((fv: any) => (
                      <div key={fv.id} style={{ background: 'var(--surface)', border: '1px solid var(--amber)', borderRadius: 12, padding: '18px 22px' }}>
                        <p style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>
                          {fv.organization_name || 'Final Verification'} — {new Date(fv.period_start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })} to {new Date(fv.period_end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}
                        </p>
                        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: '0 0 12px' }}>
                          Total: {Number(fv.total_fieldwork_hours).toFixed(1)}h · {Number(fv.percent_supervised).toFixed(1)}% supervised
                        </p>
                        {fv.trainee_signed_at && !fv.supervisor_signed_at ? (
                          <button onClick={() => setSigning({ kind: 'ffvf', id: fv.id })} style={{ background: 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer' }}>
                            Review & Sign
                          </button>
                        ) : (
                          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: 0 }}>Waiting on trainee to sign first</p>
                        )}
                      </div>
                    ))}
                    {ffvfFinalized.map((fv: any) => (
                      <div key={fv.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 22px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 8 }}>
                          <p style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                            {fv.organization_name || 'Final Verification'}
                          </p>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase' as const, background: statusColors.finalized.bg, color: statusColors.finalized.color }}>finalized</span>
                        </div>
                        <button onClick={() => downloadPdf('ffvf', fv.id)} style={{ marginTop: 10, background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--sky)', cursor: 'pointer' }}>
                          Download PDF ↓
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Signature Modal */}
      {signing && (
        <div onClick={() => setSigning(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,32,24,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(15,32,24,0.15)' }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Sign to Certify</p>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Supervisor Signature</h2>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
              Sign below to certify the fieldwork hours and compliance information in this report are accurate to the best of your knowledge.
            </p>
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 8, backgroundColor: '#fafafa' }}>
              <SignatureCanvas ref={sigRef} penColor="#0F2018" canvasProps={{ width: 456, height: 160, style: { display: 'block' } }} />
            </div>
            <button onClick={() => sigRef.current?.clear()} style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, padding: 0 }}>
              ↺ Clear signature
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSigning(null)} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={submitSignature} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: 'var(--spruce)', color: '#fff', border: 'none', fontFamily: 'var(--mono)', fontSize: 13, cursor: 'pointer' }}>
                Submit Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useApi } from '../../context/api-context';

const statusColors: Record<string, { bg: string; color: string }> = {
  draft: { bg: 'rgba(0,0,0,0.05)', color: 'var(--muted)' },
  finalized: { bg: 'rgba(26,122,80,0.1)', color: 'var(--spruce)' },
};

export default function MyMonthlyVerificationPage() {
  const { get, patch } = useApi();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [signingId, setSigningId] = useState<number | null>(null);
  const sigRef = useRef<any>(null);

  const load = () => {
    setLoading(true);
    get('/bcaba-monthly-verification/mine').then((r: any) => {
      setVerifications(Array.isArray(r?.verifications) ? r.verifications : []);
    }).catch(() => setErr('Failed to load monthly verifications')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
      await patch(`/bcaba-monthly-verification/${signingId}/sign`, { role: 'trainee', signature: sigDataUrl });
      setSigningId(null);
      load();
    } catch (e: any) {
      setErr(e.message || 'Failed to sign');
    }
  }

  const awaitingYou = verifications.filter(v => v.supervisor_signed_at && !v.trainee_signed_at);
  const otherPending = verifications.filter(v => !v.supervisor_signed_at && !v.trainee_signed_at);
  const finalized = verifications.filter(v => v.status === 'finalized');

  return (
    <div style={{ padding: 40, maxWidth: 800, width: '100%', boxSizing: 'border-box' }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Fieldwork Verification</p>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 24px' }}>Monthly Verification (M-FVF)</h1>

      {err && (
        <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid var(--amber)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)', margin: 0 }}>{err}</p>
        </div>
      )}

      {loading ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading...</p>
      ) : verifications.length === 0 ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>No monthly verifications yet. Your supervisor creates these once your fieldwork hours for the month are logged.</p>
      ) : (
        <>
          {awaitingYou.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: 'var(--amber)', marginBottom: 12 }}>
                Awaiting your signature ({awaitingYou.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {awaitingYou.map(v => (
                  <div key={v.id} style={{ background: 'var(--surface)', border: '1px solid var(--amber)', borderRadius: 12, padding: '20px 24px' }}>
                    <p style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>
                      {new Date(v.month_year).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: '0 0 16px' }}>
                      Supervised: {Number(v.supervised_hours).toFixed(1)}h · Independent: {Number(v.independent_hours).toFixed(1)}h · Individual: {Number(v.individual_supervision_hours).toFixed(1)}h · Group: {Number(v.group_supervision_hours).toFixed(1)}h · Contacts: {v.contacts_count} · Observation: {v.observation_completed ? 'Yes' : 'No'}
                    </p>
                    <button onClick={() => openSignModal(v.id)} style={{ background: 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer' }}>
                      Review & Sign
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherPending.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 12 }}>
                Pending supervisor signature ({otherPending.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {otherPending.map(v => (
                  <div key={v.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', opacity: 0.7 }}>
                    <p style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                      {new Date(v.month_year).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>Waiting on your supervisor to review and sign first</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {finalized.length > 0 && (
            <div>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 12 }}>
                Finalized ({finalized.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {finalized.map(v => (
                  <div key={v.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                        {new Date(v.month_year).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase' as const, background: statusColors.finalized.bg, color: statusColors.finalized.color }}>
                        finalized
                      </span>
                    </div>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--spruce)', margin: '8px 0 0' }}>
                      ✓ Signed by both parties — trainee {new Date(v.trainee_signed_at).toLocaleDateString()}, supervisor {new Date(v.supervisor_signed_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Signature Modal */}
      {signingId !== null && (
        <div onClick={() => setSigningId(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,32,24,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(15,32,24,0.15)' }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Sign to Certify</p>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Trainee Signature</h2>
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

'use client';
import { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useApi } from '../../context/api-context';

const statusColors: Record<string, { bg: string; color: string }> = {
  draft: { bg: 'rgba(0,0,0,0.05)', color: 'var(--muted)' },
  finalized: { bg: 'rgba(26,122,80,0.1)', color: 'var(--spruce)' },
};

const inp = { width: '100%', maxWidth: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' as const };
const lbl = { display: 'block' as const, fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 6 };

function pad(n: number) { return n < 10 ? '0' + n : String(n); }

export default function BcbaMonthlyVerificationPage() {
  const { get, post, patch, del } = useApi();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);

  const today = new Date();
  const [supervisorId, setSupervisorId] = useState('');
  const [monthYear, setMonthYear] = useState(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`);
  const [fieldworkType, setFieldworkType] = useState('supervised');
  const [drafting, setDrafting] = useState(false);

  const [signingId, setSigningId] = useState<number | null>(null);
  const [signingRole, setSigningRole] = useState<'trainee' | 'supervisor'>('trainee');
  const sigRef = useRef<any>(null);

  const load = () => {
    setLoading(true);
    setErr('');
    Promise.all([
      get('/bcba-monthly-verification/mine'),
      get('/supervisors'),
    ]).then(([v, s]: any[]) => {
      setVerifications(Array.isArray(v?.verifications) ? v.verifications : []);
      const list = Array.isArray(s?.supervisors) ? s.supervisors : [];
      setSupervisors(list);
      if (!supervisorId) {
        const responsible = list.find((sup: any) => sup.is_responsible) || list[0];
        if (responsible) setSupervisorId(String(responsible.id));
      }
    }).catch((e: any) => {
      console.error('Failed to load M-FVF data:', e);
      setErr(e?.message || 'Failed to load. Please try again.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function createDraft() {
    if (!supervisorId || !monthYear) return;
    setDrafting(true);
    setErr('');
    try {
      await post('/bcba-monthly-verification/draft', { supervisorId: parseInt(supervisorId, 10), monthYear, fieldworkType });
      setOk(true); setTimeout(() => setOk(false), 3000);
      load();
    } catch (e: any) {
      setErr(e.message || 'Failed to create draft');
    } finally {
      setDrafting(false);
    }
  }

  async function deleteDraft(id: number) {
    if (!confirm('Delete this draft M-FVF? This cannot be undone.')) return;
    try {
      await del('/bcba-monthly-verification/' + id);
      load();
    } catch (e: any) {
      setErr(e.message || 'Failed to delete draft');
    }
  }

  function openSignModal(id: number, role: 'trainee' | 'supervisor') {
    setSigningId(id);
    setSigningRole(role);
  }

  async function submitSignature() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setErr('Please sign before submitting');
      return;
    }
    const sigDataUrl = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
    try {
      await patch(`/bcba-monthly-verification/${signingId}/sign`, { role: signingRole, signature: sigDataUrl });
      setSigningId(null);
      load();
    } catch (e: any) {
      console.error('Failed to sign M-FVF:', e);
      setErr(e.message || 'Failed to sign');
    }
  }

  async function downloadPdf(id: number) {
    try {
      const token = await (window as any).Clerk?.session?.getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bcba-monthly-verification/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bcba-mfvf-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErr('Failed to download PDF');
    }
  }

  const drafts = verifications.filter(v => v.status === 'draft');
  const finalized = verifications.filter(v => v.status === 'finalized');

  return (
    <div style={{ padding: 40, maxWidth: 800, width: '100%', boxSizing: 'border-box' }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>BCBA Fieldwork</p>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 24px' }}>Monthly Verification (M-FVF)</h1>

      {err && (
        <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid var(--amber)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)', margin: 0 }}>{err}</p>
          <button onClick={load} style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)', background: 'transparent', border: '1px solid var(--amber)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
            ↻ Retry
          </button>
        </div>
      )}

      {/* Create draft */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', marginBottom: 28 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 16 }}>Create a Draft</p>
        {supervisors.length === 0 ? (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>Add a supervisor on your Fieldwork page before creating an M-FVF.</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={lbl}>Supervisor</label>
                <select value={supervisorId} onChange={e => setSupervisorId(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  {supervisors.map((s: any) => <option key={s.id} value={s.id}>{s.supervisor_name}{s.is_responsible ? ' (Responsible)' : ''}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Month</label>
                <input type="month" value={monthYear.slice(0, 7)} onChange={e => setMonthYear(e.target.value + '-01')} style={inp} />
              </div>
              <div>
                <label style={lbl}>Fieldwork Track</label>
                <select value={fieldworkType} onChange={e => setFieldworkType(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="supervised">Supervised (2,000 hrs)</option>
                  <option value="concentrated">Concentrated (1,500 hrs)</option>
                </select>
              </div>
            </div>
            <button onClick={createDraft} disabled={drafting} style={{ background: drafting ? 'var(--muted)' : 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: 'var(--mono)', fontSize: 12, cursor: drafting ? 'not-allowed' : 'pointer' }}>
              {drafting ? 'Creating...' : 'Create Draft'}
            </button>
            {ok && <span style={{ marginLeft: 12, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--spruce)' }}>✓ Draft created</span>}
          </>
        )}
      </div>

      {loading ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading...</p>
      ) : (
        <>
          {drafts.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: 'var(--amber)', marginBottom: 12 }}>
                Drafts — needs signatures ({drafts.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {drafts.map(v => (
                  <div key={v.id} style={{ background: 'var(--surface)', border: '1px solid var(--amber)', borderRadius: 12, padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 8 }}>
                      <div>
                        <p style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>
                          {new Date(v.month_year).toLocaleString('en-US', { month: 'long', year: 'numeric' })} · {v.supervisor_name}
                        </p>
                        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: '0 0 12px' }}>
                          Supervised: {Number(v.supervised_hours).toFixed(1)}h · Independent: {Number(v.independent_hours).toFixed(1)}h · Individual: {Number(v.individual_supervision_hours).toFixed(1)}h · Group: {Number(v.group_supervision_hours).toFixed(1)}h · Contacts: {v.contacts_count} · Observation: {v.observation_completed ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <button onClick={() => deleteDraft(v.id)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--amber)', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                      <button onClick={() => openSignModal(v.id, 'trainee')} disabled={!!v.trainee_signed_at} style={{ background: v.trainee_signed_at ? 'rgba(26,122,80,0.1)' : 'var(--spruce)', color: v.trainee_signed_at ? 'var(--spruce)' : '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--mono)', fontSize: 11, cursor: v.trainee_signed_at ? 'default' : 'pointer' }}>
                        {v.trainee_signed_at ? '✓ Trainee signed' : 'Sign as Trainee'}
                      </button>
                      <button onClick={() => openSignModal(v.id, 'supervisor')} disabled={!!v.supervisor_signed_at} style={{ background: v.supervisor_signed_at ? 'rgba(26,122,80,0.1)' : 'var(--spruce)', color: v.supervisor_signed_at ? 'var(--spruce)' : '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--mono)', fontSize: 11, cursor: v.supervisor_signed_at ? 'default' : 'pointer' }}>
                        {v.supervisor_signed_at ? '✓ Supervisor signed' : 'Sign as Supervisor'}
                      </button>
                    </div>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginTop: 8 }}>Have your supervisor sign on this device once they've reviewed the hours above.</p>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 8 }}>
                      <p style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                        {new Date(v.month_year).toLocaleString('en-US', { month: 'long', year: 'numeric' })} · {v.supervisor_name}
                      </p>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase' as const, background: statusColors.finalized.bg, color: statusColors.finalized.color }}>
                        finalized
                      </span>
                    </div>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--spruce)', margin: '8px 0 12px' }}>
                      ✓ Signed by both parties — trainee {new Date(v.trainee_signed_at).toLocaleDateString()}, supervisor {new Date(v.supervisor_signed_at).toLocaleDateString()}
                    </p>
                    <button onClick={() => downloadPdf(v.id)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--sky)', cursor: 'pointer' }}>
                      Download PDF ↓
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {verifications.length === 0 && (
            <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>No monthly verifications yet. Create your first draft above once a month's hours are logged.</p>
          )}
        </>
      )}

      {/* Signature Modal */}
      {signingId !== null && (
        <div onClick={() => setSigningId(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,32,24,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(15,32,24,0.15)' }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Sign to Certify</p>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>{signingRole === 'trainee' ? 'Trainee' : 'Supervisor'} Signature</h2>
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
              <button onClick={() => setSigningId(null)} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 13, cursor: 'pointer' }}>
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

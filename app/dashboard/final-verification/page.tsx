'use client';
import { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useApi } from '../../context/api-context';

const statusColors: Record<string, { bg: string; color: string }> = {
  draft: { bg: 'rgba(0,0,0,0.05)', color: 'var(--muted)' },
  finalized: { bg: 'rgba(26,122,80,0.1)', color: 'var(--spruce)' },
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  finalized: 'Finalized',
};

const fld = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 13, marginBottom: 16, boxSizing: 'border-box' as const };
const fldLbl = { fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block' as const, marginBottom: 6 };

export default function BcbaFinalVerificationPage() {
  const { get, post, patch } = useApi();

  const [finalVerifications, setFinalVerifications] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<number | null>(null);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [fieldworkType, setFieldworkType] = useState('supervised');
  const [orgName, setOrgName] = useState('');
  const [creating, setCreating] = useState(false);

  const [signingId, setSigningId] = useState<number | null>(null);
  const [signingRole, setSigningRole] = useState<'trainee' | 'supervisor'>('trainee');
  const sigRef = useRef<any>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      get('/bcba-final-verification/mine'),
      get('/supervisors'),
    ])
      .then(([fvRes, supRes]: any) => {
        setFinalVerifications(Array.isArray(fvRes?.finalVerifications) ? fvRes.finalVerifications : []);
        const list = Array.isArray(supRes?.supervisors) ? supRes.supervisors : [];
        setSupervisors(list);
        if (!selectedSupervisorId) {
          const responsible = list.find((s: any) => s.is_responsible) || list[0];
          if (responsible) setSelectedSupervisorId(responsible.id);
        }
      })
      .catch(() => setErr('Failed to load Final Verification data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function createDraft() {
    if (!selectedSupervisorId || !periodStart || !periodEnd) {
      setErr('Please select a supervisor and date range');
      return;
    }
    setCreating(true);
    setErr('');
    try {
      await post('/bcba-final-verification/draft', {
        supervisorId: selectedSupervisorId,
        periodStartDate: periodStart,
        periodEndDate: periodEnd,
        fieldworkType,
        organizationName: orgName || null,
      });
      setShowNewForm(false);
      setPeriodStart('');
      setPeriodEnd('');
      setOrgName('');
      load();
    } catch (e: any) {
      setErr(e.message || 'Failed to create F-FVF draft');
    } finally {
      setCreating(false);
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
      await patch(`/bcba-final-verification/${signingId}/sign`, { role: signingRole, signature: sigDataUrl });
      setSigningId(null);
      load();
    } catch (e: any) {
      setErr(e.message || 'Failed to sign');
    }
  }

  async function downloadPdf(id: number) {
    try {
      const token = await (window as any).Clerk?.session?.getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bcba-final-verification/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bcba-ffvf-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErr('Failed to download PDF');
    }
  }

  const drafts = finalVerifications.filter(f => f.status === 'draft');
  const finalized = finalVerifications.filter(f => f.status === 'finalized');

  return (
    <div style={{ padding: 40, maxWidth: 800, width: '100%', boxSizing: 'border-box' }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>BCBA Fieldwork</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' as const, gap: 12 }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>Final Verification (F-FVF)</h1>
        <button onClick={() => setShowNewForm(true)} style={{ background: 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer' }}>
          + New F-FVF
        </button>
      </div>

      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
        Aggregates every finalized Monthly Verification (M-FVF) for the selected supervisor and fieldwork track within a date range. Finalize each month's M-FVF first — only finalized months are eligible.
      </p>

      {err && (
        <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid var(--amber)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)', margin: 0 }}>{err}</p>
        </div>
      )}

      {loading ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading...</p>
      ) : finalVerifications.length === 0 ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>No Final Verification Forms yet. Create one once you have finalized M-FVFs covering the full supervision period.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 24 }}>
          {drafts.length > 0 && (
            <div>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: 'var(--amber)', marginBottom: 12 }}>Drafts — needs signatures ({drafts.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {drafts.map(fv => (
                  <FvCard
                    key={fv.id}
                    fv={fv}
                    trainee={!fv.trainee_signed_at}
                    supervisor={!fv.supervisor_signed_at}
                    onSignTrainee={() => openSignModal(fv.id, 'trainee')}
                    onSignSupervisor={() => openSignModal(fv.id, 'supervisor')}
                  />
                ))}
              </div>
            </div>
          )}
          {finalized.length > 0 && (
            <div>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 12 }}>Finalized ({finalized.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {finalized.map(fv => (
                  <FvCard key={fv.id} fv={fv} onDownload={() => downloadPdf(fv.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New F-FVF Modal */}
      {showNewForm && (
        <div onClick={() => setShowNewForm(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,32,24,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(15,32,24,0.15)' }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 6 }}>New Form</p>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 20 }}>Final Fieldwork Verification</h2>

            <label style={fldLbl}>Supervisor</label>
            <select value={selectedSupervisorId ?? ''} onChange={e => setSelectedSupervisorId(Number(e.target.value))} style={fld}>
              <option value="">Select a supervisor...</option>
              {supervisors.map((s: any) => <option key={s.id} value={s.id}>{s.supervisor_name}</option>)}
            </select>

            <div style={{ display: 'flex', gap: 12, marginBottom: 0 }}>
              <div style={{ flex: 1 }}>
                <label style={fldLbl}>Period Start</label>
                <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} style={fld} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={fldLbl}>Period End</label>
                <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} style={fld} />
              </div>
            </div>

            <label style={fldLbl}>Fieldwork Track</label>
            <select value={fieldworkType} onChange={e => setFieldworkType(e.target.value)} style={fld}>
              <option value="supervised">Supervised (2,000 hrs)</option>
              <option value="concentrated">Concentrated (1,500 hrs)</option>
            </select>

            <label style={fldLbl}>Organization (optional)</label>
            <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Organization name" style={fld} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowNewForm(false)} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={createDraft} disabled={creating} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: 'var(--spruce)', color: '#fff', border: 'none', fontFamily: 'var(--mono)', fontSize: 13, cursor: 'pointer', opacity: creating ? 0.6 : 1 }}>
                {creating ? 'Creating...' : 'Generate Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {signingId !== null && (
        <div onClick={() => setSigningId(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,32,24,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(15,32,24,0.15)' }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 6 }}>Sign to Certify</p>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
              {signingRole === 'trainee' ? 'Trainee Signature' : 'Supervisor Signature'}
            </h2>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
              Sign below to certify the total fieldwork hours and attestations in this Final Verification Form are accurate to the best of your knowledge.
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

function FvCard({ fv, trainee, supervisor, onSignTrainee, onSignSupervisor, onDownload }: {
  fv: any; trainee?: boolean; supervisor?: boolean; onSignTrainee?: () => void; onSignSupervisor?: () => void; onDownload?: () => void;
}) {
  const colors = statusColors[fv.status] || statusColors.draft;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid ' + (fv.status === 'draft' ? 'var(--amber)' : 'var(--border)'), borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' as const, gap: 8 }}>
        <p style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
          {fv.organization_name || fv.supervisor_name || 'Final Verification'} — {new Date(fv.period_start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })} to {new Date(fv.period_end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}
        </p>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase' as const, background: colors.bg, color: colors.color }}>
          {statusLabels[fv.status] || fv.status}
        </span>
      </div>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: '8px 0 12px' }}>
        Supervised: {Number(fv.total_supervised_hours).toFixed(1)}h · Independent: {Number(fv.total_independent_hours).toFixed(1)}h · Individual: {Number(fv.total_individual_supervision_hours).toFixed(1)}h · Group: {Number(fv.total_group_supervision_hours).toFixed(1)}h · Total: {Number(fv.total_fieldwork_hours).toFixed(1)}h · {Number(fv.percent_supervised).toFixed(1)}% supervised
      </p>
      {fv.status === 'finalized' && (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--spruce)', margin: '0 0 12px' }}>
          ✓ Signed by both parties — trainee {new Date(fv.trainee_signed_at).toLocaleDateString()}, supervisor {new Date(fv.supervisor_signed_at).toLocaleDateString()}
        </p>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
        {onSignTrainee && (
          <button onClick={onSignTrainee} disabled={!trainee} style={{ background: !trainee ? 'rgba(26,122,80,0.1)' : 'var(--spruce)', color: !trainee ? 'var(--spruce)' : '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--mono)', fontSize: 11, cursor: !trainee ? 'default' : 'pointer' }}>
            {!trainee ? '✓ Trainee signed' : 'Sign as Trainee'}
          </button>
        )}
        {onSignSupervisor && (
          <button onClick={onSignSupervisor} disabled={!supervisor} style={{ background: !supervisor ? 'rgba(26,122,80,0.1)' : 'var(--spruce)', color: !supervisor ? 'var(--spruce)' : '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--mono)', fontSize: 11, cursor: !supervisor ? 'default' : 'pointer' }}>
            {!supervisor ? '✓ Supervisor signed' : 'Sign as Supervisor'}
          </button>
        )}
        {onDownload && (
          <button onClick={onDownload} style={{ background: 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer' }}>
            Download PDF
          </button>
        )}
      </div>
    </div>
  );
}

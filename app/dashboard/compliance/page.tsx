'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useApi } from '../../context/api-context';
import { useCompliance } from '../../context/compliance-context';
import SignatureCanvas from 'react-signature-canvas';

const ADJUSTMENT_REASON_LABELS: Record<string, string> = {
  no_observation: 'No client observation logged — entire month ineligible',
  below_minimum_hours: 'Below the 20-hour monthly minimum — entire month ineligible',
  trimmed_to_max_hours: 'Independent hours trimmed to the monthly maximum',
  group_trimmed_to_individual: 'Group supervision hours reduced to match individual hours',
  prorated_for_contacts: 'Hours prorated — not enough supervisor contacts this month',
  independent_hours_reduced_for_supervision_pct: 'Independent hours reduced to meet the supervision percentage',
  concentrated_hours_not_prorated_see_handbook_p23: 'Concentrated month did not meet all requirements — hours cannot be prorated (BACB Handbook p.23) and are ineligible in full',
};

export default function CompliancePage() {
  const { patch } = useApi();
  const { getToken } = useAuth();
  const { data, loading, refetch } = useCompliance();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [exporting, setExporting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [startDateInput, setStartDateInput] = useState('');
  const [savingStartDate, setSavingStartDate] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const [showSigModal, setShowSigModal] = useState(false);
  const sigRef = useRef<any>(null);

  const month = selectedMonth;

  const handleSaveStartDate = async () => {
    if (!startDateInput) return;
    setSavingStartDate(true);
    try {
      await patch('/compliance/fieldwork-start-date', { fieldworkStartDate: startDateInput });
      refetch();
    } catch (err) {
      console.error('Failed to save fieldwork start date:', err);
      alert('Could not save your fieldwork start date. Please try again.');
    } finally {
      setSavingStartDate(false);
    }
  };

  const handleExportClick = () => {
    setShowSigModal(true);
  };

  const handleDownload = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      alert('Please sign before downloading.');
      return;
    }
    const sigDataUrl = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
    setExporting(true);
    setShowSigModal(false);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const base = apiUrl.replace(/\/api$/, '');
      const res = await fetch(`${base}/export`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: sigDataUrl, month: selectedMonth }),
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `supervisd-hours-${selectedMonth}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const d = data;
  const totalRequired = d?.totalHoursRequired || 2000;
  const currentMonthEntry = (d?.monthlyBreakdown || []).find((m: any) => m.month === month);
  const monthIneligible = !!currentMonthEntry && currentMonthEntry.eligibleHours === 0 && currentMonthEntry.rawHours > 0;

  const card = (label: string, value: string, sub?: string, color?: string) => (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', minWidth: 0 }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 600, color: color || 'var(--ink)', margin: 0, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{sub}</p>}
    </div>
  );

  const badge = (pass: boolean, label: string, val: string, ineligible?: boolean) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: isMobile ? '100%' : 'auto' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: (ineligible || !pass) ? 'var(--amber)' : 'var(--spruce)', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 500, color: 'var(--ink)' }}>{val}</span>
        <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: (ineligible || !pass) ? 'rgba(255,160,0,0.1)' : 'rgba(26,122,80,0.1)', color: (ineligible || !pass) ? 'var(--amber)' : 'var(--spruce)' }}>{ineligible ? 'Ineligible this month' : (pass ? 'Met' : 'Action needed')}</span>
      </div>
    </div>
  );

  return (
    <div style={{ padding: isMobile ? '16px 14px' : 40, maxWidth: 900, width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Compliance</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>Monthly Review</h1>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 0 }}>{month}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)', backgroundColor: 'var(--surface)', outline: 'none', cursor: 'pointer', flex: 1 }}
          />
          <button
            onClick={handleExportClick}
            disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: exporting ? 'rgba(26,122,80,0.4)' : 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, cursor: exporting ? 'not-allowed' : 'pointer', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
          >
            {exporting ? 'Exporting...' : '↓ Export PDF'}
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading...</p>
      ) : !d ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--amber)' }}>No data yet — log some hours first.</p>
      ) : (
        <>
          {d.fieldworkStartDateSource === 'inferred_from_earliest_entry' && (
            <div style={{ background: 'rgba(255,160,0,0.08)', border: '1px solid rgba(255,160,0,0.3)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                When did your fieldwork clock start?
              </p>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.6 }}>
                This is the date your supervision contract was signed and your qualifying coursework began — not
                necessarily the date of your first logged hour. We use this to confirm which BACB rule set applies to
                you and your 5-year fieldwork deadline.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="date"
                  value={startDateInput}
                  onChange={e => setStartDateInput(e.target.value)}
                  style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)', backgroundColor: 'var(--surface)', outline: 'none' }}
                />
                <button
                  onClick={handleSaveStartDate}
                  disabled={savingStartDate || !startDateInput}
                  style={{ padding: '9px 18px', borderRadius: 8, backgroundColor: savingStartDate || !startDateInput ? 'rgba(26,122,80,0.4)' : 'var(--spruce)', color: '#fff', border: 'none', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, cursor: savingStartDate || !startDateInput ? 'not-allowed' : 'pointer' }}
                >
                  {savingStartDate ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
            {card('Total Hours', Number(d.totalHours || 0).toFixed(1), `${((d.totalHours / totalRequired) * 100).toFixed(1)}% of ${totalRequired.toLocaleString()}`)}
            {card('Supervised', Number(d.supervisedHours || 0).toFixed(1) + ' hrs', `${Number(d.supervisionPct || 0).toFixed(1)}%`, d.supervisionMet ? 'var(--spruce)' : 'var(--amber)')}
            {card('Independent', Number(d.independentHours || 0).toFixed(1) + ' hrs', `${d.totalHours > 0 ? (100 - d.supervisionPct).toFixed(1) : 0}%`)}
            {card('Restricted', Number(d.restrictedPct || 0).toFixed(1) + '%', d.restrictedMet ? 'Within limit' : 'Over limit', d.restrictedMet ? 'var(--spruce)' : 'var(--amber)')}
          </div>

          {d.combinedTrackProgress && (
            <div style={{ background: 'rgba(45,143,214,0.08)', border: '1px solid rgba(45,143,214,0.3)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                  Combined track progress
                </p>
                <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: d.combinedTrackProgress.meetsMinimum ? 'rgba(26,122,80,0.1)' : 'rgba(45,143,214,0.12)', color: d.combinedTrackProgress.meetsMinimum ? 'var(--spruce)' : 'var(--sky)' }}>
                  {d.combinedTrackProgress.meetsMinimum ? 'Minimum met' : 'Below minimum'}
                </span>
              </div>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 10 }}>
                You&apos;ve logged hours under both Supervised ({d.combinedTrackProgress.supervisedHours} hrs) and Concentrated ({d.combinedTrackProgress.concentratedHours} hrs) fieldwork. Per BACB Handbook p.15, Concentrated hours count at a 1.33× multiplier when combined toward the 2,000-hour total — for informational purposes only, this does not change your actual eligible hours above.
              </p>
              <p style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                {d.combinedTrackProgress.adjustedTotal} <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 400, color: 'var(--muted)' }}>combined hours toward 2,000</span>
              </p>
            </div>
          )}

          {d.hoursAdjustmentApplied && (
            <div style={{ background: 'rgba(255,160,0,0.08)', border: '1px solid rgba(255,160,0,0.3)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                  Some logged hours aren&apos;t currently BACB-eligible
                </p>
                <p style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 600, color: 'var(--amber)', margin: 0 }}>
                  {d.totalEligibleHours} <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 400, color: 'var(--muted)' }}>eligible of {d.totalHours} logged</span>
                </p>
              </div>
              <div>
                {(d.monthlyBreakdown || []).filter((m: any) => m.reasons?.length > 0).map((m: any) => (
                  <div key={m.month} style={{ padding: '10px 0', borderTop: '1px solid rgba(255,160,0,0.2)' }}>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)', margin: '0 0 4px' }}>
                      {m.month}: {m.eligibleHours} of {m.rawHours} hrs eligible
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {m.reasons.map((r: string) => (
                        <li key={r} style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>
                          {ADJUSTMENT_REASON_LABELS[r] || r}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {monthIneligible && (
            <div style={{ background: 'rgba(255,160,0,0.1)', border: '1px solid rgba(255,160,0,0.4)', borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: 'var(--amber)', margin: 0, lineHeight: 1.6 }}>
                ⚠ None of your logged hours for {month} currently count toward your total ({(currentMonthEntry?.reasons || []).map((r: string) => ADJUSTMENT_REASON_LABELS[r] || r).join('; ')}). The percentages below are calculated from raw logged hours and will not reflect your real standing until this is resolved.
              </p>
            </div>
          )}

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px', marginBottom: 24, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 20 }}>BACB Requirements — {month}</p>
            {badge(d.supervisionMet, `Supervision ≥ ${(d.supervisionPct !== undefined ? '' : '')}${Math.round((d.totalHoursRequired === 1500 ? 10 : 5))}% of hours`, Number(d.supervisionPct || 0).toFixed(1) + ' %', monthIneligible)}
            {badge(d.unrestrictedMet, 'Unrestricted activities ≥ 60% of total', (d.unrestrictedPct !== undefined ? Number(d.unrestrictedPct) : (100 - (d.restrictedPct || 0))).toFixed(1) + ' %', monthIneligible)}
            {badge(d.contactsMet, 'Supervision contacts this month', `${d.supervisionContacts} of ${d.contactsRequired || '—'} required`)}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.monthlyObservationMet ? 'var(--spruce)' : 'var(--amber)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)' }}>Monthly observation completed</span>
              </div>
              <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: d.monthlyObservationMet ? 'rgba(26,122,80,0.1)' : 'rgba(255,160,0,0.1)', color: d.monthlyObservationMet ? 'var(--spruce)' : 'var(--amber)' }}>{d.monthlyObservationMet ? 'Completed' : 'Not yet this month'}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10, marginBottom: 16 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px', minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 20 }}>Hours Breakdown</p>
              {[['Unrestricted', d.unrestricted], ['Restricted', d.restricted], ['Supervised', d.supervisedHours], ['Independent', d.independentHours], ['Total', d.totalHours]].map(([label, val]) => (
                <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: label !== 'Total' ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: label === 'Total' ? 600 : 500, color: 'var(--ink)' }}>{Number(val || 0).toFixed(1)}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px', minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 20 }}>Hours Pace</p>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{Number(d.totalHours || 0).toFixed(0)} / {totalRequired.toLocaleString()} hrs</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{((d.totalHours / totalRequired) * 100).toFixed(1)}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, var(--spruce), #5BC891)', width: `${Math.min((d.totalHours / totalRequired) * 100, 100)}%` }} />
                </div>
              </div>
              {d.projectedCompletionDate === 'complete' ? (
                <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--spruce)' }}>✓ {totalRequired.toLocaleString()} hours complete!</p>
              ) : d.projectedCompletionDate ? (
                <>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Projected completion</p>
                  <p style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{d.projectedCompletionDate ? new Date(d.projectedCompletionDate + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''}</p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>based on current pace</p>
                </>
              ) : (
                <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>Log more hours to see projection</p>
              )}
              {d.fieldworkDeadline && (
                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  5-year fieldwork deadline: {new Date(d.fieldworkDeadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                  {d.fieldworkStartDateSource === 'inferred_from_earliest_entry' && ' (estimated)'}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Signature Modal */}
      {showSigModal && (
        <div onClick={() => setShowSigModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,32,24,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(15,32,24,0.15)' }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Sign to Export</p>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Trainee Signature</h2>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>Sign below to certify that the hours in this report are accurate to the best of your knowledge.</p>

            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 8, backgroundColor: '#fafafa' }}>
              <SignatureCanvas
                ref={sigRef}
                penColor='#0F2018'
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
                onClick={() => setShowSigModal(false)}
                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDownload}
                style={{ flex: 2, padding: 12, borderRadius: 8, backgroundColor: 'var(--spruce)', color: '#fff', border: 'none', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                ↓ Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
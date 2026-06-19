'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useApi } from '../../context/api-context';
import SignatureCanvas from 'react-signature-canvas';

export default function CompliancePage() {
  const { get } = useApi();
  const { getToken } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [exporting, setExporting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const [showSigModal, setShowSigModal] = useState(false);
  const sigRef = useRef<any>(null);

  const month = selectedMonth;

  useEffect(() => {
    setLoading(true);
    get('/compliance').then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

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

  const card = (label: string, value: string, sub?: string, color?: string) => (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', minWidth: 0 }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 600, color: color || 'var(--ink)', margin: 0, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{sub}</p>}
    </div>
  );

  const badge = (pass: boolean, label: string, val: string) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: isMobile ? '100%' : 'auto' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: pass ? 'var(--spruce)' : 'var(--amber)', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 500, color: 'var(--ink)' }}>{val}</span>
        <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: pass ? 'rgba(26,122,80,0.1)' : 'rgba(255,160,0,0.1)', color: pass ? 'var(--spruce)' : 'var(--amber)' }}>{pass ? 'Met' : 'Action needed'}</span>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
            {card('Total Hours', Number(d.totalHours||0).toFixed(1), `${((d.totalHours/2000)*100).toFixed(1)}% of 2,000`)}
            {card('Supervised', Number(d.supervisedHours||0).toFixed(1)+' hrs', `${Number(d.supervisionPct||0).toFixed(1)}%`, d.supervisionMet ? 'var(--spruce)' : 'var(--amber)')}
            {card('Independent', Number(d.independentHours||0).toFixed(1)+' hrs', `${d.totalHours > 0 ? (100-d.supervisionPct).toFixed(1) : 0}%`)}
            {card('Restricted', Number(d.restrictedPct||0).toFixed(1)+'%', d.restrictedMet ? 'Within limit' : 'Over 50% limit', d.restrictedMet ? 'var(--spruce)' : 'var(--amber)')}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px', marginBottom: 24, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 20 }}>BACB Requirements — {month}</p>
            {badge(d.supervisionMet, 'Supervision ≥ 5% of hours', Number(d.supervisionPct||0).toFixed(1)+' %')}
            {badge(d.restrictedMet, 'Restricted hours ≤ 50% of total', Number(d.restrictedPct||0).toFixed(1)+' %')}
            {badge(d.supervisionContacts >= 2, 'Supervision contacts this month', `${d.supervisionContacts} contact${d.supervisionContacts !== 1 ? 's' : ''}`)}
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
                  <span style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: label === 'Total' ? 600 : 500, color: 'var(--ink)' }}>{Number(val||0).toFixed(1)}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px', minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 20 }}>Hours Pace</p>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{Number(d.totalHours||0).toFixed(0)} / 2,000 hrs</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{((d.totalHours/2000)*100).toFixed(1)}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, var(--spruce), #5BC891)', width: `${Math.min((d.totalHours/2000)*100, 100)}%` }} />
                </div>
              </div>
              {d.projectedCompletionDate === 'complete' ? (
                <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--spruce)' }}>✓ 2,000 hours complete!</p>
              ) : d.projectedCompletionDate ? (
                <>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Projected completion</p>
                  <p style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{d.projectedCompletionDate ? new Date(d.projectedCompletionDate + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}</p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>based on current pace</p>
                </>
              ) : (
                <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>Log more hours to see projection</p>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', margin: 0 }}>Task List Coverage</p>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>{d.taskListCoverageCount} / {d.taskListCoverage?.length || 9} areas</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
              {(d.taskListCoverage || []).map((t: any) => (
                <div key={t.area} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: t.covered ? 'rgba(26,122,80,0.08)' : 'var(--bg)', border: `1px solid ${t.covered ? 'rgba(26,122,80,0.2)' : 'var(--border)'}`, minWidth: 0 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.covered ? 'var(--spruce)' : 'var(--border)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: t.covered ? 'var(--spruce)' : 'var(--muted)' }}>{t.area}</span>
                </div>
              ))}
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

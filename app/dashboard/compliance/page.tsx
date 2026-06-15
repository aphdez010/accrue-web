'use client';
import { useEffect, useState, CSSProperties } from 'react';
import { useApi } from '../../context/api-context';

interface ComplianceData {
  total_hours: number;
  supervised_hours: number;
  supervision_pct: number;
  restricted_hours: number;
  unrestricted_hours: number;
  restricted_pct: number;
  meets_supervision: boolean;
  meets_restricted: boolean;
}

export default function CompliancePage() {
  const { get } = useApi();
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    get('/compliance')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const card: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '28px 32px',
  };

  const label: React.CSSProperties = {
    fontFamily: 'var(--mono)',
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
    marginBottom: 4,
  };

  const statVal = (pass?: boolean): React.CSSProperties => ({
    fontFamily: 'var(--display)',
    fontSize: 32,
    fontWeight: 600,
    color: pass === undefined ? 'var(--ink)' : pass ? 'var(--spruce)' : 'var(--amber)',
    margin: 0,
    lineHeight: 1,
  });

  const pill = (pass: boolean): React.CSSProperties => ({
    display: 'inline-block',
    padding: '3px 12px',
    borderRadius: 20,
    fontFamily: 'var(--mono)',
    fontSize: 11,
    background: pass ? 'rgba(26,122,80,0.1)' : 'rgba(255,160,0,0.1)',
    color: pass ? 'var(--spruce)' : 'var(--amber)',
  });

  return (
    <div style={{ padding: '40px', maxWidth: 880 }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ ...label, marginBottom: 6 }}>Compliance</p>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>Monthly Review</h1>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{currentMonth}</p>
      </div>

      {loading ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading…</p>
      ) : !data ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--amber)' }}>Failed to load compliance data.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={card}>
              <p style={label}>Total Hours</p>
              <p style={statVal()}>{Number(data.total_hours).toFixed(1)}</p>
            </div>
            <div style={card}>
              <p style={label}>Supervised</p>
              <p style={statVal(data.meets_supervision)}>{Number(data.supervision_pct).toFixed(1)}%</p>
            </div>
            <div style={card}>
              <p style={label}>Restricted %</p>
              <p style={statVal(data.meets_restricted)}>{Number(data.restricted_pct).toFixed(1)}%</p>
            </div>
          </div>

          <div style={{ ...card, marginBottom: 24 }}>
            <p style={{ ...label, marginBottom: 20 }}>BACB Requirements</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Supervision >= 5% of hours', pass: data.meets_supervision, value: `${Number(data.supervision_pct).toFixed(1)}%` },
                { label: 'Restricted hours <= 50% of total', pass: data.meets_restricted, value: `${Number(data.restricted_pct).toFixed(1)}%` },
              ].map(req => (
                <div key={req.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: req.pass ? 'var(--spruce)' : 'var(--amber)' }} />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)' }}>{req.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 500, color: 'var(--ink)' }}>{req.value}</span>
                    <span style={pill(req.pass)}>{req.pass ? 'Met' : 'Action needed'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <p style={{ ...label, marginBottom: 20 }}>Hours Breakdown</p>
            {[
              { label: 'Unrestricted', value: data.unrestricted_hours },
              { label: 'Restricted', value: data.restricted_hours },
              { label: 'Supervised', value: data.supervised_hours },
              { label: 'Total', value: data.total_hours },
            ].map((row, i, arr) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>{row.label}</span>
                <span style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>{Number(row.value).toFixed(1)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
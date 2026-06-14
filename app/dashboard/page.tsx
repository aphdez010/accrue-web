'use client';
import { useState, useEffect } from 'react';
import { useApi } from '../context/api-context';

export default function DashboardPage() {
  const api = useApi();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/compliance').then(setData).catch(console.error);
  }, []);

  return (
    <div>
      <div style={{ padding: '28px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>June 2026 · Supervised Fieldwork</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.02em' }}>Your compliance dashboard</div>
        </div>
        <a href="/dashboard/fieldwork" style={{ background: 'var(--spruce)', color: '#fff', font: '600 13px var(--sans)', padding: '11px 20px', borderRadius: 10, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 4 }}>+ Log hours</a>
      </div>

      <div style={{ padding: '24px 32px 0' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          Cumulative fieldwork record
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.06)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 0%, var(--spruce-glow), transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid var(--border)', paddingBottom: 20, marginBottom: 20 }}>
            {[
              { val: data ? data.supervisionPct.toFixed(1)+'%' : '—', label: 'Supervision this month', color: data?.supervisionMet ? 'var(--spruce)' : 'var(--amber)' },
              { val: data?.totalHours ?? '—', label: 'Hours logged', color: 'var(--ink)' },
              { val: data ? data.restrictedPct.toFixed(1)+'%' : '—', label: 'Restricted %', color: data?.restrictedMet ? 'var(--ink)' : 'var(--red)' },
              { val: data?.unrestricted ?? '—', label: 'Unrestricted hours', color: 'var(--ink)' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '0 20px', borderRight: i < 3 ? '1px solid var(--border)' : 'none', ...(i===0 ? {paddingLeft:0} : {}) }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 700, lineHeight: 1, letterSpacing: '-.03em', marginBottom: 4, color: s.color }}>{s.val}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>
          {[
            { label: 'Supervision >= 5% of hours', met: data?.supervisionMet, val: data ? data.supervisionPct.toFixed(1)+'%' : '—' },
            { label: 'Restricted hours <= 50% of total', met: data?.restrictedMet, val: data ? data.restrictedPct.toFixed(1)+'%' : '—' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i===0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.met===undefined ? 'var(--border2)' : r.met ? 'var(--spruce)' : 'var(--amber)', flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{r.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: r.met ? 'var(--spruce)' : 'var(--amber)' }}>{r.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '20px 32px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Requirements
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '.06em', background: data?.supervisionMet && data?.restrictedMet ? 'var(--spruce-dim)' : 'var(--amber-dim)', color: data?.supervisionMet && data?.restrictedMet ? 'var(--spruce)' : 'var(--amber)' }}>
              {data?.supervisionMet && data?.restrictedMet ? 'Compliant' : 'Action needed'}
            </span>
          </div>
          {[
            { label: 'Supervision >= 5%', met: data?.supervisionMet, val: data ? data.supervisionPct.toFixed(1)+'%' : '—' },
            { label: 'Restricted <= 50%', met: data?.restrictedMet, val: data ? data.restrictedPct.toFixed(1)+'%' : '—' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i===0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.met===undefined ? 'var(--border2)' : r.met ? 'var(--spruce)' : 'var(--amber)', flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{r.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: r.met ? 'var(--spruce)' : 'var(--amber)' }}>{r.val}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Hours breakdown</div>
          {[
            { label: 'Unrestricted', val: data?.unrestricted ?? '—', color: 'var(--spruce)' },
            { label: 'Restricted', val: data?.restricted ?? '—', color: 'var(--muted)' },
            { label: 'Supervised', val: data?.supervisedHours ?? '—', color: 'var(--amber)' },
            { label: 'Total', val: data?.totalHours ?? '—', color: 'var(--ink)', bold: true },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: i<3 ? '1px solid var(--border)' : 'none', fontSize: 13 }}>
              <div style={{ flex: 1, fontWeight: row.bold ? 600 : 500 }}>{row.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: row.color, fontWeight: row.bold ? 600 : 400 }}>{row.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';

const CATS = ['All','Supervision Log','Certificate','Credential','Form','Other'];

export default function VaultPage() {
  const [cat, setCat] = useState('All');

  return (
    <div style={{ padding: 40, maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 6 }}>Vault</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>Document Storage</h1>
        </div>
        <button style={{ background: 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer' }}>+ Upload</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' as const }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ background: cat===c ? 'var(--spruce)' : 'var(--surface)', color: cat===c ? '#fff' : 'var(--muted)', border: '1px solid ' + (cat===c ? 'var(--spruce)' : 'var(--border)'), borderRadius: 20, padding: '5px 14px', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer' }}>{c}</button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px' }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 20 }}>Files</p>
        <div style={{ padding: '48px 0', textAlign: 'center' as const }}>
          <p style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--muted)', marginBottom: 8 }}>No documents yet</p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>Upload supervision logs, certificates, and credentials to keep them organized.</p>
        </div>
      </div>
    </div>
  );
}

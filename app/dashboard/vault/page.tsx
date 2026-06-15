'use client';
import { useState } from 'react';

export default function VaultPage() {
  const [docs] = useState([]);
  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px' };
  const lbl = { fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' };

  return (
    <div style={{ padding: 40, maxWidth: 880 }}>
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <p style={{ ...lbl, marginBottom: 6 }}>Vault</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>Document Storage</h1>
        </div>
        <button style={{ background: 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer' }}>+ Upload</button>
      </div>
      <div style={card}>
        <p style={{ ...lbl, marginBottom: 20 }}>Files</p>
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--muted)', marginBottom: 8 }}>No documents yet</p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>Upload supervision logs, certificates, and credentials.</p>
        </div>
      </div>
    </div>
  );
}

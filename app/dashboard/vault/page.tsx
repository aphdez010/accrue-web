'use client';

import { useState } from 'react';

interface VaultDoc {
  id: string;
  name: string;
  type: 'supervision_log' | 'certificate' | 'credential' | 'form' | 'other';
  date: string;
  size?: string;
}

const TYPE_LABELS: Record<VaultDoc['type'], string> = {
  supervision_log: 'Supervision Log',
  certificate: 'Certificate',
  credential: 'Credential',
  form: 'Form',
  other: 'Other',
};

export default function VaultPage() {
  const [docs] = useState<VaultDoc[]>([]);

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
    textTransform: 'uppercase' as const,
    color: 'var(--muted)',
  };

  return (
    <div style={{ padding: '40px', maxWidth: 880 }}>

      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <p style={{ ...label, marginBottom: 6 }}>Vault</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
            Document Storage
          </h1>
        </div>
        <button
          style={{
            background: 'var(--spruce)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 22px',
            fontFamily: 'var(--mono)',
            fontSize: 12,
            letterSpacing: '0.06em',
            cursor: 'pointer',
          }}
        >
          + Upload
        </button>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' as const }}>
        {(['All', 'Supervision Log', 'Certificate', 'Credential', 'Form', 'Other']).map(cat => (
          <button
            key={cat}
            style={{
              background: cat === 'All' ? 'var(--spruce)' : 'var(--surface)',
              color: cat === 'All' ? '#fff' : 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '5px 14px',
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.05em',
              cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Doc list */}
      <div style={card}>
        <p style={{ ...label, marginBottom: 20 }}>Files</p>

        {docs.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' as const }}>
            <p style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--muted)', marginBottom: 8 }}>
              No documents yet
            </p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
              Upload supervision logs, certificates, and credentials to keep them organized.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Name', 'Type', 'Date', ''].map(h => (
                  <th key={h} style={{
                    textAlign: 'left' as const,
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase' as const,
                    color: 'var(--muted)',
                    paddingBottom: 12,
                    borderBottom: '1px solid var(--border)',
                    fontWeight: 500,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, i) => (
                <tr key={doc.id} style={{ borderBottom: i < docs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '14px 0', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)' }}>
                    {doc.name}
                  </td>
                  <td style={{ padding: '14px 16px 14px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                    {TYPE_LABELS[doc.type]}
                  </td>
                  <td style={{ padding: '14px 16px 14px 0', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
                    {doc.date}
                  </td>
                  <td style={{ padding: '14px 0', textAlign: 'right' as const }}>
                    <button style={{
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '4px 12px',
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      color: 'var(--muted)',
                      cursor: 'pointer',
                    }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
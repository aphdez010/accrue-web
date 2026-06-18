'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useApi } from '../../context/api-context';

const CATS = ['All', 'Supervision Log', 'Certificate', 'Credential', 'Form', 'Other'];

type Doc = {
  id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: string;
  uploaded_at: string;
};

export default function VaultPage() {
  const { getToken } = useAuth();
  const { get } = useApi();
  const [cat, setCat] = useState('All');
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState('General');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    get('/vault').then((r: any) => setDocs(Array.isArray(r) ? r : [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = cat === 'All' ? docs : docs.filter(d => d.category === cat);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const base = apiUrl.replace(/\/api$/, '');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', selectedCat);
      const res = await fetch(`${base}/vault/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      setShowModal(false);
      setSelectedFile(null);
      load();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this document?')) return;
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const base = apiUrl.replace(/\/api$/, '');
      await fetch(`${base}/vault/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      load();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const fileIcon = (type: string) => {
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('image')) return '🖼️';
    if (type?.includes('word') || type?.includes('document')) return '📝';
    return '📎';
  };

  return (
    <div style={{ padding: 40, maxWidth: 860 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Vault</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>Document Storage</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer' }}
        >
          + Upload
        </button>
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ background: cat === c ? 'var(--spruce)' : 'var(--surface)', color: cat === c ? '#fff' : 'var(--muted)', border: '1px solid ' + (cat === c ? 'var(--spruce)' : 'var(--border)'), borderRadius: 20, padding: '5px 14px', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer' }}>{c}</button>
        ))}
      </div>

      {/* Documents list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px' }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 20 }}>
          Files {cat !== 'All' ? `— ${cat}` : ''} ({filtered.length})
        </p>

        {loading ? (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--muted)', marginBottom: 8 }}>No documents yet</p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>Upload supervision logs, certificates, and credentials.</p>
            <button
              onClick={() => setShowModal(true)}
              style={{ marginTop: 16, background: 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer' }}
            >
              Upload your first document
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map((doc, i) => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{fileIcon(doc.file_type)}</span>
                  <div>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', margin: 0 }}>{doc.file_name}</p>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', margin: 0 }}>
                      {doc.category} · {formatSize(doc.file_size)} · {new Date(doc.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink)', textDecoration: 'none', background: 'var(--surface)' }}>View</a>
                  <button onClick={() => handleDelete(doc.id)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)', background: 'transparent', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div onClick={() => { setShowModal(false); setSelectedFile(null); }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,32,24,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(15,32,24,0.15)' }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Upload</p>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 24 }}>Add Document</h2>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setSelectedFile(f); }}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? 'var(--spruce)' : 'var(--border)'}`, borderRadius: 10, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', marginBottom: 20, background: dragOver ? 'rgba(26,122,80,0.04)' : 'var(--surface)' }}
            >
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); }} />
              {selectedFile ? (
                <>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--spruce)', margin: 0 }}>✓ {selectedFile.name}</p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>{formatSize(selectedFile.size)}</p>
                </>
              ) : (
                <>
                  <p style={{ fontFamily: 'var(--display)', fontSize: 15, color: 'var(--muted)', margin: 0 }}>Drop file here or click to browse</p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: '6px 0 0' }}>PDF, DOC, DOCX, PNG, JPG — max 10MB</p>
                </>
              )}
            </div>

            {/* Category */}
            <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Category</label>
            <select
              value={selectedCat}
              onChange={e => setSelectedCat(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', background: 'var(--surface)', outline: 'none', marginBottom: 24 }}
            >
              {['Supervision Log', 'Certificate', 'Credential', 'Form', 'Other'].map(c => <option key={c}>{c}</option>)}
            </select>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowModal(false); setSelectedFile(null); }} style={{ flex: 1, padding: 12, borderRadius: 8, background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                style={{ flex: 2, padding: 12, borderRadius: 8, background: uploading || !selectedFile ? 'rgba(26,122,80,0.4)' : 'var(--spruce)', color: '#fff', border: 'none', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, cursor: uploading || !selectedFile ? 'not-allowed' : 'pointer' }}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

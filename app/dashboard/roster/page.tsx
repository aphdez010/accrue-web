'use client';
import { useEffect, useState } from 'react';
import { useApi } from '../../context/api-context';

type RBT = {
  id: number; name: string; email: string; credential: string;
  totalHours: number; supervisionPct: number; supervisionMet: boolean; restrictedMet: boolean;
};

export default function RosterPage() {
  const { get } = useApi();
  const [roster, setRoster] = useState<RBT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/roster').then(r => setRoster(Array.isArray(r) ? r : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>BCBA</p>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>Supervisee Roster</h1>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 32 }}>{roster.length} active trainee{roster.length !== 1 ? 's' : ''}</p>

      {loading ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading...</p>
      ) : roster.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '40px 32px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>No RBTs on your roster yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {roster.map(rbt => (
            <div key={rbt.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 500, color: 'var(--ink)', margin: '0 0 2px' }}>{rbt.name}</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: 0 }}>{rbt.email}{rbt.credential ? ` · ${rbt.credential}` : ''}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{Number(rbt.totalHours||0).toFixed(0)}<span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 2 }}>hrs</span></p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', margin: 0 }}>Total logged</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{Number(rbt.supervisionPct||0).toFixed(1)}<span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 2 }}>%</span></p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', margin: 0 }}>Supervision</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: rbt.supervisionMet ? 'rgba(26,122,80,0.1)' : 'rgba(255,160,0,0.1)', color: rbt.supervisionMet ? 'var(--spruce)' : 'var(--amber)' }}>{rbt.supervisionMet ? 'Supv ✓' : 'Supv !'}</span>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: rbt.restrictedMet ? 'rgba(26,122,80,0.1)' : 'rgba(255,160,0,0.1)', color: rbt.restrictedMet ? 'var(--spruce)' : 'var(--amber)' }}>{rbt.restrictedMet ? 'Restr ✓' : 'Restr !'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

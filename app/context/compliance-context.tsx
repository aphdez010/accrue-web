'use client';
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useApi } from './api-context';

// The /compliance response shape is defined entirely by the backend
// (services/compliance.js) and already varies by track/rule-set version,
// so it's kept loose here rather than re-declared and allowed to drift.
type ComplianceData = any;

interface ComplianceContextValue {
  data: ComplianceData | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const ComplianceContext = createContext<ComplianceContextValue | null>(null);

// Bug context: dashboard/layout.tsx (sidebar), dashboard/page.tsx (main
// content), and dashboard/compliance/page.tsx each used to fetch /compliance
// independently into their own local state. Switching fieldwork track (or
// any other mutation that changes compliance numbers) only refreshed
// whichever component triggered it -- the others silently went stale until
// a full page reload. This provider gives every consumer the same data and
// the same refetch(), so a change anywhere is reflected everywhere.
export function ComplianceProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const d = await api.get('/compliance');
      setData(d);
    } catch {
      // Keep whatever data is already on screen rather than blanking the
      // dashboard on a transient network error.
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ComplianceContext.Provider value={{ data, loading, refetch }}>
      {children}
    </ComplianceContext.Provider>
  );
}

export function useCompliance() {
  const ctx = useContext(ComplianceContext);
  if (!ctx) throw new Error('useCompliance must be used within ComplianceProvider');
  return ctx;
}

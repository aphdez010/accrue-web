'use client';

import { createContext, useContext } from 'react';
import { useAuth } from '@clerk/nextjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

async function request(method: string, path: string, token: string | null, body?: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function useApiClient() {
  const { getToken } = useAuth();
  return {
    get: async (path: string) => request('GET', path, await getToken()),
    post: async (path: string, body: unknown) => request('POST', path, await getToken(), body),
    patch: async (path: string, body: unknown) => request('PATCH', path, await getToken(), body),
    del: async (path: string) => request('DELETE', path, await getToken()),
  };
}

const ApiContext = createContext<ReturnType<typeof useApiClient> | null>(null);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const api = useApiClient();
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useApi() {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error('useApi must be used within ApiProvider');
  return ctx;
}

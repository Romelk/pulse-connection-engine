'use client';

import { useState, useEffect } from 'react';

export interface StoredUser {
  id: number;
  email: string;
  name: string;
  role: 'super_admin' | 'local_admin';
  company_id: number | null;
  company_name: string | null;
}

const KEY = 'pulseai_user';

export function getUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

export function setUser(user: StoredUser): void {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(KEY);
}

export function useCurrentUser() {
  // Both server and client start with null/false so the initial render matches,
  // avoiding SSR hydration mismatches. localStorage is read after mount only.
  const [user, setUser] = useState<StoredUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setReady(true);
  }, []);

  return {
    user,
    ready,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'super_admin',
    isLocalAdmin: user?.role === 'local_admin',
    logout: () => {
      clearUser();
      window.location.href = '/login';
    },
  };
}

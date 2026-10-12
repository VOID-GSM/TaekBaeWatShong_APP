import { create } from 'zustand';

import type { AdminUser } from '@/entities/user';

export type AdminAuthStatus = 'initializing' | 'loading' | 'authenticated' | 'unauthenticated';

interface AdminAuthState {
  status: AdminAuthStatus;
  user: AdminUser | null;
  error: string | null;
  setUser: (user: AdminUser) => void;
  setStatus: (status: AdminAuthStatus) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  status: 'initializing',
  user: null,
  error: null,
  setUser: (user) => set({ status: 'authenticated', user, error: null }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  clear: () => set({ status: 'unauthenticated', user: null, error: null }),
}));

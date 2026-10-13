import { create } from 'zustand';

import type { AppUser } from '@/entities/user';

export type AuthStatus = 'initializing' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: AppUser | null;
  error: string | null;
  setUser: (user: AppUser) => void;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'initializing',
  user: null,
  error: null,
  setUser: (user) => set({ status: 'authenticated', user, error: null }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  clear: () => set({ status: 'unauthenticated', user: null, error: null }),
}));

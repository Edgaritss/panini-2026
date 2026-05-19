import { create } from 'zustand';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { auth } from '../lib/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'disabled';

interface AuthState {
  user: User | null;
  session: Session | null;
  status: AuthStatus;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthError | null>;
  signUp: (email: string, password: string) => Promise<AuthError | null>;
  signOut: () => Promise<void>;
  _setSession: (session: Session | null) => void;
}

let initialized = false;

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  status: auth.configured ? 'loading' : 'disabled',

  initialize: async () => {
    if (initialized) return;
    initialized = true;
    if (!auth.configured) {
      set({ status: 'disabled' });
      return;
    }
    const session = await auth.getSession();
    get()._setSession(session);
    auth.onAuthStateChange((_event, newSession) => {
      get()._setSession(newSession);
    });
  },

  signIn: async (email, password) => {
    const { error } = await auth.signIn(email, password);
    return error;
  },

  signUp: async (email, password) => {
    const { error } = await auth.signUp(email, password);
    return error;
  },

  signOut: async () => {
    await auth.signOut();
  },

  _setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      status: session?.user ? 'authenticated' : 'unauthenticated',
    }),
}));

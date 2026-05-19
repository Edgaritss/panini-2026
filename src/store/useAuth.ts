import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { auth } from '../lib/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'disabled';
export type AuthMode = 'loading' | 'authed' | 'guest' | 'public';

interface AuthState {
  user: User | null;
  session: Session | null;
  status: AuthStatus;
  guestMode: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthError | null>;
  signUp: (email: string, password: string) => Promise<AuthError | null>;
  signOut: () => Promise<void>;
  enterGuest: () => void;
  exitGuest: () => void;
  _setSession: (session: Session | null) => void;
}

let initialized = false;

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      status: auth.configured ? 'loading' : 'disabled',
      guestMode: false,

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

      enterGuest: () => set({ guestMode: true }),
      exitGuest: () => set({ guestMode: false }),

      _setSession: (session) =>
        set((state) => {
          const hasUser = !!session?.user;
          return {
            session,
            user: session?.user ?? null,
            status: hasUser ? 'authenticated' : 'unauthenticated',
            // When the user logs in, guest mode is implicitly over.
            guestMode: hasUser ? false : state.guestMode,
          };
        }),
    }),
    {
      name: 'panini-2026-auth',
      version: 1,
      partialize: (state) => ({ guestMode: state.guestMode }),
    },
  ),
);

export function authMode(state: Pick<AuthState, 'status' | 'guestMode' | 'user'>): AuthMode {
  if (state.status === 'loading') return 'loading';
  if (state.user) return 'authed';
  if (state.guestMode) return 'guest';
  return 'public';
}

export function useAuthMode(): AuthMode {
  return useAuth(authMode);
}

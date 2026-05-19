import type { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from './supabase';

export interface AuthResult {
  error: AuthError | null;
}

function assertReady() {
  if (!supabase) {
    throw new Error('Supabase no configurado. Revisa las variables de entorno.');
  }
  return supabase;
}

export const auth = {
  configured: supabaseConfigured,

  async signUp(email: string, password: string): Promise<AuthResult> {
    const { error } = await assertReady().auth.signUp({ email, password });
    return { error };
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { error } = await assertReady().auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  },

  async signOut(): Promise<AuthResult> {
    const { error } = await assertReady().auth.signOut();
    return { error };
  },

  async getSession(): Promise<Session | null> {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  onAuthStateChange(
    callback: (event: string, session: Session | null) => void,
  ) {
    if (!supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } } as const;
    }
    return supabase.auth.onAuthStateChange(callback);
  },

  user(): User | null {
    return null;
  },
};

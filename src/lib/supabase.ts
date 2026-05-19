import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const COLLECTION_ID = import.meta.env.VITE_COLLECTION_ID as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey && COLLECTION_ID);

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

export interface CollectionRow {
  id: string;
  owned: Record<string, number>;
  first_added_at: string | null;
  updated_at: string;
}

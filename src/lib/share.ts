import { supabase } from './supabase';

export type ShareMode = 'readonly' | 'collaborative';

export interface ShareRow {
  id: string;
  user_id: string;
  mode: ShareMode;
  expires_at: string | null;
  revoked: boolean;
  display_label: string | null;
  allow_remove: boolean;
  created_at: string;
  last_accessed_at: string | null;
}

export interface PublicSharePayload {
  share: Pick<ShareRow, 'id' | 'mode' | 'display_label' | 'allow_remove' | 'expires_at'>;
  owned: Record<string, number>;
}

function assertReady() {
  if (!supabase) throw new Error('Supabase no configurado.');
  return supabase;
}

/** Mask an email like "edgar@vortem.consulting" → "e****@vortem.consulting". */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return 'Sin nombre';
  const at = email.indexOf('@');
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const head = local[0] ?? '';
  return `${head}${'*'.repeat(Math.max(1, Math.min(local.length - 1, 4)))}${domain}`;
}

export async function createReadOnlyShare(currentEmail: string | null): Promise<ShareRow> {
  const sb = assertReady();
  const display = maskEmail(currentEmail);
  const { data: userResp } = await sb.auth.getUser();
  const uid = userResp.user?.id;
  if (!uid) throw new Error('Sesión no encontrada.');

  const { data, error } = await sb
    .from('shared_albums')
    .insert({
      user_id: uid,
      mode: 'readonly',
      display_label: display,
    })
    .select('*')
    .single<ShareRow>();
  if (error) throw error;
  return data;
}

export async function listMyShares(): Promise<ShareRow[]> {
  const sb = assertReady();
  const { data, error } = await sb
    .from('shared_albums')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<ShareRow[]>();
  if (error) throw error;
  return data ?? [];
}

export async function revokeShare(id: string): Promise<void> {
  const sb = assertReady();
  const { error } = await sb
    .from('shared_albums')
    .update({ revoked: true })
    .eq('id', id);
  if (error) throw error;
}

/** Touch last_accessed_at; non-fatal if RLS rejects. */
async function touchAccessed(id: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('shared_albums')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', id);
}

export async function fetchPublicShare(id: string): Promise<PublicSharePayload | null> {
  const sb = assertReady();
  const { data: share, error: shareErr } = await sb
    .from('shared_albums')
    .select('id, user_id, mode, display_label, allow_remove, expires_at, revoked')
    .eq('id', id)
    .maybeSingle<
      Pick<ShareRow, 'id' | 'user_id' | 'mode' | 'display_label' | 'allow_remove' | 'expires_at' | 'revoked'>
    >();
  if (shareErr) throw shareErr;
  if (!share) return null;
  if (share.revoked) return null;
  if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) {
    return null;
  }

  const { data: collection, error: colErr } = await sb
    .from('user_collections')
    .select('owned')
    .eq('user_id', share.user_id)
    .maybeSingle<{ owned: Record<string, number> }>();
  if (colErr) throw colErr;

  void touchAccessed(id);

  return {
    share: {
      id: share.id,
      mode: share.mode,
      display_label: share.display_label,
      allow_remove: share.allow_remove,
      expires_at: share.expires_at,
    },
    owned: collection?.owned ?? {},
  };
}

export function buildShareUrl(id: string): string {
  if (typeof window === 'undefined') return `/compartido/${id}`;
  return `${window.location.origin}/compartido/${id}`;
}

/** Generate a PNG data URL via the `qrcode` package, loaded on demand. */
export async function buildQrDataUrl(url: string): Promise<string> {
  const QRCode = (await import('qrcode')).default;
  return QRCode.toDataURL(url, {
    width: 320,
    margin: 2,
    color: { dark: '#0c0a09', light: '#fafaf9' },
  });
}

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
  firstAddedAt: string | null;
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
  const { data: userResp } = await sb.auth.getUser();
  const uid = userResp.user?.id;
  if (!uid) throw new Error('Sesión no encontrada.');
  const { data, error } = await sb
    .from('shared_albums')
    .select('*')
    .eq('user_id', uid)
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
    .select('owned, first_added_at')
    .eq('user_id', share.user_id)
    .maybeSingle<{ owned: Record<string, number>; first_added_at: string | null }>();
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
    firstAddedAt: collection?.first_added_at ?? null,
  };
}

export function buildShareUrl(id: string): string {
  if (typeof window === 'undefined') return `/compartido/${id}`;
  return `${window.location.origin}/compartido/${id}`;
}

export function buildCollabUrl(id: string): string {
  if (typeof window === 'undefined') return `/colaborar/${id}`;
  return `${window.location.origin}/colaborar/${id}`;
}

/* ---------- Collaborative shares ---------- */

export type CollabDuration = '1h' | '4h' | '24h' | '7d';

const DURATION_HOURS: Record<CollabDuration, number> = {
  '1h': 1,
  '4h': 4,
  '24h': 24,
  '7d': 7 * 24,
};

export interface CreateCollabInput {
  currentEmail: string | null;
  duration: CollabDuration;
  allowRemove: boolean;
}

export interface CreateCollabOutput {
  share: ShareRow;
  pin: string;
}

/**
 * Generates a collaborative share via SQL function: the PIN is created and
 * hashed server-side (pgcrypto) so we don't need crypto.subtle (only available
 * in secure contexts). The plain PIN is returned ONCE in the response.
 */
export async function createCollabShare(
  input: CreateCollabInput,
): Promise<CreateCollabOutput> {
  const sb = assertReady();
  const { data, error } = await sb.rpc('create_collab_share', {
    p_duration_hours: DURATION_HOURS[input.duration],
    p_allow_remove: input.allowRemove,
    p_display_label: maskEmail(input.currentEmail),
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.share_id || !row?.pin) throw new Error('Respuesta inesperada.');
  const { data: share, error: fetchErr } = await sb
    .from('shared_albums')
    .select('*')
    .eq('id', row.share_id)
    .single<ShareRow>();
  if (fetchErr) throw fetchErr;
  return { share, pin: row.pin };
}

export async function validateCollabPin(
  shareId: string,
  pin: string,
): Promise<boolean> {
  const sb = assertReady();
  const { data, error } = await sb.rpc('collab_validate_pin', {
    p_share_id: shareId,
    p_pin: pin,
  });
  if (error) throw error;
  return data === true;
}

export interface CollabApplyResult {
  before: number;
  after: number;
}

export async function applyCollabChange(
  shareId: string,
  pin: string,
  stickerId: string,
  delta: 1 | -1,
): Promise<CollabApplyResult> {
  const sb = assertReady();
  const { data, error } = await sb.rpc('collab_apply', {
    p_share_id: shareId,
    p_pin: pin,
    p_sticker_id: stickerId,
    p_delta: delta,
  });
  if (error) throw error;
  return data as CollabApplyResult;
}

export interface ShareLogEntry {
  id: number;
  share_id: string;
  sticker_id: string;
  action: 'add' | 'remove';
  count_before: number;
  count_after: number;
  created_at: string;
}

export async function listShareActivity(shareId: string): Promise<ShareLogEntry[]> {
  const sb = assertReady();
  const { data, error } = await sb
    .from('shared_album_log')
    .select('*')
    .eq('share_id', shareId)
    .order('created_at', { ascending: false })
    .limit(200)
    .returns<ShareLogEntry[]>();
  if (error) throw error;
  return data ?? [];
}

/* ---------- Client-side PIN rate limit (sessionStorage) ---------- */

const PIN_KEY = 'panini-2026:pin-attempts';
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60_000;

interface AttemptsState {
  shareId: string;
  attempts: number;
  firstAt: number;
}

function readAttempts(shareId: string): AttemptsState {
  if (typeof window === 'undefined') {
    return { shareId, attempts: 0, firstAt: Date.now() };
  }
  try {
    const raw = sessionStorage.getItem(PIN_KEY);
    if (!raw) return { shareId, attempts: 0, firstAt: Date.now() };
    const parsed = JSON.parse(raw) as AttemptsState;
    if (parsed.shareId !== shareId) {
      return { shareId, attempts: 0, firstAt: Date.now() };
    }
    if (Date.now() - parsed.firstAt > WINDOW_MS) {
      return { shareId, attempts: 0, firstAt: Date.now() };
    }
    return parsed;
  } catch {
    return { shareId, attempts: 0, firstAt: Date.now() };
  }
}

function writeAttempts(state: AttemptsState): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PIN_KEY, JSON.stringify(state));
}

export interface RateState {
  blocked: boolean;
  attemptsLeft: number;
  unlockAt: number | null;
}

export function getPinRateState(shareId: string): RateState {
  const s = readAttempts(shareId);
  const blocked = s.attempts >= MAX_ATTEMPTS;
  const unlockAt = blocked ? s.firstAt + WINDOW_MS : null;
  return {
    blocked,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - s.attempts),
    unlockAt,
  };
}

export function recordPinFailure(shareId: string): RateState {
  const s = readAttempts(shareId);
  const next: AttemptsState = {
    shareId,
    attempts: s.attempts + 1,
    firstAt: s.attempts === 0 ? Date.now() : s.firstAt,
  };
  writeAttempts(next);
  return getPinRateState(shareId);
}

export function clearPinAttempts(shareId: string): void {
  if (typeof window === 'undefined') return;
  const cur = readAttempts(shareId);
  if (cur.shareId === shareId) sessionStorage.removeItem(PIN_KEY);
}

/* ---------- Session token for /colaborar gate ---------- */

const COLLAB_TOKEN_KEY = 'panini-2026:collab-token';

interface CollabToken {
  shareId: string;
  pin: string;
  at: number;
}

export function rememberCollabPin(shareId: string, pin: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(
    COLLAB_TOKEN_KEY,
    JSON.stringify({ shareId, pin, at: Date.now() } satisfies CollabToken),
  );
}

export function readCollabPin(shareId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(COLLAB_TOKEN_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as CollabToken;
    return t.shareId === shareId ? t.pin : null;
  } catch {
    return null;
  }
}

export function forgetCollabPin(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(COLLAB_TOKEN_KEY);
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

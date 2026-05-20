import { stickersBySection, validCodes } from '../data/album';

export type ListKind = 'missing' | 'duplicates' | 'unknown';
export type ParseSource = 'app' | 'permissive';

export interface ParsedList {
  kind: ListKind;
  source: ParseSource;
  /** sticker id → quantity (≥ 1). For "missing", the quantity is always 1. */
  stickers: Map<string, number>;
  metadata: {
    generatedAt?: string;
    declaredTotal?: number | null;
    filters?: string;
  };
}

const MARKER_MISSING = /^#LISTA:FALTANTES\b/m;
const MARKER_DUPLICATES = /^#LISTA:REPETIDAS\b/m;

// [CODE] optional section name on the same line
const SECTION_HEADER = /^\[([A-Z]{2,4})\][^\n]*$/gm;

// Sticker token: CODE + number, optionally followed by ×N or xN. Allow lowercase
// "x" and the Unicode multiplication sign (×, U+00D7) since users may retype.
const STICKER_TOKEN = /\b([A-Z]{2,4})\s*(\d{1,3})\s*(?:[×x]\s*(\d{1,3}))?\b/gi;

const SIN_INICIAR = /\(\s*sin\s+iniciar\s*\)/i;

export function parseTradesList(text: string): ParsedList {
  const trimmed = text ?? '';
  if (trimmed.trim().length === 0) {
    return emptyResult('unknown', 'app');
  }

  const strict = parseStrict(trimmed);
  if (strict) return strict;
  return parsePermissive(trimmed);
}

function parseStrict(text: string): ParsedList | null {
  const hasMissing = MARKER_MISSING.test(text);
  const hasDuplicates = MARKER_DUPLICATES.test(text);
  if (!hasMissing && !hasDuplicates) return null;

  const kind: ListKind = hasMissing ? 'missing' : 'duplicates';
  const stickers = new Map<string, number>();

  // Walk section blocks. Anything between the marker and the footer is parsed
  // by section; we don't require a perfectly clean structure — we just look at
  // each [CODE] header and the lines that follow until the next header or a
  // blank-line separator triggered by the closing footer.
  const headers: { code: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  SECTION_HEADER.lastIndex = 0;
  while ((m = SECTION_HEADER.exec(text)) !== null) {
    const code = m[1].toUpperCase();
    if (validCodes.has(code)) {
      headers.push({ code, index: m.index + m[0].length });
    }
  }
  if (headers.length === 0) {
    // The marker is there but no section blocks parsed — fall through to permissive.
    return null;
  }

  for (let i = 0; i < headers.length; i += 1) {
    const start = headers[i].index;
    const end = i + 1 < headers.length ? headers[i + 1].index - headers[i + 1].code.length - 2 : text.length;
    const slice = text.slice(start, end);

    if (SIN_INICIAR.test(slice)) {
      // Expand to every sticker of that section.
      const all = stickersBySection.get(headers[i].code) ?? [];
      for (const st of all) stickers.set(st.id, 1);
      continue;
    }

    collectStickerTokens(slice, stickers, kind);
  }

  return {
    kind,
    source: 'app',
    stickers,
    metadata: extractMetadata(text),
  };
}

function parsePermissive(text: string): ParsedList {
  const stickers = new Map<string, number>();
  collectStickerTokens(text, stickers, 'unknown');
  return {
    kind: 'unknown',
    source: 'permissive',
    stickers,
    metadata: extractMetadata(text),
  };
}

function collectStickerTokens(
  slice: string,
  out: Map<string, number>,
  kind: ListKind,
): void {
  STICKER_TOKEN.lastIndex = 0;
  let s: RegExpExecArray | null;
  while ((s = STICKER_TOKEN.exec(slice)) !== null) {
    const code = s[1].toUpperCase();
    if (!validCodes.has(code)) continue;
    const number = Number.parseInt(s[2], 10);
    if (!Number.isFinite(number) || number < 1) continue;
    const id = `${code}${number}`;
    // Only accept ids that actually exist in the album (filters out e.g. MEX99).
    const sectionStickers = stickersBySection.get(code);
    if (!sectionStickers || !sectionStickers.some((st) => st.id === id)) continue;
    const qtyRaw = s[3];
    const qty = qtyRaw ? Math.max(1, Number.parseInt(qtyRaw, 10)) : 1;
    if (kind === 'missing') {
      // In a missing list, ×N notation never appears; force qty=1.
      out.set(id, 1);
    } else {
      // For 'duplicates' and 'unknown', take the maximum of accumulated qty.
      out.set(id, Math.max(out.get(id) ?? 0, qty));
    }
  }
}

function extractMetadata(text: string): ParsedList['metadata'] {
  const meta: ParsedList['metadata'] = {};
  const date = text.match(/Generada:\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (date) meta.generatedAt = date[1];
  const total = text.match(/Total:\s*(\d+)/);
  if (total) meta.declaredTotal = Number.parseInt(total[1], 10);
  const filters = text.match(/Filtros:\s*([^\n]+)/);
  if (filters) meta.filters = filters[1].trim();
  return meta;
}

function emptyResult(kind: ListKind, source: ParseSource): ParsedList {
  return { kind, source, stickers: new Map(), metadata: {} };
}

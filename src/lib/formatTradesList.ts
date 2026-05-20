import { stickersBySection } from '../data/album';

// Width of the boxed header (interior, excluding the ║ on each side).
const BOX_WIDTH = 52;
const APP_NAME = "MUNDIAL '26";
const APP_BRAND = "Mundial '26";
const APP_HOST =
  typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://panini-2026-two.vercel.app';

export type ListKind = 'missing' | 'duplicates';

export interface FormatBucketItem {
  id: string;
  /** For missing: 1. For duplicates: number of EXTRAS (count - 1). */
  count: number;
}

export interface FormatBucket {
  code: string;
  name: string;
  items: FormatBucketItem[];
}

export interface FormatOptions {
  kind: ListKind;
  buckets: FormatBucket[];
  /** Pre-aggregated total: missing → number of items; duplicates → sum of counts. */
  total: number;
  /** Optional: when filters are active in /cambios, label them in the header. */
  filterSuffix?: string;
  /** Optional date override (used for testing). */
  now?: Date;
}

/**
 * Produces the standardized text that "Copiar lista" emits. Includes the
 * #LISTA:FALTANTES / #LISTA:REPETIDAS marker so the comparator can detect
 * the kind automatically.
 */
export function formatTradesList(opts: FormatOptions): string {
  const { kind, buckets, total, filterSuffix, now = new Date() } = opts;

  const date = formatDate(now);
  const title = kind === 'missing' ? 'Lista de faltantes' : 'Lista de repetidas';
  const totalLine =
    kind === 'missing'
      ? `Total: ${total} ${total === 1 ? 'estampa faltante' : 'estampas faltantes'}`
      : `Total: ${total} ${total === 1 ? 'estampa para intercambiar' : 'estampas para intercambiar'}`;

  const headerLines = [
    `${APP_NAME} - ${title}`,
    `Generada: ${date}`,
    totalLine,
  ];
  if (filterSuffix) headerLines.push(`Filtros: ${filterSuffix}`);

  const out: string[] = [];
  out.push(boxTop(BOX_WIDTH));
  for (const line of headerLines) out.push(boxLine(line, BOX_WIDTH));
  out.push(boxBottom(BOX_WIDTH));
  out.push('');
  out.push(kind === 'missing' ? '#LISTA:FALTANTES' : '#LISTA:REPETIDAS');
  out.push('');

  if (buckets.length === 0) {
    out.push(
      kind === 'missing'
        ? '(sin faltantes — colección completa 🎉)'
        : '(sin repetidas)',
    );
    out.push('');
  } else {
    for (const b of buckets) {
      out.push(`[${b.code}] ${b.name}`);
      const sectionSize = stickersBySection.get(b.code)?.length ?? 0;
      // "(sin iniciar)" shorthand only for missing lists where the entire
      // section is missing. For duplicates this never applies.
      if (kind === 'missing' && sectionSize > 0 && b.items.length === sectionSize) {
        out.push('(sin iniciar)');
      } else {
        out.push(
          b.items
            .map((it) => (it.count > 1 ? `${it.id} ×${it.count}` : it.id))
            .join(', '),
        );
      }
      out.push('');
    }
  }

  out.push('─'.repeat(BOX_WIDTH));
  out.push(`Compártela con tu app: ${APP_HOST}`);
  out.push('Pega esta lista en /comparar para ver intercambios');

  return out.join('\n');
}

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function boxTop(width: number): string {
  return '╔' + '═'.repeat(width) + '╗';
}
function boxBottom(width: number): string {
  return '╚' + '═'.repeat(width) + '╝';
}
function boxLine(text: string, width: number): string {
  const inner = ' ' + text;
  const padded =
    inner.length >= width ? inner.slice(0, width) : inner + ' '.repeat(width - inner.length);
  return '║' + padded + '║';
}

export { APP_BRAND, APP_HOST };

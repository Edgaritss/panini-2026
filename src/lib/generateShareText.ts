import { APP_HOST } from './formatTradesList';
import type { MatchBucket, TradeMatches } from './calculateTradeMatches';

/**
 * Renders the contextual text the user copies after a successful trade match.
 * The kind determines wording and emoji.
 */
export function buildShareText(matches: TradeMatches): string {
  const { kind, buckets, totalMatched } = matches;
  const lines: string[] = [];

  if (kind === 'i-give') {
    lines.push('🎁 Hola! Estas son las estampas que te puedo regalar:');
  } else {
    lines.push('💝 Hola! De las que tienes de sobra, yo necesito estas:');
  }
  lines.push('');

  for (const b of buckets) {
    lines.push(`${b.code}: ${formatBucket(b)}`);
  }
  lines.push('');
  lines.push(`Total: ${totalMatched} ${totalMatched === 1 ? 'estampa' : 'estampas'}`);
  lines.push('');
  if (kind === 'i-give') {
    lines.push('Avísame cuándo nos vemos para hacer el cambio 🤝');
  } else {
    lines.push('¿Las tienes disponibles para intercambiar?');
  }
  lines.push('');
  lines.push('────');
  lines.push(`Generado con ${APP_HOST}`);

  return lines.join('\n');
}

function formatBucket(b: MatchBucket): string {
  return b.items
    .map((it) => (it.count > 1 ? `${it.id} ×${it.count}` : it.id))
    .join(', ');
}

/**
 * Builds a wa.me URL that opens WhatsApp with the share text prefilled. No
 * phone number means the user picks the contact in WhatsApp itself.
 */
export function buildWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

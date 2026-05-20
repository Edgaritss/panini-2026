import { sections, stickersBySection } from '../data/album';

export type MatchKind = 'i-give' | 'i-receive';

export interface MatchItem {
  id: string;
  number: number;
  count: number;
}

export interface MatchBucket {
  code: string;
  name: string;
  items: MatchItem[];
}

export interface TradeMatches {
  kind: MatchKind;
  buckets: MatchBucket[];
  totalMatched: number;
  /** Total stickers in the pasted list (for the "X of Y" copy). */
  pasteTotal: number;
}

interface Params {
  myCounts: Record<string, number>;
  theirStickers: Map<string, number>;
  /** 'missing' → they need it; 'duplicates' → they have spares. */
  theirListKind: 'missing' | 'duplicates';
}

/**
 * Given my collection counts and the other collector's parsed list,
 * computes what can be traded.
 *
 *  - If their list is FALTANTES, return stickers I have as duplicates that
 *    they need ("Lo que le puedo dar").
 *  - If their list is REPETIDAS, return stickers they have spare that I'm
 *    missing ("Lo que me puede dar").
 */
export function calculateTradeMatches({
  myCounts,
  theirStickers,
  theirListKind,
}: Params): TradeMatches {
  const kind: MatchKind = theirListKind === 'missing' ? 'i-give' : 'i-receive';
  const buckets: MatchBucket[] = [];
  let totalMatched = 0;
  let pasteTotal = 0;

  for (const qty of theirStickers.values()) pasteTotal += qty;

  for (const section of sections) {
    const all = stickersBySection.get(section.code) ?? [];
    const items: MatchItem[] = [];

    for (const st of all) {
      if (!theirStickers.has(st.id)) continue;
      const mine = myCounts[st.id] ?? 0;

      if (kind === 'i-give') {
        // They lack it; I can give one if I have a duplicate (count ≥ 2).
        const extras = Math.max(0, mine - 1);
        if (extras > 0) {
          items.push({ id: st.id, number: st.number, count: extras });
          totalMatched += extras;
        }
      } else {
        // They have it spare; I need it (count === 0). They list quantity but
        // we only need one to fill the gap.
        if (mine === 0) {
          items.push({ id: st.id, number: st.number, count: 1 });
          totalMatched += 1;
        }
      }
    }

    if (items.length > 0) {
      items.sort((a, b) => a.number - b.number);
      buckets.push({ code: section.code, name: section.name, items });
    }
  }

  return { kind, buckets, totalMatched, pasteTotal };
}

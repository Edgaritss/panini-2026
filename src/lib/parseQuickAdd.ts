import { validCodes, stickerCountOf } from '../data/album';

export interface QuickAddResult {
  valid: string[];
  invalid: string[];
}

export function parseQuickAdd(input: string): QuickAddResult {
  const tokens = input.split(/[\s,;]+/).filter(Boolean);
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const token of tokens) {
    // Accept 2-4 letter section codes (CC has 2, FWC has 3, the rest 3).
    const match = token.toUpperCase().match(/^([A-Z]{2,4})[-\s]?(\d{1,2})$/);
    if (!match) {
      invalid.push(token);
      continue;
    }
    const [, code, numStr] = match;
    const num = parseInt(numStr, 10);
    if (!validCodes.has(code) || num < 1 || num > stickerCountOf(code)) {
      invalid.push(token);
      continue;
    }
    valid.push(`${code}${num}`);
  }

  return { valid, invalid };
}

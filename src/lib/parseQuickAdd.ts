import { validCodes } from '../data/album';
import { STICKERS_PER_SECTION } from '../data/album';

export interface QuickAddResult {
  valid: string[];
  invalid: string[];
}

export function parseQuickAdd(input: string): QuickAddResult {
  const tokens = input.split(/[\s,;]+/).filter(Boolean);
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const token of tokens) {
    const match = token.toUpperCase().match(/^([A-Z]{3})[-\s]?(\d{1,2})$/);
    if (!match) {
      invalid.push(token);
      continue;
    }
    const [, code, numStr] = match;
    const num = parseInt(numStr, 10);
    if (!validCodes.has(code) || num < 1 || num > STICKERS_PER_SECTION) {
      invalid.push(token);
      continue;
    }
    valid.push(`${code}${num}`);
  }

  return { valid, invalid };
}

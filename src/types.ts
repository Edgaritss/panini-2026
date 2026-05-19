export interface Section {
  code: string;
  name: string;
  group: string | null;
}

export interface Sticker {
  id: string;
  number: number;
  sectionCode: string;
  sectionName: string;
  group: string | null;
}

export type FilterMode = 'all' | 'missing' | 'have' | 'duplicate';
export type Theme = 'light' | 'dark';
export type View = 'home' | 'trades' | 'settings';

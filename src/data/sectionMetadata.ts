// Continent assignment for each section. Used by the /cambios filters.
// FWC (cover/global) is mapped to 'special' so it doesn't accidentally
// match a continent filter.

export type Continent =
  | 'north-america'
  | 'central-america'
  | 'south-america'
  | 'europe'
  | 'asia'
  | 'africa'
  | 'oceania'
  | 'special';

export const sectionContinent: Record<string, Continent> = {
  FWC: 'special',
  CC: 'special',

  // A
  MEX: 'north-america',
  RSA: 'africa',
  KOR: 'asia',
  CZE: 'europe',

  // B
  CAN: 'north-america',
  BIH: 'europe',
  QAT: 'asia',
  SUI: 'europe',

  // C
  BRA: 'south-america',
  MAR: 'africa',
  HAI: 'central-america',
  SCO: 'europe',

  // D
  USA: 'north-america',
  PAR: 'south-america',
  AUS: 'oceania',
  TUR: 'europe',

  // E
  GER: 'europe',
  CUW: 'central-america',
  CIV: 'africa',
  ECU: 'south-america',

  // F
  NED: 'europe',
  JPN: 'asia',
  SWE: 'europe',
  TUN: 'africa',

  // G
  BEL: 'europe',
  EGY: 'africa',
  IRN: 'asia',
  NZL: 'oceania',

  // H
  ESP: 'europe',
  CPV: 'africa',
  KSA: 'asia',
  URU: 'south-america',

  // I
  FRA: 'europe',
  SEN: 'africa',
  IRQ: 'asia',
  NOR: 'europe',

  // J
  ARG: 'south-america',
  ALG: 'africa',
  AUT: 'europe',
  JOR: 'asia',

  // K
  POR: 'europe',
  COD: 'africa',
  UZB: 'asia',
  COL: 'south-america',

  // L
  ENG: 'europe',
  CRO: 'europe',
  GHA: 'africa',
  PAN: 'central-america',
};

export const continentLabels: Record<Continent, string> = {
  'north-america': 'América del Norte',
  'central-america': 'América Central',
  'south-america': 'Sudamérica',
  europe: 'Europa',
  asia: 'Asia',
  africa: 'África',
  oceania: 'Oceanía',
  special: 'Especiales',
};

export const continentOrder: Continent[] = [
  'south-america',
  'north-america',
  'central-america',
  'europe',
  'africa',
  'asia',
  'oceania',
  'special',
];

export function continentOf(code: string): Continent {
  return sectionContinent[code] ?? 'special';
}

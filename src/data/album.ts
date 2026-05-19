import type { Section, Sticker } from '../types';

export const STICKERS_PER_SECTION = 20;

export const sections: Section[] = [
  { code: 'FWC', name: 'FIFA World Cup 2026', group: null },
  // Grupo A
  { code: 'MEX', name: 'México', group: 'A' },
  { code: 'RSA', name: 'Sudáfrica', group: 'A' },
  { code: 'KOR', name: 'Corea del Sur', group: 'A' },
  { code: 'CZE', name: 'Chequia', group: 'A' },
  // Grupo B
  { code: 'CAN', name: 'Canadá', group: 'B' },
  { code: 'BIH', name: 'Bosnia y Herzegovina', group: 'B' },
  { code: 'QAT', name: 'Catar', group: 'B' },
  { code: 'SUI', name: 'Suiza', group: 'B' },
  // Grupo C
  { code: 'BRA', name: 'Brasil', group: 'C' },
  { code: 'MAR', name: 'Marruecos', group: 'C' },
  { code: 'HAI', name: 'Haití', group: 'C' },
  { code: 'SCO', name: 'Escocia', group: 'C' },
  // Grupo D
  { code: 'USA', name: 'Estados Unidos', group: 'D' },
  { code: 'PAR', name: 'Paraguay', group: 'D' },
  { code: 'AUS', name: 'Australia', group: 'D' },
  { code: 'TUR', name: 'Turquía', group: 'D' },
  // Grupo E
  { code: 'GER', name: 'Alemania', group: 'E' },
  { code: 'CUW', name: 'Curazao', group: 'E' },
  { code: 'CIV', name: 'Costa de Marfil', group: 'E' },
  { code: 'ECU', name: 'Ecuador', group: 'E' },
  // Grupo F
  { code: 'NED', name: 'Holanda', group: 'F' },
  { code: 'JPN', name: 'Japón', group: 'F' },
  { code: 'SWE', name: 'Suecia', group: 'F' },
  { code: 'TUN', name: 'Túnez', group: 'F' },
  // Grupo G
  { code: 'BEL', name: 'Bélgica', group: 'G' },
  { code: 'EGY', name: 'Egipto', group: 'G' },
  { code: 'IRN', name: 'Irán', group: 'G' },
  { code: 'NZL', name: 'Nueva Zelanda', group: 'G' },
  // Grupo H
  { code: 'ESP', name: 'España', group: 'H' },
  { code: 'CPV', name: 'Cabo Verde', group: 'H' },
  { code: 'KSA', name: 'Arabia Saudita', group: 'H' },
  { code: 'URU', name: 'Uruguay', group: 'H' },
  // Grupo I
  { code: 'FRA', name: 'Francia', group: 'I' },
  { code: 'SEN', name: 'Senegal', group: 'I' },
  { code: 'IRQ', name: 'Iraq', group: 'I' },
  { code: 'NOR', name: 'Noruega', group: 'I' },
  // Grupo J
  { code: 'ARG', name: 'Argentina', group: 'J' },
  { code: 'ALG', name: 'Argelia', group: 'J' },
  { code: 'AUT', name: 'Austria', group: 'J' },
  { code: 'JOR', name: 'Jordania', group: 'J' },
  // Grupo K
  { code: 'POR', name: 'Portugal', group: 'K' },
  { code: 'COD', name: 'RD Congo', group: 'K' },
  { code: 'UZB', name: 'Uzbekistán', group: 'K' },
  { code: 'COL', name: 'Colombia', group: 'K' },
  // Grupo L
  { code: 'ENG', name: 'Inglaterra', group: 'L' },
  { code: 'CRO', name: 'Croacia', group: 'L' },
  { code: 'GHA', name: 'Ghana', group: 'L' },
  { code: 'PAN', name: 'Panamá', group: 'L' },
];

export const stickers: Sticker[] = sections.flatMap((section) =>
  Array.from({ length: STICKERS_PER_SECTION }, (_, i) => ({
    id: `${section.code}${i + 1}`,
    number: i + 1,
    sectionCode: section.code,
    sectionName: section.name,
    group: section.group,
  })),
);

export const TOTAL = stickers.length;

export const sectionByCode = new Map(sections.map((s) => [s.code, s]));
export const validCodes = new Set(sections.map((s) => s.code));

export const stickersBySection: ReadonlyMap<string, Sticker[]> = (() => {
  const map = new Map<string, Sticker[]>();
  for (const st of stickers) {
    const arr = map.get(st.sectionCode);
    if (arr) arr.push(st);
    else map.set(st.sectionCode, [st]);
  }
  return map;
})();

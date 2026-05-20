import type { Section, Sticker } from '../types';

/** Default size for selection sections (each Mundial team). */
const TEAM_STICKERS = 20;

export const sections: Section[] = [
  { code: 'FWC', name: 'FIFA World Cup 2026', group: null, stickerCount: 20, category: 'special' },
  { code: 'CC', name: 'Coca-Cola', group: null, stickerCount: 14, category: 'sponsor' },
  // Grupo A
  { code: 'MEX', name: 'México', group: 'A', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'RSA', name: 'Sudáfrica', group: 'A', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'KOR', name: 'Corea del Sur', group: 'A', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'CZE', name: 'Chequia', group: 'A', stickerCount: TEAM_STICKERS, category: 'team' },
  // Grupo B
  { code: 'CAN', name: 'Canadá', group: 'B', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'BIH', name: 'Bosnia y Herzegovina', group: 'B', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'QAT', name: 'Catar', group: 'B', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'SUI', name: 'Suiza', group: 'B', stickerCount: TEAM_STICKERS, category: 'team' },
  // Grupo C
  { code: 'BRA', name: 'Brasil', group: 'C', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'MAR', name: 'Marruecos', group: 'C', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'HAI', name: 'Haití', group: 'C', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'SCO', name: 'Escocia', group: 'C', stickerCount: TEAM_STICKERS, category: 'team' },
  // Grupo D
  { code: 'USA', name: 'Estados Unidos', group: 'D', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'PAR', name: 'Paraguay', group: 'D', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'AUS', name: 'Australia', group: 'D', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'TUR', name: 'Turquía', group: 'D', stickerCount: TEAM_STICKERS, category: 'team' },
  // Grupo E
  { code: 'GER', name: 'Alemania', group: 'E', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'CUW', name: 'Curazao', group: 'E', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'CIV', name: 'Costa de Marfil', group: 'E', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'ECU', name: 'Ecuador', group: 'E', stickerCount: TEAM_STICKERS, category: 'team' },
  // Grupo F
  { code: 'NED', name: 'Holanda', group: 'F', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'JPN', name: 'Japón', group: 'F', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'SWE', name: 'Suecia', group: 'F', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'TUN', name: 'Túnez', group: 'F', stickerCount: TEAM_STICKERS, category: 'team' },
  // Grupo G
  { code: 'BEL', name: 'Bélgica', group: 'G', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'EGY', name: 'Egipto', group: 'G', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'IRN', name: 'Irán', group: 'G', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'NZL', name: 'Nueva Zelanda', group: 'G', stickerCount: TEAM_STICKERS, category: 'team' },
  // Grupo H
  { code: 'ESP', name: 'España', group: 'H', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'CPV', name: 'Cabo Verde', group: 'H', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'KSA', name: 'Arabia Saudita', group: 'H', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'URU', name: 'Uruguay', group: 'H', stickerCount: TEAM_STICKERS, category: 'team' },
  // Grupo I
  { code: 'FRA', name: 'Francia', group: 'I', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'SEN', name: 'Senegal', group: 'I', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'IRQ', name: 'Iraq', group: 'I', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'NOR', name: 'Noruega', group: 'I', stickerCount: TEAM_STICKERS, category: 'team' },
  // Grupo J
  { code: 'ARG', name: 'Argentina', group: 'J', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'ALG', name: 'Argelia', group: 'J', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'AUT', name: 'Austria', group: 'J', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'JOR', name: 'Jordania', group: 'J', stickerCount: TEAM_STICKERS, category: 'team' },
  // Grupo K
  { code: 'POR', name: 'Portugal', group: 'K', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'COD', name: 'RD Congo', group: 'K', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'UZB', name: 'Uzbekistán', group: 'K', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'COL', name: 'Colombia', group: 'K', stickerCount: TEAM_STICKERS, category: 'team' },
  // Grupo L
  { code: 'ENG', name: 'Inglaterra', group: 'L', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'CRO', name: 'Croacia', group: 'L', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'GHA', name: 'Ghana', group: 'L', stickerCount: TEAM_STICKERS, category: 'team' },
  { code: 'PAN', name: 'Panamá', group: 'L', stickerCount: TEAM_STICKERS, category: 'team' },
];

export const stickers: Sticker[] = sections.flatMap((section) =>
  Array.from({ length: section.stickerCount }, (_, i) => ({
    id: `${section.code}${i + 1}`,
    number: i + 1,
    sectionCode: section.code,
    sectionName: section.name,
    group: section.group,
    category: section.category,
  })),
);

export const TOTAL = stickers.length;
export const TOTAL_SECTIONS = sections.length;

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

export function stickerCountOf(code: string): number {
  return sectionByCode.get(code)?.stickerCount ?? 0;
}

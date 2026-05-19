// Color palettes that swap the accent / owned / duplicate semantic tokens.
// Canvas, surface and text tokens stay constant across palettes so contrast
// and legibility are preserved. Light/dark are tuned independently.

export interface ThemeColors {
  secondary: string;
  secondaryContainer: string;
  onSecondary: string;
  owned: string;
  onOwned: string;
  duplicate: string;
  onDuplicate: string;
}

export interface ThemePalette {
  id: string;
  name: string;
  emoji: string;
  description: string;
  light: ThemeColors;
  dark: ThemeColors;
}

export const themes: ThemePalette[] = [
  {
    id: 'mundial-classic',
    name: 'Mundial Clásico',
    emoji: '⚽',
    description: 'Rojo, verde y oro tradicionales',
    light: {
      secondary: '#bb0112',
      secondaryContainer: '#e02928',
      onSecondary: '#ffffff',
      owned: '#15803d',
      onOwned: '#ffffff',
      duplicate: '#b45309',
      onDuplicate: '#ffffff',
    },
    dark: {
      secondary: '#ef4444',
      secondaryContainer: '#dc2626',
      onSecondary: '#ffffff',
      owned: '#22c55e',
      onOwned: '#0c0a09',
      duplicate: '#f59e0b',
      onDuplicate: '#0c0a09',
    },
  },
  {
    id: 'midnight-blue',
    name: 'Medianoche',
    emoji: '🌙',
    description: 'Azul profundo y dorado elegante',
    light: {
      secondary: '#1e3a8a',
      secondaryContainer: '#1e40af',
      onSecondary: '#ffffff',
      owned: '#14532d',
      onOwned: '#ffffff',
      duplicate: '#ca8a04',
      onDuplicate: '#ffffff',
    },
    dark: {
      secondary: '#60a5fa',
      secondaryContainer: '#3b82f6',
      onSecondary: '#0c0a09',
      owned: '#4ade80',
      onOwned: '#0c0a09',
      duplicate: '#facc15',
      onDuplicate: '#0c0a09',
    },
  },
  {
    id: 'mexican-vibes',
    name: 'México Mode',
    emoji: '🇲🇽',
    description: 'Verde, blanco y rojo bandera',
    light: {
      secondary: '#065f46',
      secondaryContainer: '#064e3b',
      onSecondary: '#ffffff',
      owned: '#065f46',
      onOwned: '#ffffff',
      duplicate: '#b91c1c',
      onDuplicate: '#ffffff',
    },
    dark: {
      secondary: '#34d399',
      secondaryContainer: '#10b981',
      onSecondary: '#0c0a09',
      owned: '#34d399',
      onOwned: '#0c0a09',
      duplicate: '#f87171',
      onDuplicate: '#0c0a09',
    },
  },
  {
    id: 'sunset-pop',
    name: 'Atardecer',
    emoji: '🌅',
    description: 'Naranjas y rosas vibrantes',
    light: {
      secondary: '#ea580c',
      secondaryContainer: '#c2410c',
      onSecondary: '#ffffff',
      owned: '#be185d',
      onOwned: '#ffffff',
      duplicate: '#ca8a04',
      onDuplicate: '#ffffff',
    },
    dark: {
      secondary: '#fb923c',
      secondaryContainer: '#f97316',
      onSecondary: '#0c0a09',
      owned: '#f472b6',
      onOwned: '#0c0a09',
      duplicate: '#facc15',
      onDuplicate: '#0c0a09',
    },
  },
  {
    id: 'forest-deep',
    name: 'Bosque',
    emoji: '🌲',
    description: 'Verdes profundos y tierra',
    light: {
      secondary: '#057041',
      secondaryContainer: '#045736',
      onSecondary: '#ffffff',
      owned: '#65a30d',
      onOwned: '#ffffff',
      duplicate: '#b45309',
      onDuplicate: '#ffffff',
    },
    dark: {
      secondary: '#4ade80',
      secondaryContainer: '#22c55e',
      onSecondary: '#0c0a09',
      owned: '#a3e635',
      onOwned: '#0c0a09',
      duplicate: '#f59e0b',
      onDuplicate: '#0c0a09',
    },
  },
  {
    id: 'royal-purple',
    name: 'Real',
    emoji: '👑',
    description: 'Púrpura y dorado regio',
    light: {
      secondary: '#6b21a8',
      secondaryContainer: '#5b21b6',
      onSecondary: '#ffffff',
      owned: '#059669',
      onOwned: '#ffffff',
      duplicate: '#ca8a04',
      onDuplicate: '#ffffff',
    },
    dark: {
      secondary: '#c084fc',
      secondaryContainer: '#a855f7',
      onSecondary: '#0c0a09',
      owned: '#34d399',
      onOwned: '#0c0a09',
      duplicate: '#facc15',
      onDuplicate: '#0c0a09',
    },
  },
  {
    id: 'mono-noir',
    name: 'Noir',
    emoji: '⬛',
    description: 'Minimalista en escala de grises',
    light: {
      secondary: '#171717',
      secondaryContainer: '#262626',
      onSecondary: '#ffffff',
      owned: '#525252',
      onOwned: '#ffffff',
      duplicate: '#a3a3a3',
      onDuplicate: '#171717',
    },
    dark: {
      secondary: '#fafaf9',
      secondaryContainer: '#e7e5e4',
      onSecondary: '#0c0a09',
      owned: '#d4d4d4',
      onOwned: '#0c0a09',
      duplicate: '#737373',
      onDuplicate: '#fafaf9',
    },
  },
  {
    id: 'ocean-breeze',
    name: 'Océano',
    emoji: '🌊',
    description: 'Azules y turquesas frescos',
    light: {
      secondary: '#0e7490',
      secondaryContainer: '#155e75',
      onSecondary: '#ffffff',
      owned: '#0d9488',
      onOwned: '#ffffff',
      duplicate: '#ca8a04',
      onDuplicate: '#ffffff',
    },
    dark: {
      secondary: '#22d3ee',
      secondaryContainer: '#06b6d4',
      onSecondary: '#0c0a09',
      owned: '#5eead4',
      onOwned: '#0c0a09',
      duplicate: '#facc15',
      onDuplicate: '#0c0a09',
    },
  },
];

export const defaultTheme = themes[0];

export function findTheme(id: string): ThemePalette {
  return themes.find((t) => t.id === id) ?? defaultTheme;
}

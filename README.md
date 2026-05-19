# Panini · Mundial 2026

Organizador personal de estampas del álbum **Panini FIFA World Cup 2026**.

49 secciones × 20 estampas = **980 estampas** totales (1 portada + 48 selecciones de los grupos A–L).

## Funciones

- Marcar estampas como tenidas con un tap. Restar con el botón `−`.
- Conteo de repetidas para intercambio (badge ámbar `+N`).
- Entrada rápida: pega varios códigos del sobre a la vez (`MEX1 USA7 BRA15`).
- Filtros: todas / faltantes / tengo / repetidas.
- Búsqueda por nombre, código FIFA o grupo (`MEX`, `México`, `Grupo A`, `A`).
- Vista de intercambios y faltantes en formato texto, copiable al portapapeles.
- Export / import JSON para respaldo manual.
- Tema claro / oscuro.
- PWA: "Añadir a pantalla de inicio" en iPad o iPhone.
- 100% local: el progreso vive en `localStorage` de este navegador.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v3
- Zustand (estado + persistencia)

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

### Acceso desde iPad en la misma red

```bash
npm run dev -- --host
```

Conéctate desde el iPad a la URL `http://<ip-de-tu-mac>:5173/`.

### Build de producción

```bash
npm run build
npm run preview
```

## Deploy en Vercel

1. Sube el repo a GitHub.
2. Importa el repo en [vercel.com/new](https://vercel.com/new).
3. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. Deploy.

## Estructura

```
src/
├── data/album.ts          # 49 secciones + generador de 980 estampas
├── store/useAlbumStore.ts # Zustand con persist a localStorage
├── lib/
│   ├── parseQuickAdd.ts   # Parser de "MEX1 USA7 BRA15..."
│   └── exportImport.ts    # Export / import JSON
├── components/            # Header, QuickAddBar, ProgressBar, SectionCard, StickerCell, Filters, ThemeToggle
├── pages/                 # Home, Trades, Settings
└── App.tsx                # Vista activa según store
```

## Notas

- Los códigos FIFA en inglés son la fuente de la verdad (`MEX`, `KSA`, `RSA`...).
- Toda la persistencia es localStorage: exporta JSON con frecuencia si te importa el respaldo.
- 980 estampas exactas (49 × 20). Sin categorías extra inventadas.

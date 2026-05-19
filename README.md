# Mundial '26 Sticker Tracker

Organizador personal de estampas del álbum **Panini FIFA World Cup 2026**.

49 secciones × 20 estampas = **980 estampas** totales (1 portada + 48 selecciones de los grupos A–L).

## Funciones

- Tap para marcar como tenida, botón `−` para restar.
- Conteo de repetidas para intercambio (badge rojo `+N`).
- Entrada rápida: pega varios códigos a la vez (`MEX1 USA7 BRA15`).
- Filtros: todas / faltantes / tengo / repetidas + búsqueda por nombre, código o grupo.
- Vista **Cambios**: dos columnas (me faltan / tengo repetidas), copiables al portapapeles.
- Vista **/seccion/:code** dedicada a una selección, con toggle Grid / Cards y navegación anterior/siguiente.
- Vista **Estadísticas**: KPIs, ranking de secciones, distribución por grupo (Recharts), top repetidas, insights.
- Exportación a Excel (.xlsx) con 4 hojas: Resumen, Tengo, Me faltan, Repetidas.
- Importación desde JSON (backup técnico).
- Tema claro / oscuro / auto.
- **Sincronización con Supabase**: una sola fila JSON, fallback offline a LocalStorage, indicador de estado en el header.
- PWA-ready: añadir a pantalla de inicio en iPad / iPhone.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v3 + Material Symbols + Inter + JetBrains Mono
- Zustand (estado, persistencia local)
- react-router-dom (rutas)
- @supabase/supabase-js (cloud sync)
- ExcelJS (export XLSX, import dinámico)
- Recharts (distribución por grupo)

## Desarrollo

```bash
npm install
cp .env.example .env.local   # rellena con las 3 vars de Supabase
npm run dev
```

Abre `http://localhost:5173`. Sin `.env.local` la app igual funciona contra LocalStorage: el indicador del header dirá "Solo local (sin Supabase)".

Acceso desde iPad en la misma red:

```bash
npm run dev -- --host
```

### Build

```bash
npm run build
npm run preview
```

## Configurar Supabase (5–10 min)

Modelo: una sola fila JSON en una tabla `collections`. Sin auth: la `anon key` queda como "contraseña" práctica del proyecto. Es la **Opción A** del brief — más simple para una app personal, sin fricción al abrir desde otro dispositivo. Si en algún momento expones la URL pública, migra a auth (magic link).

1. Entra a [supabase.com](https://supabase.com) → **New project**.
   - Name: `panini-2026`
   - Database password: genera uno fuerte y guárdalo (no se usa desde la app).
   - Region: la más cercana.
2. Cuando termine de provisionar (~2 min), abre **SQL Editor** (icono SQL a la izquierda).
3. Pega y ejecuta:

   ```sql
   create extension if not exists "pgcrypto";

   create table public.collections (
     id uuid primary key default gen_random_uuid(),
     owned jsonb not null default '{}'::jsonb,
     first_added_at timestamptz,
     updated_at timestamptz not null default now()
   );

   insert into public.collections (id) values (gen_random_uuid())
   returning id;            -- ← copia este UUID, es VITE_COLLECTION_ID

   alter table public.collections enable row level security;

   create policy "anon read"  on public.collections for select using (true);
   create policy "anon write" on public.collections for update using (true);
   ```

4. Anota el UUID que devolvió el `returning id`.
5. Ve a **Settings → API** y copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
6. Pega los tres valores en `.env.local`:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_COLLECTION_ID=00000000-0000-0000-0000-000000000000
   ```

7. Reinicia `npm run dev`. El indicador del header debe quedar verde "Sincronizado".

### Cómo funciona la sync

- **Al cargar**: la app pide la fila de Supabase y la usa como fuente de verdad si su `updated_at` es ≥ que el `localUpdatedAt` guardado en LocalStorage. Si lo local es más reciente (cambios offline), empuja primero y luego marca sincronizado.
- **Al modificar**: el store se actualiza al instante (UI no espera red), y un push debounced de 600 ms manda el snapshot completo (`owned` + `first_added_at` + `updated_at`).
- **Sin red**: el indicador queda rojo/gris "Sin conexión". Los cambios se acumulan en LocalStorage. Cuando vuelve la conexión, el listener `online` dispara un `saveNow()`.
- **Sin configurar**: si faltan variables, la app corre en modo "Solo local" sin tocar Supabase.

## Deploy en Vercel

1. Push del repo a GitHub.
2. Entra a [vercel.com/new](https://vercel.com/new) e importa el repo.
3. Vercel detecta Vite y rellena: Build `npm run build`, Output `dist`.
4. **Environment Variables**: agrega las 3 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_COLLECTION_ID`) con los mismos valores que `.env.local`.
5. Deploy. Vercel asignará una URL del tipo `https://panini-2026.vercel.app`.
6. Cada push a `main` redeploya automáticamente.

> Si vas a usar dominio propio, configúralo en Vercel → Domains.

## Estructura

```
src/
├── data/album.ts            # 49 secciones + generador de 980 estampas
├── store/useAlbumStore.ts   # Zustand + persist a LocalStorage
├── lib/
│   ├── supabase.ts          # Cliente + COLLECTION_ID
│   ├── sync.ts              # Hidrate + debounced push + listeners online/offline
│   ├── parseQuickAdd.ts
│   ├── exportImport.ts      # Import JSON
│   └── exportExcel.ts       # Export XLSX (4 hojas)
├── components/              # Header, Footer, Toast, Modal, SyncIndicator,
│                            #   QuickAddBar, ProgressBar, Filters,
│                            #   SectionCard, StickerCell, StickerCard,
│                            #   EmptyBanner, Icon
├── pages/                   # Home, Trades (Cambios), Stats, Settings, SectionPage
├── App.tsx                  # Router shell
└── main.tsx                 # Bootstrap + initSync()
```

## Notas

- Los códigos FIFA en inglés son la fuente de la verdad (`MEX`, `KSA`, `RSA`...).
- LocalStorage sigue actuando como fallback offline aunque tengas Supabase.
- La app maneja sólo **código + número + cantidad**: no jugadores, no banderas, no posiciones.
- 980 estampas exactas (49 × 20).

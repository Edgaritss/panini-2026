# Mundial '26 Sticker Tracker

Organizador personal de estampas del álbum **Panini FIFA World Cup 2026**.

49 secciones × 20 estampas = **980 estampas** totales (1 portada + 48 selecciones de los grupos A–L).

## Funciones

- Cuenta personal con **email + contraseña** (Supabase Auth).
- Colección por usuario, sincronizada entre dispositivos.
- Tap para marcar como tenida, botón `−` para restar.
- Conteo de repetidas para intercambio (badge rojo `+N`).
- Entrada rápida: pega varios códigos a la vez (`MEX1 USA7 BRA15`).
- Filtros: todas / faltantes / tengo / repetidas + búsqueda por nombre, código o grupo.
- Vista **Cambios** (intercambios): dos columnas (me faltan / tengo repetidas), copiables al portapapeles.
- Vista **/seccion/:code** dedicada a una selección, con toggle Grid / Cards y navegación anterior/siguiente.
- Vista **Estadísticas**: KPIs, ranking de secciones, distribución por grupo (Recharts), top repetidas, insights.
- Exportación a Excel (.xlsx) con 4 hojas: Resumen, Tengo, Me faltan, Repetidas.
- Importación desde JSON (backup técnico).
- Tema claro / oscuro / auto (la landing siempre es oscura).
- **Landing animada** en `/` para usuarios no autenticados.
- Indicador de estado de sync en el header.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v3 + Material Symbols + Inter + JetBrains Mono
- Zustand (estado, persistencia local)
- react-router-dom (rutas + guards)
- @supabase/supabase-js (auth + DB)
- motion (Framer Motion) para la landing
- ExcelJS (export XLSX, import dinámico)
- Recharts (distribución por grupo)

## Desarrollo

```bash
npm install
cp .env.example .env.local   # rellena con las 2 vars de Supabase
npm run dev
```

Abre `http://localhost:5173`. Sin `.env.local` la app sigue compilando pero el indicador del header dirá "Solo local (sin Supabase)" y no podrás autenticarte.

Acceso desde iPad en la misma red:

```bash
npm run dev -- --host
```

### Build

```bash
npm run build
npm run preview
```

## Configurar Supabase (≈ 10 min)

Una app multi-usuario con **auth email + contraseña**, RLS por usuario y una fila JSON por cuenta.

### 1. Crear el proyecto

1. Entra a [supabase.com](https://supabase.com) → **New project**.
2. Name `panini-2026`, password fuerte, región cercana.
3. Espera ~2 min a que provisione.

### 2. Aplicar el schema

En **SQL Editor → New query**, pega y ejecuta:

```sql
-- Tabla por usuario
create table public.user_collections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  owned jsonb not null default '{}'::jsonb,
  first_added_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at automático
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_user_collections_updated_at
  before update on public.user_collections
  for each row execute function public.update_updated_at_column();

-- Crear colección automáticamente al signup
create or replace function public.create_collection_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_collections (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_collection_for_user();

-- RLS: cada usuario sólo ve / edita su fila
alter table public.user_collections enable row level security;

create policy "Users can read own collection"
  on public.user_collections for select
  using (auth.uid() = user_id);

create policy "Users can insert own collection"
  on public.user_collections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own collection"
  on public.user_collections for update
  using (auth.uid() = user_id);
```

### 3. Configurar Auth

**Authentication → Providers → Email**:
- `Enable signups`: **ON** mientras vayas a crear tu cuenta. Cuando ya estés dentro puedes apagarlo si la app es solo para ti.
- `Confirm email`: **OFF** en desarrollo. Para producción real, actívalo después y configura el template del correo en *Authentication → Email Templates*.

**Authentication → URL Configuration**:
- **Site URL**: la URL de Vercel (ej. `https://panini-2026-two.vercel.app`)
- **Redirect URLs**: añadir
  - `https://panini-2026-two.vercel.app/**`
  - `http://localhost:5173/**`

### 4. Variables de entorno

Ya no se necesita `VITE_COLLECTION_ID` (cada usuario tiene su fila). En **Settings → API** copia:

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon public key |

Pégalas en `.env.local` (local) y en **Vercel → Project Settings → Environment Variables** (producción + preview + development).

### Cerrar el registro cuando ya tengas tu cuenta

Si la app es sólo para ti:

1. Crea tu cuenta en `/registro`.
2. Vuelve al dashboard de Supabase → **Authentication → Providers → Email** → desactiva `Enable signups`.
3. Re-deploy o limpia cache; el `/registro` seguirá renderizando, pero Supabase rechazará nuevos altas con el error "El registro está cerrado".

### Migración desde el modelo anterior (Fase 2)

Si tenías datos en la tabla `collections` (modelo de fila única), exporta el JSON desde la app vieja (Ajustes → Exportar). Después de loguearte por primera vez en el nuevo modelo, ve a Ajustes → Importar JSON y carga el archivo.

## Cómo funciona la sync

- **Al iniciar sesión**: la app pide la fila de Supabase filtrando por `user_id` y la usa como fuente de verdad.
- **Al modificar**: el store se actualiza al instante (UI no espera red), y un push debounced de 600 ms hace `upsert` sobre la fila del usuario.
- **Sin red**: el indicador queda en "Sin conexión". Los cambios se acumulan localmente. Al volver la red, hay un push automático.
- **Al cerrar sesión**: el store local se limpia y el indicador pasa a desactivado.
- **Cambio de usuario en el mismo navegador**: se limpia el state en memoria y se hidrata el del nuevo usuario.

## Deploy en Vercel

1. Push del repo a GitHub.
2. En [vercel.com/new](https://vercel.com/new) importa el repo.
3. Framework Preset: **Vite** (auto-detectado).
4. Environment Variables: pegar las 2 vars de Supabase.
5. Deploy. Cada push a `main` redeploya automáticamente.

Si ya tenías `VITE_COLLECTION_ID` desde Fase 2, puedes borrarla; la app actual la ignora.

## Estructura

```
src/
├── data/album.ts            # 49 secciones + generador de 980 estampas
├── store/
│   ├── useAlbumStore.ts     # Counts + theme + filtros + notice
│   └── useAuth.ts           # session + user + status
├── lib/
│   ├── supabase.ts          # Cliente
│   ├── auth.ts              # signUp / signIn / signOut / getSession
│   ├── authErrors.ts        # Traducción de errores Supabase al español
│   ├── sync.ts              # Hidratación user-scoped + push debounced
│   ├── parseQuickAdd.ts
│   ├── exportImport.ts      # Import JSON
│   └── exportExcel.ts       # Export XLSX (4 hojas)
├── components/
│   ├── AppLayout.tsx        # Layout autenticado (Header + Footer + Toast)
│   ├── AuthShell.tsx        # Layout para login y registro
│   ├── RouteGuards.tsx      # ProtectedRoute + PublicOnlyRoute
│   ├── UserMenu.tsx         # Avatar dropdown
│   ├── landing/             # FloatingTiles, DemoMockup
│   └── …                    # Resto de UI compartido
├── pages/
│   ├── Landing.tsx          # / (público) con animaciones Framer Motion
│   ├── Login.tsx            # /login
│   ├── Register.tsx         # /registro
│   ├── Home.tsx             # /album
│   ├── Trades.tsx           # /cambios
│   ├── Stats.tsx            # /estadisticas
│   ├── Settings.tsx         # /ajustes
│   └── SectionPage.tsx      # /seccion/:code
├── App.tsx                  # Router shell + guards
└── main.tsx                 # Bootstrap + initAuth + initSync
```

## Notas

- Los códigos FIFA en inglés son la fuente de la verdad (`MEX`, `KSA`, `RSA`...).
- LocalStorage sigue actuando como fallback offline.
- La app maneja sólo **código + número + cantidad**: no jugadores, no banderas, no posiciones.
- 980 estampas exactas (49 × 20).
- La landing usa siempre tema oscuro; la app interna respeta el toggle del usuario.

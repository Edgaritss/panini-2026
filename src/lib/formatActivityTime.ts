/**
 * Spanish-language relative/absolute time formatting. No external deps.
 *
 * - Relative: "Hace 5 minutos", "Ayer", "Hace 2 semanas"…
 * - Absolute: "19/05 · 14:32" for recent dates, "19/04/2026 · 14:32" past 7d.
 */

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export function formatRelative(timestamp: string, now: number = Date.now()): string {
  const t = Date.parse(timestamp);
  if (Number.isNaN(t)) return '';
  const diff = Math.max(0, now - t);

  if (diff < 45 * SECOND) return 'Justo ahora';
  if (diff < 90 * SECOND) return 'Hace 1 minuto';

  if (diff < HOUR) {
    const m = Math.round(diff / MINUTE);
    return `Hace ${m} ${m === 1 ? 'minuto' : 'minutos'}`;
  }
  if (diff < 22 * HOUR) {
    const h = Math.round(diff / HOUR);
    return `Hace ${h} ${h === 1 ? 'hora' : 'horas'}`;
  }
  if (diff < 36 * HOUR) return 'Ayer';
  if (diff < 6 * DAY) {
    const d = Math.round(diff / DAY);
    return `Hace ${d} días`;
  }
  if (diff < 13 * DAY) return 'Hace 1 semana';
  if (diff < 4 * WEEK) {
    const w = Math.round(diff / WEEK);
    return `Hace ${w} semanas`;
  }
  const months = Math.round(diff / (30 * DAY));
  if (months < 12) return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
  const years = Math.round(diff / (365 * DAY));
  return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
}

/** "19/05 · 14:32" for ≤ 7d, otherwise includes year. */
export function formatAbsoluteShort(
  timestamp: string,
  now: number = Date.now(),
): string {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  const diff = now - d.getTime();
  const dd = pad(d.getDate());
  const mm = pad(d.getMonth() + 1);
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  if (diff < 7 * DAY) return `${dd}/${mm} · ${hh}:${mi}`;
  return `${dd}/${mm}/${d.getFullYear()} · ${hh}:${mi}`;
}

/** "HOY · 19 de mayo" / "AYER · 18 de mayo" / "16 DE MAYO" */
export function formatDayHeader(
  timestamp: string,
  now: number = Date.now(),
): string {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  const today = startOfDay(new Date(now));
  const dayStart = startOfDay(d);
  const diffDays = Math.round((today.getTime() - dayStart.getTime()) / DAY);

  const monthName = MONTHS[d.getMonth()];
  const base = `${d.getDate()} de ${monthName}`;

  if (diffDays === 0) return `HOY · ${base}`;
  if (diffDays === 1) return `AYER · ${base}`;
  if (diffDays > 1 && diffDays < 7) return `HACE ${diffDays} DÍAS · ${base}`;
  return base.toUpperCase();
}

export function dayKey(timestamp: string): string {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

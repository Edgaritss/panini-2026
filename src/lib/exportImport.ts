import { useAlbumStore } from '../store/useAlbumStore';

interface ExportPayload {
  app: 'panini-2026';
  version: number;
  exportedAt: string;
  counts: Record<string, number>;
}

export function buildExportPayload(): ExportPayload {
  return {
    app: 'panini-2026',
    version: 1,
    exportedAt: new Date().toISOString(),
    counts: useAlbumStore.getState().counts,
  };
}

export function downloadJSON(): void {
  const payload = buildExportPayload();
  const text = JSON.stringify(payload, null, 2);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `panini-2026-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importJSONFile(file: File): Promise<number> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Archivo JSON inválido.');
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('counts' in parsed) ||
    typeof (parsed as { counts: unknown }).counts !== 'object'
  ) {
    throw new Error('Estructura inesperada: falta el campo "counts".');
  }
  const rawCounts = (parsed as { counts: Record<string, unknown> }).counts;
  const cleaned: Record<string, number> = {};
  for (const [id, raw] of Object.entries(rawCounts)) {
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
      cleaned[id] = Math.floor(raw);
    }
  }
  useAlbumStore.getState().importData(cleaned);
  return Object.keys(cleaned).length;
}

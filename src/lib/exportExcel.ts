import type { Cell, Worksheet } from 'exceljs';
import { sections, stickersBySection, TOTAL } from '../data/album';
import { useAlbumStore } from '../store/useAlbumStore';

const FILE_BASENAME = 'mundial2026-coleccion';

interface SectionStats {
  code: string;
  name: string;
  group: string | null;
  owned: number;
  total: number;
}

export async function downloadExcel(): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const counts = useAlbumStore.getState().counts;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Mundial 2026 Tracker';
  wb.created = new Date();

  const perSection = computePerSection(counts);
  const owned = perSection.reduce((acc, s) => acc + s.owned, 0);
  const missing = TOTAL - owned;
  let duplicates = 0;
  for (const c of Object.values(counts)) if (c > 1) duplicates += c - 1;

  buildResumenSheet(wb.addWorksheet('Resumen'), {
    owned,
    missing,
    duplicates,
    perSection,
  });

  buildOwnedSheet(wb.addWorksheet('Tengo'), counts);
  buildMissingSheet(wb.addWorksheet('Me faltan'), counts);
  buildDuplicatesSheet(wb.addWorksheet('Repetidas'), counts);

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${FILE_BASENAME}-${date}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function computePerSection(counts: Record<string, number>): SectionStats[] {
  return sections.map((s) => {
    const all = stickersBySection.get(s.code) ?? [];
    let owned = 0;
    for (const st of all) if ((counts[st.id] ?? 0) >= 1) owned += 1;
    return { code: s.code, name: s.name, group: s.group, owned, total: all.length };
  });
}

const HEADER_FILL_GREY = 'FFEEEEED';
const HEADER_FILL_GREEN = 'FFD7F5DE';
const HEADER_FILL_RED = 'FFFFDAD6';
const HEADER_FILL_AMBER = 'FFFFEFC1';
const STATE_GREEN = 'FF22C55E';
const STATE_AMBER = 'FFF59E0B';
const STATE_GREY = 'FFA8A29E';

function buildResumenSheet(
  ws: Worksheet,
  data: {
    owned: number;
    missing: number;
    duplicates: number;
    perSection: SectionStats[];
  },
): void {
  ws.getCell('A1').value = 'Mi colección Mundial 2026';
  ws.getCell('A1').font = { bold: true, size: 16, name: 'Calibri' };
  ws.mergeCells('A1:G1');

  const today = new Date();
  ws.getCell('A3').value = 'Fecha de exportación';
  ws.getCell('B3').value = today;
  ws.getCell('B3').numFmt = 'yyyy-mm-dd hh:mm';

  ws.getCell('A4').value = 'Total estampas en álbum';
  ws.getCell('B4').value = TOTAL;

  ws.getCell('A5').value = 'Estampas obtenidas';
  ws.getCell('B5').value = data.owned;

  ws.getCell('A6').value = 'Estampas faltantes';
  ws.getCell('B6').value = data.missing;

  ws.getCell('A7').value = 'Estampas repetidas (sobrantes)';
  ws.getCell('B7').value = data.duplicates;

  ws.getCell('A8').value = 'Porcentaje completado';
  ws.getCell('B8').value = TOTAL === 0 ? 0 : data.owned / TOTAL;
  ws.getCell('B8').numFmt = '0.0%';

  for (const row of [3, 4, 5, 6, 7, 8]) {
    ws.getCell(`A${row}`).font = { bold: true };
  }

  // Per-section table starting at row 10
  const headerRow = 10;
  const headers = ['Código', 'Sección', 'Grupo', 'Obtenidas', 'Total', '% Completado', 'Estado'];
  headers.forEach((h, i) => {
    const cell = ws.getCell(headerRow, i + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.fill = solid(HEADER_FILL_GREY);
    cell.border = thinBorder();
  });

  data.perSection.forEach((s, idx) => {
    const r = headerRow + 1 + idx;
    const pct = s.total === 0 ? 0 : s.owned / s.total;
    const state =
      s.owned === s.total ? 'Completa' : s.owned > 0 ? 'En progreso' : 'Sin iniciar';
    const stateColor =
      state === 'Completa'
        ? STATE_GREEN
        : state === 'En progreso'
          ? STATE_AMBER
          : STATE_GREY;

    setRow(ws, r, [s.code, s.name, s.group ?? 'Portada', s.owned, s.total, pct, state]);
    ws.getCell(r, 6).numFmt = '0.0%';
    const stateCell = ws.getCell(r, 7);
    stateCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    stateCell.fill = solid(stateColor);
    stateCell.alignment = { horizontal: 'center' };
    for (let c = 1; c <= 7; c += 1) {
      ws.getCell(r, c).border = thinBorder();
    }
  });

  ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: 7 } };
  ws.views = [{ state: 'frozen', ySplit: headerRow }];
  autoSizeColumns(ws);
}

function buildOwnedSheet(ws: Worksheet, counts: Record<string, number>): void {
  setHeader(ws, ['Código', 'Número', 'Sección', 'Grupo', 'Cantidad', 'Es repetida'], HEADER_FILL_GREEN);
  let row = 2;
  for (const section of sections) {
    const all = stickersBySection.get(section.code) ?? [];
    for (const st of all) {
      const c = counts[st.id] ?? 0;
      if (c < 1) continue;
      setRow(ws, row, [
        st.id,
        st.number,
        section.name,
        section.group ?? 'Portada',
        c,
        c > 1 ? 'Sí' : 'No',
      ]);
      for (let col = 1; col <= 6; col += 1) {
        ws.getCell(row, col).border = thinBorder();
      }
      row += 1;
    }
  }
  finalizeTable(ws, row - 1, 6);
}

function buildMissingSheet(ws: Worksheet, counts: Record<string, number>): void {
  setHeader(ws, ['Código', 'Número', 'Sección', 'Grupo'], HEADER_FILL_RED);
  let row = 2;
  for (const section of sections) {
    const all = stickersBySection.get(section.code) ?? [];
    for (const st of all) {
      if ((counts[st.id] ?? 0) >= 1) continue;
      setRow(ws, row, [st.id, st.number, section.name, section.group ?? 'Portada']);
      for (let col = 1; col <= 4; col += 1) {
        ws.getCell(row, col).border = thinBorder();
      }
      row += 1;
    }
  }
  finalizeTable(ws, row - 1, 4);
}

function buildDuplicatesSheet(ws: Worksheet, counts: Record<string, number>): void {
  setHeader(ws, ['Código', 'Número', 'Sección', 'Grupo', 'Tengo', 'Sobran'], HEADER_FILL_AMBER);
  let row = 2;
  for (const section of sections) {
    const all = stickersBySection.get(section.code) ?? [];
    for (const st of all) {
      const c = counts[st.id] ?? 0;
      if (c < 2) continue;
      setRow(ws, row, [
        st.id,
        st.number,
        section.name,
        section.group ?? 'Portada',
        c,
        c - 1,
      ]);
      for (let col = 1; col <= 6; col += 1) {
        ws.getCell(row, col).border = thinBorder();
      }
      row += 1;
    }
  }
  finalizeTable(ws, row - 1, 6);
}

function setHeader(ws: Worksheet, headers: string[], fill: string): void {
  headers.forEach((h, i) => {
    const cell = ws.getCell(1, i + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.fill = solid(fill);
    cell.border = thinBorder();
  });
}

function setRow(ws: Worksheet, row: number, values: (string | number | Date)[]): void {
  values.forEach((v, i) => {
    ws.getCell(row, i + 1).value = v;
  });
}

function finalizeTable(ws: Worksheet, lastRow: number, lastCol: number): void {
  const end = Math.max(lastRow, 1);
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: lastCol } };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  autoSizeColumns(ws, end);
}

function autoSizeColumns(ws: Worksheet, untilRow?: number): void {
  ws.columns.forEach((col) => {
    let max = 10;
    const limit = untilRow ?? ws.rowCount;
    col.eachCell?.({ includeEmpty: false }, (cell: Cell, rowNumber: number) => {
      if (rowNumber > limit) return;
      const v = cell.value;
      if (v == null) return;
      const len =
        typeof v === 'object' && 'richText' in (v as object)
          ? String(v).length
          : String(v).length;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 2, 40);
  });
}

function solid(argb: string): NonNullable<Cell['fill']> {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function thinBorder(): NonNullable<Cell['border']> {
  const side = { style: 'thin' as const, color: { argb: 'FFE2E2E2' } };
  return { top: side, left: side, bottom: side, right: side };
}

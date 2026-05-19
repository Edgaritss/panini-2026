import { useEffect, useState } from 'react';

/** Matches the Tailwind grid we render in `<StickerGrid>`. */
function colsFromWidth(w: number): number {
  if (w >= 1024) return 10;
  if (w >= 768) return 8;
  if (w >= 640) return 5;
  return 4;
}

export function useGridCols(): number {
  const [cols, setCols] = useState(() =>
    typeof window === 'undefined' ? 10 : colsFromWidth(window.innerWidth),
  );

  useEffect(() => {
    function onResize() {
      setCols(colsFromWidth(window.innerWidth));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return cols;
}

export function neighborIndices(
  index: number,
  cols: number,
  total: number,
): number[] {
  const out: number[] = [];
  if (index - cols >= 0) out.push(index - cols);
  if (index + cols < total) out.push(index + cols);
  if (index % cols !== 0) out.push(index - 1);
  if (index % cols !== cols - 1 && index + 1 < total) out.push(index + 1);
  return out;
}

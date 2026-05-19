import { TOTAL, sections } from '../data/album';
import { useAlbumStore } from '../store/useAlbumStore';

export function Footer() {
  const counts = useAlbumStore((s) => s.counts);
  let owned = 0;
  let completed = 0;
  for (const s of sections) {
    let sectOwned = 0;
    for (let n = 1; n <= 20; n += 1) {
      if ((counts[`${s.code}${n}`] ?? 0) >= 1) sectOwned += 1;
    }
    owned += sectOwned;
    if (sectOwned === 20) completed += 1;
  }

  return (
    <footer className="bg-surface-container-low border-t border-outline-variant py-6 mt-auto">
      <div className="max-w-max-width mx-auto w-full px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-3">
        <span className="text-small text-on-surface-variant">
          Total: {owned}/{TOTAL} estampas · {completed}/{sections.length} secciones
        </span>
        <span className="text-caps text-on-surface-variant uppercase">
          Mundial '26
        </span>
      </div>
    </footer>
  );
}

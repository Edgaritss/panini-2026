import { useState } from 'react';
import { useAlbumStore } from '../store/useAlbumStore';
import { parseQuickAdd } from '../lib/parseQuickAdd';
import { Icon } from './Icon';

export function QuickAddBar() {
  const [value, setValue] = useState('');
  const bulkIncrement = useAlbumStore((s) => s.bulkIncrement);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    const { valid, invalid } = parseQuickAdd(trimmed);
    bulkIncrement(valid, invalid.length);
    setValue('');
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="relative flex-1 sm:w-72 sm:flex-none">
        <Icon
          name="search"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
          size={20}
        />
        <input
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="Código (ej. FWC12 MEX1)"
          className="w-full h-12 pl-12 pr-4 bg-surface-container border border-outline-variant rounded-full font-mono text-mono-code text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
          aria-label="Entrada rápida de códigos de estampas"
        />
      </div>
      <button
        type="button"
        onClick={submit}
        className="h-12 px-6 bg-secondary text-on-secondary rounded-full font-body-strong text-body-strong hover:bg-secondary-container transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
      >
        <Icon name="add" filled size={20} />
        Agregar
      </button>
    </div>
  );
}

import { useState } from 'react';
import { useAlbumStore } from '../store/useAlbumStore';
import { parseQuickAdd } from '../lib/parseQuickAdd';

type Feedback = { tone: 'ok' | 'error' | 'mixed'; text: string };

export function QuickAddBar() {
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const bulkIncrement = useAlbumStore((s) => s.bulkIncrement);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    const { valid, invalid } = parseQuickAdd(trimmed);
    if (valid.length > 0) bulkIncrement(valid);

    if (valid.length > 0 && invalid.length === 0) {
      setFeedback({
        tone: 'ok',
        text: `+${valid.length} ${valid.length === 1 ? 'estampa añadida' : 'estampas añadidas'}`,
      });
    } else if (valid.length > 0 && invalid.length > 0) {
      setFeedback({
        tone: 'mixed',
        text: `+${valid.length} añadidas · ${invalid.length} inválidas (${invalid.slice(0, 5).join(', ')}${invalid.length > 5 ? '…' : ''})`,
      });
    } else {
      setFeedback({
        tone: 'error',
        text: `Sin códigos válidos: ${invalid.slice(0, 5).join(', ')}${invalid.length > 5 ? '…' : ''}`,
      });
    }
    setValue('');
    window.setTimeout(() => setFeedback(null), 3500);
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
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
          placeholder="Pegar códigos del sobre: MEX1 USA7 BRA15..."
          className="flex-1 min-h-[44px] px-4 rounded-xl bg-surface border border-border text-base focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-muted"
          aria-label="Entrada rápida de códigos de estampas"
        />
        <button
          type="button"
          onClick={submit}
          className="min-h-[44px] px-5 rounded-xl bg-accent text-white font-medium hover:opacity-90 active:opacity-80 transition-opacity"
        >
          Añadir
        </button>
      </div>
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`text-xs px-1 ${
            feedback.tone === 'ok'
              ? 'text-have'
              : feedback.tone === 'error'
                ? 'text-accent'
                : 'text-duplicate'
          }`}
        >
          {feedback.text}
        </div>
      )}
    </div>
  );
}

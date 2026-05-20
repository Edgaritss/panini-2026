import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAlbumStore } from '../store/useAlbumStore';
import { useCompareHistory } from '../store/useCompareHistory';
import {
  parseTradesList,
  type ParsedList,
} from '../lib/parseTradesList';
import {
  calculateTradeMatches,
  type TradeMatches,
} from '../lib/calculateTradeMatches';
import { buildShareText, buildWhatsAppUrl } from '../lib/generateShareText';
import { formatTradesList, type FormatBucket } from '../lib/formatTradesList';
import { sections, stickersBySection } from '../data/album';
import { Icon } from '../components/Icon';

type Step = 'input' | 'processing' | 'result';

export function Comparar() {
  const counts = useAlbumStore((s) => s.counts);
  const historyEntries = useCompareHistory((s) => s.entries);
  const addHistory = useCompareHistory((s) => s.add);
  const removeHistory = useCompareHistory((s) => s.remove);
  const clearHistory = useCompareHistory((s) => s.clear);

  const [text, setText] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [resolvedKind, setResolvedKind] = useState<'missing' | 'duplicates'>(
    'missing',
  );
  const [matches, setMatches] = useState<TradeMatches | null>(null);
  const [canPaste, setCanPaste] = useState(false);
  const [copied, setCopied] = useState(false);

  // Detect clipboard read capability once
  useEffect(() => {
    setCanPaste(
      typeof navigator !== 'undefined' &&
        typeof navigator.clipboard?.readText === 'function',
    );
  }, []);

  const parsed = useMemo<ParsedList>(() => parseTradesList(text), [text]);
  const stickerCount = parsed.stickers.size;

  // Sync the resolved type from the parsed kind when it's unambiguous.
  useEffect(() => {
    if (parsed.kind !== 'unknown') {
      setResolvedKind(parsed.kind);
    }
  }, [parsed.kind]);

  async function handlePaste() {
    try {
      const fromClipboard = await navigator.clipboard.readText();
      if (fromClipboard) setText(fromClipboard);
    } catch {
      // Permissions denied or unsupported — ignore silently.
    }
  }

  function handleCompare() {
    if (stickerCount === 0) return;
    setStep('processing');
    // Theatrical 1.1s processing (cosmetic — compute is instant).
    window.setTimeout(() => {
      const result = calculateTradeMatches({
        myCounts: counts,
        theirStickers: parsed.stickers,
        theirListKind: resolvedKind,
      });
      setMatches(result);
      addHistory({
        kind: parsed.kind,
        source: parsed.source,
        pasteTotal: result.pasteTotal,
        matchedTotal: result.totalMatched,
        rawText: text,
        resolvedKind,
      });
      setStep('result');
    }, 1100);
  }

  function reset() {
    setText('');
    setMatches(null);
    setStep('input');
  }

  function loadFromHistory(entry: { rawText: string; resolvedKind: 'missing' | 'duplicates' }) {
    setText(entry.rawText);
    setResolvedKind(entry.resolvedKind);
    setStep('input');
    setMatches(null);
  }

  async function copyShareText() {
    if (!matches) return;
    const out = buildShareText(matches);
    try {
      await navigator.clipboard.writeText(out);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = out;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(ta);
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function copyOwnList(kind: 'missing' | 'duplicates') {
    const own = buildOwnFullList(counts, kind);
    try {
      await navigator.clipboard.writeText(own);
    } catch {
      // ignore
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-display-l text-on-surface flex items-center gap-3">
          <Icon name="swap_horiz" size={32} />
          Comparador de Intercambios
        </h1>
        <p className="text-body text-on-surface-variant mt-1">
          Pega la lista que te mandó otro coleccionista para descubrir qué
          pueden intercambiar.
        </p>
      </div>

      {step === 'input' && (
        <InputStep
          text={text}
          setText={setText}
          parsed={parsed}
          resolvedKind={resolvedKind}
          setResolvedKind={setResolvedKind}
          canPaste={canPaste}
          onPaste={handlePaste}
          onCompare={handleCompare}
          historyEntries={historyEntries}
          loadFromHistory={loadFromHistory}
          removeHistory={removeHistory}
          clearHistory={clearHistory}
        />
      )}

      {step === 'processing' && <ProcessingStep total={stickerCount} />}

      {step === 'result' && matches && (
        <ResultStep
          matches={matches}
          parsed={parsed}
          resolvedKind={resolvedKind}
          onReset={reset}
          copied={copied}
          onCopyShare={copyShareText}
          onCopyOwnList={copyOwnList}
        />
      )}
    </div>
  );
}

// --- Input step --------------------------------------------------------------

interface InputStepProps {
  text: string;
  setText: (v: string) => void;
  parsed: ParsedList;
  resolvedKind: 'missing' | 'duplicates';
  setResolvedKind: (k: 'missing' | 'duplicates') => void;
  canPaste: boolean;
  onPaste: () => void;
  onCompare: () => void;
  historyEntries: ReturnType<typeof useCompareHistory.getState>['entries'];
  loadFromHistory: (entry: { rawText: string; resolvedKind: 'missing' | 'duplicates' }) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
}

function InputStep({
  text,
  setText,
  parsed,
  resolvedKind,
  setResolvedKind,
  canPaste,
  onPaste,
  onCompare,
  historyEntries,
  loadFromHistory,
  removeHistory,
  clearHistory,
}: InputStepProps) {
  const hasContent = text.trim().length > 0;
  const stickerCount = parsed.stickers.size;
  const canCompare = stickerCount > 0;

  return (
    <>
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 md:p-6">
        <h2 className="text-heading text-on-surface mb-3">¿Cómo funciona?</h2>
        <ol className="space-y-3 text-body text-on-surface">
          <Step n="1">
            El otro coleccionista abre su app y va a <strong>Cambios → Copiar lista</strong>{' '}
            (faltantes o repetidas).
          </Step>
          <Step n="2">Te manda el texto por WhatsApp.</Step>
          <Step n="3">
            Pegas el texto aquí abajo. La app calcula automáticamente qué
            pueden intercambiar.
          </Step>
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <label
          htmlFor="compare-textarea"
          className="text-body-strong text-on-surface"
        >
          Pega aquí la lista que te enviaron
        </label>
        <textarea
          id="compare-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Pega aquí el texto generado por la app del otro coleccionista…"
          rows={10}
          className="w-full font-mono text-small p-4 rounded-lg bg-surface-container border border-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary text-on-surface placeholder:text-on-surface-variant resize-y min-h-[180px]"
        />

        <ValidationBanner parsed={parsed} hasContent={hasContent} />

        {parsed.kind === 'unknown' && stickerCount > 0 && (
          <div className="bg-surface-container rounded-lg border border-outline-variant p-4 space-y-3">
            <p className="text-body text-on-surface">
              No pude detectar automáticamente qué tipo de lista es. ¿Qué
              representa este texto?
            </p>
            <div className="flex flex-col gap-2">
              <RadioRow
                checked={resolvedKind === 'missing'}
                onChange={() => setResolvedKind('missing')}
                label="Lo que le falta a esa persona"
              />
              <RadioRow
                checked={resolvedKind === 'duplicates'}
                onChange={() => setResolvedKind('duplicates')}
                label="Lo que esa persona tiene repetido"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          {canPaste && (
            <button
              type="button"
              onClick={onPaste}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
            >
              <Icon name="content_paste" size={18} />
              Pegar del portapapeles
            </button>
          )}
          <button
            type="button"
            onClick={onCompare}
            disabled={!canCompare}
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-secondary text-on-secondary text-body-strong hover:bg-secondary-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed sm:ml-auto"
          >
            Comparar
            {canCompare ? ` ${stickerCount} ${stickerCount === 1 ? 'estampa' : 'estampas'}` : ''}
            <Icon name="arrow_forward" size={18} />
          </button>
        </div>
      </section>

      {historyEntries.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-caps text-on-surface-variant uppercase">
              Comparaciones recientes
            </h3>
            <button
              type="button"
              onClick={clearHistory}
              className="text-small text-on-surface-variant hover:text-on-surface underline-offset-2 hover:underline"
            >
              Eliminar historial
            </button>
          </div>
          <ul className="bg-surface-container-lowest rounded-xl border border-outline-variant divide-y divide-outline-variant overflow-hidden">
            {historyEntries.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors"
              >
                <button
                  type="button"
                  onClick={() =>
                    loadFromHistory({
                      rawText: e.rawText,
                      resolvedKind: e.resolvedKind,
                    })
                  }
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-body text-on-surface truncate">
                    {humanizeAgo(e.at)} —{' '}
                    {e.resolvedKind === 'missing'
                      ? 'Lista de faltantes'
                      : 'Lista de repetidas'}{' '}
                    ({e.pasteTotal} estampas)
                  </p>
                  <p className="text-small text-on-surface-variant">
                    {e.matchedTotal === 0
                      ? 'Sin coincidencias'
                      : `${e.matchedTotal} ${e.matchedTotal === 1 ? 'coincidencia' : 'coincidencias'}`}
                    {e.source === 'permissive' ? ' · modo permisivo' : ''}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => removeHistory(e.id)}
                  aria-label="Eliminar de historial"
                  className="h-8 w-8 inline-flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
                >
                  <Icon name="close" size={16} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function ValidationBanner({
  parsed,
  hasContent,
}: {
  parsed: ParsedList;
  hasContent: boolean;
}) {
  if (!hasContent) return null;
  const total = parsed.stickers.size;

  if (parsed.source === 'app' && parsed.kind !== 'unknown') {
    const label =
      parsed.kind === 'missing'
        ? 'Lista de FALTANTES'
        : 'Lista de REPETIDAS';
    return (
      <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-owned/10 border border-owned/30 text-small text-on-surface">
        <Icon name="check_circle" size={18} className="text-owned shrink-0 mt-0.5" />
        <span>
          Detectado: {label} · {total}{' '}
          {total === 1 ? 'estampa' : 'estampas'} · formato válido.
        </span>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-secondary-fixed border border-secondary/30 text-small text-on-secondary-fixed-variant">
        <Icon name="error" size={18} className="text-secondary shrink-0 mt-0.5" />
        <span>No se detectaron códigos válidos en el texto pegado.</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-duplicate/10 border border-duplicate/30 text-small text-on-surface">
      <Icon name="info" size={18} className="text-duplicate shrink-0 mt-0.5" />
      <span>
        Este texto no parece haber sido generado por la app, pero pude
        rescatar {total} {total === 1 ? 'código' : 'códigos'}. Para resultados
        más confiables, pídele que copie su lista desde Cambios → Copiar lista.
      </span>
    </div>
  );
}

// --- Processing step --------------------------------------------------------

function ProcessingStep({ total }: { total: number }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      i = Math.min(100, i + 8);
      setPct(i);
    }, 80);
    return () => window.clearInterval(id);
  }, []);
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-10 flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-heading text-on-surface">
        <Icon name="bolt" size={24} className="text-secondary" />
        Calculando intercambios…
      </div>
      <p className="text-body text-on-surface-variant">
        Comparando {total} {total === 1 ? 'estampa' : 'estampas'} contra tu álbum.
      </p>
      <div className="w-full max-w-md h-2 bg-surface-container rounded-full overflow-hidden">
        <div
          className="h-full bg-secondary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  );
}

// --- Result step -------------------------------------------------------------

interface ResultStepProps {
  matches: TradeMatches;
  parsed: ParsedList;
  resolvedKind: 'missing' | 'duplicates';
  onReset: () => void;
  copied: boolean;
  onCopyShare: () => void;
  onCopyOwnList: (kind: 'missing' | 'duplicates') => void;
}

function ResultStep({
  matches,
  parsed,
  resolvedKind,
  onReset,
  copied,
  onCopyShare,
  onCopyOwnList,
}: ResultStepProps) {
  const hasMatches = matches.totalMatched > 0;
  const giveMode = matches.kind === 'i-give';

  if (!hasMatches) {
    return (
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 md:p-8 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">😅</span>
          <div>
            <h2 className="text-heading text-on-surface">Sin coincidencias</h2>
            <p className="text-body text-on-surface-variant mt-1">
              {giveMode
                ? `Ninguna de las ${matches.pasteTotal} estampas que le faltan está en tus repetidas.`
                : `Ninguna de las ${matches.pasteTotal} que tiene de sobra te hace falta.`}
            </p>
          </div>
        </div>
        <ul className="list-disc list-inside text-body text-on-surface-variant space-y-1 pl-1">
          {giveMode ? (
            <>
              <li>
                Pídele su lista de <strong>REPETIDAS</strong> para ver si tiene
                lo que tú necesitas.
              </li>
              <li>
                Comparte tu lista de faltantes para que vea si te puede ayudar.
              </li>
            </>
          ) : (
            <>
              <li>
                Pídele su lista de <strong>FALTANTES</strong> para ver si tú
                puedes ayudarle.
              </li>
              <li>
                Comparte tu lista de repetidas con esa persona u otros.
              </li>
            </>
          )}
        </ul>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onCopyOwnList(giveMode ? 'missing' : 'duplicates')}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container text-small"
          >
            <Icon name="content_copy" size={16} />
            Copiar mi lista de {giveMode ? 'faltantes' : 'repetidas'}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high text-small"
          >
            <Icon name="restart_alt" size={16} />
            Pegar otra lista
          </button>
        </div>
      </section>
    );
  }

  const title = giveMode
    ? `🎉 ¡Le puedes regalar ${matches.totalMatched} ${matches.totalMatched === 1 ? 'estampa' : 'estampas'}!`
    : `💝 ¡Te puede dar ${matches.totalMatched} ${matches.totalMatched === 1 ? 'estampa' : 'estampas'}!`;
  const subtitle = giveMode
    ? `De las ${matches.pasteTotal} que le faltan, tú tienes ${matches.totalMatched} como repetidas.`
    : `De las ${matches.pasteTotal} que tiene de sobra, tú necesitas ${matches.totalMatched}.`;
  const sectionTitle = giveMode ? 'Lo que le puedes dar' : 'Pídele estas';

  const whatsappUrl = buildWhatsAppUrl(buildShareText(matches));

  return (
    <section className="space-y-5">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
        <h2 className="text-heading text-on-surface">{title}</h2>
        <p className="text-body text-on-surface-variant mt-1">{subtitle}</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-5">
        <h3 className="text-body-strong text-on-surface flex items-center gap-2">
          <Icon
            name={giveMode ? 'card_giftcard' : 'inbox'}
            size={20}
            className="text-secondary"
          />
          {sectionTitle}
        </h3>
        <div className="space-y-4 max-h-[55vh] overflow-y-auto">
          {matches.buckets.map((b) => (
            <div key={b.code}>
              <p className="text-caps text-on-surface-variant uppercase mb-2">
                {b.code} · {b.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {b.items.map((it) => (
                  <span
                    key={it.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-mono-code ${
                      giveMode
                        ? 'bg-secondary-fixed border border-error-container text-on-secondary-fixed-variant'
                        : 'bg-surface-container border border-outline-variant text-on-surface'
                    }`}
                  >
                    {it.id}
                    {it.count > 1 && (
                      <span className="text-small opacity-80">×{it.count}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant">
          <button
            type="button"
            onClick={onCopyShare}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-secondary text-on-secondary hover:bg-secondary-container text-body-strong text-small"
          >
            <Icon name={copied ? 'check' : 'content_copy'} size={16} />
            {copied ? '¡Copiado!' : 'Copiar esta lista'}
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container text-body-strong text-small"
          >
            <Icon name="ios_share" size={16} />
            Mandar por WhatsApp
          </a>
        </div>
      </div>

      <div className="bg-duplicate/5 border border-duplicate/30 rounded-xl p-5">
        <p className="text-body-strong text-on-surface flex items-center gap-2">
          <Icon name="lightbulb" size={18} className="text-duplicate" />
          Sugerencia
        </p>
        <p className="text-body text-on-surface-variant mt-1">
          {giveMode
            ? 'Pídele que te mande también su lista de REPETIDAS para encontrar intercambios mutuos. Así no solo le regalas, sino que recibes lo que necesitas.'
            : 'Para que el intercambio sea justo, mándale también tu lista de REPETIDAS — quizás necesita algunas de las tuyas.'}
        </p>
        <button
          type="button"
          onClick={() =>
            onCopyOwnList(giveMode ? 'missing' : 'duplicates')
          }
          className="mt-3 inline-flex items-center gap-2 px-3 h-9 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high text-small"
        >
          <Icon name="content_copy" size={14} />
          Copiar mi lista de {giveMode ? 'faltantes' : 'repetidas'} para mandarle
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high text-small"
        >
          <Icon name="restart_alt" size={16} />
          Pegar otra lista
        </button>
        <Link
          to="/cambios"
          className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container text-small"
        >
          <Icon name="arrow_back" size={16} />
          Volver a Cambios
        </Link>
      </div>

      {/* Hidden but accessible context, used by tests / future analytics */}
      <p className="sr-only">
        Fuente: {parsed.source}. Tipo resuelto: {resolvedKind}.
      </p>
    </section>
  );
}

// --- Helpers -----------------------------------------------------------------

function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-on-secondary text-small font-body-strong">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

function RadioRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 accent-secondary"
      />
      <span className="text-body text-on-surface">{label}</span>
    </label>
  );
}

function humanizeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Justo ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 30) return `Hace ${days} días`;
  return new Date(ms).toLocaleDateString();
}

function buildOwnFullList(
  counts: Record<string, number>,
  kind: 'missing' | 'duplicates',
): string {
  const buckets: FormatBucket[] = [];
  let total = 0;
  for (const section of sections) {
    const all = stickersBySection.get(section.code) ?? [];
    const items: { id: string; count: number }[] = [];
    if (kind === 'missing') {
      for (const st of all) {
        if ((counts[st.id] ?? 0) === 0) items.push({ id: st.id, count: 1 });
      }
      if (items.length === 0) continue;
      total += items.length;
    } else {
      for (const st of all) {
        const c = counts[st.id] ?? 0;
        if (c >= 2) {
          const extras = c - 1;
          items.push({ id: st.id, count: extras });
          total += extras;
        }
      }
      if (items.length === 0) continue;
    }
    buckets.push({ code: section.code, name: section.name, items });
  }
  return formatTradesList({ kind, buckets, total });
}

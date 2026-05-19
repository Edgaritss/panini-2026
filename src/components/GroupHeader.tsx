interface Props {
  label: string;
  caption?: string;
}

export function GroupHeader({ label, caption }: Props) {
  return (
    <header className="flex items-baseline justify-between gap-3 mt-10 mb-5 first:mt-0">
      <h2 className="text-caps text-on-surface-variant uppercase tracking-widest">
        {label}
      </h2>
      {caption && (
        <span className="text-small text-on-surface-variant/70">{caption}</span>
      )}
      <div className="flex-1 h-px bg-outline-variant" aria-hidden />
    </header>
  );
}

import { flagCode } from '../data/flagCodes';

interface Props {
  code: string;
  size?: number;
  className?: string;
}

export function FlagCircle({ code, size = 28, className = '' }: Props) {
  const iso = flagCode[code];
  const style = { width: size, height: size };

  if (!iso) {
    return (
      <span
        aria-hidden
        style={style}
        className={`inline-flex items-center justify-center rounded-full bg-surface-container border border-outline-variant text-on-surface-variant text-[10px] font-semibold ${className}`}
      >
        {code.slice(0, 2)}
      </span>
    );
  }

  return (
    <span
      aria-hidden
      style={style}
      className={`fi fi-${iso} fis inline-block rounded-full border border-outline-variant shrink-0 ${className}`}
    />
  );
}

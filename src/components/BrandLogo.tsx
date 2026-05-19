interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  decorative?: boolean;
}

const SIZE_PX: Record<NonNullable<Props['size']>, number> = {
  sm: 28,
  md: 40,
  lg: 96,
  xl: 160,
};

export function BrandLogo({ size = 'md', className = '', decorative = false }: Props) {
  const px = SIZE_PX[size];
  return (
    <img
      src="/brand/logo.png"
      alt={decorative ? '' : "Collect '26"}
      aria-hidden={decorative || undefined}
      width={px}
      height={px}
      loading="eager"
      decoding="async"
      className={`inline-block select-none ${className}`}
      style={{ width: px, height: px }}
      draggable={false}
    />
  );
}

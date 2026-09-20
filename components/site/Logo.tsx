import Image from "next/image";

// Intrinsic size of public/brand/logo.png (the cropped, transparent-background logo).
const LOGO_WIDTH = 156;
const LOGO_HEIGHT = 176;

/**
 * The site logo. `size` is the displayed height in pixels; the width follows
 * the artwork's proportions. It sits next to the wordmark, which already says
 * the name in text, so the image itself is decorative.
 */
export function LogoMark({
  size = 38,
  className = "",
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const width = Math.round((size * LOGO_WIDTH) / LOGO_HEIGHT);
  return (
    <Image
      src="/brand/logo.png"
      alt=""
      width={width}
      height={size}
      priority={priority}
      // Already a small, pre-sized file: serve it as-is so it stays sharp on retina screens.
      unoptimized
      aria-hidden="true"
      className={`shrink-0 select-none ${className}`}
      draggable={false}
    />
  );
}

export function Wordmark({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-[-0.01em] ${className}`}>{name}</span>
  );
}

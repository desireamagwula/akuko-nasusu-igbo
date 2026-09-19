/**
 * The mark: a solid oxblood square holding the dotted "ụ" from the name.
 * A square, because nothing on this site is round.
 */
export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <rect width="32" height="32" fill="#A4161A" />
      {/* the letter u, built from strokes so it renders without any font */}
      <path
        d="M9.5 8.5v9.2c0 3 2.2 5 5.2 5h2.6c3 0 5.2-2 5.2-5V8.5"
        fill="none"
        stroke="#F6F2EA"
        strokeWidth="2.6"
        strokeLinecap="butt"
      />
      <path d="M22.5 8.5v13.8" fill="none" stroke="#F6F2EA" strokeWidth="2.6" />
      {/* the dot beneath, which is what makes it Igbo */}
      <rect x="14.2" y="26" width="3.6" height="3.6" fill="#F6F2EA" />
    </svg>
  );
}

export function Wordmark({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-[-0.01em] ${className}`}>{name}</span>
  );
}

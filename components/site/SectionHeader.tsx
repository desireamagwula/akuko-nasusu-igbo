import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Newspaper section head: a hairline rule with a short red tab, then the title. */
export function SectionHeader({
  title,
  eyebrow,
  href,
  hrefLabel,
}: {
  title: string;
  eyebrow?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="relative mb-8 flex items-end justify-between gap-6 border-t border-hairline pt-5 md:mb-10">
      <span aria-hidden="true" className="absolute -top-px left-0 h-[2px] w-10 bg-oxblood" />
      <div>
        {eyebrow && <p className="meta mb-1.5 uppercase tracking-[0.14em]">{eyebrow}</p>}
        <h2 className="font-display text-[1.625rem] font-semibold leading-none tracking-[-0.015em] md:text-[2rem]">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 pb-0.5 text-[0.875rem] hover:text-oxblood">
          <span className="u-draw">{hrefLabel ?? "See all"}</span>
          <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

/** Page title block for index pages (Videos, Blog, About). */
export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <header className="border-b border-hairline pb-8 pt-12 md:pb-10 md:pt-16">
      <p className="kicker">{eyebrow}</p>
      <h1 className="mt-4 max-w-[18ch] font-display text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.02em] text-balance md:text-[4rem]">
        {title}
      </h1>
      {description && (
        <p className="mt-5 max-w-xl font-body text-[1.125rem] leading-relaxed text-muted md:text-[1.25rem]">{description}</p>
      )}
    </header>
  );
}

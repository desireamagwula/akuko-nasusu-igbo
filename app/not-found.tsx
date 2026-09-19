import Link from "next/link";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-[1240px] px-5 py-24 md:px-8 md:py-36">
        <p className="kicker">404</p>
        <h1 className="mt-4 max-w-[16ch] font-display text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.02em] text-balance md:text-[4.5rem]">
          We could not find that page.
        </h1>
        <p className="mt-6 max-w-lg font-body text-[1.25rem] leading-relaxed text-muted">
          The story may have been moved or unpublished. Try the latest articles or videos instead.
        </p>
        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-[0.9375rem]">
          <Link href="/" className="u-draw">Back to the front page</Link>
          <Link href="/blog" className="u-draw">Read the blog</Link>
          <Link href="/videos" className="u-draw">Watch videos</Link>
        </div>
      </div>
    </SiteShell>
  );
}

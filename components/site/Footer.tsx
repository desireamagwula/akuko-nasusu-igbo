import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NAV_LINKS } from "@/lib/site";
import { LogoMark, Wordmark } from "./Logo";

export function Footer({ siteName, facebookUrl }: { siteName: string; facebookUrl: string | null }) {
  return (
    <footer className="on-dark mt-24 bg-ink-deep text-paper md:mt-32">
      <div className="mx-auto max-w-[1240px] px-5 pb-10 pt-14 md:px-8 md:pt-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-6">
            <div className="flex items-center gap-3">
              <LogoMark size={36} />
              <Wordmark name={siteName} className="text-[1.375rem] leading-none" />
            </div>
            <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-paper/70">
              News, culture, sport and entertainment, reported in Igbo and in English.
            </p>
          </div>

          <nav aria-label="Footer" className="md:col-span-3">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-paper/50">Sections</p>
            <ul className="mt-4 space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="u-draw text-[0.9375rem] text-paper/85 hover:text-paper">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {facebookUrl && (
            <div className="md:col-span-3">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-paper/50">Follow</p>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="u-draw mt-4 inline-flex items-center gap-1.5 text-[0.9375rem] text-paper/85 hover:text-paper"
              >
                Facebook page <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden="true" />
              </a>
            </div>
          )}
        </div>

        <div className="mt-14 border-t border-paper/10 pt-6 text-[0.8125rem] text-paper/50">
          &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

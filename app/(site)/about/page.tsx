import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { getSettings } from "@/lib/data";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { aboutText, siteName } = await getSettings();
  const first = aboutText.split(/\n{2,}/)[0] ?? "";
  return {
    title: "About",
    description: first.length > 160 ? `${first.slice(0, 157).trimEnd()}...` : first,
    alternates: { canonical: "/about" },
    openGraph: { title: `About ${siteName}`, url: "/about" },
  };
}

export default async function AboutPage() {
  const { aboutText, siteName, facebookUrl } = await getSettings();
  const paragraphs = aboutText.split(/\n{2,}/).map((text) => text.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-8 md:px-8">
      <header className="border-b border-hairline pb-10 pt-12 md:pb-14 md:pt-20">
        <p className="kicker">About</p>
        <h1 className="mt-5 max-w-[14ch] font-display text-[3rem] font-semibold leading-[1] tracking-[-0.025em] text-balance md:text-[5.5rem]">
          {siteName}
        </h1>
      </header>

      <div className="grid gap-10 pt-10 md:grid-cols-12 md:pt-14">
        <div className="md:col-span-8 md:col-start-5">
          <div className="prose-akuko">
            {paragraphs.map((text, i) => (
              <p key={i} className={i === 0 ? "text-[1.3125rem] leading-[1.55] md:text-[1.5rem]" : undefined}>
                {text}
              </p>
            ))}
          </div>

          {facebookUrl && (
            <p className="mt-12 border-t border-hairline pt-6">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 text-[0.9375rem]"
              >
                <span className="u-draw">Follow us on Facebook</span>
                <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden="true" />
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

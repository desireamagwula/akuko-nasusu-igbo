export { DEFAULT_SITE_NAME, DEFAULT_ABOUT } from "@/convex/lib/defaults";

/** Canonical origin for metadata, sitemap and robots. No trailing slash. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "http://localhost:3000"
).replace(/\/+$/, "");

export const SITE_DESCRIPTION =
  "Video reports, interviews and written stories on news, culture, sport and entertainment, in Igbo and in English.";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/videos", label: "Videos" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
] as const;

/** The four kickers we design around. Categories themselves are free text. */
export const SAMPLE_CATEGORIES = ["Akụkọ Ọhụrụ", "Omenala", "Egwuregwu", "Nkiri"] as const;

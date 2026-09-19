import type { Metadata, Viewport } from "next";
import { Fraunces, Newsreader } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { getSettings } from "@/lib/data";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site";
import "./globals.css";

// `vietnamese` is not optional: it is the subset that contains the dotted
// Igbo vowels (ụ, ọ, ị). Without it those letters fall back to a system font.
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

const newsreader = Newsreader({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-newsreader",
  display: "swap",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: siteName, template: `%s | ${siteName}` },
    description: SITE_DESCRIPTION,
    applicationName: siteName,
    openGraph: {
      siteName,
      type: "website",
      locale: "en_GB",
      title: siteName,
      description: SITE_DESCRIPTION,
    },
    twitter: { card: "summary_large_image", title: siteName, description: SITE_DESCRIPTION },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = {
  themeColor: "#17130F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${newsreader.variable} ${GeistSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}

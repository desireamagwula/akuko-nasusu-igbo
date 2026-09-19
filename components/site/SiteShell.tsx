import { getSettings } from "@/lib/data";
import { Footer } from "./Footer";
import { Masthead } from "./Masthead";

/** Masthead + main + footer. Shared by the (site) routes and the 404 page. */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-paper focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <Masthead siteName={settings.siteName} />
      <main id="main" className="pt-14 md:pt-[68px]">
        {children}
      </main>
      <Footer siteName={settings.siteName} facebookUrl={settings.facebookUrl} />
    </>
  );
}

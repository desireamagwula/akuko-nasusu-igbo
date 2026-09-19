"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { ExternalLink, FilePlus2, LogOut, Newspaper, SlidersHorizontal } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { LogoMark } from "@/components/site/Logo";
import { useUnsavedGuard } from "@/components/admin/UnsavedGuard";

const NAV = [
  { href: "/admin", label: "Posts", icon: Newspaper, match: (p: string) => p === "/admin" || (p.startsWith("/admin/posts/") && p !== "/admin/posts/new") },
  { href: "/admin/posts/new", label: "New post", icon: FilePlus2, match: (p: string) => p === "/admin/posts/new" },
  { href: "/admin/settings", label: "Settings", icon: SlidersHorizontal, match: (p: string) => p === "/admin/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const { guard } = useUnsavedGuard();
  const router = useRouter();
  const pathname = usePathname();
  const settings = useQuery(api.settings.get);

  // The proxy already redirects signed-out visitors; this covers a session that expires mid-visit.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/admin/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper" aria-busy="true" aria-label="Loading">
        <div className="skeleton h-3 w-40" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="on-dark bg-ink text-paper lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <div className="flex items-center gap-3 px-5 pt-4 lg:px-6 lg:pt-7">
          <LogoMark size={26} />
          <div className="min-w-0">
            <p className="font-display text-[1.125rem] font-semibold leading-none tracking-[-0.01em]">Newsroom</p>
            <p className="mt-1 truncate text-[0.75rem] text-paper/50">{settings?.siteName ?? " "}</p>
          </div>
        </div>

        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 pt-3 lg:mt-8 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-3">
          {NAV.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-11 shrink-0 items-center gap-3 border-l-2 px-3 text-[0.9375rem] transition-colors ${
                  active ? "border-oxblood bg-paper/10 text-paper" : "border-transparent text-paper/70 hover:bg-paper/5 hover:text-paper"
                }`}
              >
                <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-paper/10 p-3 lg:block">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center gap-3 px-3 text-[0.9375rem] text-paper/70 hover:text-paper"
          >
            <ExternalLink size={18} strokeWidth={1.5} aria-hidden="true" />
            View site
          </a>
          <button
            type="button"
            onClick={() =>
              guard(async () => {
                await signOut();
                router.replace("/admin/login");
              })
            }
            className="flex h-11 w-full items-center gap-3 px-3 text-left text-[0.9375rem] text-paper/70 hover:text-paper"
          >
            <LogOut size={18} strokeWidth={1.5} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Below the sidebar breakpoint the two utility actions sit in a slim bar. */}
        <div className="flex items-center justify-end gap-5 border-b border-hairline px-5 py-2 text-[0.8125rem] lg:hidden">
          <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted hover:text-ink">
            <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" /> View site
          </a>
          <button
            type="button"
            onClick={() =>
              guard(async () => {
                await signOut();
                router.replace("/admin/login");
              })
            }
            className="inline-flex items-center gap-1.5 text-muted hover:text-ink"
          >
            <LogOut size={14} strokeWidth={1.5} aria-hidden="true" /> Sign out
          </button>
        </div>
        <main className="mx-auto max-w-[1180px] px-5 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}

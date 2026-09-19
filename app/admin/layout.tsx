import type { Metadata } from "next";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "@/components/admin/ConvexClientProvider";
import { ToastProvider } from "@/components/admin/Toast";
import { UnsavedGuardProvider } from "@/components/admin/UnsavedGuard";

// The dashboard is private: keep it out of search results entirely.
export const metadata: Metadata = {
  title: { absolute: "Newsroom" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <ConvexClientProvider>
        <ToastProvider>
          <UnsavedGuardProvider>{children}</UnsavedGuardProvider>
        </ToastProvider>
      </ConvexClientProvider>
    </ConvexAuthNextjsServerProvider>
  );
}

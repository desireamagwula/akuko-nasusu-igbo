"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "./ui";

type Guard = {
  /** Forms call this whenever their dirty state changes. */
  setDirty: (dirty: boolean) => void;
  /** Runs `action` now, or after the user confirms leaving unsaved changes. */
  guard: (action: () => void) => void;
};

const GuardContext = createContext<Guard>({ setDirty: () => {}, guard: (action) => action() });
export const useUnsavedGuard = () => useContext(GuardContext);

/**
 * Stops the admin losing work by accident. It covers closing or reloading the
 * tab (beforeunload) and every in-app link click, including the sidebar.
 * The browser's own Back button inside the app cannot be intercepted by a
 * Next.js app, so that case is not covered.
 */
export function UnsavedGuardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dirty = useRef(false);
  const [pending, setPending] = useState<(() => void) | null>(null);

  const setDirty = useCallback((value: boolean) => {
    dirty.current = value;
  }, []);

  const guard = useCallback((action: () => void) => {
    if (dirty.current) setPending(() => action);
    else action();
  }, []);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const onClick = (event: MouseEvent) => {
      if (!dirty.current || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      event.stopPropagation();
      setPending(() => () => router.push(url.pathname + url.search + url.hash));
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("click", onClick, true);
    };
  }, [router]);

  return (
    <GuardContext.Provider value={{ setDirty, guard }}>
      {children}
      <ConfirmDialog
        open={pending !== null}
        title="Leave without saving?"
        confirmLabel="Leave"
        cancelLabel="Keep editing"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const action = pending;
          dirty.current = false;
          setPending(null);
          action?.();
        }}
      >
        You have changes that have not been saved. If you leave now they will be lost.
      </ConfirmDialog>
    </GuardContext.Provider>
  );
}

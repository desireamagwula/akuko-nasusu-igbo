"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Link2 } from "lucide-react";

/** A slim bar at the very top of the viewport showing how far through the article you are. */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target || !bar.current) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = target.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const done = Math.min(1, Math.max(0, (window.innerHeight * 0.2 - rect.top) / Math.max(total, 1)));
      if (bar.current) bar.current.style.transform = `scaleX(${done})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [targetId]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]"
    >
      <div ref={bar} className="h-full origin-left bg-oxblood" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}

/** Copy-link share control. No third-party share widgets. */
export function CopyLink() {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    const url = window.location.href.split("#")[0];
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      // Clipboard API can be blocked; fall back to a temporary textarea.
      const area = document.createElement("textarea");
      area.value = url;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      setState(ok ? "copied" : "failed");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2200);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="group inline-flex h-10 items-center gap-2 border border-hairline px-3.5 text-[0.8125rem] transition-colors duration-200 hover:border-ink"
    >
      {state === "copied" ? (
        <Check size={15} strokeWidth={1.5} aria-hidden="true" />
      ) : (
        <Link2 size={15} strokeWidth={1.5} aria-hidden="true" />
      )}
      <span>{state === "copied" ? "Link copied" : state === "failed" ? "Copy failed" : "Copy link"}</span>
      <span role="status" className="sr-only">
        {state === "copied" ? "Link copied to clipboard" : ""}
      </span>
    </button>
  );
}

/** Appears once you have scrolled a screen or so. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0 })}
      className={`fixed bottom-5 right-5 z-40 grid h-11 w-11 place-items-center border border-ink bg-paper transition-[opacity,transform] duration-300 hover:bg-ink hover:text-paper md:bottom-8 md:right-8 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <ArrowUp size={18} strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}

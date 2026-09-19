"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertCircle, Check, X } from "lucide-react";

type Tone = "success" | "error";
type ToastItem = { id: number; message: string; tone: Tone };

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((list) => list.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: Tone = "success") => {
      const id = next.current++;
      setItems((list) => [...list.slice(-2), { id, message, tone }]);
      timers.current.set(id, setTimeout(() => dismiss(id), tone === "error" ? 7000 : 3500));
    },
    [dismiss],
  );

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[80] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 border px-4 py-3 text-[0.875rem] shadow-[0_10px_28px_-14px_rgba(23,19,15,0.5)] sm:w-auto ${
              item.tone === "error" ? "border-oxblood bg-surface text-ink" : "border-ink bg-ink text-paper"
            }`}
          >
            {item.tone === "error" ? (
              <AlertCircle size={17} strokeWidth={1.5} className="mt-0.5 shrink-0 text-oxblood" aria-hidden="true" />
            ) : (
              <Check size={17} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden="true" />
            )}
            <span className="flex-1">{item.message}</span>
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(item.id)} className="-mr-1 opacity-70 hover:opacity-100">
              <X size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

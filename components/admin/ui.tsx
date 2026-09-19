"use client";

import { useEffect, useId, useRef } from "react";
import { ConvexError } from "convex/values";

/* Shared form styling. Sharp corners, hairline borders, ink on focus. */
export const inputClass =
  "block w-full border border-hairline bg-surface px-3.5 py-2.5 text-[0.9375rem] text-ink placeholder:text-muted/70 transition-colors duration-150 focus:border-ink disabled:opacity-50 aria-[invalid=true]:border-oxblood";

export const buttonClass = {
  primary:
    "inline-flex h-11 items-center justify-center gap-2 border border-ink bg-ink px-5 text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-paper transition-colors duration-150 hover:bg-ink-deep disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "inline-flex h-11 items-center justify-center gap-2 border border-hairline bg-surface px-5 text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-ink transition-colors duration-150 hover:border-ink disabled:cursor-not-allowed disabled:opacity-50",
  danger:
    "inline-flex h-11 items-center justify-center gap-2 border border-oxblood bg-oxblood px-5 text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-paper transition-colors duration-150 hover:bg-[#8a1216] disabled:cursor-not-allowed disabled:opacity-50",
} as const;

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[0.8125rem] font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} role="alert" className="mt-1.5 text-[0.8125rem] text-oxblood">
          {error}
        </p>
      ) : hint ? (
        <p className="meta mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}

/** Two- or three-way toggle, used for Video/Blog and Draft/Published. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex border border-hairline bg-surface p-0.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`h-10 min-w-24 px-4 text-[0.8125rem] font-medium uppercase tracking-[0.1em] transition-colors duration-150 ${
              active ? "bg-ink text-paper" : "text-ink hover:bg-paper"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function StatusBadge({ status }: { status: "draft" | "published" }) {
  return status === "published" ? (
    <span className="inline-flex items-center gap-1.5 border border-ink bg-ink px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-paper">
      <span aria-hidden="true" className="h-1.5 w-1.5 bg-paper" />
      Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 border border-dashed border-muted px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted">
      <span aria-hidden="true" className="h-1.5 w-1.5 border border-muted" />
      Draft
    </span>
  );
}

/** Native <dialog>: focus trapping, Escape and the backdrop come from the browser. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "default",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={(event) => {
        if (event.target === ref.current && !busy) onCancel();
      }}
      className="m-auto w-[min(92vw,440px)] border border-ink bg-surface p-0 text-ink"
    >
      <div className="p-6">
        <h2 id={titleId} className="font-display text-[1.375rem] font-semibold leading-tight tracking-[-0.01em]">
          {title}
        </h2>
        <div className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{children}</div>
      </div>
      <div className="flex justify-end gap-3 border-t border-hairline bg-paper px-6 py-4">
        <button type="button" autoFocus className={buttonClass.secondary} onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </button>
        <button type="button" className={tone === "danger" ? buttonClass.danger : buttonClass.primary} onClick={onConfirm} disabled={busy}>
          {busy ? "Working..." : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

/** Pulls a readable message and per-field errors out of whatever a Convex call threw. */
export function errorInfo(error: unknown): { message: string; fieldErrors: Record<string, string> } {
  if (error instanceof ConvexError) {
    const data = error.data as { message?: string; fieldErrors?: Record<string, string> } | string;
    if (typeof data === "string") return { message: data, fieldErrors: {} };
    return { message: data?.message ?? "Something went wrong.", fieldErrors: data?.fieldErrors ?? {} };
  }
  return { message: "Could not reach the server. Check your connection and try again.", fieldErrors: {} };
}

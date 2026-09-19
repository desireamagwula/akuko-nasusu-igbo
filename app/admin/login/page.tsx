"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { LogoMark } from "@/components/site/Logo";
import { Field } from "@/components/admin/ui";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(event.currentTarget);
    form.set("flow", "signIn");
    try {
      const result = await signIn("password", form);
      if (result.signingIn === false) {
        setError("Incorrect email or password.");
        setBusy(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      // Convex Auth reports every credential failure the same way on purpose.
      setError("Incorrect email or password.");
      setBusy(false);
    }
  }

  const dark =
    "block w-full border border-paper/20 bg-transparent px-3.5 py-3 text-[0.9375rem] text-paper placeholder:text-paper/40 transition-colors focus:border-paper aria-[invalid=true]:border-oxblood";

  return (
    <main className="on-dark grid min-h-dvh place-items-center bg-ink px-5 py-16 text-paper">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center gap-3">
          <LogoMark size={30} />
          <span className="font-display text-[1.375rem] font-semibold tracking-[-0.01em]">Newsroom</span>
        </div>
        <h1 className="mt-10 font-display text-[2rem] font-semibold leading-tight tracking-[-0.02em]">Sign in</h1>
        <p className="mt-2 text-[0.9375rem] text-paper/60">Private area for the editor.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
          <Field label="Email" htmlFor="email">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              autoFocus
              aria-invalid={error ? true : undefined}
              className={dark}
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-error" : undefined}
              className={dark}
            />
          </Field>

          {error && (
            <p id="login-error" role="alert" className="border-l-2 border-oxblood bg-paper/5 py-2 pl-3 text-[0.875rem] text-paper">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full border border-paper bg-paper text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-transparent hover:text-paper disabled:opacity-50"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}

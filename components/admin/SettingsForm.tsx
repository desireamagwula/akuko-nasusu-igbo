"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Save } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatDateShort } from "@/lib/format";
import { Field, buttonClass, errorInfo, inputClass } from "./ui";
import { useToast } from "./Toast";
import { useUnsavedGuard } from "./UnsavedGuard";

type FormState = { siteName: string; facebookUrl: string; aboutText: string; featuredPostId: string };

export function SettingsForm() {
  const settings = useQuery(api.settings.get);
  const posts = useQuery(api.posts.adminList);

  if (settings === undefined || posts === undefined) {
    return (
      <div aria-busy="true" aria-label="Loading settings" className="space-y-6">
        <div className="skeleton h-9 w-40" />
        <div className="skeleton h-12 w-full max-w-xl" />
        <div className="skeleton h-12 w-full max-w-xl" />
        <div className="skeleton h-64 w-full max-w-3xl" />
      </div>
    );
  }

  return (
    <Inner
      initial={{
        siteName: settings.siteName,
        facebookUrl: settings.facebookUrl ?? "",
        aboutText: settings.aboutText,
        featuredPostId: settings.featuredPostId ?? "",
      }}
      published={posts.filter((post) => post.status === "published")}
    />
  );
}

function Inner({
  initial,
  published,
}: {
  initial: FormState;
  published: { _id: Id<"posts">; title: string; type: "video" | "blog"; publishedAt: number }[];
}) {
  const save = useMutation(api.settings.save);
  const toast = useToast();
  const { setDirty } = useUnsavedGuard();

  const [state, setState] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(() => JSON.stringify(state) !== JSON.stringify(baseline), [state, baseline]);
  useEffect(() => {
    setDirty(dirty);
    return () => setDirty(false);
  }, [dirty, setDirty]);

  const submit = useCallback(async () => {
    if (saving) return;
    const found: Record<string, string> = {};
    if (!state.siteName.trim()) found.siteName = "The site needs a name.";
    setErrors(found);
    if (Object.keys(found).length) {
      toast("Please fix the highlighted fields.", "error");
      document.getElementById("siteName")?.focus();
      return;
    }
    setSaving(true);
    try {
      await save({
        siteName: state.siteName,
        aboutText: state.aboutText,
        facebookUrl: state.facebookUrl,
        featuredPostId: state.featuredPostId ? (state.featuredPostId as Id<"posts">) : undefined,
      });
      setBaseline(state);
      toast("Settings saved.");
    } catch (error) {
      const info = errorInfo(error);
      setErrors(info.fieldErrors);
      toast(info.message, "error");
    } finally {
      setSaving(false);
    }
  }, [state, saving, save, toast]);

  const submitRef = useRef(submit);
  submitRef.current = submit;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void submitRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setState((s) => ({ ...s, [key]: value }));

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2rem] font-semibold leading-none tracking-[-0.02em]">Settings</h1>
          <p className="meta mt-2" aria-live="polite">
            {dirty ? (
              <span className="inline-flex items-center gap-2 text-ink">
                <span aria-hidden="true" className="h-1.5 w-1.5 bg-oxblood" /> Unsaved changes
              </span>
            ) : (
              "All changes saved"
            )}
          </p>
        </div>
        <button type="submit" disabled={saving} className={buttonClass.primary}>
          <Save size={16} strokeWidth={1.5} aria-hidden="true" /> {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="mt-8 max-w-3xl space-y-10">
        <section className="space-y-6">
          <h2 className="border-b border-hairline pb-2 font-display text-[1.25rem] font-semibold">Site</h2>
          <Field label="Site name" htmlFor="siteName" error={errors.siteName} hint="Shown in the masthead, footer, browser tab and search results.">
            <input
              id="siteName"
              value={state.siteName}
              onChange={(event) => set("siteName", event.target.value)}
              aria-invalid={errors.siteName ? true : undefined}
              className={`${inputClass} font-display text-[1.25rem] font-semibold`}
            />
          </Field>
          <Field label="Facebook page address" htmlFor="facebookUrl" error={errors.facebookUrl} hint="Optional. Adds a Follow link to the footer and About page.">
            <input
              id="facebookUrl"
              type="url"
              inputMode="url"
              value={state.facebookUrl}
              onChange={(event) => set("facebookUrl", event.target.value)}
              placeholder="https://www.facebook.com/your-page"
              aria-invalid={errors.facebookUrl ? true : undefined}
              className={inputClass}
            />
          </Field>
        </section>

        <section className="space-y-6">
          <h2 className="border-b border-hairline pb-2 font-display text-[1.25rem] font-semibold">Homepage lead</h2>
          <Field
            label="Featured post"
            htmlFor="featuredPostId"
            error={errors.featuredPostId}
            hint="Pin a published post as the lead story. With none selected, the newest post leads."
          >
            <select id="featuredPostId" value={state.featuredPostId} onChange={(event) => set("featuredPostId", event.target.value)} className={inputClass}>
              <option value="">None (newest post leads)</option>
              {[...published]
                .sort((a, b) => b.publishedAt - a.publishedAt)
                .map((post) => (
                  <option key={post._id} value={post._id}>
                    {post.title} ({post.type === "video" ? "Video" : "Blog"}, {formatDateShort(post.publishedAt)})
                  </option>
                ))}
            </select>
          </Field>
          {published.length === 0 && <p className="meta">Publish a post first, then it can be featured here.</p>}
        </section>

        <section className="space-y-6">
          <h2 className="border-b border-hairline pb-2 font-display text-[1.25rem] font-semibold">About page</h2>
          <Field label="About text" htmlFor="aboutText" error={errors.aboutText} hint="Separate paragraphs with a blank line. The first paragraph is set larger.">
            <textarea
              id="aboutText"
              rows={14}
              value={state.aboutText}
              onChange={(event) => set("aboutText", event.target.value)}
              aria-invalid={errors.aboutText ? true : undefined}
              className={`${inputClass} font-body text-[1.0625rem] leading-relaxed`}
            />
          </Field>
        </section>
      </div>
    </form>
  );
}

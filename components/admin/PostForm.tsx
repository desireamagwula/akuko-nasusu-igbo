"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Save } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { extractEmbedSrc, IFRAME_ALLOW } from "@/convex/lib/facebook";
import { slugify } from "@/convex/lib/text";
import { LIMITS, validatePost, type FieldErrors } from "@/convex/lib/validate";
import { fromDateInput, todayAsEditorialDate, toDateInput } from "@/lib/format";
import { SAMPLE_CATEGORIES } from "@/lib/site";
import { Field, Segmented, buttonClass, errorInfo, inputClass } from "./ui";
import { ImageUpload, type Thumbnail } from "./ImageUpload";
import { RichTextEditor } from "./RichTextEditor";
import { useToast } from "./Toast";
import { useUnsavedGuard } from "./UnsavedGuard";

type PostType = "video" | "blog";
type Status = "draft" | "published";

type FormState = {
  title: string;
  slug: string;
  type: PostType;
  status: Status;
  category: string;
  excerpt: string;
  body: string;
  embed: string;
  date: string;
  thumbnailId: string | null;
  thumbnailAlt: string;
};

type Errors = FieldErrors & { thumbnail?: string };

export type AdminPost = Doc<"posts"> & { thumbnailUrl: string | null };

function initialState(post?: AdminPost): FormState {
  if (!post) {
    return {
      title: "",
      slug: "",
      type: "blog",
      status: "draft",
      category: "",
      excerpt: "",
      body: "",
      embed: "",
      date: toDateInput(todayAsEditorialDate()),
      thumbnailId: null,
      thumbnailAlt: "",
    };
  }
  return {
    title: post.title,
    slug: post.slug,
    type: post.type,
    status: post.status,
    category: post.category,
    excerpt: post.excerpt,
    body: post.body ?? "",
    embed: post.embedSrc ?? "",
    date: toDateInput(post.publishedAt),
    thumbnailId: post.thumbnailId ?? null,
    thumbnailAlt: post.thumbnailAlt ?? "",
  };
}

const FIELD_IDS: Record<string, string> = {
  title: "title",
  slug: "slug",
  category: "category",
  excerpt: "excerpt",
  body: "body",
  embed: "embed",
  publishedAt: "date",
};

export function PostForm({ post }: { post?: AdminPost }) {
  const router = useRouter();
  const toast = useToast();
  const { setDirty } = useUnsavedGuard();
  const create = useMutation(api.posts.create);
  const update = useMutation(api.posts.update);
  const existing = useQuery(api.posts.adminList);

  const [state, setState] = useState<FormState>(() => initialState(post));
  const [baseline, setBaseline] = useState(state);
  const [thumb, setThumb] = useState<Thumbnail>(post?.thumbnailId && post.thumbnailUrl ? { storageId: post.thumbnailId, url: post.thumbnailUrl } : null);
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(() => JSON.stringify(state) !== JSON.stringify(baseline), [state, baseline]);
  useEffect(() => {
    setDirty(dirty);
    return () => setDirty(false);
  }, [dirty, setDirty]);

  const categories = useMemo(() => {
    const seen = new Set<string>(SAMPLE_CATEGORIES);
    existing?.forEach((row) => seen.add(row.category));
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [existing]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => setState((s) => ({ ...s, [key]: value })), []);

  const draftFor = (s: FormState) => ({
    title: s.title,
    slug: s.slug,
    type: s.type,
    status: s.status,
    category: s.category,
    excerpt: s.excerpt,
    body: s.body,
    embed: s.embed,
    publishedAt: s.date ? fromDateInput(s.date) : Number.NaN,
  });

  // After a first failed save, keep the messages honest as the user fixes things.
  useEffect(() => {
    if (submitted) setErrors((prev) => ({ ...validatePost(draftFor(state)), thumbnail: prev.thumbnail }));
  }, [state, submitted]);

  const embedSrc = state.type === "video" ? extractEmbedSrc(state.embed) : null;

  const save = useCallback(async () => {
    if (saving) return;
    setSubmitted(true);
    const found: Errors = { ...validatePost(draftFor(state)), thumbnail: errors.thumbnail };
    setErrors(found);
    const first = (Object.keys(FIELD_IDS) as (keyof FieldErrors)[]).find((key) => found[key]);
    if (first) {
      toast("Please fix the highlighted fields.", "error");
      document.getElementById(FIELD_IDS[first])?.focus();
      return;
    }

    setSaving(true);
    const payload = {
      title: state.title,
      slug: state.slug,
      type: state.type,
      status: state.status,
      category: state.category,
      excerpt: state.excerpt,
      body: state.body,
      embed: state.embed,
      thumbnailId: (state.thumbnailId ?? undefined) as Id<"_storage"> | undefined,
      thumbnailAlt: state.thumbnailAlt,
      publishedAt: fromDateInput(state.date),
    };
    try {
      if (post) {
        const result = await update({ id: post._id, ...payload });
        setState((s) => ({ ...s, slug: result.slug }));
        setBaseline({ ...state, slug: result.slug });
        toast(state.status === "published" ? "Saved and published." : "Draft saved.");
      } else {
        const result = await create(payload);
        setBaseline(state);
        setDirty(false);
        toast(state.status === "published" ? "Post published." : "Draft saved.");
        router.replace(`/admin/posts/${result.id}`);
      }
    } catch (error) {
      const info = errorInfo(error);
      setSubmitted(true);
      setErrors((prev) => ({ ...prev, ...info.fieldErrors }));
      toast(info.message, "error");
    } finally {
      setSaving(false);
    }
  }, [state, saving, post, errors.thumbnail, create, update, router, toast, setDirty]);

  // Cmd/Ctrl+S saves.
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isVideo = state.type === "video";
  const err = (key: keyof Errors) => errors[key];

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2rem] font-semibold leading-none tracking-[-0.02em]">{post ? "Edit post" : "New post"}</h1>
          <p className="meta mt-2" aria-live="polite">
            {dirty ? (
              <span className="inline-flex items-center gap-2 text-ink">
                <span aria-hidden="true" className="h-1.5 w-1.5 bg-oxblood" /> Unsaved changes
              </span>
            ) : post ? (
              "All changes saved"
            ) : (
              "Not saved yet"
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="meta hidden sm:inline">Ctrl or Cmd + S</span>
          <button type="submit" disabled={saving} className={buttonClass.primary}>
            <Save size={16} strokeWidth={1.5} aria-hidden="true" /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Field label="Title" htmlFor="title" error={err("title")}>
            <input
              id="title"
              value={state.title}
              maxLength={LIMITS.title + 20}
              onChange={(event) => {
                const title = event.target.value;
                setState((s) => ({ ...s, title, slug: slugTouched ? s.slug : slugify(title) }));
              }}
              aria-invalid={err("title") ? true : undefined}
              aria-describedby={err("title") ? "title-error" : undefined}
              placeholder="Headline"
              className={`${inputClass} py-3 font-display text-[1.5rem] font-semibold leading-tight tracking-[-0.01em]`}
            />
          </Field>

          <Field
            label="URL slug"
            htmlFor="slug"
            error={err("slug")}
            hint={isVideo ? "Used as the video's anchor on the Videos page." : `Public address: /blog/${state.slug || "..."}`}
          >
            <input
              id="slug"
              value={state.slug}
              onChange={(event) => {
                setSlugTouched(true);
                set("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"));
              }}
              aria-invalid={err("slug") ? true : undefined}
              className={`${inputClass} font-mono text-[0.875rem]`}
            />
          </Field>

          <div>
            <p className="mb-1.5 text-[0.8125rem] font-medium">Type</p>
            <Segmented
              label="Post type"
              value={state.type}
              onChange={(type) => set("type", type)}
              options={[
                { value: "blog", label: "Blog" },
                { value: "video", label: "Video" },
              ]}
            />
          </div>

          {isVideo && (
            <Field
              label="Facebook embed code"
              htmlFor="embed"
              error={err("embed")}
              hint="On Facebook, open the video, choose Embed, and paste the iframe code here. A plain video link works too."
            >
              <textarea
                id="embed"
                rows={4}
                value={state.embed}
                onChange={(event) => set("embed", event.target.value)}
                aria-invalid={err("embed") ? true : undefined}
                aria-describedby={err("embed") ? "embed-error" : undefined}
                placeholder={'<iframe src="https://www.facebook.com/plugins/video.php?..." ...></iframe>'}
                className={`${inputClass} font-mono text-[0.8125rem] leading-relaxed`}
              />
              {embedSrc && (
                <div className="mt-4">
                  <p className="meta mb-2">Preview</p>
                  <div className="relative aspect-video max-w-xl overflow-hidden bg-ink">
                    <iframe
                      src={embedSrc}
                      title="Embed preview"
                      loading="lazy"
                      allow={IFRAME_ALLOW}
                      allowFullScreen
                      className="absolute inset-0 h-full w-full border-0"
                    />
                  </div>
                </div>
              )}
            </Field>
          )}

          <Field
            label={isVideo ? "Description" : "Excerpt"}
            htmlFor="excerpt"
            error={err("excerpt")}
            hint={`${isVideo ? "Shown beneath the video." : "The standfirst shown on cards and search results."} ${state.excerpt.length}/${LIMITS.excerpt}`}
          >
            <textarea
              id="excerpt"
              rows={isVideo ? 3 : 4}
              value={state.excerpt}
              onChange={(event) => set("excerpt", event.target.value)}
              aria-invalid={err("excerpt") ? true : undefined}
              aria-describedby={err("excerpt") ? "excerpt-error" : undefined}
              className={inputClass}
            />
          </Field>

          {!isVideo && (
            <div>
              <p className="mb-1.5 text-[0.8125rem] font-medium">Article</p>
              <RichTextEditor value={state.body} onChange={(html) => set("body", html)} invalid={Boolean(err("body"))} describedBy={err("body") ? "body-error" : undefined} />
              {err("body") && (
                <p id="body-error" role="alert" className="mt-1.5 text-[0.8125rem] text-oxblood">
                  {err("body")}
                </p>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <section className="space-y-5 border border-hairline bg-surface p-5">
            <h2 className="font-display text-[1.125rem] font-semibold">Publishing</h2>
            <div>
              <p className="mb-1.5 text-[0.8125rem] font-medium">Status</p>
              <Segmented
                label="Status"
                value={state.status}
                onChange={(status) => set("status", status)}
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "published", label: "Published" },
                ]}
              />
              <p className="meta mt-1.5">{state.status === "published" ? "Visible on the public site." : "Only you can see this."}</p>
            </div>
            <Field label="Publish date" htmlFor="date" error={err("publishedAt")}>
              <input id="date" type="date" value={state.date} onChange={(event) => set("date", event.target.value)} aria-invalid={err("publishedAt") ? true : undefined} className={inputClass} />
            </Field>
            <Field label="Category" htmlFor="category" error={err("category")} hint="Free text, for example Omenala or Egwuregwu.">
              <input
                id="category"
                list="category-options"
                value={state.category}
                onChange={(event) => set("category", event.target.value)}
                aria-invalid={err("category") ? true : undefined}
                aria-describedby={err("category") ? "category-error" : undefined}
                className={inputClass}
              />
              <datalist id="category-options">
                {categories.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </Field>
          </section>

          <section className="space-y-4 border border-hairline bg-surface p-5">
            <h2 className="font-display text-[1.125rem] font-semibold">Thumbnail</h2>
            <ImageUpload
              value={thumb}
              ratio={isVideo ? "video" : "blog"}
              error={errors.thumbnail}
              onError={(message) => setErrors((prev) => ({ ...prev, thumbnail: message ?? undefined }))}
              onChange={(next) => {
                setThumb(next);
                set("thumbnailId", next?.storageId ?? null);
              }}
            />
            {thumb && (
              <Field label="Alt text" htmlFor="alt" hint="Describe the picture for readers who cannot see it.">
                <input id="alt" value={state.thumbnailAlt} onChange={(event) => set("thumbnailAlt", event.target.value)} placeholder={state.title || "Describe the image"} className={inputClass} />
              </Field>
            )}
            <p className="meta">Shown on cards and when the post is shared. Shown {isVideo ? "16:9" : "3:2"}.</p>
          </section>
        </aside>
      </div>
    </form>
  );
}

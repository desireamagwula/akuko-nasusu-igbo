"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { ArrowDown, ArrowUp, ArrowUpDown, FilePlus2, FileText, Pencil, Search, Trash2, Video } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatDateShort } from "@/lib/format";
import { ConfirmDialog, StatusBadge, buttonClass, errorInfo, inputClass } from "./ui";
import { useToast } from "./Toast";

type Row = NonNullable<ReturnType<typeof useQuery<typeof api.posts.adminList>>>[number];
type SortKey = "title" | "type" | "publishedAt" | "status";

const selectClass = `${inputClass.replace("block w-full", "block")} h-11 min-w-36 py-0 pr-8`;

export function PostsTable() {
  const posts = useQuery(api.posts.adminList);
  const remove = useMutation(api.posts.remove);
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | "video" | "blog">("all");
  const [status, setStatus] = useState<"all" | "draft" | "published">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "publishedAt", dir: "desc" });
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  const rows = useMemo(() => {
    if (!posts) return [];
    const needle = query.trim().toLowerCase();
    const filtered = posts.filter(
      (post) =>
        (type === "all" || post.type === type) &&
        (status === "all" || post.status === status) &&
        (!needle || post.title.toLowerCase().includes(needle) || post.category.toLowerCase().includes(needle)),
    );
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv), undefined, { sensitivity: "base" });
      return (cmp || b.publishedAt - a.publishedAt) * dir;
    });
  }, [posts, query, type, status, sort]);

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "publishedAt" ? "desc" : "asc" },
    );
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await remove({ id: toDelete._id as Id<"posts"> });
      toast(`Deleted "${toDelete.title}".`);
      setToDelete(null);
    } catch (error) {
      toast(errorInfo(error).message, "error");
    } finally {
      setDeleting(false);
    }
  }

  const published = posts?.filter((post) => post.status === "published").length ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2rem] font-semibold leading-none tracking-[-0.02em]">Posts</h1>
          <p className="meta mt-2">
            {posts ? `${posts.length} in total, ${published} published, ${posts.length - published} drafts` : " "}
          </p>
        </div>
        <Link href="/admin/posts/new" className={buttonClass.primary}>
          <FilePlus2 size={16} strokeWidth={1.5} aria-hidden="true" /> New post
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search size={16} strokeWidth={1.5} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles and categories"
            aria-label="Search posts"
            className={`${inputClass} h-11 py-0 pl-10`}
          />
        </div>
        <select aria-label="Filter by type" value={type} onChange={(event) => setType(event.target.value as typeof type)} className={selectClass}>
          <option value="all">All types</option>
          <option value="blog">Blog</option>
          <option value="video">Video</option>
        </select>
        <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className={selectClass}>
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div className="mt-5 overflow-x-auto border border-hairline bg-surface">
        <table className="w-full min-w-[720px] border-collapse text-left text-[0.9375rem]">
          <thead>
            <tr className="border-b border-hairline bg-paper text-[0.75rem] uppercase tracking-[0.1em] text-muted">
              <Th label="Title" k="title" sort={sort} onSort={toggleSort} className="w-[46%]" />
              <Th label="Type" k="type" sort={sort} onSort={toggleSort} />
              <Th label="Publish date" k="publishedAt" sort={sort} onSort={toggleSort} className="whitespace-nowrap" />
              <Th label="Status" k="status" sort={sort} onSort={toggleSort} />
              <th scope="col" className="px-4 py-3 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {posts === undefined &&
              [0, 1, 2, 3, 4].map((i) => (
                <tr key={i} className="border-b border-hairline last:border-0" aria-hidden="true">
                  <td className="px-4 py-4"><div className="skeleton h-4 w-3/4" /></td>
                  <td className="px-4 py-4"><div className="skeleton h-4 w-14" /></td>
                  <td className="px-4 py-4"><div className="skeleton h-4 w-24" /></td>
                  <td className="px-4 py-4"><div className="skeleton h-6 w-20" /></td>
                  <td className="px-4 py-4"><div className="skeleton ml-auto h-4 w-20" /></td>
                </tr>
              ))}

            {rows.map((post) => (
              <tr key={post._id} className="border-b border-hairline last:border-0 hover:bg-paper/60">
                <td className="px-4 py-3.5 align-top">
                  <Link href={`/admin/posts/${post._id}`} className="font-medium hover:text-oxblood">
                    {post.title}
                  </Link>
                  <p className="meta mt-0.5">{post.category}</p>
                </td>
                <td className="px-4 py-3.5 align-top">
                  <span className="inline-flex items-center gap-1.5 text-[0.875rem]">
                    {post.type === "video" ? (
                      <Video size={15} strokeWidth={1.5} aria-hidden="true" />
                    ) : (
                      <FileText size={15} strokeWidth={1.5} aria-hidden="true" />
                    )}
                    {post.type === "video" ? "Video" : "Blog"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 align-top text-[0.875rem] text-muted">{formatDateShort(post.publishedAt)}</td>
                <td className="px-4 py-3.5 align-top">
                  <StatusBadge status={post.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right align-top">
                  <Link
                    href={`/admin/posts/${post._id}`}
                    className="inline-flex h-9 items-center gap-1.5 px-2.5 text-[0.8125rem] hover:bg-paper"
                    aria-label={`Edit ${post.title}`}
                  >
                    <Pencil size={14} strokeWidth={1.5} aria-hidden="true" /> Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => setToDelete(post)}
                    className="inline-flex h-9 items-center gap-1.5 px-2.5 text-[0.8125rem] text-oxblood hover:bg-paper"
                    aria-label={`Delete ${post.title}`}
                  >
                    <Trash2 size={14} strokeWidth={1.5} aria-hidden="true" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {posts && rows.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-[1.25rem]">{posts.length === 0 ? "No posts yet." : "No posts match those filters."}</p>
            <p className="meta mt-2">
              {posts.length === 0 ? "Create your first video or article to get started." : "Try a different search, type or status."}
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this post?"
        confirmLabel="Delete post"
        tone="danger"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      >
        <span className="font-medium text-ink">&ldquo;{toDelete?.title}&rdquo;</span> and its thumbnail will be removed permanently.
        This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}

function Th({
  label,
  k,
  sort,
  onSort,
  className = "",
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th scope="col" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={`px-4 py-0 font-medium ${className}`}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`-mx-2 inline-flex h-11 items-center gap-1.5 px-2 uppercase tracking-[0.1em] hover:text-ink ${active ? "text-ink" : ""}`}
      >
        {label}
        <Icon size={13} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </th>
  );
}

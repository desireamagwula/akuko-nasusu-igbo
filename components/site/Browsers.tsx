"use client";

import { useMemo, useState } from "react";
import { categoriesOf, editorialBlocks, type PostCardData } from "@/lib/posts";
import { formatDate, isoDate } from "@/lib/format";
import { IFRAME_ALLOW } from "@/convex/lib/facebook";
import { Reveal } from "@/components/ui/Reveal";
import { Blocks } from "./Blocks";
import { FilterChips } from "./FilterChips";
import { Kicker } from "./PostCard";

const PAGE_SIZE = 12;

function useFiltered(posts: PostCardData[]) {
  const [category, setCategory] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE_SIZE);
  const categories = useMemo(() => categoriesOf(posts), [posts]);
  const filtered = useMemo(() => (category ? posts.filter((p) => p.category === category) : posts), [posts, category]);
  return {
    categories,
    category,
    setCategory: (next: string | null) => {
      setCategory(next);
      setShown(PAGE_SIZE);
    },
    visible: filtered.slice(0, shown),
    remaining: Math.max(0, filtered.length - shown),
    more: () => setShown((n) => n + PAGE_SIZE),
    total: filtered.length,
  };
}

function MoreButton({ remaining, onClick }: { remaining: number; onClick: () => void }) {
  if (remaining <= 0) return null;
  return (
    <div className="mt-14 flex justify-center border-t border-hairline pt-10">
      <button
        type="button"
        onClick={onClick}
        className="h-11 border border-ink px-7 text-[0.8125rem] font-medium uppercase tracking-[0.14em] transition-colors duration-200 hover:bg-ink hover:text-paper"
      >
        Show more ({remaining})
      </button>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-hairline py-20">
      <p className="max-w-md font-display text-[1.5rem] leading-snug text-balance">{children}</p>
    </div>
  );
}

export function BlogBrowser({ posts }: { posts: PostCardData[] }) {
  const f = useFiltered(posts);
  return (
    <div>
      <FilterChips categories={f.categories} value={f.category} onChange={f.setCategory} label="Filter articles by category" />
      {posts.length === 0 ? (
        <Empty>No articles have been published yet. Check back soon.</Empty>
      ) : (
        <div className="border-t border-hairline pt-10" aria-live="polite">
          <Blocks blocks={editorialBlocks(f.visible)} />
          <MoreButton remaining={f.remaining} onClick={f.more} />
        </div>
      )}
    </div>
  );
}

function VideoCard({ post }: { post: PostCardData }) {
  return (
    <article id={post.slug} className="scroll-mt-28">
      <div className="relative aspect-video overflow-hidden bg-ink">
        {post.embedSrc && (
          <iframe
            src={post.embedSrc}
            title={post.title}
            loading="lazy"
            allow={IFRAME_ALLOW}
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        )}
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        <Kicker>{post.category}</Kicker>
        <h3 className="font-display text-[1.375rem] font-semibold leading-[1.18] tracking-[-0.012em] text-balance">{post.title}</h3>
        <p className="meta">
          <time dateTime={isoDate(post.publishedAt)}>{formatDate(post.publishedAt)}</time>
        </p>
        {post.excerpt && <p className="line-clamp-3 text-[0.9375rem] leading-relaxed text-ink">{post.excerpt}</p>}
      </div>
    </article>
  );
}

export function VideoBrowser({ posts }: { posts: PostCardData[] }) {
  const f = useFiltered(posts);
  return (
    <div>
      <FilterChips categories={f.categories} value={f.category} onChange={f.setCategory} label="Filter videos by category" />
      {posts.length === 0 ? (
        <Empty>No videos have been published yet. Check back soon.</Empty>
      ) : (
        <div className="border-t border-hairline pt-10" aria-live="polite">
          <div className="grid gap-x-9 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {f.visible.map((post, i) => (
              <Reveal key={post._id} delay={(i % 3) * 60}>
                <VideoCard post={post} />
              </Reveal>
            ))}
          </div>
          <MoreButton remaining={f.remaining} onClick={f.more} />
        </div>
      )}
    </div>
  );
}

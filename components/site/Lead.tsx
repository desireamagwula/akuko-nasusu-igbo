import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDate, isoDate } from "@/lib/format";
import { postHref, type PostCardData } from "@/lib/posts";
import { Kicker, ListItem, Thumb } from "./PostCard";

/**
 * The front-page lead. Deliberately not a centred hero: the story's image takes
 * about 60% of the width, with the kicker, headline and standfirst in the
 * remaining column. A row of further stories runs beneath. It stacks on mobile.
 */
export function Lead({ post, more }: { post: PostCardData; more: PostCardData[] }) {
  const href = postHref(post);
  return (
    <section aria-label="Lead story" className="pt-8 md:pt-12">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-14">
      <Link href={href} className="group block lg:col-span-7" tabIndex={-1} aria-hidden="true">
        <Thumb post={post} priority sizes="(min-width: 1240px) 700px, (min-width: 1024px) 58vw, 100vw" />
      </Link>

      <div className="flex flex-col justify-center lg:col-span-5">
        <article className="group relative">
          <Kicker>{post.category}</Kicker>
          <h1 className="mt-4 font-display text-[2.25rem] font-semibold leading-[1.04] tracking-[-0.022em] text-balance md:text-[3rem] lg:text-[3.25rem]">
            <Link href={href} className="u-draw u-draw-2 after:absolute after:inset-0">
              {post.title}
            </Link>
          </h1>
          <p className="mt-5 font-body text-[1.1875rem] leading-[1.55] text-ink md:text-[1.3125rem]">{post.excerpt}</p>
          <p className="meta mt-5 flex items-center gap-4">
            <time dateTime={isoDate(post.publishedAt)}>{formatDate(post.publishedAt)}</time>
            <span className="inline-flex items-center gap-1.5 text-ink">
              {post.type === "video" ? "Watch the video" : "Read the story"}
              <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
            </span>
          </p>
        </article>

      </div>
      </div>

      {more.length > 0 && (
        <aside aria-label="More stories" className="mt-10 border-t border-hairline pt-6 md:mt-14">
          <p className="meta mb-5 font-medium uppercase tracking-[0.14em]">Also in the news</p>
          <div className="grid gap-6 md:grid-cols-3 md:gap-10">
            {more.map((item) => (
              <ListItem key={item._id} post={item} />
            ))}
          </div>
        </aside>
      )}
    </section>
  );
}

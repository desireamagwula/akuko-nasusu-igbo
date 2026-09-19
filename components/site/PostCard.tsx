import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { formatDateShort, isoDate } from "@/lib/format";
import { postHref, type PostCardData } from "@/lib/posts";
import { LogoMark } from "./Logo";

/**
 * Consistent photographic treatment: every thumbnail fills its frame with
 * object-cover. Video posts are 16:9, articles are 3:2.
 */
export function Thumb({
  post,
  sizes,
  priority = false,
  className = "",
}: {
  post: PostCardData;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const aspect = post.type === "video" ? "aspect-video" : "aspect-[3/2]";
  return (
    <div className={`relative overflow-hidden bg-hairline ${aspect} ${className}`}>
      {post.thumbnailUrl ? (
        <Image
          src={post.thumbnailUrl}
          alt={post.thumbnailAlt}
          fill
          sizes={sizes}
          priority={priority}
          className="thumb-img object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col justify-between p-4 text-ink md:p-5" aria-hidden="true">
          <LogoMark size={18} />
          <span className="font-display text-[1.375rem] italic leading-tight md:text-[1.75rem]">{post.category}</span>
        </div>
      )}
      {post.type === "video" && (
        <span
          className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center bg-ink/90 text-paper"
          aria-hidden="true"
        >
          <Play size={16} strokeWidth={1.5} fill="none" />
        </span>
      )}
    </div>
  );
}

export function Kicker({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`kicker ${className}`}>{children}</span>;
}

export function PostMeta({ post, className = "" }: { post: PostCardData; className?: string }) {
  return (
    <p className={`meta flex items-center gap-2 ${className}`}>
      <time dateTime={isoDate(post.publishedAt)}>{formatDateShort(post.publishedAt)}</time>
      {post.type === "video" && (
        <>
          <span aria-hidden="true" className="h-3 w-px bg-hairline" />
          <span className="inline-flex items-center gap-1">
            <Play size={11} strokeWidth={1.5} aria-hidden="true" /> Video
          </span>
        </>
      )}
    </p>
  );
}

/** Headline that is also the card's only link: it stretches to cover the whole tile. */
function Headline({
  post,
  className,
  as: Tag = "h3",
}: {
  post: PostCardData;
  className: string;
  as?: "h2" | "h3";
}) {
  return (
    <Tag className={`font-display font-semibold tracking-[-0.012em] text-balance ${className}`}>
      <Link href={postHref(post)} className="u-draw after:absolute after:inset-0">
        {post.title}
      </Link>
    </Tag>
  );
}

const tile = "group card-lift relative -m-3 p-3";

/** Standard tile: image over text. `mdWide` lays it out sideways on tablets so 2-column rows stay full. */
export function StandardCard({ post, mdWide = false }: { post: PostCardData; mdWide?: boolean }) {
  return (
    <article className={`${tile} flex flex-col gap-4 ${mdWide ? "md:max-lg:grid md:max-lg:grid-cols-5 md:max-lg:gap-6" : ""}`}>
      <Thumb
        post={post}
        sizes={mdWide ? "(min-width: 1024px) 33vw, (min-width: 768px) 40vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"}
        className={mdWide ? "md:max-lg:col-span-3" : ""}
      />
      <div className={`flex flex-col gap-2.5 ${mdWide ? "md:max-lg:col-span-2 md:max-lg:justify-center" : ""}`}>
        <Kicker>{post.category}</Kicker>
        <Headline post={post} className="text-[1.375rem] leading-[1.18]" />
        <p className="line-clamp-3 text-[0.9375rem] leading-relaxed text-ink">{post.excerpt}</p>
        <PostMeta post={post} className="mt-0.5" />
      </div>
    </article>
  );
}

/** Wide tile: spans two columns, image left and a larger headline right. */
export function WideCard({ post }: { post: PostCardData }) {
  return (
    <article className={`${tile} flex flex-col gap-4 md:grid md:grid-cols-5 md:items-center md:gap-7`}>
      <Thumb post={post} sizes="(min-width: 1024px) 40vw, (min-width: 768px) 60vw, 100vw" className="md:col-span-3" />
      <div className="flex flex-col gap-3 md:col-span-2">
        <Kicker>{post.category}</Kicker>
        <Headline post={post} className="text-[1.5rem] leading-[1.14] md:text-[1.875rem]" />
        <p className="line-clamp-4 text-[0.9375rem] leading-relaxed text-ink">{post.excerpt}</p>
        <PostMeta post={post} className="mt-0.5" />
      </div>
    </article>
  );
}

/** Large tile: image over a big headline. Used beside a stacked pair. */
export function LargeCard({ post }: { post: PostCardData }) {
  return (
    <article className={`${tile} flex flex-col gap-5`}>
      <Thumb post={post} sizes="(min-width: 1024px) 66vw, 100vw" />
      <div className="flex max-w-[44rem] flex-col gap-3">
        <Kicker>{post.category}</Kicker>
        <Headline post={post} className="text-[1.75rem] leading-[1.1] md:text-[2.25rem]" />
        <p className="line-clamp-3 text-[1rem] leading-relaxed text-ink">{post.excerpt}</p>
        <PostMeta post={post} className="mt-0.5" />
      </div>
    </article>
  );
}

/** Compact tile: text with a small thumbnail beside it. Stacked in pairs. */
export function CompactCard({ post }: { post: PostCardData }) {
  return (
    <article className={`${tile} flex gap-4`}>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Kicker>{post.category}</Kicker>
        <Headline post={post} className="text-[1.125rem] leading-[1.2]" />
        <PostMeta post={post} className="mt-auto" />
      </div>
      <Thumb post={post} sizes="140px" className="w-28 shrink-0 self-start sm:w-36" />
    </article>
  );
}

/** Text-only entry for the "also today" list beside the lead story. */
export function ListItem({ post }: { post: PostCardData }) {
  return (
    <article className="group relative flex flex-col gap-2 border-t border-hairline pt-4 md:border-t-0 md:pt-0 md:first:border-l-0">
      <Kicker>{post.category}</Kicker>
      <Headline post={post} className="text-[1.125rem] leading-[1.22]" />
      <PostMeta post={post} />
    </article>
  );
}

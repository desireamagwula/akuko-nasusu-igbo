import { ConvexError, v } from "convex/values";
import type { ObjectType } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireAdmin } from "./model";
import { postStatus, postType } from "./schema";
import { extractEmbedSrc } from "./lib/facebook";
import { slugify } from "./lib/text";
import { validatePost } from "./lib/validate";

const MAX_THUMBNAIL_BYTES = 10 * 1024 * 1024;

/* -------------------------------------------------------------------------- */
/*  Public queries (no auth): published content only                          */
/* -------------------------------------------------------------------------- */

async function toCard(ctx: QueryCtx, post: Doc<"posts">) {
  return {
    _id: post._id,
    title: post.title,
    slug: post.slug,
    type: post.type,
    category: post.category,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    embedSrc: post.type === "video" ? (post.embedSrc ?? null) : null,
    thumbnailUrl: post.thumbnailId ? await ctx.storage.getUrl(post.thumbnailId) : null,
    thumbnailAlt: post.thumbnailAlt?.trim() || post.title,
  };
}

/** Published posts, newest first. Cards only: no article bodies. */
export const listPublished = query({
  args: { type: v.optional(postType), limit: v.optional(v.number()) },
  handler: async (ctx, { type, limit }) => {
    const take = Math.min(Math.max(limit ?? 300, 1), 500);
    const rows =
      type === undefined
        ? await ctx.db
            .query("posts")
            .withIndex("by_status_date", (q) => q.eq("status", "published"))
            .order("desc")
            .take(take)
        : await ctx.db
            .query("posts")
            .withIndex("by_status_type_date", (q) => q.eq("status", "published").eq("type", type))
            .order("desc")
            .take(take);
    return await Promise.all(rows.map((row) => toCard(ctx, row)));
  },
});

/** One published article by slug, with its body. Null for drafts and videos. */
export const getPublishedBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!post || post.status !== "published" || post.type !== "blog") return null;
    return { ...(await toCard(ctx, post)), body: post.body ?? "" };
  },
});

/* -------------------------------------------------------------------------- */
/*  Admin queries                                                             */
/* -------------------------------------------------------------------------- */

export const adminList = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("posts").order("desc").take(1000);
    return rows.map((post) => ({
      _id: post._id,
      title: post.title,
      slug: post.slug,
      type: post.type,
      status: post.status,
      category: post.category,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
    }));
  },
});

export const adminGet = query({
  args: { id: v.id("posts") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const post = await ctx.db.get(id);
    if (!post) return null;
    return {
      ...post,
      thumbnailUrl: post.thumbnailId ? await ctx.storage.getUrl(post.thumbnailId) : null,
    };
  },
});

/* -------------------------------------------------------------------------- */
/*  Admin mutations                                                           */
/* -------------------------------------------------------------------------- */

const postFields = {
  title: v.string(),
  slug: v.string(),
  type: postType,
  status: postStatus,
  category: v.string(),
  excerpt: v.string(),
  body: v.string(),
  /** Raw pasted embed code, or a URL. Reduced to a safe src on the server. */
  embed: v.string(),
  thumbnailId: v.optional(v.id("_storage")),
  thumbnailAlt: v.optional(v.string()),
  publishedAt: v.number(),
};

type PostInput = ObjectType<typeof postFields>;

async function uniqueSlug(ctx: MutationCtx, wanted: string, ignore?: Id<"posts">) {
  const base = slugify(wanted);
  let candidate = base;
  for (let n = 2; ; n++) {
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", candidate))
      .first();
    if (!existing || existing._id === ignore) return candidate;
    candidate = `${base}-${n}`;
  }
}

/** Validate, normalise, and turn form input into the stored document shape. */
async function prepare(ctx: MutationCtx, input: PostInput, ignore?: Id<"posts">) {
  const errors = validatePost({
    title: input.title,
    slug: input.slug,
    type: input.type,
    status: input.status,
    category: input.category,
    excerpt: input.excerpt,
    body: input.body,
    embed: input.embed,
    publishedAt: input.publishedAt,
  });
  if (Object.keys(errors).length > 0) {
    throw new ConvexError({ message: "Please fix the highlighted fields.", fieldErrors: errors });
  }

  if (input.thumbnailId) {
    const file = await ctx.db.system.get(input.thumbnailId);
    if (!file || !file.contentType?.startsWith("image/")) {
      throw new ConvexError({ message: "The thumbnail must be an image.", fieldErrors: { thumbnail: "The thumbnail must be an image." } });
    }
    if (file.size > MAX_THUMBNAIL_BYTES) {
      throw new ConvexError({ message: "The thumbnail is larger than 10 MB.", fieldErrors: { thumbnail: "The thumbnail is larger than 10 MB." } });
    }
  }

  const isVideo = input.type === "video";
  return {
    title: input.title.trim(),
    slug: await uniqueSlug(ctx, input.slug.trim() || input.title, ignore),
    type: input.type,
    status: input.status,
    category: input.category.trim(),
    excerpt: input.excerpt.trim(),
    body: isVideo ? undefined : input.body,
    embedSrc: isVideo ? (extractEmbedSrc(input.embed) ?? undefined) : undefined,
    thumbnailId: input.thumbnailId,
    thumbnailAlt: input.thumbnailAlt?.trim() || undefined,
    publishedAt: input.publishedAt,
  };
}

export const create = mutation({
  args: postFields,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const doc = await prepare(ctx, args);
    const id = await ctx.db.insert("posts", { ...doc, updatedAt: Date.now() });
    return { id, slug: doc.slug };
  },
});

export const update = mutation({
  args: { id: v.id("posts"), ...postFields },
  handler: async (ctx, { id, ...args }) => {
    await requireAdmin(ctx);
    const current = await ctx.db.get(id);
    if (!current) throw new ConvexError({ message: "This post no longer exists." });

    const doc = await prepare(ctx, args, id);
    await ctx.db.replace(id, { ...doc, updatedAt: Date.now() });

    // A replaced thumbnail would otherwise sit in storage forever.
    if (current.thumbnailId && current.thumbnailId !== doc.thumbnailId) {
      await ctx.storage.delete(current.thumbnailId);
    }
    // An unpublished post cannot stay pinned as the homepage lead.
    if (doc.status !== "published") await unpin(ctx, id);
    return { id, slug: doc.slug };
  },
});

export const remove = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const post = await ctx.db.get(id);
    if (!post) return;
    await unpin(ctx, id);
    if (post.thumbnailId) await ctx.storage.delete(post.thumbnailId);
    await ctx.db.delete(id);
  },
});

async function unpin(ctx: MutationCtx, id: Id<"posts">) {
  const settings = await ctx.db.query("settings").first();
  if (settings?.featuredPostId === id) {
    await ctx.db.patch(settings._id, { featuredPostId: undefined });
  }
}

import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const postType = v.union(v.literal("video"), v.literal("blog"));
export const postStatus = v.union(v.literal("draft"), v.literal("published"));

export default defineSchema({
  ...authTables,

  posts: defineTable({
    title: v.string(),
    slug: v.string(),
    type: postType,
    status: postStatus,
    /** Free-text kicker, e.g. "Omenala" or "Akụkọ Ọhụrụ". */
    category: v.string(),
    /** Blog: the standfirst shown on cards. Video: the description under the frame. */
    excerpt: v.string(),
    /** Blog only. Sanitised again at render time. */
    body: v.optional(v.string()),
    /** Video only. A validated https://www.facebook.com/plugins/... URL. */
    embedSrc: v.optional(v.string()),
    thumbnailId: v.optional(v.id("_storage")),
    thumbnailAlt: v.optional(v.string()),
    /** Editorial publish date (admin editable), ms since epoch. */
    publishedAt: v.number(),
    /** Last edit, ms since epoch. */
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status_date", ["status", "publishedAt"])
    .index("by_status_type_date", ["status", "type", "publishedAt"]),

  /** Singleton: the first (and only) document holds the site settings. */
  settings: defineTable({
    siteName: v.string(),
    aboutText: v.string(),
    facebookUrl: v.optional(v.string()),
    featuredPostId: v.optional(v.id("posts")),
  }),
});

import { extractEmbedSrc } from "./facebook";
import { stripTags } from "./text";

export type FieldErrors = Partial<
  Record<"title" | "slug" | "category" | "excerpt" | "body" | "embed" | "publishedAt", string>
>;

export type PostDraft = {
  title: string;
  slug: string;
  type: "video" | "blog";
  status: "draft" | "published";
  category: string;
  excerpt: string;
  body: string;
  /** Raw pasted embed code (client) or the stored src (server). */
  embed: string;
  publishedAt: number;
};

export const LIMITS = {
  title: 200,
  slug: 90,
  category: 48,
  excerpt: 600,
  body: 400_000,
} as const;

/** Used by both the form (inline errors) and the mutation (authoritative check). */
export function validatePost(post: PostDraft): FieldErrors {
  const errors: FieldErrors = {};
  const publishing = post.status === "published";

  if (!post.title.trim()) errors.title = "A title is required.";
  else if (post.title.length > LIMITS.title) errors.title = `Keep the title under ${LIMITS.title} characters.`;

  if (post.slug.length > LIMITS.slug) errors.slug = "That slug is too long.";

  if (!post.category.trim()) errors.category = "Add a category, for example Omenala.";
  else if (post.category.length > LIMITS.category) errors.category = `Keep the category under ${LIMITS.category} characters.`;

  if (post.excerpt.length > LIMITS.excerpt) errors.excerpt = `Keep this under ${LIMITS.excerpt} characters.`;
  else if (publishing && !post.excerpt.trim()) {
    errors.excerpt = post.type === "video" ? "Add a short description before publishing." : "Add a short excerpt before publishing.";
  }

  if (!Number.isFinite(post.publishedAt)) errors.publishedAt = "Choose a valid date.";

  if (post.type === "video") {
    if (post.embed.trim()) {
      if (!extractEmbedSrc(post.embed)) {
        errors.embed = "That is not a Facebook embed. Paste the iframe code from Facebook's Embed dialog, or a video link.";
      }
    } else if (publishing) {
      errors.embed = "Paste the Facebook embed code before publishing.";
    }
  } else {
    if (post.body.length > LIMITS.body) errors.body = "This article is too long.";
    else if (publishing && !stripTags(post.body) && !post.body.includes("data-fb-embed")) {
      errors.body = "Write the article before publishing.";
    }
  }
  return errors;
}

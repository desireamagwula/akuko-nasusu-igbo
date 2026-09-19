import "server-only";
import { cache } from "react";
import { ConvexHttpClient } from "convex/browser";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { DEFAULT_ABOUT, DEFAULT_SITE_NAME } from "./site";

export type PostCardData = FunctionReturnType<typeof api.posts.listPublished>[number];
export type ArticleData = NonNullable<FunctionReturnType<typeof api.posts.getPublishedBySlug>>;
export type SiteSettings = FunctionReturnType<typeof api.settings.get>;

/**
 * Server-side reads for the public site.
 *
 * We use a plain ConvexHttpClient rather than `convex/nextjs`'s `fetchQuery`:
 * `fetchQuery` marks every request `no-store`, which would make every public
 * page fully dynamic. With this client the pages are statically generated and
 * refreshed in the background (`export const revalidate = 60` on each route).
 *
 * Each read is wrapped in React `cache` so a page, its layout and its metadata
 * share one round-trip.
 *
 * Only a missing NEXT_PUBLIC_CONVEX_URL degrades to an empty site (so a fresh
 * clone still builds). If the URL is set but Convex errors, we let it throw:
 * a failed build is better than shipping an empty site, and during background
 * revalidation Next keeps serving the last good page.
 */
async function safely<T>(label: string, run: (client: ConvexHttpClient) => Promise<T>, fallback: T): Promise<T> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    console.error(`[data] NEXT_PUBLIC_CONVEX_URL is not set; ${label} returned nothing.`);
    return fallback;
  }
  return run(new ConvexHttpClient(url));
}

export const getSettings = cache(() =>
  safely<SiteSettings>("settings", (client) => client.query(api.settings.get, {}), {
    siteName: DEFAULT_SITE_NAME,
    aboutText: DEFAULT_ABOUT,
    facebookUrl: null,
    featuredPostId: null,
  }),
);

export const getPublishedPosts = cache(() =>
  safely<PostCardData[]>("published posts", (client) => client.query(api.posts.listPublished, {}), []),
);

export const getArticle = cache((slug: string) =>
  safely<ArticleData | null>("article", (client) => client.query(api.posts.getPublishedBySlug, { slug }), null),
);

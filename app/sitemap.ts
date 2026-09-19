import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

const date = (ms: number | undefined) => (ms === undefined ? undefined : new Date(ms));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();

  return [
    { url: SITE_URL, lastModified: date(posts[0]?.updatedAt), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/videos`, lastModified: date(posts.find((p) => p.type === "video")?.updatedAt), changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/blog`, lastModified: date(posts.find((p) => p.type === "blog")?.updatedAt), changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.3 },
    ...posts
      .filter((post) => post.type === "blog")
      .map((post) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
  ];
}

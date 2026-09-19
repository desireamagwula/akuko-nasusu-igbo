import type { PostCardData } from "./data";

export type { PostCardData };

export const postHref = (post: Pick<PostCardData, "type" | "slug">) =>
  post.type === "blog" ? `/blog/${post.slug}` : `/videos#${post.slug}`;

/** Distinct categories, most frequently used first, then alphabetical. */
export function categoriesOf(posts: readonly PostCardData[]): string[] {
  const counts = new Map<string, number>();
  for (const post of posts) counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name]) => name);
}

/**
 * The front page is laid out like a newspaper: the rhythm changes every few
 * stories instead of repeating one card in a uniform grid. Posts arrive newest
 * first and stay in that order; only the size and shape of each tile changes.
 *
 *   pair   one wide tile and one standard tile
 *   trio   three standard tiles
 *   feature a stacked pair of small items beside one large tile
 */
export type Block =
  | { kind: "pair"; wide: PostCardData; side: PostCardData }
  | { kind: "trio"; items: PostCardData[] }
  | { kind: "feature"; stack: [PostCardData, PostCardData]; large: PostCardData }
  | { kind: "rest"; items: PostCardData[] };

const ORDER = ["pair", "trio", "feature"] as const;
const NEEDS = { pair: 2, trio: 3, feature: 3 } as const;

export function editorialBlocks(posts: readonly PostCardData[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  for (let step = 0; i < posts.length; step++) {
    const kind = ORDER[step % ORDER.length];
    if (posts.length - i < NEEDS[kind]) {
      blocks.push({ kind: "rest", items: posts.slice(i) });
      break;
    }
    if (kind === "pair") blocks.push({ kind, wide: posts[i], side: posts[i + 1] });
    else if (kind === "trio") blocks.push({ kind, items: posts.slice(i, i + 3) });
    else blocks.push({ kind, stack: [posts[i], posts[i + 1]], large: posts[i + 2] });
    i += NEEDS[kind];
  }
  return blocks;
}

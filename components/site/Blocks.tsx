import type { Block } from "@/lib/posts";
import { Reveal } from "@/components/ui/Reveal";
import { CompactCard, LargeCard, StandardCard, WideCard } from "./PostCard";

/**
 * Renders the newspaper rhythm from `editorialBlocks`. Every block is its own
 * grid, separated from the last by a hairline rule, so rows always fill:
 * 3 columns on desktop, 2 on tablet, 1 on mobile.
 */
export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div>
      {blocks.map((block, index) => (
        <Reveal
          key={blockKey(block)}
          className={`grid gap-x-9 gap-y-10 md:grid-cols-2 lg:grid-cols-3 ${
            index > 0 ? "mt-12 border-t border-hairline pt-12" : ""
          }`}
        >
          {block.kind === "pair" && (
            <>
              <div className="md:col-span-2">
                <WideCard post={block.wide} />
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <StandardCard post={block.side} mdWide />
              </div>
            </>
          )}

          {block.kind === "trio" &&
            block.items.map((post, i) => (
              <div key={post._id} className={i === 2 ? "md:col-span-2 lg:col-span-1" : ""}>
                <StandardCard post={post} mdWide={i === 2} />
              </div>
            ))}

          {block.kind === "feature" && (
            <>
              <div className="grid content-start gap-10 md:col-span-2 md:grid-cols-2 lg:col-span-1 lg:grid-cols-1">
                {block.stack.map((post) => (
                  <CompactCard key={post._id} post={post} />
                ))}
              </div>
              <div className="md:col-span-2">
                <LargeCard post={block.large} />
              </div>
            </>
          )}

          {block.kind === "rest" && block.items.length === 1 && (
            <div className="md:col-span-2">
              <WideCard post={block.items[0]} />
            </div>
          )}

          {block.kind === "rest" &&
            block.items.length > 1 &&
            block.items.map((post) => (
              <div key={post._id}>
                <StandardCard post={post} />
              </div>
            ))}
        </Reveal>
      ))}
    </div>
  );
}

function blockKey(block: Block): string {
  switch (block.kind) {
    case "pair":
      return `pair-${block.wide._id}`;
    case "feature":
      return `feature-${block.large._id}`;
    default:
      return `${block.kind}-${block.items[0]._id}`;
  }
}

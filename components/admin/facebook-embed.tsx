"use client";

import { Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { Video } from "lucide-react";
import { IFRAME_ALLOW } from "@/convex/lib/facebook";

/**
 * A Facebook video inside an article.
 *
 * In the editor it shows as a labelled placeholder (so writing never loads
 * Facebook's player). In the saved HTML it is
 *   <div class="fb-embed" data-fb-embed="true"><iframe src="https://www.facebook.com/plugins/..."></iframe></div>
 * which the public site sanitises again before rendering.
 */
function EmbedView({ node, selected }: NodeViewProps) {
  const src = String(node.attrs.src ?? "");
  let label = "Facebook video";
  try {
    label = decodeURIComponent(new URL(src).searchParams.get("href") ?? "") || label;
  } catch {
    // keep the generic label
  }
  return (
    <NodeViewWrapper
      data-drag-handle
      className={`not-prose my-6 flex aspect-video w-full flex-col items-center justify-center gap-2 bg-ink px-6 text-center text-paper ${
        selected ? "outline outline-2 outline-offset-2 outline-oxblood" : ""
      }`}
      contentEditable={false}
    >
      <Video size={26} strokeWidth={1.5} aria-hidden="true" />
      <span className="font-ui text-[0.75rem] font-semibold uppercase tracking-[0.16em]">Facebook video</span>
      <span className="max-w-full truncate font-ui text-[0.8125rem] text-paper/60">{label}</span>
    </NodeViewWrapper>
  );
}

export const FacebookEmbed = Node.create({
  name: "facebookEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return { src: { default: null } };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-fb-embed]",
        getAttrs: (element) => {
          const src = (element as HTMLElement).querySelector("iframe")?.getAttribute("src");
          return src ? { src } : false;
        },
      },
    ];
  },

  renderHTML({ node }) {
    return [
      "div",
      { class: "fb-embed", "data-fb-embed": "true" },
      [
        "iframe",
        {
          src: node.attrs.src,
          title: "Facebook video",
          allow: IFRAME_ALLOW,
          allowfullscreen: "true",
          loading: "lazy",
        },
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedView);
  },
});

import "server-only";
import sanitizeHtml from "sanitize-html";
import { IFRAME_ALLOW } from "@/convex/lib/facebook";

/**
 * Article bodies are written by the admin in TipTap, but we still sanitise at
 * render time: the database is not a trust boundary we want to lean on.
 * Only the tags the editor can produce are allowed, and iframes may only
 * point at Facebook.
 */
export function sanitizeArticle(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "h2", "h3", "h4", "blockquote", "ul", "ol", "li", "strong", "b", "em", "i", "u",
      "s", "a", "hr", "code", "pre", "div", "iframe",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      div: ["class", "data-fb-embed"],
      iframe: ["src", "title", "allow", "allowfullscreen", "loading"],
    },
    allowedClasses: { div: ["fb-embed"] },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowedIframeHostnames: ["www.facebook.com"],
    allowIframeRelativeUrls: false,
    transformTags: {
      a: (tagName, attribs) => {
        const external = /^https?:\/\//i.test(attribs.href ?? "");
        return {
          tagName,
          attribs: external ? { ...attribs, target: "_blank", rel: "noopener noreferrer" } : attribs,
        };
      },
      iframe: (tagName, attribs) => ({
        tagName,
        attribs: {
          src: attribs.src ?? "",
          title: attribs.title || "Facebook video",
          allow: IFRAME_ALLOW,
          allowfullscreen: "true",
          loading: "lazy",
        },
      }),
    },
  });
}

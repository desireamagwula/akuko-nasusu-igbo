/**
 * Facebook embed handling, shared by the admin form (client), the Convex
 * mutations (server) and the public renderer. Pure functions, no DOM.
 *
 * We never store or render admin-pasted HTML for videos. We pull the `src`
 * out of whatever was pasted, check it points at Facebook's plugin endpoint,
 * and render our own iframe around it.
 */

const FACEBOOK_HOSTS = new Set(["www.facebook.com", "web.facebook.com", "facebook.com", "m.facebook.com"]);

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&#38;/g, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x3d;/gi, "=");
}

function pluginVideoUrl(href: string): string {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(href)}&show_text=false`;
}

/**
 * Accepts a pasted `<iframe ...>` snippet, a bare plugin URL, or a plain
 * Facebook video / reel / watch URL. Returns a canonical
 * `https://www.facebook.com/plugins/...` URL, or null when it is not Facebook.
 * Idempotent: feeding the result back in returns the same string.
 */
export function extractEmbedSrc(input: string | undefined | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const iframe = trimmed.match(/<iframe[^>]*?\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  const candidate = decodeEntities(iframe ? (iframe[1] ?? iframe[2] ?? "") : trimmed);

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  if (url.hostname === "fb.watch") {
    return pluginVideoUrl(url.toString());
  }
  if (!FACEBOOK_HOSTS.has(url.hostname)) return null;

  if (url.pathname.startsWith("/plugins/video.php") || url.pathname.startsWith("/plugins/post.php")) {
    if (!url.searchParams.get("href")) return null;
    return `https://www.facebook.com${url.pathname}${url.search}`;
  }

  if (/\/(videos|reel|watch)(\/|\?|$)/.test(url.pathname + url.search) || url.pathname.startsWith("/share/v/")) {
    return pluginVideoUrl(url.toString());
  }
  return null;
}

export const IFRAME_ALLOW = "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share";

import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./model";
import { DEFAULT_ABOUT, DEFAULT_SITE_NAME } from "./lib/defaults";

/** Public: what the masthead, footer, About page and homepage lead need. */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();
    let featuredPostId = settings?.featuredPostId ?? null;
    if (featuredPostId) {
      const featured = await ctx.db.get(featuredPostId);
      if (!featured || featured.status !== "published") featuredPostId = null;
    }
    return {
      siteName: settings?.siteName?.trim() || DEFAULT_SITE_NAME,
      aboutText: settings?.aboutText?.trim() || DEFAULT_ABOUT,
      facebookUrl: settings?.facebookUrl ?? null,
      featuredPostId,
    };
  },
});

export const save = mutation({
  args: {
    siteName: v.string(),
    aboutText: v.string(),
    facebookUrl: v.string(),
    featuredPostId: v.optional(v.id("posts")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const fieldErrors: Record<string, string> = {};
    if (!args.siteName.trim()) fieldErrors.siteName = "The site needs a name.";
    if (args.siteName.length > 80) fieldErrors.siteName = "Keep the name under 80 characters.";
    if (args.aboutText.length > 20_000) fieldErrors.aboutText = "The About text is too long.";

    const facebookUrl = args.facebookUrl.trim();
    if (facebookUrl) {
      try {
        const url = new URL(facebookUrl);
        if (url.protocol !== "https:" || !/(^|\.)facebook\.com$|^fb\.com$/.test(url.hostname)) throw new Error();
      } catch {
        fieldErrors.facebookUrl = "Enter the full https:// address of the Facebook page.";
      }
    }

    if (args.featuredPostId) {
      const featured = await ctx.db.get(args.featuredPostId);
      if (!featured || featured.status !== "published") {
        fieldErrors.featuredPostId = "Only a published post can be featured.";
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      throw new ConvexError({ message: "Please fix the highlighted fields.", fieldErrors });
    }

    const doc = {
      siteName: args.siteName.trim(),
      aboutText: args.aboutText.trim(),
      facebookUrl: facebookUrl || undefined,
      featuredPostId: args.featuredPostId,
    };
    const existing = await ctx.db.query("settings").first();
    if (existing) await ctx.db.replace(existing._id, doc);
    else await ctx.db.insert("settings", doc);
  },
});

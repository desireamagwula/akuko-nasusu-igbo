import { mutation } from "./_generated/server";
import { requireAdmin } from "./model";

/** Short-lived URL the admin browser POSTs a thumbnail to (Convex file storage). */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

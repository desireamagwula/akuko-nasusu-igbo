import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Every admin query and mutation starts here. Sign-up is disabled and the only
 * account is the seeded owner, so "authenticated" means "the admin".
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError({ message: "You need to sign in." });
  }
  return userId;
}

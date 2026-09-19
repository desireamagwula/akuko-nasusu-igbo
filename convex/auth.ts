import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

/**
 * Single-owner authentication.
 *
 * There is exactly one admin account and it is created out-of-band with
 * `npx convex run seed:createAdmin`. Public sign-up is switched off here:
 * the Password provider calls `profile` for every flow, and we refuse
 * everything except "signIn". Password reset is not configured either, so the
 * only thing a visitor can do is sign in to the seeded account.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        if (params.flow !== "signIn") {
          throw new Error("This site does not accept new accounts.");
        }
        const email = String(params.email ?? "")
          .trim()
          .toLowerCase();
        return { email };
      },
    }),
  ],
});

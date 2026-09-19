import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isLogin = createRouteMatcher(["/admin/login"]);
const isAdmin = createRouteMatcher(["/admin", "/admin(.*)"]);

/**
 * Gatekeeper for the private dashboard. Anything under /admin needs a valid
 * session, otherwise the visitor is sent to the login page. (Every Convex
 * admin function checks the session again server-side; this only keeps the
 * screens themselves from rendering.)
 */
export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const signedIn = await convexAuth.isAuthenticated();
  if (isLogin(request) && signedIn) {
    return nextjsMiddlewareRedirect(request, "/admin");
  }
  if (isAdmin(request) && !isLogin(request) && !signedIn) {
    return nextjsMiddlewareRedirect(request, "/admin/login");
  }
});

export const config = {
  // /api/auth is the route Convex Auth uses to keep the session cookie fresh.
  matcher: ["/admin", "/admin/:path*", "/api/auth"],
};

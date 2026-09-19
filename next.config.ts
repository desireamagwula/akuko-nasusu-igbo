import type { NextConfig } from "next";

/**
 * Thumbnails live in Convex file storage. In the cloud that is served from
 * `<deployment>.convex.cloud`; a local `convex dev` backend serves from
 * localhost. We allow whichever host NEXT_PUBLIC_CONVEX_URL points at, plus
 * the wildcard so a preview deployment on Vercel keeps working.
 */
function convexImagePatterns(): NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> {
  const patterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [
    { protocol: "https", hostname: "*.convex.cloud", pathname: "/api/storage/**" },
  ];
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (url) {
    try {
      const { protocol, hostname, port } = new URL(url);
      patterns.push({
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
        port,
        pathname: "/api/storage/**",
      });
    } catch {
      // Malformed URL: the app will surface a clearer error at runtime.
    }
  }
  return patterns;
}

const convexHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_CONVEX_URL ?? "").hostname;
  } catch {
    return "";
  }
})();
const convexIsLocal = ["localhost", "127.0.0.1", "[::1]"].includes(convexHost);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: convexImagePatterns(),
    formats: ["image/avif", "image/webp"],
    // Next blocks optimising images from private IPs; only relax that when the
    // configured backend is a local dev deployment.
    dangerouslyAllowLocalIP: convexIsLocal,
  },
};

export default nextConfig;

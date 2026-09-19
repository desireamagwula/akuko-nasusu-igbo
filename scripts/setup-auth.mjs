#!/usr/bin/env node
/**
 * One-time auth setup for a Convex deployment.
 *
 * Generates an RSA key pair, then sets JWT_PRIVATE_KEY, JWKS and SITE_URL on
 * the deployment. Convex Auth uses these to sign and verify admin sessions.
 *
 *   npm run setup:auth                                  # your dev deployment (http://localhost:3000)
 *   npm run setup:auth:prod https://your-domain.com     # your PRODUCTION deployment
 *
 * The site address is a plain argument on purpose. Flags after "--" do not
 * survive Windows PowerShell 5.1: npm swallows "--prod" as its own option and
 * the script silently targets dev. So production has its own script name, and
 * the script says which deployment it is about to touch before it touches it.
 *
 * Extra words you can add at the end:
 *   dry-run   print the target and stop, changing nothing
 *   force     replace existing keys (this signs the admin out everywhere)
 */
import { generateKeyPairSync } from "node:crypto";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const prod = args.includes("--prod");
const force = args.includes("--force") || args.includes("force");
const dryRun = args.includes("--dry-run") || args.includes("dry-run");
const siteUrlIndex = args.indexOf("--site-url");
const positionalUrl = args.find((arg) => /^https?:\/\//i.test(arg));
const siteUrl =
  (siteUrlIndex >= 0 ? args[siteUrlIndex + 1] : positionalUrl) ??
  (prod ? undefined : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));

const where = prod ? "production" : "development";

// Say exactly what we are about to touch, before touching it.
console.log(`Target:   ${prod ? "PRODUCTION" : "development"} deployment`);
if (!siteUrl) {
  console.error("\nProduction needs your site address, for example:\n  npm run setup:auth:prod https://your-domain.com");
  process.exit(1);
}
console.log(`SITE_URL: ${siteUrl}`);
if (dryRun) {
  console.log("Dry run: nothing was changed.");
  process.exit(0);
}

// With CONVEX_DEPLOY_KEY set (CI, Vercel) the CLI already targets that deployment.
const target = prod && !process.env.CONVEX_DEPLOY_KEY ? ["--prod"] : [];

function convex(commandArgs, input) {
  return spawnSync("npx", ["convex", ...commandArgs], {
    input,
    encoding: "utf8",
    shell: process.platform === "win32",
    env: { ...process.env },
  });
}

function isSet(name) {
  const result = convex(["env", "get", name, ...target]);
  return result.status === 0 && result.stdout.trim().length > 0;
}

function setEnv(name, value) {
  // The value goes over stdin so it never appears in shell history or the process list.
  const result = convex(["env", "set", name, ...target], value);
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    console.error(`\nCould not set ${name} on the ${where} deployment. Are you logged in? Try: npx convex login`);
    process.exit(1);
  }
}

if (!force && isSet("JWT_PRIVATE_KEY") && isSet("JWKS")) {
  console.log(`Auth keys already exist on the ${where} deployment. Nothing changed (add the word "force" to replace them).`);
} else {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString().trimEnd().replace(/\n/g, " ");
  const jwk = publicKey.export({ format: "jwk" });
  const jwks = JSON.stringify({ keys: [{ use: "sig", ...jwk }] });

  setEnv("JWT_PRIVATE_KEY", pem);
  setEnv("JWKS", jwks);
  console.log(`Generated signing keys and set JWT_PRIVATE_KEY and JWKS on the ${where} deployment.`);
}

setEnv("SITE_URL", siteUrl);
console.log(`Set SITE_URL=${siteUrl} on the ${where} deployment.`);

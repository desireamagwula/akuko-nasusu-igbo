#!/usr/bin/env node
/**
 * One-time auth setup for a Convex deployment.
 *
 * Generates an RSA key pair, then sets JWT_PRIVATE_KEY, JWKS and SITE_URL on
 * the deployment. Convex Auth uses these to sign and verify admin sessions.
 *
 *   npm run setup:auth                       # your dev deployment
 *   npm run setup:auth -- --prod             # your production deployment
 *   npm run setup:auth -- --prod --site-url https://example.com
 *
 * Existing keys are never overwritten unless you pass --force, because
 * replacing them signs the admin out everywhere.
 */
import { generateKeyPairSync } from "node:crypto";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const prod = args.includes("--prod");
const force = args.includes("--force");
const siteUrlIndex = args.indexOf("--site-url");
const siteUrl = (siteUrlIndex >= 0 ? args[siteUrlIndex + 1] : undefined) ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// With CONVEX_DEPLOY_KEY set (CI, Vercel) the CLI already targets that deployment.
const target = prod && !process.env.CONVEX_DEPLOY_KEY ? ["--prod"] : [];

function convex(commandArgs, input) {
  const result = spawnSync("npx", ["convex", ...commandArgs], {
    input,
    encoding: "utf8",
    shell: process.platform === "win32",
    env: { ...process.env },
  });
  return result;
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
    console.error(`\nCould not set ${name}. Is \`npx convex dev\` configured for this project?`);
    process.exit(1);
  }
}

const where = prod ? "production" : "development";

if (!force && isSet("JWT_PRIVATE_KEY") && isSet("JWKS")) {
  console.log(`Auth keys already exist on the ${where} deployment. Nothing changed (use --force to replace them).`);
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

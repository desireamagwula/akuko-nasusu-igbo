#!/usr/bin/env node
/**
 * Creates the single admin account, asking for the email and password.
 *
 *   npm run admin:create                # your dev deployment
 *   npm run admin:create -- --prod      # your production deployment
 *
 * Why a script instead of typing `npx convex run seed:createAdmin '{...}'`?
 * On Windows the JSON argument gets mangled by PowerShell and cmd, and a
 * password containing a space or a quote breaks it. Here the values are passed
 * to the Convex CLI as a proper argument array, so no shell ever parses them,
 * and the password never lands in your shell history.
 */
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import readline from "node:readline";

const convexBin = fileURLToPath(new URL("../node_modules/convex/bin/main.js", import.meta.url));
const prod = process.argv.includes("--prod");

// One reader for the whole session, so piped input and real typing behave the same.
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
const lines = rl[Symbol.asyncIterator]();
let muted = false;
if (process.stdin.isTTY) {
  const write = rl._writeToOutput.bind(rl);
  // While the password is typed, echo nothing.
  rl._writeToOutput = (text) => (muted ? undefined : write(text));
}

async function ask(question, { hidden = false } = {}) {
  process.stdout.write(question);
  muted = hidden && Boolean(process.stdin.isTTY);
  const { value } = await lines.next();
  muted = false;
  if (hidden && process.stdin.isTTY) process.stdout.write("\n");
  return value ?? "";
}

console.log(`Creating the admin account on the ${prod ? "PRODUCTION" : "development"} deployment.`);
const email = (await ask("Email: ")).trim();
const password = await ask("Password (at least 12 characters, hidden): ", { hidden: true });
rl.close();

if (!email || !password) {
  console.error("Both an email and a password are required.");
  process.exit(1);
}

const args = [convexBin, "run", ...(prod ? ["--prod"] : []), "seed:createAdmin", JSON.stringify({ email, password })];
const result = spawnSync(process.execPath, args, { stdio: "inherit" });
process.exit(result.status ?? 1);

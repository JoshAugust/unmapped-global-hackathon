#!/usr/bin/env node
/**
 * generate-spa-index.mjs
 * Copies the built index.html into sub-paths for SPA routing on GitHub Pages.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DIST = join(import.meta.dirname, "..", "dist", "client");
const indexPath = join(DIST, "index.html");

if (!existsSync(indexPath)) {
  console.error("dist/client/index.html not found — run vite build first.");
  process.exit(1);
}

// SPA routes that need their own index.html for direct navigation
const routes = [
  "passport",
  "results",
  "policymaker",
  "compare",
  "education",
  "crosswalk",
  "coverage",
  "infrastructure",
  "methodology",
  "demo",
  "readiness",
  "configure",
  "dashboard",
];

for (const route of routes) {
  const dir = join(DIST, route);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  copyFileSync(indexPath, join(dir, "index.html"));
}

console.log(`✅ SPA index.html copied to ${routes.length} route directories.`);

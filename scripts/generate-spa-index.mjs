#!/usr/bin/env node
/**
 * generate-spa-index.mjs
 * 
 * Since TanStack Start + Cloudflare produces SSR output without index.html,
 * we generate a minimal SPA shell that loads the client JS/CSS.
 * The client-side router handles all navigation.
 */
import { readdirSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIST = join(import.meta.dirname, "..", "dist", "client");
const assetsDir = join(DIST, "assets");

if (!existsSync(assetsDir)) {
  console.error("dist/client/assets/ not found — run vite build first.");
  process.exit(1);
}

const base = "/unmapped-global-hackathon/";

// Read the server manifest to find the correct entry files
const serverManifestPath = join(import.meta.dirname, "..", "dist", "server", ".vite", "manifest.json");
let clientEntryFile = null;
let cssFiles = [];

// Get all client assets
const files = readdirSync(assetsDir);

// Find CSS files
cssFiles = files.filter(f => f.endsWith(".css"));

// Find the main index JS files — these are the entry points  
// The main bundle is typically the largest index-*.js
const indexJsFiles = files.filter(f => f.startsWith("index-") && f.endsWith(".js"));

// Also find start-*.js which bootstraps TanStack
const startJsFiles = files.filter(f => f.startsWith("start-") && f.endsWith(".js"));

// Find the manifest chunk
const manifestJsFiles = files.filter(f => f.includes("tanstack-start-manifest") && f.endsWith(".js"));

// Build module preload tags for all entry chunks
const allEntryJs = [...manifestJsFiles, ...startJsFiles, ...indexJsFiles];

const cssTags = cssFiles.map(f => `    <link rel="stylesheet" crossorigin href="${base}assets/${f}">`).join("\n");
const scriptTags = allEntryJs.map(f => `    <script type="module" crossorigin src="${base}assets/${f}"></script>`).join("\n");
const preloadTags = allEntryJs.map(f => `    <link rel="modulepreload" crossorigin href="${base}assets/${f}">`).join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>UNMAPPED — Map informal skills to economic opportunity</title>
    <meta name="description" content="See what your work skills are really worth — and where they could take you. 6 countries, 8 languages, 174K+ records." />
    <meta property="og:title" content="UNMAPPED — Skills to Opportunity" />
    <meta property="og:description" content="Map informal skills to economic opportunity across LMICs" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://joshuaaugustine.page/unmapped/" />
    <link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />
${cssTags}
${preloadTags}
  </head>
  <body>
    <div id="root"></div>
${scriptTags}
    <script>
      // SPA redirect handler — picks up path stored by 404.html
      (function() {
        var redirect = sessionStorage.getItem('redirect');
        if (redirect) {
          sessionStorage.removeItem('redirect');
          if (redirect !== window.location.pathname) {
            window.history.replaceState(null, '', redirect);
          }
        }
      })();
    </script>
  </body>
</html>
`;

writeFileSync(join(DIST, "index.html"), html);
console.log("✅ Created dist/client/index.html");
console.log(`   CSS: ${cssFiles.length} files`);
console.log(`   JS entries: ${allEntryJs.length} files`);

// Copy to all route directories for direct navigation (GitHub Pages serves index.html per-directory)
const routes = [
  "passport", "results", "policymaker", "compare", "education",
  "crosswalk", "coverage", "infrastructure", "methodology", "demo",
  "readiness", "configure", "dashboard",
];

const indexPath = join(DIST, "index.html");
for (const route of routes) {
  const dir = join(DIST, route);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  copyFileSync(indexPath, join(dir, "index.html"));
}

console.log(`✅ SPA index.html copied to ${routes.length} route directories.`);

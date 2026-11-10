#!/usr/bin/env node
// IronLog build script
// Bundles src/main.jsx → dist/index.html (served by GitHub Pages)
// Run with: npm run build

const fs   = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const DIST_DIR = path.join(__dirname, 'dist');
const OUT_DIST = path.join(DIST_DIR, 'index.html');
const OUT_ROOT = path.join(__dirname, 'index.html');

// ── 1. Build final JS bundle ──────────────────────────────────────────
const BUILD_TS = Date.now();
const FRONT_MUSCLE_SVG = fs.readFileSync(path.join(__dirname, 'assets', 'anatomy', 'front-muscle-map.svg'), 'utf8');
const REAR_MUSCLE_SVG = fs.readFileSync(path.join(__dirname, 'assets', 'anatomy', 'rear-muscle-map.svg'), 'utf8');
const bundle = esbuild.buildSync({
  entryPoints: [path.join(__dirname, 'src', 'main.jsx')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2018'],
  write: false,
  banner: {
    js: `const APP_BUILD = ${BUILD_TS};\nconst FRONT_MUSCLE_SVG = ${JSON.stringify(FRONT_MUSCLE_SVG)};\nconst REAR_MUSCLE_SVG = ${JSON.stringify(REAR_MUSCLE_SVG)};`,
  },
  logLevel: 'warning',
});
const appJs = bundle.outputFiles[0].text.replace(/<\/script>/g, '<\\/script>');
fs.writeFileSync(path.join(__dirname, 'version.json'), JSON.stringify({ v: BUILD_TS }), 'utf8');

// ── 2. App icon (base64 PNG, embedded) ────────────────────────────────
// To update the icon: replace assets/app-icon.png with a 180×180 opaque PNG.
const ICON_B64 = fs.readFileSync(path.join(__dirname, 'assets', 'app-icon.png')).toString('base64');

// ── 3. Assemble HTML ─────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
  <title>IronLog</title>
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
  <meta name="apple-mobile-web-app-title" content="IronLog">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#0a0a0a">
  <link rel="apple-touch-icon" href="data:image/png;base64,${ICON_B64}">
  <link rel="icon" type="image/png" href="data:image/png;base64,${ICON_B64}">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap">
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
  <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <style>
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
    html,body{margin:0;padding:0;background:#0a0a0a;height:100%;overflow-x:hidden;}
    #root{min-height:100vh;}
  </style>
</head>
<body>
  <div id="root">
    <div style="min-height:100vh;background:#0a0a0a;display:flex;align-items:center;justify-content:center;">
      <span style="font-family:monospace;color:#f59e0b;letter-spacing:3px;font-size:14px;">IRONLOG&#8230;</span>
    </div>
  </div>
  <script>
${appJs}
  </script>
</body>
</html>`;

fs.mkdirSync(DIST_DIR, { recursive: true });
fs.writeFileSync(OUT_DIST, html, 'utf8');
fs.writeFileSync(OUT_ROOT, html, 'utf8');

const sizeKb = (fs.statSync(OUT_DIST).size / 1024).toFixed(1);
console.log(`✓ Built dist/index.html and index.html (${sizeKb} KB)`);

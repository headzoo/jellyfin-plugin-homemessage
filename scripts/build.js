// Build script for the typescript files.
const esbuild = require('esbuild');
const path = require('node:path');
const fs = require('node:fs');

const JS_DIR = path.resolve('../Jellyfin.Plugin.HomeMessage/Web/js');
const OUT_DIR = path.join(JS_DIR, 'build');

const entryPoints = ['boot.ts', 'home.ts', 'config.ts', 'messages.ts'].map((f) =>
  path.join(JS_DIR, f),
);

// Optional: helpful diagnostics if CI breaks again
for (const f of entryPoints) {
  if (!fs.existsSync(f)) {
    console.error(`[build] entry missing: ${f}`);
  }
}

const args = new Set(process.argv.slice(2));
const watch = args.has('--watch') || args.has('-w');
const prod =
  args.has('--prod') || args.has('--production') || process.env.NODE_ENV === 'production';

const options = {
  entryPoints,
  outdir: OUT_DIR,
  bundle: true,
  format: 'iife',
  target: ['es2015'],
  platform: 'browser',
  sourcemap: true,
  minify: prod,
  logLevel: 'info',
};

(async () => {
  if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log(`[esbuild] watching ${JS_DIR} -> ${OUT_DIR}${prod ? ' (minified)' : ''}`);
    process.stdin.resume();
  } else {
    await esbuild.build(options);
    console.log(
      `[esbuild] built ${entryPoints.length} entries -> ${OUT_DIR}${prod ? ' (minified)' : ''}`,
    );
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

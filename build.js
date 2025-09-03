// Build script for the typescript files.
const esbuild = require('esbuild');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const JS_DIR = path.join(ROOT, 'Jellyfin.Plugin.HomeMessage', 'Web', 'js');
const OUT_DIR = path.join(JS_DIR, 'build');

const entryPoints = ['boot.ts', 'home.ts', 'config.ts', 'messages.ts'].map((f) =>
  path.join(JS_DIR, f),
);

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
  sourcemap: true, // you used sourcemaps in both dev & prod
  minify: prod,
  logLevel: 'info',
};

(async () => {
  if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log(`[esbuild] watching ${JS_DIR} -> ${OUT_DIR}${prod ? ' (minified)' : ''}`);
    // keep process alive when run under `concurrently`
    process.stdin.resume();
    process.on('SIGINT', async () => {
      await ctx.dispose();
      process.exit(0);
    });
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

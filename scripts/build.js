// Build script for the typescript (JS) and sass (CSS) bundles.
const esbuild = require('esbuild');
const path = require('node:path');
const fs = require('node:fs');
const { sassPlugin } = require('esbuild-sass-plugin');

const JS_DIR = path.resolve('Jellyfin.Plugin.HomeMessage/Web/js');
const CSS_DIR = path.resolve('Jellyfin.Plugin.HomeMessage/Web/css');
const OUT_JS_DIR = path.join(JS_DIR, 'build');
const OUT_CSS_DIR = path.join(CSS_DIR, 'build');

const jsEntryPoints = ['boot.ts', 'home.ts', 'config.ts', 'messages.ts'].map((f) =>
  path.join(JS_DIR, f),
);

const cssEntryPoints = fs
  .readdirSync(CSS_DIR)
  .filter((f) => /\.(scss|sass)$/.test(f)) // top-level only; ignores css/build
  .map((f) => path.join(CSS_DIR, f));

for (const f of jsEntryPoints) {
  if (!fs.existsSync(f)) console.error(`[build] JS entry missing: ${f}`);
}
for (const f of cssEntryPoints) {
  if (!fs.existsSync(f)) console.error(`[build] CSS entry missing: ${f}`);
}

const args = new Set(process.argv.slice(2));
const watch = args.has('--watch') || args.has('-w');
const prod =
  args.has('--prod') || args.has('--production') || process.env.NODE_ENV === 'production';

const jsOptions = {
  entryPoints: jsEntryPoints,
  outdir: OUT_JS_DIR,
  bundle: true,
  format: 'iife',
  target: ['es2015'],
  platform: 'browser',
  sourcemap: true,
  minify: prod,
  logLevel: 'info',
};

const cssOptions = {
  entryPoints: cssEntryPoints,
  outdir: OUT_CSS_DIR,
  bundle: true,
  // esbuild emits CSS files when the entries are .scss/.sass and sassPlugin is used
  sourcemap: true,
  minify: prod,
  logLevel: 'info',
  plugins: [sassPlugin()],
};

async function buildOnce() {
  await Promise.all([
    esbuild.build(jsOptions),
    cssEntryPoints.length ? esbuild.build(cssOptions) : Promise.resolve(),
  ]);
  console.log(
    `[esbuild] built -> JS:${OUT_JS_DIR}  CSS:${OUT_CSS_DIR}${prod ? ' (minified)' : ''}`,
  );
}

async function buildWatch() {
  const ctxs = [];

  const jsCtx = await esbuild.context(jsOptions);
  await jsCtx.watch();
  ctxs.push(jsCtx);

  if (cssEntryPoints.length) {
    const cssCtx = await esbuild.context(cssOptions);
    await cssCtx.watch();
    ctxs.push(cssCtx);
  }

  console.log(
    `[esbuild] watching -> JS:${OUT_JS_DIR}  CSS:${OUT_CSS_DIR}${prod ? ' (minified)' : ''}`,
  );
  process.stdin.resume();
}

(async () => {
  if (watch) {
    await buildWatch();
  } else {
    await buildOnce();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

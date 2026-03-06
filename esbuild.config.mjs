import esbuild from 'esbuild';

const isProd = process.env.NODE_ENV === 'production';

esbuild.build({
  entryPoints: ['main.ts'],
  bundle: true,
  external: ['obsidian', 'electron', '@codemirror/autocomplete', '@codemirror/collab',
    '@codemirror/commands', '@codemirror/language', '@codemirror/lint',
    '@codemirror/search', '@codemirror/state', '@codemirror/view'],
  format: 'cjs',
  target: 'es2020',
  outfile: 'main.js',
  sourcemap: isProd ? false : 'inline',
  minify: isProd,
  platform: 'node',
  logLevel: 'info',
}).catch(() => process.exit(1));

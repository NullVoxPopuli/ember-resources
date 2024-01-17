import { resolve } from 'node:path';
import url from 'node:url';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { execaCommand } from 'execa';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    outDir: 'dist',
    // These targets are not "support".
    // A consuming app or library should compile further if they need to support
    // old browsers.
    target: ['esnext', 'firefox121'],
    // In case folks debug without sourcemaps
    //
    // TODO: do a dual build, split for development + production
    // where production is optimized for CDN loading via
    // https://limber.glimdown.com
    minify: false,
    sourcemap: true,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ember-resources',
      formats: ['es'],
      // the proper extensions will be added
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        '@ember/application',
        '@ember/helper',
        '@ember/modifier',
        '@ember/owner',
        '@ember/debug',
        '@ember/destroyable',
        '@embroider/macros',
        '@glimmer/tracking',
        '@glimmer/tracking/primitives/cache',
        '@glint/template',
        '@glint/template/-private/integration',
      ],
    },
  },
  plugins: [
    dts({
      rollupTypes: true,
      outDir: 'declarations',
    }),
    {
      name: 'use-weird-non-ESM-ember-convention',
      closeBundle: async () => {
        /**
         * https://github.com/microsoft/TypeScript/issues/56571#
         * README: https://github.com/NullVoxPopuli/fix-bad-declaration-output
         */
        await execaCommand(`pnpm fix-bad-declaration-output declarations/`, {
          stdio: 'inherit',
        });
        console.log('⚠️ Dangerously (but neededly) fixed bad declaration output from typescript');
      },
    },
  ],
});

import { resolve } from 'node:path';
import url from 'node:url';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { execaCommand } from 'execa';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    outDir: 'dist',
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
         * Related issues
         * - https://github.com/embroider-build/embroider/issues/1672
         * - https://github.com/embroider-build/embroider/pull/1572
         * - https://github.com/embroider-build/embroider/issues/1675
         *
         * Fixed in embroider@4 and especially @embroider/vite
         */
        await execaCommand('cp dist/index.mjs dist/index.js', { stdio: 'inherit' });
        console.log('⚠️ Incorrectly (but neededly) renamed MJS module to JS in a CJS package');

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

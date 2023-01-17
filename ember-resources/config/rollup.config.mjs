// @ts-nocheck
import ts from 'rollup-plugin-ts';
import copy from 'rollup-plugin-copy';
import { DEFAULT_EXTENSIONS } from '@babel/core';

import { Addon } from '@embroider/addon-dev/rollup';
import { defineConfig } from 'rollup';

const addon = new Addon({
  srcDir: 'src',
  destDir: 'dist',
});

export default defineConfig({
  // https://github.com/rollup/rollup/issues/1828
  watch: {
    chokidar: {
      usePolling: true,
    },
  },
  output: {
    ...addon.output(),
    sourcemap: true,

    // Remove when we no longer import
    //
    // 8   │ import '@glint/template/-private/integration';
    hoistTransitiveImports: false,
  },
  plugins: [
    // The modules compiled by rollup.
    // For public/private access, use the package.json exports field
    addon.publicEntrypoints(['**/*.js']),

    ts({
      // can be changed to swc or other transpilers later
      // but we need the ember plugins converted first
      // (template compilation and co-location)
      transpiler: 'babel',
      babelConfig: './babel.config.cjs',
      browserslist: ['last 2 firefox versions', 'last 2 chrome versions'],
      tsconfig: {
        fileName: 'tsconfig.json',
        hook: (config) => ({
          ...config,
          declaration: false,
          noEmitOnError: false,
        }),
      },
    }),

    addon.dependencies(),

    // Start with a clean output directory before building
    addon.clean(),

    copy({
      targets: [{ src: '../../README.md', dest: 'README.md' }],
    }),
  ],
});

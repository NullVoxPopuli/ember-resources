// @ts-nocheck
import ts from 'rollup-plugin-ts';
import copy from 'rollup-plugin-copy';
import npmRun from 'rollup-plugin-npm-run'
import ts2 from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
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
    // These are the modules that users should be able to import from your
    // addon. Anything not listed here may get optimized away.
    addon.publicEntrypoints(['**/*.js']),

    // These are the modules that should get reexported into the traditional
    // "app" tree. Things in here should also be in publicEntrypoints above, but
    // not everything in publicEntrypoints necessarily needs to go here.
    // addon.appReexports([]),


    // Compiles the code, but not types
    // babel({ extensions: [ ...DEFAULT_EXTENSIONS, '.ts' ], babelHelpers: 'bundled' }),
    // Rollup and babel, by default, don't know how to resolve TS
    // resolve({ extensions: [...DEFAULT_EXTENSIONS, '.ts']}),
    // Build the types, separately
    // npmRun('build:types'),

    // ts2({
    //   // Some people like messy development, I opt-in to strict compilation here.
    //   abortOnError: true,
    //   // uses "declarationDir" from tsconfig.json
    //   useTsconfigDeclarationDir: true,
    // }),
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

    // Follow the V2 Addon rules about dependencies. Your code can import from
    // `dependencies` and `peerDependencies` as well as standard Ember-provided
    // package names.
    addon.dependencies(),

    // Ensure that standalone .hbs files are properly integrated as Javascript.
    // addon.hbs(),

    // addons are allowed to contain imports of .css files, which we want rollup
    // to leave alone and keep in the published output.
    // addon.keepAssets(['**/*.css']),

    // Start with a clean output directory before building
    addon.clean(),

    copy({
      targets: [{ src: '../../README.md', dest: 'README.md' }],
    }),
  ],
});

// @ts-nocheck
import ts from 'rollup-plugin-ts';
import { Addon } from '@embroider/addon-dev/rollup';
import copy from 'rollup-plugin-copy';
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
    addon.publicEntrypoints(['**/*.ts']),

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
          declaration: true,
          // TODO: these aren't being generated? why?
          declarationMap: true,
          // See: https://devblogs.microsoft.com/typescript/announcing-typescript-4-5/#beta-delta
          // Allows us to use `exports` to define types per export
          // However, it was declared as not ready
          // as a result, we need extra / fallback references in the package.json
          declarationDir: './dist',
        }),
      },
    }),

    // Follow the V2 Addon rules about dependencies. Your code can import from
    // `dependencies` and `peerDependencies` as well as standard Ember-provided
    // package names.
    addon.dependencies(),

    // Start with a clean output directory before building
    addon.clean(),

    // Copy Readme and License into published package
    copy({
      targets: [
        { src: '../README.md', dest: '.' },
        { src: '../LICENSE.md', dest: '.' },
      ],
    }),
  ],
});

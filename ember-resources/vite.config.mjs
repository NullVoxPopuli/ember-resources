import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

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
  plugins: [dts({ rollupTypes: true, outDir: 'declarations' })],
});

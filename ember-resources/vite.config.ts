import { defineConfig } from 'vite';
import babel from 'vite-plugin-babel';
import checker from 'vite-plugin-checker';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    checker({ typescript: true }),
    babel(),
  ],
  resolve: {
    alias: {
      path: 'path-browserify',
      process: '',
      '@glimmer/debug': '_at-glimmer-debug.js'
    }
  }

})

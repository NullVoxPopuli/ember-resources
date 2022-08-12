import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    checker({ typescript: true })
  ],
  resolve: {
    alias: {
      path: 'path-browserify',
      process: '',
      '@glimmer/debug': '_at-glimmer-debug.js'
    }
  }

})

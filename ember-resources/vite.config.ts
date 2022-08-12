import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  define: {},
  resolve: {
    alias: {
      path: 'path-browserify',
      process: '',
      '@glimmer/debug': '_at-glimmer-debug.js'
    }
  }

})

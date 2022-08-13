import { defineConfig } from 'vite';
import { plugins } from './vite-plugin.mjs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    ...plugins(),
  ],
})

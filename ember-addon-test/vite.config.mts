import { defineConfig } from 'vite';
import { plugins } from './vite-plugin.mjs';


// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: [
      // path.join(__dirname, '**/*'),
      // process.cwd(),
    ]
  },
  plugins: [
    ...plugins(),
  ],
})

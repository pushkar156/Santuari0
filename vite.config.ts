import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    hmr: {
      port: 5173,
      clientPort: 5173,
    },
  },
  plugins: [
    react(),
    crx({ manifest }),
  ],
});

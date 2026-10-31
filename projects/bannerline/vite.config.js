import { defineConfig } from 'vite';

// Relative base so GitHub Pages project URL /bannerline/ resolves JS and CSS.
export default defineConfig({
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'static',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'static/app.js',
        chunkFileNames: 'static/[name].js',
        assetFileNames: 'static/[name][extname]',
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
});

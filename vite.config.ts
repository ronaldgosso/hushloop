import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import esbuild from 'esbuild';

function buildPreloadSync() {
  esbuild.buildSync({
    entryPoints: [path.resolve(__dirname, 'src/preload/index.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: path.resolve(__dirname, 'dist-electron/preload/index.cjs'),
    external: ['electron'],
  });
}

function preloadPlugin(): Plugin {
  return {
    name: 'build-preload',
    buildStart() {
      buildPreloadSync();
    },
    handleHotUpdate({ file, server }) {
      if (file.includes('src/preload')) {
        buildPreloadSync();
        server.ws.send({ type: 'full-reload' });
      }
    },
  };
}

export default defineConfig({
  root: path.resolve(__dirname, 'src/renderer'),
  publicDir: path.resolve(__dirname, 'src/renderer/public'),
  plugins: [
    react(),
    preloadPlugin(),
    electron([
      {
        entry: path.resolve(__dirname, 'src/main/index.ts'),
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron/main'),
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@main': path.resolve(__dirname, './src/main'),
      '@preload': path.resolve(__dirname, './src/preload'),
      '@renderer': path.resolve(__dirname, './src/renderer/src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});

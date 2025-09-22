// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
    plugins: [
        react(),
        {
            name: 'copy-manifest',
            writeBundle() {
                // Copy manifest.json to dist
                fs.copyFileSync(
                    resolve(__dirname, 'public/manifest.json'),
                    resolve(__dirname, 'dist/manifest.json')
                );
            }
        }
    ],
    build: {
        rollupOptions: {
            input: {
                sidepanel: resolve(__dirname, 'index.html'),
                background: resolve(__dirname, 'src/background/background.ts'),
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]',
            },
        },
        outDir: 'dist',
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
});
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// The 'fs' import is no longer needed.

export default defineConfig({
    plugins: [
        react(),
        // The custom 'copy-manifest' plugin has been removed.
        // Vite automatically copies files from the 'public' directory.
    ],
    build: {
        rollupOptions: {
            input: {
                sidepanel: resolve(__dirname, 'index.html'),
                background: resolve(__dirname, 'src/background/background.ts'),
                // Add the content script as a build input
                content: resolve(__dirname, 'src/content/content.ts'),
            },
            output: {
                // Keep the output filenames simple and at the root of the dist folder
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]',
            },
        },
        outDir: 'dist',
        // Ensure the output directory is cleared on each build
        emptyOutDir: true,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
});

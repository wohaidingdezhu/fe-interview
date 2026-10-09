import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { publicationPlugin } from './scripts/publication-plugin.mjs';

export default defineConfig({ plugins: [react(), publicationPlugin()], base: './' });

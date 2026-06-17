import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Chemins relatifs : marche en dev, en preview, et sur GitHub Pages
  // (qu'il soit servi à la racine ou sous un sous-chemin /repo/).
  base: './',
  server: {
    port: 5173,
    host: true,
  },
});

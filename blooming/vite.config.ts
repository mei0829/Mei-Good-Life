import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './'：部署在 https://mei0829.github.io/Mei-Good-Life/blooming/ 底下也能找到檔案
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  test: { environment: 'node' },
} as any);

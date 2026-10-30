import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base './' để bản build chạy được ở bất kỳ đường dẫn con nào (GitHub Pages: /<repo>/).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: { manualChunks: { katex: ['katex'], react: ['react', 'react-dom'] } },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});

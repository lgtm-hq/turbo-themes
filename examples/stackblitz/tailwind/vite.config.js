import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Preserve Vite 6.4.5's default instead of adopting Vite 8's newer baseline.
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
  },
});

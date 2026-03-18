import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/components/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    compilerOptions: {
      incremental: false,
    },
  },
  clean: true,
  sourcemap: true,
  external: ['react', 'react-dom', 'leaflet', 'react-leaflet', 'luxon'],
  // Don't bundle CSS - it will be copied separately
  loader: {
    '.css': 'file',
  },
});

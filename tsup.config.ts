import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'plugins/sorting': 'src/plugins/sorting.ts',
    'plugins/filtering': 'src/plugins/filtering.ts',
    'plugins/grouping': 'src/plugins/grouping.ts',
    'plugins/pivot': 'src/plugins/pivot.ts',
    'plugins/columnVisibility': 'src/plugins/columnVisibility.ts',
    'plugins/columnOrdering': 'src/plugins/columnOrdering.ts',
    'plugins/columnPinning': 'src/plugins/columnPinning.ts',
    'plugins/dndRow': 'src/plugins/dndRow.ts',
    'plugins/dndColumn': 'src/plugins/dndColumn.ts',
    'hooks/index': 'src/hooks/index.ts',
    'store/index': 'src/store/index.ts',
  },
  format: ['esm', 'cjs'],
  splitting: false,
  clean: true,
  treeshake: true,
  minify: true,
  sourcemap: false,
  dts: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
});

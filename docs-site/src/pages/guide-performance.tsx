import DocPage from '../components/DocPage';

export default function GuidePerformance() {
  return (
    <DocPage title="Performance Guide" subtitle="Optimization strategies for rendering large datasets with react-pivot-pro">
      <h2>Overview</h2>
      <p>react-pivot-pro is designed for performance out of the box with built-in caching, optimized sorting, and plugin-level memoization. This guide covers additional techniques for handling large datasets.</p>

      <h2>1. Use Virtualization</h2>
      <p>The single most impactful optimization. Only render rows visible in the viewport:</p>
      <pre><code>{`import { useVirtualRows } from 'react-pivot-pro';

const { virtualRows, totalSize } = useVirtualRows({
  count: table.rowModel.rows.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 35,
  overscan: 5,
});`}</code></pre>
      <p>This reduces DOM nodes from 100,000+ to ~20-30, regardless of data size.</p>

      <h2>2. Memoize Data and Columns</h2>
      <p>The hook uses reference equality to detect changes. Avoid recreating arrays on every render:</p>
      <pre><code>{`// Bad — new arrays every render
const table = usePivotTable({
  data: rawData.map(r => ({ ...r })),
  columns: [{ id: 'name', accessorKey: 'name', header: 'Name' }],
});

// Good — stable references
const data = useMemo(() => rawData, [rawData]);
const columns = useMemo(() => [
  { id: 'name', accessorKey: 'name', header: 'Name' },
], []);

const table = usePivotTable({ data, columns });`}</code></pre>

      <h2>3. Plugin Order Matters</h2>
      <p>Plugins execute in registration order. Place the most selective plugins first to reduce work for downstream plugins:</p>
      <pre><code>{`// Good: filter first, then sort fewer rows
plugins: [
  createFilteringPlugin(),  // Reduces row count
  createSortingPlugin(),    // Sorts fewer rows
  createGroupingPlugin(),   // Groups fewer rows
]`}</code></pre>

      <h2>4. Use accessorKey Over accessorFn</h2>
      <p><code>accessorKey</code> is faster because the engine pre-compiles value extraction. Only use <code>accessorFn</code> when you need computed values:</p>
      <pre><code>{`// Faster — pre-compiled path
{ id: 'name', accessorKey: 'name', header: 'Name' }

// Slower — function call per row per render
{ id: 'name', accessorFn: (row) => row.name, header: 'Name' }`}</code></pre>

      <h2>5. Disable Unused Features per Column</h2>
      <pre><code>{`{
  id: 'actions',
  header: 'Actions',
  enableSorting: false,
  enableFiltering: false,
}`}</code></pre>

      <h2>6. Debounce Filter Input</h2>
      <p>Filtering runs synchronously on every state change. Debounce text input to avoid excessive re-renders:</p>
      <pre><code>{`const [filterValue, setFilterValue] = useState('');
const debouncedFilter = useDebouncedValue(filterValue, 200);

useEffect(() => {
  table.filtering.setColumnFilter('name', debouncedFilter);
}, [debouncedFilter]);`}</code></pre>

      <h2>7. Control When Data Updates</h2>
      <p>The engine detects data changes by reference. If your data updates frequently but the table doesn't need to re-render, hold a stable reference:</p>
      <pre><code>{`const stableData = useRef(data);
if (data !== stableData.current) {
  stableData.current = data;
}

const table = usePivotTable({ data: stableData.current, columns });`}</code></pre>

      <h2>8. Use getCoreRowModel When Plugins Aren't Needed</h2>
      <pre><code>{`// If you don't need sorting/filtering, use the core model directly
const coreRows = table.getCoreRowModel().rows;
// Avoids running plugin transforms`}</code></pre>

      <h2>9. Aggregation Worker Threshold</h2>
      <p>The aggregation plugin supports a <code>workerThreshold</code> option to offload heavy aggregation to a Web Worker:</p>
      <pre><code>{`createAggregationPlugin({
  workerThreshold: 10000, // Use worker for 10k+ rows
})`}</code></pre>

      <h2>10. Production Mode</h2>
      <p>Column normalization warnings and other dev-only checks are automatically disabled when <code>NODE_ENV === 'production'</code>. Ensure your build sets this correctly.</p>

      <h2>Performance Checklist</h2>
      <ul>
        <li>[ ] Virtualization enabled for 1000+ rows</li>
        <li>[ ] Data and columns memoized with useMemo</li>
        <li>[ ] Filtering placed before sorting in plugin order</li>
        <li>[ ] accessorKey used instead of accessorFn where possible</li>
        <li>[ ] Unused sorting/filtering disabled on action columns</li>
        <li>[ ] Filter inputs debounced</li>
        <li>[ ] Production build with NODE_ENV=production</li>
      </ul>

      <h2>See Also</h2>
      <ul>
        <li><a href="#/plugin-virtualization">Virtualization Plugin</a></li>
        <li><a href="#/plugin-sorting">Sorting Plugin</a></li>
        <li><a href="#/plugin-filtering">Filtering Plugin</a></li>
      </ul>
    </DocPage>
  );
}

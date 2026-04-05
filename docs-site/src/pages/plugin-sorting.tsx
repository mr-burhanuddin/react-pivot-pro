import DocPage from '../components/DocPage';

export default function PluginSorting() {
  return (
    <DocPage title="Sorting Plugin" subtitle="Multi-column sorting with asc/desc cycling and event-based multi-sort support">
      <h2>Overview</h2>
      <p>The sorting plugin adds single and multi-column sorting to your pivot table. It cycles through asc → desc → unsorted and supports Shift+Click for multi-sort via a configurable event detector.</p>

      <h2>Installation</h2>
      <pre><code>{`import {
  createSortingPlugin,
  withSorting,
  useSorting,
} from 'react-pivot-pro';`}</code></pre>

      <h2>Basic Usage</h2>
      <pre><code>{`import { usePivotTable, createSortingPlugin, withSorting } from 'react-pivot-pro';

function SortableTable({ data, columns }) {
  const table = withSorting(
    usePivotTable({
      data,
      columns,
      plugins: [createSortingPlugin()],
    }),
  );

  return (
    <table>
      <thead>
        <tr>
          {table.columns.map(col => (
            <th
              key={col.id}
              onClick={() => table.sorting.toggleSorting(col.id)}
              style={{ cursor: 'pointer' }}
            >
              {col.header}
              {table.sorting.getIsSorted(col.id) === 'asc' && ' ↑'}
              {table.sorting.getIsSorted(col.id) === 'desc' && ' ↓'}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rowModel.rows.map(row => (
          <tr key={row.id}>
            {table.columns.map(col => (
              <td key={col.id}>{row.getValue(col.id)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}`}</code></pre>

      <h2>SortingApi Methods</h2>
      <table>
        <thead>
          <tr><th>Method</th><th>Return Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>getSorting()</code></td><td><code>SortingRule[]</code></td><td>Current sorting rules</td></tr>
          <tr><td><code>getSortedColumnIds()</code></td><td><code>string[]</code></td><td>IDs of currently sorted columns</td></tr>
          <tr><td><code>getIsSorted(id)</code></td><td><code>'asc' | 'desc' | false</code></td><td>Sort direction for a column</td></tr>
          <tr><td><code>setSorting(updater)</code></td><td><code>void</code></td><td>Set sorting rules directly or via updater function</td></tr>
          <tr><td><code>toggleSorting(id, multi?)</code></td><td><code>void</code></td><td>Toggle sort direction for a column</td></tr>
          <tr><td><code>clearSorting()</code></td><td><code>void</code></td><td>Remove all sorting rules</td></tr>
        </tbody>
      </table>

      <h2>SortingRule Type</h2>
      <pre><code>{`interface SortingRule {
  id: string;
  desc: boolean;
}`}</code></pre>

      <h2>Multi-Sort</h2>
      <p>By default, multi-sort is enabled when the <code>multi</code> parameter is truthy. Configure the event detector:</p>
      <pre><code>{`createSortingPlugin({
  isMultiSortEvent: (multi) => {
    // Only multi-sort when Shift key is held
    return Boolean(multi);
  },
})

// In your header click handler:
onClick={(e) => table.sorting.toggleSorting(col.id, e.shiftKey)}`}</code></pre>

      <h2>Using the Hook</h2>
      <pre><code>{`import { usePivotTable, createSortingPlugin, useSorting } from 'react-pivot-pro';

function MyTable({ data, columns }) {
  const table = usePivotTable({
    data,
    columns,
    plugins: [createSortingPlugin()],
  });

  const sorting = useSorting(table);

  return (
    <thead>
      <tr>
        {table.columns.map(col => (
          <th key={col.id} onClick={() => sorting.toggleSorting(col.id)}>
            {col.header}
            {sorting.getIsSorted(col.id) === 'asc' && ' ↑'}
            {sorting.getIsSorted(col.id) === 'desc' && ' ↓'}
          </th>
        ))}
      </tr>
    </thead>
  );
}`}</code></pre>

      <h2>Controlled Sorting</h2>
      <pre><code>{`const [sorting, setSorting] = useState<SortingRule[]>([]);

const table = withSorting(
  usePivotTable({
    data,
    columns,
    plugins: [createSortingPlugin()],
    state: { sorting },
    onStateChange: (next) => setSorting(next.sorting),
  }),
);`}</code></pre>

      <h2>How Sorting Works</h2>
      <p>The plugin uses an optimized sort with pre-extracted values and <code>Int32Array</code> index sorting for performance. It handles numbers, dates, booleans, and strings with locale-aware comparison. Null values sort to the end.</p>

      <h2>Disabling Sorting per Column</h2>
      <pre><code>{`{
  id: 'actions',
  header: 'Actions',
  enableSorting: false,
}`}</code></pre>

      <h2>See Also</h2>
      <ul>
        <li><a href="#/plugin-filtering">Filtering Plugin</a></li>
        <li><a href="#/plugin-grouping">Row Grouping Plugin</a></li>
        <li><a href="#/api-use-pivot-table">usePivotTable Hook</a></li>
      </ul>
    </DocPage>
  );
}

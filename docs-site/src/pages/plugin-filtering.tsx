import DocPage from '../components/DocPage';

export default function PluginFiltering() {
  return (
    <DocPage title="Filtering Plugin" subtitle="Column-level and global text filtering with customizable filter functions">
      <h2>Overview</h2>
      <p>The filtering plugin provides column-specific filters and a global search across all filterable columns. The default filter performs case-insensitive substring matching and supports array-based multi-value filtering.</p>

      <h2>Installation</h2>
      <pre><code>{`import {
  createFilteringPlugin,
  withFiltering,
  useFiltering,
} from 'react-pivot-pro';`}</code></pre>

      <h2>Basic Usage</h2>
      <pre><code>{`import { usePivotTable, createFilteringPlugin, withFiltering } from 'react-pivot-pro';

function FilterableTable({ data, columns }) {
  const table = withFiltering(
    usePivotTable({
      data,
      columns,
      plugins: [createFilteringPlugin()],
    }),
  );

  return (
    <div>
      {/* Global search */}
      <input
        type="text"
        placeholder="Search all columns..."
        onChange={(e) => table.filtering.setGlobalFilter(e.target.value)}
      />

      {/* Column filters */}
      <div>
        {table.columns.map(col => (
          <input
            key={col.id}
            placeholder={\`Filter \${col.header}...\`}
            onChange={(e) => table.filtering.setColumnFilter(col.id, e.target.value)}
          />
        ))}
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            {table.columns.map(col => <th key={col.id}>{col.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {table.rowModel.rows.map(row => (
            <tr key={col.id}>
              {table.columns.map(col => (
                <td key={col.id}>{row.getValue(col.id)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}`}</code></pre>

      <h2>FilteringApi Methods</h2>
      <table>
        <thead>
          <tr><th>Method</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>getColumnFilters()</code></td><td>Get all active column filters</td></tr>
          <tr><td><code>getGlobalFilter()</code></td><td>Get the current global filter value</td></tr>
          <tr><td><code>setColumnFilters(updater)</code></td><td>Set all column filters</td></tr>
          <tr><td><code>setGlobalFilter(value)</code></td><td>Set the global search value</td></tr>
          <tr><td><code>setColumnFilter(id, value)</code></td><td>Set or clear a single column filter</td></tr>
          <tr><td><code>resetColumnFilters()</code></td><td>Clear all column filters</td></tr>
          <tr><td><code>resetGlobalFilter()</code></td><td>Clear the global filter</td></tr>
          <tr><td><code>getFilteredColumnIds()</code></td><td>Get IDs of columns with active filters</td></tr>
        </tbody>
      </table>

      <h2>ColumnFilter Type</h2>
      <pre><code>{`interface ColumnFilter {
  id: string;
  value: unknown;
}`}</code></pre>

      <h2>Custom Filter Function</h2>
      <pre><code>{`createFilteringPlugin({
  rowFilterFn: (rowValue, filterValue, row) => {
    // Exact match
    return String(rowValue) === String(filterValue);
  },
  globalFilterFn: (row, globalFilter, columnIds) => {
    // Custom global search logic
    return columnIds.some(id => {
      const val = row.getValue(id);
      return String(val).toLowerCase().includes(String(globalFilter).toLowerCase());
    });
  },
})`}</code></pre>

      <h2>Array-Based Multi-Value Filter</h2>
      <p>Pass an array as the filter value to match any of the values:</p>
      <pre><code>{`// Filter to show only rows where region is 'North' or 'South'
table.filtering.setColumnFilter('region', ['North', 'South']);`}</code></pre>

      <h2>FilteringTableState</h2>
      <pre><code>{`interface FilteringTableState extends TableState {
  filters: ColumnFilter[];
  globalFilter?: unknown;
}`}</code></pre>

      <h2>Disabling Filtering per Column</h2>
      <pre><code>{`{
  id: 'id',
  accessorKey: 'id',
  header: 'ID',
  enableFiltering: false,
}`}</code></pre>

      <h2>How Filtering Works</h2>
      <p>The default filter normalizes both row and filter values to lowercase trimmed strings, then checks for substring inclusion. Null and empty filter values pass all rows. The plugin validates filter column IDs against the current column set and warns about invalid filters in development mode.</p>

      <h2>See Also</h2>
      <ul>
        <li><a href="#/plugin-sorting">Sorting Plugin</a></li>
        <li><a href="#/plugin-grouping">Row Grouping Plugin</a></li>
        <li><a href="#/api-use-pivot-table">usePivotTable Hook</a></li>
      </ul>
    </DocPage>
  );
}

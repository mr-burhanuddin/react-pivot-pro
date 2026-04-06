import DocPage from '../components/DocPage';

export default function PluginFiltering() {
  return (
    <DocPage title="Filtering Plugin" subtitle="Column-level and global filtering with text, number, date, and enum filter types">
      <h2>Overview</h2>
      <p>The filtering plugin provides column-specific filters and a global search. It supports multiple filter types: text (contains, equals, startsWith, etc.), number (comparisons, between), date (ranges, empty checks), and enum (multi-select). All filters are composable with AND logic.</p>

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
      <input
        type="text"
        placeholder="Search all columns..."
        onChange={(e) => table.filtering.setGlobalFilter(e.target.value)}
      />

      {table.columns.map(col => (
        <input
          key={col.id}
          placeholder={\`Filter \${col.header}...\`}
          onChange={(e) => table.filtering.setColumnFilter(col.id, e.target.value)}
        />
      ))}

      <table>
        {/* ... */}
      </table>
    </div>
  );
}`}</code></pre>

      <h2>Filter Types</h2>

      <h3>Text Filters</h3>
      <p>Use <code>setTextFilter</code> for text-based filtering with operators:</p>
      <pre><code>{`// Contains (default behavior)
table.filtering.setTextFilter('name', 'contains', 'John');

// Exact match
table.filtering.setTextFilter('email', 'equals', 'john@example.com');

// Starts with
table.filtering.setTextFilter('city', 'startsWith', 'San');

// Ends with
table.filtering.setTextFilter('domain', 'endsWith', '.com');

// Does not contain
table.filtering.setTextFilter('description', 'notContains', 'deprecated');`}</code></pre>

      <h3>Number Filters</h3>
      <p>Use <code>setNumberFilter</code> for numeric comparisons:</p>
      <pre><code>{`// Greater than
table.filtering.setNumberFilter('amount', 'gt', 1000);

// Less than or equal
table.filtering.setNumberFilter('quantity', 'lte', 10);

// Equal
table.filtering.setNumberFilter('year', 'eq', 2024);

// Not equal
table.filtering.setNumberFilter('status', 'neq', 0);

// Between (inclusive range)
table.filtering.setNumberFilter('revenue', 'between', 10000, 50000);

// Greater than or equal
table.filtering.setNumberFilter('rating', 'gte', 4.5);

// Less than
table.filtering.setNumberFilter('discount', 'lt', 0.2);`}</code></pre>

      <h3>Date Filters</h3>
      <p>Use <code>setDateFilter</code> for date-based filtering:</p>
      <pre><code>{`// On a specific date
table.filtering.setDateFilter('createdAt', 'eq', '2024-01-15');

// After a date
table.filtering.setDateFilter('shippedAt', 'gt', '2024-03-01');

// Before a date
table.filtering.setDateFilter('orderDate', 'lt', '2024-06-01');

// Date range
table.filtering.setDateFilter('deliveryDate', 'between', '2024-01-01', '2024-03-31');

// Is empty
table.filtering.setDateFilter('completedAt', 'isEmpty', '');

// Is not empty
table.filtering.setDateFilter('cancelledAt', 'isNotEmpty', '');`}</code></pre>

      <h3>Enum Filters (Multi-Select)</h3>
      <p>Use <code>setEnumFilter</code> for multi-value selection:</p>
      <pre><code>{`// Match any of the values (OR within filter)
table.filtering.setEnumFilter('region', 'in', ['North', 'South', 'East']);

// Exclude values (NOT IN)
table.filtering.setEnumFilter('status', 'notIn', ['cancelled', 'refunded']);`}</code></pre>

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
          <tr><td><code>setColumnFilter(id, filter)</code></td><td>Set or clear a single column filter</td></tr>
          <tr><td><code>setTextFilter(id, operator, value)</code></td><td>Set a text filter with operator</td></tr>
          <tr><td><code>setNumberFilter(id, operator, value, value2?)</code></td><td>Set a number filter with comparison</td></tr>
          <tr><td><code>setDateFilter(id, operator, value, value2?)</code></td><td>Set a date filter with operator</td></tr>
          <tr><td><code>setEnumFilter(id, operator, values)</code></td><td>Set an enum filter with values</td></tr>
          <tr><td><code>resetColumnFilters()</code></td><td>Clear all column filters</td></tr>
          <tr><td><code>resetGlobalFilter()</code></td><td>Clear the global filter</td></tr>
          <tr><td><code>getFilteredColumnIds()</code></td><td>Get IDs of columns with active filters</td></tr>
        </tbody>
      </table>

      <h2>Filter Types</h2>
      <pre><code>{`type FilterType = 'text' | 'number' | 'date' | 'enum';

type TextFilterOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'notContains';
type NumberFilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';
type DateFilterOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'between' | 'isEmpty' | 'isNotEmpty';
type EnumFilterOperator = 'in' | 'notIn';`}</code></pre>

      <h2>ColumnFilter Types</h2>
      <pre><code>{`interface ColumnFilter<TType extends FilterType = FilterType> {
  id: string;
  type: TType;
  value: TType extends 'text' ? TextFilterValue
    : TType extends 'number' ? NumberFilterValue
    : TType extends 'date' ? DateFilterValue
    : EnumFilterValue;
}

interface TextFilterValue {
  operator: TextFilterOperator;
  value: string;
}

interface NumberFilterValue {
  operator: NumberFilterOperator;
  value: number;
  value2?: number; // For 'between' operator
}

interface DateFilterValue {
  operator: DateFilterOperator;
  value: string; // ISO date format
  value2?: string; // For 'between' operator
}

interface EnumFilterValue {
  operator: EnumFilterOperator;
  values: string[];
}`}</code></pre>

      <h2>Legacy Filter Support</h2>
      <p>The plugin maintains backward compatibility with the legacy filter format:</p>
      <pre><code>{`// Legacy format (still works)
table.filtering.setColumnFilter('name', 'John');

// Equivalent to:
table.filtering.setTextFilter('name', 'contains', 'John');

// Legacy array format (for OR behavior)
table.filtering.setColumnFilter('status', ['active', 'pending']);`}</code></pre>

      <h2>Combined Filters (AND Logic)</h2>
      <p>Filters are combined with AND logic - a row must pass ALL active filters:</p>
      <pre><code>{`// Show rows where:
// - region is 'North' OR 'South' AND
// - amount > 1000 AND
// - orderDate is after 2024-01-01
table.filtering.setEnumFilter('region', 'in', ['North', 'South']);
table.filtering.setNumberFilter('amount', 'gt', 1000);
table.filtering.setDateFilter('orderDate', 'gt', '2024-01-01');`}</code></pre>

      <h2>Complete Example: Filter UI</h2>
      <pre><code>{`function FilterPanel({ table, columns }) {
  return (
    <div className="filter-panel">
      {/* Global search */}
      <input
        type="text"
        placeholder="Search..."
        onChange={(e) => table.filtering.setGlobalFilter(e.target.value)}
      />

      {/* Column-specific filters */}
      {columns.map(col => {
        if (col.type === 'text') {
          return (
            <select
              key={col.id}
              onChange={(e) => {
                if (e.target.value === 'none') {
                  table.filtering.setColumnFilter(col.id, null);
                } else {
                  table.filtering.setTextFilter(col.id, 'contains', e.target.value);
                }
              }}
            >
              <option value="none">All {col.header}</option>
              <option value="A">Starts with A</option>
              <option value="B">Starts with B</option>
            </select>
          );
        }
        
        if (col.type === 'number') {
          return (
            <div key={col.id}>
              <input
                type="number"
                placeholder="Min"
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    table.filtering.setNumberFilter(col.id, 'gte', val);
                  }
                }}
              />
              <input
                type="number"
                placeholder="Max"
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    table.filtering.setNumberFilter(col.id, 'lte', val);
                  }
                }}
              />
            </div>
          );
        }
        
        return null;
      })}

      {/* Clear all filters */}
      <button onClick={() => {
        table.filtering.resetColumnFilters();
        table.filtering.resetGlobalFilter();
      }}>
        Clear Filters
      </button>
    </div>
  );
}`}</code></pre>

      <h2>Disabling Filtering per Column</h2>
      <pre><code>{`{
  id: 'id',
  accessorKey: 'id',
  header: 'ID',
  enableFiltering: false,
}`}</code></pre>

      <h2>How Filtering Works</h2>
      <p>The filtering pipeline:</p>
      <ol>
        <li>Column filters are applied first (AND logic between different columns)</li>
        <li>Global filter is applied last to remaining rows</li>
        <li>Filters are memoized for performance</li>
        <li>Invalid filter column IDs are warned in development mode</li>
      </ol>

      <h2>See Also</h2>
      <ul>
        <li><a href="#/plugin-sorting">Sorting Plugin</a></li>
        <li><a href="#/plugin-aggregation">Aggregation Plugin</a></li>
        <li><a href="#/plugin-grouping">Row Grouping Plugin</a></li>
        <li><a href="#/api-use-pivot-table">usePivotTable Hook</a></li>
      </ul>
    </DocPage>
  );
}

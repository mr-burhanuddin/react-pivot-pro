import DocPage from "../components/DocPage";

export default function PluginFiltering() {
  return (
    <DocPage
      title="Filtering Plugin"
      subtitle="Column-level and global filtering with multiple filter types and operators"
    >
      <h2>Overview</h2>
      <p>
        The filtering plugin provides column-specific filters and a global
        search across all filterable columns. It supports multiple filter types
        (text, number, date, enum) with various operators for each type.
      </p>

      <h2>Installation</h2>
      <pre>
        <code>{`import {
  createFilteringPlugin,
  withFiltering,
  useFiltering,
} from 'react-pivot-pro';`}</code>
      </pre>

      <h2>Basic Usage</h2>
      <pre>
        <code>{`import { usePivotTable, createFilteringPlugin, withFiltering } from 'react-pivot-pro';

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
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {table.columns.map(col => (
                <td key={col.id}>{row.getValue(col.id)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}`}</code>
      </pre>

      <h2>Filter Types and Operators</h2>
      <p>
        The plugin supports different filter types per column, each with
        specific operators:
      </p>

      <h3>Text Filters</h3>
      <table>
        <thead>
          <tr>
            <th>Operator</th>
            <th>Description</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>contains</code> (default)
            </td>
            <td>Case-insensitive substring match</td>
            <td>"Widget" matches "Widget A"</td>
          </tr>
          <tr>
            <td>
              <code>startsWith</code>
            </td>
            <td>Value starts with filter text</td>
            <td>"Soft" matches "Software"</td>
          </tr>
          <tr>
            <td>
              <code>endsWith</code>
            </td>
            <td>Value ends with filter text</td>
            <td>"Pro" matches "Tool Pro"</td>
          </tr>
          <tr>
            <td>
              <code>equals</code>
            </td>
            <td>Exact case-insensitive match</td>
            <td>"Hardware" only matches "Hardware"</td>
          </tr>
          <tr>
            <td>
              <code>notEquals</code>
            </td>
            <td>Does not equal</td>
            <td>Excludes matching values</td>
          </tr>
        </tbody>
      </table>

      <h3>Number Filters</h3>
      <table>
        <thead>
          <tr>
            <th>Operator</th>
            <th>Description</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>eq</code> (default)
            </td>
            <td>Equal to</td>
            <td>
              <code>{`{ filterType: 'number', operator: 'eq', value: 100 }`}</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>neq</code>
            </td>
            <td>Not equal to</td>
            <td>Excludes exact matches</td>
          </tr>
          <tr>
            <td>
              <code>gt</code>
            </td>
            <td>Greater than</td>
            <td>Revenue {">"} 10000</td>
          </tr>
          <tr>
            <td>
              <code>gte</code>
            </td>
            <td>Greater than or equal</td>
            <td>Units {">="} 100</td>
          </tr>
          <tr>
            <td>
              <code>lt</code>
            </td>
            <td>Less than</td>
            <td>Margin {"<"} 50</td>
          </tr>
          <tr>
            <td>
              <code>lte</code>
            </td>
            <td>Less than or equal</td>
            <td>Cost {"<="} 500</td>
          </tr>
          <tr>
            <td>
              <code>between</code>
            </td>
            <td>Range (inclusive)</td>
            <td>{`{ filterType: 'number', operator: 'between', value: [100, 500] }`}</td>
          </tr>
        </tbody>
      </table>

      <h3>Date Filters</h3>
      <table>
        <thead>
          <tr>
            <th>Operator</th>
            <th>Description</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>eq</code> (default)
            </td>
            <td>Equal to date</td>
            <td>Exact date match</td>
          </tr>
          <tr>
            <td>
              <code>neq</code>
            </td>
            <td>Not equal to date</td>
            <td>Excludes exact matches</td>
          </tr>
          <tr>
            <td>
              <code>gt</code>
            </td>
            <td>After date</td>
            <td>After specified date</td>
          </tr>
          <tr>
            <td>
              <code>gte</code>
            </td>
            <td>On or after date</td>
            <td>From specified date</td>
          </tr>
          <tr>
            <td>
              <code>lt</code>
            </td>
            <td>Before date</td>
            <td>Before specified date</td>
          </tr>
          <tr>
            <td>
              <code>lte</code>
            </td>
            <td>On or before date</td>
            <td>Until specified date</td>
          </tr>
          <tr>
            <td>
              <code>between</code>
            </td>
            <td>Date range</td>
            <td>{`{ filterType: 'date', operator: 'between', value: [startDate, endDate] }`}</td>
          </tr>
        </tbody>
      </table>

      <h3>Enum Filters (Multi-Select)</h3>
      <table>
        <thead>
          <tr>
            <th>Operator</th>
            <th>Description</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>in</code> (default)
            </td>
            <td>Value in array</td>
            <td>{`{ filterType: 'enum', value: ['North', 'South'] }`}</td>
          </tr>
          <tr>
            <td>
              <code>notIn</code>
            </td>
            <td>Value not in array</td>
            <td>Excludes specified values</td>
          </tr>
        </tbody>
      </table>

      <h2>Enhanced setColumnFilter</h2>
      <p>
        The <code>setColumnFilter</code> method accepts optional filterType and
        operator parameters:
      </p>
      <pre>
        <code>{`// Text filter (default)
table.filtering.setColumnFilter('region', 'North');
table.filtering.setColumnFilter('region', 'North', 'text', 'equals');

// Number filter
table.filtering.setColumnFilter('revenue', 1000, 'number', 'gt');
table.filtering.setColumnFilter('revenue', [500, 2000], 'number', 'between');

// Date filter
table.filtering.setColumnFilter('orderDate', new Date('2024-01-01'), 'date', 'gte');

// Enum filter (multi-select)
table.filtering.setColumnFilter('region', ['North', 'South'], 'enum', 'in');`}</code>
      </pre>

      <h2>FilteringApi Methods</h2>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>getColumnFilters()</code>
            </td>
            <td>Get all active column filters</td>
          </tr>
          <tr>
            <td>
              <code>getGlobalFilter()</code>
            </td>
            <td>Get the current global filter value</td>
          </tr>
          <tr>
            <td>
              <code>setColumnFilters(updater)</code>
            </td>
            <td>Set all column filters</td>
          </tr>
          <tr>
            <td>
              <code>setGlobalFilter(value)</code>
            </td>
            <td>Set the global search value</td>
          </tr>
          <tr>
            <td>
              <code>setColumnFilter(id, value, filterType?, operator?)</code>
            </td>
            <td>Set filter with type and operator</td>
          </tr>
          <tr>
            <td>
              <code>resetColumnFilters()</code>
            </td>
            <td>Clear all column filters</td>
          </tr>
          <tr>
            <td>
              <code>resetGlobalFilter()</code>
            </td>
            <td>Clear the global filter</td>
          </tr>
          <tr>
            <td>
              <code>getFilteredColumnIds()</code>
            </td>
            <td>Get IDs of columns with active filters</td>
          </tr>
        </tbody>
      </table>

      <h2>ColumnFilter Type</h2>
      <pre>
        <code>{`interface ColumnFilter {
  id: string;
  value: unknown;
  filterType?: 'text' | 'number' | 'date' | 'enum' | 'boolean';
  operator?: 'contains' | 'startsWith' | 'endsWith' | 'equals' | 'notEquals' |
             'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' |
             'in' | 'notIn';
}`}</code>
      </pre>

      <h2>Custom Filter Function</h2>
      <p>For advanced use cases, you can provide a custom filter function:</p>
      <pre>
        <code>{`createFilteringPlugin({
  rowFilterFn: (rowValue, filterValue, filter, row) => {
    // filter contains: { id, value, filterType, operator }
    // row is the full row object
    return String(rowValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
  },
  globalFilterFn: (row, globalFilter, columnIds) => {
    // Custom global search logic
    return columnIds.some(id => {
      const val = row.getValue(id);
      return String(val).toLowerCase().includes(String(globalFilter).toLowerCase());
    });
  },
})`}</code>
      </pre>

      <h2>Array-Based Multi-Value Filter</h2>
      <p>
        Pass an array as the filter value to match any of the values (text
        filters use OR logic):
      </p>
      <pre>
        <code>{`// Filter to show only rows where region is 'North' or 'South'
table.filtering.setColumnFilter('region', ['North', 'South']);
table.filtering.setColumnFilter('region', ['North', 'South'], 'enum', 'in');

// Number range using 'between' operator
table.filtering.setColumnFilter('revenue', [1000, 5000], 'number', 'between');`}</code>
      </pre>

      <h2>FilteringTableState</h2>
      <pre>
        <code>{`interface FilteringTableState extends TableState {
  filters: ColumnFilter[];
  globalFilter?: unknown;
}`}</code>
      </pre>

      <h2>Disabling Filtering per Column</h2>
      <pre>
        <code>{`{
  id: 'id',
  accessorKey: 'id',
  header: 'ID',
  enableFiltering: false,
}`}</code>
      </pre>

      <h2>How Filtering Works</h2>
      <p>
        The plugin validates filter column IDs against the current column set
        and warns about invalid filters in development mode. Filters are applied
        in order (AND logic) - a row must pass all active filters to be
        included.
      </p>

      <h2>See Also</h2>
      <ul>
        <li>
          <a href="#/plugin-sorting">Sorting Plugin</a>
        </li>
        <li>
          <a href="#/plugin-grouping">Row Grouping Plugin</a>
        </li>
        <li>
          <a href="#/api-use-pivot-table">usePivotTable Hook</a>
        </li>
      </ul>
    </DocPage>
  );
}

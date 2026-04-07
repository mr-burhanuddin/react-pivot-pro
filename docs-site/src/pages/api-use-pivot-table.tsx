import DocPage from "../components/DocPage";

export default function ApiUsePivotTable() {
  return (
    <DocPage
      title="usePivotTable"
      subtitle="Core hook that builds a typed row model from raw data and applies plugins in sequence"
    >
      <h2>Signature</h2>
      <pre>
        <code>{`function usePivotTable<TData extends RowData, TState extends TableState = TableState>(
  options: PivotTableOptions<TData, TState>,
): PivotTableInstance<TData, TState>`}</code>
      </pre>

      <h2>Options</h2>
      <table>
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>data</code>
            </td>
            <td>
              <code>TData[]</code>
            </td>
            <td>Yes</td>
            <td>Raw data array to render</td>
          </tr>
          <tr>
            <td>
              <code>columns</code>
            </td>
            <td>
              <code>ColumnDef&lt;TData&gt;[]</code>
            </td>
            <td>Yes</td>
            <td>Column definitions</td>
          </tr>
          <tr>
            <td>
              <code>state</code>
            </td>
            <td>
              <code>Partial&lt;TState&gt;</code>
            </td>
            <td>No</td>
            <td>Controlled state</td>
          </tr>
          <tr>
            <td>
              <code>initialState</code>
            </td>
            <td>
              <code>Partial&lt;TState&gt;</code>
            </td>
            <td>No</td>
            <td>Initial uncontrolled state</td>
          </tr>
          <tr>
            <td>
              <code>onStateChange</code>
            </td>
            <td>
              <code>(next, prev) =&gt; void</code>
            </td>
            <td>No</td>
            <td>State change callback</td>
          </tr>
          <tr>
            <td>
              <code>plugins</code>
            </td>
            <td>
              <code>PivotTablePlugin&lt;TData, TState&gt;[]</code>
            </td>
            <td>No</td>
            <td>Plugin instances</td>
          </tr>
          <tr>
            <td>
              <code>getRowId</code>
            </td>
            <td>
              <code>(row, index) =&gt; string</code>
            </td>
            <td>No</td>
            <td>Custom row ID generator</td>
          </tr>
          <tr>
            <td>
              <code>defaultColumn</code>
            </td>
            <td>
              <code>Partial&lt;ColumnDef&lt;TData&gt;&gt;</code>
            </td>
            <td>No</td>
            <td>Defaults merged into every column</td>
          </tr>
        </tbody>
      </table>

      <h2>Return Value</h2>
      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>state</code>
            </td>
            <td>
              <code>TState</code>
            </td>
            <td>Current merged state</td>
          </tr>
          <tr>
            <td>
              <code>setState</code>
            </td>
            <td>
              <code>(updater: Updater&lt;TState&gt;) =&gt; void</code>
            </td>
            <td>State updater</td>
          </tr>
          <tr>
            <td>
              <code>columns</code>
            </td>
            <td>
              <code>Column&lt;TData&gt;[]</code>
            </td>
            <td>Normalized column model</td>
          </tr>
          <tr>
            <td>
              <code>rowModel</code>
            </td>
            <td>
              <code>RowModel&lt;TData&gt;</code>
            </td>
            <td>Transformed rows ready for render</td>
          </tr>
          <tr>
            <td>
              <code>getState</code>
            </td>
            <td>
              <code>() =&gt; TState</code>
            </td>
            <td>Get current state snapshot</td>
          </tr>
          <tr>
            <td>
              <code>getCoreRowModel</code>
            </td>
            <td>
              <code>() =&gt; RowModel&lt;TData&gt;</code>
            </td>
            <td>Untransformed row model</td>
          </tr>
          <tr>
            <td>
              <code>getRowModel</code>
            </td>
            <td>
              <code>() =&gt; RowModel&lt;TData&gt;</code>
            </td>
            <td>Plugin-transformed row model</td>
          </tr>
          <tr>
            <td>
              <code>registerPlugin</code>
            </td>
            <td>
              <code>(plugin) =&gt; void</code>
            </td>
            <td>Register plugin at runtime</td>
          </tr>
          <tr>
            <td>
              <code>unregisterPlugin</code>
            </td>
            <td>
              <code>(name) =&gt; boolean</code>
            </td>
            <td>Remove plugin at runtime</td>
          </tr>
          <tr>
            <td>
              <code>getPlugin</code>
            </td>
            <td>
              <code>(name) =&gt; Plugin | undefined</code>
            </td>
            <td>Get plugin by name</td>
          </tr>
          <tr>
            <td>
              <code>getAllPlugins</code>
            </td>
            <td>
              <code>() =&gt; Plugin[]</code>
            </td>
            <td>List all registered plugins</td>
          </tr>
        </tbody>
      </table>

      <h2>Basic Usage</h2>
      <pre>
        <code>{`import { usePivotTable } from 'react-pivot-pro';

interface Sale {
  id: number;
  region: string;
  product: string;
  amount: number;
}

function SalesTable({ data }: { data: Sale[] }) {
  const table = usePivotTable<Sale>({
    data,
    columns: [
      { id: 'region', accessorKey: 'region', header: 'Region' },
      { id: 'product', accessorKey: 'product', header: 'Product' },
      { id: 'amount', accessorKey: 'amount', header: 'Amount' },
    ],
  });

  return (
    <table>
      <thead>
        <tr>
          {table.columns.map(col => (
            <th key={col.id}>{col.header}</th>
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
}`}</code>
      </pre>

      <h2>With Plugins</h2>
      <pre>
        <code>{`import { usePivotTable, createSortingPlugin, createFilteringPlugin } from 'react-pivot-pro';

const table = usePivotTable<Sale>({
  data,
  columns,
  plugins: [
    createSortingPlugin(),
    createFilteringPlugin(),
  ],
  initialState: {
    sorting: [{ id: 'amount', desc: true }],
  },
});`}</code>
      </pre>

      <h2>Controlled State</h2>
      <pre>
        <code>{`const [sorting, setSorting] = useState<SortingRule[]>([]);

const table = usePivotTable<Sale>({
  data,
  columns,
  state: { sorting },
  onStateChange: (next) => setSorting(next.sorting),
});`}</code>
      </pre>

      <h2>See Also</h2>
      <ul>
        <li>
          <a href="#/api-column-def">ColumnDef Type</a>
        </li>
        <li>
          <a href="#/api-plugin-api">Plugin API</a>
        </li>
        <li>
          <a href="#/plugin-sorting">Sorting Plugin</a>
        </li>
        <li>
          <a href="#/plugin-filtering">Filtering Plugin</a>
        </li>
      </ul>
    </DocPage>
  );
}

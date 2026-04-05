import DocPage from '../components/DocPage';

export default function ApiColumnDef() {
  return (
    <DocPage title="ColumnDef" subtitle="Type definition for column configuration in usePivotTable">
      <h2>Type Definition</h2>
      <pre><code>{`interface ColumnDef<TData extends RowData, TValue = unknown> {
  id?: string;
  accessorKey?: Extract<keyof TData, string>;
  accessorFn?: (originalRow: TData, index: number) => TValue;
  header?: string;
  meta?: Record<string, unknown>;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  cell?: (val: TValue, row: TData) => React.ReactNode;
  width?: number;
  pivot?: {
    aggregator: 'sum' | 'count' | 'avg' | 'min' | 'max';
  };
}`}</code></pre>

      <h2>Properties</h2>
      <table>
        <thead>
          <tr><th>Property</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>id</code></td><td><code>string</code></td><td>Unique column identifier. Auto-generated from accessorKey if omitted. Must match /^[a-zA-Z_$][a-zA-Z0-9_$]*$/ and be under 128 chars.</td></tr>
          <tr><td><code>accessorKey</code></td><td><code>Extract&lt;keyof TData, string&gt;</code></td><td>Dot-notation key path into the data row. Supports nested access like 'user.name'.</td></tr>
          <tr><td><code>accessorFn</code></td><td><code>(row, index) =&gt; TValue</code></td><td>Custom accessor function for computed or complex value extraction.</td></tr>
          <tr><td><code>header</code></td><td><code>string</code></td><td>Display label for the column header.</td></tr>
          <tr><td><code>meta</code></td><td><code>Record&lt;string, unknown&gt;</code></td><td>Arbitrary metadata attached to the column for plugin or consumer use.</td></tr>
          <tr><td><code>enableSorting</code></td><td><code>boolean</code></td><td>Whether this column can be sorted. Default: true.</td></tr>
          <tr><td><code>enableFiltering</code></td><td><code>boolean</code></td><td>Whether this column can be filtered. Default: true.</td></tr>
          <tr><td><code>cell</code></td><td><code>(val, row) =&gt; ReactNode</code></td><td>Custom cell renderer function.</td></tr>
          <tr><td><code>width</code></td><td><code>number</code></td><td>Suggested column width in pixels for virtualization.</td></tr>
          <tr><td><code>pivot</code></td><td><code>{'{'} aggregator {'}'}</code></td><td>Default aggregator for pivot mode on this column.</td></tr>
        </tbody>
      </table>

      <h2>Resolved Column Type</h2>
      <p>After normalization, columns become the <code>Column&lt;TData&gt;</code> type which guarantees an <code>id</code>:</p>
      <pre><code>{`interface Column<TData extends RowData, TValue = unknown>
  extends Omit<ColumnDef<TData, TValue>, 'id'> {
  id: string;
}`}</code></pre>

      <h2>Examples</h2>
      <h3>Basic accessorKey</h3>
      <pre><code>{`{ id: 'name', accessorKey: 'name', header: 'Name' }`}</code></pre>

      <h3>Nested accessorKey</h3>
      <pre><code>{`{ id: 'city', accessorKey: 'address.city', header: 'City' }`}</code></pre>

      <h3>Computed accessorFn</h3>
      <pre><code>{`{
  id: 'fullName',
  accessorFn: (row) => \`\${row.firstName} \${row.lastName}\`,
  header: 'Full Name',
}`}</code></pre>

      <h3>Custom cell renderer</h3>
      <pre><code>{`{
  id: 'status',
  accessorKey: 'status',
  header: 'Status',
  cell: (val) => (
    <span className={val === 'active' ? 'badge-green' : 'badge-gray'}>
      {val}
    </span>
  ),
}`}</code></pre>

      <h3>Pivot column with aggregation</h3>
      <pre><code>{`{
  id: 'revenue',
  accessorKey: 'revenue',
  header: 'Revenue',
  pivot: { aggregator: 'sum' },
}`}</code></pre>

      <h3>Column with metadata</h3>
      <pre><code>{`{
  id: 'date',
  accessorKey: 'date',
  header: 'Date',
  meta: { type: 'date', format: 'YYYY-MM-DD' },
}`}</code></pre>

      <h2>Normalization Rules</h2>
      <ul>
        <li>If <code>id</code> is missing, it is derived from <code>accessorKey</code></li>
        <li>Invalid IDs are replaced with <code>column_{'{'}index{'}'}</code> or <code>col_{'{'}index{'}'}</code></li>
        <li>Duplicate IDs get a numeric suffix to ensure uniqueness</li>
        <li><code>defaultColumn</code> options are merged into each column before normalization</li>
        <li>Prototype pollution keys (<code>__proto__</code>, <code>constructor</code>, <code>prototype</code>) are blocked in accessor paths</li>
      </ul>

      <h2>See Also</h2>
      <ul>
        <li><a href="#/api-use-pivot-table">usePivotTable Hook</a></li>
        <li><a href="#/api-plugin-api">Plugin API</a></li>
        <li><a href="#/column-features">Column Features</a></li>
      </ul>
    </DocPage>
  );
}

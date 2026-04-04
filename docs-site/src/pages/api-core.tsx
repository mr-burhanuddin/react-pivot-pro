export default function ApiCore() {
  return (
    <div className="doc-page">
      <header>
        <h1 className="page-title">Core API Reference</h1>
        <p className="page-desc">The primary hooks and types required to instantiate a table.</p>
      </header>

      <h2>usePivotTable</h2>
      <p>The main hook that creates the table instance.</p>
      <div className="table-shell">
        <table className="api-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>data</code></td>
              <td><code>T[]</code></td>
              <td>The array of objects forming the rows of the table.</td>
            </tr>
            <tr>
              <td><code>columns</code></td>
              <td><code>ColumnDef&lt;T&gt;[]</code></td>
              <td>The definition of columns, including accessors and renderers.</td>
            </tr>
            <tr>
              <td><code>plugins</code></td>
              <td><code>Plugin[]</code></td>
              <td>Optional array of plugins to add features like grouping or sorting.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>ColumnDef</h2>
      <p>The type used to define individual columns.</p>
      <div className="table-shell">
        <table className="api-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>id</code></td>
              <td><code>string</code></td>
              <td>Unique identifier for the column.</td>
            </tr>
            <tr>
              <td><code>accessorKey</code></td>
              <td><code>string</code></td>
              <td>Key of the property in the data object.</td>
            </tr>
            <tr>
              <td><code>accessorFn</code></td>
              <td><code>(row: T) =&gt; any</code></td>
              <td>Function to extract value if standard accessorKey is insufficient.</td>
            </tr>
            <tr>
              <td><code>cell</code></td>
              <td><code>(val: any, row: T) =&gt; ReactNode</code></td>
              <td>Custom render function for the cell content.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

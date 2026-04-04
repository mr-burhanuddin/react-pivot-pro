export default function ApiPlugins() {
  return (
    <div className="doc-page">
      <header>
        <h1 className="page-title">Plugin API Reference</h1>
        <p className="page-desc">Built-in plugins and the plugin architecture for writing custom extensions.</p>
      </header>
      
      <p>React Pivot Pro is built on a robust plugin system. Every advanced feature is a plugin.</p>

      <h2>Built-in Plugins</h2>
      <div className="callout">
        <code>{"import { useSorting, useFiltering, useGrouping, usePivot } from '@pivot/plugins';"}</code>
      </div>

      <h2>Plugin Contract</h2>
      <p>If you want to create your own plugin, it must adhere to the <code>Plugin</code> interface.</p>

      <div className="table-shell">
        <table className="api-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>name</code></td>
              <td>Unique name of the plugin string.</td>
            </tr>
            <tr>
              <td><code>processRows(rows, state)</code></td>
              <td>Transform, format, or sort rows during the processing pipeline.</td>
            </tr>
            <tr>
              <td><code>extendTable(table)</code></td>
              <td>Inject methods directly into the table instance.</td>
            </tr>
            <tr>
              <td><code>extendColumn(column)</code></td>
              <td>Inject methods or metadata into individual columns.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

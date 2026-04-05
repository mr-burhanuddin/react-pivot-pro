import DocPage from '../components/DocPage';

export default function ContributingChangelog() {
  return (
    <DocPage title="Changelog" subtitle="Release history and breaking changes for react-pivot-pro">
      <h2>Unreleased</h2>
      <h3>Added</h3>
      <ul>
        <li>Column pinning plugin (<code>createColumnPinningPlugin</code>)</li>
        <li>Column ordering plugin (<code>createColumnOrderingPlugin</code>)</li>
        <li>Aggregation plugin with 11 built-in aggregators</li>
        <li><code>AggregatorDropdown</code> component for per-column aggregator selection</li>
        <li>CSV export utility with formula injection protection</li>
        <li>Clipboard copy utility</li>
      </ul>

      <h2>v0.3.0</h2>
      <h3>Added</h3>
      <ul>
        <li>Row drag-and-drop plugin (<code>createDndRowPlugin</code>)</li>
        <li>Column drag-and-drop plugin (<code>createDndColumnPlugin</code>)</li>
        <li>Column visibility plugin (<code>createColumnVisibilityPlugin</code>)</li>
        <li>Plugin runtime management: <code>registerPlugin</code>, <code>unregisterPlugin</code>, <code>getPlugin</code>, <code>getAllPlugins</code></li>
        <li>Plugin caching engine with reference-equality-based invalidation</li>
      </ul>
      <h3>Changed</h3>
      <ul>
        <li>Sorting plugin now uses <code>Int32Array</code> index sorting for improved performance</li>
        <li>Column normalization validates IDs against prototype pollution patterns</li>
      </ul>

      <h2>v0.2.0</h2>
      <h3>Added</h3>
      <ul>
        <li>Row grouping plugin with expandable/collapsible groups</li>
        <li>Multi-level nested grouping support</li>
        <li>Group row metadata: <code>__group</code>, <code>__depth</code>, <code>__groupingColumnId</code>, <code>__groupingValue</code>, <code>__rowCount</code></li>
        <li>Filtering plugin with column and global filter support</li>
        <li>Custom filter function support via <code>rowFilterFn</code> and <code>globalFilterFn</code></li>
      </ul>

      <h2>v0.1.0</h2>
      <h3>Added</h3>
      <ul>
        <li>Core <code>usePivotTable</code> hook with plugin architecture</li>
        <li>Sorting plugin with multi-column sort support</li>
        <li>Zustand-based state management</li>
        <li>Controlled and uncontrolled state patterns</li>
        <li>Column normalization with duplicate ID detection</li>
        <li>Virtualization hooks (<code>useVirtualRows</code>, <code>useVirtualColumns</code>)</li>
        <li>TypeScript strict type definitions</li>
      </ul>

      <h2>Breaking Changes Summary</h2>
      <table>
        <thead>
          <tr><th>Version</th><th>Change</th><th>Migration</th></tr>
        </thead>
        <tbody>
          <tr><td>v0.3.0</td><td>Column IDs are now validated against prototype pollution patterns</td><td>Ensure column IDs match /^[a-zA-Z_$][a-zA-Z0-9_$]*$/</td></tr>
          <tr><td>v0.2.0</td><td>Group row IDs use new format: <code>group::path</code></td><td>Update any code parsing group IDs</td></tr>
        </tbody>
      </table>

      <h2>See Also</h2>
      <ul>
        <li><a href="#/contributing-setup">Development Setup</a></li>
        <li><a href="#/guide-migration">Migration Guide</a></li>
        <li><a href="#/contributing-plugin-authoring">Plugin Authoring Guide</a></li>
      </ul>
    </DocPage>
  );
}

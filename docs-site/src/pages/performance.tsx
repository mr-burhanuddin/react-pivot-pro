export default function Performance() {
  return (
    <div className="doc-page">
      <header>
        <h1 className="page-title">Performance & Scaling</h1>
        <p className="page-desc">Best practices for ensuring your tables remain fast and responsive with 100k+ rows.</p>
      </header>

      <h2>Virtualization</h2>
      <p>The most important step for scale is virtualization. The <code>useVirtualRows</code> plugin will only render the HTML TR elements that are currently visible within the scrolling viewport.</p>
      <div className="callout">
        Ensure you give your table wrapper a fixed height and `overflow: auto` or the virtualizer will not work!
      </div>

      <h2>Data Memoization</h2>
      <p>Always memoize your data and column definitions using <code>useMemo</code>. Failing to do so will cause the table core engine to recalculate internals on every React render.</p>

      <pre className="language-tsx">
<code dangerouslySetInnerHTML={{ __html: `// Good
const columns = useMemo(() => [
  { id: 'name', accessorKey: 'name' }
], []);

// Bad
const columns = [
  { id: 'name', accessorKey: 'name' }
];` }} />
      </pre>

      <h2>Bundle Splitting & Lazy Exports</h2>
      <p>If you don't use a plugin, don't import it! React Pivot Pro is heavily modularized to guarantee small payload sizes.</p>
    </div>
  );
}

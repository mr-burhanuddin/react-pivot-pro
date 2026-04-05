import DocPage from '../components/DocPage';

export default function PluginVirtualization() {
  return (
    <DocPage title="Virtualization" subtitle="Render only visible rows and columns using @tanstack/virtual-core for large datasets">
      <h2>Overview</h2>
      <p>react-pivot-pro provides <code>useVirtualRows</code> and <code>useVirtualColumns</code> hooks built on <code>@tanstack/virtual-core</code>. These hooks calculate which items are visible in the viewport and only render those, enabling smooth scrolling with hundreds of thousands of rows.</p>

      <h2>Installation</h2>
      <pre><code>{`import { useVirtualRows, useVirtualColumns } from 'react-pivot-pro';`}</code></pre>

      <h2>Virtual Rows</h2>
      <pre><code>{`import { usePivotTable, useVirtualRows } from 'react-pivot-pro';

function VirtualTable({ data, columns }) {
  const table = usePivotTable({ data, columns });
  const scrollRef = useRef<HTMLDivElement>(null);

  const { virtualRows, totalSize } = useVirtualRows({
    count: table.rowModel.rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 35, // row height in px
    overscan: 5, // render 5 extra rows above/below viewport
  });

  return (
    <div ref={scrollRef} style={{ height: 500, overflow: 'auto' }}>
      <div style={{ height: totalSize, position: 'relative' }}>
        {virtualRows.map(virtualRow => {
          const row = table.rowModel.rows[virtualRow.index];
          return (
            <div
              key={row.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: virtualRow.size,
                transform: \`translateY(\${virtualRow.start}px)\`,
              }}
            >
              {table.columns.map(col => (
                <span key={col.id}>{row.getValue(col.id)}</span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}`}</code></pre>

      <h2>Virtual Columns</h2>
      <pre><code>{`import { useVirtualColumns } from 'react-pivot-pro';

function VirtualColumnsTable({ data, columns }) {
  const table = usePivotTable({ data, columns });
  const scrollRef = useRef<HTMLDivElement>(null);

  const { virtualColumns, totalSize } = useVirtualColumns({
    count: table.columns.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => table.columns[index].width ?? 150,
    overscan: 3,
  });

  return (
    <div ref={scrollRef} style={{ overflow: 'auto' }}>
      <div style={{ width: totalSize, position: 'relative' }}>
        <table>
          <thead>
            <tr>
              {virtualColumns.map(virtualCol => {
                const col = table.columns[virtualCol.index];
                return (
                  <th
                    key={col.id}
                    style={{
                      position: 'absolute',
                      left: virtualCol.start,
                      width: virtualCol.size,
                    }}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          {/* ... rows ... */}
        </table>
      </div>
    </div>
  );
}`}</code></pre>

      <h2>Options</h2>
      <table>
        <thead>
          <tr><th>Option</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>count</code></td><td><code>number</code></td><td>Required</td><td>Total number of items</td></tr>
          <tr><td><code>getScrollElement</code></td><td><code>() =&gt; Element | null</code></td><td>Required</td><td>Scroll container ref</td></tr>
          <tr><td><code>estimateSize</code></td><td><code>(index) =&gt; number</code></td><td>Required</td><td>Estimated size per item in px</td></tr>
          <tr><td><code>scrollMode</code></td><td><code>'element' | 'window'</code></td><td><code>'element'</code></td><td>Scroll target type</td></tr>
          <tr><td><code>overscan</code></td><td><code>number</code></td><td>—</td><td>Extra items to render outside viewport</td></tr>
          <tr><td><code>paddingStart</code></td><td><code>number</code></td><td>0</td><td>Padding before first item</td></tr>
          <tr><td><code>paddingEnd</code></td><td><code>number</code></td><td>0</td><td>Padding after last item</td></tr>
          <tr><td><code>enabled</code></td><td><code>boolean</code></td><td>true</td><td>Enable/disable virtualization</td></tr>
          <tr><td><code>debug</code></td><td><code>boolean</code></td><td>false</td><td>Enable debug logging</td></tr>
        </tbody>
      </table>

      <h2>Return Value</h2>
      <pre><code>{`interface UseVirtualRowsResult {
  virtualizer: Virtualizer<Element, Element>;
  virtualRows: VirtualItem[];
  totalSize: number;
}`}</code></pre>

      <p>Each <code>VirtualItem</code> has:</p>
      <ul>
        <li><code>index</code> — The data index</li>
        <li><code>start</code> — Pixel offset from the start</li>
        <li><code>size</code> — Pixel size of the item</li>
        <li><code>key</code> — Unique key for React</li>
      </ul>

      <h2>Window Scrolling</h2>
      <pre><code>{`const { virtualRows, totalSize } = useVirtualRows({
  count: table.rowModel.rows.length,
  getScrollElement: () => window,
  estimateSize: () => 35,
  scrollMode: 'window',
});`}</code></pre>

      <h2>Dynamic Row Heights</h2>
      <pre><code>{`const { virtualRows, totalSize } = useVirtualRows({
  count: table.rowModel.rows.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: (index) => {
    const row = table.rowModel.rows[index];
    return row.values.__group ? 40 : 32;
  },
});`}</code></pre>

      <h2>Performance Tips</h2>
      <ul>
        <li>Use <code>overscan</code> of 3-5 for a good balance of performance and scroll smoothness</li>
        <li>Provide accurate <code>estimateSize</code> values to minimize layout shifts</li>
        <li>Keep cell renderers lightweight — they run frequently during scroll</li>
        <li>Combine with the sorting and filtering plugins to reduce the total row count before virtualization</li>
      </ul>

      <h2>See Also</h2>
      <ul>
        <li><a href="#/guide-performance">Performance Guide</a></li>
        <li><a href="#/plugin-drag-drop">Drag & Drop Plugins</a></li>
        <li><a href="#/api-use-pivot-table">usePivotTable Hook</a></li>
      </ul>
    </DocPage>
  );
}

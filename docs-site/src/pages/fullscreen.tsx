import { useState, useCallback, useEffect, useRef } from 'react';
import type { DocRoute } from '@/App';
import { usePivotTable } from '@pivot/core/usePivotTable';
import type { ColumnDef } from '@pivot/types';
import { createSortingPlugin, withSorting, type SortingTableState } from '@pivot/plugins/sorting';
import { fullscreen } from '@pivot/utils/clipboard';
import { exportCSV } from '@pivot/utils/exportCSV';
import { Maximize2, Minimize2, Download } from 'lucide-react';
import { salesData, type SalesRecord } from '@/examples/data';

interface Props {
  route: DocRoute;
}

type LocalState = SortingTableState;

const COLUMNS: ColumnDef<SalesRecord>[] = [
  { id: 'region', header: 'Region', accessorKey: 'region', enableSorting: true },
  { id: 'country', header: 'Country', accessorKey: 'country', enableSorting: true },
  { id: 'product', header: 'Product', accessorKey: 'product', enableSorting: true },
  { id: 'quarter', header: 'Quarter', accessorKey: 'quarter', enableSorting: true },
  { id: 'amount', header: 'Amount', accessorKey: 'amount', enableSorting: true },
  { id: 'quantity', header: 'Units', accessorKey: 'quantity', enableSorting: true },
  { id: 'marginPct', header: 'Margin %', accessorKey: 'marginPct', enableSorting: true },
];

function FullscreenTable() {
  const [isFs, setIsFs] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const baseTable = usePivotTable<SalesRecord, LocalState>({
    data: salesData,
    columns: COLUMNS,
    plugins: [createSortingPlugin()],
  });

  const table = withSorting(baseTable);

  useEffect(() => {
    setIsSupported(fullscreen.isSupported());
    
    const unsubscribe = fullscreen.onChange((inFullscreen) => {
      setIsFs(inFullscreen);
    });

    return () => unsubscribe();
  }, []);

  const handleToggle = useCallback(async () => {
    if (isFs) {
      await fullscreen.exit();
    } else if (tableRef.current) {
      await fullscreen.request(tableRef.current);
    }
  }, [isFs]);

  const handleExport = useCallback(() => {
    const rows = table.getRowModel().rows.map(row => row.original);
    exportCSV({ rows, fileName: 'fullscreen-export' }).download();
  }, [table]);

  const rows = table.getRowModel().rows;

  return (
    <div
      ref={containerRef}
      className="advanced-grid"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isFs ? '100vh' : 500,
        transition: 'height 0.3s ease',
      }}
    >
      <div
        className="advanced-toolbar"
        style={{
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
          Sales Data ({rows.length} rows)
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="ghost-btn"
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} />
            Export
          </button>
          {isSupported && (
            <button
              type="button"
              className="ghost-btn"
              onClick={handleToggle}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {isFs ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {isFs ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
          )}
        </div>
      </div>

      <div
        ref={tableRef}
        className="table-shell"
        style={{
          flex: 1,
          overflow: 'auto',
          margin: 0,
          border: 'none',
          borderRadius: 0,
        }}
      >
        <table className="demo-table">
          <thead>
            <tr>
              {table.columns.map((col) => (
                <th
                  key={col.id}
                  onClick={() => col.enableSorting && table.sorting.toggleSorting(col.id)}
                  style={{ cursor: col.enableSorting ? 'pointer' : 'default' }}
                >
                  {col.header ?? col.id}
                  {col.enableSorting && table.sorting.getIsSorted(col.id) === 'asc' && ' ↑'}
                  {col.enableSorting && table.sorting.getIsSorted(col.id) === 'desc' && ' ↓'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {table.columns.map((col) => (
                  <td key={`${row.id}_${col.id}`}>
                    {String((row.original as Record<string, unknown>)[col.id!] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFs && (
        <div
          style={{
            flexShrink: 0,
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface-muted)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            className="ghost-btn"
            onClick={handleToggle}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Minimize2 size={14} />
            Exit Fullscreen
          </button>
        </div>
      )}
    </div>
  );
}

export default function FullscreenDemo({ route }: Props) {
  return (
    <article className="doc-page">
      <p className="callout">{route.description}</p>

      <h2 id="demo">Live Demo</h2>
      <p>
        Click the Fullscreen button to expand the table to fullscreen mode. Press ESC or click Exit to return.
      </p>

      <FullscreenTable />

      <h2 id="usage">Usage</h2>
      <pre>
        <code>{`import { fullscreen } from 'react-pivot-pro';

// Check if fullscreen is supported
if (fullscreen.isSupported()) {
  // Request fullscreen on an element
  await fullscreen.request(document.getElementById('my-table'));
  
  // Check current state
  const isFs = fullscreen.isFullscreen();
  
  // Exit fullscreen
  await fullscreen.exit();
  
  // Toggle (request if not in fullscreen, exit if in fullscreen)
  await fullscreen.toggle(document.getElementById('my-table'));
  
  // Listen to fullscreen changes
  const unsubscribe = fullscreen.onChange((isFullscreen) => {
    console.log('Fullscreen changed:', isFullscreen);
  });
  
  // Cleanup
  unsubscribe();
}`}</code>
      </pre>

      <h2 id="api">API Reference</h2>
      <table className="api-table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>fullscreen.isSupported()</code></td>
            <td>Returns true if the browser supports fullscreen</td>
          </tr>
          <tr>
            <td><code>fullscreen.isFullscreen()</code></td>
            <td>Returns true if currently in fullscreen mode</td>
          </tr>
          <tr>
            <td><code>fullscreen.getElement()</code></td>
            <td>Returns the element currently in fullscreen, or null</td>
          </tr>
          <tr>
            <td><code>fullscreen.request(element)</code></td>
            <td>Request fullscreen on an element</td>
          </tr>
          <tr>
            <td><code>fullscreen.exit()</code></td>
            <td>Exit fullscreen mode</td>
          </tr>
          <tr>
            <td><code>fullscreen.toggle(element)</code></td>
            <td>Toggle fullscreen on/off for an element</td>
          </tr>
          <tr>
            <td><code>fullscreen.onChange(listener)</code></td>
            <td>Subscribe to fullscreen change events. Returns unsubscribe function.</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}

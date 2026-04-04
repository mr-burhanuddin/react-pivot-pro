import { useMemo, useState, useRef } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import { useVirtualRows } from '@pivot/hooks/useVirtualRows';
import { CodePreview } from '@/components/CodePreview';
import { generateData } from '@/examples/mockData';
import { TrendingUp, TrendingDown } from 'lucide-react';

const exampleCode = `
import { usePivotTable } from 'react-pivot-pro';
import { useVirtualRows } from 'react-pivot-pro';

const table = usePivotTable({ data, columns });

const { virtualRows, totalSize } = useVirtualRows({
  count: table.getRowModel().rows.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 36,
  overscan: 5,
});
`;

export default function FinancialSales() {
  const [data] = useState(() => generateData(10000));

  const columns = useMemo(() => [
    { id: 'id', header: 'Trade ID', accessorKey: 'id' },
    { id: 'date', header: 'Timestamp', accessorKey: 'date' },
    { id: 'company', header: 'Asset', accessorKey: 'company' },
    { id: 'amount', header: 'Value', accessorKey: 'amount' },
    { id: 'status', header: 'Status', accessorKey: 'status' },
  ], []);

  const table = usePivotTable({
    data,
    columns,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const { virtualRows, totalSize } = useVirtualRows({
    count: table.getRowModel().rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 36,
    overscan: 5,
  });

  return (
    <div className="doc-page">
      <header>
        <h1 className="page-title">High-Density Virtualization</h1>
        <p className="page-desc">Effortlessly render 10,000+ rows with 60fps scrolling performance.</p>
      </header>

      <CodePreview title="Virtualization Demo (10,000 Rows)" code={exampleCode}>
        <div className="advanced-grid">
          <div className="advanced-toolbar">
            <div className="toolbar-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <span className="live-dot" /> Rendering {table.getRowModel().rows.length} rows
              </div>
            </div>
          </div>
          <div ref={containerRef} className="table-shell" style={{ height: 400, overflow: 'auto', border: 'none', borderRadius: 0 }}>
            <div style={{ height: totalSize, width: '100%', position: 'relative' }}>
              <table className="demo-table" style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}>
                <thead>
                  <tr>
                    {table.columns.map((column) => (
                      <th key={column.id} style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--surface-muted)' }}>
                        {column.header ?? column.id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {virtualRows.map((virtualRow) => {
                    const row = table.getRowModel().rows[virtualRow.index];
                    const amount = row.getValue<number>('amount') ?? 0;
                    return (
                      <tr key={row.id} style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                        height: virtualRow.size,
                      }}>
                        <td>{String(row.getValue('id'))}</td>
                        <td>{String(row.getValue('date'))}</td>
                        <td>{String(row.getValue('company'))}</td>
                        <td>
                          <span style={{ 
                            color: amount < 0 ? 'var(--danger)' : 'var(--success)', 
                            fontWeight: 600, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 4 
                          }}>
                            {amount < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(amount))}
                          </span>
                        </td>
                        <td>{String(row.getValue('status'))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CodePreview>
    </div>
  );
}

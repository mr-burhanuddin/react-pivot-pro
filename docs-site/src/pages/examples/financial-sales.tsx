import { useMemo, useState, useRef } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import { useVirtualRows } from '@pivot/hooks/useVirtualRows';
import { CodePreview } from '@/components/CodePreview';
import { generateData } from '@/examples/mockData';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const exampleCode = `
import { usePivotTable } from 'react-pivot-pro/core';
import { useVirtualRows } from 'react-pivot-pro/plugins';
// ... full implementation with virtualization handling 100k+ rows
`;

export default function FinancialSales() {
  const [data] = useState(() => generateData(10000));

  const columns = useMemo(() => [
    { id: 'id', header: 'Trade ID', accessorKey: 'id', width: 120 },
    { id: 'date', header: 'Timestamp', accessorKey: 'date', width: 140 },
    { id: 'company', header: 'Asset', accessorKey: 'company', width: 160 },
    { 
      id: 'amount', 
      header: 'Value', 
      accessorKey: 'amount', 
      width: 140,
      cell: (val: number) => (
        <span style={{ color: val < 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          {val < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(val))}
        </span>
      )
    },
    { id: 'status', header: 'Status', accessorKey: 'status', width: 120 },
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
        <p className="page-desc">Effortlessly render 10,000+ rows of rapidly updating financial data with 60fps scrolling performance.</p>
      </header>

      <CodePreview title="Virtualization Demo (10,000 Rows)" code={exampleCode}>
        <div className="advanced-grid">
          <div className="advanced-toolbar">
            <div className="toolbar-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <span className="live-dot" /> Live Data Stream
              </div>
            </div>
            <div className="toolbar-group">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rendering {table.getRowModel().rows.length} rows</span>
            </div>
          </div>
          <div ref={containerRef} className="table-shell" style={{ height: 400, overflow: 'auto', border: 'none', borderRadius: 0 }}>
            <div style={{ height: totalSize, width: '100%', position: 'relative' }}>
              <table className="demo-table" style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}>
                <thead>
                  <tr>
                    {table.columns.map((column: any) => (
                      <th key={column.id} style={{ width: column.width, position: 'sticky', top: 0, zIndex: 1, background: 'var(--surface-muted)' }}>
                        {column.header ?? column.id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {virtualRows.map((virtualRow) => {
                    const row = table.getRowModel().rows[virtualRow.index] as any;
                    return (
                      <tr key={row.id} style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                        height: virtualRow.size,
                      }}>
                        {table.columns.map((column: any) => (
                          <td key={column.id}>
                            {column.cell ? column.cell(row.getValue(column.id), row) : String(row.getValue(column.id) ?? '')}
                          </td>
                        ))}
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

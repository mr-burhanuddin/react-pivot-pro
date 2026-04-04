import { useMemo, useState, useEffect } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import { CodePreview } from '@/components/CodePreview';
import { generateData, FinancialTransaction } from '@/examples/mockData';
import { Server, RefreshCw } from 'lucide-react';

const exampleCode = `
import { usePivotTable } from 'react-pivot-pro/core';
import { usePagination } from 'react-pivot-pro/plugins';
// ... full implementation with server-side operations
`;

export default function ServerSide() {
  const [data, setData] = useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate server fetch
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setData(generateData(25));
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const columns = useMemo(() => [
    { id: 'id', header: 'ID', accessorKey: 'id', width: 100 },
    { id: 'date', header: 'Date', accessorKey: 'date', width: 140 },
    { id: 'company', header: 'Company', accessorKey: 'company', width: 160 },
    { id: 'account', header: 'Account', accessorKey: 'account', width: 140 },
    { 
      id: 'amount', 
      header: 'Amount', 
      accessorKey: 'amount', 
      width: 120,
      cell: (val: number) => (
        <span style={{ color: val < 0 ? 'var(--danger)' : 'inherit' }}>
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)}
        </span>
      )
    },
    { id: 'status', header: 'Status', accessorKey: 'status', width: 120 },
  ], []);

  const table = usePivotTable({
    data,
    columns,
  });

  return (
    <div className="doc-page">
      <header>
        <h1 className="page-title">Server-Side Operations</h1>
        <p className="page-desc">Seamlessly integrate with your backend for server-side sorting, filtering, grouping, and pagination.</p>
      </header>

      <CodePreview title="Async Data Demo" code={exampleCode}>
        <div className="advanced-grid">
          <div className="advanced-toolbar">
            <div className="toolbar-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <Server size={16} /> Backend Connection 
              </div>
            </div>
            <div className="toolbar-group">
              <button className="ghost-btn icon-btn" onClick={() => {
                setIsLoading(true);
                setTimeout(() => { setData(generateData(25)); setIsLoading(false); }, 1000);
              }}><RefreshCw size={14} /> Refresh</button>
            </div>
          </div>
          <div className="table-shell" style={{ position: 'relative', height: 400, overflow: 'auto', border: 'none', borderRadius: 0 }}>
            {isLoading && (
              <div style={{ position: 'absolute', inset: 0, background: 'var(--surface)', opacity: 0.7, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw className="spin" size={32} />
              </div>
            )}
            <table className="demo-table">
              <thead>
                <tr>
                  {table.columns.map((column: any) => (
                    <th key={column.id} style={{ width: column.width }}>{column.header ?? column.id}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row: any) => (
                  <tr key={row.id}>
                    {table.columns.map((column: any) => (
                      <td key={column.id}>
                        {column.cell ? column.cell(row.getValue(column.id), row) : String(row.getValue(column.id) ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CodePreview>
    </div>
  );
}

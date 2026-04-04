import { useMemo, useState, useEffect } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import { CodePreview } from '@/components/CodePreview';
import { generateData, FinancialTransaction } from '@/examples/mockData';
import { Server, RefreshCw } from 'lucide-react';

const exampleCode = `
import { useState, useEffect } from 'react';
import { usePivotTable } from 'react-pivot-pro';

function ServerSideTable() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate server fetch
    fetchData().then(result => {
      setData(result);
      setIsLoading(false);
    });
  }, []);

  const table = usePivotTable({ data, columns });

  if (isLoading) return <div>Loading...</div>;
  
  return (
    <table>
      {table.getRowModel().rows.map(row => (
        <tr key={row.id}>
          {columns.map(col => (
            <td key={col.id}>{row.getValue(col.id)}</td>
          ))}
        </tr>
      ))}
    </table>
  );
}
`;

export default function ServerSide() {
  const [data, setData] = useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setData(generateData(25));
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const columns = useMemo(() => [
    { id: 'id', header: 'ID', accessorKey: 'id' },
    { id: 'date', header: 'Date', accessorKey: 'date' },
    { id: 'company', header: 'Company', accessorKey: 'company' },
    { id: 'account', header: 'Account', accessorKey: 'account' },
    { id: 'amount', header: 'Amount', accessorKey: 'amount' },
    { id: 'status', header: 'Status', accessorKey: 'status' },
  ], []);

  const table = usePivotTable({
    data,
    columns,
  });

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setData(generateData(25));
      setIsLoading(false);
    }, 1000);
  };

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
              <button className="ghost-btn icon-btn" onClick={handleRefresh}>
                <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Refresh
              </button>
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
                  {table.columns.map((column) => (
                    <th key={column.id}>{column.header ?? column.id}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {table.columns.map((column) => (
                      <td key={column.id}>
                        {column.id === 'amount'
                          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(row.getValue<number>(column.id) ?? 0)
                          : String(row.getValue(column.id) ?? '')}
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

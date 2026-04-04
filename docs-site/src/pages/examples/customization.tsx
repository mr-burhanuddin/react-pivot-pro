import { useMemo, useState, useRef } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import { CodePreview } from '@/components/CodePreview';
import { generateData } from '@/examples/mockData';
import { Settings, User, CreditCard } from 'lucide-react';

const exampleCode = `
import { usePivotTable } from 'react-pivot-pro/core';
// ... full implementation with custom cell rendering and styling
`;

export default function Customization() {
  const [data] = useState(() => generateData(20));

  const columns = useMemo(() => [
    { 
      id: 'customer', 
      header: 'Customer', 
      accessorKey: 'company',
      cell: (val: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'color-mix(in oklab, var(--primary) 20%, transparent)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {val.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{val}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {Math.floor(Math.random() * 10000)}</div>
          </div>
        </div>
      )
    },
    { 
      id: 'account', 
      header: 'Account Details', 
      accessorKey: 'account',
      cell: (val: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
          <CreditCard size={14} />
          <span>•••• {val.slice(-4)}</span>
        </div>
      )
    },
    { id: 'status', header: 'Status', accessorKey: 'status',
      cell: (val: string) => (
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: 4, 
          fontSize: '0.85rem', 
          fontWeight: 500,
          background: val === 'Completed' ? 'color-mix(in oklab, var(--success) 20%, transparent)' : 'color-mix(in oklab, var(--warning) 20%, transparent)',
          color: val === 'Completed' ? 'var(--success)' : 'var(--warning)',
        }}>
          {val}
        </span>
      )
    },
    {
      id: 'actions',
      header: '',
      accessorKey: 'id',
      cell: () => (
        <button className="ghost-btn icon-btn"><Settings size={16} /></button>
      )
    }
  ], []);

  const table = usePivotTable({
    data,
    columns,
  });

  return (
    <div className="doc-page">
      <header>
        <h1 className="page-title">Extensive Customization</h1>
        <p className="page-desc">Total control over rendering. Build gorgeous, complex cell layouts without fighting the framework.</p>
      </header>

      <CodePreview title="Custom Cells Demo" code={exampleCode}>
        <div className="advanced-grid" style={{ background: 'var(--surface-muted)', padding: 24, paddingBottom: 0 }}>
          <div className="table-shell" style={{ border: 'none', borderRadius: 0, background: 'var(--surface)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <table className="demo-table">
              <thead>
                <tr>
                  {table.columns.map((column: any) => (
                    <th key={column.id}>
                      {column.header ?? column.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.getRowModel().rows.slice(0, 5).map((row: any) => (
                  <tr key={row.id}>
                    {table.columns.map((column: any) => (
                      <td key={column.id} style={{ padding: '16px 14px' }}>
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

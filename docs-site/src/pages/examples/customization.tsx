import { useMemo, useState } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import { createSortingPlugin, withSorting, type SortingTableState } from '@pivot/plugins/sorting';
import { CodePreview } from '@/components/CodePreview';
import { generateData } from '@/examples/mockData';
import { Settings } from 'lucide-react';

const exampleCode = `
import { usePivotTable } from 'react-pivot-pro';
import { createSortingPlugin, withSorting } from 'react-pivot-pro';

const columns = [
  {
    id: 'customer',
    header: 'Customer',
    accessorKey: 'company',
    cell: (val) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar name={val} />
        <div>{val}</div>
      </div>
    ),
  },
  // ... more custom cells
];

const table = usePivotTable({ data, columns });
`;

type LocalState = SortingTableState;
type CustomTable = ReturnType<typeof withSorting<any, LocalState>>;

export default function Customization() {
  const [data] = useState(() => generateData(20));

  const columns = useMemo(() => [
    { 
      id: 'customer', 
      header: 'Customer', 
      accessorKey: 'company',
      enableSorting: true,
    },
    { id: 'account', header: 'Account Details', accessorKey: 'account' },
    { id: 'status', header: 'Status', accessorKey: 'status' },
    { id: 'amount', header: 'Amount', accessorKey: 'amount', enableSorting: true },
    {
      id: 'actions',
      header: '',
      accessorKey: 'id',
    },
  ], []);

  const baseTable = usePivotTable<any, LocalState>({
    data,
    columns,
    plugins: [createSortingPlugin()],
  });

  const table = useMemo((): CustomTable => {
    return withSorting<any, LocalState>(baseTable) as CustomTable;
  }, [baseTable]);

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
                  {table.columns.map((column) => (
                    <th 
                      key={column.id}
                      onClick={() => column.id !== 'actions' && table.sorting.toggleSorting(column.id)}
                      style={{ cursor: column.id !== 'actions' ? 'pointer' : 'default' }}
                    >
                      {column.header ?? column.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.getRowModel().rows.slice(0, 5).map((row) => (
                  <tr key={row.id}>
                    {table.columns.map((column) => {
                      const value = row.getValue(column.id);
                      
                      if (column.id === 'customer') {
                        return (
                          <td key={column.id} style={{ padding: '16px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: '50%', 
                                background: 'color-mix(in oklab, var(--primary) 20%, transparent)', 
                                color: 'var(--primary)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontWeight: 'bold',
                                fontSize: '0.85rem'
                              }}>
                                {String(value).charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 500 }}>{String(value)}</div>
                              </div>
                            </div>
                          </td>
                        );
                      }
                      
                      if (column.id === 'account') {
                        return (
                          <td key={column.id} style={{ padding: '16px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                              <span>•••• {String(value).slice(-4)}</span>
                            </div>
                          </td>
                        );
                      }
                      
                      if (column.id === 'status') {
                        const isCompleted = String(value) === 'Completed';
                        return (
                          <td key={column.id} style={{ padding: '16px 14px' }}>
                            <span style={{ 
                              padding: '4px 8px', 
                              borderRadius: 4, 
                              fontSize: '0.85rem', 
                              fontWeight: 500,
                              background: isCompleted ? 'color-mix(in oklab, var(--success) 20%, transparent)' : 'color-mix(in oklab, var(--warning) 20%, transparent)',
                              color: isCompleted ? 'var(--success)' : 'var(--warning)',
                            }}>
                              {String(value)}
                            </span>
                          </td>
                        );
                      }
                      
                      if (column.id === 'amount') {
                        const amount = value as number;
                        return (
                          <td key={column.id} style={{ padding: '16px 14px', fontWeight: 600 }}>
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount ?? 0)}
                          </td>
                        );
                      }
                      
                      if (column.id === 'actions') {
                        return (
                          <td key={column.id} style={{ padding: '16px 14px' }}>
                            <button className="ghost-btn icon-btn">
                              <Settings size={16} />
                            </button>
                          </td>
                        );
                      }
                      
                      return (
                        <td key={column.id} style={{ padding: '16px 14px' }}>
                          {String(value ?? '')}
                        </td>
                      );
                    })}
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

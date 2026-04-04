import { useMemo, useState } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import { useGrouping } from '@pivot/plugins/grouping';
import { usePivot } from '@pivot/plugins/pivot';
import { CodePreview } from '@/components/CodePreview';
import { generateData } from '@/examples/mockData';
import { Layers, Activity } from 'lucide-react';

const exampleCode = `
import { usePivotTable } from 'react-pivot-pro/core';
import { useGrouping, usePivot } from 'react-pivot-pro/plugins';
// ... full implementation with multi-level grouping and aggregation
`;

export default function PivotAnalytics() {
  const [data] = useState(() => generateData(2000));

  const columns = useMemo(() => [
    { id: 'region', header: 'Region', accessorKey: 'region' },
    { id: 'country', header: 'Country', accessorKey: 'country' },
    { id: 'department', header: 'Department', accessorKey: 'department' },
    { 
      id: 'amount', 
      header: 'Revenue', 
      accessorKey: 'amount', 
      pivot: { aggregator: 'sum' },
      cell: (val: number) => (
        <span style={{ fontWeight: 600 }}>
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)}
        </span>
      )
    },
    {
      id: 'transactions',
      header: 'Transactions',
      accessorFn: () => 1,
      pivot: { aggregator: 'sum' }
    }
  ], []);

  const grouping = useGrouping();
  const pivot = usePivot();

  const table = usePivotTable({
    data,
    columns: columns as any,
    plugins: [grouping, pivot] as any,
    state: {
      grouping: ['region', 'country']
    } as any
  });

  return (
    <div className="doc-page">
      <header>
        <h1 className="page-title">Pivot Analytics Dashboard</h1>
        <p className="page-desc">Advanced multi-level grouping and numerical aggregation formulas for massive datasets.</p>
      </header>

      <CodePreview title="Analytics Pivot Demo" code={exampleCode}>
        <div className="advanced-grid">
          <div className="advanced-toolbar">
            <div className="toolbar-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <Layers size={16} />
                <span>Grouped by: <strong>Region → Country</strong></span>
              </div>
            </div>
            <div className="toolbar-group">
              <button className="ghost-btn icon-btn"><Activity size={16} /> View Insights</button>
            </div>
          </div>
          <div className="table-shell" style={{ height: 400, overflow: 'auto', border: 'none', borderRadius: 0 }}>
            <table className="demo-table">
              <thead>
                <tr>
                  {table.columns.map((column: any) => (
                    <th key={column.id}>{column.header ?? column.id}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.getRowModel().rows.slice(0, 100).map((row: any) => (
                  <tr key={row.id} className={row.grouping ? 'group-row' : ''} style={{
                    background: row.depth === 0 ? 'var(--surface-muted)' : row.depth === 1 ? 'color-mix(in oklab, var(--surface-muted) 50%, transparent)' : 'inherit'
                  }}>
                    {table.columns.map((column: any) => (
                      <td key={column.id} style={{ paddingLeft: column.id === (table.state as any).grouping?.[0] ? Number(row.depth) * 20 + 14 : 14 }}>
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

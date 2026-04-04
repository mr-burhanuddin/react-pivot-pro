import { useMemo, useState } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import { createGroupingPlugin, withGrouping, type GroupingTableState } from '@pivot/plugins/grouping';
import { createPivotPlugin, withPivot, type PivotTableState } from '@pivot/plugins/pivot';
import { CodePreview } from '@/components/CodePreview';
import { generateData } from '@/examples/mockData';
import { Layers } from 'lucide-react';

const exampleCode = `
import { usePivotTable } from 'react-pivot-pro';
import { createGroupingPlugin, createPivotPlugin, withGrouping, withPivot } from 'react-pivot-pro';

const table = usePivotTable({
  data,
  columns,
  plugins: [createGroupingPlugin(), createPivotPlugin()],
  initialState: {
    rowGrouping: ['region'],
    columnGrouping: ['quarter'],
    pivotEnabled: true,
  },
});

const pivotTable = withPivot(withGrouping(table));
const result = pivotTable.pivot.getPivotResult();
`;

type LocalState = GroupingTableState & PivotTableState;

export default function PivotAnalytics() {
  const [data] = useState(() => generateData(2000));

  const columns = useMemo(() => [
    { id: 'region', header: 'Region', accessorKey: 'region' },
    { id: 'country', header: 'Country', accessorKey: 'country' },
    { id: 'department', header: 'Department', accessorKey: 'department' },
    { id: 'amount', header: 'Revenue', accessorKey: 'amount' },
    { id: 'transactions', header: 'Transactions', accessorFn: () => 1 },
  ], []);

  const baseTable = usePivotTable<any, LocalState>({
    data,
    columns,
    plugins: [createGroupingPlugin(), createPivotPlugin({
      defaultValues: [
        { id: 'amount', aggregation: 'sum' },
        { id: 'transactions', aggregation: 'sum' },
      ],
    })],
    initialState: {
      rowGrouping: ['region', 'country'],
      pivotEnabled: true,
      pivotValues: [
        { id: 'amount', aggregation: 'sum' },
        { id: 'transactions', aggregation: 'sum' },
      ],
    } as any,
  });

  const table = useMemo(
    () => withPivot<any, LocalState>(withGrouping<any, LocalState>(baseTable)),
    [baseTable],
  );

  const result = table.pivot.getPivotResult();

  if (!result) {
    return <p className="meta-row">Pivot is disabled.</p>;
  }

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
          </div>
          <div className="table-shell" style={{ height: 400, overflow: 'auto', border: 'none', borderRadius: 0 }}>
            <table className="demo-table">
              <thead>
                <tr>
                  <th>Row Group</th>
                  {result.columnHeaders.map((column) => (
                    <th key={column.key}>{column.path.join(' / ') || 'Total'}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rowHeaders.map((path) => {
                  const rowKey = path.length === 0 ? '__root__' : path.join('||');
                  return (
                    <tr key={rowKey}>
                      <td>{path.join(' / ') || 'All Regions'}</td>
                      {result.columnHeaders.map((column) => {
                        const valueMap = result.matrixByRowKey[rowKey]?.[column.key] ?? {};
                        return (
                          <td key={`${rowKey}_${column.key}`}>
                            <div style={{ fontWeight: 600 }}>
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format((valueMap.amount as number) ?? 0)}
                            </div>
                            <div className="meta-row">
                              Tx: {Number(valueMap.transactions ?? 0).toFixed(0)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CodePreview>
    </div>
  );
}

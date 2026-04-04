import { useMemo } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import type { ColumnDef } from '@pivot/types';
import { createGroupingPlugin, withGrouping, type GroupingTableState } from '@pivot/plugins/grouping';
import { createPivotPlugin, withPivot, type PivotTableState } from '@pivot/plugins/pivot';
import type { SalesRecord } from './data';
import { salesData } from './data';
import { formatCurrency } from './common';

type LocalState = GroupingTableState & PivotTableState;

const columns: ColumnDef<SalesRecord>[] = [
  { id: 'region', accessorKey: 'region', header: 'Region' },
  { id: 'quarter', accessorKey: 'quarter', header: 'Quarter' },
  { id: 'amount', accessorKey: 'amount', header: 'Amount' },
  { id: 'quantity', accessorKey: 'quantity', header: 'Units' },
];

export default function PivotTable() {
  const tableBase = usePivotTable<SalesRecord, LocalState>({
    data: useMemo(() => salesData, []),
    columns: useMemo(() => columns, []),
    plugins: useMemo(
      () => [
        createGroupingPlugin(),
        createPivotPlugin<SalesRecord, LocalState>({
          defaultValues: [
            { id: 'amount', aggregation: 'sum' },
            { id: 'quantity', aggregation: 'avg' },
          ],
        }),
      ],
      [],
    ),
    initialState: {
      sorting: [],
      filters: [],
      columnVisibility: {},
      rowSelection: {},
      expanded: {},
      rowGrouping: ['region'],
      columnGrouping: ['quarter'],
      expandedGroups: {},
      pivotEnabled: true,
      pivotValues: [
        { id: 'amount', aggregation: 'sum' },
        { id: 'quantity', aggregation: 'avg' },
      ],
    },
  });

  const table = useMemo(
    () => withPivot<SalesRecord, LocalState>(withGrouping<SalesRecord, LocalState>(tableBase)),
    [tableBase],
  );
  const result = table.pivot.getPivotResult();

  if (!result) {
    return <p className="meta-row">Pivot is disabled.</p>;
  }

  return (
    <div className="table-shell">
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
                      <div>{formatCurrency(valueMap.amount as number | undefined)}</div>
                      <div className="meta-row">
                        Avg units: {Number(valueMap.quantity ?? 0).toFixed(1)}
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
  );
}

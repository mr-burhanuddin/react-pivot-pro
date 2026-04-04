import { useMemo } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import type { ColumnDef } from '@pivot/types';
import {
  createColumnOrderingPlugin,
  withColumnOrdering,
  type ColumnOrderingTableState,
  type PivotTableWithColumnOrdering,
} from '@pivot/plugins/columnOrdering';
import {
  createColumnPinningPlugin,
  withColumnPinning,
  type ColumnPinningTableState,
  type PivotTableWithColumnPinning,
} from '@pivot/plugins/columnPinning';
import {
  createColumnVisibilityPlugin,
  withColumnVisibility,
  type ColumnVisibilityTableState,
  type PivotTableWithColumnVisibility,
} from '@pivot/plugins/columnVisibility';
import type { SalesRecord } from './data';
import { salesData } from './data';
import { formatCurrency } from './common';

type LocalState = ColumnOrderingTableState & ColumnPinningTableState & ColumnVisibilityTableState;
type FeatureTable = PivotTableWithColumnVisibility<SalesRecord, LocalState> &
  PivotTableWithColumnOrdering<SalesRecord, LocalState> &
  PivotTableWithColumnPinning<SalesRecord, LocalState>;

const columns: ColumnDef<SalesRecord>[] = [
  { id: 'region', header: 'Region', accessorKey: 'region' },
  { id: 'country', header: 'Country', accessorKey: 'country' },
  { id: 'product', header: 'Product', accessorKey: 'product' },
  { id: 'quarter', header: 'Quarter', accessorKey: 'quarter' },
  { id: 'channel', header: 'Channel', accessorKey: 'channel' },
  { id: 'amount', header: 'Amount', accessorKey: 'amount' },
];

export default function ColumnFeatures() {
  const baseTable = usePivotTable<SalesRecord, LocalState>({
    data: useMemo(() => salesData, []),
    columns: useMemo(() => columns, []),
    plugins: useMemo(
      () => [createColumnVisibilityPlugin(), createColumnOrderingPlugin(), createColumnPinningPlugin()],
      [],
    ),
    initialState: {
      sorting: [],
      filters: [],
      columnVisibility: { channel: false },
      rowSelection: {},
      expanded: {},
      columnOrder: ['region', 'product', 'country', 'quarter', 'channel', 'amount'],
      columnPinning: { left: ['region'], right: ['amount'] },
    },
  });

  const table = useMemo(() => {
    const withVisibility = withColumnVisibility<SalesRecord, LocalState>(baseTable);
    const withOrdering = withColumnOrdering<SalesRecord, LocalState>(withVisibility);
    const withPinning = withColumnPinning<SalesRecord, LocalState>(withOrdering);
    return withPinning as FeatureTable;
  }, [baseTable]);

  const ordered = table.columnOrdering.getOrderedColumnIds();
  const visible = new Set(table.columnVisibility.getVisibleColumnIds());
  const left = table.columnPinning.getPinnedColumns('left').filter((id) => visible.has(id));
  const right = table.columnPinning.getPinnedColumns('right').filter((id) => visible.has(id));
  const center = table
    .columnPinning
    .getCenterColumnIds()
    .filter((id) => ordered.includes(id) && visible.has(id));
  const finalColumnIds = [...left, ...center, ...right];
  const rows = table.getRowModel().rows.slice(0, 9);

  return (
    <div>
      <div className="toolbar">
        {table.columns.map((column) => (
          <button
            key={`toggle_${column.id}`}
            type="button"
            className="ghost-btn"
            onClick={() => table.columnVisibility.toggleColumnVisibility(column.id)}
          >
            {table.columnVisibility.getIsColumnVisible(column.id) ? 'Hide' : 'Show'} {column.header ?? column.id}
          </button>
        ))}
        <button
          type="button"
          className="ghost-btn"
          onClick={() => table.columnOrdering.reorderColumn('amount', 1)}
        >
          Move amount near start
        </button>
      </div>

      <div className="table-shell">
        <table className="demo-table">
          <thead>
            <tr>
              {finalColumnIds.map((columnId) => {
                const column = table.columns.find((item) => item.id === columnId);
                if (!column) {
                  return null;
                }
                return (
                  <th key={columnId}>
                    {column.header ?? column.id}
                    <span style={{ marginLeft: 8 }}>
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => table.columnPinning.pinColumn(columnId, 'left')}
                      >
                        L
                      </button>{' '}
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => table.columnPinning.pinColumn(columnId, false)}
                      >
                        C
                      </button>{' '}
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => table.columnPinning.pinColumn(columnId, 'right')}
                      >
                        R
                      </button>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {finalColumnIds.map((columnId) => (
                  <td key={`${row.id}_${columnId}`}>
                    {columnId === 'amount'
                      ? formatCurrency(row.getValue<number>(columnId))
                      : String(row.getValue(columnId) ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="meta-row">
        Pinned left: {left.join(', ') || 'none'} | Pinned right: {right.join(', ') || 'none'}
      </p>
    </div>
  );
}

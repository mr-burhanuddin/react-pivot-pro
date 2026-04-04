import { useMemo, useState } from 'react';
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
import { Pin, Eye, EyeOff, MoveHorizontal, Columns3 } from 'lucide-react';

type LocalState = ColumnOrderingTableState & ColumnPinningTableState & ColumnVisibilityTableState;
type FeatureTable = PivotTableWithColumnVisibility<SalesRecord, LocalState> &
  PivotTableWithColumnOrdering<SalesRecord, LocalState> &
  PivotTableWithColumnPinning<SalesRecord, LocalState>;

const COLUMNS: ColumnDef<SalesRecord>[] = [
  { id: 'region', header: 'Region', accessorKey: 'region' },
  { id: 'country', header: 'Country', accessorKey: 'country' },
  { id: 'product', header: 'Product', accessorKey: 'product' },
  { id: 'quarter', header: 'Quarter', accessorKey: 'quarter' },
  { id: 'channel', header: 'Channel', accessorKey: 'channel' },
  { id: 'category', header: 'Category', accessorKey: 'category' },
  { id: 'amount', header: 'Amount', accessorKey: 'amount' },
  { id: 'quantity', header: 'Units', accessorKey: 'quantity' },
  { id: 'marginPct', header: 'Margin %', accessorKey: 'marginPct' },
];

export default function ColumnFeatures() {
  const [showColumnPanel, setShowColumnPanel] = useState(false);

  const baseTable = usePivotTable<SalesRecord, LocalState>({
    data: useMemo(() => salesData, []),
    columns: useMemo(() => COLUMNS, []),
    plugins: useMemo(
      () => [
        createColumnVisibilityPlugin(),
        createColumnOrderingPlugin(),
        createColumnPinningPlugin(),
      ],
      [],
    ),
    initialState: {
      sorting: [],
      filters: [],
      columnVisibility: { channel: false },
      rowSelection: {},
      expanded: {},
      columnOrder: ['region', 'product', 'country', 'quarter', 'category', 'channel', 'amount', 'quantity', 'marginPct'],
      columnPinning: { left: ['region'], right: ['amount'] },
    } as never,
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
    .columnPinning.getCenterColumnIds()
    .filter((id) => ordered.includes(id) && visible.has(id));
  const finalColumnIds = [...left, ...center, ...right];

  const rows = table.getRowModel().rows.slice(0, 10);

  const pinColumn = (columnId: string, pin: 'left' | 'right' | false) => {
    table.columnPinning.pinColumn(columnId, pin);
  };

  const moveColumn = (columnId: string, direction: 'left' | 'right') => {
    const currentIndex = ordered.indexOf(columnId);
    const newIndex = direction === 'left' ? Math.max(0, currentIndex - 1) : Math.min(ordered.length - 1, currentIndex + 1);
    if (currentIndex !== newIndex) {
      const newOrder = [...ordered];
      [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
      table.columnOrdering.setColumnOrder(newOrder);
    }
  };

  return (
    <div>
      <div className="toolbar">
        <button
          type="button"
          className="ghost-btn"
          onClick={() => setShowColumnPanel(!showColumnPanel)}
        >
          <Columns3 size={14} /> Column Settings
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Pin size={12} /> Pinned:
          </span>
          {left.length > 0 && (
            <span className="status-badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              Left: {left.join(', ')}
            </span>
          )}
          {right.length > 0 && (
            <span className="status-badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              Right: {right.join(', ')}
            </span>
          )}
        </div>
      </div>

      {showColumnPanel && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 8,
            marginBottom: 12,
            padding: 12,
            background: 'var(--surface-muted)',
            borderRadius: 8,
            border: '1px solid var(--border)',
          }}
        >
          {table.columns.map((column) => {
            const isVisible = table.columnVisibility.getIsColumnVisible(column.id);
            const isPinnedLeft = left.includes(column.id);
            const isPinnedRight = right.includes(column.id);

            return (
              <div
                key={column.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  background: 'var(--surface)',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                }}
              >
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => table.columnVisibility.toggleColumnVisibility(column.id)}
                  title={isVisible ? 'Hide column' : 'Show column'}
                  style={{ padding: 2 }}
                >
                  {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>

                <span style={{ flex: 1, fontSize: '0.85rem' }}>{column.header ?? column.id}</span>

                <div style={{ display: 'flex', gap: 2 }}>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => pinColumn(column.id, isPinnedLeft ? false : 'left')}
                    title="Pin to left"
                    style={{
                      padding: 2,
                      background: isPinnedLeft ? 'var(--accent-soft)' : undefined,
                      color: isPinnedLeft ? 'var(--accent)' : undefined,
                    }}
                  >
                    <Pin size={12} style={{ transform: 'rotate(90deg)' }} />
                  </button>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => pinColumn(column.id, isPinnedRight ? false : 'right')}
                    title="Pin to right"
                    style={{
                      padding: 2,
                      background: isPinnedRight ? 'var(--accent-soft)' : undefined,
                      color: isPinnedRight ? 'var(--accent)' : undefined,
                    }}
                  >
                    <Pin size={12} style={{ transform: 'rotate(-90deg)' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="table-shell">
        <table className="demo-table">
          <thead>
            <tr>
              {finalColumnIds.map((columnId) => {
                const column = table.columns.find((item) => item.id === columnId);
                if (!column) return null;

                const isPinnedLeft = left.includes(columnId);
                const isPinnedRight = right.includes(columnId);

                return (
                  <th
                    key={columnId}
                    style={{
                      position: isPinnedLeft ? 'sticky' : isPinnedRight ? 'sticky' : undefined,
                      left: isPinnedLeft ? 0 : undefined,
                      right: isPinnedRight ? 0 : undefined,
                      zIndex: isPinnedLeft || isPinnedRight ? 2 : 1,
                      background: isPinnedLeft || isPinnedRight ? 'var(--surface-muted)' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{column.header ?? column.id}</span>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => moveColumn(columnId, 'left')}
                          title="Move left"
                          style={{ padding: 2 }}
                        >
                          <MoveHorizontal size={12} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => moveColumn(columnId, 'right')}
                          title="Move right"
                          style={{ padding: 2 }}
                        >
                          <MoveHorizontal size={12} />
                        </button>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {finalColumnIds.map((columnId) => {
                  const column = table.columns.find((item) => item.id === columnId);
                  if (!column) return null;

                  const isPinnedLeft = left.includes(columnId);
                  const isPinnedRight = right.includes(columnId);
                  const value = row.original[columnId as keyof SalesRecord];

                  return (
                    <td
                      key={`${row.id}_${columnId}`}
                      style={{
                        position: isPinnedLeft ? 'sticky' : isPinnedRight ? 'sticky' : undefined,
                        left: isPinnedLeft ? 0 : undefined,
                        right: isPinnedRight ? 0 : undefined,
                        background: isPinnedLeft || isPinnedRight ? 'var(--surface)' : undefined,
                      }}
                    >
                      {columnId === 'amount'
                        ? formatCurrency(value as number | undefined)
                        : columnId === 'marginPct'
                          ? <span style={{
                              color: (value as number) >= 50 ? 'var(--success)' : (value as number) >= 40 ? 'var(--warning)' : 'var(--danger)',
                              fontWeight: 500
                            }}>{String(value)}%</span>
                          : String(value ?? '-')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="meta-row">
        <span>Pinned left: {left.join(', ') || 'none'}</span>
        <span style={{ marginLeft: 16 }}>Pinned right: {right.join(', ') || 'none'}</span>
        <span style={{ marginLeft: 16 }}>Visible columns: {finalColumnIds.length}</span>
      </div>
    </div>
  );
}

import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import type { ColumnDef } from '@pivot/types';
import { useVirtualRows } from '@pivot/hooks/useVirtualRows';
import { createSortingPlugin, withSorting, type SortingTableState } from '@pivot/plugins/sorting';
import { createFilteringPlugin, withFiltering, type FilteringTableState } from '@pivot/plugins/filtering';
import type { SalesRecord } from './data';
import { createLargeSalesDataset } from './data';
import { formatCurrency } from './common';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Zap, Activity } from 'lucide-react';

type LocalState = SortingTableState & FilteringTableState;

const COLUMNS: ColumnDef<SalesRecord>[] = [
  { id: 'id', header: 'Order ID', accessorKey: 'id' },
  { id: 'region', header: 'Region', accessorKey: 'region', enableSorting: true },
  { id: 'country', header: 'Country', accessorKey: 'country', enableSorting: true },
  { id: 'category', header: 'Category', accessorKey: 'category', enableSorting: true },
  { id: 'product', header: 'Product', accessorKey: 'product', enableSorting: true },
  { id: 'quarter', header: 'Quarter', accessorKey: 'quarter', enableSorting: true },
  { id: 'channel', header: 'Channel', accessorKey: 'channel', enableSorting: true },
  { id: 'amount', header: 'Amount', accessorKey: 'amount', enableSorting: true },
];

const DATASET_SIZE = 50000;
const ROW_HEIGHT = 38;
const GRID_COLUMNS = '100px 120px 130px 120px 160px 90px 100px 120px';

export default function VirtualizedTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [fps, setFps] = useState(0);
  const lastFrameTime = useRef<number>(performance.now());
  const frameCount = useRef<number>(0);

  const data = useMemo(() => createLargeSalesDataset(DATASET_SIZE), []);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(term))
    );
  }, [data, searchTerm]);

  const baseTable = usePivotTable<SalesRecord, LocalState>({
    data: filteredData,
    columns: useMemo(() => COLUMNS, []),
    plugins: useMemo(() => [createSortingPlugin(), createFilteringPlugin()], []),
  });

  const table = useMemo(
    () =>
      withSorting<SalesRecord, LocalState>(
        withFiltering<SalesRecord, LocalState>(baseTable)
      ) as ReturnType<typeof withSorting<SalesRecord, LocalState>> &
        ReturnType<typeof withFiltering<SalesRecord, LocalState>>,
    [baseTable],
  );

  const rows = table.getRowModel().rows;
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const getScrollElement = useCallback(() => scrollRef.current, []);
  const estimateSize = useCallback(() => ROW_HEIGHT, []);

  const { virtualRows, totalSize } = useVirtualRows<HTMLDivElement>({
    count: rows.length,
    getScrollElement,
    estimateSize,
    overscan: 15,
  });

  useEffect(() => {
    const measureFps = () => {
      const now = performance.now();
      frameCount.current += 1;

      if (now - lastFrameTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastFrameTime.current = now;
      }

      requestAnimationFrame(measureFps);
    };

    const frameId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const getSortIcon = (columnId: string) => {
    const isSorted = table.sorting.getIsSorted(columnId);
    if (isSorted === 'asc') return <ArrowUp size={12} />;
    if (isSorted === 'desc') return <ArrowDown size={12} />;
    return <ArrowUpDown size={12} />;
  };

  const getFpsColor = () => {
    if (fps >= 50) return 'var(--success)';
    if (fps >= 30) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div>
      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 8, color: 'var(--text-muted)' }} />
          <input
            className="control"
            placeholder="Filter dataset..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 32, width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={14} style={{ color: getFpsColor() }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {fps} FPS
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={14} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Virtualized
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="table-shell"
        style={{
          height: 420,
          overflow: 'auto',
          padding: 0,
        }}
      >
        <div
          style={{
            height: totalSize,
            position: 'relative',
            minWidth: '100%',
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              display: 'grid',
              gridTemplateColumns: GRID_COLUMNS,
              background: 'var(--surface-muted)',
              borderBottom: '2px solid var(--border)',
            }}
          >
            {table.columns.map((column) => (
              <div
                key={column.id}
                onClick={() => column.enableSorting && table.sorting.toggleSorting(column.id)}
                style={{
                  padding: '10px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                  cursor: column.enableSorting ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {column.header ?? column.id}
                {column.enableSorting && (
                  <span style={{ opacity: table.sorting.getIsSorted(column.id) ? 1 : 0.4 }}>
                    {getSortIcon(column.id)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            if (!row) return null;

            const value = row.original;
            const isEven = virtualRow.index % 2 === 0;

            return (
              <div
                key={row.id}
                data-index={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'grid',
                  gridTemplateColumns: GRID_COLUMNS,
                  background: isEven ? 'var(--surface)' : 'var(--surface-muted)',
                  borderBottom: '1px solid var(--border)',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--accent-soft)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = isEven
                    ? 'var(--surface)'
                    : 'var(--surface-muted)';
                }}
              >
                {table.columns.map((column) => (
                  <div
                    key={`${row.id}_${column.id}`}
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.88rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {column.id === 'amount'
                      ? formatCurrency(value[column.id as keyof SalesRecord] as number | undefined)
                      : String(value[column.id as keyof SalesRecord] ?? '-')}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="meta-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span>
          Showing {virtualRows.length} of {rows.length.toLocaleString()} rows in view
        </span>
        <span>Total dataset: {DATASET_SIZE.toLocaleString()} rows</span>
      </div>
    </div>
  );
}

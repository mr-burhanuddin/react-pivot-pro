import { useMemo, useRef, useState, useCallback } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import type { ColumnDef } from '@pivot/types';
import { useVirtualColumns } from '@pivot/hooks/useVirtualColumns';
import type { SalesRecord } from './data';
import { createLargeSalesDataset } from './data';
import { formatCurrency } from './common';
import { ArrowLeft, ArrowRight, Columns, Activity } from 'lucide-react';

const DATASET_SIZE = 1000;
const COLUMN_COUNT = 50;
const CELL_WIDTH = 120;

function generateManyColumns(): ColumnDef<SalesRecord>[] {
  const columns: ColumnDef<SalesRecord>[] = [
    { id: 'id', header: 'ID', accessorKey: 'id' },
    { id: 'region', header: 'Region', accessorKey: 'region' },
    { id: 'country', header: 'Country', accessorKey: 'country' },
    { id: 'product', header: 'Product', accessorKey: 'product' },
  ];
  
  for (let i = 0; i < COLUMN_COUNT; i++) {
    columns.push({
      id: `metric_${i}`,
      header: `Metric ${i + 1}`,
      accessorFn: (row) => Math.floor(Math.random() * 10000),
    });
  }
  
  columns.push(
    { id: 'amount', header: 'Amount', accessorKey: 'amount' },
    { id: 'quantity', header: 'Units', accessorKey: 'quantity' },
    { id: 'marginPct', header: 'Margin %', accessorKey: 'marginPct' }
  );
  
  return columns;
}

export default function VirtualizedColumnsTable() {
  const [scrollLeft, setScrollLeft] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const data = useMemo(() => createLargeSalesDataset(DATASET_SIZE), []);
  const columns = useMemo(() => generateManyColumns(), []);

  const table = usePivotTable<SalesRecord>({
    data,
    columns,
  });

  const rows = table.getRowModel().rows.slice(0, 20);
  const allColumns = table.columns;

  const getScrollElement = useCallback(() => viewportRef.current, []);
  const estimateSize = useCallback(() => CELL_WIDTH, []);

  const { virtualColumns, totalSize } = useVirtualColumns({
    count: allColumns.length,
    getScrollElement,
    estimateSize,
    overscan: 5,
  });

  const visibleColumnIds = useMemo(() => {
    const visible = new Set<string>();
    virtualColumns.forEach(vc => {
      const col = allColumns[vc.index];
      if (col) visible.add(col.id);
    });
    return visible;
  }, [virtualColumns, allColumns]);

  const visibleColumns = useMemo(
    () => allColumns.filter(col => visibleColumnIds.has(col.id)),
    [allColumns, visibleColumnIds]
  );

  const handleScroll = useCallback((direction: 'left' | 'right') => {
    if (viewportRef.current) {
      const scrollAmount = 300;
      viewportRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  return (
    <div>
      <div className="toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Columns size={14} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {allColumns.length} columns (showing {visibleColumns.length} visible)
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => handleScroll('left')}
            title="Scroll left"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => handleScroll('right')}
            title="Scroll right"
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="table-shell"
        style={{
          height: 400,
          overflow: 'auto',
          padding: 0,
        }}
      >
        <div style={{ minWidth: totalSize }}>
          <table className="demo-table">
            <thead>
              <tr>
                {visibleColumns.map((column) => (
                  <th
                    key={column.id}
                    style={{
                      minWidth: CELL_WIDTH,
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      background: 'var(--surface-muted)',
                    }}
                  >
                    {column.header ?? column.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {visibleColumns.map((column) => {
                    const value = row.original[column.id as keyof SalesRecord];
                    const isNumeric = column.id === 'amount' || column.id === 'quantity';
                    const isMetric = column.id?.startsWith('metric_');
                    
                    return (
                      <td
                        key={column.id}
                        style={{
                          minWidth: CELL_WIDTH,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {isMetric ? (
                          formatCurrency(value as number | undefined)
                        ) : column.id === 'amount' ? (
                          formatCurrency(value as number | undefined)
                        ) : column.id === 'marginPct' ? (
                          `${value}%`
                        ) : (
                          String(value ?? '-')
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="meta-row">
        <span>
          Showing {visibleColumns.length} of {allColumns.length} columns
        </span>
        <span>
          Horizontal scroll to see more columns
        </span>
      </div>
    </div>
  );
}

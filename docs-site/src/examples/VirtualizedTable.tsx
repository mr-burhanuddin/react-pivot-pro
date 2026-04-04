import { useMemo, useRef } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import type { ColumnDef } from '@pivot/types';
import { useVirtualRows } from '@pivot/hooks/useVirtualRows';
import type { SalesRecord } from './data';
import { createLargeSalesDataset } from './data';
import { formatCurrency } from './common';

const columns: ColumnDef<SalesRecord>[] = [
  { id: 'id', header: 'Order ID', accessorKey: 'id' },
  { id: 'region', header: 'Region', accessorKey: 'region' },
  { id: 'country', header: 'Country', accessorKey: 'country' },
  { id: 'category', header: 'Category', accessorKey: 'category' },
  { id: 'product', header: 'Product', accessorKey: 'product' },
  { id: 'amount', header: 'Amount', accessorKey: 'amount' },
];

export default function VirtualizedTable() {
  const data = useMemo(() => createLargeSalesDataset(2200), []);
  const table = usePivotTable<SalesRecord>({
    data,
    columns,
  });
  const rows = table.getRowModel().rows;
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const { virtualRows, totalSize } = useVirtualRows<HTMLDivElement>({
    count: rows.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => 38,
    overscan: 10,
  });

  return (
    <div>
      <div
        ref={viewportRef}
        className="example-card"
        style={{ height: 390, overflow: 'auto', position: 'relative' }}
      >
        <div style={{ height: totalSize, position: 'relative' }}>
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={row.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  transform: `translateY(${virtualRow.start}px)`,
                  left: 0,
                  right: 0,
                  borderBottom: '1px solid var(--border)',
                  display: 'grid',
                  gridTemplateColumns: '120px 130px 140px 120px 180px 120px',
                  background: virtualRow.index % 2 === 0 ? 'var(--surface)' : 'var(--surface-muted)',
                }}
              >
                <div style={{ padding: '8px 10px' }}>{String(row.getValue('id'))}</div>
                <div style={{ padding: '8px 10px' }}>{String(row.getValue('region'))}</div>
                <div style={{ padding: '8px 10px' }}>{String(row.getValue('country'))}</div>
                <div style={{ padding: '8px 10px' }}>{String(row.getValue('category'))}</div>
                <div style={{ padding: '8px 10px' }}>{String(row.getValue('product'))}</div>
                <div style={{ padding: '8px 10px' }}>
                  {formatCurrency(row.getValue<number>('amount'))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="meta-row">Virtualized {rows.length} rows with ~{virtualRows.length} DOM rows in view.</p>
    </div>
  );
}

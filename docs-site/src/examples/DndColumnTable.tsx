import { useMemo, useCallback, useState } from 'react';
import { DndContext, closestCenter, DragOverlay, useSensor, useSensors, PointerSensor, type DragEndEvent } from '@dnd-kit/core';
import { usePivotTable } from '@pivot/core/usePivotTable';
import type { ColumnDef } from '@pivot/types';
import { createDndColumnPlugin, withDndColumn, type DndColumnTableState } from '@pivot/plugins/dndColumn';
import type { SalesRecord } from './data';
import { salesData } from './data';
import { GripVertical, RotateCcw, Check } from 'lucide-react';

type LocalState = DndColumnTableState;

const COLUMNS: ColumnDef<SalesRecord>[] = [
  { id: 'region', header: 'Region', accessorKey: 'region' },
  { id: 'product', header: 'Product', accessorKey: 'product' },
  { id: 'quarter', header: 'Quarter', accessorKey: 'quarter' },
  { id: 'category', header: 'Category', accessorKey: 'category' },
  { id: 'channel', header: 'Channel', accessorKey: 'channel' },
  { id: 'amount', header: 'Amount', accessorKey: 'amount' },
];

export default function DnDColumnTable() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const dndColumnApiRef = { current: null as ReturnType<typeof withDndColumn<SalesRecord, LocalState>>['dndColumn'] | null };

  const baseTable = usePivotTable<SalesRecord, LocalState>({
    data: useMemo(() => salesData, []),
    columns: useMemo(() => COLUMNS, []),
    plugins: useMemo(() => [createDndColumnPlugin()], []),
  });

  const table = useMemo(() => {
    const result = withDndColumn<SalesRecord, LocalState>(baseTable);
    dndColumnApiRef.current = result.dndColumn;
    return result;
  }, [baseTable]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const rows = table.getRowModel().rows;
  const columnOrder = table.dndColumn.getColumnOrder();
  const orderedColumns = useMemo(() => {
    const colMap = new Map(table.columns.map(c => [c.id, c]));
    return columnOrder.map(id => colMap.get(id)).filter(Boolean) as typeof table.columns;
  }, [table.columns, columnOrder]);

  const handleDragStart = useCallback((event: { active: { id: string | number } }) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    if (event.over) {
      dndColumnApiRef.current?.reorderColumns(event.active.id, event.over.id);
    }
  }, []);

  const activeColumn = activeId ? table.columns.find(c => c.id === activeId) : null;

  const handleReset = useCallback(() => {
    table.dndColumn.resetColumnOrder();
  }, [table.dndColumn]);

  return (
    <div>
      <div className="toolbar">
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Drag column headers to reorder. Changes are persisted in state.
        </span>
        <button type="button" className="ghost-btn" onClick={handleReset}>
          <RotateCcw size={14} /> Reset Order
        </button>
      </div>

      <div className="table-shell">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <table className="demo-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                {orderedColumns.map((col) => (
                  <th
                    key={col.id}
                    style={{
                      cursor: 'grab',
                      opacity: col.id === activeId ? 0.5 : 1,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <GripVertical size={12} style={{ color: 'var(--text-muted)' }} />
                      {col.header ?? col.id}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 5).map((row) => (
                <tr key={row.id}>
                  <td style={{ width: 40 }}></td>
                  {orderedColumns.map((col) => (
                    <td key={col.id}>
                      {String((row.original as Record<string, unknown>)[col.id!] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <DragOverlay>
            {activeColumn ? (
              <th
                style={{
                  padding: '10px 12px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  fontWeight: 600,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GripVertical size={12} style={{ color: 'var(--accent)' }} />
                  {activeColumn.header ?? activeColumn.id}
                </span>
              </th>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <p className="meta-row">
        {columnOrder.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check size={12} style={{ color: 'var(--success)' }} />
            Custom column order active
          </span>
        )}
        {columnOrder.length === 0 && <span>Default column order</span>}
      </p>
    </div>
  );
}

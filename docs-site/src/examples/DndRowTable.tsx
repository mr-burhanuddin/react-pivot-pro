import { useMemo, useCallback, useState } from 'react';
import { DndContext, closestCenter, DragOverlay, useSensor, useSensors, PointerSensor, type DragEndEvent } from '@dnd-kit/core';
import { usePivotTable } from '@pivot/core/usePivotTable';
import type { ColumnDef } from '@pivot/types';
import { createDndRowPlugin, withDndRow, type DndRowTableState } from '@pivot/plugins/dndRow';
import type { SalesRecord } from './data';
import { salesData } from './data';
import { GripVertical, RotateCcw, Check } from 'lucide-react';

type LocalState = DndRowTableState;

const COLUMNS: ColumnDef<SalesRecord>[] = [
  { id: 'region', header: 'Region', accessorKey: 'region' },
  { id: 'product', header: 'Product', accessorKey: 'product' },
  { id: 'quarter', header: 'Quarter', accessorKey: 'quarter' },
  { id: 'category', header: 'Category', accessorKey: 'category' },
  { id: 'channel', header: 'Channel', accessorKey: 'channel' },
  { id: 'amount', header: 'Amount', accessorKey: 'amount' },
];

export default function DnDRowTable() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const dndRowApiRef = { current: null as ReturnType<typeof withDndRow<SalesRecord, LocalState>>['dndRow'] | null };

  const baseTable = usePivotTable<SalesRecord, LocalState>({
    data: useMemo(() => salesData, []),
    columns: useMemo(() => COLUMNS, []),
    plugins: useMemo(() => [createDndRowPlugin()], []),
  });

  const table = useMemo(() => {
    const result = withDndRow<SalesRecord, LocalState>(baseTable);
    dndRowApiRef.current = result.dndRow;
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
  const rowOrder = table.dndRow.getRowOrder();
  const orderedRows = useMemo(() => {
    const rowMap = new Map(rows.map(r => [r.id, r]));
    return rowOrder.map(id => rowMap.get(id)).filter(Boolean) as typeof rows;
  }, [rows, rowOrder]);

  const handleDragStart = useCallback((event: { active: { id: string | number } }) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    if (event.over) {
      dndRowApiRef.current?.reorderRows(event.active.id, event.over.id);
    }
  }, []);

  const activeRow = activeId ? rows.find(r => r.id === activeId) : null;

  const handleReset = useCallback(() => {
    table.dndRow.resetRowOrder();
  }, [table.dndRow]);

  return (
    <div>
      <div className="toolbar">
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Drag rows to reorder. Changes are persisted in state.
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
                {table.columns.map((col) => (
                  <th key={col.id}>{col.header ?? col.id}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderedRows.map((row) => (
                <tr
                  key={row.id}
                  style={{
                    cursor: 'grab',
                    opacity: row.id === activeId ? 0.5 : 1,
                  }}
                >
                  <td style={{ width: 40, textAlign: 'center' }}>
                    <GripVertical size={14} style={{ color: 'var(--text-muted)' }} />
                  </td>
                  {table.columns.map((col) => (
                    <td key={col.id}>
                      {String((row.original as Record<string, unknown>)[col.id!] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <DragOverlay>
            {activeRow ? (
              <table className="demo-table" style={{ width: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                <tbody>
                  <tr style={{ background: 'var(--surface)' }}>
                    <td style={{ width: 40, textAlign: 'center' }}>
                      <GripVertical size={14} style={{ color: 'var(--accent)' }} />
                    </td>
                    {table.columns.map((col) => (
                      <td key={col.id} style={{ fontWeight: 500 }}>
                        {String((activeRow.original as Record<string, unknown>)[col.id!] ?? '-')}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <p className="meta-row">
        {rowOrder.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check size={12} style={{ color: 'var(--success)' }} />
            Custom order active
          </span>
        )}
        {rowOrder.length === 0 && <span>Default order</span>}
      </p>
    </div>
  );
}

import { useRef, useMemo, useCallback } from "react";
import { usePivotTable, createDndColumnPlugin, withDndColumn } from "@pivot";
import type { SalesRow } from "../../data/mockData";
import type { DndColumnTableState } from "@pivot";
import { SUBSET, SALES_COLUMNS } from "../data";
import { MiniTable, Th, Td } from "../components";
import { GripVertical } from "lucide-react";

const columns = SALES_COLUMNS.slice(0, 6);

export default function DndColumnExample() {
  const data = useMemo(() => SUBSET.slice(0, 6), []);
  const plugins = useMemo(
    () => [createDndColumnPlugin<SalesRow, DndColumnTableState>()],
    [],
  );

  const table = withDndColumn(
    usePivotTable<SalesRow, DndColumnTableState>({
      data,
      columns,
      plugins,
    }),
  );

  const rowModel = table.getRowModel();
  const cols = table.columns;
  const dragColRef = useRef<string | null>(null);

  const handleDragStart = useCallback((columnId: string) => {
    dragColRef.current = columnId;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (targetColumnId: string) => {
      const fromId = dragColRef.current;
      if (!fromId || fromId === targetColumnId) return;
      table.dndColumn.reorderColumns(fromId, targetColumnId);
      dragColRef.current = null;
    },
    [table.dndColumn],
  );

  const effectiveOrder =
    table.dndColumn.getColumnOrder().length > 0
      ? table.dndColumn.getColumnOrder()
      : columns.map((c) => c.id);

  return (
    <div>
      <p
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--text-secondary)",
          marginBottom: "8px",
        }}
      >
        Drag column headers to reorder columns.
      </p>
      <MiniTable>
        <thead>
          <tr>
            {cols.map((col) => (
              <Th
                key={col.id}
                draggable
                onDragStart={() => handleDragStart(col.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col.id)}
                style={{ cursor: "grab" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <GripVertical
                    size={12}
                    style={{ color: "var(--text-tertiary)" }}
                  />
                  {col.header}
                </div>
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowModel.rows.map((row, idx) => (
            <tr
              key={row.id}
              style={{
                background: idx % 2 === 0 ? "transparent" : "var(--surface-2)",
              }}
            >
              {cols.map((col) => (
                <Td key={col.id}>
                  {row.values[col.id] !== undefined &&
                  row.values[col.id] !== null
                    ? String(row.values[col.id])
                    : "\u2014"}
                </Td>
              ))}
            </tr>
          ))}
        </tbody>
      </MiniTable>

      <div
        style={{
          marginTop: "8px",
          fontSize: "var(--text-xs)",
          color: "var(--text-secondary)",
          fontFamily: "monospace",
        }}
      >
        Order: {effectiveOrder.join(" \u2192 ")}
      </div>
    </div>
  );
}

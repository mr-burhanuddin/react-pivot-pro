import { useRef, useMemo, useCallback } from "react";
import { usePivotTable, createDndRowPlugin, withDndRow } from "@pivot";
import type { SalesRow } from "../../data/mockData";
import type { DndRowTableState } from "@pivot";
import { SUBSET, SALES_COLUMNS } from "../data";
import { MiniTable, Th, Td } from "../components";
import { GripVertical } from "lucide-react";

const columns = SALES_COLUMNS.slice(0, 5);

export default function DndRowExample() {
  const data = useMemo(() => SUBSET.slice(0, 8), []);
  const plugins = useMemo(
    () => [createDndRowPlugin<SalesRow, DndRowTableState>()],
    [],
  );

  const table = withDndRow(
    usePivotTable<SalesRow, DndRowTableState>({
      data,
      columns,
      plugins,
    }),
  );

  const rowModel = table.getRowModel();
  const cols = table.columns;
  const dragIndexRef = useRef<number | null>(null);

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      const rows = rowModel.rows;
      const fromRow = rows[fromIndex];
      const toRow = rows[toIndex];
      if (!fromRow || !toRow) return;
      table.dndRow.reorderRows(fromRow.id, toRow.id);
    },
    [rowModel.rows, table.dndRow],
  );

  const handleDragStart = useCallback((index: number) => {
    dragIndexRef.current = index;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (toIndex: number) => {
      const fromIndex = dragIndexRef.current;
      if (fromIndex === null || fromIndex === toIndex) return;
      handleReorder(fromIndex, toIndex);
      dragIndexRef.current = null;
    },
    [handleReorder],
  );

  return (
    <div>
      <p
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--text-secondary)",
          marginBottom: "8px",
        }}
      >
        Drag rows using the grip handle to reorder them.
      </p>
      <MiniTable>
        <thead>
          <tr>
            <Th style={{ width: "32px" }}>
              <span style={{ visibility: "hidden" }}>#</span>
            </Th>
            {cols.map((col) => (
              <Th key={col.id}>{col.header}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowModel.rows.map((row, idx) => (
            <tr
              key={row.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(idx)}
              style={{
                background: idx % 2 === 0 ? "transparent" : "var(--surface-2)",
                cursor: "grab",
              }}
            >
              <Td>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-tertiary)",
                  }}
                >
                  <GripVertical size={14} />
                </div>
              </Td>
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
    </div>
  );
}

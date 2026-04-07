import { useMemo } from "react";
import {
  usePivotTable,
  createColumnOrderingPlugin,
  withColumnOrdering,
} from "@pivot";
import type { SalesRow } from "../../data/mockData";
import type { ColumnOrderingTableState } from "@pivot";
import { SUBSET, SALES_COLUMNS } from "../data";
import { MiniTable, Th, Td } from "../components";
import { ChevronLeft, ChevronRight } from "lucide-react";

const allCols = SALES_COLUMNS.slice(0, 6);

export default function ColumnOrderingExample() {
  const data = useMemo(() => SUBSET.slice(0, 8), []);
  const plugins = useMemo(
    () => [createColumnOrderingPlugin<SalesRow, ColumnOrderingTableState>()],
    [],
  );

  const table = withColumnOrdering(
    usePivotTable<SalesRow, ColumnOrderingTableState>({
      data,
      columns: allCols,
      plugins,
    }),
  );

  const rowModel = table.getRowModel();
  const cols = table.columns;
  const order = table.columnOrdering.getColumnOrder();

  const moveColumn = (columnId: string, direction: -1 | 1) => {
    const currentOrder = order.length > 0 ? order : allCols.map((c) => c.id);
    const currentIndex = currentOrder.indexOf(columnId);
    if (currentIndex === -1) return;
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;
    table.columnOrdering.reorderColumn(columnId, targetIndex);
  };

  const effectiveOrder = order.length > 0 ? order : allCols.map((c) => c.id);

  return (
    <div>
      <MiniTable>
        <thead>
          <tr>
            {cols.map((col) => {
              const idx = effectiveOrder.indexOf(col.id);
              return (
                <Th key={col.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <button
                      onClick={() => moveColumn(col.id, -1)}
                      disabled={idx <= 0}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: idx <= 0 ? "default" : "pointer",
                        padding: "2px",
                        color:
                          idx <= 0
                            ? "var(--text-tertiary)"
                            : "var(--text-primary)",
                        opacity: idx <= 0 ? 0.4 : 1,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {col.header}
                    <button
                      onClick={() => moveColumn(col.id, 1)}
                      disabled={idx >= effectiveOrder.length - 1}
                      style={{
                        background: "none",
                        border: "none",
                        cursor:
                          idx >= effectiveOrder.length - 1
                            ? "default"
                            : "pointer",
                        padding: "2px",
                        color:
                          idx >= effectiveOrder.length - 1
                            ? "var(--text-tertiary)"
                            : "var(--text-primary)",
                        opacity: idx >= effectiveOrder.length - 1 ? 0.4 : 1,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </Th>
              );
            })}
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

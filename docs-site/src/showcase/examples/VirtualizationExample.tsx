import { useRef, useCallback, useMemo } from "react";
import { usePivotTable, useVirtualRows } from "@pivot";
import type { SalesRow } from "../../data/mockData";
import { mockData } from "../../data/mockData";
import { SALES_COLUMNS } from "../data";

const columns = SALES_COLUMNS.slice(0, 6);

export default function VirtualizationExample() {
  const data = useMemo(() => mockData.slice(0, 500), []);

  const table = usePivotTable<SalesRow>({
    data,
    columns,
  });

  const rowModel = table.getRowModel();
  const cols = table.columns;

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { virtualRows, totalSize } = useVirtualRows({
    count: rowModel.rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 36,
    overscan: 5,
  });

  const getRowStyles = useCallback(
    (idx: number): React.CSSProperties => ({
      background: idx % 2 === 0 ? "transparent" : "var(--surface-2)",
    }),
    [],
  );

  return (
    <div>
      <div
        style={{
          marginBottom: "8px",
          fontSize: "var(--text-sm)",
          color: "var(--text-secondary)",
        }}
      >
        Rendering{" "}
        <strong>
          {virtualRows.length} of {rowModel.rows.length}
        </strong>{" "}
        rows
      </div>

      <div
        ref={scrollContainerRef}
        style={{
          overflow: "auto",
          maxHeight: "400px",
          border: "var(--border-width-default) solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          position: "relative",
        }}
      >
        <div style={{ height: `${totalSize}px`, position: "relative", width: "100%" }}>
          {virtualRows.map((virtualRow) => {
            const row = rowModel.rows[virtualRow.index];
            if (!row) return null;
            return (
              <div
                key={row.id}
                data-index={virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  display: "flex",
                  alignItems: "center",
                  ...getRowStyles(virtualRow.index),
                  borderBottom:
                    "var(--border-width-default) solid var(--border-default)",
                  fontSize: "var(--text-sm)",
                }}
              >
                {cols.map((col) => (
                  <div
                    key={col.id}
                    style={{
                      flex: 1,
                      padding: "4px 8px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.values[col.id] !== undefined &&
                    row.values[col.id] !== null
                      ? String(row.values[col.id])
                      : "\u2014"}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

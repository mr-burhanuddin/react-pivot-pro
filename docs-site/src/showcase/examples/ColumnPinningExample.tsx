import { useMemo } from "react";
import {
  usePivotTable,
  createColumnPinningPlugin,
  withColumnPinning,
} from "@pivot";
import type { SalesRow } from "../../data/mockData";
import type { ColumnPinningTableState, PinSide } from "@pivot";
import { SUBSET, SALES_COLUMNS } from "../data";
import { MiniTable, Th, Td } from "../components";

const allCols = SALES_COLUMNS.slice(0, 8);

function pinButton(
  columnId: string,
  currentSide: PinSide,
  side: PinSide,
  label: string,
  onClick: (columnId: string, side: PinSide) => void,
) {
  const isActive = currentSide === side;
  return (
    <button
      key={`${columnId}-${label}`}
      onClick={() => onClick(columnId, side)}
      style={{
        background: isActive
          ? "color-mix(in srgb, #0891B2 20%, transparent)"
          : "var(--surface-3)",
        border: isActive
          ? "1px solid var(--accent-600)"
          : "1px solid var(--border-default)",
        borderRadius: "4px",
        padding: "2px 6px",
        fontSize: "10px",
        cursor: "pointer",
        color: isActive ? "var(--accent-600)" : "var(--text-secondary)",
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  );
}

export default function ColumnPinningExample() {
  const data = useMemo(() => SUBSET.slice(0, 8), []);
  const plugins = useMemo(
    () => [createColumnPinningPlugin<SalesRow, ColumnPinningTableState>()],
    [],
  );

  const table = withColumnPinning(
    usePivotTable<SalesRow, ColumnPinningTableState>({
      data,
      columns: allCols,
      plugins,
    }),
  );

  const rowModel = table.getRowModel();
  const cols = table.columns;
  const pinning = table.columnPinning.getColumnPinning();

  const pinnedLeftSet = new Set(pinning.left);
  const pinnedRightSet = new Set(pinning.right);

  const getPinnedSide = (columnId: string): PinSide => {
    if (pinnedLeftSet.has(columnId)) return "left";
    if (pinnedRightSet.has(columnId)) return "right";
    return false;
  };

  const handlePin = (columnId: string, side: PinSide) => {
    table.columnPinning.pinColumn(columnId, side);
  };

  const getCellStyle = (columnId: string): React.CSSProperties => {
    const side = getPinnedSide(columnId);
    const base: React.CSSProperties = {};
    if (side === "left") {
      base.borderRight = "2px solid var(--accent-600)";
      base.background = "color-mix(in srgb, #0891B2 5%, transparent)";
    } else if (side === "right") {
      base.borderLeft = "2px solid var(--accent-600)";
      base.background = "color-mix(in srgb, #0891B2 5%, transparent)";
    }
    return base;
  };

  return (
    <div>
      <MiniTable>
        <thead>
          <tr>
            {cols.map((col) => {
              const side = getPinnedSide(col.id);
              return (
                <Th key={col.id} style={getCellStyle(col.id)}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>{col.header}</span>
                    <div style={{ display: "flex", gap: "2px" }}>
                      {pinButton(col.id, side, "left", "\u2190", handlePin)}
                      {pinButton(col.id, side, false, "\u00B7", handlePin)}
                      {pinButton(col.id, side, "right", "\u2192", handlePin)}
                    </div>
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
                <Td key={col.id} style={getCellStyle(col.id)}>
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

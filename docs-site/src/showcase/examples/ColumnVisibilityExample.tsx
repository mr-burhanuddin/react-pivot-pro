import { useMemo } from "react";
import {
  usePivotTable,
  createColumnVisibilityPlugin,
  withColumnVisibility,
} from "@pivot";
import type { SalesRow } from "../../data/mockData";
import type { ColumnVisibilityTableState } from "@pivot";
import { SUBSET, SALES_COLUMNS } from "../data";
import { MiniTable, Th, Td, Chip } from "../components";

const allCols = SALES_COLUMNS.slice(0, 8);

export default function ColumnVisibilityExample() {
  const data = useMemo(() => SUBSET.slice(0, 10), []);
  const plugins = useMemo(
    () => [
      createColumnVisibilityPlugin<SalesRow, ColumnVisibilityTableState>(),
    ],
    [],
  );

  const table = withColumnVisibility(
    usePivotTable<SalesRow, ColumnVisibilityTableState>({
      data,
      columns: allCols,
      plugins,
    }),
  );

  const rowModel = table.getRowModel();
  const cols = table.columns;
  const visibility = table.columnVisibility.getColumnVisibility();

  const isColumnVisible = (columnId: string): boolean =>
    table.columnVisibility.getIsColumnVisible(columnId);

  const toggleColumn = (columnId: string) => {
    table.columnVisibility.toggleColumnVisibility(columnId);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "12px",
          flexWrap: "wrap",
        }}
      >
        {allCols.map((col) => {
          const colId = col.id ?? col.accessorKey;
          if (!colId) return null;
          return (
            <Chip
              key={colId}
              active={isColumnVisible(colId)}
              onClick={() => toggleColumn(colId)}
            >
              {col.header ?? colId}
            </Chip>
          );
        })}
      </div>

      <MiniTable>
        <thead>
          <tr>
            {cols.map((col) => {
              const visible = visibility[col.id] !== false;
              if (!visible) return null;
              return <Th key={col.id}>{col.header}</Th>;
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
              {cols.map((col) => {
                const visible = visibility[col.id] !== false;
                if (!visible) return null;
                return (
                  <Td key={col.id}>
                    {row.values[col.id] !== undefined &&
                    row.values[col.id] !== null
                      ? String(row.values[col.id])
                      : "\u2014"}
                  </Td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </MiniTable>
    </div>
  );
}

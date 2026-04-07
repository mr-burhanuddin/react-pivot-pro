import { useState, useMemo, useCallback } from "react";
import { usePivotTable, createGroupingPlugin, withGrouping } from "@pivot";
import type { ColumnDef } from "@pivot";
import type { SalesRow } from "../../data/mockData";
import type { GroupingTableState } from "@pivot";
import { SUBSET, SALES_COLUMNS, fmtCurrency } from "../data";
import { MiniTable, Th, Td, Chip } from "../components";
import { ChevronRight, ChevronDown, Layers } from "lucide-react";

const columns: ColumnDef<SalesRow>[] = [
  { id: "region", header: "Region", accessorKey: "region" },
  { id: "category", header: "Category", accessorKey: "category" },
  { id: "channel", header: "Channel", accessorKey: "channel" },
  { id: "product", header: "Product", accessorKey: "product" },
  { id: "revenue", header: "Revenue", accessorKey: "revenue" },
];

const GROUPING_OPTIONS = ["region", "category", "channel"] as const;

export default function GroupingExample() {
  const data = useMemo(() => SUBSET.slice(0, 20), []);
  const plugins = useMemo(
    () => [createGroupingPlugin<SalesRow, GroupingTableState>()],
    [],
  );

  const table = withGrouping(
    usePivotTable<SalesRow, GroupingTableState>({
      data,
      columns,
      plugins,
    }),
  );

  const rowModel = table.getRowModel();
  const cols = table.columns;
  const rowGrouping = table.grouping.getRowGrouping();

  const toggleGroup = useCallback(
    (key: (typeof GROUPING_OPTIONS)[number]) => {
      table.grouping.setRowGrouping((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
      );
    },
    [table.grouping],
  );

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
          }}
        >
          <Layers size={14} />
          Group by:
        </div>
        {GROUPING_OPTIONS.map((key) => (
          <Chip
            key={key}
            active={rowGrouping.includes(key)}
            onClick={() => toggleGroup(key)}
          >
            {key}
          </Chip>
        ))}
      </div>

      <MiniTable>
        <thead>
          <tr>
            {cols.map((col) => (
              <Th key={col.id}>{col.header}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowModel.rows.map((row, idx) => {
            const isGroup = row.values.__group === true;
            const depth = (row.values.__depth as number) ?? 0;
            const expanded = isGroup
              ? table.grouping.getIsGroupExpanded(row.id)
              : true;

            return (
              <tr
                key={row.id}
                style={{
                  background: isGroup
                    ? "var(--surface-2)"
                    : idx % 2 === 0
                      ? "transparent"
                      : "var(--surface-1)",
                  fontWeight: isGroup
                    ? "var(--font-medium)"
                    : "var(--font-regular)",
                }}
              >
                {cols.map((col, colIdx) => {
                  if (colIdx === 0 && isGroup) {
                    return (
                      <Td key={col.id}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            paddingLeft: `${depth * 16}px`,
                          }}
                        >
                          <button
                            onClick={() =>
                              table.grouping.toggleGroupExpanded(row.id)
                            }
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {expanded ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronRight size={14} />
                            )}
                          </button>
                          <span>
                            {String(row.values[col.id] ?? "\u2014")}
                            <span
                              style={{
                                marginLeft: "6px",
                                fontSize: "var(--text-xs)",
                                color: "var(--text-tertiary)",
                              }}
                            >
                              ({row.values.__rowCount as number})
                            </span>
                          </span>
                        </div>
                      </Td>
                    );
                  }

                  if (isGroup) {
                    return (
                      <Td key={col.id}>
                        {col.accessorKey === "revenue" ? (
                          fmtCurrency(
                            row.values.revenue as number | null | undefined,
                          )
                        ) : (
                          <span style={{ color: "var(--text-tertiary)" }}>
                            \u2014
                          </span>
                        )}
                      </Td>
                    );
                  }

                  const indent = colIdx === 0 ? depth * 16 : 0;
                  return (
                    <Td key={col.id}>
                      <div style={{ paddingLeft: `${indent}px` }}>
                        {col.accessorKey === "revenue"
                          ? fmtCurrency(
                              row.values.revenue as number | null | undefined,
                            )
                          : row.values[col.id] !== undefined &&
                              row.values[col.id] !== null
                            ? String(row.values[col.id])
                            : "\u2014"}
                      </div>
                    </Td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </MiniTable>
    </div>
  );
}

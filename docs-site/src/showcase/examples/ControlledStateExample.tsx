import { useState, useMemo, useCallback } from "react";
import { usePivotTable, createSortingPlugin, withSorting } from "@pivot";
import type { SalesRow } from "../../data/mockData";
import type { SortingTableState } from "@pivot";
import type { SortingRule } from "@pivot";
import { SUBSET, SALES_COLUMNS } from "../data";
import { MiniTable, Th, Td } from "../components";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

const columns = SALES_COLUMNS.slice(0, 6);

export default function ControlledStateExample() {
  const data = useMemo(() => SUBSET.slice(0, 10), []);
  const plugins = useMemo(
    () => [createSortingPlugin<SalesRow, SortingTableState>()],
    [],
  );

  const [sortingState, setSortingState] = useState<SortingRule[]>([]);

  const handleStateChange = useCallback(
    (nextState: SortingTableState, _previousState: SortingTableState) => {
      if (nextState.sorting !== sortingState) {
        setSortingState(nextState.sorting);
      }
    },
    [sortingState],
  );

  const table = withSorting(
    usePivotTable<SalesRow, SortingTableState>({
      data,
      columns,
      state: { sorting: sortingState } as Partial<SortingTableState>,
      onStateChange: handleStateChange,
      plugins,
    }),
  );

  const rowModel = table.getRowModel();
  const cols = table.columns;

  const handleSort = useCallback(
    (columnId: string) => {
      const current = sortingState;
      const existing = current.find((rule) => rule.id === columnId);
      if (!existing) {
        setSortingState([{ id: columnId, desc: false }]);
      } else if (!existing.desc) {
        setSortingState(
          current.map((rule) =>
            rule.id === columnId ? { ...rule, desc: true } : rule,
          ),
        );
      } else {
        setSortingState([]);
      }
    },
    [sortingState],
  );

  const getSortIcon = (columnId: string) => {
    const rule = sortingState.find((r) => r.id === columnId);
    if (!rule) {
      return <ArrowUpDown size={12} style={{ opacity: 0.4 }} />;
    }
    return rule.desc ? <ArrowDown size={12} /> : <ArrowUp size={12} />;
  };

  return (
    <div>
      <MiniTable>
        <thead>
          <tr>
            {cols.map((col) => (
              <Th
                key={col.id}
                onClick={() => handleSort(col.id)}
                style={{ cursor: "pointer" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {col.header}
                  {getSortIcon(col.id)}
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
          marginTop: "12px",
          padding: "8px 12px",
          background: "var(--surface-2)",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--text-xs)",
          fontFamily: "monospace",
          color: "var(--text-secondary)",
          maxHeight: "80px",
          overflow: "auto",
        }}
      >
        <div style={{ fontWeight: "var(--font-medium)", marginBottom: "4px" }}>
          External sorting state:
        </div>
        {JSON.stringify(sortingState, null, 2)}
      </div>
    </div>
  );
}

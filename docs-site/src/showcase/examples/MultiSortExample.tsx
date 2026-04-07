import { useMemo, useCallback } from "react";
import { usePivotTable, createSortingPlugin, withSorting } from "@pivot";
import type { SalesRow } from "../../data/mockData";
import type { SortingTableState } from "@pivot";
import { SUBSET, SALES_COLUMNS, fmtCurrency } from "../data";
import { MiniTable, Th, Td } from "../components";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

const columns = [
  SALES_COLUMNS[1], // region
  SALES_COLUMNS[3], // product
  SALES_COLUMNS[9], // revenue
  SALES_COLUMNS[8], // units
];

export default function MultiSortExample() {
  const data = useMemo(() => SUBSET.slice(0, 15), []);
  const plugins = useMemo(
    () => [createSortingPlugin<SalesRow, SortingTableState>()],
    [],
  );

  const base = usePivotTable<SalesRow, SortingTableState>({
    data,
    columns,
    plugins,
  });
  const table = withSorting(base);

  const { rowModel, columns: cols, sorting } = table;

  const handleHeaderClick = useCallback(
    (colId: string, multi: boolean) => {
      sorting.toggleSorting(colId, multi);
    },
    [sorting],
  );

  const handleClearSorting = useCallback(() => {
    sorting.clearSorting();
  }, [sorting]);

  const sortedColumnIds = sorting.getSortedColumnIds();
  const currentSorting = sorting.getSorting();

  return (
    <div>
      {/* Sort state display */}
      <div
        style={{
          marginBottom: 8,
          fontSize: 13,
          color: "var(--text-secondary)",
        }}
      >
        {currentSorting.length > 0 ? (
          <>
            Active sorts:{" "}
            {currentSorting
              .map((s) => `${s.id} (${s.desc ? "desc" : "asc"})`)
              .join(", ")}
          </>
        ) : (
          "No active sorts — click a header to sort, shift+click to multi-sort"
        )}
      </div>

      {/* Clear sorts button */}
      {currentSorting.length > 0 && (
        <button
          onClick={handleClearSorting}
          style={{
            marginBottom: 8,
            marginLeft: 8,
            padding: "4px 12px",
            fontSize: 12,
            borderRadius: 6,
            border: "1px solid var(--border-default)",
            background: "var(--surface-3)",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          Clear all sorts
        </button>
      )}

      <MiniTable>
        <thead>
          <tr>
            {cols.map((col) => {
              const sortState = sorting.getIsSorted(col.id);
              const isSorted = sortState !== false;

              return (
                <Th
                  key={col.id}
                  onClick={() => handleHeaderClick(col.id, false)}
                  style={{
                    background: isSorted
                      ? "var(--accent-50)"
                      : undefined,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHeaderClick(col.id, e.shiftKey);
                    }}
                  >
                    {col.header}
                    <span style={{ opacity: 0.6, width: 14, height: 14 }}>
                      {sortState === "asc" && <ArrowUp size={14} />}
                      {sortState === "desc" && <ArrowDown size={14} />}
                      {!isSorted && <ArrowUpDown size={14} />}
                    </span>
                    {isSorted && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--accent-600)",
                          fontWeight: 600,
                        }}
                      >
                        {sortedColumnIds.indexOf(col.id) + 1}
                      </span>
                    )}
                  </span>
                </Th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rowModel.rows.slice(0, 8).map((row, idx) => (
            <tr
              key={row.id}
              style={{
                background:
                  idx % 2 === 0 ? "transparent" : "var(--surface-2)",
              }}
            >
              {cols.map((col) => (
                <Td key={col.id}>
                  {col.id === "revenue"
                    ? fmtCurrency(
                        row.values[col.id] as number | null | undefined,
                      )
                    : row.values[col.id] !== undefined &&
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


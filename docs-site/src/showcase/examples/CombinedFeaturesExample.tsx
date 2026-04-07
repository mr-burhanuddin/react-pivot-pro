import { useState, useCallback, useMemo } from "react";
import {
  usePivotTable,
  createSortingPlugin,
  createFilteringPlugin,
  createAggregationPlugin,
  useSorting,
  useFiltering,
  usePivotAggregation,
  AGGREGATOR_LABELS,
} from "@pivot";
import type { SalesRow } from "../../data/mockData";
import type {
  SortingTableState,
  FilteringTableState,
  AggregationTableState,
  AggregationFnName,
  SortingRule,
} from "@pivot";
import { SUBSET, SALES_COLUMNS, fmtCurrency } from "../data";
import { MiniTable, Th, Td, Chip } from "../components";
import { ArrowUp, ArrowDown, ArrowUpDown, Search } from "lucide-react";

const DATA = SUBSET.slice(0, 25);

const columns = [
  SALES_COLUMNS[1], // region
  SALES_COLUMNS[3], // product
  SALES_COLUMNS[9], // revenue
  SALES_COLUMNS[8], // units
  SALES_COLUMNS[13], // channel
];

const SORTABLE_NUMERIC_COLS = ["revenue", "units"] as const;
const AGG_OPTIONS: AggregationFnName[] = ["sum", "avg", "count"];

type CombinedState = SortingTableState &
  FilteringTableState &
  AggregationTableState;

export default function CombinedFeaturesExample() {
  const [globalSearch, setGlobalSearch] = useState("");
  const [revenueAgg, setRevenueAgg] = useState<AggregationFnName>("sum");

  const plugins = useMemo(
    () => [
      createSortingPlugin<SalesRow, CombinedState>(),
      createFilteringPlugin<SalesRow, CombinedState>(),
      createAggregationPlugin<SalesRow, CombinedState>({
        autoAggregateColumns: ["revenue", "units"],
        defaultAggregator: "sum",
      }),
    ],
    [],
  );

  const base = usePivotTable<SalesRow, CombinedState>({
    data: DATA,
    columns,
    plugins,
  });

  const sorting = useSorting(base);
  const filtering = useFiltering(base);
  const aggregation = usePivotAggregation(base);

  const { rowModel, columns: cols } = base;

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleGlobalSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setGlobalSearch(value);
      filtering.setGlobalFilter(value || undefined);
    },
    [filtering],
  );

  const handleSortToggle = useCallback(
    (colId: string) => {
      // Cycle: asc -> desc -> removed
      const current = sorting.getIsSorted(colId);
      if (!current) {
        // Not sorted → add asc
        sorting.setSorting((prev: SortingRule[]) => [
          ...prev,
          { id: colId, desc: false },
        ]);
      } else if (!current) {
        // asc → desc
        sorting.setSorting((prev: SortingRule[]) =>
          prev.map((rule: SortingRule) =>
            rule.id === colId ? { ...rule, desc: true } : rule,
          ),
        );
      } else {
        // desc → remove
        sorting.setSorting((prev: SortingRule[]) =>
          prev.filter((rule: SortingRule) => rule.id !== colId),
        );
      }
    },
    [sorting],
  );

  const handleClearSorts = useCallback(() => {
    sorting.setSorting([]);
  }, [sorting]);

  const handleRevenueAggChange = useCallback(
    (fn: AggregationFnName) => {
      setRevenueAgg(fn);
      aggregation.setColumnAggregator("revenue", fn);
    },
    [aggregation],
  );

  const handleResetAll = useCallback(() => {
    setGlobalSearch("");
    filtering.setGlobalFilter(undefined);
    sorting.setSorting([]);
    setRevenueAgg("sum");
    aggregation.setColumnAggregator("revenue", "sum");
  }, [filtering, sorting, aggregation]);

  // ── Grand totals ──────────────────────────────────────────────────────

  const grandTotalRevenue = aggregation.getGrandTotal("revenue");
  const grandTotalUnits = aggregation.getGrandTotal("units");

  const currentSorting = sorting.getSorting();
  const filteredCount = rowModel.rows.length;
  const isFiltered = filteredCount !== DATA.length;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-3)",
          marginBottom: "var(--space-4)",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Global search */}
        <div style={{ position: "relative", maxWidth: 200 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 8,
              top: 7,
              color: "var(--text-tertiary)",
            }}
          />
          <input
            value={globalSearch}
            onChange={handleGlobalSearch}
            placeholder="Search..."
            style={{
              paddingLeft: 28,
              width: "100%",
              padding: "5px 8px 5px 28px",
              border: "var(--border-width-default) solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--text-sm)",
              background: "var(--surface-1)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Sort controls */}
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
            }}
          >
            Sort:
          </span>
          {SORTABLE_NUMERIC_COLS.map((colId) => {
            const state = sorting.getIsSorted(colId);
            return (
              <Chip
                key={colId}
                active={state !== false}
                onClick={() => handleSortToggle(colId)}
              >
                {colId} {state === false ? "–" : state === "asc" ? "↑" : "↓"}
              </Chip>
            );
          })}
          {currentSorting.length > 0 && (
            <button
              onClick={handleClearSorts}
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--accent-600)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Revenue aggregator */}
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
            }}
          >
            Revenue:
          </span>
          {AGG_OPTIONS.map((fn) => (
            <Chip
              key={fn}
              active={revenueAgg === fn}
              onClick={() => handleRevenueAggChange(fn)}
            >
              {AGGREGATOR_LABELS[fn]}
            </Chip>
          ))}
        </div>

        {/* Reset */}
        <button
          onClick={handleResetAll}
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
            background: "var(--surface-3)",
            border: "var(--border-width-default) solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-1) var(--space-3)",
            cursor: "pointer",
          }}
        >
          Reset all
        </button>
      </div>

      {/* Table */}
      <MiniTable>
        <thead>
          <tr>
            {cols.map((col) => {
              const isSortable = SORTABLE_NUMERIC_COLS.includes(
                col.id as (typeof SORTABLE_NUMERIC_COLS)[number],
              );
              const sortState = sorting.getIsSorted(col.id);
              return (
                <Th
                  key={col.id}
                  onClick={
                    isSortable ? () => handleSortToggle(col.id) : undefined
                  }
                  style={{ cursor: isSortable ? "pointer" : "default" }}
                >
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    {col.header}
                    {sortState === "asc" && (
                      <ArrowUp
                        size={12}
                        style={{ color: "var(--accent-600)" }}
                      />
                    )}
                    {sortState === "desc" && (
                      <ArrowDown
                        size={12}
                        style={{ color: "var(--accent-600)" }}
                      />
                    )}
                    {!sortState && isSortable && (
                      <ArrowUpDown
                        size={12}
                        style={{ opacity: 0.3, color: "var(--text-tertiary)" }}
                      />
                    )}
                  </span>
                </Th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rowModel.rows.slice(0, 10).map((row, i) => (
            <tr
              key={row.id}
              style={{
                background:
                  i % 2 === 0
                    ? "var(--table-row-odd)"
                    : "var(--table-row-even)",
              }}
            >
              {cols.map((col) => {
                const val = row.values[col.id ?? ""];
                return (
                  <Td key={col.id}>
                    {col.id === "revenue" || col.id === "cost"
                      ? fmtCurrency(val as number | null | undefined)
                      : val != null
                        ? String(val)
                        : "—"}
                  </Td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr
            style={{
              background: "var(--table-grandtotal-bg)",
              fontWeight: "var(--table-grandtotal-weight)",
              color: "var(--table-grandtotal-text)",
            }}
          >
            {cols.map((col) => (
              <Td key={col.id} style={{ fontWeight: "var(--font-medium)" }}>
                {col.id === "revenue"
                  ? fmtCurrency(grandTotalRevenue)
                  : col.id === "units"
                    ? (grandTotalUnits?.toLocaleString() ?? "—")
                    : "—"}
              </Td>
            ))}
          </tr>
        </tfoot>
      </MiniTable>

      <div
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--text-tertiary)",
          marginTop: "var(--space-2)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          Showing {filteredCount} of {DATA.length} rows
          {isFiltered ? " (filtered)" : ""}
        </span>
        <span>
          Revenue total: {fmtCurrency(grandTotalRevenue)} &middot; Units total:{" "}
          {grandTotalUnits?.toLocaleString() ?? "—"}
        </span>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  usePivotTable,
  createSortingPlugin,
  createFilteringPlugin,
  useSorting,
  useFiltering,
} from "@pivot";
import type { SalesRow } from "../../data/mockData";
import type { SortingTableState, FilteringTableState } from "@pivot";
import type { ColumnDef } from "@pivot";
import { mockData } from "../../data/mockData";
import { SALES_COLUMNS, fmtCurrency } from "../data";
import { MiniTable, Th, Td } from "../components";
import { Search, RefreshCw, AlertCircle } from "lucide-react";

type CombinedState = SortingTableState & FilteringTableState;

const DISPLAY_COLUMNS: ColumnDef<SalesRow>[] = SALES_COLUMNS.slice(0, 6);

const SORTABLE_COLS = [
  "region",
  "country",
  "product",
  "category",
  "revenue",
] as const;

// ── DataTable sub-component (hosts usePivotTable + plugin hooks) ──────────────

function DataTable({
  data,
  globalFilter,
  sortDesc,
  onSortToggle,
  onGlobalFilterChange,
}: {
  data: SalesRow[];
  globalFilter: string;
  sortDesc: Record<string, boolean | null>;
  onSortToggle: (colId: string) => void;
  onGlobalFilterChange: (value: string) => void;
}) {
  const plugins = useMemo(
    () => [
      createSortingPlugin<SalesRow, CombinedState>(),
      createFilteringPlugin<SalesRow, CombinedState>(),
    ],
    [],
  );

  const base = usePivotTable<SalesRow, CombinedState>({
    data,
    columns: DISPLAY_COLUMNS,
    plugins,
  });

  const sorting = useSorting(base);
  const filtering = useFiltering(base);

  const { rowModel, columns: cols } = base;

  // Sync global filter — guard against redundant updates
  useEffect(() => {
    const next = globalFilter || undefined;
    const current = filtering.getGlobalFilter();
    if (current !== next) {
      filtering.setGlobalFilter(next);
    }
  }, [globalFilter, filtering]);

  const displayRowCount = rowModel.rows.length;
  const sourceRowCount = data.length;
  const isFiltered = displayRowCount !== sourceRowCount;

  return (
    <div>
      {/* Search bar */}
      <div style={{ marginBottom: 12, position: "relative", maxWidth: 320 }}>
        <Search
          size={16}
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-secondary)",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          placeholder="Search all columns\u2026"
          style={{
            width: "100%",
            paddingLeft: 34,
            padding: "8px 12px 8px 34px",
            border: "var(--border-width-default) solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-sm)",
            background: "var(--surface-1)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Metadata */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          fontSize: "var(--text-xs)",
          color: "var(--text-tertiary)",
        }}
      >
        <span>
          {isFiltered
            ? `${displayRowCount} of ${sourceRowCount} rows (filtered)`
            : `${sourceRowCount} rows`}
        </span>
        <span>
          {Object.entries(sortDesc)
            .filter(([, v]) => v !== null)
            .map(([id, desc]) => `${id} (${desc ? "desc" : "asc"})`)
            .join(", ") || "No active sorts"}
        </span>
      </div>

      {/* Table */}
      <MiniTable>
        <thead>
          <tr>
            {cols.map((col) => {
              const isActive = SORTABLE_COLS.includes(
                col.id as (typeof SORTABLE_COLS)[number],
              );
              const sortState = sortDesc[col.id ?? ""] ?? null;
              return (
                <Th
                  key={col.id}
                  onClick={isActive ? () => onSortToggle(col.id) : undefined}
                  style={{ cursor: isActive ? "pointer" : "default" }}
                >
                  {col.header}
                  {sortState === false && " \u2191"}
                  {sortState === true && " \u2193"}
                </Th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rowModel.rows.slice(0, 8).map((row, i) => (
            <tr
              key={row.id}
              style={{
                background:
                  i % 2 === 0
                    ? "var(--table-row-odd)"
                    : "var(--table-row-even)",
              }}
            >
              {cols.map((col) => (
                <Td key={col.id}>
                  {col.id === "revenue"
                    ? fmtCurrency(
                        row.values[col.id] as number | null | undefined,
                      )
                    : row.values[col.id] != null
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

// ── Main exported component ───────────────────────────────────────────────────

export default function ApiDrivenExample() {
  const [data, setData] = useState<SalesRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchTime, setFetchTime] = useState(0);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sortDesc, setSortDesc] = useState<Record<string, boolean | null>>({});

  const simulateFetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setData(null);
    setGlobalFilter("");
    setSortDesc({});
    const start = Date.now();
    const timer = setTimeout(
      () => {
        // Simulate ~10% error rate
        if (Math.random() < 0.1) {
          setError("Failed to fetch data. Please try again.");
          setLoading(false);
          return;
        }
        const count = 15 + Math.floor(Math.random() * 20);
        setData(mockData.slice(0, count));
        setFetchTime(Date.now() - start);
        setLoading(false);
      },
      800 + Math.random() * 700,
    );
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const cleanup = simulateFetch();
    return cleanup;
  }, [simulateFetch]);

  const handleSortToggle = useCallback((colId: string) => {
    setSortDesc((prev) => {
      const current = prev[colId] ?? null;
      const next = current === null ? false : current === false ? true : null;
      return { ...prev, [colId]: next };
    });
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          gap: 12,
          color: "var(--text-secondary)",
          fontSize: "var(--text-sm)",
        }}
      >
        <RefreshCw size={18} className="animate-spin" />
        Fetching data from API\u2026
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          padding: 32,
          color: "var(--text-danger)",
        }}
      >
        <AlertCircle size={24} />
        <span style={{ fontSize: "var(--text-sm)" }}>{error}</span>
        <button
          onClick={simulateFetch}
          style={{
            padding: "6px 16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--accent-600)",
            background: "var(--accent-600)",
            color: "var(--accent-contrast)",
            fontSize: "var(--text-sm)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <button
          onClick={simulateFetch}
          style={{
            padding: "8px 20px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--accent-600)",
            background: "var(--accent-600)",
            color: "var(--accent-contrast)",
            fontSize: "var(--text-sm)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RefreshCw size={14} /> Load Data
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Metadata bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          padding: "8px 12px",
          borderRadius: "var(--radius-md)",
          background: "var(--surface-3)",
          fontSize: "var(--text-xs)",
          color: "var(--text-secondary)",
        }}
      >
        <span>
          {data.length} rows loaded in {fetchTime}ms
        </span>
        <button
          onClick={simulateFetch}
          style={{
            padding: "4px 10px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-default)",
            background: "var(--surface-2)",
            color: "var(--text-secondary)",
            fontSize: "var(--text-xs)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <DataTable
        data={data}
        globalFilter={globalFilter}
        sortDesc={sortDesc}
        onSortToggle={handleSortToggle}
        onGlobalFilterChange={setGlobalFilter}
      />
    </div>
  );
}



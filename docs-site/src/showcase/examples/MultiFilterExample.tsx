import { useState, useMemo, useCallback } from "react";
import { usePivotTable, createFilteringPlugin, withFiltering } from "@pivot";
import type { SalesRow } from "../../data/mockData";
import type { FilteringTableState, ColumnFilter } from "@pivot";
import { SUBSET, SALES_COLUMNS, fmtCurrency } from "../data";
import { MiniTable, Th, Td, Chip } from "../components";
import { Search, X } from "lucide-react";

const DATA = SUBSET.slice(0, 20);

const columns = [
  SALES_COLUMNS[1], // region
  SALES_COLUMNS[3], // product
  SALES_COLUMNS[9], // revenue
  SALES_COLUMNS[8], // units
  SALES_COLUMNS[13], // channel
];

const regions = [...new Set(DATA.map((r) => r.region))];

export default function MultiFilterExample() {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [revenueMin, setRevenueMin] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");

  const plugins = useMemo(
    () => [createFilteringPlugin<SalesRow, FilteringTableState>()],
    [],
  );

  const base = usePivotTable<SalesRow, FilteringTableState>({
    data: DATA,
    columns,
    plugins,
  });
  const table = withFiltering(base);

  const { rowModel, columns: cols, filtering } = table;
  const filters = filtering.getColumnFilters();

  // ── Global search ──────────────────────────────────────────────────────────
  const handleGlobalSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setGlobalSearch(value);
      filtering.setGlobalFilter(value || undefined);
    },
    [filtering],
  );

  // ── Region enum filter (multi-select via chips) ────────────────────────────
  const toggleRegion = useCallback(
    (region: string) => {
      setSelectedRegions((prev) => {
        const next = prev.includes(region)
          ? prev.filter((r) => r !== region)
          : [...prev, region];

        if (next.length > 0) {
          filtering.setColumnFilter("region", next, "enum", "in");
        } else {
          filtering.setColumnFilter("region", undefined);
        }
        return next;
      });
    },
    [filtering],
  );

  // ── Revenue number filter (gte) ────────────────────────────────────────────
  const handleRevenueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setRevenueMin(value);
      const num = value === "" ? undefined : Number(value);
      filtering.setColumnFilter("revenue", num, "number", "gte");
    },
    [filtering],
  );

  // ── Product text filter (contains) ─────────────────────────────────────────
  const handleProductChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setProductSearch(value);
      filtering.setColumnFilter(
        "product",
        value || undefined,
        "text",
        "contains",
      );
    },
    [filtering],
  );

  // ── Clear individual filter ────────────────────────────────────────────────
  const clearFilter = useCallback(
    (columnId: string) => {
      filtering.setColumnFilter(columnId, undefined);
      if (columnId === "region") setSelectedRegions([]);
      if (columnId === "revenue") setRevenueMin("");
      if (columnId === "product") setProductSearch("");
    },
    [filtering],
  );

  const clearAll = useCallback(() => {
    filtering.resetColumnFilters();
    filtering.resetGlobalFilter();
    setSelectedRegions([]);
    setRevenueMin("");
    setProductSearch("");
    setGlobalSearch("");
  }, [filtering]);

  const filterLabels: Record<string, string> = {
    region: "Region",
    revenue: "Revenue",
    product: "Product",
  };

  return (
    <div>
      {/* ── Global search ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            position: "relative",
            flex: 1,
            maxWidth: 320,
          }}
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-secondary)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={globalSearch}
            onChange={handleGlobalSearch}
            placeholder="Search all columns…"
            style={{
              width: "100%",
              paddingLeft: 32,
              paddingRight: 8,
              paddingBlock: 6,
              fontSize: 13,
              borderRadius: 6,
              border: "1px solid var(--border-default)",
              background: "var(--surface-1)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* ── Column-level filters ──────────────────────────────────────────── */}
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 12 }}
      >
        {/* Region enum chips */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-secondary)",
              marginBottom: 4,
            }}
          >
            Region
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {regions.map((region) => (
              <Chip
                key={region}
                active={selectedRegions.includes(region)}
                onClick={() => toggleRegion(region)}
              >
                {region}
              </Chip>
            ))}
          </div>
        </div>

        {/* Revenue >= number */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-secondary)",
              marginBottom: 4,
            }}
          >
            Revenue {"\u2265"}
          </div>
          <input
            type="number"
            value={revenueMin}
            onChange={handleRevenueChange}
            placeholder="Min revenue"
            style={{
              width: 120,
              padding: "4px 8px",
              fontSize: 13,
              borderRadius: 6,
              border: "1px solid var(--border-default)",
              background: "var(--surface-1)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
        </div>

        {/* Product contains text */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-secondary)",
              marginBottom: 4,
            }}
          >
            Product contains
          </div>
          <input
            type="text"
            value={productSearch}
            onChange={handleProductChange}
            placeholder="Product name"
            style={{
              width: 150,
              padding: "4px 8px",
              fontSize: 13,
              borderRadius: 6,
              border: "1px solid var(--border-default)",
              background: "var(--surface-1)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* ── Active filters ────────────────────────────────────────────────── */}
      {filters.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            Active filters:
          </span>
          {filters.map((filter: ColumnFilter) => {
            const label = filterLabels[filter.id] || filter.id;
            let valueLabel: string;
            if (filter.id === "region" && Array.isArray(filter.value)) {
              valueLabel = filter.value.join(", ");
            } else if (filter.id === "revenue" && filter.operator === "gte") {
              valueLabel = `\u2265 ${fmtCurrency(filter.value as number | null | undefined)}`;
            } else {
              valueLabel = String(filter.value);
            }

            return (
              <span
                key={filter.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  fontSize: 12,
                  borderRadius: 6,
                  background: "color-mix(in srgb, #0891B2 10%, transparent)",
                  color: "var(--accent-600)",
                  fontWeight: 500,
                }}
              >
                {label}: {valueLabel}
                <button
                  onClick={() => clearFilter(filter.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "inherit",
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
          <button
            onClick={clearAll}
            style={{
              fontSize: 11,
              color: "var(--text-secondary)",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Row count ─────────────────────────────────────────────────────── */}
      <div
        style={{
          marginBottom: 8,
          fontSize: 12,
          color: "var(--text-secondary)",
        }}
      >
        Showing {rowModel.rows.length} of {DATA.length} rows
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <MiniTable>
        <thead>
          <tr>
            {cols.map((col) => (
              <Th key={col.id}>{col.header}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowModel.rows.map((row, idx) => (
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


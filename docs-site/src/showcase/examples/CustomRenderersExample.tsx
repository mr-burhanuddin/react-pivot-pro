import { useMemo, useCallback } from "react";
import { usePivotTable, createSortingPlugin, withSorting } from "@pivot";
import type { SalesRow } from "../../data/mockData";
import type { ColumnDef, SortingTableState } from "@pivot";
import { SUBSET, fmtCurrency, fmtPercent } from "../data";
import { MiniTable, Th, Td } from "../components";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

/* ─── Channel colour map — uses CSS variables for theme awareness ─── */

const CHANNEL_COLORS: Record<string, { bg: string; color: string }> = {
  Direct: {
    bg: "var(--channel-direct-bg)",
    color: "var(--channel-direct-text)",
  },
  Partner: {
    bg: "var(--channel-partner-bg)",
    color: "var(--channel-partner-text)",
  },
  Online: {
    bg: "var(--channel-online-bg)",
    color: "var(--channel-online-text)",
  },
  Retail: {
    bg: "var(--channel-retail-bg)",
    color: "var(--channel-retail-text)",
  },
};

/* ─── Column definitions with custom cell renderers ─── */

const columns: ColumnDef<SalesRow>[] = [
  {
    id: "region",
    header: "Region",
    accessorKey: "region",
    enableSorting: true,
  },
  {
    id: "product",
    header: "Product",
    accessorKey: "product",
    enableSorting: true,
  },
  {
    id: "revenue",
    header: "Revenue",
    accessorKey: "revenue",
    enableSorting: true,
    cell: (val: unknown) => {
      const v = Number(val);
      const color = v > 50000 ? "var(--accent-600)" : "var(--text-secondary)";
      return (
        <span
          style={{
            color,
            fontWeight:
              v > 50000 ? "var(--font-medium)" : "var(--font-regular)",
          }}
        >
          {fmtCurrency(v)}
        </span>
      );
    },
  },
  {
    id: "margin",
    header: "Margin",
    accessorKey: "margin",
    enableSorting: true,
    cell: (val: unknown) => {
      const v = Number(val);
      const isHigh = v > 20;
      const isLow = v < 10;
      return (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: isHigh
              ? "var(--text-success)"
              : isLow
                ? "var(--text-danger)"
                : "inherit",
          }}
        >
          {isHigh ? (
            <TrendingUp size={12} />
          ) : isLow ? (
            <TrendingDown size={12} />
          ) : null}
          {fmtPercent(v)}
        </span>
      );
    },
  },
  {
    id: "channel",
    header: "Channel",
    accessorKey: "channel",
    enableSorting: true,
    cell: (val: unknown) => {
      const channel = String(val);
      const palette = CHANNEL_COLORS[channel] ?? {
        bg: "var(--channel-default-bg)",
        color: "var(--channel-default-text)",
      };
      return (
        <span
          style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: "9999px",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-medium)",
            background: palette.bg,
            color: palette.color,
          }}
        >
          {channel}
        </span>
      );
    },
  },
  {
    id: "discount",
    header: "Discount",
    accessorKey: "discount",
    enableSorting: true,
    cell: (val: unknown) => {
      const v = Math.min(100, Math.max(0, Number(val)));
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
          }}
        >
          <div
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              background: "var(--surface-2)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${v}%`,
                height: "100%",
                borderRadius: 3,
                background:
                  v > 20
                    ? "var(--discount-high)"
                    : v > 10
                      ? "var(--discount-medium)"
                      : "var(--discount-low)",
                transition: "width 0.2s ease",
              }}
            />
          </div>
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--text-secondary)",
              minWidth: 32,
              textAlign: "right",
            }}
          >
            {v.toFixed(0)}%
          </span>
        </div>
      );
    },
  },
];

/* ─── Sortable column IDs ─── */

const SORTABLE_COLS = [
  "region",
  "product",
  "revenue",
  "margin",
  "channel",
  "discount",
];

/* ─── Example component ─── */

export default function CustomRenderersExample() {
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
    (colId: string) => {
      sorting.toggleSorting(colId, false);
    },
    [sorting],
  );

  const handleClearSorting = useCallback(() => {
    sorting.clearSorting();
  }, [sorting]);

  const currentSorting = sorting.getSorting();

  return (
    <div>
      {/* Sort indicator */}
      {currentSorting.length > 0 && (
        <div
          style={{
            marginBottom: 8,
            fontSize: 13,
            color: "var(--accent-600)",
            fontWeight: 500,
          }}
        >
          Sorted:{" "}
          {currentSorting
            .map((s) => `${s.id} (${s.desc ? "desc" : "asc"})`)
            .join(", ")}
        </div>
      )}

      <MiniTable>
        <thead>
          <tr>
            {cols.map((col) => {
              const sortState = sorting.getIsSorted(col.id);
              const isSorted = sortState !== false;
              const isSortable = SORTABLE_COLS.includes(col.id);

              return (
                <Th
                  key={col.id}
                  onClick={
                    isSortable ? () => handleHeaderClick(col.id) : undefined
                  }
                  style={{
                    background: isSorted ? "var(--accent-50)" : undefined,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {col.header}
                    {isSortable && (
                      <span style={{ opacity: 0.6, width: 14, height: 14 }}>
                        {sortState === "asc" && <ArrowUp size={14} />}
                        {sortState === "desc" && <ArrowDown size={14} />}
                        {!isSorted && <ArrowUpDown size={14} />}
                      </span>
                    )}
                  </span>
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
              {cols.map((col) => {
                const val = row.values[col.id];
                const cellRenderer = col.cell;

                return (
                  <Td key={col.id}>
                    {cellRenderer
                      ? cellRenderer(val, row.original)
                      : val !== undefined && val !== null
                        ? String(val)
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

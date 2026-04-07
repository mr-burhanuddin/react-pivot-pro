import { useMemo, useCallback } from "react";
import {
  usePivotTable,
  createAggregationPlugin,
  withAggregation,
  AGGREGATOR_LABELS,
} from "@pivot";
import type { SalesRow } from "../../data/mockData";
import type { AggregationTableState, AggregationFnName } from "@pivot";
import { SUBSET, SALES_COLUMNS, fmtCurrency } from "../data";
import { MiniTable, Th, Td, Chip } from "../components";

const DATA = SUBSET.slice(0, 30);

const AGGREGATABLE_COLS: {
  id: string;
  header: string;
  format: (v: number | null) => string;
}[] = [
  { id: "revenue", header: "Revenue", format: fmtCurrency },
  { id: "cost", header: "Cost", format: fmtCurrency },
  {
    id: "units",
    header: "Units",
    format: (v) => (v == null ? "\u2014" : v.toLocaleString()),
  },
];

const AGG_OPTIONS: AggregationFnName[] = ["sum", "avg", "min", "max", "count"];

const columns = [
  SALES_COLUMNS.find((c) => c.id === "region")!,
  SALES_COLUMNS.find((c) => c.id === "product")!,
  SALES_COLUMNS.find((c) => c.id === "units")!,
  SALES_COLUMNS.find((c) => c.id === "revenue")!,
  SALES_COLUMNS.find((c) => c.id === "cost")!,
];

export default function ColumnAggregationExample() {
  const plugins = useMemo(
    () => [
      createAggregationPlugin<SalesRow, AggregationTableState>({
        autoAggregateColumns: ["revenue", "cost", "units"],
        defaultAggregator: "sum",
      }),
    ],
    [],
  );

  const base = usePivotTable<SalesRow, AggregationTableState>({
    data: DATA,
    columns,
    plugins,
  });
  const table = withAggregation(base);

  const { rowModel, columns: cols, aggregation } = table;

  const currentAggregators = aggregation.getColumnAggregators();

  const handleSetAggregator = useCallback(
    (columnId: string, fn: AggregationFnName) => {
      aggregation.setColumnAggregator(columnId, fn);
    },
    [aggregation],
  );

  return (
    <div>
      {/* ── Per-column aggregator controls ──────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {AGGREGATABLE_COLS.map((col) => {
          const currentFn = currentAggregators[col.id] ?? "sum";
          return (
            <div key={col.id}>
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
                {col.header}{" "}
                <span
                  style={{
                    fontWeight: 400,
                    textTransform: "none",
                    letterSpacing: 0,
                    color: "var(--accent-600)",
                  }}
                >
                  (
                  {AGGREGATOR_LABELS[currentFn as AggregationFnName] ??
                    currentFn}
                  )
                </span>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {AGG_OPTIONS.map((fn) => (
                  <Chip
                    key={fn}
                    active={currentAggregators[col.id] === fn}
                    onClick={() => handleSetAggregator(col.id, fn)}
                  >
                    {AGGREGATOR_LABELS[fn]}
                  </Chip>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
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
              {cols.map((col) => {
                const colMeta = AGGREGATABLE_COLS.find((c) => c.id === col.id);
                const val = row.values[col.id];
                return (
                  <Td key={col.id}>
                    {colMeta && typeof val === "number"
                      ? colMeta.format(val)
                      : val !== undefined && val !== null
                        ? String(val)
                        : "\u2014"}
                  </Td>
                );
              })}
            </tr>
          ))}
          {/* ── Grand Totals footer row ─────────────────────────────────── */}
          <tr
            style={{
              background: "var(--surface-2)",
              fontWeight: 600,
            }}
          >
            {cols.map((col) => {
              const colMeta = AGGREGATABLE_COLS.find((c) => c.id === col.id);
              if (colMeta) {
                const total = aggregation.getGrandTotal(col.id);
                return (
                  <Td
                    key={col.id}
                    style={{
                      borderTop: "2px solid var(--border-emphasis)",
                    }}
                  >
                    {colMeta.format(total)}
                  </Td>
                );
              }
              return (
                <Td
                  key={col.id}
                  style={{
                    borderTop: "2px solid var(--border-emphasis)",
                  }}
                >
                  Grand Total
                </Td>
              );
            })}
          </tr>
        </tbody>
      </MiniTable>
    </div>
  );
}


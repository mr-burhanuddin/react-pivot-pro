import { useState, useCallback, useRef, useMemo } from "react";
import type { SalesRow } from "../data/mockData";
import { mockData } from "../data/mockData";
import {
  usePivotTable,
  createSortingPlugin,
  createFilteringPlugin,
  createGroupingPlugin,
  createAggregationPlugin,
  createColumnVisibilityPlugin,
  createColumnOrderingPlugin,
  createColumnPinningPlugin,
  createDndRowPlugin,
  createDndColumnPlugin,
  withSorting,
  withFiltering,
  withGrouping,
  withAggregation,
  withColumnVisibility,
  withColumnOrdering,
  withColumnPinning,
  withDndRow,
  withDndColumn,
  useSorting,
  useFiltering,
  useGrouping,
  usePivotAggregation,
  useVirtualRows,
  useVirtualColumns,
  AGGREGATOR_LABELS,
} from "@pivot";
import type {
  ColumnDef,
  SortingTableState,
  FilteringTableState,
  GroupingTableState,
  AggregationTableState,
  ColumnVisibilityTableState,
  ColumnOrderingTableState,
  ColumnPinningTableState,
  DndRowTableState,
  DndColumnTableState,
  PinSide,
} from "@pivot";
import CodeBlock from "../components/CodeBlock";
import {
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Columns,
  Download,
  Layers,
  Filter,
  Table2,
  Settings2,
  Check,
  GripVertical,
} from "lucide-react";

/* ─── data ─── */
const SUBSET = mockData.slice(0, 50);

const COLUMNS: ColumnDef<SalesRow>[] = [
  { id: "orderId", header: "Order ID", accessorKey: "orderId" },
  {
    id: "region",
    header: "Region",
    accessorKey: "region",
    enableSorting: true,
    enableFiltering: true,
  },
  {
    id: "country",
    header: "Country",
    accessorKey: "country",
    enableSorting: true,
    enableFiltering: true,
  },
  {
    id: "product",
    header: "Product",
    accessorKey: "product",
    enableSorting: true,
    enableFiltering: true,
  },
  {
    id: "category",
    header: "Category",
    accessorKey: "category",
    enableSorting: true,
    enableFiltering: true,
  },
  {
    id: "salesRep",
    header: "Sales Rep",
    accessorKey: "salesRep",
    enableSorting: true,
  },
  {
    id: "quarter",
    header: "Quarter",
    accessorKey: "quarter",
    enableSorting: true,
  },
  { id: "year", header: "Year", accessorKey: "year", enableSorting: true },
  { id: "units", header: "Units", accessorKey: "units", enableSorting: true },
  {
    id: "revenue",
    header: "Revenue",
    accessorKey: "revenue",
    enableSorting: true,
  },
  { id: "cost", header: "Cost", accessorKey: "cost", enableSorting: true },
  {
    id: "margin",
    header: "Margin %",
    accessorKey: "margin",
    enableSorting: true,
  },
  {
    id: "discount",
    header: "Discount %",
    accessorKey: "discount",
    enableSorting: true,
  },
  {
    id: "channel",
    header: "Channel",
    accessorKey: "channel",
    enableSorting: true,
    enableFiltering: true,
  },
  {
    id: "customerType",
    header: "Customer",
    accessorKey: "customerType",
    enableSorting: true,
  },
];

const fmt = (v?: number) =>
  v != null
    ? `$${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : "—";

/* ─── shared UI ─── */
interface DemoCardProps {
  title: string;
  badge: string;
  description: string;
  children: React.ReactNode;
  code: string;
  icon: React.ReactNode;
}

function DemoCard({
  title,
  badge,
  description,
  children,
  code,
  icon,
}: DemoCardProps) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div
      className="demo-section"
      style={{
        border: "var(--border-width-default) solid var(--border-default)",
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
        marginBottom: "var(--space-8)",
        background: "var(--surface-2)",
      }}
    >
      <div
        style={{
          padding: "var(--space-4) var(--space-6)",
          borderBottom:
            "var(--border-width-default) solid var(--border-default)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            marginBottom: "var(--space-2)",
          }}
        >
          <span style={{ color: "var(--text-secondary)" }}>{icon}</span>
          <h3
            style={{
              margin: 0,
              fontSize: "var(--text-md)",
              fontWeight: "var(--font-medium)",
              color: "var(--text-primary)",
            }}
          >
            {title}
          </h3>
          <span
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-medium)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background: "var(--surface-4)",
              color: "var(--text-secondary)",
            }}
          >
            {badge}
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
          }}
        >
          {description}
        </p>
      </div>
      <div style={{ padding: "var(--space-6)" }}>{children}</div>
      <div
        style={{
          borderTop: "var(--border-width-default) solid var(--border-default)",
        }}
      >
        <button
          onClick={() => setShowCode(!showCode)}
          style={{
            width: "100%",
            padding: "var(--space-3) var(--space-6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--surface-3)",
            border: "none",
            cursor: "pointer",
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
            fontWeight: "var(--font-medium)",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            <Settings2 size={14} /> Source code
          </span>
          <span>{showCode ? "▲" : "▼"}</span>
        </button>
        {showCode && <CodeBlock code={code} language="tsx" />}
      </div>
    </div>
  );
}

function MiniTable({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "var(--border-width-default) solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        overflow: "auto",
        maxHeight: 320,
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "var(--text-sm)",
        }}
      >
        {children}
      </table>
    </div>
  );
}

function Th({
  children,
  onClick,
  style,
  ...rest
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
} & React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      onClick={onClick}
      style={{
        padding: "var(--space-2) var(--space-3)",
        textAlign: "left",
        fontWeight: "var(--font-medium)",
        fontSize: "var(--text-xs)",
        textTransform: "uppercase",
        letterSpacing: "var(--table-header-tracking)",
        color: "var(--table-header-text)",
        background: "var(--table-header-bg)",
        borderBottom:
          "var(--border-width-emphasis) solid var(--border-emphasis)",
        cursor: onClick ? "pointer" : "default",
        position: "sticky",
        top: 0,
        zIndex: 1,
        userSelect: "none",
        ...style,
      }}
      {...rest}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        padding: "var(--space-2) var(--space-3)",
        borderBottom: "var(--border-width-default) solid var(--border-default)",
        color: "var(--text-primary)",
        ...style,
      }}
    >
      {children}
    </td>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "var(--space-1) var(--space-3)",
        fontSize: "var(--text-sm)",
        borderRadius: "var(--radius-md)",
        border: "var(--border-width-default) solid var(--border-default)",
        background: active
          ? "color-mix(in srgb, #0891B2 10%, transparent)"
          : "var(--surface-3)",
        color: active ? "var(--accent-600)" : "var(--text-secondary)",
        cursor: "pointer",
        fontWeight: active ? "var(--font-medium)" : "var(--font-regular)",
        transition: "all var(--duration-micro) var(--ease-enter)",
      }}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════
   SORTING DEMO
   ═══════════════════════════════════════════ */
function SortingDemo() {
  const tableBase = usePivotTable<SalesRow, SortingTableState>({
    data: useMemo(() => SUBSET, []),
    columns: useMemo(() => COLUMNS.slice(0, 6), []),
    plugins: useMemo(() => [createSortingPlugin()], []),
  });
  const table = useMemo(() => withSorting(tableBase), [tableBase]);
  const rows = table.getRowModel().rows;
  const sortState = table.sorting.getSorting();

  const getSortIcon = (id: string) => {
    const s = table.sorting.getIsSorted(id);
    if (s === "asc")
      return <ArrowUp size={12} style={{ color: "var(--accent-600)" }} />;
    if (s === "desc")
      return <ArrowDown size={12} style={{ color: "var(--accent-600)" }} />;
    return (
      <ArrowUpDown
        size={12}
        style={{ opacity: 0.3, color: "var(--text-tertiary)" }}
      />
    );
  };

  return (
    <div
      style={{
        marginBottom: "var(--space-3)",
        display: "flex",
        gap: "var(--space-3)",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}
      >
        Sorted by:{" "}
        {sortState.length
          ? sortState
              .map((s) => `${s.id} (${s.desc ? "desc" : "asc"})`)
              .join(", ")
          : "none"}
      </span>
      {sortState.length > 0 && (
        <button
          onClick={() => table.sorting.clearSorting()}
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--accent-600)",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Clear sort
        </button>
      )}
      <MiniTable>
        <thead>
          <tr>
            {table.columns.slice(0, 5).map((col) => (
              <Th
                key={col.id}
                onClick={() => table.sorting.toggleSorting(col.id)}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {col.header}
                  {getSortIcon(col.id)}
                </span>
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 8).map((row, i) => (
            <tr
              key={row.id}
              style={{
                background:
                  i % 2 === 0
                    ? "var(--table-row-odd)"
                    : "var(--table-row-even)",
              }}
            >
              {table.columns.slice(0, 5).map((col) => (
                <Td key={col.id}>{String(row.values[col.id ?? ""] ?? "—")}</Td>
              ))}
            </tr>
          ))}
        </tbody>
      </MiniTable>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FILTERING DEMO
   ═══════════════════════════════════════════ */
function FilteringDemo() {
  const [globalFilter, setGlobalFilter] = useState("");
  const tableBase = usePivotTable<SalesRow, FilteringTableState>({
    data: useMemo(() => SUBSET, []),
    columns: useMemo(() => COLUMNS.slice(0, 6), []),
    plugins: useMemo(() => [createFilteringPlugin()], []),
  });
  const table = useMemo(() => withFiltering(tableBase), [tableBase]);
  const rows = table.getRowModel().rows;
  const filteredCount = rows.length;

  const handleFilter = useCallback(
    (value: string) => {
      setGlobalFilter(value);
      table.filtering.setGlobalFilter(value);
    },
    [table.filtering],
  );

  return (
    <>
      <div
        style={{
          marginBottom: "var(--space-3)",
          position: "relative",
          maxWidth: 280,
        }}
      >
        <Search
          size={14}
          style={{
            position: "absolute",
            left: 10,
            top: 8,
            color: "var(--text-tertiary)",
          }}
        />
        <input
          value={globalFilter}
          onChange={(e) => handleFilter(e.target.value)}
          placeholder="Search all columns..."
          style={{
            paddingLeft: 30,
            width: "100%",
            padding: "6px 10px 6px 30px",
            border: "var(--border-width-default) solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-sm)",
            background: "var(--surface-1)",
            color: "var(--text-primary)",
          }}
        />
      </div>
      <MiniTable>
        <thead>
          <tr>
            {table.columns.slice(0, 5).map((col) => (
              <Th key={col.id}>{col.header}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 8).map((row, i) => (
            <tr
              key={row.id}
              style={{
                background:
                  i % 2 === 0
                    ? "var(--table-row-odd)"
                    : "var(--table-row-even)",
              }}
            >
              {table.columns.slice(0, 5).map((col) => (
                <Td key={col.id}>{String(row.values[col.id ?? ""] ?? "—")}</Td>
              ))}
            </tr>
          ))}
        </tbody>
      </MiniTable>
      <div
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--text-tertiary)",
          marginTop: "var(--space-2)",
        }}
      >
        Showing {filteredCount} of {SUBSET.length} rows
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   GROUPING DEMO
   ═══════════════════════════════════════════ */
function GroupingDemo() {
  const [rowGrouping, setRowGrouping] = useState<string[]>(["region"]);
  const tableBase = usePivotTable<SalesRow, GroupingTableState>({
    data: useMemo(() => SUBSET, []),
    columns: useMemo(() => COLUMNS.slice(0, 6), []),
    plugins: useMemo(() => [createGroupingPlugin()], []),
  });
  const table = useMemo(() => withGrouping(tableBase), [tableBase]);

  const handleGroup = useCallback(
    (field: string) => {
      setRowGrouping((prev) => {
        const next = prev.includes(field)
          ? prev.filter((f) => f !== field)
          : [...prev, field];
        table.grouping.setRowGrouping(next);
        return next;
      });
    },
    [table],
  );

  const handleClear = useCallback(() => {
    setRowGrouping([]);
    table.grouping.setRowGrouping([]);
  }, [table]);

  const rows = table.getRowModel().rows;

  return (
    <>
      <div
        style={{
          marginBottom: "var(--space-3)",
          display: "flex",
          gap: "var(--space-2)",
          flexWrap: "wrap",
        }}
      >
        {["region", "category", "channel"].map((field) => (
          <Chip
            key={field}
            active={rowGrouping.includes(field)}
            onClick={() => handleGroup(field)}
          >
            {field}
          </Chip>
        ))}
        <button
          onClick={handleClear}
          style={{
            padding: "var(--space-1) var(--space-3)",
            fontSize: "var(--text-sm)",
            borderRadius: "var(--radius-md)",
            border: "var(--border-width-default) solid var(--border-default)",
            background: "var(--surface-3)",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>
      <MiniTable>
        <thead>
          <tr>
            <Th style={{ width: 30 }}>
              <span />
            </Th>
            {table.columns.slice(0, 5).map((col) => (
              <Th key={col.id}>{col.header}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 12).map((row, i) => {
            const isGroup = row.values.__group === true;
            return (
              <tr
                key={row.id}
                style={{
                  background: isGroup
                    ? "var(--table-subtotal-bg)"
                    : i % 2 === 0
                      ? "var(--table-row-odd)"
                      : "var(--table-row-even)",
                }}
              >
                <Td>
                  {isGroup && (
                    <button
                      onClick={() => table.grouping.toggleGroupExpanded(row.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {table.grouping.getIsGroupExpanded(row.id) ? (
                        <ChevronDown size={12} />
                      ) : (
                        <ChevronRight size={12} />
                      )}
                    </button>
                  )}
                </Td>
                {table.columns.slice(0, 5).map((col) => (
                  <Td
                    key={col.id}
                    style={{
                      fontWeight: isGroup
                        ? "var(--table-subtotal-weight)"
                        : "var(--font-regular)",
                      color: isGroup
                        ? "var(--table-subtotal-text)"
                        : "var(--text-primary)",
                    }}
                  >
                    {isGroup
                      ? `Group: ${row.values[col.id ?? ""] ?? row.id}`
                      : String(row.values[col.id ?? ""] ?? "—")}
                  </Td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </MiniTable>
    </>
  );
}

/* ═══════════════════════════════════════════
   AGGREGATION DEMO
   ═══════════════════════════════════════════ */
function AggregationDemo() {
  const [agg, setAgg] = useState<"sum" | "avg" | "min" | "max" | "count">(
    "sum",
  );
  const tableBase = usePivotTable<SalesRow, AggregationTableState>({
    data: useMemo(() => SUBSET, []),
    columns: useMemo(() => COLUMNS.slice(0, 6), []),
    plugins: useMemo(
      () => [
        createAggregationPlugin({
          autoAggregateColumns: ["revenue"],
          defaultAggregator: agg,
        }),
      ],
      [agg],
    ),
  });
  const table = useMemo(() => withAggregation(tableBase), [tableBase]);
  const rows = table.getRowModel().rows;
  const grandTotal = table.aggregation.getGrandTotal("revenue");

  const handleAgg = useCallback(
    (fn: "sum" | "avg" | "min" | "max" | "count") => {
      setAgg(fn);
      table.aggregation.setColumnAggregator("revenue", fn);
    },
    [table.aggregation],
  );

  return (
    <>
      <div
        style={{
          marginBottom: "var(--space-3)",
          display: "flex",
          gap: "var(--space-2)",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span
          style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}
        >
          Aggregator:
        </span>
        {(["sum", "avg", "min", "max", "count"] as const).map((fn) => (
          <Chip key={fn} active={agg === fn} onClick={() => handleAgg(fn)}>
            {AGGREGATOR_LABELS[fn]}
          </Chip>
        ))}
      </div>
      <MiniTable>
        <thead>
          <tr>
            {table.columns.slice(0, 5).map((col) => (
              <Th key={col.id}>{col.header}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 8).map((row, i) => {
            const isGrandTotal = row.values._isGrandTotal === true;
            return (
              <tr
                key={row.id}
                style={{
                  background: isGrandTotal
                    ? "var(--table-grandtotal-bg)"
                    : i % 2 === 0
                      ? "var(--table-row-odd)"
                      : "var(--table-row-even)",
                  color: isGrandTotal
                    ? "var(--table-grandtotal-text)"
                    : "var(--text-primary)",
                }}
              >
                {table.columns.slice(0, 5).map((col) => (
                  <Td
                    key={col.id}
                    style={{
                      fontWeight: isGrandTotal
                        ? "var(--table-grandtotal-weight)"
                        : "var(--font-regular)",
                      color: isGrandTotal
                        ? "var(--table-grandtotal-text)"
                        : "var(--text-primary)",
                    }}
                  >
                    {isGrandTotal
                      ? col.id === "revenue"
                        ? fmt(grandTotal ?? undefined)
                        : "Total"
                      : String(row.values[col.id ?? ""] ?? "—")}
                  </Td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </MiniTable>
      <div
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--text-tertiary)",
          marginTop: "var(--space-2)",
        }}
      >
        Grand total (revenue): {grandTotal != null ? fmt(grandTotal) : "null"}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   COLUMN VISIBILITY DEMO
   ═══════════════════════════════════════════ */
function VisibilityDemo() {
  const tableBase = usePivotTable<SalesRow, ColumnVisibilityTableState>({
    data: useMemo(() => SUBSET, []),
    columns: useMemo(() => COLUMNS.slice(0, 8), []),
    plugins: useMemo(() => [createColumnVisibilityPlugin()], []),
  });
  const table = useMemo(() => withColumnVisibility(tableBase), [tableBase]);
  const visible = table.columnVisibility.getVisibleColumnIds();

  return (
    <>
      <div
        style={{
          marginBottom: "var(--space-3)",
          display: "flex",
          gap: "var(--space-2)",
          flexWrap: "wrap",
        }}
      >
        {COLUMNS.slice(0, 8).map((col) => {
          const colId = col.id ?? "";
          const isVisible = table.columnVisibility.getIsColumnVisible(colId);
          return (
            <Chip
              key={colId}
              active={isVisible}
              onClick={() =>
                table.columnVisibility.toggleColumnVisibility(colId)
              }
            >
              {col.header}
            </Chip>
          );
        })}
      </div>
      <MiniTable>
        <thead>
          <tr>
            {table.columns
              .filter((c) => visible.includes(c.id ?? ""))
              .slice(0, 6)
              .map((col) => (
                <Th key={col.id}>{col.header}</Th>
              ))}
          </tr>
        </thead>
        <tbody>
          {table
            .getRowModel()
            .rows.slice(0, 6)
            .map((row, i) => (
              <tr
                key={row.id}
                style={{
                  background:
                    i % 2 === 0
                      ? "var(--table-row-odd)"
                      : "var(--table-row-even)",
                }}
              >
                {table.columns
                  .filter((c) => visible.includes(c.id ?? ""))
                  .slice(0, 6)
                  .map((col) => (
                    <Td key={col.id}>
                      {String(row.values[col.id ?? ""] ?? "—")}
                    </Td>
                  ))}
              </tr>
            ))}
        </tbody>
      </MiniTable>
    </>
  );
}

/* ═══════════════════════════════════════════
   COLUMN ORDERING DEMO
   ═══════════════════════════════════════════ */
function ColumnOrderingDemo() {
  const tableBase = usePivotTable<SalesRow, ColumnOrderingTableState>({
    data: useMemo(() => SUBSET, []),
    columns: useMemo(() => COLUMNS.slice(0, 6), []),
    plugins: useMemo(() => [createColumnOrderingPlugin()], []),
  });
  const table = useMemo(() => withColumnOrdering(tableBase), [tableBase]);
  const order = table.columnOrdering.getColumnOrder();

  const moveCol = (colId: string, dir: -1 | 1) => {
    const current = table.columnOrdering.getOrderedColumnIds();
    const idx = current.indexOf(colId);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= current.length) return;
    table.columnOrdering.reorderColumn(colId, newIdx);
  };

  return (
    <>
      <MiniTable>
        <thead>
          <tr>
            {table.columns.map((col) => (
              <Th key={col.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button
                    onClick={() => moveCol(col.id ?? "", -1)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    ←
                  </button>
                  {col.header}
                  <button
                    onClick={() => moveCol(col.id ?? "", 1)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    →
                  </button>
                </div>
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table
            .getRowModel()
            .rows.slice(0, 6)
            .map((row, i) => (
              <tr
                key={row.id}
                style={{
                  background:
                    i % 2 === 0
                      ? "var(--table-row-odd)"
                      : "var(--table-row-even)",
                }}
              >
                {table.columns.map((col) => (
                  <Td key={col.id}>
                    {String(row.values[col.id ?? ""] ?? "—")}
                  </Td>
                ))}
              </tr>
            ))}
        </tbody>
      </MiniTable>
      <div
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--text-tertiary)",
          marginTop: "var(--space-2)",
        }}
      >
        Order: {order.join(" → ")}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   COLUMN PINNING DEMO
   ═══════════════════════════════════════════ */
function ColumnPinningDemo() {
  const tableBase = usePivotTable<SalesRow, ColumnPinningTableState>({
    data: useMemo(() => SUBSET, []),
    columns: useMemo(() => COLUMNS.slice(0, 8), []),
    plugins: useMemo(() => [createColumnPinningPlugin()], []),
  });
  const table = useMemo(() => withColumnPinning(tableBase), [tableBase]);
  const pinState = table.columnPinning.getColumnPinning();

  const getPinSide = (colId: string): PinSide => {
    if (pinState.left.includes(colId)) return "left";
    if (pinState.right.includes(colId)) return "right";
    return false;
  };

  return (
    <>
      <div
        style={{
          marginBottom: "var(--space-3)",
          display: "flex",
          gap: "var(--space-2)",
          flexWrap: "wrap",
        }}
      >
        {COLUMNS.slice(0, 6).map((col) => {
          const colId = col.id ?? "";
          const pos = getPinSide(colId);
          return (
            <div key={colId} style={{ display: "flex", gap: 2 }}>
              <button
                onClick={() => table.columnPinning.pinColumn(colId, "left")}
                style={{
                  padding: "var(--space-1) var(--space-2)",
                  fontSize: "var(--text-xs)",
                  borderRadius: "var(--radius-sm)",
                  border:
                    "var(--border-width-default) solid var(--border-default)",
                  background:
                    pos === "left"
                      ? "color-mix(in srgb, #0891B2 10%, transparent)"
                      : "var(--surface-3)",
                  color:
                    pos === "left"
                      ? "var(--accent-600)"
                      : "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                ← {col.header}
              </button>
              <button
                onClick={() => table.columnPinning.pinColumn(colId, false)}
                style={{
                  padding: "var(--space-1) var(--space-2)",
                  fontSize: "var(--text-xs)",
                  borderRadius: "var(--radius-sm)",
                  border:
                    "var(--border-width-default) solid var(--border-default)",
                  background: !pos ? "var(--surface-4)" : "var(--surface-3)",
                  color: !pos
                    ? "var(--text-tertiary)"
                    : "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                ·
              </button>
              <button
                onClick={() => table.columnPinning.pinColumn(colId, "right")}
                style={{
                  padding: "var(--space-1) var(--space-2)",
                  fontSize: "var(--text-xs)",
                  borderRadius: "var(--radius-sm)",
                  border:
                    "var(--border-width-default) solid var(--border-default)",
                  background:
                    pos === "right"
                      ? "color-mix(in srgb, #0891B2 10%, transparent)"
                      : "var(--surface-3)",
                  color:
                    pos === "right"
                      ? "var(--accent-600)"
                      : "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                {col.header} →
              </button>
            </div>
          );
        })}
      </div>
      <MiniTable>
        <thead>
          <tr>
            {table.columns.map((col) => {
              const colId = col.id ?? "";
              const pos = getPinSide(colId);
              return (
                <Th
                  key={colId}
                  style={{
                    background: pos
                      ? "var(--table-subtotal-bg)"
                      : "var(--table-header-bg)",
                    borderRight:
                      pos === "left"
                        ? "var(--border-width-emphasis) solid var(--border-emphasis)"
                        : undefined,
                    borderLeft:
                      pos === "right"
                        ? "var(--border-width-emphasis) solid var(--border-emphasis)"
                        : undefined,
                  }}
                >
                  {col.header} {pos ? `(${pos})` : ""}
                </Th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {table
            .getRowModel()
            .rows.slice(0, 6)
            .map((row, i) => (
              <tr
                key={row.id}
                style={{
                  background:
                    i % 2 === 0
                      ? "var(--table-row-odd)"
                      : "var(--table-row-even)",
                }}
              >
                {table.columns.map((col) => {
                  const colId = col.id ?? "";
                  const pos = getPinSide(colId);
                  return (
                    <Td
                      key={colId}
                      style={{
                        background: pos ? "var(--surface-3)" : undefined,
                        borderRight:
                          pos === "left"
                            ? "var(--border-width-emphasis) solid var(--border-emphasis)"
                            : undefined,
                        borderLeft:
                          pos === "right"
                            ? "var(--border-width-emphasis) solid var(--border-emphasis)"
                            : undefined,
                      }}
                    >
                      {String(row.values[colId] ?? "—")}
                    </Td>
                  );
                })}
              </tr>
            ))}
        </tbody>
      </MiniTable>
    </>
  );
}

/* ═══════════════════════════════════════════
   VIRTUALIZATION DEMO
   ═══════════════════════════════════════════ */
function VirtualizationDemo() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tableBase = usePivotTable<SalesRow>({
    data: useMemo(() => mockData.slice(0, 500), []),
    columns: useMemo(() => COLUMNS.slice(0, 6), []),
  });
  const rows = tableBase.getRowModel().rows;

  const getScrollElement = useCallback(() => scrollRef.current, []);
  const estimateSize = useCallback(() => 36, []);

  const { virtualRows, totalSize } = useVirtualRows({
    count: rows.length,
    getScrollElement,
    estimateSize,
    overscan: 5,
  });

  const renderTime = useMemo(() => {
    const start = performance.now();
    virtualRows.length;
    return performance.now() - start;
  }, [virtualRows.length]);

  return (
    <>
      <div
        ref={scrollRef}
        style={{
          height: 300,
          overflow: "auto",
          border: "var(--border-width-default) solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div style={{ height: totalSize, position: "relative" }}>
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              display: "flex",
              background: "var(--table-header-bg)",
              borderBottom:
                "var(--border-width-emphasis) solid var(--border-emphasis)",
            }}
          >
            {COLUMNS.slice(0, 6).map((col) => (
              <div
                key={col.id}
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-medium)",
                  textTransform: "uppercase",
                  letterSpacing: "var(--table-header-tracking)",
                  color: "var(--table-header-text)",
                  flex: 1,
                }}
              >
                {col.header}
              </div>
            ))}
          </div>
          {virtualRows.map((vr) => {
            const row = rows[vr.index];
            if (!row) return null;
            return (
              <div
                key={row.id}
                data-index={vr.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: vr.size,
                  transform: `translateY(${vr.start}px)`,
                  display: "flex",
                  borderBottom:
                    "var(--border-width-default) solid var(--border-default)",
                  background:
                    vr.index % 2 === 0
                      ? "var(--table-row-odd)"
                      : "var(--table-row-even)",
                }}
              >
                {COLUMNS.slice(0, 6).map((col) => (
                  <div
                    key={col.id}
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontSize: "var(--text-sm)",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "var(--text-primary)",
                    }}
                  >
                    {String(row.values[col.id ?? ""] ?? "—")}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
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
          Rendering {virtualRows.length} of {rows.length.toLocaleString()} rows
        </span>
        <span>Render: {renderTime.toFixed(2)}ms</span>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   CONTROLLED STATE DEMO
   ═══════════════════════════════════════════ */
function ControlledStateDemo() {
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);
  const tableBase = usePivotTable<SalesRow, SortingTableState>({
    data: useMemo(() => SUBSET, []),
    columns: useMemo(() => COLUMNS.slice(0, 6), []),
    plugins: useMemo(() => [createSortingPlugin()], []),
    state: { sorting } as Partial<SortingTableState>,
    onStateChange: useCallback((next: SortingTableState) => {
      if (next.sorting) setSorting(next.sorting);
    }, []),
  });
  const table = useMemo(() => withSorting(tableBase), [tableBase]);
  const rows = table.getRowModel().rows;

  return (
    <>
      <div
        style={{
          marginBottom: "var(--space-3)",
          padding: "var(--space-3)",
          background: "var(--surface-3)",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--text-sm)",
          color: "var(--text-secondary)",
          border: "var(--border-width-default) solid var(--border-default)",
        }}
      >
        <strong style={{ color: "var(--text-primary)" }}>
          External state:
        </strong>{" "}
        {JSON.stringify(sorting)}
      </div>
      <MiniTable>
        <thead>
          <tr>
            {table.columns.slice(0, 5).map((col) => (
              <Th
                key={col.id}
                onClick={() => table.sorting.toggleSorting(col.id)}
              >
                {col.header}{" "}
                {table.sorting.getIsSorted(col.id) === "asc"
                  ? "↑"
                  : table.sorting.getIsSorted(col.id) === "desc"
                    ? "↓"
                    : ""}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 6).map((row, i) => (
            <tr
              key={row.id}
              style={{
                background:
                  i % 2 === 0
                    ? "var(--table-row-odd)"
                    : "var(--table-row-even)",
              }}
            >
              {table.columns.slice(0, 5).map((col) => (
                <Td key={col.id}>{String(row.values[col.id ?? ""] ?? "—")}</Td>
              ))}
            </tr>
          ))}
        </tbody>
      </MiniTable>
    </>
  );
}

/* ═══════════════════════════════════════════
   HOOK DEMOS
   ═══════════════════════════════════════════ */
function UseSortingDemo() {
  const tableBase = usePivotTable<SalesRow, SortingTableState>({
    data: useMemo(() => SUBSET, []),
    columns: useMemo(() => COLUMNS.slice(0, 6), []),
    plugins: useMemo(() => [createSortingPlugin()], []),
  });
  const sortingApi = useSorting(tableBase);
  const rows = tableBase.getRowModel().rows;
  const sortState = sortingApi.getSorting();

  return (
    <>
      <div
        style={{
          marginBottom: "var(--space-2)",
          fontSize: "var(--text-sm)",
          color: "var(--text-secondary)",
        }}
      >
        Active sort:{" "}
        {sortState.length
          ? sortState
              .map((s) => `${s.id} (${s.desc ? "desc" : "asc"})`)
              .join(", ")
          : "none"}
      </div>
      <MiniTable>
        <thead>
          <tr>
            {tableBase.columns.slice(0, 5).map((col) => (
              <Th key={col.id} onClick={() => sortingApi.toggleSorting(col.id)}>
                {col.header}{" "}
                {sortingApi.getIsSorted(col.id) === "asc"
                  ? "↑"
                  : sortingApi.getIsSorted(col.id) === "desc"
                    ? "↓"
                    : ""}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 5).map((row, i) => (
            <tr
              key={row.id}
              style={{
                background:
                  i % 2 === 0
                    ? "var(--table-row-odd)"
                    : "var(--table-row-even)",
              }}
            >
              {tableBase.columns.slice(0, 5).map((col) => (
                <Td key={col.id}>{String(row.values[col.id ?? ""] ?? "—")}</Td>
              ))}
            </tr>
          ))}
        </tbody>
      </MiniTable>
    </>
  );
}

function UseFilteringDemo() {
  const [query, setQuery] = useState("");
  const tableBase = usePivotTable<SalesRow, FilteringTableState>({
    data: useMemo(() => SUBSET, []),
    columns: useMemo(() => COLUMNS.slice(0, 6), []),
    plugins: useMemo(() => [createFilteringPlugin()], []),
  });
  const filteringApi = useFiltering(tableBase);

  const handleFilterQuery = useCallback(
    (value: string) => {
      setQuery(value);
      filteringApi.setGlobalFilter(value);
    },
    [filteringApi],
  );

  const rows = tableBase.getRowModel().rows;
  const filteredCount = rows.length;

  return (
    <>
      <div
        style={{
          marginBottom: "var(--space-2)",
          position: "relative",
          maxWidth: 240,
        }}
      >
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
          value={query}
          onChange={(e) => handleFilterQuery(e.target.value)}
          placeholder="Filter..."
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
      <MiniTable>
        <thead>
          <tr>
            {tableBase.columns.slice(0, 5).map((col) => (
              <Th key={col.id}>{col.header}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 5).map((row, i) => (
            <tr
              key={row.id}
              style={{
                background:
                  i % 2 === 0
                    ? "var(--table-row-odd)"
                    : "var(--table-row-even)",
              }}
            >
              {tableBase.columns.slice(0, 5).map((col) => (
                <Td key={col.id}>{String(row.values[col.id ?? ""] ?? "—")}</Td>
              ))}
            </tr>
          ))}
        </tbody>
      </MiniTable>
      <div
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--text-tertiary)",
          marginTop: "var(--space-2)",
        }}
      >
        Showing {filteredCount} of {SUBSET.length} rows
      </div>
    </>
  );
}

function UseGroupingDemo() {
  const [groupField, setGroupField] = useState("region");
  const tableBase = usePivotTable<SalesRow, GroupingTableState>({
    data: useMemo(() => SUBSET, []),
    columns: useMemo(() => COLUMNS.slice(0, 6), []),
    plugins: useMemo(() => [createGroupingPlugin()], []),
  });
  const groupingApi = useGrouping(tableBase);

  const handleGroupField = useCallback(
    (field: string) => {
      setGroupField(field);
      groupingApi.setRowGrouping([field]);
    },
    [groupingApi],
  );

  const rows = tableBase.getRowModel().rows;

  return (
    <>
      <div
        style={{
          marginBottom: "var(--space-2)",
          display: "flex",
          gap: "var(--space-2)",
        }}
      >
        {["region", "category", "channel"].map((field) => (
          <Chip
            key={field}
            active={groupField === field}
            onClick={() => handleGroupField(field)}
          >
            {field}
          </Chip>
        ))}
      </div>
      <MiniTable>
        <thead>
          <tr>
            <Th style={{ width: 30 }}>
              <span />
            </Th>
            {tableBase.columns.slice(0, 5).map((col) => (
              <Th key={col.id}>{col.header}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 8).map((row, i) => {
            const isGroup = row.values.__group === true;
            return (
              <tr
                key={row.id}
                style={{
                  background: isGroup
                    ? "var(--table-subtotal-bg)"
                    : i % 2 === 0
                      ? "var(--table-row-odd)"
                      : "var(--table-row-even)",
                }}
              >
                <Td>
                  {isGroup && (
                    <button
                      onClick={() => groupingApi.toggleGroupExpanded(row.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {groupingApi.getIsGroupExpanded(row.id) ? (
                        <ChevronDown size={12} />
                      ) : (
                        <ChevronRight size={12} />
                      )}
                    </button>
                  )}
                </Td>
                {tableBase.columns.slice(0, 5).map((col) => (
                  <Td
                    key={col.id}
                    style={{
                      fontWeight: isGroup
                        ? "var(--table-subtotal-weight)"
                        : "var(--font-regular)",
                      color: isGroup
                        ? "var(--table-subtotal-text)"
                        : "var(--text-primary)",
                    }}
                  >
                    {isGroup
                      ? `Group: ${row.values[col.id ?? ""] ?? row.id}`
                      : String(row.values[col.id ?? ""] ?? "—")}
                  </Td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </MiniTable>
    </>
  );
}

function UseAggregationDemo() {
  const [agg, setAgg] = useState<"sum" | "avg" | "min" | "max" | "count">(
    "sum",
  );
  const tableBase = usePivotTable<SalesRow, AggregationTableState>({
    data: useMemo(() => SUBSET, []),
    columns: useMemo(() => COLUMNS.slice(0, 6), []),
    plugins: useMemo(
      () => [
        createAggregationPlugin({
          autoAggregateColumns: ["revenue"],
          defaultAggregator: agg,
        }),
      ],
      [agg],
    ),
  });
  const aggApi = usePivotAggregation(tableBase);
  const rows = tableBase.getRowModel().rows;
  const grandTotal = aggApi.getGrandTotal("revenue");

  const handleSetAgg = useCallback(
    (fn: "sum" | "avg" | "min" | "max" | "count") => {
      setAgg(fn);
      aggApi.setColumnAggregator("revenue", fn);
    },
    [aggApi],
  );

  return (
    <>
      <div
        style={{
          marginBottom: "var(--space-2)",
          display: "flex",
          gap: "var(--space-2)",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span
          style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}
        >
          Aggregator:
        </span>
        {(["sum", "avg", "min", "max", "count"] as const).map((fn) => (
          <Chip key={fn} active={agg === fn} onClick={() => handleSetAgg(fn)}>
            {AGGREGATOR_LABELS[fn]}
          </Chip>
        ))}
      </div>
      <MiniTable>
        <thead>
          <tr>
            {tableBase.columns.slice(0, 5).map((col) => (
              <Th key={col.id}>{col.header}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 6).map((row, i) => {
            const isGrandTotal = row.values._isGrandTotal === true;
            return (
              <tr
                key={row.id}
                style={{
                  background: isGrandTotal
                    ? "var(--table-grandtotal-bg)"
                    : i % 2 === 0
                      ? "var(--table-row-odd)"
                      : "var(--table-row-even)",
                  color: isGrandTotal
                    ? "var(--table-grandtotal-text)"
                    : "var(--text-primary)",
                }}
              >
                {tableBase.columns.slice(0, 5).map((col) => (
                  <Td
                    key={col.id}
                    style={{
                      fontWeight: isGrandTotal
                        ? "var(--table-grandtotal-weight)"
                        : "var(--font-regular)",
                      color: isGrandTotal
                        ? "var(--table-grandtotal-text)"
                        : "var(--text-primary)",
                    }}
                  >
                    {isGrandTotal
                      ? col.id === "revenue"
                        ? fmt(grandTotal ?? undefined)
                        : "Total"
                      : String(row.values[col.id ?? ""] ?? "—")}
                  </Td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </MiniTable>
      <div
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--text-tertiary)",
          marginTop: "var(--space-2)",
        }}
      >
        Grand total (revenue): {grandTotal != null ? fmt(grandTotal) : "null"}
      </div>
    </>
  );
}

function UseVirtualColumnsDemo() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const wideColumns = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: `col_${i}`,
        header: `Column ${i + 1}`,
        accessorFn: () => `val_${i}`,
      })),
    [],
  );
  const wideData = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) =>
        Object.fromEntries(
          wideColumns.map((c) => [c.id, `Row ${i + 1} - ${c.id}`]),
        ),
      ),
    [wideColumns],
  );
  const tableBase = usePivotTable<Record<string, string>>({
    data: wideData,
    columns: wideColumns,
  });
  const columns = tableBase.columns;
  const rows = tableBase.getRowModel().rows;

  const getScrollElement = useCallback(() => scrollRef.current, []);
  const estimateSize = useCallback(() => 150, []);

  const { virtualColumns, totalSize } = useVirtualColumns({
    count: columns.length,
    getScrollElement,
    estimateSize,
    overscan: 3,
  });

  return (
    <>
      <div
        ref={scrollRef}
        style={{
          height: 200,
          overflow: "auto",
          border: "var(--border-width-default) solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div style={{ width: totalSize, position: "relative" }}>
          <div
            style={{
              display: "flex",
              height: 32,
              background: "var(--table-header-bg)",
              borderBottom:
                "var(--border-width-emphasis) solid var(--border-emphasis)",
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
          >
            {virtualColumns.map((vc) => {
              const col = columns[vc.index];
              if (!col) return null;
              return (
                <div
                  key={col.id}
                  data-index={vc.index}
                  style={{
                    width: vc.size,
                    minWidth: vc.size,
                    maxWidth: vc.size,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 var(--space-2)",
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--font-medium)",
                    textTransform: "uppercase",
                    letterSpacing: "var(--table-header-tracking)",
                    color: "var(--table-header-text)",
                    borderRight:
                      "var(--border-width-default) solid var(--border-default)",
                    overflow: "hidden",
                  }}
                >
                  {col.header}
                </div>
              );
            })}
          </div>
          {rows.slice(0, 5).map((row, ri) => (
            <div
              key={row.id}
              style={{
                display: "flex",
                height: 32,
                borderBottom:
                  "var(--border-width-default) solid var(--border-default)",
                background:
                  ri % 2 === 0
                    ? "var(--table-row-odd)"
                    : "var(--table-row-even)",
              }}
            >
              {virtualColumns.map((vc) => {
                const col = columns[vc.index];
                if (!col) return null;
                return (
                  <div
                    key={col.id}
                    data-index={vc.index}
                    style={{
                      width: vc.size,
                      minWidth: vc.size,
                      maxWidth: vc.size,
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      padding: "0 var(--space-2)",
                      fontSize: "var(--text-sm)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "var(--text-primary)",
                      borderRight:
                        "var(--border-width-default) solid var(--border-default)",
                    }}
                  >
                    {String(row.values[col.id] ?? "—")}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
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
          Rendering {virtualColumns.length} of {columns.length} columns
        </span>
      </div>
    </>
  );
}

function DndRowDemo() {
  const tableBase = usePivotTable<SalesRow, DndRowTableState>({
    data: useMemo(() => SUBSET.slice(0, 10), []),
    columns: useMemo(() => COLUMNS.slice(0, 5), []),
    plugins: useMemo(() => [createDndRowPlugin()], []),
  });
  const table = useMemo(() => withDndRow(tableBase), [tableBase]);
  const rows = table.getRowModel().rows;
  const dndApi = table.dndRow;

  const handleDragStart = (index: number) => {
    (window as unknown as Record<string, number>).__dndDragIndex = index;
  };

  const handleDrop = (targetIndex: number) => {
    const dragIndex = (window as unknown as Record<string, number>)
      .__dndDragIndex;
    if (dragIndex == null || dragIndex === targetIndex) return;
    const allIds = rows.map((r) => r.id);
    const [moved] = allIds.splice(dragIndex, 1);
    allIds.splice(targetIndex, 0, moved);
    dndApi.setRowOrder(allIds);
    delete (window as unknown as Record<string, number>).__dndDragIndex;
  };

  return (
    <>
      <div
        style={{
          marginBottom: "var(--space-2)",
          fontSize: "var(--text-sm)",
          color: "var(--text-secondary)",
        }}
      >
        Drag rows to reorder (HTML5 drag & drop)
      </div>
      <MiniTable>
        <thead>
          <tr>
            <Th style={{ width: 30 }}>
              <span />
            </Th>
            {table.columns.map((col) => (
              <Th key={col.id}>{col.header}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              style={{
                cursor: "grab",
                background:
                  i % 2 === 0
                    ? "var(--table-row-odd)"
                    : "var(--table-row-even)",
              }}
            >
              <Td>
                <GripVertical
                  size={14}
                  style={{ color: "var(--text-tertiary)" }}
                />
              </Td>
              {table.columns.map((col) => (
                <Td key={col.id}>{String(row.values[col.id ?? ""] ?? "—")}</Td>
              ))}
            </tr>
          ))}
        </tbody>
      </MiniTable>
    </>
  );
}

function DndColumnDemo() {
  const tableBase = usePivotTable<SalesRow, DndColumnTableState>({
    data: useMemo(() => SUBSET.slice(0, 6), []),
    columns: useMemo(() => COLUMNS.slice(0, 6), []),
    plugins: useMemo(() => [createDndColumnPlugin()], []),
  });
  const table = useMemo(() => withDndColumn(tableBase), [tableBase]);
  const rows = table.getRowModel().rows;
  const dndApi = table.dndColumn;

  const handleDragStart = (index: number) => {
    (window as unknown as Record<string, number>).__dndColDragIndex = index;
  };

  const handleDrop = (targetIndex: number) => {
    const dragIndex = (window as unknown as Record<string, number>)
      .__dndColDragIndex;
    if (dragIndex == null || dragIndex === targetIndex) return;
    const allIds = table.columns.map((c) => c.id ?? "");
    const [moved] = allIds.splice(dragIndex, 1);
    allIds.splice(targetIndex, 0, moved);
    dndApi.setColumnOrder(allIds.filter(Boolean));
    delete (window as unknown as Record<string, number>).__dndColDragIndex;
  };

  return (
    <>
      <div
        style={{
          marginBottom: "var(--space-2)",
          fontSize: "var(--text-sm)",
          color: "var(--text-secondary)",
        }}
      >
        Drag column headers to reorder
      </div>
      <MiniTable>
        <thead>
          <tr>
            {table.columns.map((col, i) => (
              <Th
                key={col.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(i)}
                style={{ cursor: "grab" }}
              >
                {col.header}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              style={{
                background:
                  i % 2 === 0
                    ? "var(--table-row-odd)"
                    : "var(--table-row-even)",
              }}
            >
              {table.columns.map((col) => (
                <Td key={col.id}>{String(row.values[col.id ?? ""] ?? "—")}</Td>
              ))}
            </tr>
          ))}
        </tbody>
      </MiniTable>
    </>
  );
}

/* ═══════════════════════════════════════════
   EXPORT DEMO
   ═══════════════════════════════════════════ */
function ExportDemo() {
  const [status, setStatus] = useState("");

  const handleExportCSV = useCallback(() => {
    try {
      const headers = COLUMNS.slice(0, 6)
        .map((c) => c.header)
        .join(",");
      const rows = SUBSET.slice(0, 20)
        .map((row) =>
          COLUMNS.slice(0, 6)
            .map((c) => `"${String(row[c.id as keyof SalesRow] ?? "")}"`)
            .join(","),
        )
        .join("\n");
      const csv = `${headers}\n${rows}`;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sales-export.csv";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("CSV exported successfully");
      setTimeout(() => setStatus(""), 3000);
    } catch {
      setStatus("Export failed");
    }
  }, []);

  const code = `const headers = columns.map(c => c.header).join(',');
const rows = data.map(row =>
  columns.map(c => row[c.accessorKey]).join(',')
).join('\\n');
const csv = \`\${headers}\\n\${rows}\`;
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = 'export.csv'; a.click();`;

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "var(--space-3)",
          marginBottom: "var(--space-3)",
        }}
      >
        <button
          onClick={handleExportCSV}
          style={{
            padding: "var(--space-2) var(--space-4)",
            background: "var(--accent-600)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            fontSize: "var(--text-sm)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <Download size={14} /> Export CSV (20 rows)
        </button>
        {status && (
          <span
            style={{
              fontSize: "var(--text-sm)",
              color: status.includes("failed")
                ? "var(--text-danger)"
                : "var(--text-success)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {status.includes("failed") ? null : <Check size={14} />} {status}
          </span>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   SHOWCASE PAGE
   ═══════════════════════════════════════════ */
export default function ShowcasePage() {
  return (
    <div
      style={{
        maxWidth: "var(--content-wide-max-width)",
        margin: "0 auto",
        padding: "var(--space-6) var(--space-4)",
      }}
    >
      <h1
        style={{
          fontSize: "var(--text-2xl)",
          fontWeight: "var(--font-medium)",
          marginBottom: "var(--space-2)",
          color: "var(--text-primary)",
        }}
      >
        Interactive Demos
      </h1>
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "var(--text-md)",
          marginBottom: "var(--space-8)",
        }}
      >
        Every plugin and hook, wired and interactive. Click, drag, and type to
        see real state changes.
      </p>

      <DemoCard
        title="Sorting"
        badge="Plugin"
        description="Multi-column sorting with asc/desc/none cycling. Click headers to sort."
        icon={<ArrowUpDown size={16} />}
        code={`import { usePivotTable, createSortingPlugin, withSorting } from 'react-pivot-pro';

const table = usePivotTable({ data, columns, plugins: [createSortingPlugin()] });
const tableWithSort = withSorting(table);
tableWithSort.sorting.toggleSorting('revenue');`}
      >
        <SortingDemo />
      </DemoCard>

      <DemoCard
        title="Filtering"
        badge="Plugin"
        description="Global text search across all columns with debounced input."
        icon={<Filter size={16} />}
        code={`import { usePivotTable, createFilteringPlugin, withFiltering } from 'react-pivot-pro';

const table = usePivotTable({ data, columns, plugins: [createFilteringPlugin()] });
const tableWithFilter = withFiltering(table);
tableWithFilter.filtering.setGlobalFilter('search term');`}
      >
        <FilteringDemo />
      </DemoCard>

      <DemoCard
        title="Row Grouping"
        badge="Plugin"
        description="Hierarchical row grouping with expand/collapse toggle."
        icon={<Layers size={16} />}
        code={`import { usePivotTable, createGroupingPlugin, withGrouping } from 'react-pivot-pro';

const table = usePivotTable({ data, columns, plugins: [createGroupingPlugin()] });
const tableWithGroup = withGrouping(table);
tableWithGroup.grouping.setRowGrouping(['region']);`}
      >
        <GroupingDemo />
      </DemoCard>

      <DemoCard
        title="Aggregation"
        badge="Plugin"
        description="Per-column aggregation with sum, avg, min, max, count and more."
        icon={<Table2 size={16} />}
        code={`import { usePivotTable, createAggregationPlugin, withAggregation } from 'react-pivot-pro';

const table = usePivotTable({
  data, columns,
  plugins: [createAggregationPlugin({ autoAggregateColumns: ['revenue'], defaultAggregator: 'sum' })],
});
const tableWithAgg = withAggregation(table);`}
      >
        <AggregationDemo />
      </DemoCard>

      <DemoCard
        title="Column Visibility"
        badge="Plugin"
        description="Toggle column visibility on/off with state persistence."
        icon={<Columns size={16} />}
        code={`import { usePivotTable, createColumnVisibilityPlugin, withColumnVisibility } from 'react-pivot-pro';

const table = usePivotTable({ data, columns, plugins: [createColumnVisibilityPlugin()] });
const tableWithVis = withColumnVisibility(table);
tableWithVis.columnVisibility.toggleColumnVisibility('region');`}
      >
        <VisibilityDemo />
      </DemoCard>

      <DemoCard
        title="Column Ordering"
        badge="Plugin"
        description="Reorder columns programmatically with state management."
        icon={<ArrowUpDown size={16} />}
        code={`import { usePivotTable, createColumnOrderingPlugin, withColumnOrdering } from 'react-pivot-pro';

const table = usePivotTable({ data, columns, plugins: [createColumnOrderingPlugin()] });
const tableWithOrder = withColumnOrdering(table);
tableWithOrder.columnOrdering.reorderColumn('revenue', 2);`}
      >
        <ColumnOrderingDemo />
      </DemoCard>

      <DemoCard
        title="Column Pinning"
        badge="Plugin"
        description="Pin columns to left or right with visual separation."
        icon={<Columns size={16} />}
        code={`import { usePivotTable, createColumnPinningPlugin, withColumnPinning } from 'react-pivot-pro';

const table = usePivotTable({ data, columns, plugins: [createColumnPinningPlugin()] });
const tableWithPin = withColumnPinning(table);
tableWithPin.columnPinning.pinColumn('region', 'left');`}
      >
        <ColumnPinningDemo />
      </DemoCard>

      <DemoCard
        title="Virtualization"
        badge="Hook"
        description="Render only visible rows for datasets with 100K+ rows."
        icon={<Table2 size={16} />}
        code={`import { useVirtualRows } from 'react-pivot-pro';

const { virtualRows, totalSize } = useVirtualRows({
  count: rows.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 36,
  overscan: 5,
});`}
      >
        <VirtualizationDemo />
      </DemoCard>

      <DemoCard
        title="Controlled State"
        badge="Pattern"
        description="External state management with onStateChange callbacks."
        icon={<Settings2 size={16} />}
        code={`const [sorting, setSorting] = useState([]);

const table = usePivotTable({
  data, columns, plugins: [createSortingPlugin()],
  state: { sorting },
  onStateChange: (next) => setSorting(next.sorting),
});`}
      >
        <ControlledStateDemo />
      </DemoCard>

      <DemoCard
        title="useSorting Hook"
        badge="Hook"
        description="Access sorting API directly from the table instance."
        icon={<ArrowUpDown size={16} />}
        code={`const table = usePivotTable({ data, columns, plugins: [createSortingPlugin()] });
const sortingApi = useSorting(table);
sortingApi.toggleSorting('revenue');`}
      >
        <UseSortingDemo />
      </DemoCard>

      <DemoCard
        title="useFiltering Hook"
        badge="Hook"
        description="Access filtering API with global and column-level controls."
        icon={<Filter size={16} />}
        code={`const table = usePivotTable({ data, columns, plugins: [createFilteringPlugin()] });
const filteringApi = useFiltering(table);
filteringApi.setGlobalFilter('search term');`}
      >
        <UseFilteringDemo />
      </DemoCard>

      <DemoCard
        title="useGrouping Hook"
        badge="Hook"
        description="Access grouping API for expand/collapse and group state."
        icon={<Layers size={16} />}
        code={`const table = usePivotTable({ data, columns, plugins: [createGroupingPlugin()] });
const groupingApi = useGrouping(table);
groupingApi.setRowGrouping(['region']);`}
      >
        <UseGroupingDemo />
      </DemoCard>

      <DemoCard
        title="usePivotAggregation Hook"
        badge="Hook"
        description="Access aggregation API for per-column aggregator control."
        icon={<Table2 size={16} />}
        code={`const table = usePivotTable({ data, columns, plugins: [createAggregationPlugin()] });
const aggApi = usePivotAggregation(table);
aggApi.setColumnAggregator('revenue', 'sum');`}
      >
        <UseAggregationDemo />
      </DemoCard>

      <DemoCard
        title="useVirtualColumns Hook"
        badge="Hook"
        description="Column virtualization for wide tables with many columns."
        icon={<Columns size={16} />}
        code={`const { virtualColumns, totalSize } = useVirtualColumns({
  count: columns.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 150,
  overscan: 3,
});`}
      >
        <UseVirtualColumnsDemo />
      </DemoCard>

      <DemoCard
        title="Drag & Drop Rows"
        badge="Plugin"
        description="Reorder rows via drag and drop with @dnd-kit/core."
        icon={<ArrowUpDown size={16} />}
        code={`import { usePivotTable, createDndRowPlugin, withDndRow } from 'react-pivot-pro';

const table = usePivotTable({ data, columns, plugins: [createDndRowPlugin()] });
const tableWithDnd = withDndRow(table);
tableWithDnd.dndRow.setRowOrder(['id3', 'id1', 'id2']);`}
      >
        <DndRowDemo />
      </DemoCard>

      <DemoCard
        title="Drag & Drop Columns"
        badge="Plugin"
        description="Reorder columns via drag and drop with @dnd-kit/core."
        icon={<ArrowUpDown size={16} />}
        code={`import { usePivotTable, createDndColumnPlugin, withDndColumn } from 'react-pivot-pro';

const table = usePivotTable({ data, columns, plugins: [createDndColumnPlugin()] });
const tableWithDnd = withDndColumn(table);
tableWithDnd.dndColumn.setColumnOrder(['region', 'product', 'revenue']);`}
      >
        <DndColumnDemo />
      </DemoCard>

      <DemoCard
        title="Export"
        badge="Utility"
        description="Export table data to CSV with proper formatting."
        icon={<Download size={16} />}
        code={`const headers = columns.map(c => c.header).join(',');
const rows = data.map(row => columns.map(c => row[c.accessorKey]).join(',')).join('\\n');
const csv = \`\${headers}\\n\${rows}\`;
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = 'export.csv'; a.click();`}
      >
        <ExportDemo />
      </DemoCard>
    </div>
  );
}

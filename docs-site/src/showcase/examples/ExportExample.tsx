import { useState, useCallback, useMemo } from "react";
import { usePivotTable, exportCSV } from "@pivot";
import type { SalesRow } from "../../data/mockData";
import { SUBSET, SALES_COLUMNS } from "../data";
import { MiniTable, Th, Td } from "../components";
import { Download, Check, AlertCircle } from "lucide-react";

const columns = SALES_COLUMNS.slice(0, 6);

export default function ExportExample() {
  const data = useMemo(() => SUBSET.slice(0, 20), []);

  const table = usePivotTable<SalesRow>({
    data,
    columns,
  });

  const rowModel = table.getRowModel();
  const cols = table.columns;

  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleExport = useCallback(() => {
    try {
      const csvColumns = [
        {
          id: "orderId",
          header: "Order ID",
          accessor: (row: SalesRow) => row.orderId,
        },
        {
          id: "region",
          header: "Region",
          accessor: (row: SalesRow) => row.region,
        },
        {
          id: "country",
          header: "Country",
          accessor: (row: SalesRow) => row.country,
        },
        {
          id: "product",
          header: "Product",
          accessor: (row: SalesRow) => row.product,
        },
        {
          id: "category",
          header: "Category",
          accessor: (row: SalesRow) => row.category,
        },
        {
          id: "revenue",
          header: "Revenue",
          accessor: (row: SalesRow) => row.revenue,
        },
      ];

      const result = exportCSV<SalesRow>({
        rows: rowModel.rows.map((row) => row.original),
        columns: csvColumns,
        fileName: "sales-export.csv",
        includeHeader: true,
      });
      result.download();
      setStatus("Exported successfully");
      setError("");
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to export CSV";
      setError(message);
      setStatus("");
      setTimeout(() => setError(""), 5000);
    }
  }, [rowModel.rows]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <button
          onClick={handleExport}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-medium)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--accent-600)",
            background: "var(--accent-600)",
            color: "var(--accent-contrast)",
            cursor: "pointer",
          }}
        >
          <Download size={14} />
          Export CSV
        </button>

        {status && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "var(--text-sm)",
              color: "var(--text-success)",
            }}
          >
            <Check size={14} />
            {status}
          </span>
        )}

        {error && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "var(--text-sm)",
              color: "var(--text-danger)",
            }}
          >
            <AlertCircle size={14} />
            {error}
          </span>
        )}
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
    </div>
  );
}



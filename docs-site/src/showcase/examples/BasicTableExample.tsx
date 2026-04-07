import { useMemo } from "react";
import { usePivotTable } from "@pivot";
import type { SalesRow } from "../../data/mockData";
import type { ColumnDef } from "@pivot";
import { SUBSET } from "../data";
import { MiniTable, Th, Td } from "../components";

const columns: ColumnDef<SalesRow>[] = [
  { id: "orderId", header: "Order ID", accessorKey: "orderId" },
  { id: "region", header: "Region", accessorKey: "region" },
  { id: "product", header: "Product", accessorKey: "product" },
  { id: "revenue", header: "Revenue", accessorKey: "revenue" },
];

export default function BasicTableExample() {
  const data = useMemo(() => SUBSET.slice(0, 10), []);

  const table = usePivotTable({
    data,
    columns,
  });

  const { rowModel, columns: cols } = table;

  return (
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
                {row.values[col.id] !== undefined && row.values[col.id] !== null
                  ? String(row.values[col.id])
                  : "\u2014"}
              </Td>
            ))}
          </tr>
        ))}
      </tbody>
    </MiniTable>
  );
}

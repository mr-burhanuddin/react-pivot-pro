import { useMemo } from "react";
import type { SalesRow } from "../../data/mockData";
import { mockData } from "../../data/mockData";
import type { ColumnDef } from "@pivot";

/** First 50 rows for lightweight demos */
export const SUBSET = mockData.slice(0, 50);

/** Full 500-row dataset for virtualization demos */
export const FULL_DATA = mockData.slice(0, 500);

/** Standard column definitions used across most demos */
export const SALES_COLUMNS: ColumnDef<SalesRow>[] = [
  { id: "orderId", header: "Order ID", accessorKey: "orderId" },
  { id: "region", header: "Region", accessorKey: "region", enableSorting: true, enableFiltering: true },
  { id: "country", header: "Country", accessorKey: "country", enableSorting: true, enableFiltering: true },
  { id: "product", header: "Product", accessorKey: "product", enableSorting: true, enableFiltering: true },
  { id: "category", header: "Category", accessorKey: "category", enableSorting: true, enableFiltering: true },
  { id: "salesRep", header: "Sales Rep", accessorKey: "salesRep", enableSorting: true },
  { id: "quarter", header: "Quarter", accessorKey: "quarter", enableSorting: true },
  { id: "year", header: "Year", accessorKey: "year", enableSorting: true },
  { id: "units", header: "Units", accessorKey: "units", enableSorting: true },
  { id: "revenue", header: "Revenue", accessorKey: "revenue", enableSorting: true },
  { id: "cost", header: "Cost", accessorKey: "cost", enableSorting: true },
  { id: "margin", header: "Margin %", accessorKey: "margin", enableSorting: true },
  { id: "discount", header: "Discount %", accessorKey: "discount", enableSorting: true },
  { id: "channel", header: "Channel", accessorKey: "channel", enableSorting: true, enableFiltering: true },
  { id: "customerType", header: "Customer", accessorKey: "customerType", enableSorting: true },
];

/** Currency formatter */
export function fmtCurrency(v: number | null | undefined): string {
  if (v == null) return "—";
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Percentage formatter */
export function fmtPercent(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${v.toFixed(1)}%`;
}

/** Hook: stable subset data reference */
export function useSubsetData(): SalesRow[] {
  return useMemo(() => SUBSET, []);
}

/** Hook: stable full data reference */
export function useFullData(): SalesRow[] {
  return useMemo(() => FULL_DATA, []);
}

/** Hook: stable column reference (all columns) */
export function useAllColumns(): ColumnDef<SalesRow>[] {
  return useMemo(() => SALES_COLUMNS, []);
}

/** Hook: stable column reference (first N columns) */
export function useColumns(count: number): ColumnDef<SalesRow>[] {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => SALES_COLUMNS.slice(0, count), [count]);
}

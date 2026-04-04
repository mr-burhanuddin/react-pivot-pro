import type { ColumnDef } from '@pivot/types';
import type { SalesRecord } from './data';

export const salesColumns: ColumnDef<SalesRecord>[] = [
  { id: 'region', header: 'Region', accessorKey: 'region', enableSorting: true, enableFiltering: true },
  { id: 'country', header: 'Country', accessorKey: 'country', enableSorting: true, enableFiltering: true },
  { id: 'city', header: 'City', accessorKey: 'city', enableSorting: true, enableFiltering: true },
  { id: 'category', header: 'Category', accessorKey: 'category', enableSorting: true, enableFiltering: true },
  { id: 'product', header: 'Product', accessorKey: 'product', enableSorting: true, enableFiltering: true },
  { id: 'quarter', header: 'Quarter', accessorKey: 'quarter', enableSorting: true, enableFiltering: true },
  { id: 'channel', header: 'Channel', accessorKey: 'channel', enableSorting: true, enableFiltering: true },
  { id: 'amount', header: 'Amount', accessorKey: 'amount', enableSorting: true },
  { id: 'quantity', header: 'Units', accessorKey: 'quantity', enableSorting: true },
  { id: 'marginPct', header: 'Margin %', accessorKey: 'marginPct', enableSorting: true },
];

export function formatCurrency(value: number | undefined): string {
  if (typeof value !== 'number') {
    return '-';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

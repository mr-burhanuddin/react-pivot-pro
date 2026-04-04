import { useMemo } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import type { ColumnDef } from '@pivot/types';
import {
  createFilteringPlugin,
  withFiltering,
  type FilteringTableState,
} from '@pivot/plugins/filtering';
import { createSortingPlugin, withSorting, type SortingTableState } from '@pivot/plugins/sorting';
import type { SalesRecord } from './data';
import { salesData } from './data';
import { formatCurrency } from './common';

type LocalState = FilteringTableState & SortingTableState;
type FeatureTable = ReturnType<typeof withFiltering<SalesRecord, LocalState>> &
  ReturnType<typeof withSorting<SalesRecord, LocalState>>;

const columns: ColumnDef<SalesRecord>[] = [
  { id: 'region', header: 'Region', accessorKey: 'region', enableSorting: true, enableFiltering: true },
  { id: 'product', header: 'Product', accessorKey: 'product', enableSorting: true, enableFiltering: true },
  { id: 'quarter', header: 'Quarter', accessorKey: 'quarter', enableSorting: true, enableFiltering: true },
  { id: 'channel', header: 'Channel', accessorKey: 'channel', enableSorting: true, enableFiltering: true },
  { id: 'amount', header: 'Amount', accessorKey: 'amount', enableSorting: true },
];

export default function SortingFiltering() {
  const tableBase = usePivotTable<SalesRecord, LocalState>({
    data: useMemo(() => salesData, []),
    columns: useMemo(() => columns, []),
    plugins: useMemo(() => [createFilteringPlugin(), createSortingPlugin()], []),
  });

  const table = useMemo(() => {
    const withSortingTable = withSorting<SalesRecord, LocalState>(tableBase);
    const withFilteringTable = withFiltering<SalesRecord, LocalState>(withSortingTable);
    return withFilteringTable as FeatureTable;
  }, [tableBase]);
  const rows = table.getRowModel().rows;

  return (
    <div>
      <div className="toolbar">
        <input
          className="control"
          placeholder="Global filter"
          value={String(table.filtering.getGlobalFilter() ?? '')}
          onChange={(event) => table.filtering.setGlobalFilter(event.target.value)}
        />
        <input
          className="control"
          placeholder="Filter region"
          value={String(
            table.filtering
              .getColumnFilters()
              .find((filter) => filter.id === 'region')?.value ?? '',
          )}
          onChange={(event) => table.filtering.setColumnFilter('region', event.target.value)}
        />
        <button className="ghost-btn" type="button" onClick={() => table.filtering.resetColumnFilters()}>
          Reset filters
        </button>
      </div>

      <div className="table-shell">
        <table className="demo-table">
          <thead>
            <tr>
              {table.columns.map((column) => (
                <th key={column.id}>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => table.sorting.toggleSorting(column.id)}
                  >
                    {column.header ?? column.id}
                    {table.sorting.getIsSorted(column.id) === 'asc' && ' ▲'}
                    {table.sorting.getIsSorted(column.id) === 'desc' && ' ▼'}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {table.columns.map((column) => (
                  <td key={`${row.id}_${column.id}`}>
                    {column.id === 'amount'
                      ? formatCurrency(row.getValue<number>(column.id))
                      : String(row.getValue(column.id) ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="meta-row">
        Rows: {rows.length}, Active filters: {table.filtering.getColumnFilters().length}
      </p>
    </div>
  );
}

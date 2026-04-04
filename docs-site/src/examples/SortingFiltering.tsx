import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import type { ColumnDef } from '@pivot/types';
import {
  createFilteringPlugin,
  withFiltering,
  type FilteringTableState,
  type FilteringApi,
} from '@pivot/plugins/filtering';
import { createSortingPlugin, withSorting, type SortingTableState } from '@pivot/plugins/sorting';
import type { SalesRecord } from './data';
import { salesData } from './data';
import { formatCurrency } from './common';
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type LocalState = FilteringTableState & SortingTableState;

const COLUMNS: ColumnDef<SalesRecord>[] = [
  { id: 'region', header: 'Region', accessorKey: 'region', enableSorting: true, enableFiltering: true },
  { id: 'product', header: 'Product', accessorKey: 'product', enableSorting: true, enableFiltering: true },
  { id: 'quarter', header: 'Quarter', accessorKey: 'quarter', enableSorting: true, enableFiltering: true },
  { id: 'category', header: 'Category', accessorKey: 'category', enableSorting: true, enableFiltering: true },
  { id: 'channel', header: 'Channel', accessorKey: 'channel', enableSorting: true, enableFiltering: true },
  { id: 'amount', header: 'Amount', accessorKey: 'amount', enableSorting: true },
  { id: 'quantity', header: 'Units', accessorKey: 'quantity', enableSorting: true },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SortingFiltering() {
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const debouncedGlobalSearch = useDebounce(globalSearch, 200);
  const debouncedColumnFilters = useDebounce(columnFilters, 200);
  
  const filteringApiRef = useRef<FilteringApi<SalesRecord, LocalState> | null>(null);

  const tableBase = usePivotTable<SalesRecord, LocalState>({
    data: useMemo(() => salesData, []),
    columns: useMemo(() => COLUMNS, []),
    plugins: useMemo(() => [createFilteringPlugin(), createSortingPlugin()], []),
  });

  const table = useMemo(() => {
    const withSortingTable = withSorting<SalesRecord, LocalState>(tableBase);
    const withFilteringTable = withFiltering<SalesRecord, LocalState>(withSortingTable);
    if (!filteringApiRef.current) {
      filteringApiRef.current = withFilteringTable.filtering;
    }
    return withFilteringTable as ReturnType<typeof withFiltering<SalesRecord, LocalState>> &
      ReturnType<typeof withSorting<SalesRecord, LocalState>>;
  }, [tableBase]);

  useEffect(() => {
    if (filteringApiRef.current) {
      const currentFilter = filteringApiRef.current.getGlobalFilter();
      if (currentFilter !== debouncedGlobalSearch) {
        filteringApiRef.current.setGlobalFilter(debouncedGlobalSearch);
      }
    }
  }, [debouncedGlobalSearch]);

  useEffect(() => {
    if (filteringApiRef.current) {
      Object.entries(debouncedColumnFilters).forEach(([colId, value]) => {
        filteringApiRef.current!.setColumnFilter(colId, value);
      });
    }
  }, [debouncedColumnFilters]);

  const rows = table.getRowModel().rows;
  const sortState = table.sorting.getSorting();
  const columnFilterList = table.filtering.getColumnFilters();

  const getSortIcon = (columnId: string) => {
    const isSorted = table.sorting.getIsSorted(columnId);
    if (isSorted === 'asc') return <ArrowUp size={14} />;
    if (isSorted === 'desc') return <ArrowDown size={14} />;
    return <ArrowUpDown size={14} />;
  };

  const hasActiveFilters = globalSearch || Object.values(columnFilters).some(Boolean);
  const activeFilterCount = columnFilterList.length + (globalSearch ? 1 : 0);

  const resetAll = useCallback(() => {
    setGlobalSearch('');
    setColumnFilters({});
    table.filtering.resetColumnFilters();
    table.sorting.clearSorting();
  }, [table.filtering, table.sorting]);

  return (
    <div>
      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 8, color: 'var(--text-muted)' }} />
          <input
            className="control"
            placeholder="Search all columns..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            style={{ paddingLeft: 32, width: '100%' }}
          />
          {globalSearch && (
            <button
              type="button"
              onClick={() => setGlobalSearch('')}
              style={{
                position: 'absolute',
                right: 8,
                top: 6,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 2,
                color: 'var(--text-muted)',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button className="ghost-btn" type="button" onClick={resetAll}>
            <X size={14} /> Clear all
          </button>
        )}

        {activeFilterCount > 0 && (
          <span className="status-badge warning">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        {COLUMNS.slice(0, 4).map((col) => {
          const colId = col.id!;
          return (
            <div key={colId} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: 60 }}>{col.header ?? colId}:</span>
              <input
                className="control"
                placeholder={`Filter ${col.header ?? colId}`}
                value={columnFilters[colId] ?? ''}
                onChange={(e) => setColumnFilters((prev) => ({ ...prev, [colId]: e.target.value }))}
                style={{ padding: '4px 8px', fontSize: '0.85rem', width: 100 }}
              />
            </div>
          );
        })}
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
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      width: '100%',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{column.header ?? column.id}</span>
                    <span style={{ color: table.sorting.getIsSorted(column.id) ? 'var(--accent)' : 'inherit' }}>
                      {getSortIcon(column.id)}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {table.columns.map((column) => {
                  const value = row.original[column.id as keyof SalesRecord];
                  if (column.id === 'amount') {
                    return (
                      <td key={`${row.id}_${column.id}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(value as number | undefined)}
                      </td>
                    );
                  }
                  return (
                    <td key={`${row.id}_${column.id}`}>
                      {String(value ?? '-')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="meta-row" style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <span>Rows: {rows.length}</span>
        {sortState.length > 0 && (
          <span>
            Sorted by: {sortState.map((s) => `${s.id} (${s.desc ? 'desc' : 'asc'})`).join(', ')}
          </span>
        )}
        {columnFilterList.length > 0 && (
          <span>Column filters: {columnFilterList.map((f) => f.id).join(', ')}</span>
        )}
      </div>
    </div>
  );
}

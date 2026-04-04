import { useMemo, useState, useCallback } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import type { ColumnDef } from '@pivot/types';
import {
  createColumnVisibilityPlugin,
  withColumnVisibility,
  type ColumnVisibilityTableState,
  type PivotTableWithColumnVisibility,
} from '@pivot/plugins/columnVisibility';
import { formatCurrency } from './common';
import { salesData, type SalesRecord } from './data';
import { Search, Columns3, Download } from 'lucide-react';
import { exportCSV } from '@pivot/utils/index';

type LocalState = ColumnVisibilityTableState;

const COLUMNS: ColumnDef<SalesRecord>[] = [
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

export default function BasicTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const filteredData = useMemo(() => {
    if (!searchTerm) return salesData;
    const term = searchTerm.toLowerCase();
    return salesData.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(term))
    );
  }, [searchTerm]);

  const baseTable = usePivotTable<SalesRecord, LocalState>({
    data: filteredData,
    columns: useMemo(() => COLUMNS, []),
    plugins: useMemo(() => [createColumnVisibilityPlugin()], []),
  });

  const table = useMemo(
    () => withColumnVisibility<SalesRecord, LocalState>(baseTable) as PivotTableWithColumnVisibility<SalesRecord, LocalState>,
    [baseTable],
  );

  const visibleColumns = useMemo(
    () => table.columns.filter((col) => table.columnVisibility.getIsColumnVisible(col.id)),
    [table.columns, table.columnVisibility],
  );

  const rows = useMemo(
    () => table.getRowModel().rows.slice(0, 10),
    [table.getRowModel().rows],
  );

  const toggleRowSelection = useCallback((index: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const toggleAllRows = useCallback(() => {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map((_, i) => i)));
    }
  }, [rows, selectedRows.size]);

  const handleExport = useCallback(() => {
    const exportRows = rows.map((row) => {
      const obj: Record<string, unknown> = {};
      visibleColumns.forEach((col) => {
        obj[col.header ?? col.id] = row.original[col.id as keyof SalesRecord];
      });
      return obj;
    });
    exportCSV({ rows: exportRows, fileName: 'sales-export' });
  }, [rows, visibleColumns]);

  return (
    <div>
      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 8, color: 'var(--text-muted)' }} />
          <input
            className="control"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 32, width: '100%' }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            title="Toggle columns"
          >
            <Columns3 size={14} />
            Columns
          </button>
          {showColumnPicker && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 4,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 8,
                zIndex: 50,
                minWidth: 160,
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              }}
            >
              {table.columns.map((col) => (
                <label
                  key={col.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 4px',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={table.columnVisibility.getIsColumnVisible(col.id)}
                    onChange={() => table.columnVisibility.toggleColumnVisibility(col.id)}
                  />
                  {col.header ?? col.id}
                </label>
              ))}
            </div>
          )}
        </div>

        <button type="button" className="ghost-btn" onClick={handleExport} title="Export CSV">
          <Download size={14} />
          Export
        </button>
      </div>

      <div className="table-shell">
        <table className="demo-table">
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selectedRows.size === rows.length}
                  onChange={toggleAllRows}
                />
              </th>
              {visibleColumns.map((column) => (
                <th key={column.id}>{column.header ?? column.id}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                style={{
                  background: selectedRows.has(rowIndex) ? 'var(--accent-soft)' : undefined,
                }}
              >
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(rowIndex)}
                    onChange={() => toggleRowSelection(rowIndex)}
                  />
                </td>
                {visibleColumns.map((column) => {
                  const value = row.original[column.id as keyof SalesRecord];
                  if (column.id === 'amount') {
                    return (
                      <td key={`${row.id}_${column.id}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(value as number | undefined)}
                      </td>
                    );
                  }
                  if (column.id === 'marginPct') {
                    return (
                      <td key={`${row.id}_${column.id}`}>
                        <span
                          style={{
                            color:
                              (value as number) >= 50
                                ? 'var(--success)'
                                : (value as number) >= 40
                                  ? 'var(--warning)'
                                  : 'var(--danger)',
                            fontWeight: 500,
                          }}
                        >
                          {String(value)}%
                        </span>
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
      <p className="meta-row">
        {selectedRows.size > 0 && (
          <span style={{ marginRight: 12 }}>{selectedRows.size} selected</span>
        )}
        Showing {rows.length} of {filteredData.length} rows
      </p>
    </div>
  );
}

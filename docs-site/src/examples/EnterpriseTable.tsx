import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import type { ColumnDef } from '@pivot/types';
import { useVirtualRows } from '@pivot/hooks/useVirtualRows';
import { createSortingPlugin, withSorting, type SortingTableState } from '@pivot/plugins/sorting';
import { createFilteringPlugin, withFiltering, type FilteringTableState } from '@pivot/plugins/filtering';
import { createColumnVisibilityPlugin, withColumnVisibility, type ColumnVisibilityTableState } from '@pivot/plugins/columnVisibility';
import { createColumnPinningPlugin, withColumnPinning, type ColumnPinningTableState } from '@pivot/plugins/columnPinning';
import { createGroupingPlugin, withGrouping, type GroupingTableState, type GroupingApi } from '@pivot/plugins/grouping';
import type { SalesRecord } from './data';
import { createLargeSalesDataset } from './data';
import { formatCurrency } from './common';
import { exportCSV } from '@pivot/utils/index';
import {
  Search, Download, Columns3, ChevronRight, ChevronDown,
  X, ArrowUp, ArrowDown, ArrowUpDown, LayoutGrid, Table2
} from 'lucide-react';

type LocalState = SortingTableState & FilteringTableState & ColumnVisibilityTableState & ColumnPinningTableState & GroupingTableState;

const COLUMNS: ColumnDef<SalesRecord>[] = [
  { id: 'region', header: 'Region', accessorKey: 'region', enableSorting: true, enableFiltering: true },
  { id: 'country', header: 'Country', accessorKey: 'country', enableSorting: true, enableFiltering: true },
  { id: 'category', header: 'Category', accessorKey: 'category', enableSorting: true, enableFiltering: true },
  { id: 'product', header: 'Product', accessorKey: 'product', enableSorting: true, enableFiltering: true },
  { id: 'quarter', header: 'Quarter', accessorKey: 'quarter', enableSorting: true, enableFiltering: true },
  { id: 'channel', header: 'Channel', accessorKey: 'channel', enableSorting: true, enableFiltering: true },
  { id: 'amount', header: 'Amount', accessorKey: 'amount', enableSorting: true },
  { id: 'quantity', header: 'Units', accessorKey: 'quantity', enableSorting: true },
  { id: 'marginPct', header: 'Margin', accessorKey: 'marginPct', enableSorting: true },
];

const DATASET_SIZE = 10000;

interface ToolbarProps {
  globalSearch: string;
  onGlobalSearchChange: (value: string) => void;
  onExport: () => void;
  onToggleColumns: () => void;
  showColumnPicker: boolean;
  groupingEnabled: boolean;
  onToggleGrouping: () => void;
  virtualizedEnabled: boolean;
  onToggleVirtualization: () => void;
}

function Toolbar({
  globalSearch,
  onGlobalSearchChange,
  onExport,
  onToggleColumns,
  showColumnPicker,
  groupingEnabled,
  onToggleGrouping,
  virtualizedEnabled,
  onToggleVirtualization,
}: ToolbarProps) {
  return (
    <div className="advanced-toolbar">
      <div className="toolbar-group">
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 8, color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            placeholder="Search records..."
            className="search-input"
            style={{ paddingLeft: 32, width: 240 }}
          />
          {globalSearch && (
            <button
              type="button"
              onClick={() => onGlobalSearchChange('')}
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
      </div>

      <div className="toolbar-group">
        <button
          type="button"
          className={`ghost-btn ${groupingEnabled ? 'active' : ''}`}
          onClick={onToggleGrouping}
          title="Toggle grouping"
          style={{
            background: groupingEnabled ? 'var(--accent-soft)' : undefined,
            color: groupingEnabled ? 'var(--accent)' : undefined,
          }}
        >
          <LayoutGrid size={14} /> Group
        </button>

        <button
          type="button"
          className={`ghost-btn ${virtualizedEnabled ? 'active' : ''}`}
          onClick={onToggleVirtualization}
          title="Toggle virtualization"
          style={{
            background: virtualizedEnabled ? 'var(--accent-soft)' : undefined,
            color: virtualizedEnabled ? 'var(--accent)' : undefined,
          }}
        >
          <Table2 size={14} /> Virtual
        </button>

        <button
          type="button"
          className={`ghost-btn ${showColumnPicker ? 'active' : ''}`}
          onClick={onToggleColumns}
          title="Column settings"
        >
          <Columns3 size={14} /> Columns
        </button>

        <button type="button" className="btn-primary" onClick={onExport}>
          <Download size={14} /> Export
        </button>
      </div>
    </div>
  );
}

type CombinedTable = ReturnType<typeof withGrouping<SalesRecord, LocalState>> & {
  sorting: ReturnType<typeof withSorting<SalesRecord, LocalState>>['sorting'];
  filtering: ReturnType<typeof withFiltering<SalesRecord, LocalState>>['filtering'];
  columnVisibility: ReturnType<typeof withColumnVisibility<SalesRecord, LocalState>>['columnVisibility'];
  columnPinning: ReturnType<typeof withColumnPinning<SalesRecord, LocalState>>['columnPinning'];
};

export default function EnterpriseTable() {
  const [globalSearch, setGlobalSearch] = useState('');
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [groupingEnabled, setGroupingEnabled] = useState(false);
  const [virtualizedEnabled, setVirtualizedEnabled] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);

  const data = useMemo(() => createLargeSalesDataset(DATASET_SIZE), []);

  const filteredData = useMemo(() => {
    if (!globalSearch) return data;
    const term = globalSearch.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(term))
    );
  }, [data, globalSearch]);

  const baseTable = usePivotTable<SalesRecord, LocalState>({
    data: filteredData,
    columns: useMemo(() => COLUMNS, []),
    plugins: useMemo(
      () => [
        createSortingPlugin(),
        createFilteringPlugin(),
        createColumnVisibilityPlugin(),
        createColumnPinningPlugin(),
        createGroupingPlugin(),
      ],
      [],
    ),
  });

  const table = useMemo((): CombinedTable => {
    const withSortingTable = withSorting<SalesRecord, LocalState>(baseTable);
    const withFilteringTable = withFiltering<SalesRecord, LocalState>(withSortingTable);
    const withVisibilityTable = withColumnVisibility<SalesRecord, LocalState>(withFilteringTable);
    const withPinningTable = withColumnPinning<SalesRecord, LocalState>(withVisibilityTable);
    const withGroupingTable = withGrouping<SalesRecord, LocalState>(withPinningTable);
    
    return {
      ...withGroupingTable,
      sorting: withSortingTable.sorting,
      filtering: withFilteringTable.filtering,
      columnVisibility: withVisibilityTable.columnVisibility,
      columnPinning: withPinningTable.columnPinning,
    } as CombinedTable;
  }, [baseTable]);

  const groupingApiRef = useRef<GroupingApi<SalesRecord, LocalState> | null>(null);
  
  if (!groupingApiRef.current && table.grouping) {
    groupingApiRef.current = table.grouping;
  }

  useEffect(() => {
    if (groupingApiRef.current) {
      const currentGrouping = groupingApiRef.current.getRowGrouping();
      const targetGrouping = groupingEnabled ? ['region', 'category'] : [];
      if (JSON.stringify(currentGrouping) !== JSON.stringify(targetGrouping)) {
        groupingApiRef.current.setRowGrouping(targetGrouping);
      }
    }
  }, [groupingEnabled]);

  const rows = table.getRowModel().rows;
  const visibleColumns = useMemo(
    () => table.columns.filter((col) => table.columnVisibility.getIsColumnVisible(col.id)),
    [table.columns, table.columnVisibility],
  );

  const getScrollElement = useCallback(() => containerRef.current, []);
  const estimateSize = useCallback(() => 38, []);

  const { virtualRows, totalSize } = useVirtualRows({
    count: rows.length,
    getScrollElement,
    estimateSize,
    overscan: 10,
    enabled: virtualizedEnabled,
  });

  const handleExport = useCallback(() => {
    const exportRows = rows.slice(0, 1000).map((row) => {
      const obj: Record<string, unknown> = {};
      visibleColumns.forEach((col) => {
        obj[col.header ?? col.id] = row.original[col.id as keyof SalesRecord];
      });
      return obj;
    });
    exportCSV({ rows: exportRows, fileName: 'enterprise-export' }).download();
  }, [rows, visibleColumns]);

  const toggleGroup = useCallback((groupId: string) => {
    groupingApiRef.current?.toggleGroupExpanded(groupId);
  }, []);

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

  const getSortIcon = (columnId: string) => {
    const sorted = table.sorting.getIsSorted(columnId);
    if (sorted === 'asc') return <ArrowUp size={12} />;
    if (sorted === 'desc') return <ArrowDown size={12} />;
    return <ArrowUpDown size={12} />;
  };

  const leftPinned = table.columnPinning.getPinnedColumns('left');
  const rightPinned = table.columnPinning.getPinnedColumns('right');
  const centerColumns = visibleColumns.filter((c) => !leftPinned.includes(c.id) && !rightPinned.includes(c.id));

  return (
    <div className="advanced-grid">
      <Toolbar
        globalSearch={globalSearch}
        onGlobalSearchChange={setGlobalSearch}
        onExport={handleExport}
        onToggleColumns={() => setShowColumnPicker(!showColumnPicker)}
        showColumnPicker={showColumnPicker}
        groupingEnabled={groupingEnabled}
        onToggleGrouping={() => setGroupingEnabled(!groupingEnabled)}
        virtualizedEnabled={virtualizedEnabled}
        onToggleVirtualization={() => setVirtualizedEnabled(!virtualizedEnabled)}
      />

      {showColumnPicker && (
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-muted)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {table.columns.map((column: { id: string; header?: string }) => (
            <label
              key={column.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                background: 'var(--surface)',
                borderRadius: 6,
                fontSize: '0.8rem',
                cursor: 'pointer',
                border: '1px solid var(--border)',
              }}
            >
              <input
                type="checkbox"
                checked={table.columnVisibility.getIsColumnVisible(column.id)}
                onChange={() => table.columnVisibility.toggleColumnVisibility(column.id)}
              />
              {column.header ?? column.id}
            </label>
          ))}
        </div>
      )}

      <div
        ref={containerRef}
        className="table-shell"
        style={{
          height: 480,
          overflow: 'auto',
          border: 'none',
          borderRadius: 0,
        }}
      >
        <table className="demo-table" style={{ minWidth: '100%' }}>
          <thead
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              background: 'var(--surface-muted)',
            }}
          >
            <tr>
              <th style={{ width: 40, textAlign: 'center', position: 'sticky', left: 0, zIndex: 11 }}>
                <input
                  type="checkbox"
                  checked={selectedRows.size === Math.min(100, rows.length) && rows.length > 0}
                  onChange={() => {
                    if (selectedRows.size === Math.min(100, rows.length)) {
                      setSelectedRows(new Set());
                    } else {
                      setSelectedRows(new Set(Array.from({ length: Math.min(100, rows.length) }, (_, i) => i)));
                    }
                  }}
                />
              </th>
              {leftPinned.map((colId: string) => {
                const column = table.columns.find((c: { id: string }) => c.id === colId);
                if (!column) return null;
                return (
                  <th
                    key={colId}
                    style={{ position: 'sticky', left: 40, zIndex: 11, minWidth: 120 }}
                  >
                    <button
                      type="button"
                      onClick={() => table.sorting.toggleSorting(colId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-muted)',
                        padding: 0,
                      }}
                    >
                      {column.header ?? column.id}
                      <span style={{ opacity: table.sorting.getIsSorted(colId) ? 1 : 0.4 }}>
                        {getSortIcon(colId)}
                      </span>
                    </button>
                  </th>
                );
              })}
              {centerColumns.map((column: { id: string; header?: string; enableSorting?: boolean }) => (
                <th key={column.id}>
                  <button
                    type="button"
                    onClick={() => column.enableSorting && table.sorting.toggleSorting(column.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'none',
                      border: 'none',
                      cursor: column.enableSorting ? 'pointer' : 'default',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-muted)',
                      padding: 0,
                    }}
                  >
                    {column.header ?? column.id}
                    {column.enableSorting && (
                      <span style={{ opacity: table.sorting.getIsSorted(column.id) ? 1 : 0.4 }}>
                        {getSortIcon(column.id)}
                      </span>
                    )}
                  </button>
                </th>
              ))}
              {rightPinned.map((colId: string) => {
                const column = table.columns.find((c: { id: string }) => c.id === colId);
                if (!column) return null;
                return (
                  <th
                    key={colId}
                    style={{ position: 'sticky', right: 0, zIndex: 11, minWidth: 120, background: 'var(--surface-muted)' }}
                  >
                    <button
                      type="button"
                      onClick={() => table.sorting.toggleSorting(colId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-muted)',
                        padding: 0,
                      }}
                    >
                      {column.header ?? column.id}
                      <span style={{ opacity: table.sorting.getIsSorted(colId) ? 1 : 0.4 }}>
                        {getSortIcon(colId)}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {(virtualizedEnabled ? virtualRows : rows.slice(0, 100).map((_: unknown, i: number) => ({ index: i, start: i * 38, size: 38, end: (i + 1) * 38 }))).map((virtualItem: { index: number; start: number; size: number }) => {
              const row = rows[virtualItem.index] as {
                id: string;
                original: SalesRecord & { __group?: boolean; __groupingValue?: string; __depth?: number; __rowCount?: number };
              };
              if (!row) return null;

              const isGroup = row.original.__group === true;
              const groupValue = row.original.__groupingValue;
              const depth = row.original.__depth ?? 0;
              const rowCount = row.original.__rowCount;
              const isExpanded = table.grouping.getIsGroupExpanded(row.id);

              return (
                <tr
                  key={row.id}
                  style={{
                    transform: virtualizedEnabled ? `translateY(${virtualItem.start}px)` : undefined,
                    position: virtualizedEnabled ? 'absolute' : undefined,
                    top: virtualizedEnabled ? 0 : undefined,
                    left: 0,
                    width: '100%',
                    height: virtualItem.size,
                    background: selectedRows.has(virtualItem.index) ? 'var(--accent-soft)' : undefined,
                  }}
                >
                  <td style={{ textAlign: 'center', position: 'sticky', left: 0, background: 'var(--surface)' }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(virtualItem.index)}
                      onChange={() => toggleRowSelection(virtualItem.index)}
                    />
                  </td>
                  {leftPinned.map((colId: string) => {
                    const column = table.columns.find((c: { id: string }) => c.id === colId);
                    if (!column) return null;
                    const value = row.original[colId as keyof SalesRecord];
                    return (
                      <td
                        key={`${row.id}_${colId}`}
                        style={{
                          position: 'sticky',
                          left: 40,
                          background: isGroup ? 'var(--accent-soft)' : selectedRows.has(virtualItem.index) ? 'var(--accent-soft)' : 'var(--surface)',
                          fontWeight: isGroup ? 600 : 400,
                        }}
                      >
                        {isGroup ? (
                          <button
                            type="button"
                            onClick={() => toggleGroup(row.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--accent)',
                              padding: 0,
                              marginLeft: depth * 16,
                            }}
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            {String(groupValue ?? '').split('|||').join(' / ')}
                            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                              ({rowCount})
                            </span>
                          </button>
                        ) : (
                          String(value ?? '-')
                        )}
                      </td>
                    );
                  })}
                  {centerColumns.map((column: { id: string; header?: string }) => {
                    if (isGroup && column.id !== leftPinned[0]) {
                      return <td key={`${row.id}_${column.id}`}>-</td>;
                    }
                    const value = row.original[column.id as keyof SalesRecord];
                    return (
                      <td key={`${row.id}_${column.id}`}>
                        {column.id === 'amount'
                          ? formatCurrency(value as number | undefined)
                          : column.id === 'marginPct'
                            ? <span style={{
                                color: (value as number) >= 50 ? 'var(--success)' : (value as number) >= 40 ? 'var(--warning)' : 'var(--danger)',
                                fontWeight: 500
                              }}>{String(value)}%</span>
                            : String(value ?? '-')}
                      </td>
                    );
                  })}
                  {rightPinned.map((colId: string) => {
                    const column = table.columns.find((c: { id: string }) => c.id === colId);
                    if (!column) return null;
                    const value = row.original[colId as keyof SalesRecord];
                    return (
                      <td
                        key={`${row.id}_${colId}`}
                        style={{
                          position: 'sticky',
                          right: 0,
                          background: isGroup ? 'var(--accent-soft)' : selectedRows.has(virtualItem.index) ? 'var(--accent-soft)' : 'var(--surface)',
                        }}
                      >
                        {column.id === 'amount'
                          ? formatCurrency(value as number | undefined)
                          : String(value ?? '-')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
        }}
      >
        <span>
          {selectedRows.size > 0 && <span style={{ marginRight: 12 }}>{selectedRows.size} selected</span>}
          Showing {virtualizedEnabled ? virtualRows.length : Math.min(100, rows.length)} of {rows.length.toLocaleString()} rows
        </span>
        <span>
          {groupingEnabled && <span style={{ marginRight: 12 }}>Grouping active</span>}
          {virtualizedEnabled && <span>Virtualized</span>}
        </span>
      </div>
    </div>
  );
}

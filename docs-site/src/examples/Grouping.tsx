import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import type { ColumnDef } from '@pivot/types';
import { createGroupingPlugin, withGrouping, type GroupingTableState, type GroupingApi } from '@pivot/plugins/grouping';
import type { SalesRecord } from './data';
import { salesData } from './data';
import { formatCurrency } from './common';
import { ChevronRight, ChevronDown, Layers, Ungroup } from 'lucide-react';

type LocalState = GroupingTableState;

const COLUMNS: ColumnDef<SalesRecord>[] = [
  { id: 'region', header: 'Region', accessorKey: 'region' },
  { id: 'category', header: 'Category', accessorKey: 'category' },
  { id: 'product', header: 'Product', accessorKey: 'product' },
  { id: 'amount', header: 'Amount', accessorKey: 'amount' },
  { id: 'quantity', header: 'Units', accessorKey: 'quantity' },
  { id: 'marginPct', header: 'Margin %', accessorKey: 'marginPct' },
];

const AVAILABLE_GROUPINGS = ['region', 'category', 'channel', 'quarter'] as const;

export default function Grouping() {
  const [rowGroups, setRowGroups] = useState<string[]>(['region', 'category']);
  const [showAggregations, setShowAggregations] = useState(true);

  const groupingApiRef = useRef<GroupingApi<SalesRecord, LocalState> | null>(null);

  const tableBase = usePivotTable<SalesRecord, LocalState>({
    data: useMemo(() => salesData, []),
    columns: useMemo(() => COLUMNS, []),
    plugins: useMemo(() => [createGroupingPlugin()], []),
  });

  const table = useMemo(() => {
    const result = withGrouping<SalesRecord, LocalState>(tableBase);
    if (!groupingApiRef.current) {
      groupingApiRef.current = result.grouping;
    }
    return result;
  }, [tableBase]);

  useEffect(() => {
    if (groupingApiRef.current) {
      const currentGrouping = groupingApiRef.current.getRowGrouping();
      if (JSON.stringify(currentGrouping) !== JSON.stringify(rowGroups)) {
        groupingApiRef.current.setRowGrouping(rowGroups);
      }
    }
  }, [rowGroups]);

  const rows = table.getRowModel().rows;

  const toggleGrouping = useCallback((field: string) => {
    setRowGroups((prev) => {
      if (prev.includes(field)) {
        return prev.filter((g) => g !== field);
      }
      return [...prev, field];
    });
  }, []);

  const clearGrouping = useCallback(() => {
    setRowGroups([]);
    groupingApiRef.current?.resetGrouping();
  }, []);

  const getGroupAggregates = useCallback((rowsToAggregate: SalesRecord[]) => {
    const totalAmount = rowsToAggregate.reduce((sum, r) => sum + (r.amount ?? 0), 0);
    const totalQuantity = rowsToAggregate.reduce((sum, r) => sum + (r.quantity ?? 0), 0);
    const avgMargin =
      rowsToAggregate.length > 0
        ? rowsToAggregate.reduce((sum, r) => sum + (r.marginPct ?? 0), 0) / rowsToAggregate.length
        : 0;
    return { totalAmount, totalQuantity, avgMargin };
  }, []);

  const getColorForMargin = (margin: number) => {
    if (margin >= 50) return 'var(--success)';
    if (margin >= 40) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div>
      <div className="toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Group by:</span>
          {AVAILABLE_GROUPINGS.map((field) => (
            <button
              key={field}
              type="button"
              className="ghost-btn"
              onClick={() => toggleGrouping(field)}
              style={{
                padding: '4px 8px',
                fontSize: '0.8rem',
                background: rowGroups.includes(field) ? 'var(--accent-soft)' : undefined,
                color: rowGroups.includes(field) ? 'var(--accent)' : undefined,
              }}
            >
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setShowAggregations(!showAggregations)}
            style={{ fontSize: '0.8rem' }}
          >
            {showAggregations ? 'Hide' : 'Show'} aggregates
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={clearGrouping}
            style={{ fontSize: '0.8rem' }}
          >
            <Ungroup size={14} /> Clear
          </button>
        </div>
      </div>

      <div className="table-shell">
        <table className="demo-table">
          <thead>
            <tr>
              {table.columns.map((column) => (
                <th key={column.id}>{column.header ?? column.id}</th>
              ))}
              {showAggregations && (
                <>
                  <th>Total Amount</th>
                  <th>Total Units</th>
                  <th>Avg Margin</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isGroup = row.original.__group === true;
              const depth = (row.original.__depth as number) ?? 0;
              const groupingValue = row.original.__groupingValue as string | undefined;
              const rowCount = row.original.__rowCount as number | undefined;

              if (isGroup) {
                const aggregates = showAggregations ? getGroupAggregates(salesData) : null;
                const groupId = row.id;
                const isExpanded = table.grouping.getIsGroupExpanded(groupId);

                return (
                  <tr key={row.id} className="group-row">
                    <td colSpan={table.columns.length}>
                      <button
                        type="button"
                        onClick={() => table.grouping.toggleGroupExpanded(groupId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          marginRight: 8,
                          color: 'var(--accent)',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      <span style={{ fontWeight: 600 }}>
                        {groupingValue?.split('|||').join(' / ') ?? 'Total'}
                      </span>
                      <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        ({rowCount ?? 0} {rowCount === 1 ? 'item' : 'items'})
                      </span>
                    </td>
                    {showAggregations && aggregates && (
                      <>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(aggregates.totalAmount)}</td>
                        <td>{aggregates.totalQuantity.toLocaleString()}</td>
                        <td>
                          <span style={{ color: getColorForMargin(aggregates.avgMargin), fontWeight: 500 }}>
                            {aggregates.avgMargin.toFixed(1)}%
                          </span>
                        </td>
                      </>
                    )}
                    {!showAggregations && (
                      <>
                        <td></td>
                        <td></td>
                        <td></td>
                      </>
                    )}
                  </tr>
                );
              }

              const value = row.original;
              return (
                <tr key={row.id}>
                  {table.columns.map((column) => (
                    <td
                      key={`${row.id}_${column.id}`}
                      style={{ paddingLeft: (depth + 1) * 20 }}
                    >
                      {column.id === 'amount' ? (
                        formatCurrency(value[column.id as keyof SalesRecord] as number | undefined)
                      ) : column.id === 'marginPct' ? (
                        <span style={{ color: getColorForMargin(value[column.id as keyof SalesRecord] as number) }}>
                          {String(value[column.id as keyof SalesRecord])}%
                        </span>
                      ) : (
                        String(value[column.id as keyof SalesRecord] ?? '-')
                      )}
                    </td>
                  ))}
                  {!showAggregations && (
                    <>
                      <td></td>
                      <td></td>
                      <td></td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="meta-row">
        {rowGroups.length > 0
          ? `Grouped by: ${rowGroups.join(' > ')}`
          : 'No grouping applied'}
      </p>
    </div>
  );
}

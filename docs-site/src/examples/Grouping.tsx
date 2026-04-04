import { useMemo } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import type { ColumnDef } from '@pivot/types';
import { createGroupingPlugin, withGrouping, type GroupingTableState } from '@pivot/plugins/grouping';
import type { SalesRecord } from './data';
import { salesData } from './data';
import { formatCurrency } from './common';

const columns: ColumnDef<SalesRecord>[] = [
  { id: 'region', header: 'Region', accessorKey: 'region' },
  { id: 'category', header: 'Category', accessorKey: 'category' },
  { id: 'product', header: 'Product', accessorKey: 'product' },
  { id: 'amount', header: 'Amount', accessorKey: 'amount' },
  { id: 'quantity', header: 'Units', accessorKey: 'quantity' },
];

export default function Grouping() {
  const tableBase = usePivotTable<SalesRecord, GroupingTableState>({
    data: useMemo(() => salesData, []),
    columns: useMemo(() => columns, []),
    plugins: useMemo(() => [createGroupingPlugin()], []),
    initialState: {
      sorting: [],
      filters: [],
      columnVisibility: {},
      rowSelection: {},
      expanded: {},
      rowGrouping: ['region', 'category'],
      columnGrouping: [],
      expandedGroups: {},
    },
  });
  const table = useMemo(() => withGrouping<SalesRecord, GroupingTableState>(tableBase), [tableBase]);
  const rows = table.getRowModel().rows;

  return (
    <div>
      <div className="toolbar">
        <button className="ghost-btn" type="button" onClick={() => table.grouping.resetGrouping()}>
          Reset grouping
        </button>
        <button
          className="ghost-btn"
          type="button"
          onClick={() => table.grouping.setRowGrouping(['region', 'category'])}
        >
          Group by region + category
        </button>
      </div>
      <div className="table-shell">
        <table className="demo-table">
          <thead>
            <tr>
              {table.columns.map((column) => (
                <th key={column.id}>{column.header ?? column.id}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isGroup = row.getValue('__group') === true;
              const depth = Number(row.getValue('__depth') ?? 0);
              return (
                <tr key={row.id} className={isGroup ? 'group-row' : undefined}>
                  {table.columns.map((column, index) => {
                    if (isGroup && index === 0) {
                      return (
                        <td key={`${row.id}_${column.id}`}>
                          <button
                            type="button"
                            className="ghost-btn"
                            style={{ marginLeft: depth * 14 }}
                            onClick={() => table.grouping.toggleGroupExpanded(row.id)}
                          >
                            {table.grouping.getIsGroupExpanded(row.id) ? '▼' : '▶'}{' '}
                            {String(row.getValue('__groupingValue') ?? '-')} (
                            {String(row.getValue('__rowCount') ?? 0)})
                          </button>
                        </td>
                      );
                    }

                    if (isGroup) {
                      return <td key={`${row.id}_${column.id}`}>-</td>;
                    }

                    const value = row.getValue(column.id);
                    return (
                      <td key={`${row.id}_${column.id}`}>
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
    </div>
  );
}

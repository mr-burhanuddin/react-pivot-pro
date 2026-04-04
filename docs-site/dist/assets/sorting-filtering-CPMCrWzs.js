const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/SortingFiltering-CeuEDJYD.js","assets/index-d6EXP2Gi.js","assets/index-Cnssq-ke.css","assets/usePivotTable-P-YZ_TJl.js","assets/filtering-CUjDeeIx.js","assets/data-CtskSjFW.js"])))=>i.map(i=>d[i]);
import{j as e,r,_ as o}from"./index-d6EXP2Gi.js";import{C as i}from"./CodePreview-BIgVgZlQ.js";import{E as l}from"./ExampleRenderer-CwP9ajHP.js";const n=`import { useMemo } from 'react';
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
                  <td key={\`\${row.id}_\${column.id}\`}>
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
`,a=r.lazy(()=>o(()=>import("./SortingFiltering-CeuEDJYD.js"),__vite__mapDeps([0,1,2,3,4,5])));function g({route:t}){return e.jsxs("article",{className:"doc-page",children:[e.jsx("p",{className:"callout",children:t.description}),e.jsx("h2",{id:"column-sorting",children:"Column Sorting"}),e.jsx("p",{children:"Sorting supports single and multi-sort modes. Toggle logic cycles ascending, descending, then cleared."}),e.jsx("h2",{id:"when-to-use",children:"When To Use"}),e.jsx("p",{children:"Apply this stack when users need quick ad-hoc exploration without leaving context or opening a separate report builder."}),e.jsx("h2",{id:"key-concepts",children:"Key Concepts"}),e.jsxs("ul",{children:[e.jsx("li",{children:"Filtering plugin runs before sorting in plugin order."}),e.jsx("li",{children:"Use global filter for broad matching and column filters for precision."}),e.jsx("li",{children:"State is fully controllable for URL syncing or persistence."})]}),e.jsx(i,{title:"Interactive sorting and filtering",code:n,children:e.jsx(l,{component:a})})]})}export{g as default};

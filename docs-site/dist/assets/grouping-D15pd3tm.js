const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/Grouping-CQnw_p_C.js","assets/index-d6EXP2Gi.js","assets/index-Cnssq-ke.css","assets/usePivotTable-P-YZ_TJl.js","assets/grouping-BVUq_l7X.js","assets/data-CtskSjFW.js"])))=>i.map(i=>d[i]);
import{j as e,r as t,_ as r}from"./index-d6EXP2Gi.js";import{C as n}from"./CodePreview-BIgVgZlQ.js";import{E as i}from"./ExampleRenderer-CwP9ajHP.js";const a=`import { useMemo } from 'react';
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
                        <td key={\`\${row.id}_\${column.id}\`}>
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
                      return <td key={\`\${row.id}_\${column.id}\`}>-</td>;
                    }

                    const value = row.getValue(column.id);
                    return (
                      <td key={\`\${row.id}_\${column.id}\`}>
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
`,s=t.lazy(()=>r(()=>import("./Grouping-CQnw_p_C.js"),__vite__mapDeps([0,1,2,3,4,5])));function p({route:o}){return e.jsxs("article",{className:"doc-page",children:[e.jsx("p",{className:"callout",children:o.description}),e.jsx("h2",{id:"group-state",children:"Group State"}),e.jsx("p",{children:"Grouping uses `rowGrouping` and `expandedGroups` in state. The plugin emits synthetic group rows with metadata like `__depth`, `__groupingValue`, and `__rowCount`."}),e.jsx("h2",{id:"when-to-use",children:"When To Use"}),e.jsx("p",{children:"Use grouping to reveal hierarchy in long lists, for example region → category → product rollups."}),e.jsx("h2",{id:"key-concepts",children:"Key Concepts"}),e.jsxs("ul",{children:[e.jsx("li",{children:"Group rows are regular rows with special metadata values."}),e.jsx("li",{children:"You can render custom expand/collapse controls per group row."}),e.jsx("li",{children:"Grouping can be combined with sorting and filtering plugins."})]}),e.jsx(n,{title:"Nested row grouping with expand/collapse",code:a,children:e.jsx(i,{component:s})})]})}export{p as default};

const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/PivotTable-CEjd39Zi.js","assets/index-d6EXP2Gi.js","assets/index-Cnssq-ke.css","assets/usePivotTable-P-YZ_TJl.js","assets/grouping-BVUq_l7X.js","assets/pivot-DajptWZ9.js","assets/data-CtskSjFW.js"])))=>i.map(i=>d[i]);
import{j as e,r as o,_ as a}from"./index-d6EXP2Gi.js";import{C as r}from"./CodePreview-BIgVgZlQ.js";import{E as i}from"./ExampleRenderer-CwP9ajHP.js";const s=`import { useMemo } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import type { ColumnDef } from '@pivot/types';
import { createGroupingPlugin, withGrouping, type GroupingTableState } from '@pivot/plugins/grouping';
import { createPivotPlugin, withPivot, type PivotTableState } from '@pivot/plugins/pivot';
import type { SalesRecord } from './data';
import { salesData } from './data';
import { formatCurrency } from './common';

type LocalState = GroupingTableState & PivotTableState;

const columns: ColumnDef<SalesRecord>[] = [
  { id: 'region', accessorKey: 'region', header: 'Region' },
  { id: 'quarter', accessorKey: 'quarter', header: 'Quarter' },
  { id: 'amount', accessorKey: 'amount', header: 'Amount' },
  { id: 'quantity', accessorKey: 'quantity', header: 'Units' },
];

export default function PivotTable() {
  const tableBase = usePivotTable<SalesRecord, LocalState>({
    data: useMemo(() => salesData, []),
    columns: useMemo(() => columns, []),
    plugins: useMemo(
      () => [
        createGroupingPlugin(),
        createPivotPlugin<SalesRecord, LocalState>({
          defaultValues: [
            { id: 'amount', aggregation: 'sum' },
            { id: 'quantity', aggregation: 'avg' },
          ],
        }),
      ],
      [],
    ),
    initialState: {
      sorting: [],
      filters: [],
      columnVisibility: {},
      rowSelection: {},
      expanded: {},
      rowGrouping: ['region'],
      columnGrouping: ['quarter'],
      expandedGroups: {},
      pivotEnabled: true,
      pivotValues: [
        { id: 'amount', aggregation: 'sum' },
        { id: 'quantity', aggregation: 'avg' },
      ],
    },
  });

  const table = useMemo(
    () => withPivot<SalesRecord, LocalState>(withGrouping<SalesRecord, LocalState>(tableBase)),
    [tableBase],
  );
  const result = table.pivot.getPivotResult();

  if (!result) {
    return <p className="meta-row">Pivot is disabled.</p>;
  }

  return (
    <div className="table-shell">
      <table className="demo-table">
        <thead>
          <tr>
            <th>Row Group</th>
            {result.columnHeaders.map((column) => (
              <th key={column.key}>{column.path.join(' / ') || 'Total'}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rowHeaders.map((path) => {
            const rowKey = path.length === 0 ? '__root__' : path.join('||');
            return (
              <tr key={rowKey}>
                <td>{path.join(' / ') || 'All Regions'}</td>
                {result.columnHeaders.map((column) => {
                  const valueMap = result.matrixByRowKey[rowKey]?.[column.key] ?? {};
                  return (
                    <td key={\`\${rowKey}_\${column.key}\`}>
                      <div>{formatCurrency(valueMap.amount as number | undefined)}</div>
                      <div className="meta-row">
                        Avg units: {Number(valueMap.quantity ?? 0).toFixed(1)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
`,n=o.lazy(()=>a(()=>import("./PivotTable-CEjd39Zi.js"),__vite__mapDeps([0,1,2,3,4,5,6])));function m({route:t}){return e.jsxs("article",{className:"doc-page",children:[e.jsx("p",{className:"callout",children:t.description}),e.jsx("h2",{id:"pivot-values",children:"Pivot Values"}),e.jsx("p",{children:"Pivot values define which measures are aggregated. Each value can specify an aggregation strategy such as `sum`, `avg`, `min`, `max`, or custom function keys."}),e.jsx("h2",{id:"when-to-use",children:"When To Use"}),e.jsx("p",{children:"Use pivot mode when teams need matrix-style summaries by row and column dimensions, such as region by quarter performance."}),e.jsx("h2",{id:"key-concepts",children:"Key Concepts"}),e.jsxs("ul",{children:[e.jsx("li",{children:"`rowGrouping` controls row header paths."}),e.jsx("li",{children:"`columnGrouping` controls generated pivot columns."}),e.jsx("li",{children:"`pivotEnabled` gates whether rows are transformed into pivot output."})]}),e.jsx(r,{title:"Multi-column pivot aggregation",code:s,children:e.jsx(i,{component:n})})]})}export{m as default};

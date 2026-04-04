import React, { useState } from 'react';
import { usePivotTable, type ColumnDef } from '../../src';
import { createSortingPlugin, withSorting } from '../../src/plugins/sorting';
import { createFilteringPlugin, withFiltering } from '../../src/plugins/filtering';

type Order = {
  id: string;
  customer: string;
  region: 'NA' | 'EU' | 'APAC';
  amount: number;
};

const DATA: Order[] = [
  { id: 'o1', customer: 'Acme', region: 'NA', amount: 1200 },
  { id: 'o2', customer: 'Globex', region: 'EU', amount: 900 },
  { id: 'o3', customer: 'Initech', region: 'APAC', amount: 1500 },
  { id: 'o4', customer: 'Umbrella', region: 'NA', amount: 700 },
];

export default function SortingFilteringExample(): JSX.Element {
  const [query, setQuery] = useState('');

  const columns: ColumnDef<Order>[] = [
    { id: 'customer', accessorKey: 'customer', enableSorting: true, enableFiltering: true },
    { id: 'region', accessorKey: 'region', enableSorting: true, enableFiltering: true },
    { id: 'amount', accessorKey: 'amount', enableSorting: true },
  ];

  const base = usePivotTable<Order>({
    data: DATA,
    columns,
    plugins: [createFilteringPlugin(), createSortingPlugin()],
    initialState: {
      sorting: [{ id: 'amount', desc: true }],
      filters: [],
      columnVisibility: {},
      rowSelection: {},
      expanded: {},
      globalFilter: '',
    } as any,
  });

  const table = withFiltering(withSorting(base));

  return (
    <div>
      <input
        value={query}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          table.filtering.setGlobalFilter(next);
        }}
        placeholder="Global filter"
      />
      <button onClick={() => table.sorting.toggleSorting('amount', true)}>Toggle amount sort</button>

      <table>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              <td>{String(row.getValue('customer'))}</td>
              <td>{String(row.getValue('region'))}</td>
              <td>{String(row.getValue('amount'))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

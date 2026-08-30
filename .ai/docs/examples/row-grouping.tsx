import React from 'react';
import { usePivotTable, type ColumnDef } from '../../src';
import { createGroupingPlugin, withGrouping } from '../../src/plugins/grouping';

type Ticket = {
  id: string;
  team: string;
  priority: string;
  owner: string;
};

const DATA: Ticket[] = [
  { id: 't1', team: 'Platform', priority: 'High', owner: 'Ava' },
  { id: 't2', team: 'Platform', priority: 'Low', owner: 'Noah' },
  { id: 't3', team: 'Product', priority: 'High', owner: 'Mia' },
];

export default function RowGroupingExample(): JSX.Element {
  const columns: ColumnDef<Ticket>[] = [
    { id: 'team', accessorKey: 'team' },
    { id: 'priority', accessorKey: 'priority' },
    { id: 'owner', accessorKey: 'owner' },
  ];

  const base = usePivotTable<Ticket>({
    data: DATA,
    columns,
    plugins: [createGroupingPlugin()],
    initialState: {
      sorting: [],
      filters: [],
      columnVisibility: {},
      rowSelection: {},
      expanded: {},
      rowGrouping: ['team'],
      columnGrouping: [],
      expandedGroups: {},
    } as any,
  });

  const table = withGrouping(base);

  return (
    <div>
      <button onClick={() => table.grouping.setRowGrouping(['team', 'priority'])}>Team -> Priority</button>
      <table>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              <td>{String(row.getValue('team') ?? row.getValue('__groupingValue'))}</td>
              <td>{String(row.getValue('priority') ?? '')}</td>
              <td>{String(row.getValue('owner') ?? '')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

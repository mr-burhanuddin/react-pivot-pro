import React from 'react';
import { usePivotTable, type ColumnDef } from '../../src';

type User = { id: string; name: string; team: string; score: number };

const DATA: User[] = [
  { id: 'u1', name: 'Ava', team: 'Platform', score: 92 },
  { id: 'u2', name: 'Noah', team: 'Product', score: 88 },
  { id: 'u3', name: 'Mia', team: 'Design', score: 95 },
];

export default function BasicTableExample(): JSX.Element {
  const columns: ColumnDef<User>[] = [
    { id: 'name', accessorKey: 'name' },
    { id: 'team', accessorKey: 'team' },
    { id: 'score', accessorKey: 'score' },
  ];

  const table = usePivotTable<User>({
    data: DATA,
    columns,
    initialState: {
      sorting: [],
      filters: [],
      columnVisibility: {},
      rowSelection: {},
      expanded: {},
    },
  });

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Team</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            <td>{String(row.getValue('name'))}</td>
            <td>{String(row.getValue('team'))}</td>
            <td>{String(row.getValue('score'))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

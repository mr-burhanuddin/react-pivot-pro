import React from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { usePivotTable, type ColumnDef } from '../../src';
import { createDndColumnPlugin, withDndColumn } from '../../src/plugins/dndColumn';
import { createDndRowPlugin, withDndRow } from '../../src/plugins/dndRow';

type Row = { id: string; name: string; role: string };

const DATA: Row[] = [
  { id: '1', name: 'Ava', role: 'Engineer' },
  { id: '2', name: 'Noah', role: 'Designer' },
  { id: '3', name: 'Mia', role: 'PM' },
];

export default function DndReorderExample(): JSX.Element {
  const columns: ColumnDef<Row>[] = [
    { id: 'name', accessorKey: 'name' },
    { id: 'role', accessorKey: 'role' },
  ];

  const base = usePivotTable<Row>({
    data: DATA,
    columns,
    plugins: [createDndColumnPlugin(), createDndRowPlugin()],
    initialState: {
      sorting: [],
      filters: [],
      columnVisibility: {},
      rowSelection: {},
      expanded: {},
      columnOrder: [],
      rowOrder: [],
    } as any,
  });

  const table = withDndRow(withDndColumn(base));

  const onColumnDragEnd = (event: DragEndEvent) => table.dndColumn.handleDragEnd(event);
  const onRowDragEnd = (event: DragEndEvent) => table.dndRow.handleDragEnd(event);

  return (
    <div>
      <button onClick={() => table.dndColumn.reorderColumns('role', 'name')}>Move role before name</button>
      <button onClick={() => table.dndRow.reorderRows('3', '1')}>Move Mia to top</button>
      <pre>{JSON.stringify({
        columnOrder: table.dndColumn.getColumnOrder(),
        rowOrder: table.dndRow.getRowOrder(),
      }, null, 2)}</pre>
      <div style={{ display: 'none' }}>{String(Boolean(onColumnDragEnd && onRowDragEnd))}</div>
    </div>
  );
}

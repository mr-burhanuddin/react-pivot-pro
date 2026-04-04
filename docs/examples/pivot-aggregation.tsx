import React from 'react';
import { usePivotTable, type ColumnDef } from '../../src';
import { createGroupingPlugin, withGrouping } from '../../src/plugins/grouping';
import { createPivotPlugin, withPivot } from '../../src/plugins/pivot';

type Sale = {
  id: string;
  region: 'NA' | 'EU';
  channel: 'Online' | 'Retail';
  revenue: number;
  units: number;
};

const DATA: Sale[] = [
  { id: 's1', region: 'NA', channel: 'Online', revenue: 1000, units: 20 },
  { id: 's2', region: 'NA', channel: 'Retail', revenue: 700, units: 14 },
  { id: 's3', region: 'EU', channel: 'Online', revenue: 900, units: 17 },
  { id: 's4', region: 'EU', channel: 'Retail', revenue: 800, units: 12 },
];

function pathKey(path: string[]): string {
  return path.length === 0 ? '__root__' : path.join('||');
}

export default function PivotAggregationExample(): JSX.Element {
  const columns: ColumnDef<Sale>[] = [
    { id: 'region', accessorKey: 'region' },
    { id: 'channel', accessorKey: 'channel' },
    { id: 'revenue', accessorKey: 'revenue' },
    { id: 'units', accessorKey: 'units' },
  ];

  const base = usePivotTable<Sale>({
    data: DATA,
    columns,
    plugins: [
      createGroupingPlugin(),
      createPivotPlugin({
        defaultValues: [
          { id: 'revenue', aggregation: 'sum' },
          { id: 'units', aggregation: 'avg' },
        ],
      }),
    ],
    initialState: {
      sorting: [],
      filters: [],
      columnVisibility: {},
      rowSelection: {},
      expanded: {},
      rowGrouping: ['region'],
      columnGrouping: ['channel'],
      expandedGroups: {},
      pivotEnabled: true,
      pivotValues: [
        { id: 'revenue', aggregation: 'sum' },
        { id: 'units', aggregation: 'avg' },
      ],
    } as any,
  });

  const table = withPivot(withGrouping(base));
  const result = table.pivot.getPivotResult();

  if (!result) {
    return <div>Pivot disabled</div>;
  }

  const values = table.pivot.getPivotValues();

  return (
    <table>
      <thead>
        <tr>
          <th>Row</th>
          {result.columnHeaders.flatMap((column) =>
            values.map((value) => (
              <th key={`${column.key}-${value.id}`}>{`${column.path.join(' / ') || 'Total'} ${value.id}`}</th>
            )),
          )}
        </tr>
      </thead>
      <tbody>
        {result.rowHeaders.map((path) => {
          const rowKey = pathKey(path);
          return (
            <tr key={rowKey}>
              <td>{path.join(' / ') || 'Total'}</td>
              {result.columnHeaders.flatMap((column) =>
                values.map((value) => (
                  <td key={`${rowKey}-${column.key}-${value.id}`}>
                    {String(result.matrixByRowKey[rowKey]?.[column.key]?.[value.id] ?? '-')}
                  </td>
                )),
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

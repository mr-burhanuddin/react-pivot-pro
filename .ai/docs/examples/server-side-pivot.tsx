import React, { useEffect, useState } from 'react';
import { usePivotTable, type ColumnDef } from '../../src';
import { createGroupingPlugin, withGrouping } from '../../src/plugins/grouping';
import { createPivotPlugin, withPivot } from '../../src/plugins/pivot';
import type { PivotEngineRequest, PivotEngineResult, PivotServerAdapter } from '../../src/core/pivotEngine';

type Sale = {
  id: string;
  region: 'NA' | 'EU';
  channel: 'Online' | 'Retail';
  revenue: number;
};

const DATA: Sale[] = [
  { id: 's1', region: 'NA', channel: 'Online', revenue: 1000 },
  { id: 's2', region: 'NA', channel: 'Retail', revenue: 700 },
  { id: 's3', region: 'EU', channel: 'Online', revenue: 900 },
  { id: 's4', region: 'EU', channel: 'Retail', revenue: 800 },
];

function key(path: string[]): string {
  return path.length ? path.join('||') : '__root__';
}

const serverAdapter: PivotServerAdapter<Sale> = {
  async execute(request: PivotEngineRequest<Sale>): Promise<PivotEngineResult<Sale>> {
    const rowDim = request.rowGroupBy.map((value) => value.id);
    const colDim = request.columnGroupBy.map((value) => value.id);

    const rowHeaders = Array.from(
      new Set(DATA.map((row) => rowDim.map((id) => String((row as Record<string, unknown>)[id])).join('||'))),
    ).map((value) => value.split('||'));

    const columnHeaderPaths = Array.from(
      new Set(DATA.map((row) => colDim.map((id) => String((row as Record<string, unknown>)[id])).join('||'))),
    ).map((value) => value.split('||'));

    const columnHeaders = columnHeaderPaths.map((path) => ({ key: key(path), path }));

    const matrixByRowKey: Record<string, Record<string, Record<string, unknown>>> = {};
    const matrix: PivotEngineResult<Sale>['matrix'] = [];

    for (const rowPath of rowHeaders) {
      const rowKey = key(rowPath);
      matrixByRowKey[rowKey] = {};

      const rowSubset = DATA.filter((row) =>
        rowDim.every((id, index) => String((row as Record<string, unknown>)[id]) === rowPath[index]),
      );

      for (const columnPath of columnHeaderPaths) {
        const columnKey = key(columnPath);
        const subset = rowSubset.filter((row) =>
          colDim.every((id, index) => String((row as Record<string, unknown>)[id]) === columnPath[index]),
        );

        const revenue = subset.reduce((total, row) => total + row.revenue, 0);
        matrixByRowKey[rowKey][columnKey] = { revenue };
        matrix.push({ rowKey, columnKey, values: { revenue } });
      }
    }

    return {
      rowTree: [],
      rowHeaders,
      columnHeaders,
      matrix,
      matrixByRowKey,
      grandTotals: {
        revenue: DATA.reduce((total, row) => total + row.revenue, 0),
      },
    };
  },
};

export default function ServerSidePivotExample(): JSX.Element {
  const [result, setResult] = useState<PivotEngineResult<Sale> | null>(null);

  const columns: ColumnDef<Sale>[] = [
    { id: 'region', accessorKey: 'region' },
    { id: 'channel', accessorKey: 'channel' },
    { id: 'revenue', accessorKey: 'revenue' },
  ];

  const base = usePivotTable<Sale>({
    data: DATA,
    columns,
    plugins: [
      createGroupingPlugin(),
      createPivotPlugin({
        clientSide: false,
        serverAdapter,
        defaultValues: [{ id: 'revenue', aggregation: 'sum' }],
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
      pivotValues: [{ id: 'revenue', aggregation: 'sum' }],
    } as any,
  });

  const table = withPivot(withGrouping(base));

  useEffect(() => {
    void table.pivot.runServerSidePivot().then(setResult);
  }, [table]);

  return <pre>{JSON.stringify(result, null, 2)}</pre>;
}

import type { RowData } from '../types';
import {
  resolveAggregationFn,
  type AggregationFn,
  type AggregationInput,
} from '../utils/aggregationFns';

export interface PivotGroupByDef<TData extends RowData = RowData> {
  id: string;
  accessor?: keyof TData | ((row: TData) => unknown);
}

export interface PivotValueDef<TData extends RowData = RowData> {
  id: string;
  accessor?: keyof TData | ((row: TData) => unknown);
  aggregation?: AggregationInput<TData>;
}

export interface PivotNode<TData extends RowData = RowData> {
  id: string;
  depth: number;
  path: string[];
  value: unknown;
  rowCount: number;
  rows: TData[];
  children: PivotNode<TData>[];
}

export interface PivotColumnHeader {
  key: string;
  path: string[];
}

export interface PivotCell {
  rowKey: string;
  columnKey: string;
  values: Record<string, unknown>;
}

export interface PivotEngineResult<TData extends RowData = RowData> {
  rowTree: PivotNode<TData>[];
  rowHeaders: string[][];
  columnHeaders: PivotColumnHeader[];
  matrix: PivotCell[];
  matrixByRowKey: Record<string, Record<string, Record<string, unknown>>>;
  grandTotals: Record<string, unknown>;
}

export interface PivotEngineRequest<TData extends RowData = RowData> {
  rowGroupBy: PivotGroupByDef<TData>[];
  columnGroupBy: PivotGroupByDef<TData>[];
  values: PivotValueDef<TData>[];
}

export interface PivotServerAdapter<TData extends RowData = RowData> {
  execute: (request: PivotEngineRequest<TData>) => Promise<PivotEngineResult<TData>>;
}

export interface PivotEngineOptions<TData extends RowData = RowData> {
  data: TData[];
  rowGroupBy: PivotGroupByDef<TData>[];
  columnGroupBy: PivotGroupByDef<TData>[];
  values: PivotValueDef<TData>[];
  aggregationFns?: Record<string, AggregationFn<TData>>;
}

type Accessor<TData extends RowData> = (row: TData) => unknown;

function toAccessor<TData extends RowData>(
  id: string,
  accessor?: keyof TData | ((row: TData) => unknown),
): Accessor<TData> {
  if (typeof accessor === 'function') {
    return accessor;
  }

  const key = accessor ?? (id as keyof TData);
  return (row: TData) => row[key];
}

function toPathValue(value: unknown): string {
  return value == null ? '__null__' : String(value);
}

function makePathKey(path: string[]): string {
  return path.length === 0 ? '__root__' : path.join('||');
}

function createGroups<TData extends RowData>(
  rows: TData[],
  groupDefs: PivotGroupByDef<TData>[],
  depth = 0,
  currentPath: string[] = [],
): PivotNode<TData>[] {
  if (depth >= groupDefs.length) {
    return [];
  }

  const groupDef = groupDefs[depth];
  const getValue = toAccessor(groupDef.id, groupDef.accessor);
  const grouped = new Map<string, { value: unknown; rows: TData[] }>();

  for (const row of rows) {
    const value = getValue(row);
    const key = toPathValue(value);
    const existing = grouped.get(key);
    if (existing) {
      existing.rows.push(row);
    } else {
      grouped.set(key, { value, rows: [row] });
    }
  }

  return Array.from(grouped.entries()).map(([key, group]) => {
    const nextPath = [...currentPath, key];
    const children = createGroups(group.rows, groupDefs, depth + 1, nextPath);
    return {
      id: `${depth}:${nextPath.join('|')}`,
      depth,
      path: nextPath,
      value: group.value,
      rowCount: group.rows.length,
      rows: group.rows,
      children,
    };
  });
}

function aggregateRows<TData extends RowData>(
  rows: TData[],
  values: PivotValueDef<TData>[],
  customAggregationFns?: Record<string, AggregationFn<TData>>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const valueDef of values) {
    const accessor = toAccessor(valueDef.id, valueDef.accessor);
    const valueBucket = rows.map((row) => accessor(row));
    const aggregationFn = resolveAggregationFn(valueDef.aggregation, customAggregationFns);
    result[valueDef.id] = aggregationFn(valueBucket, rows);
  }

  return result;
}

export function createPivotEngineResult<TData extends RowData>(
  options: PivotEngineOptions<TData>,
): PivotEngineResult<TData> {
  const rowAccessors = options.rowGroupBy.map((groupDef) =>
    toAccessor(groupDef.id, groupDef.accessor),
  );
  const columnAccessors = options.columnGroupBy.map((groupDef) =>
    toAccessor(groupDef.id, groupDef.accessor),
  );

  const rowHeadersMap = new Map<string, string[]>();
  const columnHeadersMap = new Map<string, string[]>();
  const bucketMap = new Map<string, Map<string, TData[]>>();

  if (options.rowGroupBy.length === 0) {
    rowHeadersMap.set('__root__', []);
  }

  if (options.columnGroupBy.length === 0) {
    columnHeadersMap.set('__root__', []);
  }

  for (const row of options.data) {
    const rowPath = rowAccessors.map((accessor) => toPathValue(accessor(row)));
    const rowKey = makePathKey(rowPath);
    if (!rowHeadersMap.has(rowKey)) {
      rowHeadersMap.set(rowKey, rowPath);
    }

    const columnPath = columnAccessors.map((accessor) => toPathValue(accessor(row)));
    const columnKey = makePathKey(columnPath);
    if (!columnHeadersMap.has(columnKey)) {
      columnHeadersMap.set(columnKey, columnPath);
    }

    const rowBucketMap = bucketMap.get(rowKey) ?? new Map<string, TData[]>();
    const cellBucket = rowBucketMap.get(columnKey) ?? [];
    cellBucket.push(row);
    rowBucketMap.set(columnKey, cellBucket);
    bucketMap.set(rowKey, rowBucketMap);
  }

  const rowHeaders = Array.from(rowHeadersMap.values());
  const columnHeaderPaths = Array.from(columnHeadersMap.values());
  const rowTree = createGroups(options.data, options.rowGroupBy);

  const columnHeaders = columnHeaderPaths.map((path) => ({
    key: makePathKey(path),
    path,
  }));

  const matrix: PivotCell[] = [];
  const matrixByRowKey: Record<string, Record<string, Record<string, unknown>>> = {};

  for (const rowPath of rowHeaders) {
    const rowKey = makePathKey(rowPath);
    matrixByRowKey[rowKey] = {};

    for (const columnPath of columnHeaderPaths.length > 0 ? columnHeaderPaths : [[]]) {
      const columnKey = makePathKey(columnPath);
      const cellRows = bucketMap.get(rowKey)?.get(columnKey) ?? [];
      const values = aggregateRows(cellRows, options.values, options.aggregationFns);

      matrix.push({
        rowKey,
        columnKey,
        values,
      });

      matrixByRowKey[rowKey][columnKey] = values;
    }
  }

  const grandTotals = aggregateRows(options.data, options.values, options.aggregationFns);

  return {
    rowTree,
    rowHeaders,
    columnHeaders,
    matrix,
    matrixByRowKey,
    grandTotals,
  };
}

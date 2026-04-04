import type { PivotTableInstance, PivotTablePlugin, Row, RowData, TableState } from '../types';

export interface GroupingTableState extends TableState {
  rowGrouping: string[];
  columnGrouping: string[];
  expandedGroups: Record<string, boolean>;
}

export interface GroupingApi<
  TData extends RowData,
  TState extends GroupingTableState = GroupingTableState,
> {
  getRowGrouping: () => string[];
  getColumnGrouping: () => string[];
  setRowGrouping: (updater: string[] | ((previous: string[]) => string[])) => void;
  setColumnGrouping: (updater: string[] | ((previous: string[]) => string[])) => void;
  toggleGroupExpanded: (groupId: string, value?: boolean) => void;
  getIsGroupExpanded: (groupId: string) => boolean;
  resetGrouping: () => void;
}

export type PivotTableWithGrouping<
  TData extends RowData,
  TState extends GroupingTableState = GroupingTableState,
> = PivotTableInstance<TData, TState> & {
  grouping: GroupingApi<TData, TState>;
};

interface GroupBuildNode<TData extends RowData> {
  id: string;
  depth: number;
  key: string;
  value: unknown;
  leafRows: Row<TData>[];
  children: GroupBuildNode<TData>[];
}

function areArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

function areExpandedMapsEqual(
  left: Record<string, boolean>,
  right: Record<string, boolean>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  for (const key of leftKeys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }

  return true;
}

function buildGroupedTree<TData extends RowData>(
  rows: Row<TData>[],
  grouping: string[],
  depth = 0,
  parentPath = '',
): GroupBuildNode<TData>[] {
  if (depth >= grouping.length) {
    return [];
  }

  const columnId = grouping[depth];
  const grouped = new Map<string, { value: unknown; rows: Row<TData>[] }>();

  for (const row of rows) {
    const value = row.getValue(columnId);
    const key = value == null ? '__null__' : String(value);
    const existing = grouped.get(key);
    if (existing) {
      existing.rows.push(row);
    } else {
      grouped.set(key, { value, rows: [row] });
    }
  }

  return Array.from(grouped.entries()).map(([groupKey, bucket]) => {
    const path = parentPath ? `${parentPath}|${columnId}:${groupKey}` : `${columnId}:${groupKey}`;
    return {
      id: `group::${path}`,
      depth,
      key: groupKey,
      value: bucket.value,
      leafRows: bucket.rows,
      children: buildGroupedTree(bucket.rows, grouping, depth + 1, path),
    };
  });
}

function flattenGroupedRows<TData extends RowData>(
  nodes: GroupBuildNode<TData>[],
  grouping: string[],
  expandedGroups: Record<string, boolean>,
): Row<TData>[] {
  const output: Row<TData>[] = [];

  const walk = (inputNodes: GroupBuildNode<TData>[]) => {
    for (const node of inputNodes) {
      const groupingColumn = grouping[node.depth];
      const groupValues: Record<string, unknown> = {
        ...node.leafRows[0]?.values,
        __group: true,
        __depth: node.depth,
        __groupingColumnId: groupingColumn,
        __groupingValue: node.value,
        __rowCount: node.leafRows.length,
      };
      const groupRow: Row<TData> = {
        id: node.id,
        index: -1,
        original: {} as TData,
        values: groupValues,
        getValue: <TValue = unknown>(columnId: string) => groupValues[columnId] as TValue,
      };

      output.push(groupRow);

      const isExpanded = expandedGroups[node.id] !== false;
      if (!isExpanded) {
        continue;
      }

      if (node.children.length > 0) {
        walk(node.children);
      } else {
        output.push(...node.leafRows);
      }
    }
  };

  walk(nodes);
  return output;
}

export function createGroupingPlugin<
  TData extends RowData,
  TState extends GroupingTableState = GroupingTableState,
>(): PivotTablePlugin<TData, TState> {
  let lastRowsRef: Row<TData>[] | null = null;
  let lastGroupingRef: string[] = [];
  let lastExpandedRef: Record<string, boolean> = {};
  let lastResultRef: Row<TData>[] | null = null;

  return {
    name: 'grouping',
    getInitialState: (state) => ({
      ...state,
      rowGrouping: state.rowGrouping ?? [],
      columnGrouping: state.columnGrouping ?? [],
      expandedGroups: state.expandedGroups ?? {},
    }),
    transformRows: (rows, context) => {
      const rowGrouping = context.state.rowGrouping ?? [];
      const expandedGroups = context.state.expandedGroups ?? {};

      if (
        lastRowsRef === rows &&
        lastResultRef &&
        areArraysEqual(rowGrouping, lastGroupingRef) &&
        areExpandedMapsEqual(expandedGroups, lastExpandedRef)
      ) {
        return lastResultRef;
      }

      if (rowGrouping.length === 0) {
        lastRowsRef = rows;
        lastGroupingRef = rowGrouping.slice();
        lastExpandedRef = { ...expandedGroups };
        lastResultRef = rows;
        return rows;
      }

      const validColumnIds = new Set(context.columns.map((column) => column.id));
      const normalizedGrouping = rowGrouping.filter((columnId) => validColumnIds.has(columnId));

      if (normalizedGrouping.length === 0) {
        lastRowsRef = rows;
        lastGroupingRef = [];
        lastExpandedRef = { ...expandedGroups };
        lastResultRef = rows;
        return rows;
      }

      const tree = buildGroupedTree(rows, normalizedGrouping);
      const groupedRows = flattenGroupedRows(tree, normalizedGrouping, expandedGroups);

      lastRowsRef = rows;
      lastGroupingRef = normalizedGrouping.slice();
      lastExpandedRef = { ...expandedGroups };
      lastResultRef = groupedRows;
      return groupedRows;
    },
    onStateChange: (state, previousState, context) => {
      if (
        areArraysEqual(state.rowGrouping ?? [], previousState.rowGrouping ?? []) &&
        areArraysEqual(state.columnGrouping ?? [], previousState.columnGrouping ?? [])
      ) {
        return;
      }

      const validColumnIds = new Set(context.columns.map((column) => column.id));
      const rowGrouping = (state.rowGrouping ?? []).filter((columnId) =>
        validColumnIds.has(columnId),
      );
      const columnGrouping = (state.columnGrouping ?? []).filter((columnId) =>
        validColumnIds.has(columnId),
      );

      if (
        !areArraysEqual(rowGrouping, state.rowGrouping ?? []) ||
        !areArraysEqual(columnGrouping, state.columnGrouping ?? [])
      ) {
        context.setState((previous) => ({
          ...previous,
          rowGrouping,
          columnGrouping,
        }));
      }
    },
  };
}

export function createGroupingApi<
  TData extends RowData,
  TState extends GroupingTableState = GroupingTableState,
>(table: PivotTableInstance<TData, TState>): GroupingApi<TData, TState> {
  return {
    getRowGrouping: () => table.getState().rowGrouping ?? [],
    getColumnGrouping: () => table.getState().columnGrouping ?? [],
    setRowGrouping: (updater) => {
      table.setState((previous) => {
        const current = previous.rowGrouping ?? [];
        const next = typeof updater === 'function' ? updater(current) : updater;
        return { ...previous, rowGrouping: next };
      });
    },
    setColumnGrouping: (updater) => {
      table.setState((previous) => {
        const current = previous.columnGrouping ?? [];
        const next = typeof updater === 'function' ? updater(current) : updater;
        return { ...previous, columnGrouping: next };
      });
    },
    toggleGroupExpanded: (groupId, value) => {
      table.setState((previous) => {
        const current = previous.expandedGroups?.[groupId] !== false;
        const next = value ?? !current;
        return {
          ...previous,
          expandedGroups: {
            ...(previous.expandedGroups ?? {}),
            [groupId]: next,
          },
        };
      });
    },
    getIsGroupExpanded: (groupId) => table.getState().expandedGroups?.[groupId] !== false,
    resetGrouping: () => {
      table.setState((previous) => ({
        ...previous,
        rowGrouping: [],
        columnGrouping: [],
        expandedGroups: {},
      }));
    },
  };
}

export function withGrouping<
  TData extends RowData,
  TState extends GroupingTableState = GroupingTableState,
>(table: PivotTableInstance<TData, TState>): PivotTableWithGrouping<TData, TState> {
  return Object.assign(table, {
    grouping: createGroupingApi(table),
  });
}

export const useGrouping = createGroupingPlugin;

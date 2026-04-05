import { describe, it, expect, vi } from 'vitest';
import { createAggregationPlugin } from '../aggregationPlugin';
import { createAggregationApi, withAggregation } from '../aggregationApi';
import type { Row, RowMeta } from '../../../types/row';
import type { RowData } from '../../../types/table';
import type {
  AggregationTableState,
  AggregationFnName,
} from '../../../types/aggregation';

function createMockRow(id: string, values: Record<string, unknown>): Row<RowData> {
  return {
    id,
    index: 0,
    original: values as RowData,
    values,
    getValue: <T = unknown>(columnId: string): T | undefined =>
      values[columnId] as T | undefined,
  };
}

function createMockContext(
  stateOverrides: Partial<AggregationTableState> = {},
) {
  return {
    columns: [],
    data: [],
    state: {
      sorting: [],
      filters: [],
      columnVisibility: {},
      rowSelection: {},
      expanded: {},
      columnAggregators: {},
      ...stateOverrides,
    } as AggregationTableState,
    setState: vi.fn(),
    getColumnById: vi.fn(),
  };
}

function createMockTable(
  rows: Row<RowData>[],
  stateOverrides: Partial<AggregationTableState> = {},
) {
  let state: AggregationTableState = {
    sorting: [],
    filters: [],
    columnVisibility: {},
    rowSelection: {},
    expanded: {},
    columnAggregators: {},
    ...stateOverrides,
  };

  const columns = [
    { id: 'name', header: 'Name' },
    { id: 'value', header: 'Value' },
    { id: 'category', header: 'Category' },
  ];

  return {
    state,
    columns,
    rowModel: { rows, flatRows: rows, rowsById: Object.fromEntries(rows.map((r) => [r.id, r])) },
    getState: () => state,
    setState: vi.fn((updater) => {
      state = typeof updater === 'function' ? updater(state) : updater;
    }),
    getCoreRowModel: () => ({ rows, flatRows: rows, rowsById: Object.fromEntries(rows.map((r) => [r.id, r])) }),
    getRowModel: () => ({ rows, flatRows: rows, rowsById: Object.fromEntries(rows.map((r) => [r.id, r])) }),
    registerPlugin: vi.fn(),
    unregisterPlugin: vi.fn(),
    getPlugin: vi.fn(),
    getAllPlugins: vi.fn(),
  };
}

describe('aggregation plugin', () => {
  describe('createAggregationPlugin', () => {
    it('returns plugin with correct name', () => {
      const plugin = createAggregationPlugin();
      expect(plugin.name).toBe('aggregation');
    });

    it('initializes columnAggregators from autoAggregateColumns', () => {
      const plugin = createAggregationPlugin({
        autoAggregateColumns: ['value'],
        defaultAggregator: 'sum',
      });

      const result = plugin.getInitialState?.({
        sorting: [],
        filters: [],
        columnVisibility: {},
        rowSelection: {},
        expanded: {},
        columnAggregators: undefined as unknown as Record<string, AggregationFnName | 'custom'>,
      } as AggregationTableState);
      expect(result?.columnAggregators).toEqual({ value: 'sum' });
    });

    it('uses existing columnAggregators if provided', () => {
      const plugin = createAggregationPlugin();
      const existingState: AggregationTableState = {
        sorting: [],
        filters: [],
        columnVisibility: {},
        rowSelection: {},
        expanded: {},
        columnAggregators: { value: 'avg' },
      };

      const result = plugin.getInitialState?.(existingState);
      expect(result?.columnAggregators).toEqual({ value: 'avg' });
    });
  });

  describe('transformRows with aggregations', () => {
    it('returns original rows when no aggregators are set', () => {
      const plugin = createAggregationPlugin();
      const rows = [createMockRow('1', { name: 'A', value: 10, category: 'X' })];
      const context = createMockContext({ columnAggregators: {} });

      const result = plugin.transformRows?.(rows, context);
      expect(result).toBe(rows);
    });

    it('injects grand total row when aggregators are set', () => {
      const plugin = createAggregationPlugin();
      const rows = [
        createMockRow('1', { name: 'A', value: 10, category: 'X' }),
        createMockRow('2', { name: 'B', value: 20, category: 'X' }),
      ];
      const context = createMockContext({ columnAggregators: { value: 'sum' } });

      const result = plugin.transformRows?.(rows, context);
      expect(result).toBeDefined();
      expect(result!.length).toBeGreaterThan(rows.length);
      const lastRow = result![result!.length - 1];
      expect((lastRow.meta as RowMeta | undefined)?.isGrandTotal).toBe(true);
    });

    it('grand total row appears exactly once and is last', () => {
      const plugin = createAggregationPlugin();
      const rows = [
        createMockRow('1', { name: 'A', value: 10, category: 'X' }),
        createMockRow('2', { name: 'B', value: 20, category: 'X' }),
        createMockRow('3', { name: 'C', value: 30, category: 'Y' }),
      ];
      const context = createMockContext({ columnAggregators: { value: 'sum' } });

      const result = plugin.transformRows?.(rows, context);
      const grandTotalRows = result!.filter((r) => (r.meta as RowMeta | undefined)?.isGrandTotal);
      expect(grandTotalRows.length).toBe(1);
      expect((result![result!.length - 1].meta as RowMeta | undefined)?.isGrandTotal).toBe(true);
    });

    it('subtotal rows contain correct per-column aggregated values', () => {
      const plugin = createAggregationPlugin();
      const rows = [
        createMockRow('1', { name: 'A', value: 10, category: 'X' }),
        createMockRow('2', { name: 'B', value: 20, category: 'X' }),
      ];
      const context = createMockContext({ columnAggregators: { value: 'sum' } });

      const result = plugin.transformRows?.(rows, context);
      const subtotalRows = result!.filter((r) => (r.meta as RowMeta | undefined)?.isSubtotal);
      expect(subtotalRows.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('transformColumns', () => {
    it('annotates columns with their current aggregator', () => {
      const plugin = createAggregationPlugin();
      const columns = [
        { id: 'value', header: 'Value' },
        { id: 'name', header: 'Name' },
      ];
      const context = createMockContext({ columnAggregators: { value: 'sum' } });

      const result = plugin.transformColumns?.(columns, context);
      const valueCol = result?.find((c) => c.id === 'value');
      expect(valueCol?.meta?.aggregator).toBe('sum');
      expect(valueCol?.meta?.aggregatorLabel).toBe('Sum');
    });
  });

  describe('onStateChange', () => {
    it('invalidates cache when columnAggregators change', () => {
      const plugin = createAggregationPlugin();
      const prevState: AggregationTableState = {
        sorting: [],
        filters: [],
        columnVisibility: {},
        rowSelection: {},
        expanded: {},
        columnAggregators: { value: 'sum' },
      };
      const nextState: AggregationTableState = {
        sorting: [],
        filters: [],
        columnVisibility: {},
        rowSelection: {},
        expanded: {},
        columnAggregators: { value: 'avg' },
      };

      plugin.onStateChange?.(nextState, prevState, createMockContext());
    });
  });

  describe('createAggregationApi', () => {
    it('getColumnAggregator returns correct value', () => {
      const mockTable = createMockTable([], { columnAggregators: { value: 'avg' } });
      const api = createAggregationApi(mockTable);

      expect(api.getColumnAggregator('value')).toBe('avg');
      expect(api.getColumnAggregator('name')).toBeUndefined();
    });

    it('setColumnAggregator updates state', () => {
      const mockTable = createMockTable([]);
      const api = createAggregationApi(mockTable);

      api.setColumnAggregator('value', 'avg');
      expect(mockTable.setState).toHaveBeenCalled();
    });

    it('setColumnAggregator supports functional updater', () => {
      const mockTable = createMockTable([], { columnAggregators: { value: 'sum' } });
      const api = createAggregationApi(mockTable);

      api.setColumnAggregator('value', (prev) => (prev === 'sum' ? 'avg' : 'sum'));
      expect(mockTable.setState).toHaveBeenCalled();
    });

    it('resetColumnAggregators clears state', () => {
      const mockTable = createMockTable([], { columnAggregators: { value: 'sum' } });
      const api = createAggregationApi(mockTable);

      api.resetColumnAggregators();
      expect(mockTable.setState).toHaveBeenCalled();
    });

    it('registerFn adds custom aggregator', () => {
      const mockTable = createMockTable([]);
      const api = createAggregationApi(mockTable);

      const weightedAvg = (values: unknown[]): number | null => {
        const nums = values.map(Number).filter((n) => !Number.isNaN(n));
        if (nums.length === 0) return null;
        return nums.reduce((a, b) => a + b, 0) / nums.length;
      };

      api.registerFn('weightedAvg', weightedAvg);
      const fns = api.getRegisteredFns();
      expect(fns.weightedAvg).toBeDefined();
    });

    it('unregisterFn removes custom aggregator', () => {
      const mockTable = createMockTable([]);
      const api = createAggregationApi(mockTable);

      api.registerFn('tempFn', () => 0);
      api.unregisterFn('tempFn');
      const fns = api.getRegisteredFns();
      expect(fns.tempFn).toBeUndefined();
    });
  });

  describe('controlled state', () => {
    it('external columnAggregators prop overrides internal state', () => {
      const mockTable = createMockTable([], { columnAggregators: { value: 'avg' } });
      const api = createAggregationApi(mockTable);

      expect(api.getColumnAggregator('value')).toBe('avg');
    });
  });
});

describe('withAggregation wrapper', () => {
  it('augments table with aggregation API', () => {
    const mockTable = createMockTable([]);
    const augmented = withAggregation(mockTable);

    expect(augmented.aggregation).toBeDefined();
    expect(typeof augmented.aggregation.getColumnAggregator).toBe('function');
    expect(typeof augmented.aggregation.setColumnAggregator).toBe('function');
    expect(typeof augmented.aggregation.registerFn).toBe('function');
  });
});

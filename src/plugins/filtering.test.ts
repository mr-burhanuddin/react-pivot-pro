import { describe, it, expect, vi } from 'vitest';
import {
  createFilteringPlugin,
  createFilteringApi,
  withFiltering,
} from './filtering';
import type { FilteringTableState } from './filtering';
import type { Row, RowData } from '../types';
import type { Updater } from '../types/state';
import type { PivotTablePluginContext } from '../types/plugin';

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

function createMockTable(
  rows: Row<RowData>[],
  stateOverrides: Partial<FilteringTableState> = {},
) {
  let state: FilteringTableState = {
    sorting: [],
    filters: [],
    columnVisibility: {},
    rowSelection: {},
    expanded: {},
    ...stateOverrides,
  };

  const columns = [
    { id: 'name', header: 'Name', enableFiltering: true },
    { id: 'age', header: 'Age', enableFiltering: true },
    { id: 'date', header: 'Date', enableFiltering: true },
    { id: 'category', header: 'Category', enableFiltering: true },
    { id: 'hidden', header: 'Hidden', enableFiltering: false },
  ];

  return {
    state,
    columns,
    rowModel: { rows, flatRows: rows, rowsById: Object.fromEntries(rows.map((r) => [r.id, r])) },
    getState: () => state,
    setState: vi.fn((updater: Updater<FilteringTableState>) => {
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

function createMockContext(
  rows: Row<RowData>[],
  stateOverrides: Partial<FilteringTableState> = {},
): PivotTablePluginContext<RowData, FilteringTableState> {
  const table = createMockTable(rows, stateOverrides);
  return {
    columns: table.columns as PivotTablePluginContext<RowData, FilteringTableState>['columns'],
    data: rows as unknown as PivotTablePluginContext<RowData, FilteringTableState>['data'],
    state: table.state,
    setState: table.setState as PivotTablePluginContext<RowData, FilteringTableState>['setState'],
    getColumnById: vi.fn((id: string) => table.columns.find((c) => (c as { id: string }).id === id)),
  } as PivotTablePluginContext<RowData, FilteringTableState>;
}

describe('filtering plugin', () => {
  describe('createFilteringPlugin', () => {
    it('returns plugin with correct name', () => {
      const plugin = createFilteringPlugin();
      expect(plugin.name).toBe('filtering');
    });

    it('initializes with empty filters', () => {
      const plugin = createFilteringPlugin();
      const result = plugin.getInitialState?.({
        sorting: [],
        filters: undefined,
        columnVisibility: {},
        rowSelection: {},
        expanded: {},
      } as unknown as FilteringTableState);
      expect(result?.filters).toEqual([]);
    });

    it('preserves existing filters in state', () => {
      const existingFilters = [
        { id: 'name', type: 'text' as const, value: { operator: 'contains' as const, value: 'test' } },
      ];
      const plugin = createFilteringPlugin();
      const result = plugin.getInitialState?.({
        sorting: [],
        filters: existingFilters,
        columnVisibility: {},
        rowSelection: {},
        expanded: {},
      } as unknown as FilteringTableState);
      expect(result?.filters).toEqual(existingFilters);
    });

    it('transforms rows with text filter', () => {
      const plugin = createFilteringPlugin();
      const rows = [
        createMockRow('1', { name: 'Apple' }),
        createMockRow('2', { name: 'Banana' }),
        createMockRow('3', { name: 'Apple Pie' }),
        createMockRow('4', { name: 'Cherry' }),
      ];

      const context = createMockContext(rows, {
        filters: [{ id: 'name', type: 'text' as const, value: { operator: 'contains' as const, value: 'Apple' } }],
      });

      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(2);
      expect(result?.map((r) => r.id)).toEqual(['1', '3']);
    });

    it('transforms rows with number filter - gt', () => {
      const plugin = createFilteringPlugin();
      const rows = [
        createMockRow('1', { age: 25 }),
        createMockRow('2', { age: 30 }),
        createMockRow('3', { age: 35 }),
        createMockRow('4', { age: 40 }),
      ];

      const context = createMockContext(rows, {
        filters: [{ id: 'age', type: 'number' as const, value: { operator: 'gt' as const, value: 30 } }],
      });

      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(2);
      expect(result?.map((r) => r.id)).toEqual(['3', '4']);
    });

    it('transforms rows with number filter - between', () => {
      const plugin = createFilteringPlugin();
      const rows = [
        createMockRow('1', { age: 25 }),
        createMockRow('2', { age: 30 }),
        createMockRow('3', { age: 35 }),
        createMockRow('4', { age: 40 }),
      ];

      const context = createMockContext(rows, {
        filters: [{ id: 'age', type: 'number' as const, value: { operator: 'between' as const, value: 25, value2: 35 } }],
      });

      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(3);
      expect(result?.map((r) => r.id)).toEqual(['1', '2', '3']);
    });

    it('transforms rows with date filter', () => {
      const plugin = createFilteringPlugin();
      const rows = [
        createMockRow('1', { date: '2024-01-01' }),
        createMockRow('2', { date: '2024-06-15' }),
        createMockRow('3', { date: '2024-12-31' }),
      ];

      const context = createMockContext(rows, {
        filters: [{ id: 'date', type: 'date' as const, value: { operator: 'gt' as const, value: '2024-06-01' } }],
      });

      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(2);
      expect(result?.map((r) => r.id)).toEqual(['2', '3']);
    });

    it('transforms rows with enum filter - in', () => {
      const plugin = createFilteringPlugin();
      const rows = [
        createMockRow('1', { category: 'A' }),
        createMockRow('2', { category: 'B' }),
        createMockRow('3', { category: 'A' }),
        createMockRow('4', { category: 'C' }),
      ];

      const context = createMockContext(rows, {
        filters: [{ id: 'category', type: 'enum' as const, value: { operator: 'in' as const, values: ['A', 'B'] } }],
      });

      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(3);
      expect(result?.map((r) => r.id)).toEqual(['1', '2', '3']);
    });

    it('transforms rows with enum filter - notIn', () => {
      const plugin = createFilteringPlugin();
      const rows = [
        createMockRow('1', { category: 'A' }),
        createMockRow('2', { category: 'B' }),
        createMockRow('3', { category: 'A' }),
        createMockRow('4', { category: 'C' }),
      ];

      const context = createMockContext(rows, {
        filters: [{ id: 'category', type: 'enum' as const, value: { operator: 'notIn' as const, values: ['A'] } }],
      });

      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(2);
      expect(result?.map((r) => r.id)).toEqual(['2', '4']);
    });

    it('ignores filters for columns with enableFiltering=false', () => {
      const plugin = createFilteringPlugin();
      const rows = [
        createMockRow('1', { hidden: 'test' }),
        createMockRow('2', { hidden: 'test' }),
      ];

      const context = createMockContext(rows, {
        filters: [{ id: 'hidden', type: 'text' as const, value: { operator: 'contains' as const, value: 'test' } }],
      });

      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(2);
    });

    it('handles legacy filter format', () => {
      const plugin = createFilteringPlugin();
      const rows = [
        createMockRow('1', { name: 'Apple' }),
        createMockRow('2', { name: 'Banana' }),
        createMockRow('3', { name: 'ApplePie' }),
      ];

      const context = createMockContext(rows, {
        filters: [{ id: 'name', value: 'Apple' }],
      });

      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(2);
      expect(result?.map((r) => r.id)).toEqual(['1', '3']);
    });

    it('handles null/undefined row values', () => {
      const plugin = createFilteringPlugin();
      const rows = [
        createMockRow('1', { name: 'Apple' }),
        createMockRow('2', { name: null }),
        createMockRow('3', { name: undefined }),
        createMockRow('4', { name: '' }),
      ];

      const context = createMockContext(rows, {
        filters: [{ id: 'name', type: 'text' as const, value: { operator: 'notContains' as const, value: 'test' } }],
      });

      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(4);
    });

    it('handles global filter', () => {
      const plugin = createFilteringPlugin();
      const rows = [
        createMockRow('1', { name: 'Apple', category: 'Fruit' }),
        createMockRow('2', { name: 'Carrot', category: 'Vegetable' }),
        createMockRow('3', { name: 'Banana', category: 'Fruit' }),
      ];

      const context = createMockContext(rows, {
        globalFilter: 'fruit',
      });

      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(2);
      expect(result?.map((r) => r.id)).toEqual(['1', '3']);
    });

    it('combines multiple filters with AND logic', () => {
      const plugin = createFilteringPlugin();
      const rows = [
        createMockRow('1', { name: 'Apple', category: 'Fruit', age: 25 }),
        createMockRow('2', { name: 'Apple', category: 'Vegetable', age: 30 }),
        createMockRow('3', { name: 'Banana', category: 'Fruit', age: 35 }),
        createMockRow('4', { name: 'Apple', category: 'Fruit', age: 40 }),
      ];

      const context = createMockContext(rows, {
        filters: [
          { id: 'name', type: 'text' as const, value: { operator: 'equals' as const, value: 'Apple' } },
          { id: 'category', type: 'enum' as const, value: { operator: 'in' as const, values: ['Fruit'] } },
          { id: 'age', type: 'number' as const, value: { operator: 'gte' as const, value: 30 } },
        ],
      });

      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(1);
      expect(result?.[0].id).toBe('4');
    });

    it('caches filtered results', () => {
      const plugin = createFilteringPlugin();
      const rows = [
        createMockRow('1', { name: 'Apple' }),
        createMockRow('2', { name: 'Banana' }),
      ];

      const context = createMockContext(rows, {
        filters: [{ id: 'name', type: 'text' as const, value: { operator: 'contains' as const, value: 'Apple' } }],
      });

      const result1 = plugin.transformRows?.(rows, context);
      const result2 = plugin.transformRows?.(rows, context);

      expect(result1).toBe(result2);
    });
  });

  describe('createFilteringApi', () => {
    it('sets text filter correctly', () => {
      const table = createMockTable([]);
      const api = createFilteringApi(table as Parameters<typeof createFilteringApi>[0]);

      api.setTextFilter('name', 'contains', 'test');

      expect(table.setState).toHaveBeenCalled();
    });

    it('sets number filter correctly', () => {
      const table = createMockTable([]);
      const api = createFilteringApi(table as Parameters<typeof createFilteringApi>[0]);

      api.setNumberFilter('age', 'between', 18, 65);

      expect(table.setState).toHaveBeenCalled();
    });

    it('sets date filter correctly', () => {
      const table = createMockTable([]);
      const api = createFilteringApi(table as Parameters<typeof createFilteringApi>[0]);

      api.setDateFilter('date', 'between', '2024-01-01', '2024-12-31');

      expect(table.setState).toHaveBeenCalled();
    });

    it('sets enum filter correctly', () => {
      const table = createMockTable([]);
      const api = createFilteringApi(table as Parameters<typeof createFilteringApi>[0]);

      api.setEnumFilter('category', 'in', ['A', 'B']);

      expect(table.setState).toHaveBeenCalled();
    });

    it('replaces existing filter for same column', () => {
      const table = createMockTable([], {
        filters: [{ id: 'name', type: 'text' as const, value: { operator: 'contains' as const, value: 'old' } }],
      });
      const api = createFilteringApi(table as Parameters<typeof createFilteringApi>[0]);

      api.setTextFilter('name', 'equals', 'new');

      expect(table.setState).toHaveBeenCalled();
    });

    it('resets column filters', () => {
      const table = createMockTable([], {
        filters: [
          { id: 'name', type: 'text' as const, value: { operator: 'contains' as const, value: 'test' } },
          { id: 'age', type: 'number' as const, value: { operator: 'gt' as const, value: 18 } },
        ],
      });
      const api = createFilteringApi(table as Parameters<typeof createFilteringApi>[0]);

      api.resetColumnFilters();

      expect(table.setState).toHaveBeenCalled();
    });

    it('gets filtered column ids', () => {
      const table = createMockTable([], {
        filters: [
          { id: 'name', type: 'text' as const, value: { operator: 'contains' as const, value: 'test' } },
          { id: 'age', type: 'number' as const, value: { operator: 'gt' as const, value: 18 } },
        ],
      });
      const api = createFilteringApi(table as Parameters<typeof createFilteringApi>[0]);

      const filteredIds = api.getFilteredColumnIds();

      expect(filteredIds).toEqual(['name', 'age']);
    });

    it('removes individual column filter', () => {
      const table = createMockTable([], {
        filters: [
          { id: 'name', type: 'text' as const, value: { operator: 'contains' as const, value: 'test' } },
          { id: 'age', type: 'number' as const, value: { operator: 'gt' as const, value: 18 } },
        ],
      });
      const api = createFilteringApi(table as Parameters<typeof createFilteringApi>[0]);

      api.setColumnFilter('name', null);

      expect(table.setState).toHaveBeenCalled();
    });
  });

  describe('text filter operators', () => {
    const rows = [
      createMockRow('1', { name: 'Hello World' }),
      createMockRow('2', { name: 'hello world' }),
      createMockRow('3', { name: 'HELLO WORLD' }),
      createMockRow('4', { name: 'World Hello' }),
      createMockRow('5', { name: 'Something Else' }),
    ];

    it('contains - case insensitive', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'name', type: 'text' as const, value: { operator: 'contains' as const, value: 'hello' } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(4);
    });

    it('equals - case insensitive', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'name', type: 'text' as const, value: { operator: 'equals' as const, value: 'hello world' } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(3);
    });

    it('startsWith', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'name', type: 'text' as const, value: { operator: 'startsWith' as const, value: 'Hello' } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(3);
    });

    it('endsWith', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'name', type: 'text' as const, value: { operator: 'endsWith' as const, value: 'World' } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(3);
    });

    it('notContains', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'name', type: 'text' as const, value: { operator: 'notContains' as const, value: 'Hello' } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(1);
    });
  });

  describe('number filter operators', () => {
    const rows = [
      createMockRow('1', { age: 10 }),
      createMockRow('2', { age: 20 }),
      createMockRow('3', { age: 30 }),
      createMockRow('4', { age: 40 }),
      createMockRow('5', { age: 50 }),
    ];

    it('eq', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'age', type: 'number' as const, value: { operator: 'eq' as const, value: 30 } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(1);
      expect(result?.[0].id).toBe('3');
    });

    it('neq', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'age', type: 'number' as const, value: { operator: 'neq' as const, value: 30 } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(4);
    });

    it('gt', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'age', type: 'number' as const, value: { operator: 'gt' as const, value: 30 } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(2);
    });

    it('gte', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'age', type: 'number' as const, value: { operator: 'gte' as const, value: 30 } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(3);
    });

    it('lt', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'age', type: 'number' as const, value: { operator: 'lt' as const, value: 30 } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(2);
    });

    it('lte', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'age', type: 'number' as const, value: { operator: 'lte' as const, value: 30 } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(3);
    });

    it('between with value2', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'age', type: 'number' as const, value: { operator: 'between' as const, value: 20, value2: 40 } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(3);
    });

    it('between without value2 defaults to value', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'age', type: 'number' as const, value: { operator: 'between' as const, value: 30 } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(1);
    });

    it('handles string numbers', () => {
      const plugin = createFilteringPlugin();
      const rowsWithStrings = [
        createMockRow('1', { age: '25' }),
        createMockRow('2', { age: '30' }),
        createMockRow('3', { age: 'invalid' }),
      ];
      const context = createMockContext(rowsWithStrings, {
        filters: [{ id: 'age', type: 'number' as const, value: { operator: 'eq' as const, value: 25 } }],
      });
      const result = plugin.transformRows?.(rowsWithStrings, context);
      expect(result).toHaveLength(1);
    });
  });

  describe('date filter operators', () => {
    const rows = [
      createMockRow('1', { date: '2024-01-01' }),
      createMockRow('2', { date: '2024-06-15' }),
      createMockRow('3', { date: '2024-12-31' }),
      createMockRow('4', { date: null }),
      createMockRow('5', { date: '' }),
    ];

    it('eq', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'date', type: 'date' as const, value: { operator: 'eq' as const, value: '2024-06-15' } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(1);
    });

    it('neq', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'date', type: 'date' as const, value: { operator: 'neq' as const, value: '2024-06-15' } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(2);
    });

    it('gt', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'date', type: 'date' as const, value: { operator: 'gt' as const, value: '2024-06-15' } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(1);
    });

    it('lt', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'date', type: 'date' as const, value: { operator: 'lt' as const, value: '2024-06-15' } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(1);
    });

    it('between', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'date', type: 'date' as const, value: { operator: 'between' as const, value: '2024-01-01', value2: '2024-12-31' } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(3);
    });

    it('isEmpty', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'date', type: 'date' as const, value: { operator: 'isEmpty' as const } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(2);
    });

    it('isNotEmpty', () => {
      const plugin = createFilteringPlugin();
      const context = createMockContext(rows, {
        filters: [{ id: 'date', type: 'date' as const, value: { operator: 'isNotEmpty' as const } }],
      });
      const result = plugin.transformRows?.(rows, context);
      expect(result).toHaveLength(3);
    });
  });

  describe('withFiltering', () => {
    it('extends table with filtering API', () => {
      const table = createMockTable([]);
      const extended = withFiltering(table as Parameters<typeof withFiltering>[0]);

      expect(extended.filtering).toBeDefined();
      expect(typeof extended.filtering.setTextFilter).toBe('function');
      expect(typeof extended.filtering.setNumberFilter).toBe('function');
      expect(typeof extended.filtering.setDateFilter).toBe('function');
      expect(typeof extended.filtering.setEnumFilter).toBe('function');
      expect(typeof extended.filtering.getColumnFilters).toBe('function');
      expect(typeof extended.filtering.resetColumnFilters).toBe('function');
    });
  });
});

import DocPage from "../components/DocPage";

export default function ContributingPluginAuthoring() {
  return (
    <DocPage
      title="Plugin Authoring Guide"
      subtitle="Create custom plugins to extend react-pivot-pro with new features"
    >
      <h2>Plugin Architecture</h2>
      <p>
        Plugins are the primary extension mechanism. Each plugin implements the{" "}
        <code>PivotTablePlugin</code> interface and can transform rows, columns,
        state, or react to state changes.
      </p>

      <h2>Minimal Plugin</h2>
      <pre>
        <code>{`import type { PivotTablePlugin, RowData, TableState, Row, Column, PivotTablePluginContext } from 'react-pivot-pro';

export function createHighlightPlugin<TData extends RowData, TState extends TableState>(
  options: { highlightColumnId: string },
): PivotTablePlugin<TData, TState> {
  return {
    name: 'highlight',
    transformRows: (rows, context) => {
      // Mark rows that match a condition
      return rows.map(row => ({
        ...row,
        meta: {
          ...row.meta,
          isHighlighted: row.values[options.highlightColumnId] === 'urgent',
        },
      }));
    },
  };
}`}</code>
      </pre>

      <h2>Plugin with State</h2>
      <pre>
        <code>{`export interface MyPluginState extends TableState {
  myFeature: {
    enabled: boolean;
    threshold: number;
  };
}

export function createMyPlugin<
  TData extends RowData,
  TState extends MyPluginState = MyPluginState,
>(options: { defaultThreshold?: number } = {}): PivotTablePlugin<TData, TState> {
  return {
    name: 'myPlugin',
    getInitialState: (state) => ({
      ...state,
      myFeature: state.myFeature ?? {
        enabled: true,
        threshold: options.defaultThreshold ?? 0,
      },
    }),
    transformRows: (rows, context) => {
      const { enabled, threshold } = context.state.myFeature;
      if (!enabled) return rows;

      return rows.filter(row => {
        const value = Number(row.values['score']);
        return value >= threshold;
      });
    },
  };
}`}</code>
      </pre>

      <h2>Plugin with API</h2>
      <p>Provide a companion API for consumers to interact with your plugin:</p>
      <pre>
        <code>{`export interface MyPluginApi<TData extends RowData, TState extends MyPluginState> {
  isEnabled: () => boolean;
  setEnabled: (enabled: boolean) => void;
  getThreshold: () => number;
  setThreshold: (threshold: number) => void;
}

export function createMyPluginApi<
  TData extends RowData,
  TState extends MyPluginState,
>(table: import('react-pivot-pro').PivotTableInstance<TData, TState>): MyPluginApi<TData, TState> {
  return {
    isEnabled: () => table.getState().myFeature?.enabled ?? false,
    setEnabled: (enabled) => {
      table.setState(prev => ({
        ...prev,
        myFeature: { ...prev.myFeature, enabled },
      }));
    },
    getThreshold: () => table.getState().myFeature?.threshold ?? 0,
    setThreshold: (threshold) => {
      table.setState(prev => ({
        ...prev,
        myFeature: { ...prev.myFeature, threshold },
      }));
    },
  };
}

// Wrapper for easy augmentation
export function withMyPlugin<TData extends RowData, TState extends MyPluginState>(
  table: import('react-pivot-pro').PivotTableInstance<TData, TState>,
) {
  return Object.assign(table, {
    myPlugin: createMyPluginApi(table),
  });
}`}</code>
      </pre>

      <h2>Plugin with Caching</h2>
      <p>Implement caching to avoid unnecessary recomputation:</p>
      <pre>
        <code>{`export function createCachedPlugin<TData extends RowData, TState extends TableState>(
  options: { cacheKey: string },
): PivotTablePlugin<TData, TState> {
  const cache = {
    rows: null as Row<TData>[] | null,
    config: {} as Record<string, unknown>,
    result: null as Row<TData>[] | null,
  };

  return {
    name: 'cachedPlugin',
    transformRows: (rows, context) => {
      const config = { threshold: context.state.myFeature?.threshold };

      // Check cache
      if (
        cache.rows === rows &&
        cache.result &&
        JSON.stringify(config) === JSON.stringify(cache.config)
      ) {
        return cache.result;
      }

      // Compute
      const result = rows.filter(row => /* filter logic */ true);

      // Update cache
      cache.rows = rows;
      cache.config = config;
      cache.result = result;

      return result;
    },
  };
}`}</code>
      </pre>

      <h2>Plugin with Column Transformation</h2>
      <pre>
        <code>{`export function createColumnMetaPlugin<
  TData extends RowData,
  TState extends TableState,
>(): PivotTablePlugin<TData, TState> {
  return {
    name: 'columnMeta',
    transformColumns: (columns, context) => {
      return columns.map(col => ({
        ...col,
        meta: {
          ...col.meta,
          hasFilter: col.enableFiltering !== false,
          hasSort: col.enableSorting !== false,
        },
      }));
    },
  };
}`}</code>
      </pre>

      <h2>Plugin with State Validation</h2>
      <pre>
        <code>{`export function createValidatedPlugin<
  TData extends RowData,
  TState extends TableState,
>(): PivotTablePlugin<TData, TState> {
  return {
    name: 'validated',
    onStateChange: (state, previousState, context) => {
      // Validate that sorting only references existing columns
      const validIds = new Set(context.columns.map(c => c.id));
      const invalidSorting = state.sorting?.filter(r => !validIds.has(r.id));

      if (invalidSorting && invalidSorting.length > 0) {
        context.setState(prev => ({
          ...prev,
          sorting: prev.sorting.filter(r => validIds.has(r.id)),
        }));
      }
    },
  };
}`}</code>
      </pre>

      <h2>Testing Your Plugin</h2>
      <pre>
        <code>{`import { describe, it, expect } from 'vitest';
import { createMyPlugin } from './myPlugin';

describe('myPlugin', () => {
  it('should have a name', () => {
    const plugin = createMyPlugin();
    expect(plugin.name).toBe('myPlugin');
  });

  it('should initialize state', () => {
    const plugin = createMyPlugin({ defaultThreshold: 50 });
    const state = plugin.getInitialState?.({} as any);
    expect(state?.myFeature.threshold).toBe(50);
  });

  it('should filter rows by threshold', () => {
    const plugin = createMyPlugin();
    const rows = [
      { id: '1', values: { score: 30 } },
      { id: '2', values: { score: 70 } },
    ];
    const context = {
      state: { myFeature: { enabled: true, threshold: 50 } },
      columns: [],
      data: [],
      setState: () => {},
      getColumnById: () => undefined,
    };
    const result = plugin.transformRows?.(rows as any, context as any);
    expect(result).toHaveLength(1);
    expect(result?.[0].id).toBe('2');
  });
});`}</code>
      </pre>

      <h2>Plugin Checklist</h2>
      <ul>
        <li>
          [ ] Unique <code>name</code> property
        </li>
        <li>
          [ ] <code>getInitialState</code> for plugin state
        </li>
        <li>[ ] Caching for transform functions</li>
        <li>
          [ ] State validation in <code>onStateChange</code>
        </li>
        <li>
          [ ] Companion API with <code>withX</code> wrapper
        </li>
        <li>
          [ ] Hook with <code>useX</code> pattern
        </li>
        <li>[ ] TypeScript types exported</li>
        <li>[ ] Unit tests</li>
      </ul>

      <h2>See Also</h2>
      <ul>
        <li>
          <a href="#/api-plugin-api">Plugin API Reference</a>
        </li>
        <li>
          <a href="#/contributing-setup">Development Setup</a>
        </li>
        <li>
          <a href="#/contributing-changelog">Changelog</a>
        </li>
      </ul>
    </DocPage>
  );
}

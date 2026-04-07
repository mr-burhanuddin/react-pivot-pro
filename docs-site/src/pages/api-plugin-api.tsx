import DocPage from "../components/DocPage";

export default function ApiPluginApi() {
  return (
    <DocPage
      title="Plugin API"
      subtitle="Core plugin interface and lifecycle hooks for extending react-pivot-pro"
    >
      <h2>PivotTablePlugin Interface</h2>
      <p>
        Every plugin implements the <code>PivotTablePlugin</code> interface:
      </p>
      <pre>
        <code>{`interface PivotTablePlugin<TData extends RowData, TState extends TableState = TableState> {
  name: string;
  getInitialState?: (state: TState) => Partial<TState>;
  transformRows?: (
    rows: Row<TData>[],
    context: PivotTablePluginContext<TData, TState>,
  ) => Row<TData>[];
  transformColumns?: (
    columns: Column<TData>[],
    context: PivotTablePluginContext<TData, TState>,
  ) => Column<TData>[];
  onStateChange?: (
    state: TState,
    previousState: TState,
    context: PivotTablePluginContext<TData, TState>,
  ) => void;
}`}</code>
      </pre>

      <h2>Plugin Context</h2>
      <pre>
        <code>{`interface PivotTablePluginContext<TData extends RowData, TState extends TableState = TableState> {
  columns: Column<TData>[];
  data: TData[];
  state: TState;
  setState: (updater: Updater<TState>) => void;
  getColumnById: (columnId: string) => Column<TData> | undefined;
}`}</code>
      </pre>

      <h2>Plugin Lifecycle</h2>
      <h3>1. getInitialState</h3>
      <p>
        Called once when the plugin is first registered. Merges plugin-specific
        state into the table state.
      </p>
      <pre>
        <code>{`getInitialState: (state) => ({
  ...state,
  sorting: state.sorting ?? [],
})`}</code>
      </pre>

      <h3>2. transformRows</h3>
      <p>
        Called on every render cycle. Receives the current row array and returns
        a transformed version. Plugins are applied in registration order.
      </p>
      <pre>
        <code>{`transformRows: (rows, context) => {
  const sorting = context.state.sorting ?? [];
  if (sorting.length === 0) return rows;

  return [...rows].sort((a, b) => {
    // sorting logic
  });
}`}</code>
      </pre>

      <h3>3. transformColumns</h3>
      <p>
        Called on every render cycle. Receives and returns a transformed column
        array. Used for column visibility, ordering, and pinning.
      </p>
      <pre>
        <code>{`transformColumns: (columns, context) => {
  const visibility = context.state.columnVisibility ?? {};
  return columns.filter(col => visibility[col.id] !== false);
}`}</code>
      </pre>

      <h3>4. onStateChange</h3>
      <p>
        Called after state changes. Use for validation, normalization, or side
        effects.
      </p>
      <pre>
        <code>{`onStateChange: (state, previousState, context) => {
  const validIds = new Set(context.columns.map(c => c.id));
  const filtered = state.sorting.filter(r => validIds.has(r.id));
  if (filtered.length !== state.sorting.length) {
    context.setState(prev => ({ ...prev, sorting: filtered }));
  }
}`}</code>
      </pre>

      <h2>Plugin Patterns</h2>
      <h3>Factory Pattern</h3>
      <pre>
        <code>{`export function createSortingPlugin<TData extends RowData, TState extends SortingTableState>(
  options: SortingPluginOptions = {},
): PivotTablePlugin<TData, TState> {
  return {
    name: 'sorting',
    getInitialState: (state) => ({ ...state, sorting: state.sorting ?? [] }),
    transformRows: (rows, context) => { /* ... */ },
  };
}`}</code>
      </pre>

      <h3>Wrapper Pattern</h3>
      <pre>
        <code>{`export function withSorting<TData extends RowData, TState extends SortingTableState>(
  table: PivotTableInstance<TData, TState>,
  options: SortingPluginOptions = {},
): PivotTableWithSorting<TData, TState> {
  return Object.assign(table, {
    sorting: createSortingApi(table, options),
  });
}`}</code>
      </pre>

      <h3>Hook Pattern</h3>
      <pre>
        <code>{`export function useSorting<TData extends RowData, TState extends SortingTableState>(
  table: PivotTableInstance<TData, TState>,
): SortingApi<TData, TState> {
  return createSortingApi(table);
}`}</code>
      </pre>

      <h2>Caching</h2>
      <p>
        Plugins should implement caching to avoid unnecessary recomputation. The
        engine caches plugin output keyed by input reference equality:
      </p>
      <pre>
        <code>{`const cache = {
  rows: null as Row<TData>[] | null,
  sorting: [] as SortingRule[],
  result: null as Row<TData>[] | null,
};

transformRows: (rows, context) => {
  const sorting = context.state.sorting ?? [];
  if (cache.rows === rows && cache.result && areEqual(sorting, cache.sorting)) {
    return cache.result;
  }
  // compute...
  cache.rows = rows;
  cache.sorting = sorting;
  cache.result = result;
  return result;
}`}</code>
      </pre>

      <h2>Runtime Plugin Management</h2>
      <pre>
        <code>{`// Register a plugin after mount
table.registerPlugin(createCustomPlugin());

// Unregister by name
table.unregisterPlugin('sorting');

// Query plugins
const plugin = table.getPlugin('sorting');
const all = table.getAllPlugins();`}</code>
      </pre>

      <h2>See Also</h2>
      <ul>
        <li>
          <a href="#/api-use-pivot-table">usePivotTable Hook</a>
        </li>
        <li>
          <a href="#/contributing-plugin-authoring">Plugin Authoring Guide</a>
        </li>
        <li>
          <a href="#/plugin-aggregation">Aggregation Plugin</a>
        </li>
      </ul>
    </DocPage>
  );
}

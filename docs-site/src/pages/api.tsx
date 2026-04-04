import type { DocRoute } from '@/App';

interface Props {
  route: DocRoute;
}

const usePivotTableSignature = `function usePivotTable<
  TData extends RowData,
  TState extends TableState = TableState
>(options: PivotTableOptions<TData, TState>): PivotTableInstance<TData, TState>`;

const columnDefType = `interface ColumnDef<TData extends RowData, TValue = unknown> {
  id?: string;
  accessorKey?: Extract<keyof TData, string>;
  accessorFn?: (originalRow: TData, index: number) => TValue;
  header?: string;
  meta?: Record<string, unknown>;
  enableSorting?: boolean;
  enableFiltering?: boolean;
}`;

const tableStateType = `interface TableState {
  sorting: SortingRule[];
  filters: ColumnFilter[];
  columnVisibility: Record<string, boolean>;
  rowSelection: Record<string, boolean>;
  expanded: Record<string, boolean>;
}`;

const pluginType = `interface PivotTablePlugin<TData extends RowData, TState extends TableState = TableState> {
  name: string;
  getInitialState?: (state: TState) => Partial<TState>;
  transformRows?: (rows: Row<TData>[], context: PivotTablePluginContext<TData, TState>) => Row<TData>[];
  onStateChange?: (state: TState, previousState: TState, context: PivotTablePluginContext<TData, TState>) => void;
}`;

export default function ApiPage({ route }: Props) {
  return (
    <article className="doc-page">
      <p className="callout">{route.description}</p>

      <h2 id="usepivottable">usePivotTable Hook</h2>
      <p>Builds table state, columns, row models, and plugin pipeline output.</p>
      <pre>
        <code>{usePivotTableSignature}</code>
      </pre>
      <table className="api-table">
        <thead>
          <tr>
            <th>Option</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>`data`</td>
            <td>`TData[]`</td>
            <td>Source rows used to build core row model.</td>
          </tr>
          <tr>
            <td>`columns`</td>
            <td>`ColumnDef&lt;TData&gt;[]`</td>
            <td>Column schema used for value access and feature flags.</td>
          </tr>
          <tr>
            <td>`plugins`</td>
            <td>`PivotTablePlugin[]`</td>
            <td>Ordered feature pipeline that transforms rows and state.</td>
          </tr>
          <tr>
            <td>`initialState`</td>
            <td>`Partial&lt;TState&gt;`</td>
            <td>Initial uncontrolled state snapshot.</td>
          </tr>
          <tr>
            <td>`state`</td>
            <td>`Partial&lt;TState&gt;`</td>
            <td>Controlled state override.</td>
          </tr>
        </tbody>
      </table>

      <h2 id="columndef">ColumnDef</h2>
      <p>Defines how values are read and what per-column features are enabled.</p>
      <pre>
        <code>{columnDefType}</code>
      </pre>

      <h2 id="tablestate">TableState</h2>
      <p>Base state shared by core and extended by plugins.</p>
      <pre>
        <code>{tableStateType}</code>
      </pre>

      <h2 id="plugin-system">Plugin System</h2>
      <p>Plugins can initialize state, transform rows, and respond to state updates.</p>
      <pre>
        <code>{pluginType}</code>
      </pre>

      <table className="api-table">
        <thead>
          <tr>
            <th>Hook/Helper</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>`createSortingPlugin` + `withSorting`</td>
            <td>Sorting row transforms and sorting API methods.</td>
          </tr>
          <tr>
            <td>`createFilteringPlugin` + `withFiltering`</td>
            <td>Column/global filtering and API state helpers.</td>
          </tr>
          <tr>
            <td>`createGroupingPlugin` + `withGrouping`</td>
            <td>Nested group rows and expand/collapse state.</td>
          </tr>
          <tr>
            <td>`createPivotPlugin` + `withPivot`</td>
            <td>Pivot matrix generation and aggregation helpers.</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}

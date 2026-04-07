import DocPage from "../components/DocPage";

export default function GuideRecipes() {
  return (
    <DocPage
      title="Copy-Paste Recipes"
      subtitle="Ready-to-use patterns for common pivot table scenarios"
    >
      <h2>Sortable Table</h2>
      <pre>
        <code>{`import { usePivotTable, createSortingPlugin, withSorting } from 'react-pivot-pro';

function SortableTable({ data, columns }) {
  const table = withSorting(
    usePivotTable({
      data,
      columns,
      plugins: [createSortingPlugin()],
    }),
  );

  return (
    <table>
      <thead>
        <tr>
          {table.columns.map(col => (
            <th key={col.id} onClick={() => table.sorting.toggleSorting(col.id)}>
              {col.header}
              {table.sorting.getIsSorted(col.id) === 'asc' && ' ↑'}
              {table.sorting.getIsSorted(col.id) === 'desc' && ' ↓'}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rowModel.rows.map(row => (
          <tr key={row.id}>
            {table.columns.map(col => (
              <td key={col.id}>{row.getValue(col.id)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}`}</code>
      </pre>

      <h2>Filterable Table with Global Search</h2>
      <pre>
        <code>{`import { usePivotTable, createFilteringPlugin, withFiltering } from 'react-pivot-pro';

function FilterableTable({ data, columns }) {
  const table = withFiltering(
    usePivotTable({
      data,
      columns,
      plugins: [createFilteringPlugin()],
    }),
  );

  return (
    <div>
      <input
        placeholder="Search..."
        onChange={(e) => table.filtering.setGlobalFilter(e.target.value)}
      />
      <table>
        <thead>
          <tr>{table.columns.map(col => <th key={col.id}>{col.header}</th>)}</tr>
        </thead>
        <tbody>
          {table.rowModel.rows.map(row => (
            <tr key={row.id}>
              {table.columns.map(col => (
                <td key={col.id}>{row.getValue(col.id)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}`}</code>
      </pre>

      <h2>Grouped Table with Aggregation</h2>
      <pre>
        <code>{`import {
  usePivotTable,
  createGroupingPlugin,
  createAggregationPlugin,
  withGrouping,
  withAggregation,
} from 'react-pivot-pro';

function GroupedAggregatedTable({ data, columns }) {
  const table = withAggregation(
    withGrouping(
      usePivotTable({
        data,
        columns,
        plugins: [
          createGroupingPlugin(),
          createAggregationPlugin({ defaultAggregator: 'sum' }),
        ],
        initialState: { rowGrouping: ['region'] },
      }),
    ),
  );

  return (
    <table>
      <thead>
        <tr>
          <th />
          {table.columns.map(col => <th key={col.id}>{col.header}</th>)}
        </tr>
      </thead>
      <tbody>
        {table.rowModel.rows.map(row => {
          const isGroup = row.values.__group;
          const depth = row.values.__depth ?? 0;
          return (
            <tr key={row.id}>
              <td style={{ paddingLeft: depth * 20 }}>
                {isGroup && (
                  <button onClick={() => table.grouping.toggleGroupExpanded(row.id)}>
                    {table.grouping.getIsGroupExpanded(row.id) ? '▼' : '▶'}
                  </button>
                )}
              </td>
              {table.columns.map(col => (
                <td key={col.id} style={isGroup ? { fontWeight: 'bold' } : {}}>
                  {isGroup && col.id === row.values.__groupingColumnId
                    ? row.values.__groupingValue
                    : row.getValue(col.id)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}`}</code>
      </pre>

      <h2>Export to CSV</h2>
      <pre>
        <code>{`import { exportCSV } from 'react-pivot-pro';

function ExportButton({ table }) {
  const handleExport = () => {
    const result = exportCSV({
      rows: table.rowModel.rows.map(row =>
        Object.fromEntries(
          table.columns.map(col => [col.header ?? col.id, row.getValue(col.id)])
        )
      ),
      includeHeader: true,
      fileName: 'table-export.csv',
    });
    result.download();
  };

  return <button onClick={handleExport}>Export CSV</button>;
}`}</code>
      </pre>

      <h2>Virtualized Large Table</h2>
      <pre>
        <code>{`import { usePivotTable, useVirtualRows } from 'react-pivot-pro';

function VirtualTable({ data, columns }) {
  const table = usePivotTable({ data, columns });
  const scrollRef = useRef<HTMLDivElement>(null);

  const { virtualRows, totalSize } = useVirtualRows({
    count: table.rowModel.rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 35,
    overscan: 5,
  });

  return (
    <div ref={scrollRef} style={{ height: 600, overflow: 'auto' }}>
      <div style={{ height: totalSize, position: 'relative' }}>
        {virtualRows.map(virtualRow => {
          const row = table.rowModel.rows[virtualRow.index];
          return (
            <div
              key={row.id}
              style={{
                position: 'absolute',
                top: 0,
                transform: \`translateY(\${virtualRow.start}px)\`,
                height: virtualRow.size,
              }}
            >
              {table.columns.map(col => (
                <span key={col.id}>{row.getValue(col.id)}</span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}`}</code>
      </pre>

      <h2>Column Visibility Toggle</h2>
      <pre>
        <code>{`import { usePivotTable, createColumnVisibilityPlugin, withColumnVisibility } from 'react-pivot-pro';

function TableWithVisibility({ data, columns }) {
  const table = withColumnVisibility(
    usePivotTable({
      data,
      columns,
      plugins: [createColumnVisibilityPlugin()],
    }),
  );

  return (
    <div>
      {/* Toggle panel */}
      <div>
        {table.columns.map(col => (
          <label key={col.id}>
            <input
              type="checkbox"
              checked={table.state.columnVisibility[col.id] !== false}
              onChange={(e) => {
                table.setState(prev => ({
                  ...prev,
                  columnVisibility: {
                    ...prev.columnVisibility,
                    [col.id]: e.target.checked,
                  },
                }));
              }}
            />
            {col.header}
          </label>
        ))}
      </div>
      {/* Table renders only visible columns */}
    </div>
  );
}`}</code>
      </pre>

      <h2>See Also</h2>
      <ul>
        <li>
          <a href="#/api-use-pivot-table">usePivotTable Hook</a>
        </li>
        <li>
          <a href="#/plugin-sorting">Sorting Plugin</a>
        </li>
        <li>
          <a href="#/plugin-aggregation">Aggregation Plugin</a>
        </li>
      </ul>
    </DocPage>
  );
}

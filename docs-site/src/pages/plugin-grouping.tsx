import DocPage from "../components/DocPage";

export default function PluginGrouping() {
  return (
    <DocPage
      title="Row Grouping Plugin"
      subtitle="Hierarchical row grouping with expandable groups and nested group support"
    >
      <h2>Overview</h2>
      <p>
        The grouping plugin transforms flat rows into a hierarchical tree
        structure based on one or more grouping columns. Groups are
        expandable/collapsible and support nested multi-level grouping.
      </p>

      <h2>Installation</h2>
      <pre>
        <code>{`import {
  createGroupingPlugin,
  withGrouping,
  useGrouping,
} from 'react-pivot-pro';`}</code>
      </pre>

      <h2>Basic Usage</h2>
      <pre>
        <code>{`import { usePivotTable, createGroupingPlugin, withGrouping } from 'react-pivot-pro';

function GroupedTable({ data, columns }) {
  const table = withGrouping(
    usePivotTable({
      data,
      columns,
      plugins: [createGroupingPlugin()],
      initialState: {
        rowGrouping: ['region'],
      },
    }),
  );

  return (
    <table>
      <thead>
        <tr>
          <th /> {/* Expand/collapse column */}
          {table.columns.map(col => <th key={col.id}>{col.header}</th>)}
        </tr>
      </thead>
      <tbody>
        {table.rowModel.rows.map(row => {
          const isGroup = row.values.__group === true;
          const depth = row.values.__depth ?? 0;

          return (
            <tr key={row.id}>
              <td>
                {isGroup && (
                  <button
                    onClick={() => table.grouping.toggleGroupExpanded(row.id)}
                    style={{ marginLeft: depth * 16 }}
                  >
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

      <h2>GroupingApi Methods</h2>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>getRowGrouping()</code>
            </td>
            <td>Get the current row grouping columns</td>
          </tr>
          <tr>
            <td>
              <code>getColumnGrouping()</code>
            </td>
            <td>Get the current column grouping columns</td>
          </tr>
          <tr>
            <td>
              <code>setRowGrouping(updater)</code>
            </td>
            <td>Set row grouping columns</td>
          </tr>
          <tr>
            <td>
              <code>setColumnGrouping(updater)</code>
            </td>
            <td>Set column grouping columns</td>
          </tr>
          <tr>
            <td>
              <code>toggleGroupExpanded(id, value?)</code>
            </td>
            <td>Toggle a group's expanded state</td>
          </tr>
          <tr>
            <td>
              <code>getIsGroupExpanded(id)</code>
            </td>
            <td>Check if a group is expanded (default: true)</td>
          </tr>
          <tr>
            <td>
              <code>resetGrouping()</code>
            </td>
            <td>Clear all grouping and expanded state</td>
          </tr>
        </tbody>
      </table>

      <h2>Group Row Properties</h2>
      <p>Group rows have special values you can use in rendering:</p>
      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>__group</code>
            </td>
            <td>
              <code>true</code>
            </td>
            <td>Always true for group rows</td>
          </tr>
          <tr>
            <td>
              <code>__depth</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>Nesting depth (0 = top level)</td>
          </tr>
          <tr>
            <td>
              <code>__groupingColumnId</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>The column this group is based on</td>
          </tr>
          <tr>
            <td>
              <code>__groupingValue</code>
            </td>
            <td>
              <code>unknown</code>
            </td>
            <td>The value being grouped</td>
          </tr>
          <tr>
            <td>
              <code>__rowCount</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>Number of leaf rows in this group</td>
          </tr>
        </tbody>
      </table>

      <h2>Multi-Level Grouping</h2>
      <pre>
        <code>{`// Group by region, then by product within each region
table.grouping.setRowGrouping(['region', 'product']);`}</code>
      </pre>

      <h2>Expand/Collapse All</h2>
      <pre>
        <code>{`// Collapse all groups
const groupIds = table.rowModel.rows
  .filter(r => r.values.__group)
  .map(r => r.id);

table.setState(prev => ({
  ...prev,
  expandedGroups: Object.fromEntries(groupIds.map(id => [id, false])),
}));`}</code>
      </pre>

      <h2>GroupingTableState</h2>
      <pre>
        <code>{`interface GroupingTableState extends TableState {
  rowGrouping: string[];
  columnGrouping: string[];
  expandedGroups: Record<string, boolean>;
}`}</code>
      </pre>

      <h2>Group ID Format</h2>
      <p>
        Group IDs follow the pattern <code>group::path</code> for nested groups:
      </p>
      <pre>
        <code>{`// Single level: "group::region:North"
// Nested: "group::region:North|product:Widget"`}</code>
      </pre>

      <h2>Combining with Aggregation</h2>
      <pre>
        <code>{`const table = withAggregation(
  withGrouping(
    usePivotTable({
      data,
      columns,
      plugins: [
        createGroupingPlugin(),
        createAggregationPlugin(),
      ],
      initialState: {
        rowGrouping: ['region'],
      },
    }),
  ),
);`}</code>
      </pre>

      <h2>See Also</h2>
      <ul>
        <li>
          <a href="#/plugin-aggregation">Aggregation Plugin</a>
        </li>
        <li>
          <a href="#/plugin-sorting">Sorting Plugin</a>
        </li>
        <li>
          <a href="#/guide-recipes">Copy-Paste Recipes</a>
        </li>
      </ul>
    </DocPage>
  );
}

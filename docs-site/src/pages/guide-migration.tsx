import DocPage from "../components/DocPage";

export default function GuideMigration() {
  return (
    <DocPage
      title="Migration Guide"
      subtitle="Upgrade between react-pivot-pro versions and migrate from other table libraries"
    >
      <h2>Upgrading react-pivot-pro</h2>

      <h3>v0.x → v1.x</h3>
      <p>
        Check the <a href="#/contributing-changelog">changelog</a> for breaking
        changes between major versions.
      </p>

      <h2>Migrating from TanStack Table</h2>
      <p>
        react-pivot-pro shares conceptual similarities with TanStack Table but
        has key differences:
      </p>

      <h3>Core Differences</h3>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>TanStack Table</th>
            <th>react-pivot-pro</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>State management</td>
            <td>Internal to table instance</td>
            <td>Zustand store + controlled/uncontrolled</td>
          </tr>
          <tr>
            <td>Plugin system</td>
            <td>Column/row hooks on table options</td>
            <td>Discrete plugin instances with lifecycle</td>
          </tr>
          <tr>
            <td>Column definition</td>
            <td>ColumnDef with cell/header accessors</td>
            <td>Similar, plus pivot.aggregator support</td>
          </tr>
          <tr>
            <td>Row model</td>
            <td>Multiple row models (core, filtered, sorted, etc.)</td>
            <td>Single rowModel + getCoreRowModel()</td>
          </tr>
          <tr>
            <td>Virtualization</td>
            <td>Separate @tanstack/react-table-virtual</td>
            <td>Built-in useVirtualRows/useVirtualColumns</td>
          </tr>
          <tr>
            <td>DnD</td>
            <td>External</td>
            <td>Built-in dndRow/dndColumn plugins</td>
          </tr>
        </tbody>
      </table>

      <h3>Migration Steps</h3>
      <pre>
        <code>{`// TanStack Table
import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table';

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
});

// react-pivot-pro
import { usePivotTable, createSortingPlugin } from 'react-pivot-pro';

const table = usePivotTable({
  data,
  columns,
  plugins: [createSortingPlugin()],
});`}</code>
      </pre>

      <h2>Migrating from AG-Grid</h2>
      <p>
        AG-Grid is a full-featured grid with built-in UI. react-pivot-pro is
        headless — you provide all rendering:
      </p>
      <pre>
        <code>{`// AG-Grid
<AgGridReact
  rowData={data}
  columnDefs={columns}
  rowGroupPanelShow="always"
  pivotMode={true}
/>

// react-pivot-pro — you control the markup
const table = usePivotTable({
  data,
  columns,
  plugins: [
    createGroupingPlugin(),
    createAggregationPlugin(),
  ],
});

// Render table, headers, cells, group rows yourself
<table>
  {/* Your markup */}
</table>`}</code>
      </pre>

      <h2>Common Patterns</h2>
      <h3>Column Definitions</h3>
      <pre>
        <code>{`// Most libraries use a similar pattern:
{
  field: 'name',          // AG-Grid
  accessorKey: 'name',    // react-pivot-pro
  header: 'Name',
}`}</code>
      </pre>

      <h3>Sorting</h3>
      <pre>
        <code>{`// react-pivot-pro
table.sorting.toggleSorting(columnId);
table.sorting.getIsSorted(columnId); // 'asc' | 'desc' | false`}</code>
      </pre>

      <h3>Filtering</h3>
      <pre>
        <code>{`// react-pivot-pro
table.filtering.setColumnFilter(columnId, value);
table.filtering.setGlobalFilter(value);`}</code>
      </pre>

      <h3>Row Grouping</h3>
      <pre>
        <code>{`// react-pivot-pro
table.grouping.setRowGrouping(['region', 'product']);
table.grouping.toggleGroupExpanded(groupId);`}</code>
      </pre>

      <h2>See Also</h2>
      <ul>
        <li>
          <a href="#/contributing-changelog">Changelog</a>
        </li>
        <li>
          <a href="#/api-use-pivot-table">usePivotTable Hook</a>
        </li>
        <li>
          <a href="#/getting-started">Getting Started</a>
        </li>
      </ul>
    </DocPage>
  );
}

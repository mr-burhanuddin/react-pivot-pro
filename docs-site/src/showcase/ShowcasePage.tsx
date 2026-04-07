import {
  ArrowUpDown,
  Filter,
  Layers,
  Table2,
  Columns,
  Download,
  Settings2,
  Code,
  Globe,
  GripVertical,
} from "lucide-react";
import { DemoCard } from "./components";
import {
  BasicTableExample,
  MultiSortExample,
  MultiFilterExample,
  ColumnAggregationExample,
  CombinedFeaturesExample,
  CustomRenderersExample,
  ApiDrivenExample,
  GroupingExample,
  ColumnVisibilityExample,
  ColumnOrderingExample,
  ColumnPinningExample,
  VirtualizationExample,
  VirtualColumnsExample,
  ControlledStateExample,
  DndRowExample,
  DndColumnExample,
  ExportExample,
} from "./examples";

export default function ShowcasePage() {
  return (
    <div
      style={{
        maxWidth: "var(--content-wide-max-width)",
        margin: "0 auto",
        padding: "var(--space-6) var(--space-4)",
      }}
    >
      <h1
        style={{
          fontSize: "var(--text-2xl)",
          fontWeight: "var(--font-medium)",
          marginBottom: "var(--space-2)",
          color: "var(--text-primary)",
        }}
      >
        Interactive Demos
      </h1>
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "var(--text-md)",
          marginBottom: "var(--space-8)",
        }}
      >
        Every plugin and hook, wired and interactive. Click, drag, and type to
        see real state changes.
      </p>

      {/* ─── Core Examples ─── */}
      <h2
        style={{
          fontSize: "var(--text-lg)",
          fontWeight: "var(--font-medium)",
          color: "var(--text-primary)",
          marginBottom: "var(--space-4)",
          marginTop: "var(--space-2)",
        }}
      >
        Core Features
      </h2>

      <DemoCard
        title="Basic Table"
        badge="Core"
        description="Minimal setup with usePivotTable — no plugins, just raw data rendering."
        icon={<Table2 size={16} />}
        code={`import { usePivotTable } from 'react-pivot-pro';

const table = usePivotTable({ data, columns });

<table>
  <thead>{columns.map(col => <th key={col.id}>{col.header}</th>)}</thead>
  <tbody>
    {table.getRowModel().rows.map(row => (
      <tr key={row.id}>
        {columns.map(col => <td>{row.values[col.id]}</td>)}
      </tr>
    ))}
  </tbody>
</table>`}
      >
        <BasicTableExample />
      </DemoCard>

      <DemoCard
        title="Multi-Column Sorting"
        badge="Plugin"
        description="Sort by multiple columns. Click for single sort, Shift+click for multi-sort."
        icon={<ArrowUpDown size={16} />}
        code={`import { usePivotTable, createSortingPlugin, withSorting } from 'react-pivot-pro';

const table = usePivotTable({
  data, columns,
  plugins: [createSortingPlugin()],
});
const withSort = withSorting(table);

// Toggle sorting (single)
withSort.sorting.toggleSorting('revenue');
// Multi-sort (hold Shift)
withSort.sorting.toggleSorting('units', true);

// Access sort state
const sorting = withSort.sorting.getSorting();
// [{ id: 'revenue', desc: false }, { id: 'units', desc: true }]`}
      >
        <MultiSortExample />
      </DemoCard>

      <DemoCard
        title="Multi-Column Filtering"
        badge="Plugin"
        description="Global search + column-level filters with typed operators (text, number, enum)."
        icon={<Filter size={16} />}
        code={`import { usePivotTable, createFilteringPlugin, withFiltering } from 'react-pivot-pro';

const table = usePivotTable({
  data, columns,
  plugins: [createFilteringPlugin()],
});
const withFilter = withFiltering(table);

// Global text search
withFilter.filtering.setGlobalFilter('North');

// Column-level filters with types
withFilter.filtering.setColumnFilter('region', ['North', 'South'], 'enum', 'in');
withFilter.filtering.setColumnFilter('revenue', 50000, 'number', 'gte');
withFilter.filtering.setColumnFilter('product', 'Widget', 'text', 'contains');

// Get active filters
const filters = withFilter.filtering.getColumnFilters();`}
      >
        <MultiFilterExample />
      </DemoCard>

      <DemoCard
        title="Column-wise Aggregation"
        badge="Plugin"
        description="Different aggregators per column: sum, avg, min, max, count, and more."
        icon={<Table2 size={16} />}
        code={`import { usePivotTable, createAggregationPlugin, withAggregation } from 'react-pivot-pro';

const table = usePivotTable({
  data, columns,
  plugins: [createAggregationPlugin({
    autoAggregateColumns: ['revenue', 'cost', 'units'],
    defaultAggregator: 'sum',
  })],
});
const withAgg = withAggregation(table);

// Set different aggregator per column
withAgg.aggregation.setColumnAggregator('revenue', 'sum');
withAgg.aggregation.setColumnAggregator('units', 'avg');
withAgg.aggregation.setColumnAggregator('cost', 'min');

// Get grand totals
const totalRevenue = withAgg.aggregation.getGrandTotal('revenue');`}
      >
        <ColumnAggregationExample />
      </DemoCard>

      <DemoCard
        title="Combined: Sort + Filter + Aggregate"
        badge="Plugin"
        description="All three plugins working together — search, sort, and aggregate simultaneously."
        icon={<Layers size={16} />}
        code={`import {
  usePivotTable,
  createSortingPlugin, createFilteringPlugin, createAggregationPlugin,
  withSorting, withFiltering, withAggregation,
} from 'react-pivot-pro';

const table = usePivotTable({
  data, columns,
  plugins: [
    createSortingPlugin(),
    createFilteringPlugin(),
    createAggregationPlugin({ autoAggregateColumns: ['revenue', 'units'] }),
  ],
});

// Compose all APIs
const api = withSorting(withFiltering(withAggregation(table)));

api.sorting.toggleSorting('revenue');
api.filtering.setGlobalFilter('North');
api.aggregation.setColumnAggregator('revenue', 'avg');`}
      >
        <CombinedFeaturesExample />
      </DemoCard>

      <DemoCard
        title="Custom Cell Renderers"
        badge="Pattern"
        description="Define custom cell renderers via the cell property in ColumnDef for rich formatting."
        icon={<Code size={16} />}
        code={`import { usePivotTable, createSortingPlugin, withSorting } from 'react-pivot-pro';

const columns: ColumnDef<SalesRow>[] = [
  {
    id: 'revenue',
    header: 'Revenue',
    accessorKey: 'revenue',
    cell: (val) => {
      const valNum = Number(val);
      const color = valNum > 50000 ? '#0891B2' : '#6B7280';
      return <span style={{ color }}>$ {'{valNum.toLocaleString()}'}</span>;
    },
  },
  {
    id: 'channel',
    header: 'Channel',
    accessorKey: 'channel',
    cell: (val) => <Badge color={channelColors[String(val)]}>{String(val)}</Badge>,
  },
];

const table = withSorting(usePivotTable({ data, columns, plugins: [createSortingPlugin()] }));`}
      >
        <CustomRenderersExample />
      </DemoCard>

      <DemoCard
        title="API-Driven Data"
        badge="Pattern"
        description="Simulated async data flow with loading states, error handling, and refresh."
        icon={<Globe size={16} />}
        code={`function DataTable({ data }: { data: SalesRow[] }) {
  const table = usePivotTable({
    data, columns,
    plugins: [createSortingPlugin(), createFilteringPlugin()],
  });
  return withFiltering(withSorting(table));
}

function ApiDrivenExample() {
  const [data, setData] = useState<SalesRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sales')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return <Error />;
  return <DataTable data={data} />;
}`}
      >
        <ApiDrivenExample />
      </DemoCard>

      {/* ─── Additional Plugins ─── */}
      <h2
        style={{
          fontSize: "var(--text-lg)",
          fontWeight: "var(--font-medium)",
          color: "var(--text-primary)",
          marginBottom: "var(--space-4)",
          marginTop: "var(--space-8)",
        }}
      >
        Additional Plugins
      </h2>

      <DemoCard
        title="Row Grouping"
        badge="Plugin"
        description="Hierarchical row grouping with expand/collapse toggle."
        icon={<Layers size={16} />}
        code={`import { usePivotTable, createGroupingPlugin, withGrouping } from 'react-pivot-pro';

const table = usePivotTable({
  data, columns,
  plugins: [createGroupingPlugin()],
});
const withGroup = withGrouping(table);

withGroup.grouping.setRowGrouping(['region', 'category']);
withGroup.grouping.toggleGroupExpanded(groupId);
const isExpanded = withGroup.grouping.getIsGroupExpanded(groupId);`}
      >
        <GroupingExample />
      </DemoCard>

      <DemoCard
        title="Column Visibility"
        badge="Plugin"
        description="Toggle column visibility on/off with state persistence."
        icon={<Columns size={16} />}
        code={`import { usePivotTable, createColumnVisibilityPlugin, withColumnVisibility } from 'react-pivot-pro';

const table = usePivotTable({
  data, columns,
  plugins: [createColumnVisibilityPlugin()],
});
const withVis = withColumnVisibility(table);

withVis.columnVisibility.toggleColumnVisibility('region');
const visible = withVis.columnVisibility.getVisibleColumnIds();`}
      >
        <ColumnVisibilityExample />
      </DemoCard>

      <DemoCard
        title="Column Ordering"
        badge="Plugin"
        description="Reorder columns programmatically with state management."
        icon={<ArrowUpDown size={16} />}
        code={`import { usePivotTable, createColumnOrderingPlugin, withColumnOrdering } from 'react-pivot-pro';

const table = usePivotTable({
  data, columns,
  plugins: [createColumnOrderingPlugin()],
});
const withOrder = withColumnOrdering(table);

withOrder.columnOrdering.reorderColumn('revenue', 2);
const order = withOrder.columnOrdering.getOrderedColumnIds();`}
      >
        <ColumnOrderingExample />
      </DemoCard>

      <DemoCard
        title="Column Pinning"
        badge="Plugin"
        description="Pin columns to left or right with visual separation."
        icon={<Columns size={16} />}
        code={`import { usePivotTable, createColumnPinningPlugin, withColumnPinning } from 'react-pivot-pro';

const table = usePivotTable({
  data, columns,
  plugins: [createColumnPinningPlugin()],
});
const withPin = withColumnPinning(table);

withPin.columnPinning.pinColumn('region', 'left');
withPin.columnPinning.pinColumn('revenue', 'right');
const pinState = withPin.columnPinning.getColumnPinning();
// { left: ['region'], right: ['revenue'] }`}
      >
        <ColumnPinningExample />
      </DemoCard>

      {/* ─── Performance ─── */}
      <h2
        style={{
          fontSize: "var(--text-lg)",
          fontWeight: "var(--font-medium)",
          color: "var(--text-primary)",
          marginBottom: "var(--space-4)",
          marginTop: "var(--space-8)",
        }}
      >
        Performance
      </h2>

      <DemoCard
        title="Row Virtualization"
        badge="Hook"
        description="Render only visible rows for datasets with 100K+ rows using @tanstack/virtual-core."
        icon={<Table2 size={16} />}
        code={`import { usePivotTable, useVirtualRows } from 'react-pivot-pro';

const table = usePivotTable({ data: largeDataset, columns });
const rows = table.getRowModel().rows;

const { virtualRows, totalSize } = useVirtualRows({
  count: rows.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 36,
  overscan: 5,
});

// Only render virtual rows
{virtualRows.map(vr => {
  const row = rows[vr.index];
  return <TableRow key={row.id} row={row} style={{ transform: \`translateY(\${vr.start}px)\` }} />;
})}`}
      >
        <VirtualizationExample />
      </DemoCard>

      <DemoCard
        title="Column Virtualization"
        badge="Hook"
        description="Column virtualization for wide tables with many columns."
        icon={<Columns size={16} />}
        code={`import { usePivotTable, useVirtualColumns } from 'react-pivot-pro';

const table = usePivotTable({ data, columns: wideColumns });
const columns = table.columns;

const { virtualColumns, totalSize } = useVirtualColumns({
  count: columns.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 150,
  overscan: 3,
});

// Only render virtual columns
{virtualColumns.map(vc => {
  const col = columns[vc.index];
  return <ColumnHeader key={col.id} style={{ width: vc.size }} />;
})}`}
      >
        <VirtualColumnsExample />
      </DemoCard>

      {/* ─── Patterns ─── */}
      <h2
        style={{
          fontSize: "var(--text-lg)",
          fontWeight: "var(--font-medium)",
          color: "var(--text-primary)",
          marginBottom: "var(--space-4)",
          marginTop: "var(--space-8)",
        }}
      >
        Patterns
      </h2>

      <DemoCard
        title="Controlled State"
        badge="Pattern"
        description="External state management with onStateChange callbacks for full control."
        icon={<Settings2 size={16} />}
        code={`import { useState } from 'react';
import { usePivotTable, createSortingPlugin, withSorting } from 'react-pivot-pro';

function ControlledTable() {
  const [sorting, setSorting] = useState<SortingRule[]>([]);

  const table = usePivotTable({
    data, columns,
    plugins: [createSortingPlugin()],
    state: { sorting },
    onStateChange: (next) => setSorting(next.sorting),
  });
  const withSort = withSorting(table);

  // External state drives the table
  return <Table sorting={sorting} onSort={setSorting} />;
}`}
      >
        <ControlledStateExample />
      </DemoCard>

      <DemoCard
        title="Drag & Drop Rows"
        badge="Plugin"
        description="Reorder rows via drag and drop."
        icon={<GripVertical size={16} />}
        code={`import { usePivotTable, createDndRowPlugin, withDndRow } from 'react-pivot-pro';

const table = usePivotTable({
  data, columns,
  plugins: [createDndRowPlugin()],
});
const withDnd = withDndRow(table);

// Reorder rows programmatically
withDnd.dndRow.reorderRows(dragIndex, dropIndex);

// Or use HTML5 drag & drop with row IDs
const order = rows.map(r => r.id);
const [moved] = order.splice(dragIndex, 1);
order.splice(dropIndex, 0, moved);
withDnd.dndRow.setRowOrder(order);`}
      >
        <DndRowExample />
      </DemoCard>

      <DemoCard
        title="Drag & Drop Columns"
        badge="Plugin"
        description="Reorder columns via drag and drop."
        icon={<GripVertical size={16} />}
        code={`import { usePivotTable, createDndColumnPlugin, withDndColumn } from 'react-pivot-pro';

const table = usePivotTable({
  data, columns,
  plugins: [createDndColumnPlugin()],
});
const withDnd = withDndColumn(table);

withDnd.dndColumn.reorderColumns(dragIndex, dropIndex);
withDnd.dndColumn.setColumnOrder(['region', 'product', 'revenue']);`}
      >
        <DndColumnExample />
      </DemoCard>

      {/* ─── Utilities ─── */}
      <h2
        style={{
          fontSize: "var(--text-lg)",
          fontWeight: "var(--font-medium)",
          color: "var(--text-primary)",
          marginBottom: "var(--space-4)",
          marginTop: "var(--space-8)",
        }}
      >
        Utilities
      </h2>

      <DemoCard
        title="CSV Export"
        badge="Utility"
        description="Export table data to CSV with proper escaping, sanitization, and download."
        icon={<Download size={16} />}
        code={`import { usePivotTable, exportCSV } from 'react-pivot-pro';

const handleExport = () => {
  const result = exportCSV({
    rows: data,
    columns: [
      { id: 'orderId', header: 'Order ID', accessor: (row) => row.orderId },
      { id: 'revenue', header: 'Revenue', accessor: (row) => row.revenue },
    ],
    fileName: 'sales-export.csv',
    includeHeader: true,
  });

  // Trigger browser download
  result.download();

  // Or access raw CSV string
  console.log(result.csv);
};`}
      >
        <ExportExample />
      </DemoCard>
    </div>
  );
}

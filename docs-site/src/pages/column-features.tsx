import type { DocRoute } from '@/App';

interface Props {
  route: DocRoute;
}

export default function ColumnFeaturesPage({ route }: Props) {
  return (
    <article className="doc-page">
      <p className="callout">{route.description}</p>

      <h2 id="overview">Overview</h2>
      <p>
        React Pivot Pro provides three plugins for column management:
      </p>
      <ul>
        <li><strong>Column Visibility</strong> - Show/hide columns dynamically</li>
        <li><strong>Column Ordering</strong> - Reorder columns programmatically</li>
        <li><strong>Column Pinning</strong> - Pin columns to left or right</li>
      </ul>

      <h2 id="column-visibility">Column Visibility</h2>
      <p>
        Control which columns are visible in the table. This is useful for:
      </p>
      <ul>
        <li>User-configurable table views</li>
        <li>Reducing visual clutter</li>
        <li>Focusing on relevant data</li>
      </ul>

      <h3 id="visibility-example">Example</h3>
      <pre>
        <code>{`import { createColumnVisibilityPlugin, withColumnVisibility } from 'react-pivot-pro';

const table = usePivotTable({
  data,
  columns,
  plugins: [createColumnVisibilityPlugin()],
});

const visibleTable = withColumnVisibility(table);

// Toggle a column
visibleTable.columnVisibility.toggleColumnVisibility('amount');

// Check visibility
const isVisible = visibleTable.columnVisibility.getIsColumnVisible('amount');

// Get all visible columns
const visibleIds = visibleTable.columnVisibility.getVisibleColumnIds();`}</code>
      </pre>

      <h3 id="visibility-api">Visibility API</h3>
      <ul>
        <li><code>getIsColumnVisible(columnId)</code> - Check if column is visible</li>
        <li><code>toggleColumnVisibility(columnId)</code> - Toggle visibility</li>
        <li><code>getVisibleColumnIds()</code> - Get array of visible column IDs</li>
        <li><code>setColumnVisibility(visibilityMap)</code> - Set multiple at once</li>
        <li><code>getColumnVisibility()</code> - Get current visibility map</li>
      </ul>

      <h2 id="column-ordering">Column Ordering</h2>
      <p>
        Reorder columns programmatically. Unlike drag-and-drop, this is controlled via state.
      </p>

      <h3 id="ordering-example">Example</h3>
      <pre>
        <code>{`import { createColumnOrderingPlugin, withColumnOrdering } from 'react-pivot-pro';

const table = usePivotTable({
  data,
  columns,
  plugins: [createColumnOrderingPlugin()],
});

const orderedTable = withColumnOrdering(table);

// Get current order
const order = orderedTable.columnOrdering.getColumnOrder();

// Reorder by index
orderedTable.columnOrdering.reorderColumn('amount', 0);

// Set specific order
orderedTable.columnOrdering.setColumnOrder(['name', 'amount', 'date']);

// Reset to default
orderedTable.columnOrdering.resetColumnOrder();`}</code>
      </pre>

      <h3 id="ordering-api">Ordering API</h3>
      <ul>
        <li><code>getColumnOrder()</code> - Get current column order</li>
        <li><code>getOrderedColumnIds()</code> - Get ordered columns for rendering</li>
        <li><code>setColumnOrder(order)</code> - Set specific order</li>
        <li><code>reorderColumn(columnId, targetIndex)</code> - Move column</li>
        <li><code>resetColumnOrder()</code> - Reset to default</li>
      </ul>

      <h2 id="column-pinning">Column Pinning</h2>
      <p>
        Pin columns to the left or right edge. Pinned columns stay visible when scrolling.
      </p>

      <h3 id="pinning-example">Example</h3>
      <pre>
        <code>{`import { createColumnPinningPlugin, withColumnPinning } from 'react-pivot-pro';

const table = usePivotTable({
  data,
  columns,
  plugins: [createColumnPinningPlugin()],
});

const pinnedTable = withColumnPinning(table);

// Pin to left
pinnedTable.columnPinning.pinColumn('id', 'left');

// Pin to right
pinnedTable.columnPinning.pinColumn('actions', 'right');

// Unpin
pinnedTable.columnPinning.pinColumn('category', false);

// Check pinned state
const leftPinned = pinnedTable.columnPinning.getPinnedColumns('left');
const rightPinned = pinnedTable.columnPinning.getPinnedColumns('right');
const centerColumns = pinnedTable.columnPinning.getCenterColumnIds();`}</code>
      </pre>

      <h3 id="pinning-api">Pinning API</h3>
      <ul>
        <li><code>pinColumn(columnId, position)</code> - Pin to 'left', 'right', or false</li>
        <li><code>getPinnedColumns(position)</code> - Get left or right pinned IDs</li>
        <li><code>getCenterColumnIds()</code> - Get unpinned column IDs</li>
        <li><code>resetColumnPinning()</code> - Unpin all columns</li>
      </ul>

      <h2 id="combined-example">Combined Example</h2>
      <p>
        All three column features can be combined:
      </p>
      <pre>
        <code>{`import { 
  createColumnVisibilityPlugin, 
  createColumnOrderingPlugin,
  createColumnPinningPlugin,
  withColumnVisibility,
  withColumnOrdering,
  withColumnPinning 
} from 'react-pivot-pro';

const table = usePivotTable({
  data,
  columns,
  plugins: [
    createColumnVisibilityPlugin(),
    createColumnOrderingPlugin(),
    createColumnPinningPlugin(),
  ],
});

const fullTable = withColumnPinning(
  withColumnOrdering(
    withColumnVisibility(table)
  )
);

// Now use any API
fullTable.columnVisibility.toggleColumnVisibility('notes');
fullTable.columnOrdering.reorderColumn('date', 0);
fullTable.columnPinning.pinColumn('id', 'left');`}</code>
      </pre>

      <h2 id="rendering-pinned">Rendering Pinned Columns</h2>
      <p>
        When using pinned columns, apply sticky positioning in your CSS:
      </p>
      <pre>
        <code>{`// Left pinned columns
th, td {
  position: sticky;
  left: 0;
  z-index: 1;
  background: var(--surface);
}

// Right pinned columns
th:last-child, td:last-child {
  position: sticky;
  right: 0;
  background: var(--surface);
}

// Adjust left offset for each left-pinned column
th:nth-child(2), td:nth-child(2) { left: 40px; }
th:nth-child(3), td:nth-child(3) { left: 120px; }`}</code>
      </pre>
    </article>
  );
}

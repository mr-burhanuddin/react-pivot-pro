import type { DocRoute } from '@/App';

interface Props {
  route: DocRoute;
}

export default function DragDropPage({ route }: Props) {
  return (
    <article className="doc-page">
      <p className="callout">{route.description}</p>

      <h2 id="overview">Overview</h2>
      <p>
        React Pivot Pro supports drag-and-drop functionality for both rows and columns through
        the <code>dndRow</code> and <code>dndColumn</code> plugins. These plugins integrate
        with <code>@dnd-kit/core</code> to provide smooth, accessible drag-and-drop experiences.
      </p>

      <h2 id="row-dnd">Row Drag & Drop</h2>
      <p>
        The row drag-and-drop plugin allows users to reorder rows by dragging them to new positions.
        This is useful for priority lists, task management, or custom sorting scenarios.
      </p>

      <h3 id="row-dnd-example">Example</h3>
      <pre>
        <code>{`import { usePivotTable } from 'react-pivot-pro';
import { createDndRowPlugin, withDndRow } from 'react-pivot-pro';
import { DndContext, closestCenter, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';

const table = usePivotTable({
  data: myData,
  columns: columns,
  plugins: [createDndRowPlugin()],
});

const tableWithDnD = withDndRow(table);

// Use in DndContext
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={(event) => tableWithDnD.dndRow.handleDragEnd(event)}
>
  {tableWithDnD.getRowModel().rows.map((row) => (
    <DraggableRow key={row.id} row={row} />
  ))}
  <DragOverlay>
    <RowPreview />
  </DragOverlay>
</DndContext>`}</code>
      </pre>

      <h3 id="row-dnd-api">Row DnD API</h3>
      <ul>
        <li><code>getRowOrder()</code> - Returns current custom row order</li>
        <li><code>getSortableRowIds()</code> - Returns all row IDs that can be reordered</li>
        <li><code>setRowOrder(order)</code> - Set a new row order</li>
        <li><code>reorderRows(activeId, overId)</code> - Reorder by dragging</li>
        <li><code>handleDragEnd(event)</code> - Handle drag end from DndContext</li>
        <li><code>resetRowOrder()</code> - Reset to default order</li>
      </ul>

      <h2 id="column-dnd">Column Drag & Drop</h2>
      <p>
        The column drag-and-drop plugin allows users to reorder columns by dragging headers.
        This is useful for customizing table layouts without code changes.
      </p>

      <h3 id="column-dnd-example">Example</h3>
      <pre>
        <code>{`import { usePivotTable } from 'react-pivot-pro';
import { createDndColumnPlugin, withDndColumn } from 'react-pivot-pro';
import { DndContext, closestCenter } from '@dnd-kit/core';

const table = usePivotTable({
  data: myData,
  columns: columns,
  plugins: [createDndColumnPlugin()],
});

const tableWithDnD = withDndColumn(table);

// Column headers in DndContext
<DndContext onDragEnd={(event) => tableWithDnD.dndColumn.handleDragEnd(event)}>
  {tableWithDnD.columns.map((column) => (
    <DraggableHeader key={column.id} column={column} />
  ))}
</DndContext>`}</code>
      </pre>

      <h3 id="column-dnd-api">Column DnD API</h3>
      <ul>
        <li><code>getColumnOrder()</code> - Returns current custom column order</li>
        <li><code>getSortableColumnIds()</code> - Returns all column IDs that can be reordered</li>
        <li><code>setColumnOrder(order)</code> - Set a new column order</li>
        <li><code>reorderColumns(activeId, overId)</code> - Reorder by dragging</li>
        <li><code>handleDragEnd(event)</code> - Handle drag end from DndContext</li>
        <li><code>resetColumnOrder()</code> - Reset to default order</li>
      </ul>

      <h2 id="combined-dnd">Combined Row & Column DnD</h2>
      <p>
        You can combine both plugins for maximum flexibility:
      </p>
      <pre>
        <code>{`import { createDndRowPlugin, createDndColumnPlugin } from 'react-pivot-pro';
import { withDndRow, withDndColumn } from 'react-pivot-pro';

const table = usePivotTable({
  data: myData,
  columns: columns,
  plugins: [createDndRowPlugin(), createDndColumnPlugin()],
});

const tableWithAllDnD = withDndColumn(withDndRow(table));`}</code>
      </pre>

      <h2 id="dnd-dependencies">Dependencies</h2>
      <p>
        The DnD plugins require <code>@dnd-kit/core</code> as a peer dependency:
      </p>
      <pre>
        <code>{`npm install @dnd-kit/core`}</code>
      </pre>

      <h2 id="accessibility">Accessibility</h2>
      <p>
        The DnD implementation uses <code>@dnd-kit/core</code> which provides:
      </p>
      <ul>
        <li>Keyboard navigation support</li>
        <li>Screen reader announcements</li>
        <li>Touch device support</li>
        <li>ARIA attributes automatically managed</li>
      </ul>

      <h2 id="state-persistence">State Persistence</h2>
      <p>
        The row and column order are stored in the table state. You can persist this to
        localStorage or a backend:
      </p>
      <pre>
        <code>{`// Save order
const rowOrder = table.dndRow.getRowOrder();
localStorage.setItem('rowOrder', JSON.stringify(rowOrder));

// Restore order
const savedOrder = JSON.parse(localStorage.getItem('rowOrder') || '[]');
table.dndRow.setRowOrder(savedOrder);`}</code>
      </pre>
    </article>
  );
}

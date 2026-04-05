import DocPage from '../components/DocPage';

export default function PluginDragDrop() {
  return (
    <DocPage title="Drag & Drop Plugins" subtitle="Reorder rows and columns via drag-and-drop using @dnd-kit/core">
      <h2>Overview</h2>
      <p>react-pivot-pro provides two DnD plugins powered by <code>@dnd-kit/core</code>:</p>
      <ul>
        <li><strong>dndRow</strong> — Reorder table rows by dragging</li>
        <li><strong>dndColumn</strong> — Reorder table columns by dragging</li>
      </ul>

      <h2>Row Drag & Drop</h2>
      <h3>Setup</h3>
      <pre><code>{`import {
  usePivotTable,
  createDndRowPlugin,
  withDndRow,
  useDndRow,
  DndContext,
} from 'react-pivot-pro';
import type { DragEndEvent } from '@dnd-kit/core';

function DraggableRowsTable({ data, columns }) {
  const table = withDndRow(
    usePivotTable({
      data,
      columns,
      plugins: [createDndRowPlugin()],
    }),
  );

  return (
    <DndContext onDragEnd={table.dndRow.handleDragEnd}>
      <table>
        <thead>
          <tr>
            <th /> {/* Drag handle column */}
            {table.columns.map(col => <th key={col.id}>{col.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {table.rowModel.rows.map(row => (
            <tr key={row.id}>
              <td>
                <Draggable id={row.id}>⠿</Draggable>
              </td>
              {table.columns.map(col => (
                <td key={col.id}>{row.getValue(col.id)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </DndContext>
  );
}`}</code></pre>

      <h3>DndRowApi Methods</h3>
      <table>
        <thead>
          <tr><th>Method</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>getRowOrder()</code></td><td>Get the current row order as an array of IDs</td></tr>
          <tr><td><code>getSortableRowIds()</code></td><td>Get all row IDs that can be reordered</td></tr>
          <tr><td><code>setRowOrder(updater)</code></td><td>Set row order directly</td></tr>
          <tr><td><code>reorderRows(activeId, overId)</code></td><td>Move a row from one position to another</td></tr>
          <tr><td><code>handleDragEnd(event)</code></td><td>Direct handler for DndContext onDragEnd</td></tr>
          <tr><td><code>resetRowOrder()</code></td><td>Reset to original data order</td></tr>
        </tbody>
      </table>

      <h2>Column Drag & Drop</h2>
      <h3>Setup</h3>
      <pre><code>{`import {
  usePivotTable,
  createDndColumnPlugin,
  withDndColumn,
} from 'react-pivot-pro';
import { DndContext } from '@dnd-kit/core';

function DraggableColumnsTable({ data, columns }) {
  const table = withDndColumn(
    usePivotTable({
      data,
      columns,
      plugins: [createDndColumnPlugin()],
    }),
  );

  return (
    <DndContext onDragEnd={table.dndColumn.handleDragEnd}>
      <table>
        <thead>
          <tr>
            {table.columns.map(col => (
              <th key={col.id}>
                <Draggable id={col.id}>{col.header}</Draggable>
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
    </DndContext>
  );
}`}</code></pre>

      <h3>DndColumnApi Methods</h3>
      <table>
        <thead>
          <tr><th>Method</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>getColumnOrder()</code></td><td>Get the current column order</td></tr>
          <tr><td><code>getSortableColumnIds()</code></td><td>Get all column IDs that can be reordered</td></tr>
          <tr><td><code>setColumnOrder(updater)</code></td><td>Set column order directly</td></tr>
          <tr><td><code>reorderColumns(activeId, overId)</code></td><td>Move a column</td></tr>
          <tr><td><code>handleDragEnd(event)</code></td><td>Direct handler for DndContext</td></tr>
          <tr><td><code>resetColumnOrder()</code></td><td>Reset to original column order</td></tr>
        </tbody>
      </table>

      <h2>Combining Both</h2>
      <pre><code>{`const table = withDndColumn(
  withDndRow(
    usePivotTable({
      data,
      columns,
      plugins: [
        createDndRowPlugin(),
        createDndColumnPlugin(),
      ],
    }),
  ),
);`}</code></pre>

      <h2>DndRowState / DndColumnState</h2>
      <pre><code>{`interface DndRowState {
  rowOrder: string[];
}

interface DndColumnState {
  columnOrder: string[];
}`}</code></pre>

      <h2>Important Notes</h2>
      <ul>
        <li>Both plugins require <code>@dnd-kit/core</code> as a peer dependency</li>
        <li>Wrap your table in a <code>DndContext</code> provider</li>
        <li>Each draggable element needs a unique <code>id</code> prop matching the row/column ID</li>
        <li>Order arrays are normalized: unknown IDs are appended at the end</li>
        <li>Duplicate IDs are deduplicated automatically</li>
      </ul>

      <h2>See Also</h2>
      <ul>
        <li><a href="#/api-plugin-api">Plugin API</a></li>
        <li><a href="#/plugin-virtualization">Virtualization Plugin</a></li>
        <li><a href="#/guide-performance">Performance Guide</a></li>
      </ul>
    </DocPage>
  );
}

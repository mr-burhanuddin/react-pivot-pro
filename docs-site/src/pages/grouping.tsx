import { lazy } from 'react';
import type { DocRoute } from '@/App';
import { CodePreview } from '@/components/CodePreview';
import { ExampleRenderer } from '@/components/ExampleRenderer';
import groupingCode from '@/examples/Grouping.tsx?raw';

const Grouping = lazy(() => import('@/examples/Grouping'));

interface Props {
  route: DocRoute;
}

export default function GroupingPage({ route }: Props) {
  return (
    <article className="doc-page">
      <p className="callout">{route.description}</p>

      <h2 id="live-example">Live Example</h2>
      <p>
        Dynamic row grouping with interactive controls. Toggle grouping levels and see aggregated
        values calculated in real-time.
      </p>

      <CodePreview title="Dynamic Row Grouping" code={groupingCode}>
        <ExampleRenderer component={Grouping} />
      </CodePreview>

      <h2 id="how-it-works">How It Works</h2>
      <p>
        The grouping plugin transforms your flat data into a hierarchical structure. It adds
        synthetic group rows with metadata you can use to render expand/collapse controls.
      </p>

      <h2 id="installation">Installation</h2>
      <pre><code>{`import { createGroupingPlugin, withGrouping } from 'react-pivot-pro';

const table = usePivotTable({
  data,
  columns,
  plugins: [createGroupingPlugin()],
  initialState: {
    rowGrouping: ['region', 'category'],
  },
});

const groupedTable = withGrouping(table);`}</code></pre>

      <h2 id="group-metadata">Group Row Metadata</h2>
      <p>Group rows have special properties you can access via <code>row.original</code>:</p>
      <ul>
        <li>
          <code>__group</code> - Boolean, true for group rows
        </li>
        <li>
          <code>__depth</code> - Number indicating nesting level
        </li>
        <li>
          <code>__groupingValue</code> - The value being grouped on
        </li>
        <li>
          <code>__rowCount</code> - Number of child rows
        </li>
      </ul>

      <h2 id="api">API Reference</h2>
      <ul>
        <li>
          <code>table.grouping.setRowGrouping(columnIds)</code> - Set grouping columns
        </li>
        <li>
          <code>table.grouping.getRowGrouping()</code> - Get current grouping
        </li>
        <li>
          <code>table.grouping.toggleGroupExpanded(groupId)</code> - Toggle expand state
        </li>
        <li>
          <code>table.grouping.getIsGroupExpanded(groupId)</code> - Check expand state
        </li>
        <li>
          <code>table.grouping.resetGrouping()</code> - Clear all grouping
        </li>
      </ul>

      <h2 id="combine">Combining with Other Plugins</h2>
      <p>
        Grouping works with sorting and filtering. Filters apply to data before grouping, and sorting
        applies to both data rows and group rows.
      </p>
    </article>
  );
}

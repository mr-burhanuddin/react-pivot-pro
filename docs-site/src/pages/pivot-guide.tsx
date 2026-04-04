import { lazy } from 'react';
import type { DocRoute } from '@/App';
import { CodePreview } from '@/components/CodePreview';
import { ExampleRenderer } from '@/components/ExampleRenderer';
import pivotCode from '@/examples/PivotTable.tsx?raw';

const PivotTable = lazy(() => import('@/examples/PivotTable'));

interface Props {
  route: DocRoute;
}

export default function PivotGuidePage({ route }: Props) {
  return (
    <article className="doc-page">
      <p className="callout">{route.description}</p>

      <h2 id="live-example">Live Example</h2>
      <p>
        Interactive pivot table with configurable row/column grouping and multiple aggregation
        types. Toggle aggregations and column groupings in real-time.
      </p>

      <CodePreview title="Pivot Table with Multiple Aggregations" code={pivotCode}>
        <ExampleRenderer component={PivotTable} />
      </CodePreview>

      <h2 id="how-it-works">How It Works</h2>
      <p>
        The pivot plugin transforms data into a matrix structure with row headers, column headers,
        and aggregated values at intersections. It's similar to Excel or BI tool pivot tables.
      </p>

      <h2 id="installation">Installation</h2>
      <pre><code>{`import { createGroupingPlugin, withGrouping } from 'react-pivot-pro';
import { createPivotPlugin, withPivot } from 'react-pivot-pro';

const table = usePivotTable({
  data,
  columns,
  plugins: [createGroupingPlugin(), createPivotPlugin()],
  initialState: {
    rowGrouping: ['region'],
    columnGrouping: ['quarter'],
    pivotEnabled: true,
    pivotValues: [
      { id: 'amount', aggregation: 'sum' },
      { id: 'quantity', aggregation: 'avg' },
    ],
  },
});

const pivotTable = withPivot(withGrouping(table));
const result = pivotTable.pivot.getPivotResult();`}</code></pre>

      <h2 id="pivot-result">Pivot Result Structure</h2>
      <ul>
        <li>
          <code>rowHeaders</code> - Array of row path arrays (e.g., [['North America'], ['Europe']])
        </li>
        <li>
          <code>columnHeaders</code> - Array of column definitions with paths and keys
        </li>
        <li>
          <code>matrixByRowKey</code> - Map of row keys to column values
        </li>
      </ul>

      <h2 id="aggregations">Available Aggregations</h2>
      <ul>
        <li>
          <code>sum</code> - Sum of values
        </li>
        <li>
          <code>avg</code> - Average of values
        </li>
        <li>
          <code>count</code> - Count of rows
        </li>
        <li>
          <code>min</code> - Minimum value
        </li>
        <li>
          <code>max</code> - Maximum value
        </li>
      </ul>

      <h2 id="api">API Reference</h2>
      <ul>
        <li>
          <code>table.pivot.getPivotResult()</code> - Get current pivot matrix
        </li>
        <li>
          <code>table.pivot.setPivotValues(values)</code> - Update aggregations
        </li>
        <li>
          <code>table.pivot.togglePivot()</code> - Enable/disable pivot mode
        </li>
      </ul>
    </article>
  );
}

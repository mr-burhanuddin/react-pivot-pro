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

      <h2 id="pivot-values">Pivot Values</h2>
      <p>
        Pivot values define which measures are aggregated. Each value can specify an aggregation
        strategy such as `sum`, `avg`, `min`, `max`, or custom function keys.
      </p>

      <h2 id="when-to-use">When To Use</h2>
      <p>
        Use pivot mode when teams need matrix-style summaries by row and column dimensions, such as
        region by quarter performance.
      </p>

      <h2 id="key-concepts">Key Concepts</h2>
      <ul>
        <li>`rowGrouping` controls row header paths.</li>
        <li>`columnGrouping` controls generated pivot columns.</li>
        <li>`pivotEnabled` gates whether rows are transformed into pivot output.</li>
      </ul>

      <CodePreview title="Multi-column pivot aggregation" code={pivotCode}>
        <ExampleRenderer component={PivotTable} />
      </CodePreview>
    </article>
  );
}

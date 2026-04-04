import { lazy } from 'react';
import type { DocRoute } from '@/App';
import { CodePreview } from '@/components/CodePreview';
import { ExampleRenderer } from '@/components/ExampleRenderer';
import sortingFilteringCode from '@/examples/SortingFiltering.tsx?raw';

const SortingFiltering = lazy(() => import('@/examples/SortingFiltering'));

interface Props {
  route: DocRoute;
}

export default function SortingFilteringPage({ route }: Props) {
  return (
    <article className="doc-page">
      <p className="callout">{route.description}</p>

      <h2 id="column-sorting">Column Sorting</h2>
      <p>
        Sorting supports single and multi-sort modes. Toggle logic cycles ascending, descending,
        then cleared.
      </p>

      <h2 id="when-to-use">When To Use</h2>
      <p>
        Apply this stack when users need quick ad-hoc exploration without leaving context or
        opening a separate report builder.
      </p>

      <h2 id="key-concepts">Key Concepts</h2>
      <ul>
        <li>Filtering plugin runs before sorting in plugin order.</li>
        <li>Use global filter for broad matching and column filters for precision.</li>
        <li>State is fully controllable for URL syncing or persistence.</li>
      </ul>

      <CodePreview title="Interactive sorting and filtering" code={sortingFilteringCode}>
        <ExampleRenderer component={SortingFiltering} />
      </CodePreview>
    </article>
  );
}

import { lazy } from 'react';
import type { DocRoute } from '@/App';
import { CodePreview } from '@/components/CodePreview';
import { ExampleRenderer } from '@/components/ExampleRenderer';
import basicCode from '@/examples/BasicTable.tsx?raw';
import sortingFilteringCode from '@/examples/SortingFiltering.tsx?raw';
import groupingCode from '@/examples/Grouping.tsx?raw';
import pivotCode from '@/examples/PivotTable.tsx?raw';
import virtualCode from '@/examples/VirtualizedTable.tsx?raw';
import columnFeaturesCode from '@/examples/ColumnFeatures.tsx?raw';

const BasicTable = lazy(() => import('@/examples/BasicTable'));
const SortingFiltering = lazy(() => import('@/examples/SortingFiltering'));
const Grouping = lazy(() => import('@/examples/Grouping'));
const PivotTable = lazy(() => import('@/examples/PivotTable'));
const VirtualizedTable = lazy(() => import('@/examples/VirtualizedTable'));
const ColumnFeatures = lazy(() => import('@/examples/ColumnFeatures'));

interface Props {
  route: DocRoute;
}

export default function ExamplesPage({ route }: Props) {
  return (
    <article className="doc-page">
      <p className="callout">{route.description}</p>
      <p>
        Each example below is fully functional and built with the production hook/plugin APIs from
        this library.
      </p>

      <CodePreview title="1. Basic Table" code={basicCode}>
        <ExampleRenderer component={BasicTable} />
      </CodePreview>

      <CodePreview title="2. Sorting + Filtering" code={sortingFilteringCode}>
        <ExampleRenderer component={SortingFiltering} />
      </CodePreview>

      <CodePreview title="3. Row Grouping" code={groupingCode}>
        <ExampleRenderer component={Grouping} />
      </CodePreview>

      <CodePreview title="4. Pivot Table" code={pivotCode}>
        <ExampleRenderer component={PivotTable} />
      </CodePreview>

      <CodePreview title="5. Virtualization" code={virtualCode}>
        <ExampleRenderer component={VirtualizedTable} />
      </CodePreview>

      <CodePreview title="6. Column Features" code={columnFeaturesCode}>
        <ExampleRenderer component={ColumnFeatures} />
      </CodePreview>
    </article>
  );
}

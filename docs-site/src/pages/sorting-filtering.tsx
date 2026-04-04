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

      <h2 id="live-example">Live Example</h2>
      <p>
        Interactive sorting and filtering with multi-column support, global search, and debounced
        column filters.
      </p>

      <CodePreview title="Sorting and Filtering Demo" code={sortingFilteringCode}>
        <ExampleRenderer component={SortingFiltering} />
      </CodePreview>

      <h2 id="how-it-works">How It Works</h2>
      <p>
        Sorting and filtering are implemented as plugins that transform the row model. They run in
        sequence: filtering first, then sorting.
      </p>

      <h2 id="installation">Installation</h2>
      <pre><code>{`import { createSortingPlugin, withSorting } from 'react-pivot-pro';
import { createFilteringPlugin, withFiltering } from 'react-pivot-pro';

const table = usePivotTable({
  data,
  columns,
  plugins: [createSortingPlugin(), createFilteringPlugin()],
});

const sortableTable = withSorting(table);
const featureTable = withFiltering(sortableTable);`}</code></pre>

      <h2 id="sorting">Sorting</h2>
      <p>Click column headers to toggle sorting. Supports multi-column sorting.</p>
      <ul>
        <li>
          <code>table.sorting.toggleSorting(columnId)</code> - Cycle through asc, desc, cleared
        </li>
        <li>
          <code>table.sorting.getIsSorted(columnId)</code> - Returns 'asc', 'desc', or false
        </li>
        <li>
          <code>table.sorting.getSorting()</code> - Returns all active sort rules
        </li>
        <li>
          <code>table.sorting.clearSorting()</code> - Remove all sorting
        </li>
      </ul>

      <h2 id="filtering">Filtering</h2>
      <p>
        Filter at the column level or apply a global search across all columns. Filters are debounced
        for performance.
      </p>
      <ul>
        <li>
          <code>table.filtering.setGlobalFilter(value)</code> - Set global search term
        </li>
        <li>
          <code>table.filtering.setColumnFilter(columnId, value)</code> - Set column-specific filter
        </li>
        <li>
          <code>table.filtering.getColumnFilters()</code> - Get all active column filters
        </li>
        <li>
          <code>table.filtering.resetColumnFilters()</code> - Clear all filters
        </li>
      </ul>

      <h2 id="plugin-order">Plugin Order</h2>
      <p>
        Plugin order matters! Filters run before sorting, so you can sort filtered results. Add
        plugins in the order you want them to execute.
      </p>

      <h2 id="performance">Performance</h2>
      <ul>
        <li>Filters use O(1) Set lookups for fast column filter checks</li>
        <li>Sorting uses pre-extracted values to avoid closure allocation</li>
        <li>Global filter runs last for broadest matching</li>
      </ul>
    </article>
  );
}

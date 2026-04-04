import { lazy } from 'react';
import type { DocRoute } from '@/App';
import { CodePreview } from '@/components/CodePreview';
import { ExampleRenderer } from '@/components/ExampleRenderer';
import basicCode from '@/examples/BasicTable.tsx?raw';

const BasicTable = lazy(() => import('@/examples/BasicTable'));

interface Props {
  route: DocRoute;
}

export default function BasicUsagePage({ route }: Props) {
  return (
    <article className="doc-page">
      <p className="callout">{route.description}</p>

      <h2 id="live-example">Live Example</h2>
      <p>
        A basic table with column visibility controls, row selection, search filtering, and CSV export.
      </p>

      <CodePreview title="Basic Table with Toolbar" code={basicCode}>
        <ExampleRenderer component={BasicTable} />
      </CodePreview>

      <h2 id="how-it-works">How It Works</h2>
      <p>
        The <code>usePivotTable</code> hook returns a table instance with methods to access data and
        manage state. You render the table yourself using standard HTML elements - this is what
        "headless" means.
      </p>

      <h2 id="define-columns">Define Columns</h2>
      <p>
        Columns are defined using the <code>ColumnDef</code> type with <code>accessorKey</code> for
        simple field access or <code>accessorFn</code> for computed values.
      </p>

      <h2 id="read-data">Read Data</h2>
      <ul>
        <li>
          <code>table.getRowModel().rows</code> - Returns all transformed rows
        </li>
        <li>
          <code>table.getCoreRowModel().rows</code> - Returns untransformed rows
        </li>
        <li>
          <code>row.getValue(columnId)</code> - Get cell value for a row
        </li>
        <li>
          <code>row.original</code> - Access the original data object
        </li>
      </ul>

      <h2 id="key-concepts">Key Concepts</h2>
      <ul>
        <li>Use stable references (<code>useMemo</code>) for data, columns, and plugin arrays</li>
        <li>The table is fully headless - you control all rendering</li>
        <li>Plugins are optional and can be added incrementally</li>
      </ul>

      <h2 id="typescript">TypeScript Support</h2>
      <p>
        The library is written in TypeScript with full type safety. Define your data type once and
        get autocomplete across all APIs.
      </p>
    </article>
  );
}

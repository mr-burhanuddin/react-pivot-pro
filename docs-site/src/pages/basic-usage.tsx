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

      <h2 id="define-columns">Define Columns</h2>
      <p>
        Columns can use `accessorKey` for direct fields or `accessorFn` for computed values.
        Include feature flags like `enableSorting` and `enableFiltering` where needed.
      </p>

      <h2 id="when-to-use">When To Use</h2>
      <p>
        Start with this pattern for all tables, then add plugins only after your base rendering
        flow is stable.
      </p>

      <h2 id="key-concepts">Key Concepts</h2>
      <ul>
        <li>Use stable references (`useMemo`) for data, columns, and plugin arrays.</li>
        <li>Read transformed output with `table.getRowModel()`.</li>
        <li>Read untransformed rows with `table.getCoreRowModel()`.</li>
      </ul>

      <CodePreview title="Basic usage with typed columns" code={basicCode}>
        <ExampleRenderer component={BasicTable} />
      </CodePreview>
    </article>
  );
}

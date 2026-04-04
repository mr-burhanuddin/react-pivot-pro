import { lazy } from 'react';
import type { DocRoute } from '@/App';
import { CodePreview } from '@/components/CodePreview';
import { ExampleRenderer } from '@/components/ExampleRenderer';
import basicCode from '@/examples/BasicTable.tsx?raw';

const BasicTable = lazy(() => import('@/examples/BasicTable'));

interface Props {
  route: DocRoute;
}

export default function GettingStartedPage({ route }: Props) {
  return (
    <article className="doc-page">
      <p className="callout">{route.description}</p>
      <h2 id="core-model">What It Does</h2>
      <p>
        `usePivotTable` builds a typed row model from raw data and applies plugins in sequence.
        The hook stays headless, so you fully control markup and styling.
      </p>

      <h2 id="when-to-use">When To Use It</h2>
      <p>
        Use it when you need table behavior with strict TypeScript control and want to own UI
        rendering. It works especially well for internal analytics and operations dashboards.
      </p>

      <h2 id="key-concepts">Key Concepts</h2>
      <ul>
        <li>Columns describe how values are read from each data row.</li>
        <li>Plugins transform row output (sorting, filtering, grouping, pivoting).</li>
        <li>The returned row model is always ready for rendering in custom UI.</li>
      </ul>

      <CodePreview title="Quick Start Table" code={basicCode}>
        <ExampleRenderer component={BasicTable} />
      </CodePreview>
    </article>
  );
}

import { lazy } from 'react';
import type { DocRoute } from '@/App';
import { CodePreview } from '@/components/CodePreview';
import { ExampleRenderer } from '@/components/ExampleRenderer';
import virtualizedCode from '@/examples/VirtualizedTable.tsx?raw';

const VirtualizedTable = lazy(() => import('@/examples/VirtualizedTable'));

interface Props {
  route: DocRoute;
}

export default function VirtualizationPage({ route }: Props) {
  return (
    <article className="doc-page">
      <p className="callout">{route.description}</p>

      <h2 id="usevirtualrows">Virtual Rows</h2>
      <p>
        `useVirtualRows` maps a long row list to only visible DOM items. The hook reports virtual
        offsets and total content height.
      </p>

      <h2 id="when-to-use">When To Use</h2>
      <p>
        Use virtualization for datasets in the thousands where full DOM rendering hurts interaction
        and scroll performance.
      </p>

      <h2 id="key-concepts">Key Concepts</h2>
      <ul>
        <li>Render rows in an absolute-positioned container.</li>
        <li>Use overscan to reduce visible row popping during fast scroll.</li>
        <li>Keep row height estimates close to real height.</li>
      </ul>

      <CodePreview title="Large dataset virtualized rendering" code={virtualizedCode}>
        <ExampleRenderer component={VirtualizedTable} />
      </CodePreview>
    </article>
  );
}

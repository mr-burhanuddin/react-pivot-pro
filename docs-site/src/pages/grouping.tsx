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

      <h2 id="group-state">Group State</h2>
      <p>
        Grouping uses `rowGrouping` and `expandedGroups` in state. The plugin emits synthetic group
        rows with metadata like `__depth`, `__groupingValue`, and `__rowCount`.
      </p>

      <h2 id="when-to-use">When To Use</h2>
      <p>
        Use grouping to reveal hierarchy in long lists, for example region → category → product
        rollups.
      </p>

      <h2 id="key-concepts">Key Concepts</h2>
      <ul>
        <li>Group rows are regular rows with special metadata values.</li>
        <li>You can render custom expand/collapse controls per group row.</li>
        <li>Grouping can be combined with sorting and filtering plugins.</li>
      </ul>

      <CodePreview title="Nested row grouping with expand/collapse" code={groupingCode}>
        <ExampleRenderer component={Grouping} />
      </CodePreview>
    </article>
  );
}

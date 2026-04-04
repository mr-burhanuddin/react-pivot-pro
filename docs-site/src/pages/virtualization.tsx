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

      <h2 id="live-example">Live Example</h2>
      <p>
        Renders 50,000 rows with smooth scrolling. The example includes sorting
        and search filtering while maintaining 60fps performance.
      </p>

      <CodePreview title="Virtualized Table (50k rows)" code={virtualizedCode}>
        <ExampleRenderer component={VirtualizedTable} />
      </CodePreview>

      <h2 id="how-it-works">How It Works</h2>
      <p>
        The <code>useVirtualRows</code> hook wraps <code>@tanstack/virtual-core</code> to provide
        virtualized rendering. Only visible rows are rendered in the DOM, regardless of total
        dataset size.
      </p>

      <h2 id="installation">Installation</h2>
      <pre><code>{`import { useVirtualRows } from 'react-pivot-pro';

const { virtualRows, totalSize, virtualizer } = useVirtualRows({
  count: rows.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 38,
  overscan: 10,
});`}</code></pre>

      <h2 id="configuration">Configuration</h2>
      <ul>
        <li>
          <code>count</code> - Total number of rows
        </li>
        <li>
          <code>getScrollElement</code> - Function returning the scroll container
        </li>
        <li>
          <code>estimateSize</code> - Estimated row height (can vary by index)
        </li>
        <li>
          <code>overscan</code> - Extra rows to render above/below viewport
        </li>
        <li>
          <code>enabled</code> - Toggle virtualization on/off
        </li>
      </ul>

      <h2 id="rendering">Rendering</h2>
      <p>
        Render rows using absolute positioning with <code>transform: translateY()</code> for
        positioning. The hook provides <code>start</code>, <code>size</code>, and <code>index</code>
        for each virtual row.
      </p>

      <h2 id="performance">Performance Tips</h2>
      <ul>
        <li>Keep <code>estimateSize</code> close to actual average row height</li>
        <li>Increase <code>overscan</code> for smoother scrolling (costs more DOM nodes)</li>
        <li>Use <code>enabled</code> prop to disable for small datasets</li>
        <li>Combine with sorting/filtering plugins for full interactivity</li>
      </ul>
    </article>
  );
}

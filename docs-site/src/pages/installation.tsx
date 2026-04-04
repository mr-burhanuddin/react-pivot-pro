import type { DocRoute } from '@/App';

interface Props {
  route: DocRoute;
}

export default function InstallationPage({ route }: Props) {
  return (
    <article className="doc-page">
      <p className="callout">{route.description}</p>

      <h2 id="install-package">Install Package</h2>
      <p>Install the library and its peer dependencies in your React app.</p>
      <pre>
        <code>{`npm install react-pivot-pro react`}</code>
      </pre>

      <h2 id="peer-dependencies">Peer Dependencies</h2>
      <p>
        The following packages are included as dependencies and will be installed automatically:
      </p>
      <ul>
        <li><code>zustand</code> - State management</li>
        <li><code>@tanstack/virtual-core</code> - Virtualization support</li>
        <li><code>@dnd-kit/core</code> - Drag and drop functionality</li>
        <li><code>i18next</code> - Internationalization</li>
      </ul>

      <h2 id="typescript-setup">TypeScript Setup</h2>
      <p>
        Ensure your project uses <code>moduleResolution: "bundler"</code> or equivalent modern resolution.
        Keep strict mode enabled to get full generic inference for row data and plugin state.
      </p>
      <pre>
        <code>{`{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx"
  }
}`}</code>
      </pre>

      <h2 id="quick-start">Quick Start</h2>
      <pre>
        <code>{`import { usePivotTable } from 'react-pivot-pro';
import { createSortingPlugin, createFilteringPlugin } from 'react-pivot-pro';

const table = usePivotTable({
  data: myData,
  columns: [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'value', header: 'Value' },
  ],
  plugins: [createSortingPlugin(), createFilteringPlugin()],
});`}</code>
      </pre>

      <h2 id="key-concepts">Key Concepts</h2>
      <ul>
        <li><strong>Headless</strong> - Zero UI. You control the rendering completely.</li>
        <li><strong>Plugin-driven</strong> - Compose only features you need.</li>
        <li><strong>Type-safe</strong> - Full TypeScript generics for type inference.</li>
        <li><strong>Framework-agnostic state</strong> - Built on Zustand for easy integration.</li>
      </ul>
    </article>
  );
}

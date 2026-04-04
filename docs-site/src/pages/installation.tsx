import type { DocRoute } from '@/App';

interface Props {
  route: DocRoute;
}

export default function InstallationPage({ route }: Props) {
  return (
    <article className="doc-page">
      <p className="callout">{route.description}</p>

      <h2 id="install-package">Install Package</h2>
      <p>Install the library and its runtime dependencies in your React app.</p>
      <pre>
        <code>{`npm install react-pivot-pro react zustand`}</code>
      </pre>

      <h2 id="typescript-setup">TypeScript Setup</h2>
      <p>
        Ensure your project uses `moduleResolution: "bundler"` or equivalent modern resolution.
        Keep strict mode enabled to get full generic inference for row data and plugin state.
      </p>

      <h2 id="when-to-use">When To Use This Setup</h2>
      <p>
        This setup is ideal for Vite-based React apps that need a static client-only build with no
        SSR constraints.
      </p>

      <h2 id="key-concepts">Key Concepts</h2>
      <ul>
        <li>Core hook is exported from package root.</li>
        <li>Feature plugins are currently imported from plugin modules.</li>
        <li>You can compose only the features you need to keep bundle size small.</li>
      </ul>
    </article>
  );
}

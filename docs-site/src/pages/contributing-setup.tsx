import DocPage from "../components/DocPage";

export default function ContributingSetup() {
  return (
    <DocPage
      title="Development Setup"
      subtitle="Get your local environment ready for contributing to react-pivot-pro"
    >
      <h2>Prerequisites</h2>
      <ul>
        <li>Node.js 18+</li>
        <li>npm 9+</li>
        <li>Git</li>
      </ul>

      <h2>Clone and Install</h2>
      <pre>
        <code>{`git clone https://github.com/your-org/react-pivot-pro.git
cd react-pivot-pro
npm install`}</code>
      </pre>

      <h2>Available Scripts</h2>
      <table>
        <thead>
          <tr>
            <th>Command</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>npm run build</code>
            </td>
            <td>Build the library (outputs to dist/)</td>
          </tr>
          <tr>
            <td>
              <code>npm run dev</code>
            </td>
            <td>Watch mode for development</td>
          </tr>
          <tr>
            <td>
              <code>npm run build:types</code>
            </td>
            <td>Build types only</td>
          </tr>
          <tr>
            <td>
              <code>npm run typecheck</code>
            </td>
            <td>TypeScript type checking (no emit)</td>
          </tr>
          <tr>
            <td>
              <code>npm run lint</code>
            </td>
            <td>Run ESLint</td>
          </tr>
          <tr>
            <td>
              <code>npm run test</code>
            </td>
            <td>Run all tests in watch mode</td>
          </tr>
          <tr>
            <td>
              <code>npm run test:run</code>
            </td>
            <td>Run all tests once (CI mode)</td>
          </tr>
          <tr>
            <td>
              <code>npm run clean</code>
            </td>
            <td>Clean dist folder</td>
          </tr>
          <tr>
            <td>
              <code>npm run docs:dev</code>
            </td>
            <td>Start docs site locally</td>
          </tr>
        </tbody>
      </table>

      <h2>Project Structure</h2>
      <pre>
        <code>{`src/
├── core/              # Core engine
│   ├── usePivotTable.ts   # Main hook
│   └── pivotEngine.ts     # Pivot transformation
├── hooks/             # React hooks
│   ├── useVirtualRows.ts
│   └── useVirtualColumns.ts
├── plugins/           # Feature plugins
│   ├── sorting.ts
│   ├── filtering.ts
│   ├── grouping.ts
│   ├── aggregation/
│   ├── dndRow.ts
│   ├── dndColumn.ts
│   ├── columnVisibility.ts
│   ├── columnOrdering.ts
│   ├── columnPinning.ts
│   └── pivot.ts
├── store/             # Zustand store
│   └── pivotTableStore.ts
├── types/             # TypeScript types
│   ├── aggregation.ts
│   ├── column.ts
│   ├── plugin.ts
│   ├── row.ts
│   ├── state.ts
│   ├── table.ts
│   └── index.ts
├── utils/             # Utility functions
│   ├── aggregationFns.ts
│   ├── exportCSV.ts
│   ├── clipboard.ts
│   └── helpers.ts
└── index.ts           # Public API exports

docs-site/             # Documentation website
└── src/
    ├── pages/         # Documentation pages
    ├── components/    # Shared components
    └── App.tsx        # Router and layout`}</code>
      </pre>

      <h2>Running Tests</h2>
      <pre>
        <code>{`# Run all tests
npm run test

# Run a specific test file
npm run test -- src/core/pivotEngine.test.ts

# Run tests matching a pattern
npm run test -- -t "sorting"

# Run tests once (for CI)
npm run test:run`}</code>
      </pre>

      <h2>Code Style</h2>
      <ul>
        <li>TypeScript strict mode enabled</li>
        <li>ES modules with ESNext target</li>
        <li>kebab-case file names</li>
        <li>PascalCase for interfaces and types</li>
        <li>camelCase for functions and variables</li>
        <li>
          Use <code>import type</code> for type-only imports
        </li>
        <li>No comments unless asked</li>
      </ul>

      <h2>Before Submitting a PR</h2>
      <pre>
        <code>{`npm run typecheck
npm run lint
npm run test:run`}</code>
      </pre>

      <h2>Docs Development</h2>
      <pre>
        <code>{`cd docs-site
npm run dev`}</code>
      </pre>

      <h2>See Also</h2>
      <ul>
        <li>
          <a href="#/contributing-plugin-authoring">Plugin Authoring Guide</a>
        </li>
        <li>
          <a href="#/contributing-changelog">Changelog</a>
        </li>
        <li>
          <a href="#/api-plugin-api">Plugin API</a>
        </li>
      </ul>
    </DocPage>
  );
}

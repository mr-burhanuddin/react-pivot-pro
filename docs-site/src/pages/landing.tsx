import { useState, useCallback } from "react";

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

const FEATURES = [
  {
    icon: "⬡",
    title: "Headless UI",
    description:
      "Complete control over rendering. The library manages state and data transformation — you own the UI.",
  },
  {
    icon: "⚡",
    title: "Plugin System",
    description:
      "Modular architecture with createX/withX/useX pattern. Enable only what you need.",
  },
  {
    icon: "Σ",
    title: "Per-Column Aggregators",
    description:
      "Sum, average, count, and custom aggregations — configured independently per column.",
  },
  {
    icon: "◫",
    title: "Virtualization",
    description:
      "Handle 100K+ rows smoothly with @tanstack/virtual-core row and column virtualization.",
  },
  {
    icon: "↕",
    title: "Drag & Drop",
    description:
      "Reorder rows and columns with @dnd-kit/core integration. Full state persistence.",
  },
];

const PLUGIN_TABS = [
  {
    label: "Aggregation",
    code: `import { createAggregationPlugin, withAggregation } from 'react-pivot-pro';

const table = usePivotTable({
  data,
  columns,
  plugins: [createAggregationPlugin()],
});

const tableWithAgg = withAggregation(table);
tableWithAgg.aggregation.setColumnAggregator('amount', 'sum');`,
  },
  {
    label: "Sorting",
    code: `import { createSortingPlugin, withSorting } from 'react-pivot-pro';

const table = usePivotTable({
  data,
  columns,
  plugins: [createSortingPlugin()],
});

const tableWithSort = withSorting(table);
tableWithSort.sorting.toggleSorting('name');`,
  },
  {
    label: "Filtering",
    code: `import { createFilteringPlugin, withFiltering } from 'react-pivot-pro';

const table = usePivotTable({
  data,
  columns,
  plugins: [createFilteringPlugin()],
});

const tableWithFilter = withFiltering(table);
tableWithFilter.filtering.setGlobalFilter('search term');`,
  },
  {
    label: "Grouping",
    code: `import { createGroupingPlugin, withGrouping } from 'react-pivot-pro';

const table = usePivotTable({
  data,
  columns,
  plugins: [createGroupingPlugin()],
});

const tableWithGroup = withGrouping(table);
tableWithGroup.grouping.setRowGrouping(['region', 'category']);`,
  },
  {
    label: "DnD",
    code: `import { createDndRowPlugin, withDndRow } from 'react-pivot-pro';

const table = usePivotTable({
  data,
  columns,
  plugins: [createDndRowPlugin()],
});

const tableWithDnd = withDndRow(table);
// Use with @dnd-kit/core <DndContext>`,
  },
];

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState(0);

  const handleNav = useCallback(
    (path: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      onNavigate(path);
    },
    [onNavigate],
  );

  return (
    <div className="landing-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-badge">v1.x — Now with Aggregation Plugin</div>
            <h1 className="hero-title">
              Headless pivot tables
              <br />
              for React
            </h1>
            <p className="hero-subtitle">
              A plugin-driven engine that manages state and data transformation
              while you own the UI rendering. TypeScript-first, zero config.
            </p>
            <div className="hero-actions">
              <a
                href="#/quick-start"
                className="btn-primary"
                onClick={handleNav("/quick-start")}
              >
                Get started →
              </a>
              <a
                href="https://github.com/mr-burhanuddin/react-pivot-pro"
                target="_blank"
                rel="noreferrer"
                className="btn-outline"
              >
                View on GitHub
              </a>
            </div>
            <div className="stat-chips">
              <span className="stat-chip">Headless</span>
              <span className="stat-chip">TypeScript-first</span>
              <span className="stat-chip">Plugin-driven</span>
              <span className="stat-chip">Zero config</span>
            </div>
          </div>

          <div className="hero-demo">
            <div className="hero-demo-header">
              <div className="hero-demo-dot" />
              <div className="hero-demo-dot" />
              <div className="hero-demo-dot" />
            </div>
            <div className="hero-demo-body">
              <pre>
                <code>{`import { usePivotTable } from 'react-pivot-pro';

function MyPivotTable() {
  const table = usePivotTable({
    data: salesData,
    columns: [
      { id: 'region', header: 'Region',
        accessorKey: 'region' },
      { id: 'amount', header: 'Amount',
        accessorKey: 'amount' },
    ],
    plugins: [
      createAggregationPlugin(),
      createSortingPlugin(),
    ],
  });

  return (
    <table>
      <thead>
        {table.columns.map(col => (
          <th key={col.id}>{col.header}</th>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {table.columns.map(col => (
              <td>{row.values[col.id]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <h2 className="section-title">Everything you need</h2>
        <p className="section-subtitle">
          Built for developers who want full control without reinventing the
          wheel.
        </p>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Start */}
      <section className="quick-start">
        <div className="quick-start-inner">
          <h2>Get started in 60 seconds</h2>
          <div className="quick-start-steps">
            <div className="quick-step">
              <div className="quick-step-number">1</div>
              <h3>Install</h3>
              <p>Add the package to your project</p>
              <pre>
                <code>npm install react-pivot-pro</code>
              </pre>
            </div>
            <div className="quick-step">
              <div className="quick-step-number">2</div>
              <h3>Wrap</h3>
              <p>Create your table with plugins</p>
              <pre>
                <code>{`const table = usePivotTable({
  data, columns, plugins
});`}</code>
              </pre>
            </div>
            <div className="quick-step">
              <div className="quick-step-number">3</div>
              <h3>Render</h3>
              <p>Build your UI with full control</p>
              <pre>
                <code>{`{table.getRowModel().rows
  .map(row => <Row />)}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Plugin Showcase */}
      <section className="section">
        <h2 className="section-title">Plugin-driven architecture</h2>
        <p className="section-subtitle">
          Each plugin is self-contained. Enable only what you need.
        </p>
        <div className="plugin-tabs">
          {PLUGIN_TABS.map((tab, i) => (
            <button
              key={tab.label}
              className={`plugin-tab ${activeTab === i ? "active" : ""}`}
              onClick={() => setActiveTab(i)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="plugin-demo">
          <div className="plugin-demo-code">
            <pre>
              <code>{PLUGIN_TABS[activeTab].code}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>Built with React + TypeScript. MIT License.</p>
      </footer>
    </div>
  );
}

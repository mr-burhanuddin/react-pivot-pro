import DocPage from "../components/DocPage";

export default function CoreConceptsPage() {
  return (
    <DocPage
      title="Core Concepts"
      subtitle="Understand the architecture, data flow, and plugin lifecycle."
    >
      <h2>Headless Philosophy</h2>
      <p>
        react-pivot-pro is a <strong>headless</strong> library. It manages state
        and data transformation while you own the UI rendering. This means:
      </p>
      <ul>
        <li>No prescribed HTML structure</li>
        <li>No built-in table components</li>
        <li>Complete styling control</li>
        <li>Works with any UI framework that supports React</li>
      </ul>

      <h2>Architecture Overview</h2>
      <p>The library follows a plugin-driven architecture:</p>
      <pre>
        <code>{`┌─────────────────────────────────────┐
│         usePivotTable()             │
│  ┌───────────────────────────────┐  │
│  │  Core Engine                  │  │
│  │  - Column normalization       │  │
│  │  - Row model building         │  │
│  │  - Plugin orchestration       │  │
│  └───────────────────────────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌───────┐  │
│  │Sorting  │ │Filtering│ │Pivot  │  │
│  │Plugin   │ │Plugin   │ │Plugin │  │
│  └─────────┘ └─────────┘ └───────┘  │
└─────────────────────────────────────┘`}</code>
      </pre>

      <h2>Plugin Lifecycle</h2>
      <p>Each plugin can implement four lifecycle hooks:</p>
      <table>
        <thead>
          <tr>
            <th>Hook</th>
            <th>When Called</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>getInitialState</code>
            </td>
            <td>On table creation</td>
            <td>Initialize plugin state</td>
          </tr>
          <tr>
            <td>
              <code>transformRows</code>
            </td>
            <td>Each render</td>
            <td>Transform row data (sort, filter, group)</td>
          </tr>
          <tr>
            <td>
              <code>transformColumns</code>
            </td>
            <td>Each render</td>
            <td>Transform column definitions</td>
          </tr>
          <tr>
            <td>
              <code>onStateChange</code>
            </td>
            <td>State updates</td>
            <td>React to state changes, validate</td>
          </tr>
        </tbody>
      </table>

      <h2>State Model</h2>
      <p>
        The library supports both controlled and uncontrolled state patterns:
      </p>
      <pre>
        <code>{`// Uncontrolled (internal state)
const table = usePivotTable({ data, columns });

// Controlled (external state)
const table = usePivotTable({
  data,
  columns,
  state: { sorting: mySorting },
  onStateChange: (next, prev) => setSorting(next.sorting),
});`}</code>
      </pre>

      <h2>See Also</h2>
      <ul>
        <li>
          <a href="#/api/use-pivot-table">usePivotTable API</a>
        </li>
        <li>
          <a href="#/api/plugin-api">Plugin API Reference</a>
        </li>
        <li>
          <a href="#/quick-start">Quick Start</a>
        </li>
      </ul>
    </DocPage>
  );
}

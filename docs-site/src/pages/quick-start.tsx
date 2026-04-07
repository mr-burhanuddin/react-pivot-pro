import DocPage from "../components/DocPage";

export default function QuickStartPage() {
  return (
    <DocPage
      title="Quick Start"
      subtitle="Install and build your first pivot table in under 60 seconds."
    >
      <h2>Installation</h2>
      <pre>
        <code>{`npm install react-pivot-pro`}</code>
      </pre>

      <h2>Peer Dependencies</h2>
      <p>Ensure you have React 18+ installed:</p>
      <pre>
        <code>{`npm install react react-dom`}</code>
      </pre>

      <h2>Your First Pivot Table</h2>
      <pre>
        <code>{`import { usePivotTable } from 'react-pivot-pro';

interface Sale {
  region: string;
  product: string;
  amount: number;
}

function PivotTable() {
  const table = usePivotTable<Sale>({
    data: salesData,
    columns: [
      { id: 'region', header: 'Region', accessorKey: 'region' },
      { id: 'product', header: 'Product', accessorKey: 'product' },
      { id: 'amount', header: 'Amount', accessorKey: 'amount' },
    ],
  });

  return (
    <table>
      <thead>
        <tr>
          {table.columns.map(col => (
            <th key={col.id}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {table.columns.map(col => (
              <td key={col.id}>{String(row.values[col.id])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}`}</code>
      </pre>

      <h2>Next Steps</h2>
      <ul>
        <li>
          <a href="#/core-concepts">Core Concepts</a> — Understand the
          architecture
        </li>
        <li>
          <a href="#/plugins/aggregation">Aggregation Plugin</a> — Add
          per-column aggregations
        </li>
        <li>
          <a href="#/plugins/sorting">Sorting Plugin</a> — Enable column sorting
        </li>
      </ul>
    </DocPage>
  );
}

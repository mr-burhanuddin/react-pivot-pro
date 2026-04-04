import type { DocRoute } from '@/App';

interface Props {
  route: DocRoute;
}

export default function UtilitiesPage({ route }: Props) {
  return (
    <article className="doc-page">
      <p className="callout">{route.description}</p>

      <h2 id="export-csv">Export to CSV</h2>
      <p>
        Export table data to CSV format for use in spreadsheets or data analysis tools.
      </p>

      <h3 id="export-example">Example</h3>
      <pre>
        <code>{`import { exportCSV } from 'react-pivot-pro';

const handleExport = () => {
  const rows = table.getRowModel().rows.map(row => ({
    name: row.original.name,
    amount: row.original.amount,
    date: row.original.date,
  }));
  
  exportCSV({ 
    rows, 
    fileName: 'exported-data',
    delimiter: ',', // optional, defaults to ','
  }).download(); // Don't forget to call .download()
};`}</code>
      </pre>

      <h3 id="export-options">Options</h3>
      <ul>
        <li><code>rows</code> - Array of objects to export</li>
        <li><code>fileName</code> - Output filename (without extension)</li>
        <li><code>delimiter</code> - CSV delimiter (default: ',')</li>
        <li><code>columns</code> - Optional column definitions</li>
      </ul>

      <h3 id="serialize-csv">serializeCSV</h3>
      <p>
        If you need the CSV string without downloading:
      </p>
      <pre>
        <code>{`import { serializeCSV } from 'react-pivot-pro';

const csvString = serializeCSV({
  rows: myData,
  delimiter: ';',
});

// Use the string however you need
console.log(csvString);`}</code>
      </pre>

      <h2 id="clipboard">Clipboard Operations</h2>
      <p>
        Copy data to clipboard with the <code>copyToClipboard</code> utility.
      </p>

      <h3 id="clipboard-example">Example</h3>
      <pre>
        <code>{`import { copyToClipboard } from 'react-pivot-pro';

const handleCopy = async () => {
  const success = await copyToClipboard('Copied text!');
  if (success) {
    console.log('Copied to clipboard');
  }
};

// Copy formatted data
const handleCopyTable = async () => {
  const text = table.getRowModel().rows
    .map(row => \`\${row.original.name}, \${row.original.amount}\`)
    .join('\\n');
  
  await copyToClipboard(text);
};`}</code>
      </pre>

      <h3 id="fullscreen">Fullscreen</h3>
      <p>
        Toggle fullscreen mode for tables or containers.
      </p>
      <pre>
        <code>{`import { fullscreen } from 'react-pivot-pro';

// Check if fullscreen is supported
if (fullscreen.isSupported()) {
  // Request fullscreen on an element
  await fullscreen.request(document.getElementById('table-container'));
  
  // Check current state
  const isFs = fullscreen.isFullscreen();
  
  // Exit fullscreen
  await fullscreen.exit();
  
  // Toggle (request if not in fullscreen, exit if in fullscreen)
  await fullscreen.toggle(document.getElementById('table-container'));
  
  // Listen to fullscreen changes
  const unsubscribe = fullscreen.onChange((isFullscreen) => {
    console.log('Fullscreen changed:', isFullscreen);
  });
  
  // Cleanup
  unsubscribe();
}`}</code>
      </pre>

      <h2 id="aggregation-functions">Aggregation Functions</h2>
      <p>
        Built-in aggregation functions for pivot tables and grouping.
      </p>

      <h3 id="available-aggregations">Available Functions</h3>
      <pre>
        <code>{`import { 
  sum, 
  avg, 
  count, 
  min, 
  max,
  median,
  unique,
  first,
  last 
} from 'react-pivot-pro';

// sum - Sum of values
const totalRevenue = sum([100, 200, 300]); // 600

// avg - Average of values
const averagePrice = avg([10, 20, 30]); // 20

// count - Count of items
const itemCount = count([1, 2, 3, 4, 5]); // 5

// min - Minimum value
const lowest = min([5, 3, 8, 1, 9]); // 1

// max - Maximum value
const highest = max([5, 3, 8, 1, 9]); // 9

// median - Middle value
const middle = median([1, 2, 3, 4, 5]); // 3

// unique - Count of unique values
const uniqueCount = unique(['a', 'b', 'a', 'c']); // 3

// first - First value
const firstItem = first([10, 20, 30]); // 10

// last - Last value
const lastItem = last([10, 20, 30]); // 30`}</code>
      </pre>

      <h3 id="custom-aggregation">Custom Aggregation</h3>
      <p>
        Create custom aggregation functions:
      </p>
      <pre>
        <code>{`import type { AggregationFn } from 'react-pivot-pro';

const weightedAverage: AggregationFn<MyData> = (values, rows) => {
  if (values.length === 0) return 0;
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  values.forEach((value, index) => {
    const weight = rows[index].original.weight ?? 1;
    weightedSum += value * weight;
    totalWeight += weight;
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
};

// Use in pivot configuration
createPivotPlugin({
  aggregationFns: {
    weightedAvg: weightedAverage,
  },
})`}</code>
      </pre>

      <h2 id="row-model">Row Model</h2>
      <p>
        Access processed table data through the row model.
      </p>
      <pre>
        <code>{`const rowModel = table.getRowModel();

// All processed rows
const rows = rowModel.rows;

// Flat array of all rows
const flatRows = rowModel.flatRows;

// Map of rows by ID
const rowsById = rowModel.rowsById;

// Access specific row
const row = rowsById['row-123'];
if (row) {
  const value = row.original.amount;
  const cellValue = row.getValue('amount');
}`}</code>
      </pre>

      <h2 id="state-management">State Management</h2>
      <p>
        React Pivot Pro uses Zustand for state management. Access the store directly if needed:
      </p>
      <pre>
        <code>{`import { createPivotTableStore } from 'react-pivot-pro';

// Create a standalone store
const store = createPivotTableStore({
  sorting: [],
  filters: [],
  columnVisibility: {},
  rowSelection: {},
  expanded: {},
});

// Subscribe to changes
store.subscribe((state) => {
  console.log('State changed:', state.state);
});

// Update state
store.getState().setState({ sorting: [{ id: 'name', desc: true }] });`}</code>
      </pre>
    </article>
  );
}

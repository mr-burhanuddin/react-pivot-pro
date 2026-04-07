import DocPage from "../components/DocPage";

export default function PluginAggregation() {
  return (
    <DocPage
      title="Aggregation Plugin"
      subtitle="Compute aggregate values (sum, avg, median, etc.) across grouped or pivoted data"
    >
      <h2>Overview</h2>
      <p>
        The aggregation plugin provides 11 built-in aggregator functions and
        supports custom aggregators. It integrates with the grouping and pivot
        plugins to compute subtotals and grand totals.
      </p>

      <h2>Installation</h2>
      <pre>
        <code>{`import {
  createAggregationPlugin,
  withAggregation,
  usePivotAggregation,
  AggregatorDropdown,
  sum, count, avg, min, max,
  median, stddev, variance,
  pctOfTotal, runningTotal, countDistinct,
  aggregationFns,
  AGGREGATOR_LABELS,
} from 'react-pivot-pro';`}</code>
      </pre>

      <h2>Usage</h2>
      <pre>
        <code>{`const table = usePivotTable<Sale>({
  data,
  columns,
  plugins: [
    createAggregationPlugin({
      defaultAggregator: 'sum',
      autoAggregateColumns: ['amount', 'quantity'],
    }),
  ],
});

// Augment with aggregation API
const enhanced = withAggregation(table);
const { aggregation } = enhanced;`}</code>
      </pre>

      <h2>AggregationApi Methods</h2>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>getColumnAggregator(id)</code>
            </td>
            <td>Get the aggregator for a column</td>
          </tr>
          <tr>
            <td>
              <code>getColumnAggregators()</code>
            </td>
            <td>Get all column aggregators as a record</td>
          </tr>
          <tr>
            <td>
              <code>setColumnAggregator(id, updater)</code>
            </td>
            <td>Set aggregator for a single column</td>
          </tr>
          <tr>
            <td>
              <code>setColumnAggregators(updater)</code>
            </td>
            <td>Set aggregators for multiple columns</td>
          </tr>
          <tr>
            <td>
              <code>registerFn(name, fn)</code>
            </td>
            <td>Register a custom aggregation function</td>
          </tr>
          <tr>
            <td>
              <code>unregisterFn(name)</code>
            </td>
            <td>Remove a custom aggregation function</td>
          </tr>
          <tr>
            <td>
              <code>getRegisteredFns()</code>
            </td>
            <td>Get all registered aggregation functions</td>
          </tr>
          <tr>
            <td>
              <code>resetColumnAggregators()</code>
            </td>
            <td>Reset all column aggregators to defaults</td>
          </tr>
          <tr>
            <td>
              <code>getAggregatedValue(id)</code>
            </td>
            <td>Get the aggregated value for a column</td>
          </tr>
          <tr>
            <td>
              <code>getGrandTotal(id)</code>
            </td>
            <td>Get the grand total for a column</td>
          </tr>
        </tbody>
      </table>

      <h2>Built-in Aggregators</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Label</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>sum</code>
            </td>
            <td>Sum</td>
            <td>Sum of all numeric values. Returns null if no valid values.</td>
          </tr>
          <tr>
            <td>
              <code>count</code>
            </td>
            <td>Count</td>
            <td>Total count of all values including nulls.</td>
          </tr>
          <tr>
            <td>
              <code>avg</code>
            </td>
            <td>Average</td>
            <td>Arithmetic mean of numeric values.</td>
          </tr>
          <tr>
            <td>
              <code>min</code>
            </td>
            <td>Minimum</td>
            <td>Smallest numeric value.</td>
          </tr>
          <tr>
            <td>
              <code>max</code>
            </td>
            <td>Maximum</td>
            <td>Largest numeric value.</td>
          </tr>
          <tr>
            <td>
              <code>median</code>
            </td>
            <td>Median</td>
            <td>
              Middle value when sorted. Average of two middle values for even
              count.
            </td>
          </tr>
          <tr>
            <td>
              <code>stddev</code>
            </td>
            <td>Std Deviation</td>
            <td>Sample standard deviation (n-1 denominator).</td>
          </tr>
          <tr>
            <td>
              <code>variance</code>
            </td>
            <td>Variance</td>
            <td>Sample variance (n-1 denominator).</td>
          </tr>
          <tr>
            <td>
              <code>pctOfTotal</code>
            </td>
            <td>% of Total</td>
            <td>
              Returns the grand total (used contextually for percentage
              calculations).
            </td>
          </tr>
          <tr>
            <td>
              <code>runningTotal</code>
            </td>
            <td>Running Total</td>
            <td>Cumulative sum of all numeric values.</td>
          </tr>
          <tr>
            <td>
              <code>countDistinct</code>
            </td>
            <td>Count Distinct</td>
            <td>Count of unique non-null values.</td>
          </tr>
        </tbody>
      </table>

      <h2>Custom Aggregator</h2>
      <pre>
        <code>{`import { createAggregationPlugin } from 'react-pivot-pro';

const table = usePivotTable<Sale>({
  data,
  columns,
  plugins: [createAggregationPlugin()],
});

const { aggregation } = withAggregation(table);

// Register a weighted average
aggregation.registerFn('weightedAvg', (values) => {
  // values are the raw cell values for this column
  const nums = values.map(v => Number(v)).filter(n => !Number.isNaN(n));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
});

// Use it
aggregation.setColumnAggregator('revenue', 'weightedAvg');`}</code>
      </pre>

      <h2>AggregatorDropdown Component</h2>
      <p>A ready-made dropdown for selecting aggregators per column:</p>
      <pre>
        <code>{`import { AggregatorDropdown } from 'react-pivot-pro';

<AggregatorDropdown
  columnId="amount"
  aggregation={table.aggregation}
/>`}</code>
      </pre>

      <h2>AggregationFnName Type</h2>
      <pre>
        <code>{`type AggregationFnName =
  | 'sum'
  | 'count'
  | 'avg'
  | 'min'
  | 'max'
  | 'median'
  | 'stddev'
  | 'variance'
  | 'pctOfTotal'
  | 'runningTotal'
  | 'countDistinct';`}</code>
      </pre>

      <h2>Plugin Options</h2>
      <pre>
        <code>{`interface AggregationPluginOptions {
  defaultAggregator?: AggregationFnName;
  autoAggregateColumns?: string[];
  workerThreshold?: number;
}`}</code>
      </pre>

      <h2>See Also</h2>
      <ul>
        <li>
          <a href="#/plugin-grouping">Row Grouping Plugin</a>
        </li>
        <li>
          <a href="#/api-plugin-api">Plugin API</a>
        </li>
        <li>
          <a href="#/guide-recipes">Copy-Paste Recipes</a>
        </li>
      </ul>
    </DocPage>
  );
}

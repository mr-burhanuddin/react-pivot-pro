import DocPage from "../components/DocPage";

export default function GuideI18n() {
  return (
    <DocPage
      title="Internationalization (i18n)"
      subtitle="Translate headers, labels, and UI text in your pivot tables"
    >
      <h2>Overview</h2>
      <p>
        react-pivot-pro is headless, meaning all UI rendering is controlled by
        you. This makes i18n straightforward — use your preferred translation
        library (i18next, react-intl, etc.) to translate any text in your table.
      </p>

      <h2>With i18next</h2>
      <pre>
        <code>{`import { useTranslation } from 'react-i18next';
import { usePivotTable, createSortingPlugin, withSorting } from 'react-pivot-pro';

function I18nTable({ data }) {
  const { t } = useTranslation('table');

  const columns = [
    { id: 'region', accessorKey: 'region', header: t('columns.region') },
    { id: 'product', accessorKey: 'product', header: t('columns.product') },
    { id: 'amount', accessorKey: 'amount', header: t('columns.amount') },
  ];

  const table = withSorting(
    usePivotTable({
      data,
      columns,
      plugins: [createSortingPlugin()],
    }),
  );

  return (
    <table>
      <thead>
        <tr>
          {table.columns.map(col => (
            <th key={col.id} onClick={() => table.sorting.toggleSorting(col.id)}>
              {col.header}
              {table.sorting.getIsSorted(col.id) === 'asc' && t('sort.asc')}
              {table.sorting.getIsSorted(col.id) === 'desc' && t('sort.desc')}
            </th>
          ))}
        </tr>
      </thead>
      {/* ... */}
    </table>
  );
}`}</code>
      </pre>

      <h2>Translation File Example</h2>
      <pre>
        <code>{`// en/table.json
{
  "columns": {
    "region": "Region",
    "product": "Product",
    "amount": "Amount"
  },
  "sort": {
    "asc": " ↑",
    "desc": " ↓"
  },
  "filter": {
    "placeholder": "Filter...",
    "globalPlaceholder": "Search all columns..."
  },
  "grouping": {
    "expand": "Expand",
    "collapse": "Collapse",
    "rows": "{{count}} rows"
  }
}

// es/table.json
{
  "columns": {
    "region": "Región",
    "product": "Producto",
    "amount": "Monto"
  },
  "sort": {
    "asc": " ↑",
    "desc": " ↓"
  },
  "filter": {
    "placeholder": "Filtrar...",
    "globalPlaceholder": "Buscar en todas las columnas..."
  },
  "grouping": {
    "expand": "Expandir",
    "collapse": "Colapsar",
    "rows": "{{count}} filas"
  }
}`}</code>
      </pre>

      <h2>Dynamic Column Headers</h2>
      <p>
        When column definitions depend on translations, memoize them with the
        locale as a dependency:
      </p>
      <pre>
        <code>{`const { t, i18n } = useTranslation('table');

const columns = useMemo(() => [
  { id: 'region', accessorKey: 'region', header: t('columns.region') },
  { id: 'product', accessorKey: 'product', header: t('columns.product') },
  { id: 'amount', accessorKey: 'amount', header: t('columns.amount') },
], [t, i18n.language]);`}</code>
      </pre>

      <h2>RTL Support</h2>
      <p>
        For right-to-left languages, adjust table styling based on the current
        locale direction:
      </p>
      <pre>
        <code>{`const { i18n } = useTranslation();
const isRTL = i18n.dir() === 'rtl';

<table dir={isRTL ? 'rtl' : 'ltr'}>
  {/* Table content */}
</table>`}</code>
      </pre>

      <h2>Number and Date Formatting</h2>
      <p>Use Intl APIs for locale-aware formatting of cell values:</p>
      <pre>
        <code>{`const formatCurrency = (value, locale = 'en-US', currency = 'USD') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
};

const formatDate = (value, locale = 'en-US') => {
  return new Intl.DateTimeFormat(locale).format(new Date(value));
};

// In column definition
{
  id: 'amount',
  accessorKey: 'amount',
  header: t('columns.amount'),
  cell: (val) => formatCurrency(val, i18n.language),
}`}</code>
      </pre>

      <h2>Aggregator Labels</h2>
      <p>
        The built-in <code>AGGREGATOR_LABELS</code> can be overridden for custom
        translations:
      </p>
      <pre>
        <code>{`import { AGGREGATOR_LABELS } from 'react-pivot-pro';

// Create translated labels
const translatedLabels = {
  sum: t('aggregation.sum'),
  count: t('aggregation.count'),
  avg: t('aggregation.avg'),
  // ...
};`}</code>
      </pre>

      <h2>See Also</h2>
      <ul>
        <li>
          <a href="#/api-column-def">ColumnDef Type</a>
        </li>
        <li>
          <a href="#/plugin-aggregation">Aggregation Plugin</a>
        </li>
        <li>
          <a href="#/guide-recipes">Copy-Paste Recipes</a>
        </li>
      </ul>
    </DocPage>
  );
}

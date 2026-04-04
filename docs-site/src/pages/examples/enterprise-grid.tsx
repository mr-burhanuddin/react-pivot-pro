import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import { createSortingPlugin, withSorting, type SortingTableState } from '@pivot/plugins/sorting';
import { createFilteringPlugin, withFiltering, type FilteringTableState, type FilteringApi } from '@pivot/plugins/filtering';
import { useVirtualRows } from '@pivot/hooks/useVirtualRows';
import { CodePreview } from '@/components/CodePreview';
import { generateData } from '@/examples/mockData';
import { Download, Search } from 'lucide-react';

const exampleCode = `
import { usePivotTable } from 'react-pivot-pro';
import { createSortingPlugin, createFilteringPlugin, withSorting, withFiltering } from 'react-pivot-pro';
import { exportCSV } from 'react-pivot-pro';

const table = usePivotTable({
  data,
  columns,
  plugins: [createSortingPlugin(), createFilteringPlugin()],
});

const tableWithFeatures = withSorting(withFiltering(table));
exportCSV({ rows: table.getRowModel().rows });
`;

type LocalState = SortingTableState & FilteringTableState;
type FeatureTable = ReturnType<typeof withSorting<any, LocalState>> & ReturnType<typeof withFiltering<any, LocalState>>;

export default function EnterpriseGrid() {
  const [data] = useState(() => generateData(1000));
  const [globalFilter, setGlobalFilter] = useState('');

  const filteringApiRef = useRef<FilteringApi<any, LocalState> | null>(null);

  const columns = useMemo(() => [
    { id: 'id', header: 'Transaction ID', accessorKey: 'id', enableSorting: true },
    { id: 'date', header: 'Date', accessorKey: 'date', enableSorting: true },
    { id: 'company', header: 'Company', accessorKey: 'company', enableSorting: true },
    { id: 'account', header: 'Account', accessorKey: 'account', enableSorting: true },
    { 
      id: 'amount', 
      header: 'Amount', 
      accessorKey: 'amount', 
      enableSorting: true,
    },
    { id: 'status', header: 'Status', accessorKey: 'status', enableSorting: true },
  ], []);

  const baseTable = usePivotTable<any, LocalState>({
    data,
    columns,
    plugins: [createSortingPlugin(), createFilteringPlugin()],
  });

  const table = useMemo((): FeatureTable => {
    const withFilteringTable = withFiltering<any, LocalState>(baseTable);
    const withSortingTable = withSorting<any, LocalState>(withFilteringTable);
    if (!filteringApiRef.current) {
      filteringApiRef.current = withFilteringTable.filtering;
    }
    return withSortingTable as FeatureTable;
  }, [baseTable]);

  useEffect(() => {
    if (filteringApiRef.current) {
      const currentFilter = filteringApiRef.current.getGlobalFilter();
      if (currentFilter !== globalFilter) {
        filteringApiRef.current.setGlobalFilter(globalFilter);
      }
    }
  }, [globalFilter]);

  const containerRef = useRef<HTMLDivElement>(null);
  const getScrollElement = useCallback(() => containerRef.current, []);
  const estimateSize = useCallback(() => 44, []);

  const { virtualRows, totalSize } = useVirtualRows({
    count: table.getRowModel().rows.length,
    getScrollElement,
    estimateSize,
  });

  const handleExport = () => {
    const rows = table.getRowModel().rows.slice(0, 100).map(row => {
      const obj: Record<string, unknown> = {};
      table.columns.forEach(col => {
        obj[col.header ?? col.id] = row.getValue(col.id);
      });
      return obj;
    });
    import('@pivot/utils/index').then(({ exportCSV }) => {
      exportCSV({ rows });
    });
  };

  return (
    <div className="doc-page">
      <header>
        <h1 className="page-title">Enterprise Data Grid</h1>
        <p className="page-desc">A full-featured data grid demonstrating sorting, filtering, virtualization, and CSV export.</p>
      </header>

      <CodePreview title="Enterprise Data Grid Demo" code={exampleCode}>
        <div className="advanced-grid">
          <div className="advanced-toolbar">
            <div className="toolbar-group">
              <div className="search">
                <Search size={16} style={{ position: 'absolute', left: 10, top: 8, color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                  placeholder="Search across all columns..." 
                  className="search-input"
                  style={{ paddingLeft: 34 }}
                />
              </div>
            </div>
            <div className="toolbar-group">
              <button 
                className="ghost-btn icon-btn"
                onClick={() => {
                  setGlobalFilter('');
                  table.filtering.resetGlobalFilter();
                }}
              >
                Reset
              </button>
              <button className="btn-primary" onClick={handleExport}>
                <Download size={16} /> Export
              </button>
            </div>
          </div>
          <div ref={containerRef} className="table-shell" style={{ height: 400, overflow: 'auto', border: 'none', borderRadius: 0 }}>
            <table className="demo-table">
              <thead>
                <tr>
                  {table.columns.map((column) => (
                    <th 
                      key={column.id} 
                      onClick={() => table.sorting.toggleSorting(column.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {column.header ?? column.id}
                        {table.sorting.getIsSorted(column.id) === 'asc' && ' ↑'}
                        {table.sorting.getIsSorted(column.id) === 'desc' && ' ↓'}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.getRowModel().rows.slice(0, 100).map((row) => (
                  <tr key={row.id}>
                    {table.columns.map((column) => (
                      <td key={column.id}>
                        {column.id === 'amount'
                          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(row.getValue<number>(column.id) ?? 0)
                          : String(row.getValue(column.id) ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CodePreview>
    </div>
  );
}

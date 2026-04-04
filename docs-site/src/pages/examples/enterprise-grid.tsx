import { useMemo, useState, useRef } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import { useSorting } from '@pivot/plugins/sorting';
import { useFiltering } from '@pivot/plugins/filtering';
import { useVirtualRows } from '@pivot/hooks/useVirtualRows';
import { CodePreview } from '@/components/CodePreview';
import { generateData } from '@/examples/mockData';
import { Download, Filter, Search, Columns } from 'lucide-react';

const exampleCode = `
import { usePivotTable } from 'react-pivot-pro/core';
import { useSorting, useFiltering, useVirtualRows } from 'react-pivot-pro/plugins';
// ... full implementation with toolbar and grid
`;

export default function EnterpriseGrid() {
  const [data] = useState(() => generateData(1000));
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo(() => [
    { id: 'id', header: 'Transaction ID', accessorKey: 'id', width: 140 },
    { id: 'date', header: 'Date', accessorKey: 'date', width: 120 },
    { id: 'company', header: 'Company', accessorKey: 'company', width: 160 },
    { id: 'account', header: 'Account', accessorKey: 'account', width: 140 },
    { 
      id: 'amount', 
      header: 'Amount', 
      accessorKey: 'amount', 
      width: 120,
      cell: (val: number) => (
        <span style={{ color: val < 0 ? 'var(--danger)' : 'inherit', fontWeight: 500 }}>
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)}
        </span>
      )
    },
    { 
      id: 'status', 
      header: 'Status', 
      accessorKey: 'status', 
      width: 120,
      cell: (val: string) => (
        <span className={`status-badge ${val === 'Completed' ? 'success' : val === 'Pending' ? 'warning' : 'danger'}`}>
          {val}
        </span>
      )
    },
  ], []);

  const sorting = useSorting();
  const filtering = useFiltering();

  const table = usePivotTable({
    data,
    columns,
    plugins: [sorting, filtering],
    state: {
      globalFilter
    } as any  });

  const containerRef = useRef<HTMLDivElement>(null);

  useVirtualRows({
    count: table.getRowModel().rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 44,
  });

  return (
    <div className="doc-page">
      <header>
        <h1 className="page-title">Enterprise Data Grid</h1>
        <p className="page-desc">A full-featured data grid demonstrating sorting, filtering, rendering optimizations, and a custom toolbar.</p>
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
              <button className="ghost-btn icon-btn"><Filter size={16} /> Filters</button>
              <button className="ghost-btn icon-btn"><Columns size={16} /> Columns</button>
              <button className="btn-primary"><Download size={16} /> Export</button>
            </div>
          </div>
          <div ref={containerRef} className="table-shell" style={{ height: 400, overflow: 'auto', border: 'none', borderRadius: 0 }}>
            <table className="demo-table">
              <thead>
                <tr>
                  {table.columns.map((column: any) => (
                    <th 
                      key={column.id} 
                      style={{ width: column.width }}
                      onClick={() => table.setState?.((p: any) => ({ ...p, sorting: [{ id: column.id, desc: false }] }))}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        {column.header ?? column.id}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.getRowModel().rows.slice(0, 100).map((row: any) => (
                  <tr key={row.id}>
                    {table.columns.map((column: any) => (
                      <td key={column.id}>
                        {column.cell ? column.cell(row.getValue(column.id), row) : String(row.getValue(column.id) ?? '')}
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

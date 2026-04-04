const e=`import { useMemo } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import { salesColumns, formatCurrency } from './common';
import { salesData, type SalesRecord } from './data';

export default function BasicTable() {
  const data = useMemo(() => salesData, []);
  const columns = useMemo(() => salesColumns, []);

  const table = usePivotTable<SalesRecord>({
    data,
    columns,
  });

  const rows = table.getRowModel().rows.slice(0, 8);

  return (
    <div>
      <div className="table-shell">
        <table className="demo-table">
          <thead>
            <tr>
              {table.columns.map((column) => (
                <th key={column.id}>{column.header ?? column.id}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {table.columns.map((column) => {
                  const value = row.getValue(column.id);
                  const rendered =
                    column.id === 'amount'
                      ? formatCurrency(value as number | undefined)
                      : String(value ?? '-');
                  return <td key={\`\${row.id}_\${column.id}\`}>{rendered}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="meta-row">
        Rendering {rows.length} of {table.rowModel.rows.length} rows from the core row model.
      </p>
    </div>
  );
}
`;export{e as b};

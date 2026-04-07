import { useRef, useCallback, useMemo } from 'react';
import { usePivotTable, useVirtualColumns } from '@pivot';
import type { ColumnDef } from '@pivot';
import { MiniTable } from '../components';

interface WideRow {
  [key: string]: string | number;
}

const COLUMN_COUNT = 30;
const ROW_COUNT = 10;

function makeColumn(i: number): ColumnDef<WideRow> {
  const id = 'col_' + i;
  return {
    id,
    header: 'Column ' + (i + 1),
    accessorFn: (row: WideRow) => row[id] as string | number,
  };
}

const columns: ColumnDef<WideRow>[] = Array.from({ length: COLUMN_COUNT }, (_, i) =>
  makeColumn(i),
);

function generateWideData(): WideRow[] {
  return Array.from({ length: ROW_COUNT }, (_, rowIdx) => {
    const row: WideRow = { id: rowIdx };
    for (let colIdx = 0; colIdx < COLUMN_COUNT; colIdx++) {
      const key = 'col_' + colIdx;
      row[key] = 'R' + (rowIdx + 1) + 'C' + (colIdx + 1);
    }
    return row;
  });
}

export default function VirtualColumnsExample() {
  const data = useMemo(() => generateWideData(), []);

  const table = usePivotTable<WideRow>({
    data,
    columns,
  });

  const rowModel = table.getRowModel();
  const cols = table.columns;

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { virtualColumns, totalSize } = useVirtualColumns({
    count: cols.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 120,
    overscan: 3,
  });

  return (
    <div>
      <div
        style={{
          marginBottom: '8px',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
        }}
      >
        Rendering{' '}
        <strong>
          {virtualColumns.length} of {cols.length}
        </strong>{' '}
        columns
      </div>

      <div
        ref={scrollContainerRef}
        style={{
          overflow: 'auto',
          maxWidth: '600px',
          border: 'var(--border-width-default) solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ width: totalSize + 'px', overflow: 'auto' }}>
          <MiniTable>
            <thead>
              <tr>
                {virtualColumns.map((virtualCol) => {
                  const col = cols[virtualCol.index];
                  if (!col) return null;
                  return (
                    <Th key={col.id}>
                      <div
                        style={{
                          position: 'absolute',
                          left: virtualCol.start + 'px',
                          width: virtualCol.size + 'px',
                        }}
                      >
                        {col.header}
                      </div>
                    </Th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rowModel.rows.map((row, idx) => (
                <tr
                  key={row.id}
                  style={{
                    background: idx % 2 === 0 ? 'transparent' : 'var(--surface-2)',
                  }}
                >
                  {virtualColumns.map((virtualCol) => {
                    const col = cols[virtualCol.index];
                    if (!col) return null;
                    return (
                      <Td
                        key={col.id}
                        style={{
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: virtualCol.start + 'px',
                            width: virtualCol.size + 'px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.values[col.id] !== undefined &&
                          row.values[col.id] !== null
                            ? String(row.values[col.id])
                            : '\u2014'}
                        </div>
                      </Td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </MiniTable>
        </div>
      </div>
    </div>
  );
}

function Th({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <th
      style={{
        padding: 'var(--space-2) var(--space-3)',
        textAlign: 'left',
        fontWeight: 'var(--font-medium)',
        fontSize: 'var(--text-xs)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--table-header-tracking)',
        color: 'var(--table-header-text)',
        background: 'var(--table-header-bg)',
        borderBottom: 'var(--border-width-emphasis) solid var(--border-emphasis)',
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        padding: 'var(--space-2) var(--space-3)',
        borderBottom: 'var(--border-width-default) solid var(--border-default)',
        color: 'var(--text-primary)',
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </td>
  );
}

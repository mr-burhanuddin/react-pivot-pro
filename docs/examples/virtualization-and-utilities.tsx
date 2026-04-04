import React, { useRef } from 'react';
import { useVirtualRows } from '../../src/hooks/useVirtualRows';
import { useVirtualColumns } from '../../src/hooks/useVirtualColumns';
import { exportCSV } from '../../src/utils/exportCSV';
import { copyToClipboard, fullscreen } from '../../src/utils/clipboard';

export default function VirtualizationAndUtilitiesExample(): JSX.Element {
  const rowScrollRef = useRef<HTMLDivElement | null>(null);
  const colScrollRef = useRef<HTMLDivElement | null>(null);

  const { virtualRows, totalSize: totalRowSize } = useVirtualRows({
    count: 10000,
    getScrollElement: () => rowScrollRef.current,
    estimateSize: () => 28,
    overscan: 8,
  });

  const { virtualColumns, totalSize: totalColSize } = useVirtualColumns({
    count: 500,
    getScrollElement: () => colScrollRef.current,
    estimateSize: () => 120,
    overscan: 4,
  });

  const handleExport = async () => {
    const result = exportCSV({
      fileName: 'rows.csv',
      rows: virtualRows.map((row) => ({ index: row.index, start: row.start })),
    });
    await copyToClipboard({ text: result.csv });
    result.download();
  };

  return (
    <div>
      <button onClick={() => void fullscreen.toggle()}>Toggle Fullscreen</button>
      <button onClick={() => void handleExport()}>Export + Copy CSV</button>

      <div ref={rowScrollRef} style={{ height: 180, overflow: 'auto', border: '1px solid #ddd' }}>
        <div style={{ height: totalRowSize, position: 'relative' }}>
          {virtualRows.map((row) => (
            <div
              key={row.key}
              style={{ position: 'absolute', top: row.start, height: row.size, left: 0, right: 0 }}
            >
              Row {row.index}
            </div>
          ))}
        </div>
      </div>

      <div ref={colScrollRef} style={{ width: 400, overflow: 'auto', border: '1px solid #ddd', marginTop: 12 }}>
        <div style={{ width: totalColSize, height: 40, position: 'relative' }}>
          {virtualColumns.map((column) => (
            <div key={column.key} style={{ position: 'absolute', left: column.start, width: column.size }}>
              C{column.index}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

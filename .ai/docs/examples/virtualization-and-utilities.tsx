import React, { useRef } from "react";
import { useVirtualRows } from "../../src/hooks/useVirtualRows";
import { useVirtualColumns } from "../../src/hooks/useVirtualColumns";
import { exportCSV } from "../../src/utils/exportCSV";
import { copyToClipboard } from "../../src/utils/clipboard";

const ROWS = Array.from({ length: 10000 }, (_, i) => ({
  index: i,
  label: `Row ${i}`,
  value: Math.random() * 1000,
}));

const COLUMNS = Array.from({ length: 500 }, (_, i) => ({
  id: `col_${i}`,
  header: `Column ${i}`,
}));

export default function VirtualizationAndUtilitiesExample(): JSX.Element {
  const rowScrollRef = useRef<HTMLDivElement | null>(null);
  const colScrollRef = useRef<HTMLDivElement | null>(null);

  const { virtualRows, totalSize: totalRowSize } = useVirtualRows({
    count: ROWS.length,
    getScrollElement: () => rowScrollRef.current,
    estimateSize: () => 28,
    overscan: 8,
  });

  const { virtualColumns, totalSize: totalColSize } = useVirtualColumns({
    count: COLUMNS.length,
    getScrollElement: () => colScrollRef.current,
    estimateSize: () => 120,
    overscan: 4,
  });

  const handleExport = async () => {
    const result = exportCSV({
      fileName: "rows.csv",
      rows: virtualRows.map((row) => ROWS[row.index]),
    });
    await copyToClipboard({ text: result.csv });
    result.download();
  };

  return (
    <div>
      <button onClick={() => void handleExport()}>Export + Copy CSV</button>

      {/* Virtualized rows */}
      <div
        ref={rowScrollRef}
        style={{
          height: 180,
          overflow: "auto",
          border: "1px solid #ddd",
          marginTop: 12,
        }}
      >
        <div style={{ height: totalRowSize, position: "relative" }}>
          {virtualRows.map((row) => {
            const rowData = ROWS[row.index];
            return (
              <div
                key={row.key}
                style={{
                  position: "absolute",
                  top: row.start,
                  height: row.size,
                  left: 0,
                  right: 0,
                  padding: "0 8px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span style={{ width: 80 }}>{rowData.label}</span>
                <span>{rowData.value.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Virtualized columns */}
      <div
        ref={colScrollRef}
        style={{
          width: 400,
          overflow: "auto",
          border: "1px solid #ddd",
          marginTop: 12,
        }}
      >
        <div style={{ width: totalColSize, height: 40, position: "relative" }}>
          {virtualColumns.map((column) => (
            <div
              key={column.key}
              style={{
                position: "absolute",
                left: column.start,
                width: column.size,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRight: "1px solid #eee",
              }}
            >
              {COLUMNS[column.index].header}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

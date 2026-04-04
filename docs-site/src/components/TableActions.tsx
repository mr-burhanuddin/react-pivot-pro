import { useState, useCallback } from 'react';
import { exportCSV } from '@pivot/utils/exportCSV';
import { copyToClipboard, fullscreen } from '@pivot/utils/clipboard';
import { Download, Copy, Maximize2, Minimize2, Check, X } from 'lucide-react';
import type { ColumnDef, Row } from '@pivot/types';

interface TableActionsProps<TData extends Record<string, unknown>> {
  rows: Row<TData>[];
  columns: ColumnDef<TData>[];
  fileName?: string;
  tableId?: string;
}

export function TableActions<TData extends Record<string, unknown>>({
  rows,
  columns,
  fileName = 'export',
  tableId,
}: TableActionsProps<TData>) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = tableId ? document.getElementById(tableId) : null;

  const handleExportCSV = useCallback(() => {
    const exportRows = rows.map((row) => row.original as TData);
    exportCSV({
      rows: exportRows,
      fileName,
      columns: columns.map((col) => ({
        id: col.id ?? (typeof col.accessorKey === 'string' ? col.accessorKey : ''),
        header: typeof col.header === 'string' ? col.header : col.id,
      })),
    }).download();
  }, [rows, columns, fileName]);

  const handleCopyToClipboard = useCallback(async () => {
    const exportRows = rows.map((row) => row.original as TData);
    const result = exportCSV({
      rows: exportRows,
      fileName: 'clipboard',
      columns: columns.map((col) => ({
        id: col.id ?? (typeof col.accessorKey === 'string' ? col.accessorKey : ''),
        header: typeof col.header === 'string' ? col.header : col.id,
      })),
    });
    const success = await copyToClipboard({ text: result.csv });
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [rows, columns]);

  const handleToggleFullscreen = useCallback(async () => {
    if (!containerRef) return;
    
    if (isFullscreen) {
      await fullscreen.exit();
      setIsFullscreen(false);
    } else {
      const success = await fullscreen.request(containerRef);
      setIsFullscreen(success);
    }
  }, [containerRef, isFullscreen]);

  const isFullscreenSupported = fullscreen.isSupported();

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button
        type="button"
        className="ghost-btn"
        onClick={handleExportCSV}
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        title="Export to CSV"
      >
        <Download size={14} />
        Export CSV
      </button>

      <button
        type="button"
        className="ghost-btn"
        onClick={handleCopyToClipboard}
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        title="Copy to clipboard"
      >
        {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
        {copied ? 'Copied!' : 'Copy'}
      </button>

      {isFullscreenSupported && (
        <button
          type="button"
          className="ghost-btn"
          onClick={handleToggleFullscreen}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          {isFullscreen ? 'Exit' : 'Fullscreen'}
        </button>
      )}
    </div>
  );
}

export function TableContainer({
  id,
  children,
  isFullscreen,
}: {
  id: string;
  children: React.ReactNode;
  isFullscreen?: boolean;
}) {
  return (
    <div
      id={id}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        height: isFullscreen ? '100vh' : 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  );
}

export function TableHeader({
  title,
  actions,
}: {
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface-muted)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{title}</span>
      {actions}
    </div>
  );
}

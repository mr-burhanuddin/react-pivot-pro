import { useState, useCallback } from 'react';
import { copyToClipboard } from '@pivot/utils/clipboard';
import { exportCSV } from '@pivot/utils/exportCSV';
import { Clipboard, Check, Copy, Download, FileText, Table } from 'lucide-react';

const sampleData = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', department: 'Engineering' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Developer', department: 'Engineering' },
  { id: 3, name: 'Carol White', email: 'carol@example.com', role: 'Manager', department: 'Sales' },
  { id: 4, name: 'David Brown', email: 'david@example.com', role: 'Developer', department: 'Engineering' },
  { id: 5, name: 'Eve Davis', email: 'eve@example.com', role: 'Designer', department: 'Design' },
];

export default function ClipboardExample() {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedTable, setCopiedTable] = useState(false);

  const handleCopyText = useCallback(async (text: string, field: string) => {
    const success = await copyToClipboard({ text });
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, []);

  const handleCopyTable = useCallback(async () => {
    const csvContent = sampleData
      .map(row => Object.values(row).join('\t'))
      .join('\n');
    
    const success = await copyToClipboard({ text: csvContent });
    if (success) {
      setCopiedTable(true);
      setTimeout(() => setCopiedTable(false), 2000);
    }
  }, []);

  const handleExportCSV = useCallback(() => {
    exportCSV({
      rows: sampleData,
      fileName: 'team-export',
    }).download();
  }, []);

  return (
    <div>
      <div className="toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clipboard size={14} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Clipboard & Export Utilities
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 16 }}>
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>
            Copy Individual Values
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sampleData.slice(0, 3).map((person) => (
              <div
                key={person.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'var(--surface-muted)',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{person.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {person.email}
                  </div>
                </div>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => handleCopyText(person.email, `email-${person.id}`)}
                  style={{ padding: 6 }}
                >
                  {copiedField === `email-${person.id}` ? (
                    <Check size={14} style={{ color: 'var(--success)' }} />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>
            Copy as Tab-Separated
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              className="btn-primary"
              onClick={handleCopyTable}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {copiedTable ? (
                <>
                  <Check size={14} />
                  Copied!
                </>
              ) : (
                <>
                  <Table size={14} />
                  Copy Table Data
                </>
              )}
            </button>

            <div
              style={{
                padding: 12,
                background: 'var(--surface-muted)',
                borderRadius: 6,
                border: '1px solid var(--border)',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
              }}
            >
              <div style={{ marginBottom: 8, color: 'var(--text-muted)' }}>
                Preview (first row):
              </div>
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {Object.values(sampleData[0]).join('    ')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>
          Export to CSV
        </h3>
        <button
          type="button"
          className="ghost-btn"
          onClick={handleExportCSV}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Download size={14} />
          Download as CSV
        </button>
      </div>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: 'var(--surface-muted)',
          borderRadius: 8,
          border: '1px solid var(--border)',
        }}
      >
        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText size={14} />
          Code Example
        </h4>
        <pre style={{ fontSize: '0.8rem', margin: 0, overflow: 'auto' }}>
          <code>{`import { copyToClipboard, exportCSV } from 'react-pivot-pro';

// Copy text to clipboard
const success = await copyToClipboard({ text: 'Hello!' });

// Export data to CSV
exportCSV({
  rows: myData,
  fileName: 'export',
  delimiter: ',',
});`}</code>
        </pre>
      </div>
    </div>
  );
}

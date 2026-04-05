import { useState, useCallback, useRef } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export default function CodeBlock({ code, language = 'tsx', filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', marginTop: 12 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: '#F3F4F6',
        borderBottom: '1px solid var(--color-border)',
        fontSize: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-code)', color: 'var(--color-text-muted)' }}>
            {filename || `${language}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              padding: '2px 8px',
              fontSize: 11,
              borderRadius: 4,
              border: '1px solid var(--color-border)',
              background: 'white',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
            }}
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
          <button
            onClick={handleCopy}
            style={{
              padding: '2px 8px',
              fontSize: 11,
              borderRadius: 4,
              border: '1px solid var(--color-border)',
              background: copied ? '#ECFDF5' : 'white',
              color: copied ? '#059669' : 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <pre style={{
          margin: 0,
          padding: 16,
          fontSize: 13,
          lineHeight: 1.6,
          fontFamily: 'var(--font-code)',
          overflow: 'auto',
          maxHeight: 400,
          background: '#0F172A',
          color: '#E2E8F0',
        }}>
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

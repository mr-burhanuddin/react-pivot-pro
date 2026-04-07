import { useState, useCallback, useRef } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export default function CodeBlock({
  code,
  language = "tsx",
  filename,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div
      style={{
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        marginTop: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 12px",
          background: "var(--code-header-bg)",
          borderBottom: "1px solid var(--border-default)",
          fontSize: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text-secondary)",
            }}
          >
            {filename || `${language}`}
          </span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={handleCopy}
            style={{
              padding: "2px 8px",
              fontSize: 11,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-default)",
              background: copied
                ? "var(--code-success-bg)"
                : "var(--code-btn-bg)",
              color: copied
                ? "var(--code-success-text)"
                : "var(--code-btn-text)",
              cursor: "pointer",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <pre
        style={{
          margin: 0,
          padding: 16,
          fontSize: 13,
          lineHeight: 1.6,
          fontFamily: "var(--font-mono)",
          overflow: "auto",
          maxHeight: 400,
          background: "var(--code-bg)",
          color: "var(--code-text)",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

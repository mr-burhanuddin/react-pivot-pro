import { useState, type ReactNode } from "react";
import { Settings2 } from "lucide-react";
import CodeBlock from "../../components/CodeBlock";

interface DemoCardProps {
  title: string;
  badge: string;
  description: string;
  children: ReactNode;
  code: string;
  icon: ReactNode;
}

export default function DemoCard({
  title,
  badge,
  description,
  children,
  code,
  icon,
}: DemoCardProps) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div
      className="demo-section"
      style={{
        border: "var(--border-width-default) solid var(--border-default)",
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
        marginBottom: "var(--space-8)",
        background: "var(--surface-2)",
      }}
    >
      <div
        style={{
          padding: "var(--space-4) var(--space-6)",
          borderBottom: "var(--border-width-default) solid var(--border-default)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            marginBottom: "var(--space-2)",
          }}
        >
          <span style={{ color: "var(--text-secondary)" }}>{icon}</span>
          <h3
            style={{
              margin: 0,
              fontSize: "var(--text-md)",
              fontWeight: "var(--font-medium)",
              color: "var(--text-primary)",
            }}
          >
            {title}
          </h3>
          <span
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-medium)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background: "var(--surface-4)",
              color: "var(--text-secondary)",
            }}
          >
            {badge}
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
          }}
        >
          {description}
        </p>
      </div>
      <div style={{ padding: "var(--space-6)" }}>{children}</div>
      <div
        style={{
          borderTop: "var(--border-width-default) solid var(--border-default)",
        }}
      >
        <button
          onClick={() => setShowCode(!showCode)}
          style={{
            width: "100%",
            padding: "var(--space-3) var(--space-6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--surface-3)",
            border: "none",
            cursor: "pointer",
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
            fontWeight: "var(--font-medium)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Settings2 size={14} /> Source code
          </span>
          <span>{showCode ? "▲" : "▼"}</span>
        </button>
        {showCode && <CodeBlock code={code} language="tsx" />}
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

/* ─── MiniTable wrapper ─── */
export function MiniTable({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        border: "var(--border-width-default) solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        overflow: "auto",
        maxHeight: 320,
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "var(--text-sm)",
        }}
      >
        {children}
      </table>
    </div>
  );
}

/* ─── Table header cell ─── */
export function Th({
  children,
  onClick,
  style,
  ...rest
}: {
  children: ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
} & React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      onClick={onClick}
      style={{
        padding: "var(--space-2) var(--space-3)",
        textAlign: "left",
        fontWeight: "var(--font-medium)",
        fontSize: "var(--text-xs)",
        textTransform: "uppercase",
        letterSpacing: "var(--table-header-tracking)",
        color: "var(--table-header-text)",
        background: "var(--table-header-bg)",
        borderBottom: "var(--border-width-emphasis) solid var(--border-emphasis)",
        cursor: onClick ? "pointer" : "default",
        position: "sticky",
        top: 0,
        zIndex: 1,
        userSelect: "none",
        ...style,
      }}
      {...rest}
    >
      {children}
    </th>
  );
}

/* ─── Table data cell ─── */
export function Td({
  children,
  style,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        padding: "var(--space-2) var(--space-3)",
        borderBottom: "var(--border-width-default) solid var(--border-default)",
        color: "var(--text-primary)",
        ...style,
      }}
    >
      {children}
    </td>
  );
}

/* ─── Chip toggle button ─── */
export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "var(--space-1) var(--space-3)",
        fontSize: "var(--text-sm)",
        borderRadius: "var(--radius-md)",
        border: "var(--border-width-default) solid var(--border-default)",
        background: active
          ? "color-mix(in srgb, #0891B2 10%, transparent)"
          : "var(--surface-3)",
        color: active ? "var(--accent-600)" : "var(--text-secondary)",
        cursor: "pointer",
        fontWeight: active ? "var(--font-medium)" : "var(--font-regular)",
        transition: "all var(--duration-micro) var(--ease-enter)",
      }}
    >
      {children}
    </button>
  );
}

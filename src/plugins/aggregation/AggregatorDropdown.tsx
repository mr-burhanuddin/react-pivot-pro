import { useState, useCallback } from "react";
import type { AggregationFnName } from "../../types/aggregation";
import { AGGREGATOR_LABELS, aggregationFns } from "./aggregators";

interface AggregatorDropdownProps {
  columnId: string;
  currentValue: AggregationFnName | "custom" | undefined;
  onChange: (columnId: string, fnName: AggregationFnName | "custom") => void;
  aggregators?: AggregationFnName[];
  className?: string;
}

export function AggregatorDropdown({
  columnId,
  currentValue,
  onChange,
  aggregators,
  className,
}: AggregatorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const availableAggregators =
    aggregators ?? (Object.keys(aggregationFns) as AggregationFnName[]);

  const currentLabel =
    currentValue && currentValue !== "custom"
      ? (AGGREGATOR_LABELS[currentValue] ?? currentValue)
      : currentValue === "custom"
        ? "Custom"
        : "Select...";

  const handleSelect = useCallback(
    (fnName: AggregationFnName | "custom") => {
      onChange(columnId, fnName);
      setIsOpen(false);
    },
    [columnId, onChange],
  );

  return (
    <div
      className={className ?? "aggregator-dropdown"}
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "4px 8px",
          fontSize: "0.8rem",
          background: "var(--surface-2)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-md)",
          cursor: "pointer",
          minWidth: 100,
          textAlign: "left",
          color: "var(--text-primary)",
        }}
      >
        {currentLabel} ▾
      </button>
      {isOpen && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 2,
            background: "var(--surface-3)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            padding: 4,
            zIndex: 100,
            minWidth: 140,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            listStyle: "none",
            margin: 0,
          }}
        >
          {availableAggregators.map((fnName) => (
            <li key={fnName}>
              <button
                type="button"
                onClick={() => handleSelect(fnName)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "6px 8px",
                  fontSize: "0.8rem",
                  background:
                    currentValue === fnName
                      ? "color-mix(in srgb, var(--accent-600) 10%, transparent)"
                      : "transparent",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  textAlign: "left",
                  color:
                    currentValue === fnName
                      ? "var(--accent-600)"
                      : "var(--text-primary)",
                }}
              >
                {AGGREGATOR_LABELS[fnName] ?? fnName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

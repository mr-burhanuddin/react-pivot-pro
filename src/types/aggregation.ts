import type { RowData } from "./table";
import type { TableState } from "./state";

export type AggregationFnName =
  | "sum"
  | "count"
  | "avg"
  | "min"
  | "max"
  | "median"
  | "stddev"
  | "variance"
  | "pctOfTotal"
  | "pctOfColumn"
  | "runningTotal"
  | "countDistinct";

export type AggregationFn<TValue = unknown> = (
  values: TValue[],
) => number | null;

export interface AggregationState {
  columnAggregators: Record<string, AggregationFnName | "custom">;
}

export type AggregationTableState = TableState & AggregationState;

export interface AggregationApi<
  TData extends RowData,
  TState extends AggregationTableState = AggregationTableState,
> {
  getColumnAggregator: (
    columnId: string,
  ) => AggregationFnName | "custom" | undefined;
  getColumnAggregators: () => Record<string, AggregationFnName | "custom">;
  setColumnAggregator: (
    columnId: string,
    updater:
      | AggregationFnName
      | "custom"
      | ((
          previous: AggregationFnName | "custom",
        ) => AggregationFnName | "custom"),
  ) => void;
  setColumnAggregators: (
    updater:
      | Record<string, AggregationFnName | "custom">
      | ((
          previous: Record<string, AggregationFnName | "custom">,
        ) => Record<string, AggregationFnName | "custom">),
  ) => void;
  registerFn: (name: string, fn: AggregationFn) => void;
  unregisterFn: (name: string) => void;
  getRegisteredFns: () => Readonly<Record<string, AggregationFn>>;
  resetColumnAggregators: () => void;
  getAggregatedValue: (columnId: string) => number | null;
  getGrandTotal: (columnId: string) => number | null;
}

export type PivotTableWithAggregation<
  TData extends RowData,
  TState extends AggregationTableState = AggregationTableState,
> = import("./table").PivotTableInstance<TData, TState> & {
  aggregation: AggregationApi<TData, TState>;
};

export interface AggregationPluginOptions {
  defaultAggregator?: AggregationFnName;
  autoAggregateColumns?: string[];
  workerThreshold?: number;
}

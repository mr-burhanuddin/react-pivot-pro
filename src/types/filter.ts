/**
 * Filter types for column filtering
 */
export type FilterType = "text" | "number" | "date" | "enum" | "boolean";

/**
 * Filter operators by filter type
 */
export type TextFilterOperator =
  | "contains"
  | "startsWith"
  | "endsWith"
  | "equals"
  | "notEquals";
export type NumberFilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between";
export type DateFilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between";
export type EnumFilterOperator = "in" | "notIn";
export type BooleanFilterOperator = "eq";
export type FilterOperator =
  | TextFilterOperator
  | NumberFilterOperator
  | DateFilterOperator
  | EnumFilterOperator
  | BooleanFilterOperator;

/**
 * Extended column filter with operator support
 */
export interface ColumnFilter {
  id: string;
  value: unknown;
  /** Filter type - determines which operator to use */
  filterType?: FilterType;
  /** Filter operator - defaults to 'contains' for text */
  operator?: FilterOperator;
}

/**
 * Filter value ranges for between operator
 */
export interface FilterValueRange {
  min: number | null;
  max: number | null;
}

/**
 * Filter configuration per column
 * Can be defined in ColumnDef to specify expected filter behavior
 */
export interface ColumnFilterConfig {
  /** Filter type for this column */
  filterType?: FilterType;
  /** Available operators for this column */
  operators?: FilterOperator[];
  /** Placeholder text for filter input */
  placeholder?: string;
}

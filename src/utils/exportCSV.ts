export type CsvPrimitive = string | number | boolean | null | undefined | Date;

export interface CsvColumn<TRecord extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  header?: string;
  accessor?: (record: TRecord, index: number) => CsvPrimitive;
}

export interface ExportCsvOptions<
  TRecord extends Record<string, unknown> = Record<string, unknown>,
> {
  rows: TRecord[];
  columns?: CsvColumn<TRecord>[];
  includeHeader?: boolean;
  delimiter?: string;
  lineBreak?: '\n' | '\r\n';
  fileName?: string;
  quoteAllFields?: boolean;
}

export interface ExportCsvResult {
  csv: string;
  fileName: string;
  blob: Blob | null;
  download: () => void;
}

function escapeCsvCell(
  value: CsvPrimitive,
  delimiter: string,
  quoteAllFields: boolean,
): string {
  if (value == null) {
    return '';
  }

  const rawValue = value instanceof Date ? value.toISOString() : String(value);
  const raw =
    rawValue.length > 0 && /^[=+\-@]/.test(rawValue)
      ? `'${rawValue}`
      : rawValue;
  const mustQuote =
    quoteAllFields ||
    raw.includes('"') ||
    raw.includes(delimiter) ||
    raw.includes('\n') ||
    raw.includes('\r');

  const escaped = raw.replace(/"/g, '""');
  return mustQuote ? `"${escaped}"` : escaped;
}

function inferColumns<TRecord extends Record<string, unknown>>(
  rows: TRecord[],
): CsvColumn<TRecord>[] {
  const keys = new Set<string>();
  for (const row of rows) {
    Object.keys(row).forEach((key) => keys.add(key));
  }
  return Array.from(keys).map((id) => ({ id, header: id }));
}

export function serializeCSV<TRecord extends Record<string, unknown>>(
  options: ExportCsvOptions<TRecord>,
): string {
  const {
    rows,
    includeHeader = true,
    delimiter = ',',
    lineBreak = '\n',
    quoteAllFields = false,
  } = options;

  const columns = options.columns ?? inferColumns(rows);
  const lines: string[] = [];

  if (includeHeader) {
    const headerLine = columns
      .map((column) => escapeCsvCell(column.header ?? column.id, delimiter, quoteAllFields))
      .join(delimiter);
    lines.push(headerLine);
  }

  rows.forEach((row, index) => {
    const line = columns
      .map((column) => {
        const value = column.accessor
          ? column.accessor(row, index)
          : (row[column.id] as CsvPrimitive);
        return escapeCsvCell(value, delimiter, quoteAllFields);
      })
      .join(delimiter);
    lines.push(line);
  });

  return lines.join(lineBreak);
}

export function exportCSV<TRecord extends Record<string, unknown>>(
  options: ExportCsvOptions<TRecord>,
): ExportCsvResult {
  const fileName = options.fileName ?? 'export.csv';
  const csv = serializeCSV(options);
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  const blob = isBrowser ? new Blob([csv], { type: 'text/csv;charset=utf-8;' }) : null;

  const download = () => {
    if (!isBrowser || !blob) {
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    csv,
    fileName,
    blob,
    download,
  };
}

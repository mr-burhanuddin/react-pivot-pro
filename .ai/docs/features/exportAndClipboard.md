# Feature: Export & Clipboard

## Purpose

CSV serialization/export and clipboard copy utilities — stateless helpers, not plugins.

## Entry Points

- `exportCSV`, `serializeCSV`, `ExportCsvOptions`, `ExportCsvResult` — `src/utils/exportCSV.ts:7-144`, re-exported `src/index.ts:7-8`
- `copyToClipboard`, `CopyToClipboardOptions` — `src/utils/clipboard.ts`, re-exported `src/index.ts:9-10`

## Components

- None.

## State

No state. Pure functions.

## API

### `serializeCSV(options) → string`

`ExportCsvOptions { rows, columns?, includeHeader?, delimiter?, lineBreak?, fileName?, quoteAllFields?, sanitizeValues? }` — `src/utils/exportCSV.ts:9-20`

- Infers columns from `rows[0]` keys if `columns` omitted — `src/utils/exportCSV.ts:68-76`
- Sanitizes by stripping `CONTROL_CHARS` and prefixing `FORMULA_TRIGGER_CHARS` (`=+-@\t\r\n`) with `'` — `src/utils/exportCSV.ts:29-54`
- Quotes fields containing `"` / delimiter / newline — `src/utils/exportCSV.ts:57-65`

### `exportCSV(options) → ExportCsvResult`

`ExportCsvResult { csv, fileName, blob, download() }` — `src/utils/exportCSV.ts:22-27`

- `fileName` sanitized: `replace(/[<>:"/\\|?*]/g, '_')` — `src/utils/exportCSV.ts:118`
- `blob` is `null` outside browser — `src/utils/exportCSV.ts:120-121`
- `download()` creates anchor, clicks, revokes URL — `src/utils/exportCSV.ts:123-137`

### `copyToClipboard(options) → Promise<boolean>`

- Inferred: wraps `navigator.clipboard.writeText` with fallback (not expanded here; see `src/utils/clipboard.ts`).

## Usage

```ts
import { serializeCSV, exportCSV, copyToClipboard } from 'react-pivot-pro';
const csv = serializeCSV({ rows: table.getRowModel().rows.map(r=>r.original), includeHeader: true });
const { download } = exportCSV({ rows, fileName: 'sales.csv' });
download();
await copyToClipboard({ text: csv });
```

## Dependencies

- Web APIs: `Blob`, `URL.createObjectURL`, `document.createElement`, `navigator.clipboard`
- No library dependencies.

## Evidence Sources

- `src/utils/exportCSV.ts`
- `src/utils/clipboard.ts`
- `src/index.ts:7-10`

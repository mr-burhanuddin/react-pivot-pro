import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { usePivotTable } from '@pivot/core/usePivotTable';
import type { ColumnDef, PivotTableInstance } from '@pivot/types';
import { createGroupingPlugin, withGrouping, type GroupingTableState, type GroupingApi } from '@pivot/plugins/grouping';
import { createPivotPlugin, withPivot, type PivotTableState, type PivotApi } from '@pivot/plugins/pivot';
import type { SalesRecord } from './data';
import { salesData } from './data';
import { formatCurrency } from './common';
import { Layers, ToggleLeft, ToggleRight } from 'lucide-react';

type LocalState = GroupingTableState & PivotTableState;
type CombinedTable = PivotTableInstance<SalesRecord, LocalState> & { grouping: GroupingApi<SalesRecord, LocalState> } & { pivot: PivotApi<SalesRecord, LocalState> };

const columns: ColumnDef<SalesRecord>[] = [
  { id: 'region', accessorKey: 'region', header: 'Region' },
  { id: 'quarter', accessorKey: 'quarter', header: 'Quarter' },
  { id: 'category', accessorKey: 'category', header: 'Category' },
  { id: 'amount', accessorKey: 'amount', header: 'Amount' },
  { id: 'quantity', accessorKey: 'quantity', header: 'Units' },
  { id: 'marginPct', accessorKey: 'marginPct', header: 'Margin %' },
];

const AVAILABLE_COLUMN_GROUPS = ['quarter', 'category', 'channel', 'region'];

const AGGREGATION_OPTIONS = [
  { id: 'amount', label: 'Revenue', aggregation: 'sum' as const },
  { id: 'quantity', label: 'Units', aggregation: 'sum' as const },
  { id: 'marginPct', label: 'Avg Margin', aggregation: 'avg' as const },
];

export default function PivotTable() {
  const [pivotEnabled, setPivotEnabled] = useState(true);
  const [rowGrouping, setRowGrouping] = useState<string[]>(['region']);
  const [columnGrouping, setColumnGrouping] = useState<string[]>(['quarter']);
  const [selectedAggregations, setSelectedAggregations] = useState<string[]>(['amount', 'quantity']);

  const pivotApiRef = useRef<PivotApi<SalesRecord, LocalState> | null>(null);
  const groupingApiRef = useRef<GroupingApi<SalesRecord, LocalState> | null>(null);

  const tableBase = usePivotTable<SalesRecord, LocalState>({
    data: useMemo(() => salesData, []),
    columns: useMemo(() => columns, []),
    plugins: useMemo(
      () => [
        createGroupingPlugin(),
        createPivotPlugin<SalesRecord, LocalState>(),
      ],
      [],
    ),
  });

  const table = useMemo((): CombinedTable => {
    const withGroup = withGrouping<SalesRecord, LocalState>(tableBase);
    const withPivotTable = withPivot<SalesRecord, LocalState>(withGroup);
    if (!pivotApiRef.current) {
      pivotApiRef.current = (withPivotTable as CombinedTable).pivot;
    }
    if (!groupingApiRef.current) {
      groupingApiRef.current = (withPivotTable as CombinedTable).grouping;
    }
    return withPivotTable as CombinedTable;
  }, [tableBase]);

  const pivotValues = useMemo(
    () =>
      AGGREGATION_OPTIONS.filter((agg) => selectedAggregations.includes(agg.id)).map((agg) => ({
        id: agg.id,
        aggregation: agg.aggregation,
      })),
    [selectedAggregations],
  );

  useEffect(() => {
    if (pivotApiRef.current) {
      pivotApiRef.current.setPivotValues(pivotValues);
    }
  }, [pivotValues]);

  useEffect(() => {
    if (pivotApiRef.current) {
      pivotApiRef.current.setPivotEnabled(pivotEnabled);
    }
  }, [pivotEnabled]);

  useEffect(() => {
    if (groupingApiRef.current) {
      groupingApiRef.current.setRowGrouping(rowGrouping);
    }
  }, [rowGrouping]);

  useEffect(() => {
    if (groupingApiRef.current) {
      groupingApiRef.current.setColumnGrouping(columnGrouping);
    }
  }, [columnGrouping]);

  const result = table.pivot.getPivotResult();

  const toggleAggregation = useCallback((aggId: string) => {
    if (selectedAggregations.includes(aggId)) {
      setSelectedAggregations(selectedAggregations.filter((a) => a !== aggId));
    } else {
      setSelectedAggregations([...selectedAggregations, aggId]);
    }
  }, [selectedAggregations]);

  const toggleColumnGroup = useCallback((field: string) => {
    if (columnGrouping.includes(field)) {
      setColumnGrouping([]);
    } else {
      setColumnGrouping([field]);
    }
  }, [columnGrouping]);

  const toggleRowGroup = useCallback((field: string) => {
    if (rowGrouping.includes(field)) {
      setRowGrouping(rowGrouping.filter((g) => g !== field));
    } else {
      setRowGrouping([...rowGrouping, field]);
    }
  }, [rowGrouping]);

  if (!result) {
    return (
      <div>
        <div className="toolbar">
          <button
            type="button"
            className="btn-primary"
            onClick={() => setPivotEnabled(true)}
          >
            <ToggleLeft size={14} /> Enable Pivot
          </button>
        </div>
        <p className="meta-row">Pivot mode is disabled. Click "Enable Pivot" to activate.</p>
      </div>
    );
  }

  const getAggregationLabel = (aggId: string) => {
    return AGGREGATION_OPTIONS.find((a) => a.id === aggId)?.label ?? aggId;
  };

  const getAggregationFormat = (aggId: string, value: number | undefined) => {
    if (value === undefined) return '-';
    if (aggId === 'amount' || aggId === 'quantity') {
      return formatCurrency(value);
    }
    return `${value.toFixed(1)}%`;
  };

  return (
    <div>
      <div className="toolbar">
        <button
          type="button"
          className={`ghost-btn ${pivotEnabled ? 'active' : ''}`}
          onClick={() => setPivotEnabled(!pivotEnabled)}
          style={{
            background: pivotEnabled ? 'var(--accent-soft)' : undefined,
            color: pivotEnabled ? 'var(--accent)' : undefined,
          }}
        >
          {pivotEnabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          {pivotEnabled ? 'Disable' : 'Enable'} Pivot
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Columns:</span>
          {AVAILABLE_COLUMN_GROUPS.map((field) => (
            <button
              key={field}
              type="button"
              className={`ghost-btn ${columnGrouping.includes(field) ? 'active' : ''}`}
              onClick={() => toggleColumnGroup(field)}
              style={{
                padding: '4px 8px',
                fontSize: '0.75rem',
                background: columnGrouping.includes(field) ? 'var(--accent-soft)' : undefined,
                color: columnGrouping.includes(field) ? 'var(--accent)' : undefined,
              }}
            >
              {field}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aggregations:</span>
          {AGGREGATION_OPTIONS.map((agg) => (
            <button
              key={agg.id}
              type="button"
              className={`ghost-btn ${selectedAggregations.includes(agg.id) ? 'active' : ''}`}
              onClick={() => toggleAggregation(agg.id)}
              style={{
                padding: '4px 8px',
                fontSize: '0.75rem',
                background: selectedAggregations.includes(agg.id) ? 'var(--accent-soft)' : undefined,
                color: selectedAggregations.includes(agg.id) ? 'var(--accent)' : undefined,
              }}
            >
              {agg.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rows:</span>
          {AVAILABLE_COLUMN_GROUPS.map((field) => (
            <button
              key={`row-${field}`}
              type="button"
              className={`ghost-btn ${rowGrouping.includes(field) ? 'active' : ''}`}
              onClick={() => toggleRowGroup(field)}
              style={{
                padding: '4px 8px',
                fontSize: '0.75rem',
                background: rowGrouping.includes(field) ? 'var(--accent-soft)' : undefined,
                color: rowGrouping.includes(field) ? 'var(--accent)' : undefined,
              }}
            >
              {field}
            </button>
          ))}
        </div>
      </div>

      <div className="table-shell" style={{ overflowX: 'auto' }}>
        <table className="demo-table">
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, zIndex: 2, background: 'var(--surface-muted)' }}>
                Row Group
              </th>
              {result.columnHeaders.map((column) => (
                <th key={column.key}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontWeight: 600 }}>
                      {column.path.length > 0 ? column.path.join(' / ') : 'Total'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                      {selectedAggregations.map((aggId) => getAggregationLabel(aggId)).join(' / ')}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rowHeaders.map((path) => {
              const rowKey = path.length === 0 ? '__root__' : path.join('||');
              return (
                <tr key={rowKey}>
                  <td style={{ fontWeight: 600, position: 'sticky', left: 0, background: 'var(--surface)' }}>
                    {path.length > 0 ? path.join(' / ') : 'All Regions'}
                  </td>
                  {result.columnHeaders.map((column) => {
                    const valueMap = result.matrixByRowKey[rowKey]?.[column.key] ?? {};
                    return (
                      <td key={`${rowKey}_${column.key}`}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {selectedAggregations.map((aggId) => (
                            <div key={aggId} style={{ fontSize: '0.88rem' }}>
                              <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>
                                {getAggregationLabel(aggId)}:
                              </span>
                              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                                {getAggregationFormat(aggId, valueMap[aggId] as number | undefined)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="meta-row" style={{ marginTop: 8 }}>
        <Layers size={12} style={{ display: 'inline', marginRight: 4 }} />
        Pivot mode: {pivotEnabled ? 'Enabled' : 'Disabled'} |{' '}
        Rows: {rowGrouping.join(' > ')} | Columns: {columnGrouping.join(', ')} |{' '}
        Aggregations: {selectedAggregations.map((a) => getAggregationLabel(a)).join(', ')}
      </div>
    </div>
  );
}

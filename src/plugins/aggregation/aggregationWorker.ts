import type { AggregationFn, AggregationFnName } from '../../types/aggregation';

export interface AggregationWorkerMessage {
  type: 'AGGREGATE';
  payload: {
    rows: Record<string, unknown>[];
    columnAggregators: Record<string, AggregationFnName | 'custom'>;
  };
}

export interface AggregationWorkerResult {
  type: 'AGGREGATION_RESULT';
  payload: {
    rows: Record<string, unknown>[];
    grandTotals: Record<string, number | null>;
  };
}

export function createAggregationWorker(): Worker {
  const workerCode = `
    self.onmessage = function(e) {
      const { type, payload } = e.data;
      if (type === 'AGGREGATE') {
        const { rows, columnAggregators } = payload;
        const grandTotals = {};

        for (const [columnId, fnName] of Object.entries(columnAggregators)) {
          const fn = getAggregationFn(fnName);
          if (fn) {
            const values = rows.map(r => r[columnId]);
            grandTotals[columnId] = fn(values);
          }
        }

        self.postMessage({
          type: 'AGGREGATION_RESULT',
          payload: { rows, grandTotals }
        });
      }
    };

    function getAggregationFn(name) {
      const fns = {
        sum: (values) => {
          let total = 0;
          let hasValue = false;
          for (let i = 0; i < values.length; i++) {
            const n = Number(values[i]);
            if (!Number.isNaN(n) && values[i] != null) {
              total += n;
              hasValue = true;
            }
          }
          return hasValue ? total : null;
        },
        count: (values) => values.length,
        avg: (values) => {
          let total = 0;
          let count = 0;
          for (let i = 0; i < values.length; i++) {
            const n = Number(values[i]);
            if (!Number.isNaN(n) && values[i] != null) {
              total += n;
              count++;
            }
          }
          return count > 0 ? total / count : null;
        },
        min: (values) => {
          let result = null;
          for (let i = 0; i < values.length; i++) {
            const n = Number(values[i]);
            if (!Number.isNaN(n) && values[i] != null) {
              if (result === null || n < result) result = n;
            }
          }
          return result;
        },
        max: (values) => {
          let result = null;
          for (let i = 0; i < values.length; i++) {
            const n = Number(values[i]);
            if (!Number.isNaN(n) && values[i] != null) {
              if (result === null || n > result) result = n;
            }
          }
          return result;
        },
      };
      return fns[name] || null;
    }
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}

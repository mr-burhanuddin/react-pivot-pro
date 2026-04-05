import type { RowData } from '../types';

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const DANGEROUS_KEY_PATTERN = /^__|constructor|prototype$/;

export function isSafeKey(key: string): boolean {
  return !DANGEROUS_KEYS.has(key) && !DANGEROUS_KEY_PATTERN.test(key);
}

export function getValueByAccessorKey<TData extends RowData>(
  row: TData,
  accessorKey: string
): unknown {
  const keys = accessorKey.split('.');
  let value: unknown = row;
  for (const key of keys) {
    if (value == null || typeof value !== 'object') {
      return undefined;
    }
    const obj = value as Record<string, unknown>;
    if (!isSafeKey(key)) {
      return undefined;
    }
    value = obj[key];
  }
  return value;
}

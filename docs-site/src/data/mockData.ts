import type { RowData } from '../../../src/types';

export interface SalesRow extends RowData {
  orderId: string;
  region: string;
  country: string;
  product: string;
  category: string;
  salesRep: string;
  quarter: string;
  year: number;
  units: number;
  revenue: number;
  cost: number;
  margin: number;
  discount: number;
  channel: string;
  customerType: string;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const REGIONS = ['North', 'South', 'East', 'West'];
const COUNTRIES_BY_REGION: Record<string, string[]> = {
  North: ['USA', 'Canada', 'Mexico'],
  South: ['Brazil', 'Argentina', 'Chile'],
  East: ['UK', 'Germany', 'France'],
  West: ['Japan', 'Australia', 'India'],
};
const PRODUCTS = ['Widget A', 'Widget B', 'Gadget X', 'Gadget Y', 'Tool Pro', 'Tool Lite', 'Suite Enterprise', 'Suite Basic'];
const PRODUCT_CATEGORY_MAP: Record<string, string> = {
  'Widget A': 'Hardware', 'Widget B': 'Hardware',
  'Gadget X': 'Hardware', 'Gadget Y': 'Hardware',
  'Tool Pro': 'Software', 'Tool Lite': 'Software',
  'Suite Enterprise': 'Services', 'Suite Basic': 'Services',
};
const SALES_REPS = [
  'Alice Chen', 'Bob Martinez', 'Carol Williams', 'David Kim',
  'Eva Johnson', 'Frank Brown', 'Grace Lee', 'Henry Davis',
  'Iris Wang', 'James Wilson', 'Karen Taylor', 'Leo Garcia',
];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const YEARS = [2023, 2024];
const CHANNELS = ['Direct', 'Partner', 'Online', 'Retail'];
const CUSTOMER_TYPES = ['Enterprise', 'SMB', 'Startup', 'Government'];

const REP_PERFORMANCE: Record<string, { marginBias: number; volumeBias: number }> = {
  'Alice Chen': { marginBias: 8, volumeBias: 1.2 },
  'Bob Martinez': { marginBias: -3, volumeBias: 0.9 },
  'Carol Williams': { marginBias: 5, volumeBias: 1.1 },
  'David Kim': { marginBias: 2, volumeBias: 1.0 },
  'Eva Johnson': { marginBias: 10, volumeBias: 0.8 },
  'Frank Brown': { marginBias: -5, volumeBias: 1.3 },
  'Grace Lee': { marginBias: 6, volumeBias: 1.0 },
  'Henry Davis': { marginBias: -2, volumeBias: 0.7 },
  'Iris Wang': { marginBias: 7, volumeBias: 1.1 },
  'James Wilson': { marginBias: 0, volumeBias: 1.0 },
  'Karen Taylor': { marginBias: 4, volumeBias: 0.9 },
  'Leo Garcia': { marginBias: -1, volumeBias: 1.2 },
};

const REGION_BASE_COST: Record<string, number> = {
  North: 100, South: 85, East: 110, West: 95,
};

export function generateMockData(count: number = 500, seed: number = 42): SalesRow[] {
  const rand = seededRandom(seed);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const range = (min: number, max: number) => min + rand() * (max - min);

  const data: SalesRow[] = [];

  for (let i = 0; i < count; i++) {
    const region = pick(REGIONS);
    const product = pick(PRODUCTS);
    const rep = pick(SALES_REPS);
    const perf = REP_PERFORMANCE[rep];
    const baseCost = REGION_BASE_COST[region];
    const productMultiplier = 1 + (PRODUCTS.indexOf(product) * 0.15);

    const units = Math.round(range(5, 500) * perf.volumeBias);
    const unitPrice = baseCost * productMultiplier * range(1.2, 3.0);
    const discountPct = Math.round(range(0, 30) * 10) / 10;
    const revenue = Math.round(units * unitPrice * (1 - discountPct / 100) * 100) / 100;
    const cost = Math.round(units * baseCost * productMultiplier * 100) / 100;
    const margin = Math.round(((revenue - cost) / revenue) * 1000 + perf.marginBias * 10) / 10;

    data.push({
      orderId: `ORD-${String(10000 + i).slice(1)}`,
      region,
      country: pick(COUNTRIES_BY_REGION[region]),
      product,
      category: PRODUCT_CATEGORY_MAP[product],
      salesRep: rep,
      quarter: pick(QUARTERS),
      year: pick(YEARS),
      units,
      revenue: Math.max(0, revenue),
      cost: Math.max(0, cost),
      margin: Math.min(95, Math.max(-10, margin)),
      discount: discountPct,
      channel: pick(CHANNELS),
      customerType: pick(CUSTOMER_TYPES),
    });
  }

  return data;
}

export const mockData: SalesRow[] = generateMockData(500);

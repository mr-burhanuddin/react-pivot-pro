export interface SalesRecord {
  [key: string]: unknown;
  id: string;
  region: 'North America' | 'Europe' | 'APAC';
  country: string;
  city: string;
  category: 'Hardware' | 'Software' | 'Services';
  product: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  channel: 'Direct' | 'Partner' | 'Online';
  amount: number;
  quantity: number;
  marginPct: number;
}

export const salesData: SalesRecord[] = [
  {
    id: 'S-1001',
    region: 'North America',
    country: 'United States',
    city: 'New York',
    category: 'Hardware',
    product: 'Edge Router',
    quarter: 'Q1',
    channel: 'Direct',
    amount: 182000,
    quantity: 34,
    marginPct: 41,
  },
  {
    id: 'S-1002',
    region: 'North America',
    country: 'United States',
    city: 'San Francisco',
    category: 'Software',
    product: 'Analytics Suite',
    quarter: 'Q1',
    channel: 'Online',
    amount: 98000,
    quantity: 58,
    marginPct: 67,
  },
  {
    id: 'S-1003',
    region: 'Europe',
    country: 'Germany',
    city: 'Berlin',
    category: 'Hardware',
    product: 'Gateway Pro',
    quarter: 'Q1',
    channel: 'Partner',
    amount: 76000,
    quantity: 22,
    marginPct: 39,
  },
  {
    id: 'S-1004',
    region: 'Europe',
    country: 'United Kingdom',
    city: 'London',
    category: 'Services',
    product: 'Managed SOC',
    quarter: 'Q2',
    channel: 'Direct',
    amount: 146000,
    quantity: 12,
    marginPct: 53,
  },
  {
    id: 'S-1005',
    region: 'APAC',
    country: 'India',
    city: 'Bengaluru',
    category: 'Software',
    product: 'Workflow Cloud',
    quarter: 'Q2',
    channel: 'Online',
    amount: 88000,
    quantity: 67,
    marginPct: 64,
  },
  {
    id: 'S-1006',
    region: 'APAC',
    country: 'Japan',
    city: 'Tokyo',
    category: 'Hardware',
    product: 'Edge Router',
    quarter: 'Q2',
    channel: 'Partner',
    amount: 94000,
    quantity: 21,
    marginPct: 36,
  },
  {
    id: 'S-1007',
    region: 'North America',
    country: 'Canada',
    city: 'Toronto',
    category: 'Services',
    product: 'Deployment Pack',
    quarter: 'Q3',
    channel: 'Direct',
    amount: 56000,
    quantity: 17,
    marginPct: 47,
  },
  {
    id: 'S-1008',
    region: 'Europe',
    country: 'France',
    city: 'Paris',
    category: 'Software',
    product: 'Analytics Suite',
    quarter: 'Q3',
    channel: 'Online',
    amount: 73000,
    quantity: 49,
    marginPct: 62,
  },
  {
    id: 'S-1009',
    region: 'APAC',
    country: 'Australia',
    city: 'Sydney',
    category: 'Services',
    product: 'Managed SOC',
    quarter: 'Q3',
    channel: 'Partner',
    amount: 69000,
    quantity: 9,
    marginPct: 56,
  },
  {
    id: 'S-1010',
    region: 'North America',
    country: 'United States',
    city: 'Austin',
    category: 'Hardware',
    product: 'Gateway Pro',
    quarter: 'Q4',
    channel: 'Direct',
    amount: 121000,
    quantity: 28,
    marginPct: 43,
  },
  {
    id: 'S-1011',
    region: 'Europe',
    country: 'Spain',
    city: 'Madrid',
    category: 'Software',
    product: 'Workflow Cloud',
    quarter: 'Q4',
    channel: 'Online',
    amount: 65000,
    quantity: 43,
    marginPct: 59,
  },
  {
    id: 'S-1012',
    region: 'APAC',
    country: 'Singapore',
    city: 'Singapore',
    category: 'Hardware',
    product: 'Edge Router',
    quarter: 'Q4',
    channel: 'Partner',
    amount: 79000,
    quantity: 18,
    marginPct: 40,
  },
];

export function createLargeSalesDataset(size: number): SalesRecord[] {
  const regions: SalesRecord['region'][] = ['North America', 'Europe', 'APAC'];
  const categories: SalesRecord['category'][] = ['Hardware', 'Software', 'Services'];
  const channels: SalesRecord['channel'][] = ['Direct', 'Online', 'Partner'];
  const countries = ['United States', 'Germany', 'India', 'United Kingdom', 'Japan', 'Canada'];
  const cities = ['New York', 'Berlin', 'Bengaluru', 'London', 'Tokyo', 'Toronto'];
  const products = ['Edge Router', 'Workflow Cloud', 'Managed SOC', 'Gateway Pro', 'Analytics Suite'];
  const quarters: SalesRecord['quarter'][] = ['Q1', 'Q2', 'Q3', 'Q4'];

  return Array.from({ length: size }, (_, index) => {
    const region = regions[index % regions.length];
    const category = categories[index % categories.length];
    const channel = channels[index % channels.length];
    const country = countries[index % countries.length];
    const city = cities[index % cities.length];
    const product = products[index % products.length];
    const quarter = quarters[index % quarters.length];
    const amount = 24000 + ((index * 1379) % 176000);
    const quantity = 5 + (index % 74);
    const marginPct = 27 + (index % 45);

    return {
      id: `L-${1000 + index}`,
      region,
      category,
      country,
      city,
      channel,
      product,
      quarter,
      amount,
      quantity,
      marginPct,
    };
  });
}

export interface FinancialTransaction {
  id: string;
  date: string;
  company: string;
  department: string;
  account: string;
  amount: number;
  currency: string;
  status: 'Completed' | 'Pending' | 'Failed';
  region: string;
  country: string;
  [key: string]: unknown;
}

const companies = ['TechCorp', 'InnoSoft', 'DataFlow', 'CloudNet', 'NextGen'];
const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];
const accounts = ['Software', 'Hardware', 'Services', 'Consulting', 'Cloud'];
const currencies = ['USD', 'EUR', 'GBP', 'JPY'];
const statuses: FinancialTransaction['status'][] = ['Completed', 'Pending', 'Failed'];
const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America'];
const countriesByRegion: Record<string, string[]> = {
  'North America': ['USA', 'Canada', 'Mexico'],
  'Europe': ['UK', 'Germany', 'France', 'Italy'],
  'Asia Pacific': ['Japan', 'Australia', 'Singapore', 'India'],
  'Latin America': ['Brazil', 'Argentina', 'Chile'],
};

export function generateData(count: number = 100): FinancialTransaction[] {
  const data: FinancialTransaction[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const countries = countriesByRegion[region];
    const country = countries[Math.floor(Math.random() * countries.length)];
    const date = new Date(now.getTime() - Math.random() * 1000 * 60 * 60 * 24 * 365);
    
    data.push({
      id: `TRX-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      date: date.toISOString().split('T')[0],
      company: companies[Math.floor(Math.random() * companies.length)],
      department: departments[Math.floor(Math.random() * departments.length)],
      account: accounts[Math.floor(Math.random() * accounts.length)],
      amount: Number((Math.random() * 10000 - 2000).toFixed(2)),
      currency: currencies[Math.floor(Math.random() * currencies.length)],
      status: Math.random() > 0.8 ? 'Pending' : Math.random() > 0.95 ? 'Failed' : 'Completed',
      region,
      country,
    });
  }
  return data;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  company: string;
  account: string;
  amount: number;
  status: string;
  region?: string;
  country?: string;
  department?: string;
  [key: string]: unknown;
}

const companies = ['Acme Corp', 'Global Dynamics', 'Oscorp', 'Stark Industries', 'Wayne Enterprises'];
const accounts = ['Checking', 'Savings', 'Investment', 'Credit'];
const statuses = ['Completed', 'Pending', 'Failed'];
const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America'];
const countries: Record<string, string[]> = {
  'North America': ['USA', 'Canada', 'Mexico'],
  'Europe': ['UK', 'Germany', 'France', 'Italy'],
  'Asia Pacific': ['Japan', 'Australia', 'Singapore'],
  'Latin America': ['Brazil', 'Argentina', 'Chile'],
};
const departments = ['Engineering', 'Sales', 'Marketing', 'HR'];

export function generateData(count = 100): FinancialTransaction[] {
  return Array.from({ length: count }, (_, i) => {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const countryList = countries[region];
    const country = countryList[Math.floor(Math.random() * countryList.length)];
    
    return {
      id: `TXN-${String(10000 + i).padStart(5, '0')}`,
      date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
      company: companies[Math.floor(Math.random() * companies.length)],
      account: accounts[Math.floor(Math.random() * accounts.length)],
      amount: Math.round((Math.random() * 20000 - 5000) * 100) / 100,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      region,
      country,
      department: departments[Math.floor(Math.random() * departments.length)],
    };
  });
}

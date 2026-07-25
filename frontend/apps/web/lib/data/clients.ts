export type Client = {
  id: string;
  name: string;
  industry: string;
  active: boolean;
};

// Same client roster referenced by lib/data/processes.ts (clientId) —
// keep ids/names in sync when either file changes.
export const clients: Client[] = [
  { id: 'c1', name: 'Acme Corp', industry: 'Financial Services', active: true },
  { id: 'c2', name: 'Globex Media', industry: 'Media & Entertainment', active: true },
  { id: 'c3', name: 'Initech Systems', industry: 'Enterprise Software', active: true },
  { id: 'c4', name: 'Northwind Health', industry: 'Healthcare Technology', active: true },
  { id: 'c5', name: 'Umbrella Retail', industry: 'Retail & E-commerce', active: true },
  { id: 'c6', name: 'Stark Robotics', industry: 'Manufacturing', active: true },
  { id: 'c7', name: 'Wayne Logistics', industry: 'Logistics & Supply Chain', active: false },
  { id: 'c8', name: 'Soylent Foods', industry: 'Consumer Goods', active: false },
];

export function getClientById(id: string): Client | undefined {
  return clients.find((c) => c.id === id);
}

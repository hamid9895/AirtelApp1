// Airtel StockDistro Type Definitions
// Shared interfaces used across components and services

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Approver' | 'FSC';
  photo?: string | null; // Base64 encoded profile picture
}

export interface CustomFieldConfig {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date';
  target: 'fsc' | 'stock';
}

export interface DailyStock {
  id: string;
  date: string;
  openingAmount: number;
  openingSim: number;
  flexy: number;
  flexyClaim1: number;
  flexyClaim2: number;
  sim: number;
  createdAt: string;
  createdBy: string | null;
  customFields?: Record<string, string | number>; // Dynamic values mapped by config ID
}

export interface Allocation {
  id: string;
  date: string;
  fscId: string;
  fscName?: string;
  openingBalance: number;
  openingSim: number;
  autoRefill1: number;
  autoRefill2: number;
  autoRefill3: number;
  ecManual1: number;
  ecManual2: number;
  sim: number;
  totalAllocated: number;
  createdAt: string;
  createdBy: string | null;
  customFields?: Record<string, string | number>; // Dynamic values mapped by config ID
}

export interface Sale {
  id: string;
  date: string;
  fscId: string;
  fscName?: string;
  allocationId: string | null;
  openingBalance: number;
  autoRefill1: number;
  autoRefill2: number;
  autoRefill3: number;
  ecManual1: number;
  ecManual2: number;
  closingBalance: number;
  previousShort: number;
  todayShort: number;
  saleTotal: number;
  saleAmount: number;
  shortAmount: number;
  openingSim: number;
  sim: number;
  closingSim: number;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  remarks: string | null;
  reviewNote: string | null;
  createdAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  createdBy: string | null;
  submittedBy: string | null;
  reviewedBy: string | null;
  customFields?: Record<string, string | number>;
}

export interface ReportSummary {
  date: string;
  totalFsc: number;
  totalAllocated: number;
  totalSaleAmount: number;
  totalShort: number;
  approvedCount: number;
  pendingCount: number;
}

export interface DbStatusDto {
  connected: boolean;
  type: 'PostgreSQL' | 'SQLite';
  url?: string;
  error?: string;
}

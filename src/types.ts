// Airtel StockDistro Type Definitions
// Shared interfaces used across components and services

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Approver' | 'FSC';
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

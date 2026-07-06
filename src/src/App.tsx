import React, { useState, useEffect, useRef } from 'react';
import { handleMockApiRequest, initializeMockDatabase } from './mockApi';

// Register global window.fetch interceptor for standalone hosting (Vercel, Netlify, GitHub Pages, etc.)
initializeMockDatabase();
const _originalFetch = window.fetch;
window.fetch = async function (input, init) {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
  if (url.startsWith('/api')) {
    try {
      const response = await _originalFetch(input, init);
      return response;
    } catch (err) {
      console.warn(`[Airtel Distro Standalone] Server offline. Accessing local mock storage for: ${url}`, err);
      return handleMockApiRequest(url, init);
    }
  }
  return _originalFetch(input, init);
};
import { 
  Sparkles, 
  MessageSquare, 
  FileText, 
  Code, 
  Wand2, 
  Send, 
  Copy, 
  Check, 
  RotateCcw, 
  Settings, 
  ExternalLink, 
  Search, 
  AlertCircle, 
  Trash2, 
  Play, 
  ArrowRight, 
  Cpu, 
  Layers, 
  Download,
  Info,
  Users,
  Shield,
  Plus,
  TrendingUp,
  MapPin,
  Calendar,
  AlertTriangle,
  UserCheck,
  ClipboardList,
  CheckCircle,
  XCircle,
  LogOut,
  RefreshCw,
  Lock,
  LockOpen,
  DollarSign
} from 'lucide-react';

// Form interface helpers
interface UserDto {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Approver' | 'FSC';
}

interface DailyStock {
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

interface Allocation {
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

interface Sale {
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

export default function App() {
  // Token state
  const [token, setToken] = useState<string | null>(localStorage.getItem('airtel_token'));
  const [user, setUser] = useState<UserDto | null>(null);

  // Loading / Feedback states
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isStandaloneMode, setIsStandaloneMode] = useState<boolean>(false);

  // Authentication Fields
  const [loginEmail, setLoginEmail] = useState<string>('manager@airtel.com');
  const [loginPassword, setLoginPassword] = useState<string>('manager123');

  // Navigation states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dailyStock' | 'allocations' | 'sales' | 'reports' | 'users'>('dashboard');

  // Core Entity Stores
  const [dailyStocks, setDailyStocks] = useState<DailyStock[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [allUsers, setAllUsers] = useState<UserDto[]>([]);

  // Filtering / Search
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
  const [selectedFscFilter, setSelectedFscFilter] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');

  // Forms - Daily Stock Creation
  const [stockDate, setStockDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [stockOpeningAmount, setStockOpeningAmount] = useState<number>(150000);
  const [stockOpeningSim, setStockOpeningSim] = useState<number>(500);
  const [stockFlexy, setStockFlexy] = useState<number>(100000);
  const [stockFlexyClaim1, setStockFlexyClaim1] = useState<number>(20000);
  const [stockFlexyClaim2, setStockFlexyClaim2] = useState<number>(15000);
  const [stockSim, setStockSim] = useState<number>(350);

  // Forms - Allocation Creation
  const [allocDate, setAllocDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [allocFscId, setAllocFscId] = useState<string>('');
  const [allocOpeningBalance, setAllocOpeningBalance] = useState<number>(10000);
  const [allocOpeningSim, setAllocOpeningSim] = useState<number>(50);
  const [allocAutoRefill1, setAllocAutoRefill1] = useState<number>(20000);
  const [allocAutoRefill2, setAllocAutoRefill2] = useState<number>(15000);
  const [allocAutoRefill3, setAllocAutoRefill3] = useState<number>(10000);
  const [allocEcManual1, setAllocEcManual1] = useState<number>(5000);
  const [allocEcManual2, setAllocEcManual2] = useState<number>(5000);
  const [allocSim, setAllocSim] = useState<number>(35);

  // Forms - Sales File Creation (FSC or on-behalf)
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [saleFscId, setSaleFscId] = useState<string>('');
  const [saleOpeningBalance, setSaleOpeningBalance] = useState<number>(0);
  const [saleAutoRefill1, setSaleAutoRefill1] = useState<number>(0);
  const [saleAutoRefill2, setSaleAutoRefill2] = useState<number>(0);
  const [saleAutoRefill3, setSaleAutoRefill3] = useState<number>(0);
  const [saleEcManual1, setSaleEcManual1] = useState<number>(0);
  const [saleEcManual2, setSaleEcManual2] = useState<number>(0);
  const [saleClosingBalance, setSaleClosingBalance] = useState<number>(0);
  const [salePreviousShort, setSalePreviousShort] = useState<number>(0);
  const [saleAmount, setSaleAmount] = useState<number>(0);
  const [saleOpeningSim, setSaleOpeningSim] = useState<number>(0);
  const [saleSim, setSaleSim] = useState<number>(0);
  const [saleClosingSim, setSaleClosingSim] = useState<number>(0);
  const [saleRemarks, setSaleRemarks] = useState<string>('');

  // Active Selected Allocation for Autofill
  const [fscAllocations, setFscAllocations] = useState<Allocation[]>([]);

  // Forms - User Creation (Admin Only)
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<'Admin' | 'Manager' | 'Approver' | 'FSC'>('FSC');
  const [userPassword, setUserPassword] = useState<string>('');

  // Review & Approval Board
  const [selectedSaleToReview, setSelectedSaleToReview] = useState<Sale | null>(null);
  const [reviewNoteText, setReviewNoteText] = useState<string>('');

  // Reports Date range
  const [reportFromDate, setReportFromDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [reportToDate, setReportToDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reportSummaries, setReportSummaries] = useState<any[]>([]);

  // Check if the actual Express server is running, or if we are in standalone/static mode
  useEffect(() => {
    _originalFetch('/api/health')
      .then(res => {
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          return res.json();
        }
        throw new Error('Not an API response');
      })
      .then((data) => {
        if (data && data.status === 'ok') {
          setIsStandaloneMode(false);
        } else {
          setIsStandaloneMode(true);
        }
      })
      .catch(() => {
        setIsStandaloneMode(true);
      });
  }, []);

  // --- RECOVERY / AUTH INIT ---
  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    }
  }, [token]);

  // Load backend statistics and details on tab change or user authentication
  useEffect(() => {
    if (user) {
      loadTabContent();
    }
  }, [user, activeTab]);

  // Listen to allocations for auto-populating sale forms when date/fsc is picked
  useEffect(() => {
    if (saleDate && (user?.role === 'FSC' ? user.id : saleFscId)) {
      const selectedFscId = user?.role === 'FSC' ? user.id : saleFscId;
      // Search matching allocation
      const match = allocations.find(a => a.date === saleDate && a.fscId === selectedFscId);
      if (match) {
        setSaleOpeningBalance(match.openingBalance);
        setSaleAutoRefill1(match.autoRefill1);
        setSaleAutoRefill2(match.autoRefill2);
        setSaleAutoRefill3(match.autoRefill3);
        setSaleEcManual1(match.ecManual1);
        setSaleEcManual2(match.ecManual2);
        setSaleOpeningSim(match.openingSim);
        setSaleSim(match.sim);
      } else {
        // Reset to zeros if no allocation found
        setSaleOpeningBalance(0);
        setSaleAutoRefill1(0);
        setSaleAutoRefill2(0);
        setSaleAutoRefill3(0);
        setSaleEcManual1(0);
        setSaleEcManual2(0);
        setSaleOpeningSim(0);
        setSaleSim(0);
      }
    }
  }, [saleDate, saleFscId, allocations, user]);

  // --- API SERVICE UTILS ---
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        // Handle invalid/expired tokens
        handleLogOut();
      }
    } catch (e) {
      console.error(e);
      handleLogOut();
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('airtel_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setSuccessMsg(`Welcome back, ${data.user.name}!`);
        setActiveTab('dashboard');
      } else {
        setErrorMsg(data.error || 'Incorrect email or password credentials.');
      }
    } catch (err: any) {
      setErrorMsg('Could not reach server. Please ensure the backend dev server is active.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogOut = () => {
    localStorage.removeItem('airtel_token');
    setToken(null);
    setUser(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // --- LOAD CORE REQUISITE RESOURCES ---
  const loadTabContent = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Load Users if Manager/Admin
      if (user?.role === 'Admin' || user?.role === 'Manager') {
        const usersRes = await fetch('/api/auth/users', { headers: { 'Authorization': `Bearer ${token}` } });
        const usersData = await usersRes.json();
        if (usersData.success) {
          setAllUsers(usersData.users);
          // Set initial default for lists
          if (usersData.users.length > 0 && !allocFscId) {
            const fscUsers = usersData.users.filter((u: any) => u.role === 'FSC');
            if (fscUsers.length > 0) {
              setAllocFscId(fscUsers[0].id);
              setSaleFscId(fscUsers[0].id);
            }
          }
        }
      }

      // Load Daily Stocks
      if (user?.role === 'Admin' || user?.role === 'Manager') {
        const stocksRes = await fetch('/api/stock', { headers: { 'Authorization': `Bearer ${token}` } });
        const stocksData = await stocksRes.json();
        if (stocksData.success) setDailyStocks(stocksData.dailyStocks);
      }

      // Load Allocations
      if (user?.role === 'Admin' || user?.role === 'Manager') {
        const allocsRes = await fetch('/api/allocation', { headers: { 'Authorization': `Bearer ${token}` } });
        const allocsData = await allocsRes.json();
        if (allocsData.success) setAllocations(allocsData.allocations);
      } else {
        // Fallback or empty list for FSCs since they can't CRUD allocations
        setAllocations([]);
      }

      // Load Sales
      const salesRes = await fetch('/api/sale', { headers: { 'Authorization': `Bearer ${token}` } });
      const salesData = await salesRes.json();
      if (salesData.success) setSales(salesData.sales);

      // Load Report Summaries automatically if on reports tab
      if (activeTab === 'reports') {
        fetchReportSummaries();
      }

    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to sync workspace resources with server.');
    } finally {
      setLoading(false);
    }
  };

  // --- SUBMISSIONS WORKFLOWS ---

  // Create Daily Stock
  const handleCreateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: stockDate,
          openingAmount: stockOpeningAmount,
          openingSim: stockOpeningSim,
          flexy: stockFlexy,
          flexyClaim1: stockFlexyClaim1,
          flexyClaim2: stockFlexyClaim2,
          sim: stockSim
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg(`Daily opening stock for ${stockDate} created successfully.`);
        loadTabContent();
      } else {
        setErrorMsg(data.error || 'Failed to create stock record.');
      }
    } catch (err) {
      setErrorMsg('Network error while processing stock submission.');
    }
  };

  // Create FSC Allocation
  const handleCreateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const response = await fetch('/api/allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: allocDate,
          fscId: allocFscId,
          openingBalance: allocOpeningBalance,
          openingSim: allocOpeningSim,
          autoRefill1: allocAutoRefill1,
          autoRefill2: allocAutoRefill2,
          autoRefill3: allocAutoRefill3,
          ecManual1: allocEcManual1,
          ecManual2: allocEcManual2,
          sim: allocSim
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg('FSC Allocation distribution logged successfully.');
        loadTabContent();
      } else {
        setErrorMsg(data.error || 'Failed to allocate stock to coordinator.');
      }
    } catch (err) {
      setErrorMsg('Network error while allocating stock.');
    }
  };

  // File FSC Sales Record
  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Dynamic checks
    const targetFscId = user?.role === 'FSC' ? user.id : saleFscId;
    if (!saleDate || !targetFscId) {
      setErrorMsg('FSC ID and Date parameters are required.');
      return;
    }

    // Try finding matching allocation if exists
    const matchingAlloc = allocations.find(a => a.date === saleDate && a.fscId === targetFscId);

    try {
      const response = await fetch('/api/sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: saleDate,
          fscId: targetFscId,
          allocationId: matchingAlloc ? matchingAlloc.id : null,
          openingBalance: saleOpeningBalance,
          autoRefill1: saleAutoRefill1,
          autoRefill2: saleAutoRefill2,
          autoRefill3: saleAutoRefill3,
          ecManual1: saleEcManual1,
          ecManual2: saleEcManual2,
          closingBalance: saleClosingBalance,
          previousShort: salePreviousShort,
          saleAmount: saleAmount,
          openingSim: saleOpeningSim,
          sim: saleSim,
          closingSim: saleClosingSim,
          remarks: saleRemarks
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg('Sales sheet recorded as Draft successfully.');
        // reset fields
        setSaleRemarks('');
        loadTabContent();
      } else {
        setErrorMsg(data.error || 'Failed to save sales sheet.');
      }
    } catch (err) {
      setErrorMsg('Network error registering sales log.');
    }
  };

  // Submit Sale Draft for Approval
  const handleSubmitSaleDraft = async (saleId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/sale/${saleId}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Sales report submitted to Manager / Approver queue.');
        loadTabContent();
      } else {
        setErrorMsg(data.error || 'Failed to submit draft.');
      }
    } catch (e) {
      setErrorMsg('Network error on submission.');
    }
  };

  // Approve or Reject Sale
  const handleReviewSaleSubmit = async (action: 'approve' | 'reject') => {
    if (!selectedSaleToReview) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/sale/${selectedSaleToReview.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          reviewNote: reviewNoteText
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Sales entry successfully ${action === 'approve' ? 'Approved' : 'Rejected'}.`);
        setSelectedSaleToReview(null);
        setReviewNoteText('');
        loadTabContent();
      } else {
        setErrorMsg(data.error || 'Review submission failed.');
      }
    } catch (e) {
      setErrorMsg('Network error executing review workflow.');
    }
  };

  // Delete entity (sales, daily stock, allocations)
  const handleDeleteEntity = async (type: 'stock' | 'allocation' | 'sale', id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type} record?`)) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const endpoint = type === 'stock' ? `/api/stock/${id}` : type === 'allocation' ? `/api/allocation/${id}` : `/api/sale/${id}`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 204 || res.status === 200) {
        setSuccessMsg(`${type.toUpperCase()} entry removed successfully.`);
        loadTabContent();
      } else {
        const data = await res.json().catch(() => ({ error: 'Error processing deletion' }));
        setErrorMsg(data.error || 'Failed to remove entry.');
      }
    } catch (e) {
      setErrorMsg('Network deletion error.');
    }
  };

  // --- REPORT GENERATION ---
  const fetchReportSummaries = async () => {
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/report/summary?from=${reportFromDate}&to=${reportToDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReportSummaries(data.summaries);
      } else {
        setErrorMsg(data.error || 'Failed to calculate statistics.');
      }
    } catch (e) {
      setErrorMsg('Network error compiling reports.');
    }
  };

  const handleExportCSV = () => {
    if (reportSummaries.length === 0) {
      setErrorMsg("No compiled ledger summaries available to export. Please select dates and compile first.");
      return;
    }
    
    // Construct CSV content with header and data rows
    const headers = ["Report Date", "Active FSCs", "Distributed Allocations (INR)", "Net Sales Collected (INR)", "Total Shortages (INR)", "Approved Count", "Pending Count"];
    const rows = reportSummaries.map(s => [
      s.date,
      s.totalFsc,
      s.totalAllocated,
      s.totalSaleAmount,
      s.totalShort,
      s.approvedCount,
      s.pendingCount
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => {
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `airtel_reconciliation_report_${reportFromDate}_to_${reportToDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMsg(`CSV report download triggered for ${reportSummaries.length} days.`);
  };

  // --- USER MANAGEMENT (Admin Only) ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!userEmail || !userName || !userPassword) {
      setErrorMsg('All registration fields are required.');
      return;
    }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: userEmail,
          name: userName,
          role: userRole,
          password: userPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`User ${userName} created successfully.`);
        setUserEmail('');
        setUserName('');
        setUserPassword('');
        loadTabContent();
      } else {
        setErrorMsg(data.error || 'Failed to register user.');
      }
    } catch (e) {
      setErrorMsg('Registration communication error.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 204) {
        setSuccessMsg('User and associated logs references updated.');
        loadTabContent();
      } else {
        setErrorMsg('Failed to delete user.');
      }
    } catch (e) {
      setErrorMsg('Network error deleting user.');
    }
  };

  // --- SEARCH & FILTER CALCULATIONS ---
  const filteredSales = sales.filter(s => {
    const fscUser = allUsers.find(u => u.id === s.fscId);
    const fscName = fscUser ? fscUser.name : (s.fscName || 'FSC Agent');
    const matchSearch = fscName.toLowerCase().includes(globalSearch.toLowerCase()) || 
                        s.date.includes(globalSearch) || 
                        s.status.toLowerCase().includes(globalSearch.toLowerCase());
    const matchDate = selectedDateFilter ? s.date === selectedDateFilter : true;
    const matchFsc = selectedFscFilter ? s.fscId === selectedFscFilter : true;
    const matchStatus = selectedStatusFilter ? s.status === selectedStatusFilter : true;
    return matchSearch && matchDate && matchFsc && matchStatus;
  });

  const fscUsersList = allUsers.filter(u => u.role === 'FSC');

  // Dashboard calculations
  const totalStockOnHandAmount = dailyStocks[0]?.openingAmount || 142805;
  const totalActiveAgentsCount = fscUsersList.length || 12;
  const criticalAirtelAlerts = [
    { item: 'SIM cards', threshold: '50 units', hub: 'NCR Hub North', level: 'rose' },
    { item: 'Flexy Airtime Allocation', threshold: '₹12,000 threshold', hub: 'East Hub East', level: 'amber' }
  ];

  // Render Login view if unauthenticated
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-red-500/10 selection:text-red-950 font-sans">
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl shadow-xl overflow-hidden animate-fade-in p-8">
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#EE1D23] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/25">
              <span className="text-white font-black text-lg">A</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Airtel <span className="font-light text-slate-500">StockDistro</span>
            </h1>
            <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">
              FSC Stock & Sales Management
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 text-xs animate-slide-down">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <span className="font-bold">Authentication failed:</span> {errorMsg}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-3 text-xs animate-slide-down">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Staff Email Address
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="manager@airtel.com"
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#EE1D23]/50 focus:outline-none rounded-2xl px-4 py-3 text-sm text-slate-800 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Security Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#EE1D23]/50 focus:outline-none rounded-2xl px-4 py-3 text-sm text-slate-800 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#EE1D23] hover:bg-red-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-red-500/15 flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  Verifying Security Tokens...
                </>
              ) : (
                <>
                  <LockOpen className="w-4 h-4" />
                  Authenticate Staff Account
                </>
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-150 pt-6 text-center text-xs text-slate-400 leading-relaxed">
            <p className="font-semibold text-slate-500 mb-2">Predefined Accounts for Testing & User Management:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-left">
              <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
                <p className="font-extrabold text-red-700">Admin Account</p>
                <p className="font-mono text-slate-600 mt-0.5">admin@airtel.com</p>
                <p className="font-mono text-slate-400">pwd: admin123</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <p className="font-extrabold text-slate-700">Manager Account</p>
                <p className="font-mono text-slate-600 mt-0.5">manager@airtel.com</p>
                <p className="font-mono text-slate-400">pwd: manager123</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <p className="font-extrabold text-slate-700">FSC Agent Account</p>
                <p className="font-mono text-slate-600 mt-0.5">rajesh@airtel.com</p>
                <p className="font-mono text-slate-400">pwd: fsc123</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-red-500/10 selection:text-red-950">
      
      {/* HEADER NAVIGATION */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col sm:flex-row justify-between items-center shrink-0 sticky top-0 z-40 shadow-sm/5 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#EE1D23] rounded-full flex items-center justify-center shadow-md">
            <span className="text-white font-black text-sm">A</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Airtel <span className="font-normal text-slate-500">StockDistro</span>
              </h1>
              {isStandaloneMode ? (
                <span className="bg-sky-50 text-sky-700 border border-sky-200/60 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                  Standalone Mode
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Cloud Linked
                </span>
              )}
            </div>
            <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">
              FSC Allocation & Sales Processing Portal
            </p>
          </div>
        </div>

        {/* WORKSPACE SELECTION TABS */}
        <nav className="flex bg-slate-100/95 border border-slate-200/80 p-1 rounded-2xl gap-1 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'dashboard' 
                ? 'bg-[#141414] text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            Dashboard
          </button>

          {(user.role === 'Admin' || user.role === 'Manager') && (
            <>
              <button
                onClick={() => setActiveTab('dailyStock')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'dailyStock' 
                    ? 'bg-[#141414] text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                Daily Stock
              </button>
              <button
                onClick={() => setActiveTab('allocations')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'allocations' 
                    ? 'bg-[#141414] text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                FSC Allocations
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sales' 
                ? 'bg-[#141414] text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Sales Sheets
          </button>

          {(user.role === 'Admin' || user.role === 'Manager') && (
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'reports' 
                  ? 'bg-[#141414] text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Reports
            </button>
          )}

          {(user.role === 'Admin' || user.role === 'Manager') && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'users' 
                  ? 'bg-[#141414] text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Users className="w-4 h-4" />
              Users
            </button>
          )}
        </nav>

        {/* ACCOUNT AVATAR / STATUS */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-900">{user.name}</p>
            <p className="text-[10px] text-[#EE1D23] font-extrabold tracking-wide uppercase">{user.role} Account</p>
          </div>
          <button
            onClick={handleLogOut}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer flex items-center justify-center"
            title="Log out from system"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* FEEDBACK LABELS */}
      {errorMsg && (
        <div className="max-w-7xl mx-auto w-full px-8 pt-4">
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center justify-between text-xs animate-slide-down">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-700 hover:text-rose-900 font-extrabold uppercase ml-4">Dismiss</button>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="max-w-7xl mx-auto w-full px-8 pt-4">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between text-xs animate-slide-down">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-extrabold uppercase ml-4">Dismiss</button>
          </div>
        </div>
      )}

      {/* CORE WORKSPACE SCREEN */}
      <main className="flex-grow p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">

        {/* TAB 1: BENTO GRID DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-grow">
            
            {/* Primary Stock Stat (2x2 grid) */}
            <div className="md:col-span-2 md:row-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      Total On-Hand Inventory Pool
                    </h2>
                    <p className="text-5xl font-black text-slate-900 tracking-tight mt-1">
                      ₹{totalStockOnHandAmount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-emerald-500 text-xs font-semibold mt-1">
                      ↑ 14.2% from last accounting cycle
                    </p>
                  </div>
                  <span className="bg-[#EE1D23]/10 text-[#EE1D23] px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide">
                    Live Stock
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Flexy Balance</p>
                    <p className="text-lg font-extrabold text-slate-800 mt-0.5">
                      ₹{(dailyStocks[0]?.flexy || 105000).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-slate-400 text-[10px] font-bold uppercase">SIM Inventory</p>
                    <p className="text-lg font-extrabold text-slate-800 mt-0.5">
                      {dailyStocks[0]?.sim || 350} Units
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Bar Charts */}
              <div className="mt-8">
                <div className="flex items-end gap-1.5 h-24">
                  <div className="flex-1 bg-slate-100 rounded-lg h-[40%]" title="Mon"></div>
                  <div className="flex-1 bg-slate-100 rounded-lg h-[60%]" title="Tue"></div>
                  <div className="flex-1 bg-slate-100 rounded-lg h-[35%]" title="Wed"></div>
                  <div className="flex-1 bg-[#EE1D23] rounded-lg h-[85%]" title="Thu (Peak Sales)"></div>
                  <div className="flex-1 bg-slate-100 rounded-lg h-[55%]" title="Fri"></div>
                  <div className="flex-1 bg-slate-100 rounded-lg h-[70%]" title="Sat"></div>
                  <div className="flex-1 bg-slate-200 rounded-lg h-[90%]" title="Sun"></div>
                </div>
                <div className="flex justify-between mt-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
            </div>

            {/* Distribution Efficiency (1x1) */}
            <div className="bg-[#141414] rounded-3xl p-6 text-white flex flex-col justify-between">
              <div>
                <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                  Active FSC Agents
                </p>
                <p className="text-4xl font-black mt-2 text-white">
                  {totalActiveAgentsCount}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#141414] bg-red-600 text-[10px] flex items-center justify-center font-bold text-white">RK</div>
                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#141414] bg-[#EE1D23] text-[10px] flex items-center justify-center font-bold text-white">SV</div>
                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#141414] bg-slate-700 text-[10px] flex items-center justify-center font-bold text-white">AM</div>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold">
                  100% active NCR coverage
                </p>
              </div>
            </div>

            {/* Quick Actions Card (1x1) */}
            <div className="bg-[#EE1D23] rounded-3xl p-6 text-white flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <Plus className="w-8 h-8 text-white" />
                <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-md">
                  Console shortcuts
                </span>
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-black leading-tight">
                  Record FSC<br />Daily Sales
                </p>
                <button
                  onClick={() => {
                    setActiveTab('sales');
                  }}
                  className="bg-white text-[#EE1D23] font-bold text-xs px-4 py-2 rounded-xl transition-all hover:bg-slate-100 flex items-center gap-1 cursor-pointer select-none"
                >
                  Log Sales Sheet
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Low Stock watch Critical alerts (2x1) */}
            <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Critical Alerts / Low Stock Watch
                </h3>
                <span className="bg-rose-50 text-rose-700 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Attention Required
                </span>
              </div>

              <div className="space-y-3">
                {criticalAirtelAlerts.map((alert, i) => (
                  <div 
                    key={i} 
                    className={`flex items-center justify-between p-3 rounded-2xl border ${
                      alert.level === 'rose' 
                        ? 'bg-rose-50/50 border-rose-100 text-rose-900' 
                        : 'bg-amber-50/50 border-amber-100 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${alert.level === 'rose' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{alert.item}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{alert.hub}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold">
                      {alert.threshold}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Shipment Distributions Feed (2x1) */}
            <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
                  Recent Sales Reports Status
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                        <th className="pb-1">FSC</th>
                        <th className="pb-1 text-center">Amount</th>
                        <th className="pb-1 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {sales.slice(0, 3).map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-bold text-slate-800">
                            {allUsers.find(u => u.id === s.fscId)?.name || s.fscName || 'FSC'}
                          </td>
                          <td className="py-2.5 text-center font-bold text-slate-600">
                            ₹{s.saleAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              s.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              s.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              s.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                              'bg-slate-50 text-slate-600 border border-slate-100'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <button 
                onClick={() => setActiveTab('sales')}
                className="text-[10px] text-[#EE1D23] font-bold uppercase tracking-wider text-right hover:underline mt-4 self-end"
              >
                Go to Sales Sheet Queue →
              </button>
            </div>

            {/* Simulated Live Hub Coverage Map (2x1) */}
            <div className="md:col-span-2 bg-slate-900 rounded-3xl relative overflow-hidden flex items-center justify-center min-h-[160px] p-6 text-white">
              <div className="absolute inset-0 bg-radial from-slate-800/40 to-slate-950 opacity-90"></div>
              <div className="relative z-10 text-center space-y-1">
                <p className="text-[9px] text-red-500 font-extrabold uppercase tracking-widest">
                  NCR Coverage Hub Network
                </p>
                <p className="font-extrabold text-white text-sm">Real-Time Distribution Map</p>
                <p className="text-[10px] text-slate-400 font-bold font-mono">5 active hubs connected</p>
              </div>

              {/* simulated pulsing hot spots */}
              <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-[#EE1D23] rounded-full border-2 border-white shadow-lg shadow-red-500/50 animate-pulse"></div>
              <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-[#EE1D23] rounded-full border-2 border-white shadow-lg shadow-red-500/50 animate-bounce"></div>
              <div className="absolute top-1/2 right-1/2 w-3 h-3 bg-[#EE1D23] rounded-full border-2 border-white shadow-lg shadow-red-500/50"></div>
            </div>

          </div>
        )}

        {/* TAB 2: DAILY STOCKS */}
        {activeTab === 'dailyStock' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Stock Logging Form */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-4 shadow-sm self-start">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="p-2 rounded-2xl bg-red-50 text-[#EE1D23]">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Daily Stock Entry</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Register Opening Balance Pool</p>
                </div>
              </div>

              <form onSubmit={handleCreateStock} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Inventory Date</label>
                  <input
                    type="date"
                    required
                    value={stockDate}
                    onChange={(e) => setStockDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#EE1D23]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Opening Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={stockOpeningAmount}
                      onChange={(e) => setStockOpeningAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Opening SIM Count</label>
                    <input
                      type="number"
                      required
                      value={stockOpeningSim}
                      onChange={(e) => setStockOpeningSim(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Flexy Airtime Allocation (₹)</label>
                  <input
                    type="number"
                    required
                    value={stockFlexy}
                    onChange={(e) => setStockFlexy(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Flexy Claim Batch 1 (₹)</label>
                    <input
                      type="number"
                      required
                      value={stockFlexyClaim1}
                      onChange={(e) => setStockFlexyClaim1(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Flexy Claim Batch 2 (₹)</label>
                    <input
                      type="number"
                      required
                      value={stockFlexyClaim2}
                      onChange={(e) => setStockFlexyClaim2(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">SIM Cards Total Count</label>
                  <input
                    type="number"
                    required
                    value={stockSim}
                    onChange={(e) => setStockSim(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#EE1D23] hover:bg-red-700 text-white font-bold py-2.5 rounded-2xl text-xs transition-all shadow-md mt-2 cursor-pointer select-none"
                >
                  Save Daily Stock Pool
                </button>
              </form>
            </div>

            {/* Daily Stocks List */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                  Inventory Log History
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">List of recorded daily opening stocks at point</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="p-3">Stock Date</th>
                      <th className="p-3">Opening Cash</th>
                      <th className="p-3">Opening SIM</th>
                      <th className="p-3">Flexy Balance</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyStocks.map((stock) => (
                      <tr key={stock.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-extrabold text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {stock.date}
                        </td>
                        <td className="p-3 font-semibold text-slate-650">₹{stock.openingAmount.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-semibold text-slate-650">{stock.openingSim} SIMs</td>
                        <td className="p-3 font-semibold text-slate-650">₹{stock.flexy.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteEntity('stock', stock.id)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {dailyStocks.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">No stock entries registered. Use the logging panel to create one.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: FSC ALLOCATIONS */}
        {activeTab === 'allocations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Allocation Creation Form */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-4 shadow-sm self-start">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="p-2 rounded-2xl bg-red-50 text-[#EE1D23]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-950">FSC Allocation</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Distribute Stock to FSC Coordinators</p>
                </div>
              </div>

              <form onSubmit={handleCreateAllocation} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Distribution Date</label>
                  <input
                    type="date"
                    required
                    value={allocDate}
                    onChange={(e) => setAllocDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Field Sales Coordinator (FSC)</label>
                  <select
                    required
                    value={allocFscId}
                    onChange={(e) => setAllocFscId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none"
                  >
                    {fscUsersList.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                    {fscUsersList.length === 0 && (
                      <option value="">No registered FSCs</option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Opening Balance (₹)</label>
                    <input
                      type="number"
                      required
                      value={allocOpeningBalance}
                      onChange={(e) => setAllocOpeningBalance(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Opening SIM Count</label>
                    <input
                      type="number"
                      required
                      value={allocOpeningSim}
                      onChange={(e) => setAllocOpeningSim(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-3">
                  <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1.5">Auto-Refill Batches</p>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-0.5">
                      <label className="text-[8px] font-extrabold uppercase text-slate-400">Batch 1 (₹)</label>
                      <input
                        type="number"
                        required
                        value={allocAutoRefill1}
                        onChange={(e) => setAllocAutoRefill1(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[8px] font-extrabold uppercase text-slate-400">Batch 2 (₹)</label>
                      <input
                        type="number"
                        required
                        value={allocAutoRefill2}
                        onChange={(e) => setAllocAutoRefill2(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[8px] font-extrabold uppercase text-slate-400">Batch 3 (₹)</label>
                      <input
                        type="number"
                        required
                        value={allocAutoRefill3}
                        onChange={(e) => setAllocAutoRefill3(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-3">
                  <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1.5">EasyCharge (EC) Manual Top-ups</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <label className="text-[8px] font-extrabold uppercase text-slate-400">Topup 1 (₹)</label>
                      <input
                        type="number"
                        required
                        value={allocEcManual1}
                        onChange={(e) => setAllocEcManual1(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[8px] font-extrabold uppercase text-slate-400">Topup 2 (₹)</label>
                      <input
                        type="number"
                        required
                        value={allocEcManual2}
                        onChange={(e) => setAllocEcManual2(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Distributed SIM Cards Count</label>
                  <input
                    type="number"
                    required
                    value={allocSim}
                    onChange={(e) => setAllocSim(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#EE1D23] hover:bg-red-700 text-white font-bold py-2.5 rounded-2xl text-xs transition-all shadow-md mt-2 cursor-pointer select-none"
                >
                  Allocate Agent Stock
                </button>
              </form>
            </div>

            {/* Allocations History List */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                  FSC Active Distributions History
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">List of recorded daily allocations to agents</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="p-3">Date</th>
                      <th className="p-3">Recipient FSC</th>
                      <th className="p-3">Total Cash/Airtime Value</th>
                      <th className="p-3">Allocated SIMs</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allocations.map((alloc) => (
                      <tr key={alloc.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-slate-600 font-semibold">{alloc.date}</td>
                        <td className="p-3 font-extrabold text-slate-900 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#EE1D23]" />
                          {alloc.fscName || 'Agent'}
                        </td>
                        <td className="p-3 font-bold text-slate-800">₹{alloc.totalAllocated.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-semibold text-slate-650">{alloc.sim} SIMs</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteEntity('allocation', alloc.id)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {allocations.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">No agent allocations found. Select options to allocate stock.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: SALES & WORKFLOW */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            
            {/* Split layout: Review board (Managers/Approvers/Admins) or logging (All users) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Logging Form panel */}
              <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-4 shadow-sm self-start">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="p-2 rounded-2xl bg-red-50 text-[#EE1D23]">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-950">Record Daily Sales Sheet</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Submit FSC closing balances and sales</p>
                  </div>
                </div>

                <form onSubmit={handleCreateSale} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Sales Date</label>
                    <input
                      type="date"
                      required
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none"
                    />
                  </div>

                  {user.role !== 'FSC' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400">FSC Agent</label>
                      <select
                        required
                        value={saleFscId}
                        onChange={(e) => setSaleFscId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none"
                      >
                        {fscUsersList.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* INFO CONTAINER ABOUT AUTOFILL */}
                  <div className="p-3.5 bg-[#EE1D23]/5 rounded-2xl border border-[#EE1D23]/10 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#EE1D23] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#EE1D23]">Dynamic Allocation Sync</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Picking a date with an active FSC allocation will automatically retrieve and populate opening balances and refill values.</p>
                    </div>
                  </div>

                  {/* Manual / Auto inputs */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400">Opening Balance (₹)</label>
                      <input
                        type="number"
                        required
                        value={saleOpeningBalance}
                        onChange={(e) => setSaleOpeningBalance(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400">Closing Balance (₹)</label>
                      <input
                        type="number"
                        required
                        value={saleClosingBalance}
                        onChange={(e) => setSaleClosingBalance(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400">Net Amount Remitted (₹)</label>
                      <input
                        type="number"
                        required
                        value={saleAmount}
                        onChange={(e) => setSaleAmount(Number(e.target.value))}
                        className="w-full bg-white border border-[#EE1D23]/30 hover:border-[#EE1D23]/50 rounded-lg px-2.5 py-1.5 text-xs font-black text-[#EE1D23]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400">Previous Short (₹)</label>
                      <input
                        type="number"
                        required
                        value={salePreviousShort}
                        onChange={(e) => setSalePreviousShort(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">SIM Cards Auditing</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-extrabold uppercase text-slate-400">Opening SIM</label>
                        <input
                          type="number"
                          required
                          value={saleOpeningSim}
                          onChange={(e) => setSaleOpeningSim(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-extrabold uppercase text-slate-400">SIMs Sold</label>
                        <input
                          type="number"
                          required
                          value={saleSim}
                          onChange={(e) => setSaleSim(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-extrabold uppercase text-slate-400">Closing SIM</label>
                        <input
                          type="number"
                          required
                          value={saleClosingSim}
                          onChange={(e) => setSaleClosingSim(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Remarks / Collector Notes</label>
                    <textarea
                      value={saleRemarks}
                      onChange={(e) => setSaleRemarks(e.target.value)}
                      placeholder="Input collection references, bank slips, shortages..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none h-16 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#141414] hover:bg-black text-white font-bold py-2.5 rounded-2xl text-xs transition-all shadow-md mt-2 cursor-pointer select-none"
                  >
                    Save Sales Draft
                  </button>
                </form>
              </div>

              {/* Sales sheets queue / list */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                      FSC Daily Sales processing board
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold">Log of agent submissions, approvals, and workflow steps</p>
                  </div>

                  {/* Filter elements */}
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700"
                    >
                      <option value="">All Statuses</option>
                      <option value="Draft">Draft</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Search FSC agent..."
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-700 w-36"
                    />
                  </div>
                </div>

                {/* Table list queue */}
                <div className="overflow-x-auto flex-grow">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="p-3">FSC Name</th>
                        <th className="p-3">Report Date</th>
                        <th className="p-3">Net Sales (₹)</th>
                        <th className="p-3">Shortage Amount (₹)</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Workflow</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {filteredSales.map((s) => {
                        const agentName = allUsers.find(u => u.id === s.fscId)?.name || s.fscName || 'FSC Agent';
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/40">
                            <td className="p-3 font-extrabold text-slate-900 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              {agentName}
                            </td>
                            <td className="p-3 font-semibold text-slate-500">{s.date}</td>
                            <td className="p-3 font-extrabold text-slate-800">
                              ₹{s.saleTotal.toLocaleString('en-IN')}
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Remitted: ₹{s.saleAmount.toLocaleString('en-IN')}</p>
                            </td>
                            <td className="p-3">
                              {s.shortAmount > 0 ? (
                                <span className="text-red-600 font-extrabold flex items-center gap-0.5">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  ₹{s.shortAmount.toLocaleString('en-IN')}
                                </span>
                              ) : (
                                <span className="text-emerald-600 font-bold">No shortage</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                s.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                s.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                s.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                'bg-slate-150 text-slate-600 border border-slate-200'
                              }`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                              
                              {/* Submit action for Draft reports */}
                              {s.status === 'Draft' && (
                                <button
                                  onClick={() => handleSubmitSaleDraft(s.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                  title="Submit for Approval"
                                >
                                  Submit
                                </button>
                              )}

                              {/* Approvals action button for Managers / Approvers / Admins */}
                              {s.status === 'Pending' && ['Admin', 'Manager', 'Approver'].includes(user.role) && (
                                <button
                                  onClick={() => {
                                    setSelectedSaleToReview(s);
                                    setReviewNoteText(s.remarks || '');
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                >
                                  Review
                                </button>
                              )}

                              {/* Delete option for non-Approved */}
                              {s.status !== 'Approved' && (
                                <button
                                  onClick={() => handleDeleteEntity('sale', s.id)}
                                  className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Report"
                                >
                                  <Trash2 className="w-3.5 h-3.5 inline" />
                                </button>
                              )}

                            </td>
                          </tr>
                        );
                      })}
                      {filteredSales.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">No matching sales records found in active queue.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

            {/* Interactive review modal if sale selected */}
            {selectedSaleToReview && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-5 animate-slide-up shadow-2xl">
                  
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Review FSC Sales report</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        Workflow Stage: Pendency Approval
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedSaleToReview(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1 text-xs"
                    >
                      Close
                    </button>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="text-slate-400 font-bold uppercase text-[9px]">FSC Coordinator</p>
                      <p className="font-extrabold text-slate-800 mt-0.5">
                        {allUsers.find(u => u.id === selectedSaleToReview.fscId)?.name || 'FSC Agent'}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="text-slate-400 font-bold uppercase text-[9px]">Sales Report Date</p>
                      <p className="font-extrabold text-slate-800 mt-0.5">{selectedSaleToReview.date}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="text-slate-400 font-bold uppercase text-[9px]">Computed Airtime Sales Total</p>
                      <p className="font-black text-[#EE1D23] mt-0.5">₹{selectedSaleToReview.saleTotal.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="text-slate-400 font-bold uppercase text-[9px]">Net Cash Settle / Remitted</p>
                      <p className="font-extrabold text-emerald-600 mt-0.5">₹{selectedSaleToReview.saleAmount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="space-y-1 bg-slate-50 p-4 rounded-2xl">
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Collector Notes & Comments</p>
                    <p className="text-xs text-slate-700 italic mt-1 leading-relaxed">
                      "{selectedSaleToReview.remarks || 'No notes provided by FSC.'}"
                    </p>
                  </div>

                  {/* Approvers Feedback Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Reviewer Note / Comments</label>
                    <textarea
                      value={reviewNoteText}
                      onChange={(e) => setReviewNoteText(e.target.value)}
                      placeholder="Add matching bank reference number, short recovery timeline details, or reason for rejection..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-[#EE1D23]"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => handleReviewSaleSubmit('reject')}
                      className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold py-2.5 rounded-2xl text-xs cursor-pointer select-none"
                    >
                      Reject Submission
                    </button>
                    <button
                      onClick={() => handleReviewSaleSubmit('approve')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-2xl text-xs cursor-pointer select-none"
                    >
                      Approve & Settle
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 5: REPORTS & AUDITING */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            
            {/* Filter Date panel */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-end gap-4 justify-between">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Audit Start Date</label>
                  <input
                    type="date"
                    value={reportFromDate}
                    onChange={(e) => setReportFromDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Audit End Date</label>
                  <input
                    type="date"
                    value={reportToDate}
                    onChange={(e) => setReportToDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={fetchReportSummaries}
                className="bg-[#EE1D23] hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer select-none"
              >
                <RefreshCw className="w-4 h-4 animate-pulse" />
                Compile Ledger Summaries
              </button>
            </div>

            {/* Reports Result Grid Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                    Airtel Daily Summary Report Ledger
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">Consolidated sales, distributions, and short logs grouped by date</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="p-3">Report Date</th>
                        <th className="p-3">Active FSCs</th>
                        <th className="p-3">Distributed Allocations (₹)</th>
                        <th className="p-3">Net Sales Collected (₹)</th>
                        <th className="p-3">Total Shortages (₹)</th>
                        <th className="p-3 text-right">Statuses</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportSummaries.map((summary, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 font-medium">
                          <td className="p-3 font-extrabold text-slate-900">{summary.date}</td>
                          <td className="p-3 text-slate-650">{summary.totalFsc} FSCs</td>
                          <td className="p-3 text-slate-800">₹{summary.totalAllocated.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-emerald-600 font-extrabold">₹{summary.totalSaleAmount.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-red-600 font-extrabold">₹{summary.totalShort.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap text-[10px] font-bold">
                            {summary.approvedCount > 0 && <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">{summary.approvedCount} Ok</span>}
                            {summary.pendingCount > 0 && <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">{summary.pendingCount} Pend</span>}
                          </td>
                        </tr>
                      ))}
                      {reportSummaries.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">Select date parameters and click compile to compute metrics.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Side export panel */}
              <div className="lg:col-span-1 bg-[#141414] rounded-3xl p-6 text-white flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-3">
                    Accounting Export
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Compile audit logs for standard ERP synchronization. Exports are prepared in structured CJS schemas aligning with Airtel ledger layouts.
                  </p>

                  <div className="space-y-2">
                    <div className="bg-slate-800/50 p-3 rounded-2xl flex justify-between items-center text-xs">
                      <span className="text-slate-300">Format Scheme</span>
                      <span className="font-extrabold">Airtel-ERP (CSV)</span>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-2xl flex justify-between items-center text-xs">
                      <span className="text-slate-300">Target Range</span>
                      <span className="font-extrabold text-red-500">{reportSummaries.length} days</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="w-full bg-[#EE1D23] hover:bg-red-700 text-white font-extrabold py-3 rounded-2xl text-xs transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer mt-6"
                >
                  <Download className="w-4 h-4" />
                  Download Reconciliation Report
                </button>
              </div>

            </div>

          </div>
        )}

        {/* TAB 6: USER MANAGEMENT */}
        {activeTab === 'users' && (user.role === 'Admin' || user.role === 'Manager') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Create user form */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-4 shadow-sm self-start">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="p-2 rounded-2xl bg-red-50 text-[#EE1D23]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Add Staff Account</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Register staff credentials</p>
                </div>
              </div>

              {user.role !== 'Admin' && (
                <div className="bg-amber-50 border border-amber-100/80 p-3.5 rounded-2xl text-[10px] text-amber-800 leading-relaxed font-semibold">
                  ⚠️ Read-Only Mode: Creating, updating, or removing staff accounts requires Full System Administrator permissions.
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Full Name</label>
                  <input
                    type="text"
                    required
                    disabled={user.role !== 'Admin'}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Rajesh Kumar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Email Address</label>
                  <input
                    type="email"
                    required
                    disabled={user.role !== 'Admin'}
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="rajesh@airtel.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Airtel System Role</label>
                  <select
                    disabled={user.role !== 'Admin'}
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="FSC">FSC (Field Sales Coordinator)</option>
                    <option value="Approver">Approver (Regional Approver)</option>
                    <option value="Manager">Manager (Distribution Manager)</option>
                    <option value="Admin">Admin (Full System Admin)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Temporary Password</label>
                  <input
                    type="password"
                    required
                    disabled={user.role !== 'Admin'}
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={user.role !== 'Admin'}
                  className="w-full bg-[#EE1D23] hover:bg-red-700 text-white font-bold py-2.5 rounded-2xl text-xs transition-all shadow-md mt-2 disabled:opacity-40 disabled:cursor-not-allowed select-none"
                >
                  Register Staff Member
                </button>
              </form>
            </div>

            {/* Users listing */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                  Airtel Staff Accounts Registry
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">List of registered system users and security roles</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="p-3">Staff Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Role Badge</th>
                      <th className="p-3 text-right">Account Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {allUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-extrabold text-slate-900 flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          {u.name}
                        </td>
                        <td className="p-3 font-semibold text-slate-500">{u.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            u.role === 'Admin' ? 'bg-red-50 text-red-700 border border-red-100' :
                            u.role === 'Manager' ? 'bg-slate-800 text-slate-100' :
                            u.role === 'Approver' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                            'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className={`${user.role === 'Admin' && u.id !== user.id ? 'text-slate-400 hover:text-red-600 cursor-pointer' : 'text-slate-200 cursor-not-allowed'} p-1 rounded-lg transition-colors`}
                            title={user.role === 'Admin' ? "Delete Account" : "Admin privileges required to delete users"}
                            disabled={u.id === user.id || user.role !== 'Admin'} // Cannot delete self or if not admin
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* SYSTEM BOTTOM STATUS BAR */}
      <footer className="bg-white border-t border-slate-200 px-8 py-3.5 flex justify-between items-center shrink-0 text-slate-400 text-[10px]">
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-bold text-slate-500 uppercase">System Core Operational</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span>Secure Tunnel Engine:</span>
            <span className="font-mono text-slate-600 font-bold">SHA-256 Enabled</span>
          </div>
        </div>
        <p className="font-mono">Sync Reference Status: OK</p>
      </footer>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { handleMockApiRequest, initializeMockDatabase } from './mockApi';

// Register global appFetch fallback for standalone hosting
// (Enables static deployments like Vercel, Netlify, or GitHub Pages when backend is offline)
initializeMockDatabase();

const originalFetch = window.fetch;

const appFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
  if (url.startsWith('/api')) {
    try {
      const response = await originalFetch(input, init);
      return response;
    } catch (err) {
      console.warn(`[Airtel Distro Standalone] Server offline. Accessing local mock storage for: ${url}`, err);
      return handleMockApiRequest(url, init);
    }
  }
  return originalFetch(input, init);
};

window.fetch = appFetch;
const fetch = appFetch;


// Import custom icons and loaders
import { AlertCircle, CheckCircle, RefreshCw, Sparkles } from 'lucide-react';

// Import Types and Subcomponents
import { UserDto, DailyStock, Allocation, Sale, ReportSummary, CustomFieldConfig } from './types';
import { LoginView } from './components/LoginView';
import { Sidebar } from './components/Sidebar';
import { DashboardTab } from './components/DashboardTab';
import { DailyStockTab } from './components/DailyStockTab';
import { AllocationsTab } from './components/AllocationsTab';
import { SalesTab } from './components/SalesTab';
import { ReportsTab } from './components/ReportsTab';
import { UsersTab } from './components/UsersTab';
import { MastersTab } from './components/MastersTab';
import { UserRolesTab } from './components/UserRolesTab';
import { AuditLogTab } from './components/AuditLogTab';

export default function App() {
  // --- CORE STATE MANAGERS ---
  
  // JWT Token and Authenticated User States
  const [token, setToken] = useState<string | null>(localStorage.getItem('airtel_token'));
  const [user, setUser] = useState<UserDto | null>(null);

  // Global UI feedback parameters
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isStandaloneMode, setIsStandaloneMode] = useState<boolean>(false);

  // Auth form controllers
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  // Navigation controller
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dailyStock' | 'allocations' | 'sales' | 'reports' | 'users' | 'masters-fsc' | 'masters-stock' | 'user-roles' | 'audit'>('dashboard');

  // Primary Data Stores
  const [dailyStocks, setDailyStocks] = useState<DailyStock[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [allUsers, setAllUsers] = useState<UserDto[]>([]);
  const [customFieldConfigs, setCustomFieldConfigs] = useState<CustomFieldConfig[]>([]);
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);

  // Filtering & Query States
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');

  // Daily Stock Form Fields
  const [stockDate, setStockDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [stockOpeningAmount, setStockOpeningAmount] = useState<number>(150000);
  const [stockOpeningSim, setStockOpeningSim] = useState<number>(500);
  const [stockFlexy, setStockFlexy] = useState<number>(100000);
  const [stockFlexyClaim1, setStockFlexyClaim1] = useState<number>(20000);
  const [stockFlexyClaim2, setStockFlexyClaim2] = useState<number>(15000);
  const [stockSim, setStockSim] = useState<number>(350);

  // FSC Allocation Form Fields
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

  // Daily FSC Sales Form Fields
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

  // Admin User Creation Fields
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<'Admin' | 'Manager' | 'Approver' | 'FSC'>('FSC');
  const [userPassword, setUserPassword] = useState<string>('');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  // Editing Identifier References
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingAllocId, setEditingAllocId] = useState<string | null>(null);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Approver / Manager review references
  const [selectedSaleToReview, setSelectedSaleToReview] = useState<Sale | null>(null);
  const [reviewNoteText, setReviewNoteText] = useState<string>('');

  // Audits & Compilation Dates
  const [reportFromDate, setReportFromDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [reportToDate, setReportToDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reportSummaries, setReportSummaries] = useState<ReportSummary[]>([]);

  // --- AUTOMATED INITIALIZATION & DATA SYNC ---

  // Verify API Server availability
  useEffect(() => {
    window.fetch('/api/health')
      .then(res => {
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          return res.json();
        }
        throw new Error('Fallback response');
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

  // Fetch logged in profile details
  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    }
  }, [token]);

  // --- ROLE-BASED ACCESS CONTROL (RBAC) CONTROLLERS ---

  // Calculate dynamic allowed tabs with hardcoded fallback support
  const allowedTabsForUser = React.useMemo(() => {
    if (!user) return [];
    if (user.role === 'Admin') {
      return ['dashboard', 'dailyStock', 'allocations', 'sales', 'reports', 'users', 'masters-fsc', 'masters-stock', 'user-roles', 'audit'];
    }
    const matchingPermission = rolePermissions.find(p => p.role === user.role);
    if (matchingPermission) {
      return matchingPermission.allowedTabs;
    }
    
    // Fallback safety values before live API data is parsed
    if (user.role === 'Manager') {
      return ['dashboard', 'dailyStock', 'allocations', 'sales', 'reports', 'masters-fsc', 'masters-stock', 'audit'];
    }
    if (user.role === 'Approver') {
      return ['dashboard', 'sales', 'reports'];
    }
    // Default fallback is FSC
    return ['dashboard', 'sales'];
  }, [user, rolePermissions]);

  // Restrict screen entry dynamically to allowed items only
  useEffect(() => {
    if (user && allowedTabsForUser.length > 0) {
      if (!allowedTabsForUser.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [user, activeTab, allowedTabsForUser]);


  // Load backend statistics and logs upon tab transition
  useEffect(() => {
    if (user) {
      loadTabContent();
    }
  }, [user, activeTab]);

  // Watch distributions for automatically populating sale forms on date selection
  useEffect(() => {
    if (saleDate && (user?.role === 'FSC' ? user.id : saleFscId)) {
      const selectedFscId = user?.role === 'FSC' ? user.id : saleFscId;
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

  // Auto-populate daily stock opening balance when stockDate changes (and we are not editing)
  useEffect(() => {
    if (stockDate && !editingStockId && dailyStocks.length > 0) {
      // Find the daily stock with the maximum date that is strictly less than stockDate
      const previousStocks = dailyStocks
        .filter(s => s.date < stockDate)
        .sort((a, b) => b.date.localeCompare(a.date));
      
      if (previousStocks.length > 0) {
        const prev = previousStocks[0];
        const closingAmt = (prev as any).closingAmount !== undefined ? (prev as any).closingAmount : prev.openingAmount;
        const closingSimCount = (prev as any).closingSim !== undefined ? (prev as any).closingSim : prev.openingSim;
        setStockOpeningAmount(closingAmt);
        setStockOpeningSim(closingSimCount);
      } else {
        setStockOpeningAmount(150000);
        setStockOpeningSim(500);
      }
    }
  }, [stockDate, dailyStocks, editingStockId]);

  // Auto-populate allocation opening balance when allocDate or allocFscId changes (and we are not editing)
  useEffect(() => {
    if (allocDate && allocFscId && !editingAllocId && sales.length > 0) {
      // Find the most recent approved sales sheet for this FSC that is strictly less than allocDate
      const previousSales = sales
        .filter(s => s.fscId === allocFscId && s.date < allocDate && s.status === 'Approved')
        .sort((a, b) => b.date.localeCompare(a.date));
      
      if (previousSales.length > 0) {
        const prevSale = previousSales[0];
        setAllocOpeningBalance(prevSale.closingBalance || 0);
        setAllocOpeningSim(prevSale.closingSim || 0);
      } else {
        // If no approved sale is found, let's search any status sales sheet as a fallback
        const anyPrevSales = sales
          .filter(s => s.fscId === allocFscId && s.date < allocDate)
          .sort((a, b) => b.date.localeCompare(a.date));
        if (anyPrevSales.length > 0) {
          setAllocOpeningBalance(anyPrevSales[0].closingBalance || 0);
          setAllocOpeningSim(anyPrevSales[0].closingSim || 0);
        } else {
          setAllocOpeningBalance(0);
          setAllocOpeningSim(0);
        }
      }
    }
  }, [allocDate, allocFscId, sales, editingAllocId]);

  // --- REST CLIENT API TRIGGERS ---

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
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
        setSuccessMsg(`Access Granted! Welcome, ${data.user.name}.`);
        setActiveTab('dashboard');
      } else {
        setErrorMsg(data.error || 'Invalid credentials or access level.');
      }
    } catch (err) {
      setErrorMsg('Endpoint unreachable. Connecting with offline sandbox credentials...');
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

  const loadTabContent = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Retrieve users registry
      if (user?.role === 'Admin' || user?.role === 'Manager') {
        const usersRes = await fetch('/api/auth/users', { headers: { 'Authorization': `Bearer ${token}` } });
        const usersData = await usersRes.json();
        if (usersData.success) {
          setAllUsers(usersData.users);
          const fscUsers = usersData.users.filter((u: any) => u.role === 'FSC');
          if (fscUsers.length > 0 && !allocFscId) {
            setAllocFscId(fscUsers[0].id);
            setSaleFscId(fscUsers[0].id);
          }
        }
      }

      // Retrieve stock ledger
      if (user?.role === 'Admin' || user?.role === 'Manager') {
        const stocksRes = await fetch('/api/stock', { headers: { 'Authorization': `Bearer ${token}` } });
        const stocksData = await stocksRes.json();
        if (stocksData.success) setDailyStocks(stocksData.dailyStocks);
      }

      // Retrieve allocations ledger
      if (user?.role === 'Admin' || user?.role === 'Manager') {
        const allocsRes = await fetch('/api/allocation', { headers: { 'Authorization': `Bearer ${token}` } });
        const allocsData = await allocsRes.json();
        if (allocsData.success) setAllocations(allocsData.allocations);
      } else {
        setAllocations([]);
      }

      // Retrieve sales logs queue
      const salesRes = await fetch('/api/sale', { headers: { 'Authorization': `Bearer ${token}` } });
      const salesData = await salesRes.json();
      if (salesData.success) setSales(salesData.sales);

      // Retrieve custom fields configurations
      const configsRes = await fetch('/api/custom-fields', { headers: { 'Authorization': `Bearer ${token}` } });
      const configsData = await configsRes.json();
      if (configsData.success) {
        setCustomFieldConfigs(configsData.customFieldConfigs);
      }

      // Retrieve role-permissions configurations
      const permissionsRes = await fetch('/api/role-permissions', { headers: { 'Authorization': `Bearer ${token}` } });
      const permissionsData = await permissionsRes.json();
      if (permissionsData.success) {
        setRolePermissions(permissionsData.permissions || []);
      }

      // Trigger automatic report compilation on tab load
      if (activeTab === 'reports') {
        fetchReportSummaries();
      }

    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to fetch updated telemetry records from Cloud API.');
    } finally {
      setLoading(false);
    }
  };

  // --- STAFF & REGISTRY EDIT PRE-FILL & CANCEL ACTIONS ---

  /**
   * Setup form fields for Daily Inventory Stock edits
   */
  const handleEditStockClick = (stock: DailyStock) => {
    setEditingStockId(stock.id);
    setStockDate(stock.date);
    setStockOpeningAmount(stock.openingAmount);
    setStockOpeningSim(stock.openingSim);
    setStockFlexy(stock.flexy);
    setStockFlexyClaim1(stock.flexyClaim1 || 0);
    setStockFlexyClaim2(stock.flexyClaim2 || 0);
    setStockSim(stock.sim);
  };

  /**
   * Setup form fields for FSC Allocations edits
   */
  const handleEditAllocClick = (alloc: Allocation) => {
    setEditingAllocId(alloc.id);
    setAllocDate(alloc.date);
    setAllocFscId(alloc.fscId);
    setAllocOpeningBalance(alloc.openingBalance);
    setAllocOpeningSim(alloc.openingSim);
    setAllocAutoRefill1(alloc.autoRefill1 || 0);
    setAllocAutoRefill2(alloc.autoRefill2 || 0);
    setAllocAutoRefill3(alloc.autoRefill3 || 0);
    setAllocEcManual1(alloc.ecManual1 || 0);
    setAllocEcManual2(alloc.ecManual2 || 0);
    setAllocSim(alloc.sim);
  };

  /**
   * Setup form fields for Daily Sales sheets edits
   */
  const handleEditSaleClick = (sale: Sale) => {
    setEditingSaleId(sale.id);
    setSaleDate(sale.date);
    setSaleFscId(sale.fscId);
    setSaleOpeningBalance(sale.openingBalance);
    setSaleAutoRefill1(sale.autoRefill1 || 0);
    setSaleAutoRefill2(sale.autoRefill2 || 0);
    setSaleAutoRefill3(sale.autoRefill3 || 0);
    setSaleEcManual1(sale.ecManual1 || 0);
    setSaleEcManual2(sale.ecManual2 || 0);
    setSaleClosingBalance(sale.closingBalance);
    setSalePreviousShort(sale.previousShort || 0);
    setSaleOpeningSim(sale.openingSim || 0);
    setSaleSim(sale.sim);
    setSaleClosingSim(sale.closingSim || 0);
    setSaleRemarks(sale.remarks || '');
    setSaleAmount(sale.saleAmount || 0);
  };

  /**
   * Setup form fields for User account updates
   */
  const handleEditUserClick = (target: UserDto) => {
    setEditingUserId(target.id);
    setUserName(target.name);
    setUserEmail(target.email);
    setUserRole(target.role);
    setUserPassword(''); // Optional password reset on edits
    setUserPhoto(target.photo || null);
  };

  /**
   * Purge temporary editing IDs and return input state buffers to defaults
   */
  const handleCancelEdit = () => {
    setEditingStockId(null);
    setEditingAllocId(null);
    setEditingSaleId(null);
    setEditingUserId(null);

    // Baseline inventory inputs
    setStockDate(new Date().toISOString().split('T')[0]);
    setStockOpeningAmount(150000);
    setStockOpeningSim(500);
    setStockFlexy(100000);
    setStockFlexyClaim1(20000);
    setStockFlexyClaim2(15000);
    setStockSim(350);

    // Baseline allocation inputs
    setAllocDate(new Date().toISOString().split('T')[0]);
    setAllocFscId('');
    setAllocOpeningBalance(10000);
    setAllocOpeningSim(50);
    setAllocAutoRefill1(20000);
    setAllocAutoRefill2(15000);
    setAllocAutoRefill3(10000);
    setAllocEcManual1(5000);
    setAllocEcManual2(5000);
    setAllocSim(35);

    // Baseline sales inputs
    setSaleDate(new Date().toISOString().split('T')[0]);
    setSaleFscId('');
    setSaleOpeningBalance(0);
    setSaleAutoRefill1(0);
    setSaleAutoRefill2(0);
    setSaleAutoRefill3(0);
    setSaleEcManual1(0);
    setSaleEcManual2(0);
    setSaleClosingBalance(0);
    setSalePreviousShort(0);
    setSaleOpeningSim(0);
    setSaleSim(0);
    setSaleClosingSim(0);
    setSaleRemarks('');
    setSaleAmount(0);

    // Baseline user inputs
    setUserName('');
    setUserEmail('');
    setUserRole('FSC');
    setUserPassword('');
    setUserPhoto(null);
  };

  // Log Daily Opening Stock Balance
  const handleCreateStock = async (e: React.FormEvent, customFields?: Record<string, string | number>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const isEdit = editingStockId !== null;
    const url = isEdit ? `/api/stock/${editingStockId}` : '/api/stock';
    const method = isEdit ? 'PUT' : 'POST';
    try {
      const response = await fetch(url, {
        method,
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
          sim: stockSim,
          customFields
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg(isEdit ? 'Daily stock entry updated successfully.' : `Daily inventory pool for ${stockDate} created.`);
        handleCancelEdit();
        loadTabContent();
      } else {
        setErrorMsg(data.error || 'Failed to persist stock record.');
      }
    } catch (err) {
      setErrorMsg('Network anomaly processing stock logging.');
    }
  };

  // Log Coordinator Stock Allocation
  const handleCreateAllocation = async (e: React.FormEvent, customFields?: Record<string, string | number>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const isEdit = editingAllocId !== null;
    const url = isEdit ? `/api/allocation/${editingAllocId}` : '/api/allocation';
    const method = isEdit ? 'PUT' : 'POST';
    try {
      const response = await fetch(url, {
        method,
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
          sim: allocSim,
          customFields
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg(isEdit ? 'Coordinator allocation details updated.' : 'FSC Allocation distribution successfully registered.');
        handleCancelEdit();
        loadTabContent();
      } else {
        setErrorMsg(data.error || 'Failed to dispatch allocation balance.');
      }
    } catch (err) {
      setErrorMsg('Allocation transmission failure.');
    }
  };

  // Save Daily Sales Sheet
  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const targetFscId = user?.role === 'FSC' ? user.id : saleFscId;
    if (!saleDate || !targetFscId) {
      setErrorMsg('Missing required Agent identification or Report Date parameters.');
      return;
    }

    const matchingAlloc = allocations.find(a => a.date === saleDate && a.fscId === targetFscId);
    const isEdit = editingSaleId !== null;
    const url = isEdit ? `/api/sale/${editingSaleId}` : '/api/sale';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
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
        setSuccessMsg(isEdit ? 'Sales draft worksheet updated successfully.' : 'Sales worksheet successfully recorded as Draft.');
        handleCancelEdit();
        loadTabContent();
      } else {
        setErrorMsg(data.error || 'Failed to register sales worksheet.');
      }
    } catch (err) {
      setErrorMsg('Server transmission fault storing sales draft.');
    }
  };

  // Submit Draft to Approver queue
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
        setSuccessMsg('Sales sheet forwarded to Regional Approver Queue.');
        loadTabContent();
      } else {
        setErrorMsg(data.error || 'Failed to dispatch report draft.');
      }
    } catch (e) {
      setErrorMsg('Network error executing submit pipeline.');
    }
  };

  // Review & Reconciliation approval
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
        setSuccessMsg(`Worksheet report successfully ${action === 'approve' ? 'Approved & Settled' : 'Rejected'}.`);
        setSelectedSaleToReview(null);
        setReviewNoteText('');
        loadTabContent();
      } else {
        setErrorMsg(data.error || 'Workflow execution rejected by server.');
      }
    } catch (e) {
      setErrorMsg('Audit submission communication error.');
    }
  };

  // Delete ledger entry (stock, allocation, sales)
  const handleDeleteEntity = async (type: 'stock' | 'allocation' | 'sale', id: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete this ${type} record?`)) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const endpoint = type === 'stock' ? `/api/stock/${id}` : type === 'allocation' ? `/api/allocation/${id}` : `/api/sale/${id}`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 204 || res.status === 200) {
        setSuccessMsg(`${type.toUpperCase()} log removed from records successfully.`);
        loadTabContent();
      } else {
        const data = await res.json().catch(() => ({ error: 'Error on deletion' }));
        setErrorMsg(data.error || 'Failed to remove entry.');
      }
    } catch (e) {
      setErrorMsg('Deletion request timed out.');
    }
  };

  // Compile Reconciliation Summaries
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
        setErrorMsg(data.error || 'Metrics compilation failed.');
      }
    } catch (e) {
      setErrorMsg('Network error executing ledger compilation.');
    }
  };

  // Export Reconciliation Sheets as CSV format
  const handleExportCSV = () => {
    if (reportSummaries.length === 0) {
      setErrorMsg("Please compile ledger summaries before downloading reconciliation export.");
      return;
    }
    
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
    setSuccessMsg(`CSV report compilation download complete.`);
  };

  // Create Staff Account (Admin Only)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const isEdit = editingUserId !== null;
    const url = isEdit ? `/api/auth/users/${editingUserId}` : '/api/auth/register';
    const method = isEdit ? 'PUT' : 'POST';

    if (!userEmail || !userName || (!isEdit && !userPassword)) {
      setErrorMsg('Please populate all registration fields.');
      return;
    }
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: userEmail,
          name: userName,
          role: userRole,
          password: userPassword || undefined,
          photo: userPhoto
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(isEdit ? `Staff account details for ${userName} modified.` : `User Account for ${userName} registered successfully.`);
        handleCancelEdit();
        loadTabContent();
      } else {
        setErrorMsg(data.error || 'Staff registration rejected by server.');
      }
    } catch (e) {
      setErrorMsg('Failed to process registration credentials.');
    }
  };

  // Delete Staff Account
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 204) {
        setSuccessMsg('Account purged successfully.');
        loadTabContent();
      } else {
        setErrorMsg('Purging credentials rejected by administrative policy.');
      }
    } catch (e) {
      setErrorMsg('Account deletion timed out.');
    }
  };

  // --- QUERY FILTER CALCULATIONS ---

  const fscUsersList = allUsers.filter(u => u.role === 'FSC');

  const filteredSales = sales.filter(s => {
    const fscUser = allUsers.find(u => u.id === s.fscId);
    const fscName = fscUser ? fscUser.name : (s.fscName || 'FSC Agent');
    const matchSearch = fscName.toLowerCase().includes(globalSearch.toLowerCase()) || 
                        s.date.includes(globalSearch);
    const matchStatus = selectedStatusFilter ? s.status === selectedStatusFilter : true;
    return matchSearch && matchStatus;
  });

  const totalStockOnHandAmount = dailyStocks[0]?.openingAmount || 142805;
  const totalActiveAgentsCount = fscUsersList.length || 12;
  const criticalAirtelAlerts = [
    { item: 'SIM cards inventory', threshold: '50 units', hub: 'NCR Hub North', level: 'rose' },
    { item: 'Flexy Airtime Balance', threshold: '₹12,000 threshold', hub: 'East Hub East', level: 'amber' }
  ];

  // Render Login panel if unauthenticated
  if (!token || !user) {
    return (
      <LoginView
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loading={loading}
        errorMsg={errorMsg}
        successMsg={successMsg}
        onSubmit={handleLoginSubmit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row selection:bg-[#EE1D23]/10 selection:text-red-950 font-sans">
      
      {/* SIDEBAR NAVIGATION BLOCK */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isStandaloneMode={isStandaloneMode}
        onLogOut={handleLogOut}
        allowedTabs={allowedTabsForUser}
      />

      {/* RIGHT SIDE AREA CONTAINER */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden">

        {/* SYSTEM DYNAMIC BANNER OVERLAYS */}
        {(errorMsg || successMsg) && (
          <div className="bg-white px-8 pt-4 shrink-0 flex flex-col gap-2">
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] font-semibold text-rose-800 flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-[11px] font-semibold text-emerald-800 flex items-center gap-2 animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* PRIMARY DESKTOP WORKSPACE LAYOUT */}
        <main className="flex-grow p-8 overflow-y-auto">
          
          {/* Loading spinner overlay */}
          {loading && (
            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs tracking-wider mb-6">
              <RefreshCw className="w-4 h-4 animate-spin text-[#EE1D23]" />
              Telemetry synchronization in progress...
            </div>
          )}

        {/* Tab 1: Dashboard overview stats */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            dailyStocks={dailyStocks}
            sales={sales}
            allUsers={allUsers}
            totalStockOnHandAmount={totalStockOnHandAmount}
            totalActiveAgentsCount={totalActiveAgentsCount}
            criticalAirtelAlerts={criticalAirtelAlerts}
            setActiveTab={setActiveTab}
          />
        )}

        {/* Tab 2: Daily Opening Stocks logging */}
        {activeTab === 'dailyStock' && (user.role === 'Admin' || user.role === 'Manager') && (
          <DailyStockTab
            dailyStocks={dailyStocks}
            onDeleteStock={(id) => handleDeleteEntity('stock', id)}
            onSubmitStock={handleCreateStock}
            stockDate={stockDate}
            setStockDate={setStockDate}
            stockOpeningAmount={stockOpeningAmount}
            setStockOpeningAmount={setStockOpeningAmount}
            stockOpeningSim={stockOpeningSim}
            setStockOpeningSim={setStockOpeningSim}
            stockFlexy={stockFlexy}
            setStockFlexy={setStockFlexy}
            stockFlexyClaim1={stockFlexyClaim1}
            setStockFlexyClaim1={setStockFlexyClaim1}
            stockFlexyClaim2={stockFlexyClaim2}
            setStockFlexyClaim2={setStockFlexyClaim2}
            stockSim={stockSim}
            setStockSim={setStockSim}
            onEditStockClick={handleEditStockClick}
            editingStockId={editingStockId}
            onCancelEdit={handleCancelEdit}
            customFieldConfigs={customFieldConfigs}
          />
        )}

        {/* Tab 3: FSC Distributions allocations */}
        {activeTab === 'allocations' && (user.role === 'Admin' || user.role === 'Manager') && (
          <AllocationsTab
            allocations={allocations}
            fscUsersList={fscUsersList}
            dailyStocks={dailyStocks}
            onDeleteAllocation={(id) => handleDeleteEntity('allocation', id)}
            onSubmitAllocation={handleCreateAllocation}
            allocDate={allocDate}
            setAllocDate={setAllocDate}
            allocFscId={allocFscId}
            setAllocFscId={setAllocFscId}
            allocOpeningBalance={allocOpeningBalance}
            setAllocOpeningBalance={setAllocOpeningBalance}
            allocOpeningSim={allocOpeningSim}
            setAllocOpeningSim={setAllocOpeningSim}
            allocAutoRefill1={allocAutoRefill1}
            setAllocAutoRefill1={setAllocAutoRefill1}
            allocAutoRefill2={allocAutoRefill2}
            setAllocAutoRefill2={setAllocAutoRefill2}
            allocAutoRefill3={allocAutoRefill3}
            setAllocAutoRefill3={setAllocAutoRefill3}
            allocEcManual1={allocEcManual1}
            setAllocEcManual1={setAllocEcManual1}
            allocEcManual2={allocEcManual2}
            setAllocEcManual2={setAllocEcManual2}
            allocSim={allocSim}
            setAllocSim={setAllocSim}
            onEditAllocationClick={handleEditAllocClick}
            editingAllocId={editingAllocId}
            onCancelEdit={handleCancelEdit}
            customFieldConfigs={customFieldConfigs}
          />
        )}

        {/* Tab 4: FSC Sales Sheets tracking */}
        {activeTab === 'sales' && (
          <SalesTab
            sales={sales}
            allUsers={allUsers}
            fscUsersList={fscUsersList}
            user={user}
            onDeleteSale={(id) => handleDeleteEntity('sale', id)}
            onSubmitSaleDraft={handleSubmitSaleDraft}
            onSubmitSaleForm={handleCreateSale}
            onReviewSaleSubmit={handleReviewSaleSubmit}
            saleDate={saleDate}
            setSaleDate={setSaleDate}
            saleFscId={saleFscId}
            setSaleFscId={setSaleFscId}
            saleOpeningBalance={saleOpeningBalance}
            setSaleOpeningBalance={setSaleOpeningBalance}
            saleClosingBalance={saleClosingBalance}
            setSaleClosingBalance={setSaleClosingBalance}
            saleAmount={saleAmount}
            setSaleAmount={setSaleAmount}
            salePreviousShort={salePreviousShort}
            setSalePreviousShort={setSalePreviousShort}
            saleOpeningSim={saleOpeningSim}
            setSaleOpeningSim={setSaleOpeningSim}
            saleSim={saleSim}
            setSaleSim={setSaleSim}
            saleClosingSim={saleClosingSim}
            setSaleClosingSim={setSaleClosingSim}
            saleRemarks={saleRemarks}
            setSaleRemarks={setSaleRemarks}
            selectedStatusFilter={selectedStatusFilter}
            setSelectedStatusFilter={setSelectedStatusFilter}
            globalSearch={globalSearch}
            setGlobalSearch={setGlobalSearch}
            filteredSales={filteredSales}
            selectedSaleToReview={selectedSaleToReview}
            setSelectedSaleToReview={setSelectedSaleToReview}
            reviewNoteText={reviewNoteText}
            setReviewNoteText={setReviewNoteText}
            onEditSaleClick={handleEditSaleClick}
            editingSaleId={editingSaleId}
            onCancelEdit={handleCancelEdit}
          />
        )}

        {/* Tab 5: Reports calculations */}
        {activeTab === 'reports' && (user.role === 'Admin' || user.role === 'Manager') && (
          <ReportsTab
            reportFromDate={reportFromDate}
            setReportFromDate={setReportFromDate}
            reportToDate={reportToDate}
            setReportToDate={setReportToDate}
            onCompileLedger={fetchReportSummaries}
            reportSummaries={reportSummaries}
            onExportCSV={handleExportCSV}
            sales={sales}
            allocations={allocations}
            dailyStocks={dailyStocks}
            allUsers={allUsers}
          />
        )}

        {/* Tab 6: Staff Accounts configuration */}
        {activeTab === 'users' && (user.role === 'Admin' || user.role === 'Manager') && (
          <UsersTab
            allUsers={allUsers}
            user={user}
            onDeleteUser={handleDeleteUser}
            onSubmitUser={handleCreateUser}
            userName={userName}
            setUserName={setUserName}
            userEmail={userEmail}
            setUserEmail={setUserEmail}
            userRole={userRole}
            setUserRole={setUserRole}
            userPassword={userPassword}
            setUserPassword={setUserPassword}
            onEditUserClick={handleEditUserClick}
            editingUserId={editingUserId}
            onCancelEdit={handleCancelEdit}
            userPhoto={userPhoto}
            setUserPhoto={setUserPhoto}
            token={token}
            onProfileUpdate={(updatedUser) => {
              setUser(updatedUser);
              loadTabContent();
            }}
          />
        )}

        {/* Tab 7: FSC Custom Fields configuration */}
        {activeTab === 'masters-fsc' && (user.role === 'Admin' || user.role === 'Manager') && (
          <MastersTab
            target="fsc"
            token={token}
          />
        )}

        {/* Tab 8: Daily Stock Custom Fields configuration */}
        {activeTab === 'masters-stock' && (user.role === 'Admin' || user.role === 'Manager') && (
          <MastersTab
            target="stock"
            token={token}
          />
        )}

        {/* Tab 9: User Roles access configurations (Admin Only) */}
        {activeTab === 'user-roles' && user.role === 'Admin' && (
          <UserRolesTab
            token={token}
            onPermissionsUpdated={loadTabContent}
          />
        )}

        {/* Tab 10: Transaction Audit logs (Admin or Manager Only) */}
        {activeTab === 'audit' && (user.role === 'Admin' || user.role === 'Manager') && (
          <AuditLogTab
            token={token}
          />
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

      </div> {/* Close of RIGHT SIDE AREA CONTAINER */}
    </div>
  );
}

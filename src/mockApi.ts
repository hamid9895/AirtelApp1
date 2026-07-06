// Client-side fallback database and API router simulation for standalone static hosting
// This mirrors the entire server.ts schema and business logic, persisting data in localStorage.

interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Approver' | 'FSC';
  passwordHash: string; // "salt:hash" or just plain text for client-side easy match
  createdAt: string;
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

const STORAGE_KEYS = {
  USERS: 'airtel_mock_users',
  STOCKS: 'airtel_mock_stocks',
  ALLOCATIONS: 'airtel_mock_allocations',
  SALES: 'airtel_mock_sales'
};

// Seed default accounts if they don't exist
export function initializeMockDatabase() {
  const yesterdayStr = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const users: User[] = [
      {
        id: 'user-admin-id',
        email: 'admin@airtel.com',
        name: 'Airtel Administrator (Standalone)',
        role: 'Admin',
        passwordHash: 'admin123',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user-manager-id',
        email: 'manager@airtel.com',
        name: 'Distribution Manager (Standalone)',
        role: 'Manager',
        passwordHash: 'manager123',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user-approver-id',
        email: 'approver@airtel.com',
        name: 'Regional Approver (Standalone)',
        role: 'Approver',
        passwordHash: 'approver123',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user-fsc-rajesh',
        email: 'rajesh@airtel.com',
        name: 'Rajesh Kumar (FSC Standalone)',
        role: 'FSC',
        passwordHash: 'fsc123',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user-fsc-sita',
        email: 'sita@airtel.com',
        name: 'Sita Verma (FSC Standalone)',
        role: 'FSC',
        passwordHash: 'fsc123',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  if (!localStorage.getItem(STORAGE_KEYS.STOCKS)) {
    const stocks: DailyStock[] = [
      {
        id: 'stock-yesterday',
        date: yesterdayStr,
        openingAmount: 140000,
        openingSim: 450,
        flexy: 95000,
        flexyClaim1: 18000,
        flexyClaim2: 12000,
        sim: 300,
        createdAt: new Date().toISOString(),
        createdBy: 'user-manager-id'
      },
      {
        id: 'stock-today',
        date: todayStr,
        openingAmount: 152805,
        openingSim: 500,
        flexy: 105000,
        flexyClaim1: 22000,
        flexyClaim2: 15800,
        sim: 350,
        createdAt: new Date().toISOString(),
        createdBy: 'user-manager-id'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.STOCKS, JSON.stringify(stocks));
  }

  if (!localStorage.getItem(STORAGE_KEYS.ALLOCATIONS)) {
    const allocations: Allocation[] = [
      {
        id: 'alloc-rajesh-yesterday',
        date: yesterdayStr,
        fscId: 'user-fsc-rajesh',
        openingBalance: 18000,
        openingSim: 45,
        autoRefill1: 28000,
        autoRefill2: 18000,
        autoRefill3: 12000,
        ecManual1: 4000,
        ecManual2: 4000,
        sim: 35,
        totalAllocated: 88000,
        createdAt: new Date().toISOString(),
        createdBy: 'user-manager-id'
      },
      {
        id: 'alloc-sita-yesterday',
        date: yesterdayStr,
        fscId: 'user-fsc-sita',
        openingBalance: 12000,
        openingSim: 35,
        autoRefill1: 22000,
        autoRefill2: 12000,
        autoRefill3: 8000,
        ecManual1: 3000,
        ecManual2: 1000,
        sim: 25,
        totalAllocated: 58000,
        createdAt: new Date().toISOString(),
        createdBy: 'user-manager-id'
      },
      {
        id: 'alloc-rajesh-today',
        date: todayStr,
        fscId: 'user-fsc-rajesh',
        openingBalance: 20000,
        openingSim: 50,
        autoRefill1: 30000,
        autoRefill2: 20000,
        autoRefill3: 15000,
        ecManual1: 5000,
        ecManual2: 5000,
        sim: 40,
        totalAllocated: 95000,
        createdAt: new Date().toISOString(),
        createdBy: 'user-manager-id'
      },
      {
        id: 'alloc-sita-today',
        date: todayStr,
        fscId: 'user-fsc-sita',
        openingBalance: 15000,
        openingSim: 40,
        autoRefill1: 25000,
        autoRefill2: 15000,
        autoRefill3: 10000,
        ecManual1: 4000,
        ecManual2: 2000,
        sim: 30,
        totalAllocated: 71000,
        createdAt: new Date().toISOString(),
        createdBy: 'user-manager-id'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.ALLOCATIONS, JSON.stringify(allocations));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
    const sales: Sale[] = [
      {
        id: 'sale-rajesh-yesterday',
        date: yesterdayStr,
        fscId: 'user-fsc-rajesh',
        allocationId: 'alloc-rajesh-yesterday',
        openingBalance: 18000,
        autoRefill1: 28000,
        autoRefill2: 18000,
        autoRefill3: 12000,
        ecManual1: 4000,
        ecManual2: 4000,
        closingBalance: 3200,
        previousShort: 0,
        saleTotal: 77200,
        saleAmount: 77200,
        shortAmount: 0,
        openingSim: 45,
        sim: 32,
        closingSim: 13,
        status: 'Approved',
        remarks: 'All cash collected and matched',
        reviewNote: 'Verified with bank deposit confirmation',
        createdAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        createdBy: 'user-fsc-rajesh',
        submittedBy: 'user-fsc-rajesh',
        reviewedBy: 'user-approver-id'
      },
      {
        id: 'sale-sita-yesterday',
        date: yesterdayStr,
        fscId: 'user-fsc-sita',
        allocationId: 'alloc-sita-yesterday',
        openingBalance: 12000,
        autoRefill1: 22000,
        autoRefill2: 12000,
        autoRefill3: 8000,
        ecManual1: 3000,
        ecManual2: 1000,
        closingBalance: 1500,
        previousShort: 500,
        saleTotal: 56500,
        saleAmount: 56000,
        shortAmount: 500,
        openingSim: 35,
        sim: 28,
        closingSim: 7,
        status: 'Pending',
        remarks: 'Short of ₹500. Will settle tomorrow.',
        reviewNote: null,
        createdAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
        createdBy: 'user-fsc-sita',
        submittedBy: 'user-fsc-sita',
        reviewedBy: null
      }
    ];
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }
}

// Helper to access mock lists
function getMockList<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveMockList<T>(key: string, list: T[]) {
  localStorage.setItem(key, JSON.stringify(list));
}

// Generate unique mock ID
function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
}

// Decode mock token (which is simply the user JSON base64 encoded for simplicity)
function getUserFromToken(headers: HeadersInit | undefined): User | null {
  const auth = headers ? (headers as any)['Authorization'] || (headers as any)['authorization'] : null;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const rawToken = auth.split(' ')[1];
    if (rawToken === 'mock-admin-token') return getMockList<User>(STORAGE_KEYS.USERS).find(u => u.role === 'Admin') || null;
    if (rawToken === 'mock-manager-token') return getMockList<User>(STORAGE_KEYS.USERS).find(u => u.role === 'Manager') || null;
    if (rawToken === 'mock-approver-token') return getMockList<User>(STORAGE_KEYS.USERS).find(u => u.role === 'Approver') || null;
    
    // Parse simulated payload
    const decoded = JSON.parse(atob(rawToken));
    return getMockList<User>(STORAGE_KEYS.USERS).find(u => u.id === decoded.id) || null;
  } catch {
    return null;
  }
}

// Simulated fetch response creator
function mockResponse(data: any, status: number = 200): Response {
  const text = JSON.stringify(data);
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: async () => data,
    text: async () => text,
  } as Response;
}

// Router for intercepted API requests
export async function handleMockApiRequest(url: string, options?: RequestInit): Promise<Response> {
  initializeMockDatabase();

  const cleanUrl = url.split('?')[0];
  const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
  const method = options?.method || 'GET';
  const headers = options?.headers;
  const body = options?.body ? JSON.parse(options.body as string) : null;

  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 150));

  // 1. AUTH LOGIN
  if (cleanUrl === '/api/auth/login' && method === 'POST') {
    const { email, password } = body;
    const users = getMockList<User>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || (user.passwordHash && user.passwordHash !== password)) {
      return mockResponse({ success: false, error: 'Invalid email or password credentials' }, 401);
    }

    // Token is base64 encoded payload
    const tokenPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const simulatedToken = btoa(JSON.stringify(tokenPayload));

    return mockResponse({
      success: true,
      token: simulatedToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  }

  // 2. AUTH GET ME
  if (cleanUrl === '/api/auth/me' && method === 'GET') {
    const user = getUserFromToken(headers);
    if (!user) return mockResponse({ success: false, error: 'Invalid or expired credentials' }, 401);
    return mockResponse({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  }

  // 3. GET ALL USERS / REGISTER USER (Admin / Manager)
  if (cleanUrl === '/api/auth/users' && method === 'GET') {
    const user = getUserFromToken(headers);
    if (!user || !['Admin', 'Manager', 'Approver'].includes(user.role)) {
      return mockResponse({ success: false, error: 'Privileged access required' }, 403);
    }
    const users = getMockList<User>(STORAGE_KEYS.USERS).map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role
    }));
    return mockResponse({ success: true, users });
  }

  if (cleanUrl === '/api/auth/register' && method === 'POST') {
    const user = getUserFromToken(headers);
    if (!user || user.role !== 'Admin') {
      return mockResponse({ success: false, error: 'Administrator role required to create users' }, 403);
    }

    const { email, name, role, password } = body;
    const users = getMockList<User>(STORAGE_KEYS.USERS);
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return mockResponse({ success: false, error: 'Email address is already in use' }, 400);
    }

    const newUser: User = {
      id: generateId('user'),
      email,
      name,
      role,
      passwordHash: password,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveMockList(STORAGE_KEYS.USERS, users);

    return mockResponse({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    }, 211);
  }

  // PUT USER (Admin Only)
  if (cleanUrl.startsWith('/api/auth/users/') && method === 'PUT') {
    const user = getUserFromToken(headers);
    if (!user || user.role !== 'Admin') {
      return mockResponse({ success: false, error: 'Admin access required' }, 403);
    }

    const userId = cleanUrl.substring('/api/auth/users/'.length);
    const users = getMockList<User>(STORAGE_KEYS.USERS);
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return mockResponse({ success: false, error: 'User not found' }, 404);

    const { name, role, password, email } = body;
    const targetUser = users[idx];

    if (email && email.toLowerCase() !== targetUser.email.toLowerCase()) {
      const emailDup = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (emailDup) {
        return mockResponse({ success: false, error: 'Email address is already in use by another user' }, 400);
      }
      targetUser.email = email;
    }

    if (name) targetUser.name = name;
    if (role) targetUser.role = role;
    if (password) targetUser.passwordHash = password; // raw temporary match for mock

    users[idx] = targetUser;
    saveMockList(STORAGE_KEYS.USERS, users);

    return mockResponse({
      success: true,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role
      }
    });
  }

  // DELETE USER (Admin Only)
  if (cleanUrl.startsWith('/api/auth/users/') && method === 'DELETE') {
    const user = getUserFromToken(headers);
    if (!user || user.role !== 'Admin') {
      return mockResponse({ success: false, error: 'Admin access required' }, 403);
    }

    const idToDelete = cleanUrl.substring('/api/auth/users/'.length);
    let users = getMockList<User>(STORAGE_KEYS.USERS);
    users = users.filter(u => u.id !== idToDelete);
    saveMockList(STORAGE_KEYS.USERS, users);

    return mockResponse(null, 204);
  }

  // 4. DAILY STOCKS (Manager/Admin CRUD)
  if (cleanUrl === '/api/stock') {
    const user = getUserFromToken(headers);
    if (!user) return mockResponse({ success: false, error: 'Authentication required' }, 401);

    if (method === 'GET') {
      const stocks = getMockList<DailyStock>(STORAGE_KEYS.STOCKS);
      return mockResponse({ success: true, dailyStocks: stocks });
    }

    if (method === 'POST') {
      if (!['Admin', 'Manager'].includes(user.role)) {
        return mockResponse({ success: false, error: 'Insufficient permissions' }, 403);
      }

      const stocks = getMockList<DailyStock>(STORAGE_KEYS.STOCKS);
      const newStock: DailyStock = {
        id: generateId('stock'),
        date: body.date,
        openingAmount: Number(body.openingAmount),
        openingSim: Number(body.openingSim),
        flexy: Number(body.flexy),
        flexyClaim1: Number(body.flexyClaim1),
        flexyClaim2: Number(body.flexyClaim2),
        sim: Number(body.sim),
        createdAt: new Date().toISOString(),
        createdBy: user.id
      };

      // Ensure no duplicate dates
      const existingIdx = stocks.findIndex(s => s.date === body.date);
      if (existingIdx !== -1) {
        stocks[existingIdx] = newStock;
      } else {
        stocks.unshift(newStock);
      }

      saveMockList(STORAGE_KEYS.STOCKS, stocks);
      return mockResponse({ success: true, dailyStock: newStock });
    }
  }

  if (cleanUrl.startsWith('/api/stock/') && method === 'DELETE') {
    const user = getUserFromToken(headers);
    if (!user || !['Admin', 'Manager'].includes(user.role)) {
      return mockResponse({ success: false, error: 'Privileged access required' }, 403);
    }

    const stockId = cleanUrl.substring('/api/stock/'.length);
    let stocks = getMockList<DailyStock>(STORAGE_KEYS.STOCKS);
    stocks = stocks.filter(s => s.id !== stockId);
    saveMockList(STORAGE_KEYS.STOCKS, stocks);

    return mockResponse(null, 204);
  }

  // PUT /api/stock/:id (Manager / Admin Only)
  if (cleanUrl.startsWith('/api/stock/') && method === 'PUT') {
    const user = getUserFromToken(headers);
    if (!user || !['Admin', 'Manager'].includes(user.role)) {
      return mockResponse({ success: false, error: 'Privileged access required' }, 403);
    }

    const stockId = cleanUrl.substring('/api/stock/'.length);
    const stocks = getMockList<DailyStock>(STORAGE_KEYS.STOCKS);
    const idx = stocks.findIndex(s => s.id === stockId);
    if (idx === -1) return mockResponse({ success: false, error: 'Stock entry not found' }, 404);

    const current = stocks[idx];
    const { openingAmount, openingSim, flexy, flexyClaim1, flexyClaim2, sim } = body;

    if (openingAmount !== undefined) current.openingAmount = Number(openingAmount);
    if (openingSim !== undefined) current.openingSim = Number(openingSim);
    if (flexy !== undefined) current.flexy = Number(flexy);
    if (flexyClaim1 !== undefined) current.flexyClaim1 = Number(flexyClaim1);
    if (flexyClaim2 !== undefined) current.flexyClaim2 = Number(flexyClaim2);
    if (sim !== undefined) current.sim = Number(sim);

    stocks[idx] = current;
    saveMockList(STORAGE_KEYS.STOCKS, stocks);

    return mockResponse({ success: true, dailyStock: current });
  }

  // 5. ALLOCATIONS (Manager/Admin CRUD)
  if (cleanUrl === '/api/allocation') {
    const user = getUserFromToken(headers);
    if (!user) return mockResponse({ success: false, error: 'Authentication required' }, 401);

    if (method === 'GET') {
      const allocations = getMockList<Allocation>(STORAGE_KEYS.ALLOCATIONS);
      return mockResponse({ success: true, allocations });
    }

    if (method === 'POST') {
      if (!['Admin', 'Manager'].includes(user.role)) {
        return mockResponse({ success: false, error: 'Insufficient permissions' }, 403);
      }

      const allocations = getMockList<Allocation>(STORAGE_KEYS.ALLOCATIONS);
      const totalAllocated = Number(body.openingBalance) + 
                             Number(body.autoRefill1) + Number(body.autoRefill2) + Number(body.autoRefill3) + 
                             Number(body.ecManual1) + Number(body.ecManual2);

      const newAlloc: Allocation = {
        id: generateId('alloc'),
        date: body.date,
        fscId: body.fscId,
        openingBalance: Number(body.openingBalance),
        openingSim: Number(body.openingSim),
        autoRefill1: Number(body.autoRefill1),
        autoRefill2: Number(body.autoRefill2),
        autoRefill3: Number(body.autoRefill3),
        ecManual1: Number(body.ecManual1),
        ecManual2: Number(body.ecManual2),
        sim: Number(body.sim),
        totalAllocated,
        createdAt: new Date().toISOString(),
        createdBy: user.id
      };

      allocations.unshift(newAlloc);
      saveMockList(STORAGE_KEYS.ALLOCATIONS, allocations);

      return mockResponse({ success: true, allocation: newAlloc });
    }
  }

  if (cleanUrl.startsWith('/api/allocation/') && method === 'DELETE') {
    const user = getUserFromToken(headers);
    if (!user || !['Admin', 'Manager'].includes(user.role)) {
      return mockResponse({ success: false, error: 'Privileged access required' }, 403);
    }

    const allocId = cleanUrl.substring('/api/allocation/'.length);
    let allocations = getMockList<Allocation>(STORAGE_KEYS.ALLOCATIONS);
    allocations = allocations.filter(a => a.id !== allocId);
    saveMockList(STORAGE_KEYS.ALLOCATIONS, allocations);

    return mockResponse(null, 204);
  }

  // PUT /api/allocation/:id (Manager / Admin Only)
  if (cleanUrl.startsWith('/api/allocation/') && method === 'PUT') {
    const user = getUserFromToken(headers);
    if (!user || !['Admin', 'Manager'].includes(user.role)) {
      return mockResponse({ success: false, error: 'Privileged access required' }, 403);
    }

    const allocId = cleanUrl.substring('/api/allocation/'.length);
    const allocations = getMockList<Allocation>(STORAGE_KEYS.ALLOCATIONS);
    const idx = allocations.findIndex(a => a.id === allocId);
    if (idx === -1) return mockResponse({ success: false, error: 'Allocation not found' }, 404);

    const current = allocations[idx];
    const { 
      openingBalance, openingSim, 
      autoRefill1, autoRefill2, autoRefill3, 
      ecManual1, ecManual2, sim 
    } = body;

    if (openingBalance !== undefined) current.openingBalance = Number(openingBalance);
    if (openingSim !== undefined) current.openingSim = Number(openingSim);
    if (autoRefill1 !== undefined) current.autoRefill1 = Number(autoRefill1);
    if (autoRefill2 !== undefined) current.autoRefill2 = Number(autoRefill2);
    if (autoRefill3 !== undefined) current.autoRefill3 = Number(autoRefill3);
    if (ecManual1 !== undefined) current.ecManual1 = Number(ecManual1);
    if (ecManual2 !== undefined) current.ecManual2 = Number(ecManual2);
    if (sim !== undefined) current.sim = Number(sim);

    current.totalAllocated = current.openingBalance + current.autoRefill1 + current.autoRefill2 + current.autoRefill3 + current.ecManual1 + current.ecManual2;

    allocations[idx] = current;
    saveMockList(STORAGE_KEYS.ALLOCATIONS, allocations);

    const fscUser = getMockList<User>(STORAGE_KEYS.USERS).find(u => u.id === current.fscId);
    return mockResponse({ 
      success: true, 
      allocation: {
        ...current,
        fscName: fscUser ? fscUser.name : 'Unknown FSC'
      } 
    });
  }

  // 6. SALES WORKFLOW
  if (cleanUrl === '/api/sale') {
    const user = getUserFromToken(headers);
    if (!user) return mockResponse({ success: false, error: 'Authentication required' }, 401);

    if (method === 'GET') {
      let sales = getMockList<Sale>(STORAGE_KEYS.SALES);
      // FSC only sees their own
      if (user.role === 'FSC') {
        sales = sales.filter(s => s.fscId === user.id);
      }
      return mockResponse({ success: true, sales });
    }

    if (method === 'POST') {
      const sales = getMockList<Sale>(STORAGE_KEYS.SALES);
      
      const opening = Number(body.openingBalance);
      const refill1 = Number(body.autoRefill1);
      const refill2 = Number(body.autoRefill2);
      const refill3 = Number(body.autoRefill3);
      const manual1 = Number(body.ecManual1);
      const manual2 = Number(body.ecManual2);
      const closing = Number(body.closingBalance);
      const prevShort = Number(body.previousShort);
      const receivedCash = Number(body.saleAmount);

      const computedRefills = refill1 + refill2 + refill3 + manual1 + manual2;
      const saleTotalValue = (opening + computedRefills) - closing;
      const calculatedShort = saleTotalValue - receivedCash + prevShort;

      const newSale: Sale = {
        id: generateId('sale'),
        date: body.date,
        fscId: body.fscId,
        allocationId: body.allocationId || null,
        openingBalance: opening,
        autoRefill1: refill1,
        autoRefill2: refill2,
        autoRefill3: refill3,
        ecManual1: manual1,
        ecManual2: manual2,
        closingBalance: closing,
        previousShort: prevShort,
        saleTotal: saleTotalValue,
        saleAmount: receivedCash,
        shortAmount: calculatedShort,
        openingSim: Number(body.openingSim),
        sim: Number(body.sim),
        closingSim: Number(body.closingSim),
        status: 'Draft',
        remarks: body.remarks || null,
        reviewNote: null,
        createdAt: new Date().toISOString(),
        submittedAt: null,
        reviewedAt: null,
        createdBy: user.id,
        submittedBy: null,
        reviewedBy: null
      };

      sales.unshift(newSale);
      saveMockList(STORAGE_KEYS.SALES, sales);

      return mockResponse({ success: true, sale: newSale });
    }
  }

  // SUBMIT DRAFT
  if (cleanUrl.endsWith('/submit') && cleanUrl.startsWith('/api/sale/') && method === 'POST') {
    const user = getUserFromToken(headers);
    if (!user) return mockResponse({ success: false, error: 'Authentication required' }, 401);

    const parts = cleanUrl.split('/');
    const saleId = parts[3]; // /api/sale/:id/submit

    const sales = getMockList<Sale>(STORAGE_KEYS.SALES);
    const idx = sales.findIndex(s => s.id === saleId);
    if (idx === -1) return mockResponse({ success: false, error: 'Sale record not found' }, 404);

    if (user.role === 'FSC' && sales[idx].fscId !== user.id) {
      return mockResponse({ success: false, error: 'Access denied' }, 403);
    }

    if (sales[idx].status !== 'Draft') {
      return mockResponse({ success: false, error: 'Only Draft items can be submitted' }, 400);
    }

    sales[idx].status = 'Pending';
    sales[idx].submittedAt = new Date().toISOString();
    sales[idx].submittedBy = user.id;

    saveMockList(STORAGE_KEYS.SALES, sales);
    return mockResponse({ success: true, sale: sales[idx] });
  }

  // REVIEW & APPROVE/REJECT
  if (cleanUrl.endsWith('/review') && cleanUrl.startsWith('/api/sale/') && method === 'POST') {
    const user = getUserFromToken(headers);
    if (!user || !['Admin', 'Manager', 'Approver'].includes(user.role)) {
      return mockResponse({ success: false, error: 'Privileged reviewer access required' }, 403);
    }

    const parts = cleanUrl.split('/');
    const saleId = parts[3]; // /api/sale/:id/review

    const sales = getMockList<Sale>(STORAGE_KEYS.SALES);
    const idx = sales.findIndex(s => s.id === saleId);
    if (idx === -1) return mockResponse({ success: false, error: 'Sale record not found' }, 404);

    if (sales[idx].status !== 'Pending') {
      return mockResponse({ success: false, error: 'Only Pending logs can be reviewed' }, 400);
    }

    const { action, reviewNote } = body;
    sales[idx].status = action === 'approve' ? 'Approved' : 'Rejected';
    sales[idx].reviewNote = reviewNote || null;
    sales[idx].reviewedAt = new Date().toISOString();
    sales[idx].reviewedBy = user.id;

    saveMockList(STORAGE_KEYS.SALES, sales);
    return mockResponse({ success: true, sale: sales[idx] });
  }

  // DELETE SALE
  if (cleanUrl.startsWith('/api/sale/') && method === 'DELETE') {
    const user = getUserFromToken(headers);
    if (!user) return mockResponse({ success: false, error: 'Authentication required' }, 401);

    const saleId = cleanUrl.substring('/api/sale/'.length);
    let sales = getMockList<Sale>(STORAGE_KEYS.SALES);
    const saleItem = sales.find(s => s.id === saleId);

    if (!saleItem) return mockResponse({ success: false, error: 'Sale record not found' }, 404);

    if (user.role === 'FSC' && saleItem.fscId !== user.id) {
      return mockResponse({ success: false, error: 'Access denied' }, 403);
    }

    if (saleItem.status === 'Approved') {
      return mockResponse({ success: false, error: 'Approved reports cannot be deleted' }, 400);
    }

    sales = sales.filter(s => s.id !== saleId);
    saveMockList(STORAGE_KEYS.SALES, sales);

    return mockResponse(null, 204);
  }

  // PUT /api/sale/:id (Only editable in Draft status)
  if (cleanUrl.startsWith('/api/sale/') && method === 'PUT') {
    const user = getUserFromToken(headers);
    if (!user) return mockResponse({ success: false, error: 'Authentication required' }, 401);

    const saleId = cleanUrl.substring('/api/sale/'.length);
    const sales = getMockList<Sale>(STORAGE_KEYS.SALES);
    const idx = sales.findIndex(s => s.id === saleId);
    if (idx === -1) return mockResponse({ success: false, error: 'Sale record not found' }, 404);

    const current = sales[idx];
    if (user.role === 'FSC' && current.fscId !== user.id) {
      return mockResponse({ success: false, error: 'Access denied' }, 403);
    }

    if (current.status !== 'Draft') {
      return mockResponse({ success: false, error: 'Only sales in Draft status can be modified' }, 400);
    }

    const { 
      openingBalance, autoRefill1, autoRefill2, autoRefill3, 
      ecManual1, ecManual2, closingBalance, 
      previousShort, saleAmount, openingSim, sim, closingSim, remarks 
    } = body;

    if (openingBalance !== undefined) current.openingBalance = Number(openingBalance);
    if (autoRefill1 !== undefined) current.autoRefill1 = Number(autoRefill1);
    if (autoRefill2 !== undefined) current.autoRefill2 = Number(autoRefill2);
    if (autoRefill3 !== undefined) current.autoRefill3 = Number(autoRefill3);
    if (ecManual1 !== undefined) current.ecManual1 = Number(ecManual1);
    if (ecManual2 !== undefined) current.ecManual2 = Number(ecManual2);
    if (closingBalance !== undefined) current.closingBalance = Number(closingBalance);
    if (previousShort !== undefined) current.previousShort = Number(previousShort);
    if (saleAmount !== undefined) current.saleAmount = Number(saleAmount);
    if (openingSim !== undefined) current.openingSim = Number(openingSim);
    if (sim !== undefined) current.sim = Number(sim);
    if (closingSim !== undefined) current.closingSim = Number(closingSim);
    if (remarks !== undefined) current.remarks = remarks;

    // Recalculate
    current.saleTotal = current.openingBalance + current.autoRefill1 + current.autoRefill2 + current.autoRefill3 + current.ecManual1 + current.ecManual2 - current.closingBalance;
    current.shortAmount = Math.max(0, current.saleTotal - current.saleAmount) + current.previousShort;

    sales[idx] = current;
    saveMockList(STORAGE_KEYS.SALES, sales);

    return mockResponse({ success: true, sale: current });
  }

  // 7. REPORTS GENERATOR (Manager / Admin)
  if (cleanUrl === '/api/report/summary' && method === 'GET') {
    const user = getUserFromToken(headers);
    if (!user || !['Admin', 'Manager', 'Approver'].includes(user.role)) {
      return mockResponse({ success: false, error: 'Privileged viewer access required' }, 403);
    }

    const fromStr = queryParams.get('from') || '';
    const toStr = queryParams.get('to') || '';

    const sales = getMockList<Sale>(STORAGE_KEYS.SALES).filter(s => s.date >= fromStr && s.date <= toStr);
    const allocations = getMockList<Allocation>(STORAGE_KEYS.ALLOCATIONS).filter(a => a.date >= fromStr && a.date <= toStr);

    const uniqueDates = Array.from(new Set([
      ...sales.map(s => s.date),
      ...allocations.map(a => a.date)
    ])).sort((a, b) => b.localeCompare(a));

    const summaries = uniqueDates.map(date => {
      const daySales = sales.filter(s => s.date === date);
      const dayAllocs = allocations.filter(a => a.date === date);

      return {
        date,
        totalFsc: new Set(daySales.map(s => s.fscId)).size,
        totalAllocated: dayAllocs.reduce((sum, a) => sum + a.totalAllocated, 0),
        totalSaleAmount: daySales.reduce((sum, s) => sum + s.saleAmount, 0),
        totalShort: daySales.reduce((sum, s) => sum + s.shortAmount, 0),
        approvedCount: daySales.filter(s => s.status === 'Approved').length,
        pendingCount: daySales.filter(s => s.status === 'Pending').length,
        rejectedCount: daySales.filter(s => s.status === 'Rejected').length
      };
    });

    return mockResponse({ success: true, summaries });
  }

  // 404 FALLBACK
  return mockResponse({ success: false, error: `Mock API: Endpoint not found: ${cleanUrl}` }, 404);
}

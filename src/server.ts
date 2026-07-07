import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { initializeDatabase, loadDataFromDb, syncDataToDb } from './db';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'airtel-distribution-super-secret-key-2026';
const DATABASE_FILE = path.resolve('database.json');

// --- DATABASE TYPES ---
interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Approver' | 'FSC';
  passwordHash: string;
  createdAt: string;
  photo?: string | null;
}

interface CustomFieldConfig {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date';
  target: 'fsc' | 'stock';
}

interface DailyStock {
  id: string;
  date: string; // yyyy-MM-dd
  openingAmount: number;
  openingSim: number;
  flexy: number;
  flexyClaim1: number;
  flexyClaim2: number;
  sim: number;
  createdAt: string;
  createdBy: string | null;
  customFields?: Record<string, string | number>;
}

interface Allocation {
  id: string;
  date: string; // yyyy-MM-dd
  fscId: string;
  openingBalance: number;
  openingSim: number;
  autoRefill1: number;
  autoRefill2: number;
  autoRefill3: number;
  ecManual1: number;
  ecManual2: number;
  sim: number;
  totalAllocated: number; // computed
  createdAt: string;
  createdBy: string | null;
  customFields?: Record<string, string | number>;
}

interface Sale {
  id: string;
  date: string; // yyyy-MM-dd
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
  saleTotal: number; // computed
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

interface RolePermission {
  role: 'Admin' | 'Manager' | 'Approver' | 'FSC';
  allowedTabs: string[];
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  action: string;
  targetType: 'dailyStock' | 'allocation' | 'sale' | 'customField' | 'rolePermission' | 'user' | 'auth';
  details: string;
}

interface DatabaseSchema {
  users: User[];
  dailyStocks: DailyStock[];
  allocations: Allocation[];
  sales: Sale[];
  customFieldConfigs: CustomFieldConfig[];
  rolePermissions?: RolePermission[];
  auditLogs?: AuditLogEntry[];
}

// --- PASSWORD HASHING ---
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function comparePassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':');
    const computedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === computedHash;
  } catch {
    return false;
  }
}

// --- JWT HELPER FUNCTIONS ---
function signToken(payload: { id: string; email: string; name: string; role: string }): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const sHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const sPayload = Buffer.from(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600
  })).toString('base64url');
  
  const signature = crypto.createHmac('sha256', JWT_SECRET)
    .update(`${sHeader}.${sPayload}`)
    .digest('base64url');
    
  return `${sHeader}.${sPayload}.${signature}`;
}

function verifyToken(token: string): any | null {
  try {
    const [sHeader, sPayload, signature] = token.split('.');
    if (!sHeader || !sPayload || !signature) return null;
    
    const computedSignature = crypto.createHmac('sha256', JWT_SECRET)
      .update(`${sHeader}.${sPayload}`)
      .digest('base64url');
      
    if (signature !== computedSignature) return null;
    
    const payload = JSON.parse(Buffer.from(sPayload, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// --- DATABASE FILE MANAGEMENT (LOAD / SAVE / SEED) ---
let memoryDb: DatabaseSchema | null = null;

function loadDatabase(): DatabaseSchema {
  if (memoryDb) return memoryDb;
  if (!fs.existsSync(DATABASE_FILE)) {
    // Generate initial seeds if database file doesn't exist
    const initialDb: DatabaseSchema = {
      users: [],
      dailyStocks: [],
      allocations: [],
      sales: [],
      customFieldConfigs: [],
      rolePermissions: [
        {
          role: 'Admin',
          allowedTabs: ['dashboard', 'dailyStock', 'allocations', 'sales', 'reports', 'users', 'user-roles', 'masters-fsc', 'masters-stock', 'audit']
        },
        {
          role: 'Manager',
          allowedTabs: ['dashboard', 'dailyStock', 'allocations', 'sales', 'reports', 'users', 'user-roles', 'masters-fsc', 'masters-stock', 'audit']
        },
        {
          role: 'Approver',
          allowedTabs: ['dashboard', 'sales', 'reports']
        },
        {
          role: 'FSC',
          allowedTabs: ['dashboard', 'sales']
        }
      ],
      auditLogs: []
    };
    
    // Create Default Seed Users
    const users: User[] = [
      {
        id: 'user-admin-id',
        email: 'admin@airtel.com',
        name: 'Airtel Administrator',
        role: 'Admin',
        passwordHash: hashPassword('admin123'),
        createdAt: new Date().toISOString()
      },
      {
        id: 'user-manager-id',
        email: 'manager@airtel.com',
        name: 'Distribution Manager',
        role: 'Manager',
        passwordHash: hashPassword('manager123'),
        createdAt: new Date().toISOString()
      },
      {
        id: 'user-approver-id',
        email: 'approver@airtel.com',
        name: 'Regional Approver',
        role: 'Approver',
        passwordHash: hashPassword('approver123'),
        createdAt: new Date().toISOString()
      },
      {
        id: 'user-fsc-rajesh',
        email: 'rajesh@airtel.com',
        name: 'Rajesh Kumar (FSC NCR)',
        role: 'FSC',
        passwordHash: hashPassword('fsc123'),
        createdAt: new Date().toISOString()
      },
      {
        id: 'user-fsc-sita',
        email: 'sita@airtel.com',
        name: 'Sita Verma (FSC East)',
        role: 'FSC',
        passwordHash: hashPassword('fsc123'),
        createdAt: new Date().toISOString()
      }
    ];
    
    initialDb.users = users;
    
    initialDb.dailyStocks = [];
    initialDb.allocations = [];
    initialDb.sales = [];
    
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(initialDb, null, 2));
    memoryDb = initialDb;
    return initialDb;
  }
  
  const raw = fs.readFileSync(DATABASE_FILE, 'utf-8');
  const parsed = JSON.parse(raw);
  if (!parsed.customFieldConfigs) {
    parsed.customFieldConfigs = [];
  }
  if (!parsed.rolePermissions) {
    parsed.rolePermissions = [
      {
        role: 'Admin',
        allowedTabs: ['dashboard', 'dailyStock', 'allocations', 'sales', 'reports', 'users', 'user-roles', 'masters-fsc', 'masters-stock', 'audit']
      },
      {
        role: 'Manager',
        allowedTabs: ['dashboard', 'dailyStock', 'allocations', 'sales', 'reports', 'users', 'user-roles', 'masters-fsc', 'masters-stock', 'audit']
      },
      {
        role: 'Approver',
        allowedTabs: ['dashboard', 'sales', 'reports']
      },
      {
        role: 'FSC',
        allowedTabs: ['dashboard', 'sales']
      }
    ];
  }
  if (!parsed.auditLogs) {
    parsed.auditLogs = [];
  }
  memoryDb = parsed;
  return parsed;
}

function saveDatabase(db: DatabaseSchema) {
  memoryDb = db;
  fs.writeFileSync(DATABASE_FILE, JSON.stringify(db, null, 2));
  // Sync to PostgreSQL/SQLite in background
  syncDataToDb(db)
    .then(() => console.log('[Database] Successfully synced memory state to Relational Database.'))
    .catch(err => console.error('[Database] Failed to sync memory state to Relational Database:', err));
}

function logAudit(db: DatabaseSchema, user: any, action: string, targetType: 'dailyStock' | 'allocation' | 'sale' | 'customField' | 'rolePermission' | 'user' | 'auth', details: string) {
  if (!db.auditLogs) {
    db.auditLogs = [];
  }
  const newLog: AuditLogEntry = {
    id: `audit-${crypto.randomBytes(8).toString('hex')}`,
    timestamp: new Date().toISOString(),
    userId: user ? user.id : 'system',
    userEmail: user ? user.email : 'system@airtel.com',
    userName: user ? user.name : 'System Process',
    userRole: user ? user.role : 'System',
    action,
    targetType,
    details
  };
  db.auditLogs.push(newLog);
}

// --- MIDDLEWARES ---
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authorization header is missing or empty' });
  }
  
  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
  
  req.user = user;
  next();
}

function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Unauthorized: insufficient privileges' });
    }
    next();
  };
}

// --- API ROUTES ---

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', server: 'Express' });
});

// 1. AUTHENTICATION & USERS

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }
  
  const db = loadDatabase();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user || !comparePassword(password, user.passwordHash)) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }
  
  const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
  
  logAudit(db, { id: user.id, email: user.email, name: user.name, role: user.role }, 'LOGIN', 'auth', `User logged in successfully (Role: ${user.role})`);
  saveDatabase(db);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      photo: user.photo || null
    }
  });
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  const db = loadDatabase();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      photo: user.photo || null
    }
  });
});

// POST /api/auth/register (Admin Only)
app.post('/api/auth/register', authenticateToken, requireRole(['Admin']), (req, res) => {
  const { email, name, role, password, photo } = req.body;
  
  if (!email || !name || !role || !password) {
    return res.status(400).json({ success: false, error: 'All fields (email, name, role, password) are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
  }
  
  const allowedRoles = ['Admin', 'Manager', 'Approver', 'FSC'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ success: false, error: `Invalid role. Must be one of: ${allowedRoles.join(', ')}` });
  }
  
  const db = loadDatabase();
  const duplicate = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (duplicate) {
    return res.status(400).json({ success: false, error: 'Email address is already in use' });
  }
  
  const newUser: User = {
    id: `user-${crypto.randomBytes(8).toString('hex')}`,
    email,
    name,
    role: role as any,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    photo: photo || null
  };
  
  db.users.push(newUser);
  saveDatabase(db);
  
  res.status(201).json({
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      photo: newUser.photo
    }
  });
});

// GET /api/auth/users (Manager or Admin Only)
app.get('/api/auth/users', authenticateToken, requireRole(['Manager', 'Admin']), (req, res) => {
  const db = loadDatabase();
  const usersDto = db.users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
    photo: u.photo || null
  }));
  res.json({ success: true, users: usersDto });
});

// GET /api/auth/users/:id
app.get('/api/auth/users/:id', authenticateToken, (req, res) => {
  const db = loadDatabase();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      photo: user.photo || null
    }
  });
});

// PUT /api/auth/profile (Users can update their own details/photo)
app.put('/api/auth/profile', authenticateToken, (req: any, res) => {
  const db = loadDatabase();
  const userIdx = db.users.findIndex(u => u.id === req.user.id);
  if (userIdx === -1) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  const { name, password, photo } = req.body;
  const user = db.users[userIdx];
  
  if (name) user.name = name;
  if (photo !== undefined) user.photo = photo;
  
  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }
    user.passwordHash = hashPassword(password);
  }
  
  db.users[userIdx] = user;
  saveDatabase(db);
  
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      photo: user.photo || null
    }
  });
});

// PUT /api/auth/users/:id (Admin Only)
app.put('/api/auth/users/:id', authenticateToken, requireRole(['Admin']), (req, res) => {
  const db = loadDatabase();
  const userIdx = db.users.findIndex(u => u.id === req.params.id);
  if (userIdx === -1) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  const { name, role, password, email, photo } = req.body;
  const user = db.users[userIdx];
  
  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    const emailDup = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (emailDup) {
      return res.status(400).json({ success: false, error: 'Email address is already in use by another user' });
    }
    user.email = email;
  }
  
  if (name) user.name = name;
  if (photo !== undefined) user.photo = photo;
  
  if (role) {
    const allowedRoles = ['Admin', 'Manager', 'Approver', 'FSC'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid user role' });
    }
    user.role = role as any;
  }
  
  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }
    user.passwordHash = hashPassword(password);
  }
  
  db.users[userIdx] = user;
  saveDatabase(db);
  
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      photo: user.photo || null
    }
  });
});

// DELETE /api/auth/users/:id (Admin Only)
app.delete('/api/auth/users/:id', authenticateToken, requireRole(['Admin']), (req, res) => {
  const db = loadDatabase();
  const userExists = db.users.some(u => u.id === req.params.id);
  if (!userExists) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  db.users = db.users.filter(u => u.id !== req.params.id);
  
  // Set referencing fields to null
  db.dailyStocks = db.dailyStocks.map(s => s.createdBy === req.params.id ? { ...s, createdBy: null } : s);
  db.allocations = db.allocations.map(a => a.createdBy === req.params.id ? { ...a, createdBy: null } : a);
  db.sales = db.sales.map(s => {
    let updated = { ...s };
    if (s.createdBy === req.params.id) updated.createdBy = null;
    if (s.submittedBy === req.params.id) updated.submittedBy = null;
    if (s.reviewedBy === req.params.id) updated.reviewedBy = null;
    return updated;
  });
  
  saveDatabase(db);
  res.status(204).end();
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', authenticateToken, (req: any, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Current password and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
  }
  
  const db = loadDatabase();
  const userIdx = db.users.findIndex(u => u.id === req.user.id);
  if (userIdx === -1) {
    return res.status(444).json({ success: false, error: 'User context invalid' });
  }
  
  const user = db.users[userIdx];
  if (!comparePassword(currentPassword, user.passwordHash)) {
    return res.status(400).json({ success: false, error: 'Incorrect current password' });
  }
  
  user.passwordHash = hashPassword(newPassword);
  db.users[userIdx] = user;
  saveDatabase(db);
  
  res.json({ success: true, message: 'Password updated successfully' });
});

// Helper to compute a daily stock's closing cash and SIM count on the fly
function computeStockClosing(stock: any, db: any) {
  const allocationsOnDate = db.allocations.filter((a: any) => a.date === stock.date);
  const totalAllocatedCash = allocationsOnDate.reduce((sum: number, a: any) => {
    return sum + (Number(a.autoRefill1) || 0) + (Number(a.autoRefill2) || 0) + (Number(a.autoRefill3) || 0) + (Number(a.ecManual1) || 0) + (Number(a.ecManual2) || 0);
  }, 0);
  const totalAllocatedSim = allocationsOnDate.reduce((sum: number, a: any) => sum + (Number(a.sim) || 0), 0);

  const approvedSalesOnDate = db.sales.filter((s: any) => s.date === stock.date && s.status === 'Approved');
  const totalApprovedRemittance = approvedSalesOnDate.reduce((sum: number, s: any) => sum + (Number(s.saleAmount) || 0), 0);

  const closingAmount = stock.openingAmount + stock.flexy + (stock.flexyClaim1 || 0) + (stock.flexyClaim2 || 0) - totalAllocatedCash + totalApprovedRemittance;
  const closingSim = stock.openingSim + stock.sim - totalAllocatedSim;

  return {
    closingAmount,
    closingSim
  };
}

// 2. DAILY STOCK ENDPOINTS (Manager or Admin Only)

// GET /api/stock
app.get('/api/stock', authenticateToken, requireRole(['Manager', 'Admin']), (req, res) => {
  const db = loadDatabase();
  const computedStocks = db.dailyStocks.map(s => {
    const { closingAmount, closingSim } = computeStockClosing(s, db);
    return {
      ...s,
      closingAmount,
      closingSim
    };
  });
  const sortedStocks = computedStocks.sort((a, b) => b.date.localeCompare(a.date));
  res.json({ success: true, dailyStocks: sortedStocks });
});

// GET /api/stock/:id
app.get('/api/stock/:id', authenticateToken, requireRole(['Manager', 'Admin']), (req, res) => {
  const db = loadDatabase();
  const stock = db.dailyStocks.find(s => s.id === req.params.id);
  if (!stock) {
    return res.status(404).json({ success: false, error: 'Stock entry not found' });
  }
  const { closingAmount, closingSim } = computeStockClosing(stock, db);
  res.json({ 
    success: true, 
    dailyStock: {
      ...stock,
      closingAmount,
      closingSim
    } 
  });
});

// GET /api/stock/date/:date
app.get('/api/stock/date/:date', authenticateToken, requireRole(['Manager', 'Admin']), (req, res) => {
  const db = loadDatabase();
  const stock = db.dailyStocks.find(s => s.date === req.params.date);
  if (!stock) {
    return res.status(404).json({ success: false, error: 'Stock entry not found for this date' });
  }
  const { closingAmount, closingSim } = computeStockClosing(stock, db);
  res.json({ 
    success: true, 
    dailyStock: {
      ...stock,
      closingAmount,
      closingSim
    } 
  });
});

// POST /api/stock
app.post('/api/stock', authenticateToken, requireRole(['Manager', 'Admin']), (req: any, res) => {
  const { date, openingAmount, openingSim, flexy, flexyClaim1, flexyClaim2, sim, customFields } = req.body;
  if (!date) {
    return res.status(400).json({ success: false, error: 'Date is required' });
  }
  
  const db = loadDatabase();
  const dup = db.dailyStocks.find(s => s.date === date);
  if (dup) {
    return res.status(400).json({ success: false, error: 'A daily stock entry already exists for this date' });
  }
  
  const newStock: DailyStock = {
    id: `stock-${crypto.randomBytes(8).toString('hex')}`,
    date,
    openingAmount: Number(openingAmount || 0),
    openingSim: Number(openingSim || 0),
    flexy: Number(flexy || 0),
    flexyClaim1: Number(flexyClaim1 || 0),
    flexyClaim2: Number(flexyClaim2 || 0),
    sim: Number(sim || 0),
    createdAt: new Date().toISOString(),
    createdBy: req.user.id,
    customFields: customFields || {}
  };
  
  db.dailyStocks.push(newStock);
  logAudit(db, req.user, 'CREATE', 'dailyStock', `Created daily stock for ${date} (Opening: ₹${openingAmount}, Opening SIMs: ${openingSim})`);
  saveDatabase(db);
  
  const { closingAmount, closingSim } = computeStockClosing(newStock, db);
  res.status(201).json({ success: true, dailyStock: { ...newStock, closingAmount, closingSim } });
});

// PUT /api/stock/:id
app.put('/api/stock/:id', authenticateToken, requireRole(['Manager', 'Admin']), (req: any, res) => {
  const db = loadDatabase();
  const idx = db.dailyStocks.findIndex(s => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Stock entry not found' });
  }
  
  const current = db.dailyStocks[idx];
  const { openingAmount, openingSim, flexy, flexyClaim1, flexyClaim2, sim, customFields } = req.body;
  
  if (openingAmount !== undefined) current.openingAmount = Number(openingAmount);
  if (openingSim !== undefined) current.openingSim = Number(openingSim);
  if (flexy !== undefined) current.flexy = Number(flexy);
  if (flexyClaim1 !== undefined) current.flexyClaim1 = Number(flexyClaim1);
  if (flexyClaim2 !== undefined) current.flexyClaim2 = Number(flexyClaim2);
  if (sim !== undefined) current.sim = Number(sim);
  if (customFields !== undefined) current.customFields = customFields;
  
  db.dailyStocks[idx] = current;
  logAudit(db, req.user, 'UPDATE', 'dailyStock', `Updated daily stock for ${current.date}`);
  saveDatabase(db);
  
  const { closingAmount, closingSim } = computeStockClosing(current, db);
  res.json({ success: true, dailyStock: { ...current, closingAmount, closingSim } });
});

// DELETE /api/stock/:id
app.delete('/api/stock/:id', authenticateToken, requireRole(['Manager', 'Admin']), (req: any, res) => {
  const db = loadDatabase();
  const stock = db.dailyStocks.find(s => s.id === req.params.id);
  if (!stock) {
    return res.status(404).json({ success: false, error: 'Stock entry not found' });
  }
  
  logAudit(db, req.user, 'DELETE', 'dailyStock', `Deleted daily stock entry for ${stock.date}`);
  db.dailyStocks = db.dailyStocks.filter(s => s.id !== req.params.id);
  saveDatabase(db);
  res.status(204).end();
});

// 3. ALLOCATIONS ENDPOINTS (Manager or Admin Only)

// GET /api/allocation
app.get('/api/allocation', authenticateToken, requireRole(['Manager', 'Admin']), (req, res) => {
  const { date, fscId } = req.query;
  const db = loadDatabase();
  
  let list = db.allocations;
  if (date) {
    list = list.filter(a => a.date === date);
  }
  if (fscId) {
    list = list.filter(a => a.fscId === fscId);
  }
  
  // Attach FSC user details
  const results = list.map(a => {
    const fscUser = db.users.find(u => u.id === a.fscId);
    return {
      ...a,
      fscName: fscUser ? fscUser.name : 'Unknown FSC'
    };
  });
  
  res.json({ success: true, allocations: results });
});

// GET /api/allocation/:id
app.get('/api/allocation/:id', authenticateToken, requireRole(['Manager', 'Admin']), (req, res) => {
  const db = loadDatabase();
  const allocation = db.allocations.find(a => a.id === req.params.id);
  if (!allocation) {
    return res.status(404).json({ success: false, error: 'Allocation not found' });
  }
  const fscUser = db.users.find(u => u.id === allocation.fscId);
  res.json({ 
    success: true, 
    allocation: {
      ...allocation,
      fscName: fscUser ? fscUser.name : 'Unknown FSC'
    } 
  });
});

// POST /api/allocation
app.post('/api/allocation', authenticateToken, requireRole(['Manager', 'Admin']), (req: any, res) => {
  const { 
    date, fscId, openingBalance, openingSim, 
    autoRefill1, autoRefill2, autoRefill3, 
    ecManual1, ecManual2, sim, customFields 
  } = req.body;
  
  if (!date || !fscId) {
    return res.status(400).json({ success: false, error: 'Date and FSC are required fields' });
  }
  
  const db = loadDatabase();
  const fscUser = db.users.find(u => u.id === fscId);
  if (!fscUser || fscUser.role !== 'FSC') {
    return res.status(400).json({ success: false, error: 'Valid FSC user ID is required' });
  }
  
  const dup = db.allocations.find(a => a.date === date && a.fscId === fscId);
  if (dup) {
    return res.status(400).json({ success: false, error: 'An allocation already exists for this FSC on this date' });
  }
  
  const auto1 = Number(autoRefill1 || 0);
  const auto2 = Number(autoRefill2 || 0);
  const auto3 = Number(autoRefill3 || 0);
  const ec1 = Number(ecManual1 || 0);
  const ec2 = Number(ecManual2 || 0);
  const openBal = Number(openingBalance || 0);
  const totalAlloc = openBal + auto1 + auto2 + auto3 + ec1 + ec2;
  
  const newAlloc: Allocation = {
    id: `alloc-${crypto.randomBytes(8).toString('hex')}`,
    date,
    fscId,
    openingBalance: openBal,
    openingSim: Number(openingSim || 0),
    autoRefill1: auto1,
    autoRefill2: auto2,
    autoRefill3: auto3,
    ecManual1: ec1,
    ecManual2: ec2,
    sim: Number(sim || 0),
    totalAllocated: totalAlloc,
    createdAt: new Date().toISOString(),
    createdBy: req.user.id,
    customFields: customFields || {}
  };
  
  db.allocations.push(newAlloc);
  logAudit(db, req.user, 'CREATE', 'allocation', `Created FSC allocation for ${date} (FSC: ${fscUser.name}, Amount: ₹${totalAlloc})`);
  saveDatabase(db);
  
  res.status(201).json({ 
    success: true, 
    allocation: {
      ...newAlloc,
      fscName: fscUser.name
    } 
  });
});

// PUT /api/allocation/:id
app.put('/api/allocation/:id', authenticateToken, requireRole(['Manager', 'Admin']), (req: any, res) => {
  const db = loadDatabase();
  const idx = db.allocations.findIndex(a => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Allocation not found' });
  }
  
  const current = db.allocations[idx];
  const { 
    openingBalance, openingSim, 
    autoRefill1, autoRefill2, autoRefill3, 
    ecManual1, ecManual2, sim, customFields 
  } = req.body;
  
  if (openingBalance !== undefined) current.openingBalance = Number(openingBalance);
  if (openingSim !== undefined) current.openingSim = Number(openingSim);
  if (autoRefill1 !== undefined) current.autoRefill1 = Number(autoRefill1);
  if (autoRefill2 !== undefined) current.autoRefill2 = Number(autoRefill2);
  if (autoRefill3 !== undefined) current.autoRefill3 = Number(autoRefill3);
  if (ecManual1 !== undefined) current.ecManual1 = Number(ecManual1);
  if (ecManual2 !== undefined) current.ecManual2 = Number(ecManual2);
  if (sim !== undefined) current.sim = Number(sim);
  if (customFields !== undefined) current.customFields = customFields;
  
  current.totalAllocated = current.openingBalance + current.autoRefill1 + current.autoRefill2 + current.autoRefill3 + current.ecManual1 + current.ecManual2;
  
  db.allocations[idx] = current;
  const fscUser = db.users.find(u => u.id === current.fscId);
  logAudit(db, req.user, 'UPDATE', 'allocation', `Updated FSC allocation for ${current.date} (FSC: ${fscUser ? fscUser.name : 'Unknown FSC'}, Amount: ₹${current.totalAllocated})`);
  saveDatabase(db);
  res.json({ 
    success: true, 
    allocation: {
      ...current,
      fscName: fscUser ? fscUser.name : 'Unknown FSC'
    } 
  });
});

// DELETE /api/allocation/:id
app.delete('/api/allocation/:id', authenticateToken, requireRole(['Manager', 'Admin']), (req: any, res) => {
  const db = loadDatabase();
  const allocation = db.allocations.find(a => a.id === req.params.id);
  if (!allocation) {
    return res.status(404).json({ success: false, error: 'Allocation not found' });
  }
  
  const fscUser = db.users.find(u => u.id === allocation.fscId);
  logAudit(db, req.user, 'DELETE', 'allocation', `Deleted FSC allocation for ${allocation.date} (FSC: ${fscUser ? fscUser.name : 'Unknown FSC'})`);
  db.allocations = db.allocations.filter(a => a.id !== req.params.id);
  
  // Set referencing allocations on sales to null
  db.sales = db.sales.map(s => s.allocationId === req.params.id ? { ...s, allocationId: null } : s);
  
  saveDatabase(db);
  res.status(204).end();
});


// 3.5 CUSTOM FIELD CONFIG ENDPOINTS (Manager or Admin Only)

// GET /api/custom-fields
app.get('/api/custom-fields', authenticateToken, (req, res) => {
  const db = loadDatabase();
  res.json({ success: true, customFieldConfigs: db.customFieldConfigs || [] });
});

// POST /api/custom-fields
app.post('/api/custom-fields', authenticateToken, requireRole(['Admin', 'Manager']), (req: any, res) => {
  const { name, type, target } = req.body;
  if (!name || !type || !target) {
    return res.status(400).json({ success: false, error: 'Fields name, type, and target are required' });
  }
  
  const db = loadDatabase();
  if (!db.customFieldConfigs) {
    db.customFieldConfigs = [];
  }
  
  const newConfig: CustomFieldConfig = {
    id: `cf-${crypto.randomBytes(8).toString('hex')}`,
    name,
    type: type as any,
    target: target as any
  };
  
  db.customFieldConfigs.push(newConfig);
  logAudit(db, req.user, 'CREATE', 'customField', `Created custom field config: "${name}" for "${target}" (Type: ${type})`);
  saveDatabase(db);
  
  res.status(201).json({ success: true, customFieldConfig: newConfig });
});

// DELETE /api/custom-fields/:id
app.delete('/api/custom-fields/:id', authenticateToken, requireRole(['Admin', 'Manager']), (req: any, res) => {
  const db = loadDatabase();
  if (!db.customFieldConfigs) {
    db.customFieldConfigs = [];
  }
  
  const idx = db.customFieldConfigs.findIndex(c => c.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Custom field configuration not found' });
  }
  
  const configToDelete = db.customFieldConfigs[idx];
  db.customFieldConfigs.splice(idx, 1);
  
  logAudit(db, req.user, 'DELETE', 'customField', `Deleted custom field config: "${configToDelete.name}" associated with "${configToDelete.target}"`);
  
  // Clean up references in daily stocks or allocations
  if (configToDelete.target === 'stock') {
    db.dailyStocks = db.dailyStocks.map(s => {
      if (s.customFields && s.customFields[configToDelete.id] !== undefined) {
        const { [configToDelete.id]: _, ...rest } = s.customFields;
        return { ...s, customFields: rest };
      }
      return s;
    });
  } else if (configToDelete.target === 'fsc') {
    db.allocations = db.allocations.map(a => {
      if (a.customFields && a.customFields[configToDelete.id] !== undefined) {
        const { [configToDelete.id]: _, ...rest } = a.customFields;
        return { ...a, customFields: rest };
      }
      return a;
    });
  }
  
  saveDatabase(db);
  res.json({ success: true });
});


// 4. SALES ENDPOINTS

// GET /api/sale (All Auth Roles)
app.get('/api/sale', authenticateToken, (req: any, res) => {
  const { date, fscId, status } = req.query;
  const db = loadDatabase();
  
  let list = db.sales;
  
  // Enforce FSC constraint: FSCs can only view their own sales
  if (req.user.role === 'FSC') {
    list = list.filter(s => s.fscId === req.user.id);
  } else if (fscId) {
    list = list.filter(s => s.fscId === fscId);
  }
  
  if (date) {
    list = list.filter(s => s.date === date);
  }
  if (status) {
    list = list.filter(s => s.status === status);
  }
  
  const results = list.map(s => {
    const fscUser = db.users.find(u => u.id === s.fscId);
    return {
      ...s,
      fscName: fscUser ? fscUser.name : 'Unknown FSC'
    };
  });
  
  res.json({ success: true, sales: results });
});

// GET /api/sale/:id
app.get('/api/sale/:id', authenticateToken, (req: any, res) => {
  const db = loadDatabase();
  const sale = db.sales.find(s => s.id === req.params.id);
  if (!sale) {
    return res.status(404).json({ success: false, error: 'Sale entry not found' });
  }
  
  // Ensure FSC can only read their own sales
  if (req.user.role === 'FSC' && sale.fscId !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Access denied: cannot view another FSC\'s sales' });
  }
  
  const fscUser = db.users.find(u => u.id === sale.fscId);
  res.json({ 
    success: true, 
    sale: {
      ...sale,
      fscName: fscUser ? fscUser.name : 'Unknown FSC'
    } 
  });
});

// POST /api/sale
app.post('/api/sale', authenticateToken, (req: any, res) => {
  const { 
    date, fscId, allocationId, openingBalance, 
    autoRefill1, autoRefill2, autoRefill3, 
    ecManual1, ecManual2, closingBalance, 
    previousShort, saleAmount, openingSim, sim, closingSim, remarks 
  } = req.body;
  
  if (!date) {
    return res.status(400).json({ success: false, error: 'Date is required' });
  }
  
  // Resolve target FSC (FSCs can only create sales for themselves, managers/admins can select)
  let targetFscId = req.user.id;
  if (req.user.role !== 'FSC') {
    if (!fscId) {
      return res.status(400).json({ success: false, error: 'FSC ID is required when created by managers/admins' });
    }
    targetFscId = fscId;
  }
  
  const db = loadDatabase();
  const fscUser = db.users.find(u => u.id === targetFscId);
  if (!fscUser) {
    return res.status(400).json({ success: false, error: 'FSC user not found' });
  }
  
  // Enforce unique sales per FSC per date
  const dup = db.sales.find(s => s.date === date && s.fscId === targetFscId);
  if (dup) {
    return res.status(400).json({ success: false, error: `A sale entry already exists for FSC on ${date}` });
  }
  
  // Math calculations
  const openBal = Number(openingBalance || 0);
  const auto1 = Number(autoRefill1 || 0);
  const auto2 = Number(autoRefill2 || 0);
  const auto3 = Number(autoRefill3 || 0);
  const ec1 = Number(ecManual1 || 0);
  const ec2 = Number(ecManual2 || 0);
  const closeBal = Number(closingBalance || 0);
  const prevShort = Number(previousShort || 0);
  
  // Formulas
  // Net sales should represent the total allocated airtime value minus closing balance
  const saleTotal = openBal + auto1 + auto2 + auto3 + ec1 + ec2 - closeBal;
  const netRemitted = Number(saleAmount || 0);
  // Shortage is the difference between sale total and net remitted, plus previous short
  const shortAmount = Math.max(0, saleTotal - netRemitted) + prevShort;
  
  const newSale: Sale = {
    id: `sale-${crypto.randomBytes(8).toString('hex')}`,
    date,
    fscId: targetFscId,
    allocationId: allocationId || null,
    openingBalance: openBal,
    autoRefill1: auto1,
    autoRefill2: auto2,
    autoRefill3: auto3,
    ecManual1: ec1,
    ecManual2: ec2,
    closingBalance: closeBal,
    previousShort: prevShort,
    saleTotal,
    saleAmount: netRemitted,
    shortAmount,
    openingSim: Number(openingSim || 0),
    sim: Number(sim || 0),
    closingSim: Number(closingSim || 0),
    status: 'Draft',
    remarks: remarks || null,
    reviewNote: null,
    createdAt: new Date().toISOString(),
    submittedAt: null,
    reviewedAt: null,
    createdBy: req.user.id,
    submittedBy: null,
    reviewedBy: null
  };
  
  db.sales.push(newSale);
  logAudit(db, req.user, 'CREATE', 'sale', `Created sales sheet for date ${date} (FSC: ${fscUser.name}, Value: ₹${saleTotal})`);
  saveDatabase(db);
  
  res.status(201).json({ success: true, sale: newSale });
});

// PUT /api/sale/:id (Only editable in Draft status)
app.put('/api/sale/:id', authenticateToken, (req: any, res) => {
  const db = loadDatabase();
  const idx = db.sales.findIndex(s => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Sale entry not found' });
  }
  
  const current = db.sales[idx];
  
  // Enforce ownership
  if (req.user.role === 'FSC' && current.fscId !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  
  // Enforce BR-03: Sale may only be edited while Draft
  if (current.status !== 'Draft') {
    return res.status(400).json({ success: false, error: 'Only sales in Draft status can be modified' });
  }
  
  const { 
    openingBalance, autoRefill1, autoRefill2, autoRefill3, 
    ecManual1, ecManual2, closingBalance, 
    previousShort, saleAmount, openingSim, sim, closingSim, remarks 
  } = req.body;
  
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
  
  // Recompute math formulas
  current.saleTotal = current.openingBalance + current.autoRefill1 + current.autoRefill2 + current.autoRefill3 + current.ecManual1 + current.ecManual2 - current.closingBalance;
  current.shortAmount = Math.max(0, current.saleTotal - current.saleAmount) + current.previousShort;
  
  db.sales[idx] = current;
  const fscUser = db.users.find(u => u.id === current.fscId);
  logAudit(db, req.user, 'UPDATE', 'sale', `Updated sales sheet for date ${current.date} (FSC: ${fscUser ? fscUser.name : 'Unknown FSC'}, Value: ₹${current.saleTotal})`);
  saveDatabase(db);
  
  res.json({ success: true, sale: current });
});

// POST /api/sale/:id/submit
app.post('/api/sale/:id/submit', authenticateToken, (req: any, res) => {
  const db = loadDatabase();
  const idx = db.sales.findIndex(s => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Sale entry not found' });
  }
  
  const current = db.sales[idx];
  
  // Ownership check
  if (req.user.role === 'FSC' && current.fscId !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  
  // Enforce BR-04: Submit only if Draft
  if (current.status !== 'Draft') {
    return res.status(400).json({ success: false, error: 'Only Draft sale entries can be submitted' });
  }
  
  current.status = 'Pending';
  current.submittedAt = new Date().toISOString();
  current.submittedBy = req.user.id;
  
  db.sales[idx] = current;
  const fscUser = db.users.find(u => u.id === current.fscId);
  logAudit(db, req.user, 'SUBMIT', 'sale', `Submitted sales sheet for date ${current.date} (FSC: ${fscUser ? fscUser.name : 'Unknown FSC'}, Value: ₹${current.saleTotal})`);
  saveDatabase(db);
  
  res.json({ success: true, sale: current });
});

// POST /api/sale/:id/review (Manager / Approver / Admin Only)
app.post('/api/sale/:id/review', authenticateToken, requireRole(['Manager', 'Approver', 'Admin']), (req: any, res) => {
  const { action, reviewNote } = req.body;
  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, error: 'Invalid action. Must be exactly "approve" or "reject"' });
  }
  
  const db = loadDatabase();
  const idx = db.sales.findIndex(s => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Sale entry not found' });
  }
  
  const current = db.sales[idx];
  
  // Enforce BR-05: Review only if Pending
  if (current.status !== 'Pending') {
    return res.status(400).json({ success: false, error: 'Only Pending sale entries can be approved or rejected' });
  }
  
  current.status = action === 'approve' ? 'Approved' : 'Rejected';
  current.reviewNote = reviewNote || null;
  current.reviewedAt = new Date().toISOString();
  current.reviewedBy = req.user.id;
  
  db.sales[idx] = current;
  const fscUserForReview = db.users.find(u => u.id === current.fscId);
  logAudit(db, req.user, action === 'approve' ? 'APPROVE' : 'REJECT', 'sale', `${action === 'approve' ? 'Approved' : 'Rejected'} sales sheet for date ${current.date} (FSC: ${fscUserForReview ? fscUserForReview.name : 'Unknown FSC'}, Value: ₹${current.saleTotal})`);
  saveDatabase(db);
  
  res.json({ success: true, sale: current });
});

// DELETE /api/sale/:id
app.delete('/api/sale/:id', authenticateToken, (req: any, res) => {
  const db = loadDatabase();
  const idx = db.sales.findIndex(s => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Sale entry not found' });
  }
  
  const current = db.sales[idx];
  
  // Ownership check
  if (req.user.role === 'FSC' && current.fscId !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  
  // Enforce BR-06: Approved sales cannot be deleted (unless user is Admin)
  if (current.status === 'Approved' && req.user.role !== 'Admin') {
    return res.status(400).json({ success: false, error: 'Approved sale entries cannot be deleted' });
  }
  
  const fscUserForDelete = db.users.find(u => u.id === current.fscId);
  logAudit(db, req.user, 'DELETE', 'sale', `Deleted sales sheet entry for date ${current.date} (FSC: ${fscUserForDelete ? fscUserForDelete.name : 'Unknown FSC'}, Status: ${current.status})`);
  db.sales = db.sales.filter(s => s.id !== req.params.id);
  saveDatabase(db);
  
  res.status(204).end();
});


// 5. REPORTS ENDPOINTS (Manager or Admin Only)

// GET /api/report/summary
app.get('/api/report/summary', authenticateToken, requireRole(['Manager', 'Admin']), (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ success: false, error: 'Both "from" and "to" date parameters (yyyy-MM-dd) are required' });
  }
  
  const fromStr = String(from);
  const toStr = String(to);
  
  if (fromStr > toStr) {
    return res.status(400).json({ success: false, error: '"from" date must be earlier or equal to "to" date' });
  }
  
  const db = loadDatabase();
  
  // Get all dates in range
  const salesInRange = db.sales.filter(s => s.date >= fromStr && s.date <= toStr);
  const allocationsInRange = db.allocations.filter(a => a.date >= fromStr && a.date <= toStr);
  
  // Group by unique dates
  const uniqueDates = Array.from(new Set([
    ...salesInRange.map(s => s.date),
    ...allocationsInRange.map(a => a.date)
  ])).sort((a, b) => b.localeCompare(a));
  
  const dailySummaries = uniqueDates.map(date => {
    const daySales = salesInRange.filter(s => s.date === date);
    const dayAllocations = allocationsInRange.filter(a => a.date === date);
    
    const totalFsc = new Set(daySales.map(s => s.fscId)).size;
    const totalAllocated = dayAllocations.reduce((sum, a) => sum + a.totalAllocated, 0);
    const totalSaleAmount = daySales.reduce((sum, s) => sum + s.saleAmount, 0);
    const totalShort = daySales.reduce((sum, s) => sum + s.shortAmount, 0);
    
    const approvedCount = daySales.filter(s => s.status === 'Approved').length;
    const pendingCount = daySales.filter(s => s.status === 'Pending').length;
    const rejectedCount = daySales.filter(s => s.status === 'Rejected').length;
    
    return {
      date,
      totalFsc,
      totalAllocated,
      totalSaleAmount,
      totalShort,
      approvedCount,
      pendingCount,
      rejectedCount
    };
  });
  
  res.json({ success: true, summaries: dailySummaries });
});

// GET /api/report/approved
app.get('/api/report/approved', authenticateToken, requireRole(['Manager', 'Admin']), (req, res) => {
  const { from, to } = req.query;
  const db = loadDatabase();
  
  let approvedSales = db.sales.filter(s => s.status === 'Approved');
  
  if (from && to) {
    const fromStr = String(from);
    const toStr = String(to);
    if (fromStr > toStr) {
      return res.status(400).json({ success: false, error: '"from" date must be earlier or equal to "to" date' });
    }
    approvedSales = approvedSales.filter(s => s.date >= fromStr && s.date <= toStr);
  }
  
  const results = approvedSales.map(s => {
    const fscUser = db.users.find(u => u.id === s.fscId);
    return {
      ...s,
      fscName: fscUser ? fscUser.name : 'Unknown FSC'
    };
  });
  
  res.json({ success: true, sales: results });
});


// 8. ROLE PERMISSIONS ENDPOINTS

// GET /api/role-permissions
app.get('/api/role-permissions', authenticateToken, (req, res) => {
  const db = loadDatabase();
  if (!db.rolePermissions || db.rolePermissions.length === 0) {
    db.rolePermissions = [
      {
        role: 'Admin',
        allowedTabs: ['dashboard', 'dailyStock', 'allocations', 'sales', 'reports', 'users', 'user-roles', 'masters-fsc', 'masters-stock', 'audit']
      },
      {
        role: 'Manager',
        allowedTabs: ['dashboard', 'dailyStock', 'allocations', 'sales', 'reports', 'users', 'user-roles', 'masters-fsc', 'masters-stock', 'audit']
      },
      {
        role: 'Approver',
        allowedTabs: ['dashboard', 'sales', 'reports']
      },
      {
        role: 'FSC',
        allowedTabs: ['dashboard', 'sales']
      }
    ];
    saveDatabase(db);
  }
  res.json({ success: true, permissions: db.rolePermissions });
});

// PUT /api/role-permissions (Admin Only)
app.post('/api/role-permissions', authenticateToken, requireRole(['Admin']), (req: any, res) => {
  const { permissions } = req.body;
  if (!permissions || !Array.isArray(permissions)) {
    return res.status(400).json({ success: false, error: 'Permissions must be an array' });
  }
  const db = loadDatabase();
  db.rolePermissions = permissions;
  logAudit(db, req.user, 'UPDATE', 'rolePermission', `Updated role access permissions matrix.`);
  saveDatabase(db);
  res.json({ success: true, permissions });
});

// Support both PUT and POST for convenience
app.put('/api/role-permissions', authenticateToken, requireRole(['Admin']), (req: any, res) => {
  const { permissions } = req.body;
  if (!permissions || !Array.isArray(permissions)) {
    return res.status(400).json({ success: false, error: 'Permissions must be an array' });
  }
  const db = loadDatabase();
  db.rolePermissions = permissions;
  logAudit(db, req.user, 'UPDATE', 'rolePermission', `Updated role access permissions matrix.`);
  saveDatabase(db);
  res.json({ success: true, permissions });
});


// 9. AUDIT LOGS ENDPOINTS

// GET /api/audit-logs (Admin and Manager only)
app.get('/api/audit-logs', authenticateToken, requireRole(['Admin', 'Manager']), (req, res) => {
  const db = loadDatabase();
  const logs = db.auditLogs || [];
  const sortedLogs = [...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  res.json({ success: true, auditLogs: sortedLogs });
});


// Initialize the SQL database and run migrations
async function initDbAndSeeds() {
  try {
    await initializeDatabase();
    const dbData = await loadDataFromDb();
    if (dbData) {
      console.log('[Database] Loaded data successfully from Relational Database.');
      memoryDb = dbData;
      // Keep database.json updated
      fs.writeFileSync(DATABASE_FILE, JSON.stringify(dbData, null, 2));
    } else {
      console.log('[Database] Relational Database is empty. Loading default seeds and syncing...');
      const seeded = loadDatabase();
      await syncDataToDb(seeded);
      console.log('[Database] Successfully synced default seed data to Relational Database.');
    }
  } catch (err) {
    console.error('[Database] Failed to initialize database, falling back to local file:', err);
    // Fallback load
    loadDatabase();
  }
}

// --- INTEGRATION WITH VITE DEV / PROD SERVERS ---
async function startServer() {
  // Wait for database connections & migrations before starting Express server
  await initDbAndSeeds();

  const isProd = process.env.NODE_ENV === 'production';
  const port = 3000;

  if (!isProd) {
    console.log('Starting server in DEVELOPMENT mode with Vite Middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    app.use(vite.middlewares);
    
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    console.log('Starting server in PRODUCTION mode...');
    app.use(express.static(path.resolve('dist')));
    
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();

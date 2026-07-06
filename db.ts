import fs from 'fs';
import path from 'path';
import pg from 'pg';

// Database Schema Interfaces (compatible with server.ts)
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Approver' | 'FSC';
  passwordHash: string;
  createdAt: string;
  photo?: string | null;
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
  customFields?: Record<string, string | number>;
}

export interface Allocation {
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
  customFields?: Record<string, string | number>;
}

export interface Sale {
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

export interface DatabaseSchema {
  users: User[];
  dailyStocks: DailyStock[];
  allocations: Allocation[];
  sales: Sale[];
  customFieldConfigs: CustomFieldConfig[];
}

let pgPool: pg.Pool | null = null;
let sqliteDb: any = null;
const usePostgres = !!process.env.DATABASE_URL;

export function getDatabaseType(): 'PostgreSQL' | 'SQLite' {
  return usePostgres ? 'PostgreSQL' : 'SQLite';
}

// Promisified helper for running query on SQLite
function sqliteRun(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    sqliteDb!.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Promisified helper for getting all rows from SQLite
function sqliteAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    sqliteDb!.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

// Promisified helper for running raw script in SQLite
function sqliteExec(sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    sqliteDb!.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Initializes the database, executes the initial migration file, and logs connection status.
 */
export async function initializeDatabase(): Promise<void> {
  const migrationPath = path.resolve('migrations/001_init.sql');
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found at ${migrationPath}`);
  }
  const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

  if (usePostgres) {
    console.log('[Database] Connecting to PostgreSQL database...');
    pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Run migrations
    const client = await pgPool.connect();
    try {
      console.log('[Database] Executing PostgreSQL migrations (001_init.sql)...');
      await client.query(migrationSql);
      console.log('[Database] PostgreSQL migration successfully executed.');
    } catch (err) {
      console.error('[Database] Failed to execute PostgreSQL migrations:', err);
      throw err;
    } finally {
      client.release();
    }
  } else {
    console.log('[Database] Connecting to SQLite local database (database.sqlite)...');
    const sqlite3Module = await import('sqlite3');
    const sqlite3 = sqlite3Module.default || sqlite3Module;
    sqliteDb = new sqlite3.Database('database.sqlite');

    try {
      console.log('[Database] Executing SQLite migrations (001_init.sql)...');
      await sqliteExec(migrationSql);
      console.log('[Database] SQLite migration successfully executed.');
    } catch (err) {
      console.error('[Database] Failed to execute SQLite migrations:', err);
      throw err;
    }
  }
}

/**
 * Loads entire database from Postgres or SQLite, and maps snake_case DB column names to camelCase model fields.
 */
export async function loadDataFromDb(): Promise<DatabaseSchema | null> {
  try {
    if (usePostgres) {
      if (!pgPool) return null;
      
      const uRes = await pgPool.query('SELECT * FROM users');
      const dRes = await pgPool.query('SELECT * FROM daily_stocks');
      const aRes = await pgPool.query('SELECT * FROM allocations');
      const sRes = await pgPool.query('SELECT * FROM sales');
      const cRes = await pgPool.query('SELECT * FROM custom_field_configs').catch(() => ({ rows: [], rowCount: 0 }));

      if (uRes.rowCount === 0) {
        return null; // Signals database is empty, caller should seed it
      }

      const users: User[] = uRes.rows.map(row => ({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role as any,
        passwordHash: row.password_hash,
        createdAt: row.created_at,
        photo: row.photo || null,
      }));

      const dailyStocks: DailyStock[] = dRes.rows.map(row => ({
        id: row.id,
        date: row.date,
        openingAmount: Number(row.opening_amount),
        openingSim: Number(row.opening_sim),
        flexy: Number(row.flexy),
        flexyClaim1: Number(row.flexy_claim1),
        flexyClaim2: Number(row.flexy_claim2),
        sim: Number(row.sim),
        createdAt: row.created_at,
        createdBy: row.created_by,
        customFields: row.custom_fields ? JSON.parse(row.custom_fields) : {},
      }));

      const allocations: Allocation[] = aRes.rows.map(row => ({
        id: row.id,
        date: row.date,
        fscId: row.fsc_id,
        openingBalance: Number(row.opening_balance),
        openingSim: Number(row.opening_sim),
        autoRefill1: Number(row.auto_refill1),
        autoRefill2: Number(row.auto_refill2),
        autoRefill3: Number(row.auto_refill3),
        ecManual1: Number(row.ec_manual1),
        ecManual2: Number(row.ec_manual2),
        sim: Number(row.sim),
        totalAllocated: Number(row.total_allocated),
        createdAt: row.created_at,
        createdBy: row.created_by,
        customFields: row.custom_fields ? JSON.parse(row.custom_fields) : {},
      }));

      const sales: Sale[] = sRes.rows.map(row => ({
        id: row.id,
        date: row.date,
        fscId: row.fsc_id,
        allocationId: row.allocation_id,
        openingBalance: Number(row.opening_balance),
        autoRefill1: Number(row.auto_refill1),
        autoRefill2: Number(row.auto_refill2),
        autoRefill3: Number(row.auto_refill3),
        ecManual1: Number(row.ec_manual1),
        ecManual2: Number(row.ec_manual2),
        closingBalance: Number(row.closing_balance),
        previousShort: Number(row.previous_short),
        saleTotal: Number(row.sale_total),
        saleAmount: Number(row.sale_amount),
        shortAmount: Number(row.short_amount),
        openingSim: Number(row.opening_sim),
        sim: Number(row.sim),
        closingSim: Number(row.closing_sim),
        status: row.status as any,
        remarks: row.remarks,
        reviewNote: row.review_note,
        createdAt: row.created_at,
        submittedAt: row.submitted_at,
        reviewedAt: row.reviewed_at,
        createdBy: row.created_by,
        submittedBy: row.submitted_by,
        reviewedBy: row.reviewed_by,
      }));

      const customFieldConfigs: CustomFieldConfig[] = cRes.rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type as any,
        target: row.target as any,
      }));

      return { users, dailyStocks, allocations, sales, customFieldConfigs };
    } else {
      if (!sqliteDb) return null;

      const uRows = await sqliteAll('SELECT * FROM users');
      const dRows = await sqliteAll('SELECT * FROM daily_stocks');
      const aRows = await sqliteAll('SELECT * FROM allocations');
      const sRows = await sqliteAll('SELECT * FROM sales');
      const cRows = await sqliteAll('SELECT * FROM custom_field_configs').catch(() => []);

      if (uRows.length === 0) {
        return null; // Empty SQLite, caller should seed it
      }

      const users: User[] = uRows.map(row => ({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role as any,
        passwordHash: row.password_hash,
        createdAt: row.created_at,
        photo: row.photo || null,
      }));

      const dailyStocks: DailyStock[] = dRows.map(row => ({
        id: row.id,
        date: row.date,
        openingAmount: Number(row.opening_amount),
        openingSim: Number(row.opening_sim),
        flexy: Number(row.flexy),
        flexyClaim1: Number(row.flexy_claim1),
        flexyClaim2: Number(row.flexy_claim2),
        sim: Number(row.sim),
        createdAt: row.created_at,
        createdBy: row.created_by,
        customFields: row.custom_fields ? JSON.parse(row.custom_fields) : {},
      }));

      const allocations: Allocation[] = aRows.map(row => ({
        id: row.id,
        date: row.date,
        fscId: row.fsc_id,
        openingBalance: Number(row.opening_balance),
        openingSim: Number(row.opening_sim),
        autoRefill1: Number(row.auto_refill1),
        autoRefill2: Number(row.auto_refill2),
        autoRefill3: Number(row.auto_refill3),
        ecManual1: Number(row.ec_manual1),
        ecManual2: Number(row.ec_manual2),
        sim: Number(row.sim),
        totalAllocated: Number(row.total_allocated),
        createdAt: row.created_at,
        createdBy: row.created_by,
        customFields: row.custom_fields ? JSON.parse(row.custom_fields) : {},
      }));

      const sales: Sale[] = sRows.map(row => ({
        id: row.id,
        date: row.date,
        fscId: row.fsc_id,
        allocationId: row.allocation_id,
        openingBalance: Number(row.opening_balance),
        autoRefill1: Number(row.auto_refill1),
        autoRefill2: Number(row.auto_refill2),
        autoRefill3: Number(row.auto_refill3),
        ecManual1: Number(row.ec_manual1),
        ecManual2: Number(row.ec_manual2),
        closingBalance: Number(row.closing_balance),
        previousShort: Number(row.previous_short),
        saleTotal: Number(row.sale_total),
        saleAmount: Number(row.sale_amount),
        shortAmount: Number(row.short_amount),
        openingSim: Number(row.opening_sim),
        sim: Number(row.sim),
        closingSim: Number(row.closing_sim),
        status: row.status as any,
        remarks: row.remarks,
        reviewNote: row.review_note,
        createdAt: row.created_at,
        submittedAt: row.submitted_at,
        reviewedAt: row.reviewed_at,
        createdBy: row.created_by,
        submittedBy: row.submitted_by,
        reviewedBy: row.reviewed_by,
      }));

      const customFieldConfigs: CustomFieldConfig[] = cRows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type as any,
        target: row.target as any,
      }));

      return { users, dailyStocks, allocations, sales, customFieldConfigs };
    }
  } catch (err) {
    console.error('[Database] Error loading data from DB:', err);
    return null; // Fallback to memory / database.json seed
  }
}

/**
 * Synchronizes the entire in-memory database to the relational database using transactions.
 */
export async function syncDataToDb(schema: DatabaseSchema): Promise<void> {
  if (usePostgres) {
    if (!pgPool) return;
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      // Clear existing records
      await client.query('DELETE FROM sales');
      await client.query('DELETE FROM allocations');
      await client.query('DELETE FROM daily_stocks');
      await client.query('DELETE FROM users');
      await client.query('DELETE FROM custom_field_configs').catch(() => {});

      // Insert Users
      for (const u of schema.users) {
        await client.query(
          'INSERT INTO users (id, email, name, role, password_hash, created_at, photo) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [u.id, u.email, u.name, u.role, u.passwordHash, u.createdAt, u.photo || null]
        );
      }

      // Insert Daily Stocks
      for (const d of schema.dailyStocks) {
        await client.query(
          'INSERT INTO daily_stocks (id, date, opening_amount, opening_sim, flexy, flexy_claim1, flexy_claim2, sim, created_at, created_by, custom_fields) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
          [d.id, d.date, d.openingAmount, d.openingSim, d.flexy, d.flexyClaim1, d.flexyClaim2, d.sim, d.createdAt, d.createdBy, JSON.stringify(d.customFields || {})]
        );
      }

      // Insert Allocations
      for (const a of schema.allocations) {
        await client.query(
          'INSERT INTO allocations (id, date, fsc_id, opening_balance, opening_sim, auto_refill1, auto_refill2, auto_refill3, ec_manual1, ec_manual2, sim, total_allocated, created_at, created_by, custom_fields) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)',
          [a.id, a.date, a.fscId, a.openingBalance, a.openingSim, a.autoRefill1, a.autoRefill2, a.autoRefill3, a.ecManual1, a.ecManual2, a.sim, a.totalAllocated, a.createdAt, a.createdBy, JSON.stringify(a.customFields || {})]
        );
      }

      // Insert Sales
      for (const s of schema.sales) {
        await client.query(
          `INSERT INTO sales (
            id, date, fsc_id, allocation_id, opening_balance, auto_refill1, auto_refill2, auto_refill3, 
            ec_manual1, ec_manual2, closing_balance, previous_short, sale_total, sale_amount, short_amount, 
            opening_sim, sim, closing_sim, status, remarks, review_note, created_at, submitted_at, 
            reviewed_at, created_by, submitted_by, reviewed_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)`,
          [
            s.id, s.date, s.fscId, s.allocationId, s.openingBalance, s.autoRefill1, s.autoRefill2, s.autoRefill3,
            s.ecManual1, s.ecManual2, s.closingBalance, s.previousShort, s.saleTotal, s.saleAmount, s.shortAmount,
            s.openingSim, s.sim, s.closingSim, s.status, s.remarks, s.reviewNote, s.createdAt, s.submittedAt,
            s.reviewedAt, s.createdBy, s.submittedBy, s.reviewedBy
          ]
        );
      }

      // Insert Custom Field Configs
      if (schema.customFieldConfigs) {
        for (const c of schema.customFieldConfigs) {
          await client.query(
            'INSERT INTO custom_field_configs (id, name, type, target) VALUES ($1, $2, $3, $4)',
            [c.id, c.name, c.type, c.target]
          );
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[Database] Failed to sync data to PostgreSQL:', err);
      throw err;
    } finally {
      client.release();
    }
  } else {
    if (!sqliteDb) return;
    try {
      await sqliteExec('BEGIN TRANSACTION');

      // Clear existing records
      await sqliteExec('DELETE FROM sales');
      await sqliteExec('DELETE FROM allocations');
      await sqliteExec('DELETE FROM daily_stocks');
      await sqliteExec('DELETE FROM users');
      await sqliteExec('DELETE FROM custom_field_configs').catch(() => {});

      // Insert Users
      for (const u of schema.users) {
        await sqliteRun(
          'INSERT INTO users (id, email, name, role, password_hash, created_at, photo) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [u.id, u.email, u.name, u.role, u.passwordHash, u.createdAt, u.photo || null]
        );
      }

      // Insert Daily Stocks
      for (const d of schema.dailyStocks) {
        await sqliteRun(
          'INSERT INTO daily_stocks (id, date, opening_amount, opening_sim, flexy, flexy_claim1, flexy_claim2, sim, created_at, created_by, custom_fields) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [d.id, d.date, d.openingAmount, d.openingSim, d.flexy, d.flexyClaim1, d.flexyClaim2, d.sim, d.createdAt, d.createdBy, JSON.stringify(d.customFields || {})]
        );
      }

      // Insert Allocations
      for (const a of schema.allocations) {
        await sqliteRun(
          'INSERT INTO allocations (id, date, fsc_id, opening_balance, opening_sim, auto_refill1, auto_refill2, auto_refill3, ec_manual1, ec_manual2, sim, total_allocated, created_at, created_by, custom_fields) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [a.id, a.date, a.fscId, a.openingBalance, a.openingSim, a.autoRefill1, a.autoRefill2, a.autoRefill3, a.ecManual1, a.ecManual2, a.sim, a.totalAllocated, a.createdAt, a.createdBy, JSON.stringify(a.customFields || {})]
        );
      }

      // Insert Sales
      for (const s of schema.sales) {
        await sqliteRun(
          `INSERT INTO sales (
            id, date, fsc_id, allocation_id, opening_balance, auto_refill1, auto_refill2, auto_refill3, 
            ec_manual1, ec_manual2, closing_balance, previous_short, sale_total, sale_amount, short_amount, 
            opening_sim, sim, closing_sim, status, remarks, review_note, created_at, submitted_at, 
            reviewed_at, created_by, submitted_by, reviewed_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            s.id, s.date, s.fscId, s.allocationId, s.openingBalance, s.autoRefill1, s.autoRefill2, s.autoRefill3,
            s.ecManual1, s.ecManual2, s.closingBalance, s.previousShort, s.saleTotal, s.saleAmount, s.shortAmount,
            s.openingSim, s.sim, s.closingSim, s.status, s.remarks, s.reviewNote, s.createdAt, s.submittedAt,
            s.reviewedAt, s.createdBy, s.submittedBy, s.reviewedBy
          ]
        );
      }

      // Insert Custom Field Configs
      if (schema.customFieldConfigs) {
        for (const c of schema.customFieldConfigs) {
          await sqliteRun(
            'INSERT INTO custom_field_configs (id, name, type, target) VALUES (?, ?, ?, ?)',
            [c.id, c.name, c.type, c.target]
          );
        }
      }

      await sqliteExec('COMMIT');
    } catch (err) {
      await sqliteExec('ROLLBACK');
      console.error('[Database] Failed to sync data to SQLite:', err);
      throw err;
    }
  }
}

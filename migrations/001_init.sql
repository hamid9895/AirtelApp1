-- Airtel StockDistro Database Schema Migration (001_init.sql)
-- Compatible with both PostgreSQL and SQLite3

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_stocks (
  id TEXT PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,
  opening_amount REAL NOT NULL,
  opening_sim REAL NOT NULL,
  flexy REAL NOT NULL,
  flexy_claim1 REAL NOT NULL,
  flexy_claim2 REAL NOT NULL,
  sim REAL NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS allocations (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  fsc_id TEXT NOT NULL,
  opening_balance REAL NOT NULL,
  opening_sim REAL NOT NULL,
  auto_refill1 REAL NOT NULL,
  auto_refill2 REAL NOT NULL,
  auto_refill3 REAL NOT NULL,
  ec_manual1 REAL NOT NULL,
  ec_manual2 REAL NOT NULL,
  sim REAL NOT NULL,
  total_allocated REAL NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  fsc_id TEXT NOT NULL,
  allocation_id TEXT,
  opening_balance REAL NOT NULL,
  auto_refill1 REAL NOT NULL,
  auto_refill2 REAL NOT NULL,
  auto_refill3 REAL NOT NULL,
  ec_manual1 REAL NOT NULL,
  ec_manual2 REAL NOT NULL,
  closing_balance REAL NOT NULL,
  previous_short REAL NOT NULL,
  sale_total REAL NOT NULL,
  sale_amount REAL NOT NULL,
  short_amount REAL NOT NULL,
  opening_sim REAL NOT NULL,
  sim REAL NOT NULL,
  closing_sim REAL NOT NULL,
  status TEXT NOT NULL,
  remarks TEXT,
  review_note TEXT,
  created_at TEXT NOT NULL,
  submitted_at TEXT,
  reviewed_at TEXT,
  created_by TEXT,
  submitted_by TEXT,
  reviewed_by TEXT
);

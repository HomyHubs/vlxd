-- VLXD Manager Database Schema
-- Compatible with SQLite (local development) and PostgreSQL / Supabase

-- Users & Role-Based Access Control
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT,
  salt TEXT,
  pass_hash TEXT,
  role TEXT CHECK(role IN ('admin', 'editor', 'viewer')) NOT NULL DEFAULT 'editor',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Products Catalog & Inventory Control
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cat TEXT NOT NULL,
  unit TEXT NOT NULL,
  price REAL NOT NULL,
  cost_price REAL DEFAULT 0,
  old_price REAL,
  stock REAL DEFAULT 0,
  min_stock REAL DEFAULT 10,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Price History Audit Trail
CREATE TABLE IF NOT EXISTS price_history (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  old_price REAL NOT NULL,
  new_price REAL NOT NULL,
  change_percent REAL,
  updated_by TEXT,
  date TEXT DEFAULT (datetime('now'))
);

-- Sales Orders & Debt Tracking
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  date TEXT NOT NULL,
  customer_name TEXT DEFAULT 'Khách lẻ',
  customer_phone TEXT,
  total REAL NOT NULL DEFAULT 0,
  paid_amount REAL NOT NULL DEFAULT 0,
  debt_amount REAL NOT NULL DEFAULT 0,
  payment_status TEXT CHECK(payment_status IN ('paid', 'partial', 'debt')) DEFAULT 'paid',
  created_by TEXT
);

-- Sales Order Line Items
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  qty REAL NOT NULL,
  price REAL NOT NULL,
  cost_price REAL DEFAULT 0,
  total_price REAL DEFAULT 0,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- Stock-In (Purchase Receipts / Nhập hàng)
CREATE TABLE IF NOT EXISTS stock_in (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  supplier_name TEXT DEFAULT 'Nhà cung cấp',
  total REAL NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  created_by TEXT
);

-- Stock-In Line Items
CREATE TABLE IF NOT EXISTS stock_in_items (
  id TEXT PRIMARY KEY,
  stock_in_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  qty REAL NOT NULL,
  cost_price REAL NOT NULL,
  total_price REAL NOT NULL,
  FOREIGN KEY (stock_in_id) REFERENCES stock_in(id) ON DELETE CASCADE
);

-- Customer Payments (Repayment History for Debts)
CREATE TABLE IF NOT EXISTS customer_payments (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  sale_id TEXT,
  amount_paid REAL NOT NULL,
  notes TEXT,
  date TEXT NOT NULL,
  created_by TEXT
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_cat ON products(cat);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_name);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_in_date ON stock_in(date);

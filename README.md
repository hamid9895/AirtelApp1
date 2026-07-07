# Airtel StockDistro 🔴📶

An enterprise-grade, secure, full-stack Distribution & Cash Management Ledger built for Airtel Field Sales Coordinators (FSCs), Regional Managers, and Financial Approvers. 

This application bridges the operational gap between main-office inventory releases, EasyCharge (EC) electronic refills, SIM card inventory distribution, and evening cash remittances, complete with a dual-authorization audit ledger, custom metadata extensions, and real-time security logs.

---

## 📖 Table of Contents
- [Aesthetic & Design Concept](#-aesthetic--design-concept)
- [Key Business Capabilities & Workflows](#-key-business-capabilities--workflows)
- [Security & Access Control Matrix](#-security--access-control-matrix)
- [Technical Architecture](#-technical-architecture)
- [Prerequisites & Quick Start](#-prerequisites--quick-start)
- [Detailed Deployment Guides](#-detailed-deployment-guides)
  - [Deploying to Render (Full-Stack Single Container)](#1-deploying-to-render-full-stack-single-container)
  - [Deploying to Netlify (Frontend) + Render (Backend API)](#2-deploying-to-netlify-frontend--render-backend-api)
  - [Integrating with Supabase (Relational Database)](#3-integrating-with-supabase-relational-database)
- [Audit Trail & Compliance Safety](#-audit-trail--compliance-safety)

---

## 🎨 Aesthetic & Design Concept

The interface is styled around **Airtel’s Brand Palette** featuring premium typography pairings, spacious negative tracking, and high-contrast light layouts:
* **Brand Signature**: Airtel Red (`#EE1D23`) accents paired with rich obsidian deep charcoal slate for an authoritative, enterprise-grade workspace.
* **Layout Discipline**: Balanced padding rhythms, fluid grids (`max-w-7xl`), and subtle motion entries to transition between navigation modules.
* **Architecture Integrity**: No low-quality visual clutter, pseudo-intellectual terminal lines, or fake network mock widgets. Every element is standard, human, and functional.

---

## 💼 Key Business Capabilities & Workflows

```
  [ Main Warehouse ]  ==>  [ Daily Stock Release ]  ==>  [ FSC Coordinator Allocation ]
                                                                 ||
  [ Settle & Audit ]  <==  [ Manager Authorization ]  <==  [ Evening Sales Sheet ]
```

### 1. Daily Stock Release Tab (Main Office Ledger)
Main inventory managers release cash and physical SIM card inventory into the active daily pool:
* Set opening bank limits and allocate EasyCharge airtime refills (Auto-Refills 1-3).
* Dynamically expand entries via custom metadata fields (e.g. Regional Route Codes, Delivery Vehicle numbers).

### 2. FSC Agent Distribution Tab (Allocations)
Allocates cash limits, EasyCharge credit buffers, and physical SIM stocks to specific FSC coordinators for their daily retail runs.
* Prevents over-allocation by dynamically calculating available warehouse stock balances.
* Restricts duplicate allocations for a coordinator on the same audit date.

### 3. Coordinator Evening Sales Sheet Tab (Audit & Settlement)
At the end of the business day, FSC coordinators record their closing balances to compute net airtime sales and account for shortages:
* **The Airtime Formula**: `Computed Airtime Sales = (Opening Balance + Auto-Refill 1 + 2 + 3 + Manual EC 1 + 2) - Closing Balance`
* **Shortage / Surplus Reconciliation**: Checks actual remitted cash against computed credit sales. Discrepancies are flagged as high-priority field shortages requiring management review.
* Drafts remain fully editable by FSC staff until submitted to the managerial verification queue.

### 4. Staff Security & Registry Tab
Enables administrative profile tracking, base64 custom profile photo uploads, password resets, and staff creation.

---

## 🔐 Security & Access Control Matrix

The system features a dynamically configurable **Permissions Matrix** allowing Administrators to alter menu access levels in real-time.

| Privilege Level | View Dashboard | Edit Daily Stock | Allocate FSC Stock | Review & Approve Sheets | Security Audit Logs | Masters Config |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Admin** | Yes | Yes | Yes | Yes | Yes | Yes |
| **Manager** | Yes | View Only | Yes | Yes | Yes | No |
| **Approver** | Yes | View Only | View Only | Yes | No | No |
| **FSC Coordinator** | Yes | View Only | View Only | View Only (Draft Submit) | No | No |

---

## 💻 Technical Architecture

* **Client Engine**: React 18, Vite bundler, Tailwind CSS for fluid responsive grids, motion for animation transitions.
* **Server Engine**: Express.js server running in-process, dual-booted with Vite middleware. 
* **Database Ledger**: Semi-relational `database.json` flat-file with local write-through synchronization.
* **Authorization Scheme**: Stateless JSON Web Tokens (JWT) using cryptographically secure PBKDF2 hashing with high-iteration salting for passcode validation.
* **Extensibility Model**: Fully decoupled schema allowing custom field configurations dynamically linked to FSC allocations or Stock forms.

---

## 🚀 Prerequisites & Quick Start

### Prerequisites
* [Node.js](https://nodejs.org) (v18.x or above)
* npm (v9.x or above)

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Run Locally (Development Mode)
Development boots both the Express API and the React client using `tsx`:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 3. Compile Production Bundle
```bash
npm run build
```
The client code is built into `/dist` as static assets, and the Express backend is compiled into a single-file CommonJS production bundle (`dist/server.cjs`) using `esbuild`.

### 4. Run Production Server
```bash
npm run start
```

---

## ☁️ Detailed Deployment Guides

### 1. Deploying to Render (Full-Stack Single Container)
Render is an excellent platform for hosting full-stack applications. This repository contains custom compilation settings to build the React frontend and run the Express API on a single unified port.

#### Step-by-Step Instructions:
1. Log in to your [Render Dashboard](https://dashboard.render.com/) and click **New > Web Service**.
2. Connect your GitHub repository containing this codebase.
3. In the Web Service configuration, set the following parameters:
   * **Runtime**: `Node`
   * **Region**: Choose the closest server region.
   * **Branch**: `main` (or your active deployment branch)
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start`
4. Under **Advanced / Environment Variables**, configure the following variables:
   * `NODE_ENV`: `production`
   * `PORT`: `3000` (Render will bind incoming traffic to this port)
   * `JWT_SECRET`: `your-long-super-secret-key-phrase` (Replace with a cryptographically secure string)
5. Click **Deploy Web Service**. Render will install dependencies, build the React frontend, compile the unified `dist/server.cjs` backend, and launch the server on an active SSL subdomain.

---

### 2. Deploying to Netlify (Frontend) + Render (Backend API)
If you prefer a decoupled architecture, you can host the static React SPA on Netlify’s high-speed CDN and the Express backend on Render.

#### A. Backend Setup (Render)
1. Deploy a **Web Service** on Render following the steps above.
2. Ensure you add `JWT_SECRET` to the environment variables.
3. Note your Render URL (e.g., `https://airtel-stockdistro-api.onrender.com`).

#### B. Frontend Setup (Netlify)
1. Log in to [Netlify](https://www.netlify.com/) and click **Add new site > Import from Git**.
2. Select your repository.
3. Configure the build parameters:
   * **Build Command**: `npm run build`
   * **Publish Directory**: `dist`
4. Under **Site Configuration > Environment Variables**, define:
   * `VITE_API_URL`: `https://airtel-stockdistro-api.onrender.com` (Your Render API URL)
5. **Configure Redirect Rules**: Since React is a Single Page Application (SPA), add a `_redirects` file inside your `/public` folder to prevent 404 errors on browser refreshes:
   ```text
   /*    /index.html   200
   ```
6. Click **Deploy**. Netlify will build your static assets and distribute them globally.

---

### 3. Integrating with Supabase (Relational Database)
The default application persists transactions into a localized flat file (`database.json`). For production environments, you can easily plug in **Supabase's managed PostgreSQL database**.

#### A. Set Up Database Schema
1. Create a free project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in Supabase and run the following tables setup:

```sql
-- Staff Accounts
CREATE TABLE users (
  id VARCHAR(100) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  photo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily Releases
CREATE TABLE daily_stocks (
  id VARCHAR(100) PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  opening_amount NUMERIC(15,2) NOT NULL,
  opening_sim INTEGER NOT NULL,
  flexy NUMERIC(15,2) NOT NULL,
  flexy_claim_1 NUMERIC(15,2) DEFAULT 0,
  flexy_claim_2 NUMERIC(15,2) DEFAULT 0,
  sim INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  custom_fields JSONB DEFAULT '{}'
);

-- FSC Allocations
CREATE TABLE allocations (
  id VARCHAR(100) PRIMARY KEY,
  date DATE NOT NULL,
  fsc_id VARCHAR(100) NOT NULL,
  opening_balance NUMERIC(15,2) NOT NULL,
  opening_sim INTEGER NOT NULL,
  auto_refill_1 NUMERIC(15,2) DEFAULT 0,
  auto_refill_2 NUMERIC(15,2) DEFAULT 0,
  auto_refill_3 NUMERIC(15,2) DEFAULT 0,
  ec_manual_1 NUMERIC(15,2) DEFAULT 0,
  ec_manual_2 NUMERIC(15,2) DEFAULT 0,
  sim INTEGER NOT NULL,
  total_allocated NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  custom_fields JSONB DEFAULT '{}',
  UNIQUE(date, fsc_id)
);

-- Coordinator Sales Sheets
CREATE TABLE sales (
  id VARCHAR(100) PRIMARY KEY,
  date DATE NOT NULL,
  fsc_id VARCHAR(100) NOT NULL,
  allocation_id VARCHAR(100),
  opening_balance NUMERIC(15,2) NOT NULL,
  auto_refill_1 NUMERIC(15,2) DEFAULT 0,
  auto_refill_2 NUMERIC(15,2) DEFAULT 0,
  auto_refill_3 NUMERIC(15,2) DEFAULT 0,
  ec_manual_1 NUMERIC(15,2) DEFAULT 0,
  ec_manual_2 NUMERIC(15,2) DEFAULT 0,
  closing_balance NUMERIC(15,2) NOT NULL,
  previous_short NUMERIC(15,2) DEFAULT 0,
  sale_total NUMERIC(15,2) NOT NULL,
  sale_amount NUMERIC(15,2) NOT NULL,
  short_amount NUMERIC(15,2) NOT NULL,
  opening_sim INTEGER NOT NULL,
  sim INTEGER NOT NULL,
  closing_sim INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'Draft',
  remarks TEXT,
  review_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  created_by VARCHAR(100),
  submitted_by VARCHAR(100),
  reviewed_by VARCHAR(100)
);

-- Security Log Trail
CREATE TABLE audit_logs (
  id VARCHAR(100) PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(100),
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  user_role VARCHAR(100),
  action VARCHAR(50),
  target_type VARCHAR(100),
  details TEXT
);
```

#### B. Connect the Server
Provide your Supabase PostgreSQL connection string as an environment variable to the production server:
* Variable Name: `DATABASE_URL`
* Example Value: `postgresql://postgres:password@db.supabase.co:5432/postgres`

---

## 🔒 Audit Trail & Compliance Safety

Every action inside Airtel StockDistro writes a structured record to the Security & Transaction Audit Trail. These logs are immutable on the frontend and are filtered dynamically by:
1. **Operator Details**: Pinpoints exact ID, email address, and staff role.
2. **Action Categories**: Filters logs by `CREATE`, `UPDATE`, `DELETE`, `SUBMIT`, `APPROVE`, or `REJECT`.
3. **Target Ledgers**: Groups audits into Daily Stocks, Allocations, Sales Sheets, or System Permissions.

*These logs can be exported at any time to a clean CSV format for management and banking reconciliation.*

---

## 🖼️ Application Interfaces (Reference Diagrams)

### 💻 Main Executive Dashboard View
```
+-----------------------------------------------------------------------------------------+
|  🔴 airtel  |  🏠 Dashboard  |  📦 Stock Release  |  💸 FSC Distribution  |  👥 Staff  |  ⚙️  |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  [Daily Metrics Balance]               [Refills & SIM Stock]            [Total Cash Remit] |
|   ₹12,450,000                           45,000 SIMs                      ₹9,120,400     |
|                                                                                         |
|  +------------------------------------ DATA GRID ------------------------------------+  |
|  | Date       | Staff Name     | Opening Cash | Total Refills | Closing Bal | Status  |  |
|  |------------|----------------|--------------|---------------|-------------|---------|  |
|  | 2026-07-07 | Alok Kumar     | ₹120,000     | ₹45,000       | ₹12,000     | Pending |  |
|  | 2026-07-06 | Priyah Sharma  | ₹95,000      | ₹10,000       | ₹0          | Approved|  |
|  +------------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

---

## 🤝 Support & Contributions
For internal Airtel field management issues, route code registrations, or vehicle tracking configs, please reach out to the Airtel IT Regional Support desk.

*Designed with professional precision and architectural integrity in 2026.*

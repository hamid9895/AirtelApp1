# Application Architecture & Functional Specification

This document provides a comprehensive blueprint of the Airtel Distribution & Stock Auditing ERP application. It describes the system topology, multi-engine database layer, entity relationships, security models, mathematical accounting formulas, and dynamic modular UI components.

---

## 1. System Topology & Stack

The application is structured as a unified **Full-Stack Single Page Application (SPA)** with a lightweight decoupled backend server.

```
       ┌────────────────────────────────────────────────────────┐
       │                   Vite Dev Server                      │
       │     (Runs alongside Express in development mode)       │
       └───────────────────────────┬────────────────────────────┘
                                   │ (HMR Proxy / Static Assets)
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    REACT CLIENT-SIDE APPLICATION                     │
│  - TypeScript (type-safe, strict interface models)                   │
│  - Tailwind CSS (high-fidelity design utility layer)                 │
│  - Recharts / Lucide React / Framer Motion                           │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │ (HTTP JWT Authorized REST Requests)
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         EXPRESS API SERVER                           │
│  - Token-Based JWT Security Middleware                               │
│  - Administrative Role Verification Guards                           │
│  - System Audit Logging Engine                                       │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │ (Unified Storage Abstraction)
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     DATABASE CONVERGENCE LAYER                       │
│  - Cloud Environment: Managed PostgreSQL (Cloud SQL Engine)           │
│  - Local Sandbox: Embedded SQLite (with PRAGMA runtime migrations)   │
└──────────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture
- **Framework**: React (functional components, modern custom hooks).
- **Build Tooling**: Vite (pre-configured server binding on standard port `3000`).
- **Styling**: Direct Tailwind CSS imports (`@import "tailwindcss";`) delivering an off-white and charcoal high-contrast layout accented with Airtel Red (`#EE1D23`).
- **Routing & State**: Single-view navigation tree driven by modular tabs in `App.tsx` with unified dynamic React state synchronization from the API endpoints.

### Backend Architecture
- **Platform**: Node.js with Express.
- **Transpiler**: `tsx` in development mode, bundle-compiled via `esbuild` to a self-contained CommonJS target (`dist/server.cjs`) for production.
- **Port Ingress**: Explicitly binds to `0.0.0.0:3000` to support containerised environments.

---

## 2. Multi-Engine Database Abstraction (`db.ts`)

The database layer implements a dual-engine architecture capable of seamlessly switching between **PostgreSQL** and **SQLite** without modification to the core application route controllers.

### Schema Convergence & Migrations
Upon server bootstrap, the database controller identifies the runtime environment:
1. **PostgreSQL Mode**: If active, it provisions a connection pool and runs SQL queries matching the target dialect.
2. **SQLite Mode**: If PostgreSQL is absent, it initialises an in-memory or file-backed database (`database.json`) and runs standard schema validation checks.
3. **Dynamic Hot-Migration**: It executes safe runtime checks, such as querying column listings (`PRAGMA table_info` / `information_schema.columns`) and running live `ALTER TABLE` schema updates to add critical columns (e.g., `today_short` in the `sales` table, `dashboard_config` in the `configurations` table) without data loss.

---

## 3. Database Entity Specifications

```
                       ┌──────────────────────┐
                       │     audit_logs       │
                       └──────────────────────┘
                                  ▲
                       ┌──────────┴───────────┐
                       │        users         │
                       └──────────┬───────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │ (createdBy)            │ (createdBy)            │ (fscId)
         ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  daily_stocks   │      │   allocations   │      │      sales      │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌───────────────────────────────────────────────────────────────────┐
│                   custom_field_configs                            │
│  - Dynamically registers fields in daily_stocks, allocations,     │
│    or sales tables via unified JSON payload columns               │
└───────────────────────────────────────────────────────────────────┘
```

### Table 1: `users`
Tracks credential profiles, contact information, and role assignments.
- `id` (UUID / TEXT PRIMARY KEY)
- `email` (TEXT UNIQUE)
- `password` (TEXT hashed with bcrypt/pbkdf2)
- `name` (TEXT)
- `role` (TEXT: `'Admin'`, `'Manager'`, `'Approver'`, `'FSC'`)
- `createdAt` (TIMESTAMP)

### Table 2: `daily_stocks`
Represents daily vault cash balances and primary stock records.
- `id` (TEXT PRIMARY KEY)
- `date` (TEXT UNIQUE)
- `openingAmount` (REAL - Starting vault cash)
- `flexy` (REAL - Flexy credit on hand)
- `flexyClaim1` / `flexyClaim2` (REAL)
- `sim` (INTEGER - SIM cards count)
- `customFields` (TEXT - JSON block containing dynamic custom metrics)
- `createdAt` / `createdBy` (TIMESTAMP / TEXT)

### Table 3: `allocations`
Documents distribution events where cash/credit is issued to FSC (Field Sales Coordinator) agents.
- `id` (TEXT PRIMARY KEY)
- `date` (TEXT)
- `fscId` (TEXT REFERENCES users)
- `autoRefill1` / `autoRefill2` / `autoRefill3` (REAL)
- `ecManual1` / `ecManual2` (REAL)
- `sim` (INTEGER)
- `totalAllocated` (REAL)
- `customFields` (TEXT - Dynamic metadata JSON)
- `createdAt` / `createdBy` (TIMESTAMP / TEXT)

### Table 4: `sales`
Represents daily sales sheets submitted by FSC agents, subject to manager approval.
- `id` (TEXT PRIMARY KEY)
- `date` (TEXT)
- `fscId` (TEXT REFERENCES users)
- `openingBalance` (REAL)
- `closingBalance` (REAL - Remaining airtime balance)
- `openingSim` / `sim` / `closingSim` (INTEGER)
- `autoRefill1` / `autoRefill2` / `autoRefill3` (REAL)
- `ecManual1` / `ecManual2` (REAL)
- `saleTotal` (REAL - Airtime volume sold, net of commissions)
- `saleAmount` (REAL - Net cash remitted/settled)
- `previousShort` (REAL - Unsettled carry-over shortages)
- `todayShort` (REAL - Shortage audited from this entry)
- `status` (TEXT: `'Pending'`, `'Approved'`, `'Rejected'`)
- `remarks` (TEXT - FSC notes)
- `reviewNote` (TEXT - Audit/Settle remarks by supervisor)
- `customFields` (TEXT - Dynamic metadata JSON)
- `createdAt` / `createdBy` / `submittedAt` (TIMESTAMP)

### Table 5: `custom_field_configs`
Provides programmatic extension of metadata fields across daily stock forms, FSC sheets, and sales records.
- `id` (TEXT PRIMARY KEY)
- `target` (TEXT: `'stock'`, `'fsc'`)
- `name` (TEXT)
- `type` (TEXT: `'number'`, `'text'`, `'boolean'`)
- `required` (BOOLEAN)

### Table 6: `configurations`
Stores global multi-tenant business parameters and persistent custom dashboard settings.
- `id` (TEXT PRIMARY KEY - `'default'`)
- `commission_percentage` (REAL - Default airtime commission rate)
- `sim_amount` (REAL - Standard pricing of a physical SIM card)
- `dashboard_config` (TEXT - Persistent JSON payload specifying widget arrangements, custom visual structures, mathematical metrics formulas, and alert parameters)

---

## 4. Key Business Logic & Financial Formulas

The core utility of this application is verifying and auditing discrepancies between system allocations, retail sales, and cash remittance.

### Formula A: Calculated Closing Cash (Vault)
Determined inside `DashboardConfigTab.tsx` and the ledger tables to calculate expected vault cash balances dynamically on any calendar date.

$$\text{Calculated Closing Cash} = \text{Opening Balance} + \text{Flexy} + \text{Claims} - \text{Total Allocated Cash} + \text{Total Approved Remittance}$$

Where:
- $\text{Total Allocated Cash}$ represents all cash distributed to FSC agents on that date ($\sum \text{Auto-Refills} + \sum \text{Easy-Charges}$).
- $\text{Total Approved Remittance}$ represents the total cash remitted by all FSC coordinators on approved sales sheets.

---

### Formula B: Net Airtime Sold & Expected Cash
When a coordinator returns from the field, their total airtime sales volume must reconcile with their closing balance.

$$\text{Total Refills} = R_1 + R_2 + R_3$$

$$\text{Total EasyCharge (EC)} = \text{EC}_1 + \text{EC}_2$$

$$\text{Calculated Airtime Sales Volume} = \text{Opening Balance} + \text{Total Refills} + \text{Total EC} - \text{Closing Balance}$$

The system deducts the dealer's dynamic commission percentage to verify expected cash:

$$\text{Expected Airtime Cash} = \text{Calculated Airtime Sales Volume} \times \left(1 - \frac{\text{Commission \%}}{100}\right)$$

$$\text{Expected SIM Cash} = \text{SIMs Sold} \times \text{SIM Unit Rate}$$

$$\text{Expected Combined Cash} = \text{Expected Airtime Cash} + \text{Expected SIM Cash}$$

---

### Formula C: Shortage Audit Ledger
A shortage or surplus represents a mismatch between what the coordinator remitted and what the calculated inventory volume demands.

$$\text{Today's Short} = \text{Remitted Cash} - \text{Expected Combined Cash}$$

$$\text{Closing Unsettled Balance} = \text{Previous Short Balance} + \text{Today's Short}$$

- **Negative Closing Balance**: Coordinator returned with insufficient cash (debt registered).
- **Positive Closing Balance**: Coordinator turned in surplus cash (excess credited).

---

## 5. UI Component Specifications

The user interface follows a modern high-density design configured to load state securely and render responsive visual elements.

```
┌────────────────────────────────────────────────────────┐
│                        App.tsx                         │
├────────────────────────────────────────────────────────┤
│ - Authentication Router (JWT state tracking)           │
│ - Shared Master Data Buffers (dailyStocks, sales, etc) │
│ - Header/TopBar & Responsive Sidebar Nav               │
└─┬────────────────────────────────────────────────────┬─┘
  │                                                    │
  ├─► [DashboardTab.tsx]                               ├─► [DailyStockTab.tsx]
  │   Parses live formulas dynamically using an        │   Manages ledger-style stock opening balances,
  │   interpreting arithmetic math parser.             │   auditing expected daily stock values.
  │                                                    │
  ├─► [DashboardConfigTab.tsx]                         ├─► [AllocationsTab.tsx]
  │   Interactive formulas builder supporting live     │   Allows managers to distribute vault cash,
  │   mathematical formula customization.              │   SIM inventory, and credit to agents.
  │                                                    │
  ├─► [SalesTab.tsx]                                   ├─► [ReportsTab.tsx]
  │   Provides coordinator entry tools, multi-step     │   Provides tabular ledger tracking with export
  │   approval matrices, and full breakdown views.     │   capabilities and comprehensive filters.
  └────────────────────────────────────────────────────┘
```

### Component Details
1. **`App.tsx` (Root Controller)**: Handles system boot, coordinates token validation, centralises error handling, and manages navigation states. It pulls global configurations, including persistent custom dashboard layouts.
2. **`DashboardTab.tsx` (Analytical Viewer)**: Displays interactive charts and key metrics. If widgets are not configured, it presents a clean setup flow. It features a client-side math evaluator that reads live database keys.
3. **`DashboardConfigTab.tsx` (Mathematical Modeler)**: Allows administrators to create, edit, or remove widgets. It includes a mathematical formula interpreter to bind fields like `openingAmount`, `closingBalance`, and custom variables. It persists these custom dashboards directly to the cloud server via dynamic REST APIs.
4. **`SalesTab.tsx` (Auditing Workspace)**: Implements complex sales sheet logging and manager review grids. It provides a comprehensive multi-section detailed breakdown for both review stages and post-approval histories. This ensures complete transparency by showing every allocation, refill, SIM count, and ledger shortage.

---

## 6. Access Control & Security Matrix

Authorization is strictly enforced across both the client-side UI and server API controllers.

| User Role | Dashboard | Daily Stock | Allocations | Sales Sheets | Configuration | Audit Logs |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Admin** | Read/Write | Read/Write | Read/Write | Full (Settle/Approve) | Full Access | Full Access |
| **Manager** | Read/Write | Read/Write | Read/Write | Full (Settle/Approve) | Full Access | Read Only |
| **Approver**| Read Only | Access Denied | Access Denied | Review & Approve | Access Denied | Access Denied |
| **FSC** | Read Only | Access Denied | Access Denied | Submit Drafts Only | Access Denied | Access Denied |

### API Security Implementation
- **JWT Authorization**: Requests must include an `Authorization: Bearer <token>` header. The token is generated server-side upon successful authentication and contains the user's role and unique identifier.
- **Role Verification Middleware**: Routes modifying administrative scopes are explicitly guarded by role restrictions (e.g., `requireRole(['Admin', 'Manager'])`), preventing privilege escalation.
- **Immutable System Audit Logging**: Every critical operation (such as database overrides, approvals, custom field modifications, or configuration adjustments) is recorded in the `audit_logs` table. These logs are write-once and cannot be deleted or modified through the API.

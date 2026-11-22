# ⚡ 01 - Modern React 19 ERP Web Application
### Al Mustafa Heights Building Maintenance ERP System

---

## 📖 Overview
The flagship **Single-Page Application (SPA)** built with **React 19**, **Vite 8**, **Tailwind CSS v4**, and **Lucide Icons**. It provides a real-time, enterprise-grade accounting and management dashboard for **Al Mustafa Heights 5-E-18/19**.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.x, v20.x, or v22+)
- **npm** (v9+ or v10+)

### Quick Start
```bash
# 1. Navigate to the web application directory
cd 01-web-application

# 2. Install dependencies (if not already installed)
npm install

# 3. Start development server
npm run dev

# 4. Open in browser:
# http://localhost:5173
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 🏛️ Application Architecture & Modules

### 1. 📊 Executive Dashboard (`DashboardPage.jsx`)
- Real-time KPI summary: Current Cash-in-Hand, Monthly Recovery Rate, Total Expenses, and Arrears Outstanding.
- Floor-wise recovery progress bars and financial health indicators.
- Quick navigation shortcuts and dynamic monthly audit status alerts.

### 2. 🏢 Maintenance Register (`CollectionsPage.jsx`)
- Complete residential ledger across 20 building units (G-1 through P-4 + Shop).
- Automated Prior Arrears & Smart Advance Credit calculation (clearing past pendings vs future advance).
- Real-Time Financial Clash & Discrepancy Detection Engine (Zero silent auto-corrections).
- WhatsApp Defaulter Broadcasts (Detailed vs Flat-only options).
- Digital Payment Receipt generation with one-click WhatsApp sharing and PNG export.

### 3. 💸 Expenses Tracker (`ExpensesPage.jsx`)
- Categorized building expenses (Electric bills, sweeper, motor operator, plumbing, repairs).
- Dynamic opening balance reconciliation & cross-month savings rollover.
- Contra Expense-to-Flat auto adjustment.

### 4. 📲 Bills & WhatsApp Communication Hub (`BillsWhatsAppPage.jsx`)
- Individual resident maintenance demand notes.
- One-click WhatsApp broadcast generator with Urdu & Roman bilingual message templates.
- Building circulars and official management notices.

### 5. 👥 Residents Directory (`ResidentsPage.jsx`)
- Master tenant vs owner registry with configurable "صاحب" honorifics and "(کرایہ دار)" badges.
- Emergency contact numbers, occupancy status, and flat floor mappings.

### 6. 🛠️ Vendor & Contractor Ledger (`VendorLedgerPage.jsx`)
- Tracks plumbers, electricians, pump technicians, and hardware store payments.
- Detailed ledger logs, pending balances, and service history.

### 7. ✨ Special Funds / Sinking Fund (`SpecialFundsPage.jsx`)
- Dedicated sub-accounts for major capital expenditures (Lift overhaul, underground water tank cleaning, roof waterproofing).
- Individual unit contribution targets and collected tracking.

### 8. 🛡️ Audit Log & Error Discrepancies (`ErrorsAuditPage.jsx`)
- Full audit log of all manual overrides, cell adjustments, and balance chain clashes.
- 100% reconciled digital stamp generator.

### 9. 💾 Data Safety Vault & Backup (`StorageVaultModal.jsx` & `ExportPage.jsx`)
- 1-Click JSON and Excel complete system backup.
- Snapshot restore, local storage persistence, and historical audit exports.

---

## 🛠️ Tech Stack
- **Framework:** React 19.3
- **Bundler:** Vite 8.3
- **Styling:** Tailwind CSS v4.3
- **Icons:** Lucide React
- **Spreadsheet Engine:** ExcelJS & XLSX
- **Image Generation:** html-to-image

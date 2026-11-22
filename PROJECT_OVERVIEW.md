# 🏢 AL MUSTAFA HEIGHTS (5-E-18/19) - BUILDING MAINTENANCE ERP SYSTEM
## Complete System Architecture & Developer Handbook for AI Agents & Developers

---

## 1. Project Identity & Objective
* **Building Name**: Al Mustafa Heights (Address: 5-E-18/19)
* **Project Type**: Offline-First Building Maintenance & Financial Management ERP System (Single Page Web Application)
* **Core Purpose**: 
  - Manage monthly maintenance collections, vendor expenses, cash flow, and arrears across all building units.
  - Generate automated WhatsApp billing reminders, payment receipts, and circulars in Urdu / English.
  - Track Special Project Funds (e.g., Lift Overhaul, Tanker Drives, Emergency Repairs).
  - Ensure 100% financial audit accuracy with chained balance reconciliations and error-clash detection.
  - Export professional Excel (`.xlsx`) workbooks matching historical committee templates and export printable PDF/image slips.

---

## 2. Technology Stack & Runtime Environment

| Layer | Technology | Details |
|---|---|---|
| **Frontend Framework** | **React 19.3.1** | Functional components, Hooks, Error Boundaries |
| **Build Tool & Bundler** | **Vite 8.3.5** | Fast HMR, ESM bundling |
| **Styling & UI** | **Tailwind CSS 4.3.3** | Custom Urdu font styling, RTL/LTR support, responsive |
| **Icons** | **lucide-react** | Modern feather-style SVG icon set |
| **Spreadsheet Engine** | **exceljs (v4.4.0)** & **xlsx (v0.18.5)** | Generates formatted Excel sheets with formulas & custom styling |
| **Image Generation** | **html-to-image (v1.11.13)** | Generates PNG receipts/slips from DOM elements |
| **Client Storage** | **LocalStorage + IndexedDB** | Immediate synchronous write + async redundant snapshot vault |
| **Linter** | **Oxlint** | High-speed Rust-based JS/JSX linter |

---

## 3. Directory & File Organization (3 Dedicated Parts)

```
/ (Root Workspace: i:\building maintanence)
├── START_APP.bat                       # One-click desktop launcher (runs Vite dev & launches browser)
├── README.md                           # System overview & repository landing guide
├── PROJECT_OVERVIEW.md                 # Deep-dive architecture and domain specification
│
├── 01-web-application/                 # PART 1: Modern React 19 + Vite 8 Enterprise ERP
│   ├── package.json                    # Dependencies & scripts
│   ├── vite.config.js                  # Vite configuration
│   ├── index.html                      # HTML entry with Urdu & Segoe UI font imports
│   ├── dist/                           # Compiled production build
│   └── src/                            # Complete frontend source code
│
├── 02-standalone-html-app/             # PART 2: Zero-Dependency Single-File Offline App
│   ├── index.html                      # Fully standalone offline single-page HTML app
│   └── README.md                       # Quick-run guide for portable edition
│
└── 03-excel-sheets-and-reports/        # PART 3: Master Excel Workbooks & Automation Suite
    ├── master-sheets/                  # Production Excel sheets (MAINTANENCE SHEET 2026.xlsx)
    ├── automation-scripts/             # Python & PowerShell pipeline scripts
    ├── pdf-reports/                    # Exported monthly PDF audit statements
    └── previews/                       # High-resolution visual snapshots
```
        ├── App.jsx                     # Master state controller, routes, persistence engine (~1,500 lines)
        ├── App.css / index.css         # Styling & fonts
        ├── data/
        │   └── initialData.js          # Master directory of 20 flats & initial months data (October/September)
        ├── pages/
        │   ├── DashboardPage.jsx       # Executive KPI dashboard, quick stats, arrears summary
        │   ├── CollectionsPage.jsx     # Monthly collections grid, payment statuses, quick mark paid
        │   ├── ExpensesPage.jsx        # Monthly expense ledger, categorization, totals
        │   ├── BillsWhatsAppPage.jsx   # Individual bill cards, 1-click WhatsApp message dispatch
        │   ├── VendorLedgerPage.jsx    # Vendor directory, payment records, role & phone management
        │   ├── ResidentsPage.jsx       # Master 20-flat directory (Owner/Tenant, Phone, Base Dues)
        │   ├── SpecialFundsPage.jsx    # Isolated fund drives (e.g. Lift Replacement, Water Project)
        │   ├── ErrorsAuditPage.jsx     # Financial sanity checks, clash detector, change logs
        │   ├── AnnualOverviewPage.jsx  # Multi-month comparison, 12-month summary table
        │   └── ExportPage.jsx          # Excel workbook export, PDF slips, AGM annual report
        ├── components/
        │   ├── Navbar.jsx              # Header with month selector, balance indicators, search
        │   ├── Sidebar.jsx             # Navigation drawer for the 10 core pages
        │   ├── KPICards.jsx            # Monthly KPIs (Collections, Expenses, Net Cash, Defaulters)
        │   ├── FlatsGrid.jsx           # Floor-grouped flats collection table
        │   ├── ExpensesGrid.jsx        # Expense entry table
        │   ├── DefaultersAgingCard.jsx # Aging analysis (30 / 60 / 90+ days overdue)
        │   ├── FinancialClashModal.jsx # Visual audit tool for mismatched cash carry-forwards
        │   ├── StorageVaultModal.jsx   # LocalStorage & IndexedDB backup/restore tool
        │   ├── ResidentLedgerModal.jsx # Per-flat historic ledger statement
        │   ├── AgmAnnualReportView.jsx # AGM-ready formal accounting layout
        │   ├── CircularModal.jsx       # Building notice/circular composer
        │   ├── GlobalSearchModal.jsx   # Ctrl+K / Search across flats, expenses, months
        │   ├── MonthModal.jsx          # Add/Create new month
        │   ├── EditMonthModal.jsx      # Edit active month attributes
        │   ├── LockedFullSheet.jsx     # Read-only locked view for finalized months
        │   ├── LoginPage.jsx           # PIN/Password authentication screen
        │   └── ErrorBoundary.jsx       # Catch and recover from UI exceptions
        └── utils/
            ├── storageVault.js         # Dual-storage persistence (LocalStorage + IndexedDB snapshots)
            ├── clashDetector.js        # Cash flow integrity & chain mismatch detection
            ├── monthUtils.js           # Chronological sorting and month date formatting
            ├── residentUtils.js        # Formatting resident names ("صاحب", "(کرایہ دار)")
            ├── excelExport.js          # High-fidelity Excel workbook generation with ExcelJS
            ├── specialFundExcelExport.js # Excel exporter for special fund campaigns
            ├── imageExport.js          # html-to-image DOM screenshot exporter
            ├── whatsapp.js             # WhatsApp URL generator with formatted Urdu/English messages
            ├── agingUtils.js           # Arrears aging buckets calculation
            ├── dueDateUtils.js         # Due date & grace period utilities
            ├── floorUtils.js           # Floor grouping (Ground, 1st, 2nd, 3rd, 4th, Shop)
            └── translations.js         # Bilingual dictionary (Urdu / English)
```

---

## 4. Building Domain & Data Model

The building contains **20 units** divided into 5 floor levels plus a commercial shop:

| Floor Category | Flat IDs | Typical Due (PKR) | Notes |
|---|---|---|---|
| **Ground Floor** | `G-1`, `G-2`, `G-3` | 3,000 / 2,500 | G-3 is 2,500 |
| **1st Floor** | `F-1`, `F-2`, `F-3`, `F-4` | 3,000 / 2,500 | F-1 & F-4 are 2,500; F-2 & F-3 are 3,000 |
| **2nd Floor** | `S-1`, `S-2`, `S-3`, `S-4` | 3,000 | Standard residential rate |
| **3rd Floor** | `T-1`, `T-2`, `T-3`, `T-4` | 3,000 | Standard residential rate |
| **4th Floor (Penthouse)** | `P-1`, `P-2`, `P-3`, `P-4`| 3,000 | **Notice**: `P-3` is permanently or temporarily closed (`status: 'closed'`, 0 due) |
| **Shop (Ground)** | `Shop` | 500 | Commercial token maintenance |

### Flat Status Values:
* `'paid'`: Full dues cleared.
* `'arrears'`: Has unpaid balance (`due > paid`).
* `'closed'`: Unit is locked/vacant, exempt from regular billing (`due = 0`, `paid = 0`).

### Resident Entity Schema:
```javascript
{
  sno: 14,
  flat: "T-3",
  name: "حافظ سعد صاحب",
  englishName: "Hafiz Saad",
  floor: "3rd Floor",
  due: 3000,
  phone: "03001234567",
  occupantType: "owner",     // "owner" | "tenant"
  includeSahab: true,        // Toggle for "صاحب" suffix
  status: "active"           // "active" | "closed"
}
```

---

## 5. Critical Accounting & Business Rules

### 1. The Chained Balance Rule (`syncAllChainedBalances`)
In this ERP, cash flow follows strict chronological chaining:
$$\text{Closing Balance}_{\text{Month } N} = \text{Opening Balance} (\text{prevSavings}) + \sum \text{Collections} - \sum \text{Expenses}$$
$$\text{Opening Balance}_{\text{Month } N+1} (\text{prevSavings}) \equiv \text{Closing Balance}_{\text{Month } N}$$

* When any collection or expense in an earlier month is edited, `syncAllChainedBalances` cascades the new closing balance forward into all subsequent months automatically.
* The `clashDetector.js` scans for discrepancies between Month $N$'s calculated closing cash and Month $N+1$'s recorded opening balance.

### 2. Dual-Layer Persistence Architecture (`storageVault.js`)
* **Layer 1: LocalStorage** (`almustafa_maint_erp_v3` & backup copy `_backup`): Immediate synchronous write upon any state mutation.
* **Layer 2: IndexedDB**: Asynchronous immutable snapshots with timestamp history to guard against browser cache wipes or accidental storage clearances.
* **Layer 3: JSON Disk Export**: Users can export full backup JSON files and restore them in one click via `StorageVaultModal`.

### 3. Name Normalization Rule (`residentUtils.js`)
* Resident names are standardized across all months and views.
* If `occupantType === 'tenant'`, `(کرایہ دار)` is appended.
* If `includeSahab === true`, `صاحb` is appended.
* Base names are sanitized using `cleanResidentBaseName` to avoid duplicate suffixes like "صاحب صاحب".

### 4. Special Funds Isolation (`SpecialFundsPage.jsx`)
* Large capital expenditures (e.g. Lift Cable Replacement, Building Painting) are **strictly isolated** from routine monthly maintenance.
* Special funds have independent target contributions per flat, their own collection tracking, their own expense list, and separate Excel exports.

---

## 6. How to Run, Test & Develop

### Running the App:
```powershell
# Method 1: Using the provided launcher
.\START_APP.bat

# Method 2: Standard Node.js command
cd app
npm run dev
# App will run at: http://localhost:5173
```

### Production Build & Lint:
```powershell
cd app
npm run build    # Produces optimized static assets in app/dist/
npm run lint     # Runs oxlint
```

---

## 7. Golden Rules for Future Agents

1. **Never Break Balance Chaining**: Always preserve `syncAllChainedBalances` invocation whenever `data.months` is updated or months are reordered/added.
2. **Handle Unit `P-3` and Closed Flats**: `P-3` is marked closed by default. Any flat marked `'closed'` must contribute `0` to monthly totals, expected receivables, and defaulter lists.
3. **Preserve Urdu RTL & Bilingual Support**: Maintenance slips and WhatsApp templates are heavily utilized by committee members in Urdu/Roman Urdu. Maintain proper RTL rendering (`dir="rtl"`) and font classes (`urdu-font`).
4. **LocalStorage Schema Compatibility**: Do not change the root `DATA_STORAGE_KEY = 'almustafa_maint_erp_v3'` without migration logic, or existing user data stored in the browser will be reset to `initialData.js`.
5. **No Direct DOM Mutations for Exports**: Use the established `excelExport.js` and `imageExport.js` helper functions which respect layout styling and formulas.

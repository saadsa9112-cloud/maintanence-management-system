# 🏢 Al Mustafa Heights Building Maintenance Management System
### Modern ERP, Portable Single-File Web App & Automated Accounting Suite

[![React](https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)](#)
[![Location](https://img.shields.io/badge/Building-5--E--18%2F19%20Nazimabad-orange.svg)](#)

---

## 🌟 Overview
Welcome to the official repository for the **Al Mustafa Heights Building Maintenance System** (5-E-18/19, Nazimabad, Karachi). 

This repository consolidates the entire evolution of the building's maintenance infrastructure into **3 organized, independent parts**:

```
maintanence-management-system/
├── 📁 01-web-application/            # Modern React 19 + Vite 8 Enterprise ERP
├── 📁 02-standalone-html-app/        # Zero-dependency portable single-file web app
├── 📁 03-excel-sheets-and-reports/   # Master Excel workbooks, Python pipelines & PDF audits
├── 📄 START_APP.bat                  # 1-Click desktop launcher for Windows
└── 📄 README.md                      # Comprehensive system documentation
```

---

## 📂 The 3 Dedicated Parts

### ⚡ [Part 01: Modern Web Application (`01-web-application`)](./01-web-application)
The flagship enterprise-grade Single-Page Application (SPA) designed for daily management, real-time balance calculations, automated WhatsApp communication, and full financial reconciliation.
- **Technology:** React 19, Vite 8, Tailwind CSS v4, Lucide Icons, ExcelJS, html-to-image.
- **Key Modules:**
  - **Executive Dashboard:** Live KPIs, recovery progress, cash-in-hand, and pending alerts.
  - **Maintenance Register:** Resident billing ledger, automated prior arrears tracking, smart advance credits, and real-time financial clash detection.
  - **Expenses Tracker:** Categorized expense management with opening balance rollover.
  - **Bills & WhatsApp Hub:** Automated WhatsApp broadcast generation (with details or flat-only).
  - **Residents Directory:** Master occupant list with tenant badges and customizable honorifics.
  - **Vendor & Contractor Ledger:** Tracks technicians, plumbers, electricians, and hardware purchases.
  - **Special Sinking Funds:** Dedicated funds for lift overhaul, water tank cleaning, and roof waterproofing.
  - **Data Safety Vault:** Instant JSON/Excel database backup and snapshot recovery.

---

### 🌐 [Part 02: Standalone Single-File Web App (`02-standalone-html-app`)](./02-standalone-html-app)
A completely self-contained, zero-dependency offline web application that runs in any web browser without needing Node.js or a server.
- **Technology:** Vanilla HTML5, CSS3, JavaScript (ES6+).
- **Execution:** Simply double-click `index.html` to run offline.
- **Storage:** Persists records directly in browser `localStorage`.
- **Use Case:** Perfect for quick mobile checks, USB portable usage, or backup emergency access without technical setup.

---

### 📊 [Part 03: Excel Sheets & Automation Suite (`03-excel-sheets-and-reports`)](./03-excel-sheets-and-reports)
The foundational financial workbooks, automated Python/PowerShell reporting scripts, and official generated PDF audit statements.
- **Master Sheets:** Production Excel workbooks (`MAINTANENCE SHEET 2026.xlsx`) with formula-driven cash rollovers.
- **Automation Scripts:** Python scripts using `openpyxl` to build 12-month sheets, inject KPI dashboards, re-format tables, and set portrait page setups.
- **PDF Reports:** Complete historical PDF audit statements and print-ready monthly accounts.

---

## 🚀 Quick Start Guide (Windows)

To start the full React 19 ERP web application on Windows:
1. Double-click **`START_APP.bat`** in the repository root.
2. The script will automatically start the Vite server and open **`http://localhost:5173`** in your default browser.

Alternatively, from the command line:
```bash
cd 01-web-application
npm install
npm run dev
```

---

## 🏛️ Building Profile
- **Building Name:** Al Mustafa Heights
- **Plot Address:** 5-E-18/19, Nazimabad, Karachi
- **Total Residential Units:** 20 Units (G-1 to G-3, F-1 to F-4, S-1 to S-4, T-1 to T-4, P-1 to P-4, and Ground Shop)
- **Maintenance Administrator:** Hafiz Muhammad Saad

---

## 📄 License
Copyright © 2026 Al Mustafa Heights Management Committee. All rights reserved.

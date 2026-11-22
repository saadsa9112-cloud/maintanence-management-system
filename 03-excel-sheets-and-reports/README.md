# 📊 03 - Excel Sheets, Automation Scripts & Reports
### Al Mustafa Heights Building Maintenance Suite (Data & Automation)

---

## 📖 Overview
This folder contains the master Excel financial workbooks, automated Python/PowerShell reporting scripts, and official generated PDF audit statements for **Al Mustafa Heights 5-E-18/19**.

---

## 📁 Directory Structure
```
03-excel-sheets-and-reports/
├── master-sheets/          # Production Excel maintenance spreadsheets
│   ├── MAINTANENCE SHEET 2026.xlsx
│   ├── MAINTANENCE SHEET 2026 (Backup_With_October).xlsx
│   └── MAINTANENCE SHEET SEPTEMBER 2026.xlsx
├── automation-scripts/     # Python & PowerShell pipeline scripts
│   ├── add_kpi_dashboard.py
│   ├── build_generalized_system.py
│   ├── build_october_sheet.py
│   ├── build_separated_summary.py
│   ├── clean_excel_file.py
│   ├── format_sheet.py
│   ├── set_portrait_setup.py
│   ├── export_all_pdf.ps1
│   └── export_pdf.ps1
├── pdf-reports/            # Official exported PDF statements & audit sheets
│   ├── AL MUSTAFA HEIGHTS - COMPLETE REPORT 2026.pdf
│   ├── MAINTENANCE_Overview.pdf
│   ├── MAINTENANCE_JULY.pdf
│   ├── MAINTENANCE_AUGUST.pdf
│   ├── MAINTENANCE_SEPTEMBER.pdf
│   ├── MAINTANENCE SHEET SEPTEMBER 2026.pdf
│   ├── MAINTANENCE SHEET (Summary Below).pdf
│   ├── MAINTANENCE SHEET (Summary Side).pdf
│   ├── MAINTANENCE SHEET (A to H).pdf
│   └── PORTRAIT_TEST_PRINT.pdf
└── previews/               # Screenshot previews & visual sheet inspections
    ├── preview_overview.png
    ├── preview_july.png
    ├── preview_august.png
    ├── preview_september.png
    └── preview_summary_below.png
```

---

## ⚙️ Automation Scripts Guide
All automation scripts use `openpyxl` and `reportlab` to manipulate formulas, cell formatting, Urdu typography, and print pagination:

| Script Name | Purpose |
| :--- | :--- |
| `build_generalized_system.py` | Generates a 12-month automated ledger system linking previous savings to next month's opening balance. |
| `build_october_sheet.py` | Sets up the October maintenance and expenses register with auto-carried arrears. |
| `add_kpi_dashboard.py` | Injects executive KPI summary cards directly into Excel sheets. |
| `build_separated_summary.py` | Generates side-by-side or below-table income vs expense reconciliations. |
| `format_sheet.py` | Applies border styling, header fills, column width auto-fits, and number formatting. |
| `set_portrait_setup.py` | Configures print page setup (A4 Portrait, Fit to 1 page wide, centered). |
| `export_pdf.ps1` | Automated PowerShell script using Excel COM API to export sheets directly to PDF. |

---

## 🧮 Excel Accounting Formula Standard
- **Total Due**: `Due + Prior Arrears`
- **Current Arrears**: `Total Due - Paid`
- **Total Available**: `Previous Savings + Total Collections`
- **Net Closing Savings**: `Total Available - Total Expenses`
- **Cash Handover Formula**: Closing Savings automatically matches the Opening Balance of the subsequent month.

import React, { useRef, useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Printer,
  FileCheck,
  HardDrive,
  Eye,
  Calendar,
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { exportToExcel, exportAllMonthsToExcel } from '../utils/excelExport';
import { sortMonthsChronologically } from '../utils/monthUtils';
import { formatResidentDisplayName } from '../utils/residentUtils';

export default function ExportPage({
  activeMonthKey,
  currentMonthData,
  allData,
  buildingName,
  onRestoreData,
  onSelectMonth,
  t,
  lang,
  onNotify
}) {
  const fileInputRef = useRef(null);
  const [selectedExportMonth, setSelectedExportMonth] = useState(activeMonthKey);

  // Sync state whenever activeMonthKey changes in Navbar or App state
  useEffect(() => {
    if (activeMonthKey) {
      setSelectedExportMonth(activeMonthKey);
    }
  }, [activeMonthKey]);

  const months = allData.months || {};
  const monthOrder = allData.monthOrder || [];
  const sortedMonths = sortMonthsChronologically(monthOrder);

  const targetMonthData = months[selectedExportMonth] || currentMonthData;
  const flats = targetMonthData?.flats || [];
  const expenses = targetMonthData?.expenses || [];

  const totalCollected = flats.reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
  const totalArrears = flats.reduce((acc, f) => acc + (f.status === 'arrears' || (f.status !== 'closed' && Number(f.arrears) > 0) ? Number(f.arrears || 0) : 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const prevSavings = Number(targetMonthData?.prevSavings || 0);
  const closingBalance = totalCollected + prevSavings - totalExpenses;

  // 1. Separate: Export single month excel
  const handleDownloadSingleMonthExcel = async () => {
    try {
      await exportToExcel(selectedExportMonth, targetMonthData, buildingName);
      if (onNotify) onNotify(`Excel exported for ${selectedExportMonth}! 📊`);
    } catch (e) {
      console.error(e);
    }
  };

  // 2. All: Export multi-month master excel workbook
  const handleDownloadAllMonthsExcel = async () => {
    try {
      await exportAllMonthsToExcel(allData.months, allData.monthOrder, buildingName);
      if (onNotify) onNotify(`Complete Master Excel workbook downloaded with all months + overview! 📊`);
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Print dialog
  const handlePrint = () => {
    window.print();
  };

  // 4. Separate: Download single month JSON backup
  const handleSingleMonthBackup = () => {
    const payload = {
      type: 'single_month',
      buildingName,
      monthKey: selectedExportMonth,
      data: targetMonthData,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AlMustafa_${selectedExportMonth}_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (onNotify) onNotify(`Month ${selectedExportMonth} backup downloaded! ✓`);
  };

  // 5. All: Download full database JSON backup
  const handleFullDatabaseBackup = () => {
    const payload = {
      type: 'full_database',
      allData,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AlMustafa_Full_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (onNotify) onNotify('Full building database backup downloaded! ✓');
  };

  // 6. Restore from file
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.type === 'single_month') {
          // Restore single month into allData
          const updated = {
            ...allData,
            months: {
              ...allData.months,
              [parsed.monthKey]: parsed.data
            }
          };
          onRestoreData(updated);
          if (onNotify) onNotify(`Restored month ${parsed.monthKey} successfully! 📂`);
        } else if (parsed.allData) {
          // Restore full database
          onRestoreData(parsed.allData);
          if (onNotify) onNotify('Full database backup restored successfully! 📂');
        } else if (parsed.months) {
          // Raw full data object
          onRestoreData(parsed);
          if (onNotify) onNotify('Full database backup restored successfully! 📂');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Could not parse backup file. Please ensure it is valid JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="erp-card rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-lg sm:text-2xl">
              Export Center & System Backup
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Download individual monthly sheets or complete all-months master workbook (.xlsx), 
            and create separate or full system data backups.
          </p>
        </div>

        {/* Quick Month Filter for single export */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Selected Month:</span>
          <select
            value={selectedExportMonth}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedExportMonth(val);
              if (onSelectMonth) onSelectMonth(val);
            }}
            className="bg-white border border-slate-300 text-xs font-semibold py-1.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
          >
            {sortedMonths.map((m) => (
              <option key={m} value={m}>
                {m} {months[m]?.year || 2026}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. EXCEL EXPORT SECTION: SEPARATE & ALL-IN-ONE MASTER     */}
      {/* ======================================================== */}
      <div className="space-y-3 no-print">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Excel (.xlsx) Export Options</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Separate Single Month Export */}
          <div className="erp-card rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-0.5 rounded border border-emerald-200">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Separate Monthly Sheet</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                Export {selectedExportMonth} 2026 Excel
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Downloads a clean, formatted single-sheet Excel workbook for <strong>{selectedExportMonth} 2026</strong>. 
                Pre-configured with Navy Blue headers, green paid values, red arrears, peach expenses, and 1-page A4 Portrait layout.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 font-mono">
                {selectedExportMonth} • 8 Columns • Portrait A4
              </span>
              <button
                onClick={handleDownloadSingleMonthExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-3.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {selectedExportMonth} (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Card 2: All Months Master Consolidated Workbook */}
          <div className="erp-card rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[11px] font-semibold px-2.5 py-0.5 rounded border border-blue-200">
                <Layers className="w-3.5 h-3.5" />
                <span>All Months Master (مشترکہ ایکسل)</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                Export All-Months Consolidated Excel
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Consolidates <strong>all {monthOrder.length} months ({sortedMonths.join(', ')})</strong> into 
                a single master Excel workbook. Contains the master <strong>Overview (ماہانہ جائزہ)</strong> tab 
                plus individual tabs for each month sorted chronologically!
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 font-mono">
                {sortedMonths.length} Month Tabs + Overview Tab
              </span>
              <button
                onClick={handleDownloadAllMonthsExcel}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-3.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All Months (.xlsx)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PRINT & PDF SECTION                                    */}
      {/* ======================================================== */}
      <div className="space-y-3 no-print">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Printer className="w-4 h-4 text-blue-600" />
          <span>Print & PDF Statements</span>
        </h3>

        <div className="erp-card rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              Official 1-Page A4 Portrait Statement for {selectedExportMonth} 2026
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant browser print dialog pre-configured to lock exactly onto 1 portrait page with no header/footer URL artifacts.
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print {selectedExportMonth} Statement</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. SYSTEM DATA BACKUP & RESTORE: SEPARATE & FULL         */}
      {/* ======================================================== */}
      <div className="space-y-3 no-print">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-purple-600" />
          <span>System Data Backup & Restore (.json)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Single Month Backup */}
          <div className="erp-card rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Single Month Backup</span>
              </div>
              <h5 className="font-bold text-slate-900 text-sm mt-1">
                Backup {selectedExportMonth} Data
              </h5>
              <p className="text-[11px] text-slate-500 mt-1">
                Save a dedicated snapshot of only <strong>{selectedExportMonth} 2026</strong> flat collections and expenses.
              </p>
            </div>

            <button
              onClick={handleSingleMonthBackup}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {selectedExportMonth} JSON</span>
            </button>
          </div>

          {/* Card 2: Full Database Backup */}
          <div className="erp-card rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-700">
                <Database className="w-4 h-4 text-purple-600" />
                <span>Complete Database Backup</span>
              </div>
              <h5 className="font-bold text-slate-900 text-sm mt-1">
                Backup Entire Building System
              </h5>
              <p className="text-[11px] text-slate-500 mt-1">
                Exports complete database including all months, residents directory, financial history, and settings.
              </p>
            </div>

            <button
              onClick={handleFullDatabaseBackup}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Full DB JSON</span>
            </button>
          </div>

          {/* Card 3: Restore Backup */}
          <div className="erp-card rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Restore Backup File</span>
              </div>
              <h5 className="font-bold text-slate-900 text-sm mt-1">
                Upload Backup File
              </h5>
              <p className="text-[11px] text-slate-500 mt-1">
                Upload any single-month or full-database JSON file to restore records.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select File to Restore</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. OFFICIAL PRINTABLE A4 PORTRAIT DOCUMENT               */}
      {/* ======================================================== */}
      <div className="erp-card rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs printable-a4-portrait bg-white">
        {/* Document Header */}
        <div className="text-center pb-4 border-b-2 border-slate-800">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wider uppercase">
            {buildingName}
          </h1>
          <p className="text-xs font-bold text-slate-600 mt-0.5">
            ماہانہ مینٹیننس وصولی و اخراجات رجسٹر (MONTHLY MAINTENANCE STATEMENT)
          </p>
          
          <div className="mt-3 flex items-center justify-between text-xs font-extrabold text-slate-800 border-t border-slate-300 pt-2 px-2">
            <span>تاریخ: <span className="font-mono">{targetMonthData?.dateStr || '3-Oct-2026'}</span></span>
            <span className="text-sm font-black text-blue-900 uppercase">مہینہ: {selectedExportMonth} 2026</span>
            <span>سال: <span className="font-mono">{targetMonthData?.year || 2026}</span></span>
          </div>
        </div>

        {/* 8-Column Table (A to H) */}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-right text-[11px] border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-extrabold text-center border-b-2 border-slate-600">
                <th className="p-1.5 border border-slate-400 w-[24%] text-right">تفصیلات (Notes)</th>
                <th className="p-1.5 border border-slate-400 w-[12%]">اخراجات رقم</th>
                <th className="p-1.5 border border-slate-400 w-[16%] text-right">اخراجات تفصیل</th>
                <th className="p-1.5 border border-slate-400 w-[12%]">مینٹیننس (Paid)</th>
                <th className="p-1.5 border border-slate-400 w-[10%]">بقایا رقم</th>
                <th className="p-1.5 border border-slate-400 w-[14%] text-right">نام (Resident)</th>
                <th className="p-1.5 border border-slate-400 w-[8%]">فلیٹ</th>
                <th className="p-1.5 border border-slate-400 w-[4%]">#</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 20 }).map((_, i) => {
                const flat = flats[i] || null;
                const exp = expenses[i] || null;

                let expDesc = exp ? exp.desc : '';
                let expAmount = exp ? Number(exp.amount) : '';
                let expDetails = exp ? exp.details : '';

                if (i === 15) {
                  expDesc = 'کل اخراجات';
                  expAmount = totalExpenses;
                  expDetails = '';
                } else if (i === 17) {
                  expDesc = 'پچھلی بچت';
                  expAmount = prevSavings;
                  expDetails = '';
                } else if (i === 18) {
                  expDesc = 'کل بچت';
                  expAmount = closingBalance;
                  expDetails = '';
                }

                const isClosed = flat?.status === 'closed';

                return (
                  <tr key={i} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="p-1 border border-slate-300 text-slate-500 font-normal truncate max-w-[140px] text-right">
                      {expDetails}
                    </td>
                    <td className={`p-1 border border-slate-300 text-center font-bold ${i === 15 ? 'bg-amber-100 text-rose-900 font-black' : i === 17 ? 'bg-blue-50 text-blue-900' : i === 18 ? 'bg-emerald-100 text-emerald-900 font-black' : ''}`}>
                      {expAmount ? expAmount.toLocaleString('en-US') : ''}
                    </td>
                    <td className={`p-1 border border-slate-300 text-right ${i === 15 || i === 17 || i === 18 ? 'font-black' : ''}`}>
                      {expDesc}
                    </td>
                    <td className="p-1 border border-slate-300 text-center font-bold text-emerald-800">
                      {isClosed ? 'گھر بند ہے' : (flat && Number(flat.paid) > 0 ? Number(flat.paid).toLocaleString('en-US') : '')}
                    </td>
                    <td className="p-1 border border-slate-300 text-center font-bold text-rose-600">
                      {!isClosed && flat && Number(flat.arrears) > 0 ? Number(flat.arrears).toLocaleString('en-US') : ''}
                    </td>
                    <td className="p-1 border border-slate-300 text-right font-semibold text-slate-800">
                      {formatResidentDisplayName(flat)}
                    </td>
                    <td className="p-1 border border-slate-300 text-center font-black text-slate-900">
                      {flat?.flat || ''}
                    </td>
                    <td className="p-1 border border-slate-300 text-center text-slate-400 font-bold">
                      {i + 1}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-200 text-slate-900 font-extrabold border-t-2 border-slate-700">
                <td colSpan="3" className="p-2 text-center">
                  (Total Reconciled) کُل میزان
                </td>
                <td className="p-2 text-center text-emerald-900 font-black">
                  Rs. {totalCollected.toLocaleString('en-US')}
                </td>
                <td className="p-2 text-center text-rose-900 font-black">
                  Rs. {totalArrears > 0 ? totalArrears.toLocaleString('en-US') : '0'}
                </td>
                <td colSpan="3" className="p-2 text-center text-slate-700">
                  {flats.length} فلیٹس رجسٹرڈ
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

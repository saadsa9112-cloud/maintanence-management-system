import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Calendar,
  TrendingUp,
  Receipt,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Download,
  Printer,
  Lock,
  Unlock,
  Building2,
  CheckCheck,
  Check,
  Layers,
  Sparkles,
  Edit3,
  Award
} from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import { sortMonthsChronologically } from '../utils/monthUtils';
import AgmAnnualReportView from '../components/AgmAnnualReportView';
import { formatResidentDisplayName } from '../utils/residentUtils';

export default function AnnualOverviewPage({
  allMonthsData = {},
  monthOrder = [],
  activeMonthKey,
  onSelectMonth,
  buildingName,
  onNavigate,
  onNotify,
  onOpenEditMonthModal,
  t,
  lang
}) {
  const sortedMonthKeys = useMemo(() => {
    return sortMonthsChronologically(monthOrder && monthOrder.length > 0 ? monthOrder : Object.keys(allMonthsData || {}));
  }, [monthOrder, allMonthsData]);

  // Currently inspected month tab (defaults to activeMonthKey or latest month)
  const [selectedMonth, setSelectedMonth] = useState(activeMonthKey || sortedMonthKeys[sortedMonthKeys.length - 1] || 'OCTOBER');
  // View sub-tab: 'month-register' | 'annual-matrix'
  const [viewSubTab, setViewSubTab] = useState('month-register');

  // Filters & Sorting state
  const [filter, setFilter] = useState('all'); // 'all' | 'paid' | 'arrears' | 'closed'
  const [search, setSearch] = useState('');
  const [floorFilter, setFloorFilter] = useState('all');
  const [sortField, setSortField] = useState('sno'); // 'sno' | 'flat' | 'name' | 'due' | 'paid' | 'arrears' | 'status'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  const currentMonth = allMonthsData[selectedMonth] || {};
  const flats = currentMonth.flats || [];
  const expenses = currentMonth.expenses || [];

  // Month financial aggregates
  const totalDue = flats.reduce((sum, f) => sum + (f.status !== 'closed' ? Number(f.due || 0) : 0), 0);
  const totalPaid = flats.reduce((sum, f) => sum + (f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
  const totalArrears = flats.reduce((sum, f) => sum + (f.status !== 'closed' ? Number(f.arrears || 0) : 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const prevSavings = Number(currentMonth.prevSavings || 0);
  const closingBalance = totalPaid + prevSavings - totalExpenses;

  const paidFlats = flats.filter(f => f.status !== 'closed' && (Number(f.paid) >= Number(f.due) && Number(f.paid) > 0));
  const unpaidFlats = flats.filter(f => f.status !== 'closed' && (Number(f.arrears) > 0 || Number(f.paid) < Number(f.due)));
  const closedFlats = flats.filter(f => f.status === 'closed');
  const collectionPct = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

  // Multi-Month Expense Heads Aggregation
  const allExpenseHeads = useMemo(() => {
    const map = {};
    sortedMonthKeys.forEach(mKey => {
      const expList = allMonthsData[mKey]?.expenses || [];
      expList.forEach(e => {
        const name = (e.desc || '').trim();
        if (!name) return;
        if (!map[name]) {
          map[name] = { name, total: 0, months: {} };
        }
        const amt = Number(e.amount || 0);
        map[name].total += amt;
        map[name].months[mKey] = amt;
      });
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [sortedMonthKeys, allMonthsData]);

  // Sorting Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered and Sorted Flats list
  const processedFlats = useMemo(() => {
    let result = flats.filter(f => {
      if (!f) return false;

      // Status filter
      if (filter === 'paid') {
        if (f.status === 'closed' || Number(f.paid) === 0 || Number(f.paid) < Number(f.due)) return false;
      }
      if (filter === 'arrears') {
        if (f.status === 'closed' || Number(f.arrears) <= 0) return false;
      }
      if (filter === 'closed') {
        if (f.status !== 'closed') return false;
      }

      // Floor filter
      if (floorFilter !== 'all') {
        if (floorFilter === 'Shop' && f.flat !== 'Shop') return false;
        if (floorFilter !== 'Shop' && !f.flat.startsWith(floorFilter)) return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchFlat = (f.flat || '').toLowerCase().includes(q);
        const matchName = (f.name || '').toLowerCase().includes(q);
        if (!matchFlat && !matchName) return false;
      }
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'due' || sortField === 'paid' || sortField === 'arrears' || sortField === 'sno') {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      // String sorting
      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [flats, filter, floorFilter, search, sortField, sortDirection]);

  // Export selected month
  const handleExportSelectedMonth = () => {
    exportToExcel(selectedMonth, currentMonth, buildingName);
    if (onNotify) onNotify(`Excel exported for ${selectedMonth}! 📊`);
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & MONTH SWITCHER RIBBON                     */}
      {/* ======================================================== */}
      <div className="erp-card rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/90 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
                <LineChart className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-slate-900 text-lg sm:text-2xl">
                Master Maintenance Explorer & Ledger
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select any month below to inspect flat-by-flat collections, arrears, payment history, and multi-month comparison.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenEditMonthModal && (
              <button
                onClick={onOpenEditMonthModal}
                className="bg-white hover:bg-slate-50 text-slate-800 font-medium py-2 px-3.5 rounded-lg text-xs transition flex items-center gap-1.5 border border-slate-300 shadow-xs cursor-pointer"
                title="Edit Month Details or Delete Month Sheet"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Edit / Delete Sheet</span>
              </button>
            )}
            <button
              onClick={handleExportSelectedMonth}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-3.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export {selectedMonth} Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-3.5 rounded-lg text-xs transition flex items-center gap-1.5 border border-slate-800 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Statement</span>
            </button>
          </div>
        </div>

        {/* Month Selector Tabs (Interactive Ribbon) */}
        <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            {sortedMonthKeys.map((mKey) => {
              const mData = allMonthsData[mKey] || {};
              const isSelected = selectedMonth === mKey && viewSubTab === 'month-register';
              const mPaid = (mData.flats || []).filter(f => f.status !== 'closed' && (Number(f.paid) >= Number(f.due) && Number(f.paid) > 0)).length;
              const mTotal = (mData.flats || []).filter(f => f.status !== 'closed').length;

              return (
                <button
                  key={mKey}
                  onClick={() => {
                    setSelectedMonth(mKey);
                    setViewSubTab('month-register');
                    if (onSelectMonth) onSelectMonth(mKey);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap cursor-pointer border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{mKey} 2026</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {mPaid}/{mTotal}
                  </span>
                  {mData.finalized && <span title="Statement Finalized & Locked">🔒</span>}
                </button>
              );
            })}

            {/* Multi-Month Matrix Tab */}
            <button
              onClick={() => setViewSubTab('annual-matrix')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap cursor-pointer border ${
                viewSubTab === 'annual-matrix'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All-Months Matrix (پورے سال کا تقابلی جائزہ)</span>
            </button>

            {/* AGM Annual Report Tab */}
            <button
              onClick={() => setViewSubTab('agm-report')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap cursor-pointer border ${
                viewSubTab === 'agm-report'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>📊 AGM Report (سالانہ جنرل میٹنگ رپورٹ)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TAB 1: DETAILED MONTHLY FLAT-BY-FLAT REGISTER         */}
      {/* ======================================================== */}
      {viewSubTab === 'month-register' && (
        <div className="space-y-6">
          {/* Month Financial KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="erp-card rounded-xl p-4 border border-slate-200/90 shadow-xs">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Expected</span>
              <span className="text-base sm:text-lg font-bold font-mono text-slate-800">
                Rs. {totalDue.toLocaleString('en-US')}
              </span>
              <span className="text-[10px] text-slate-400 block">{flats.length - closedFlats.length} active flats</span>
            </div>

            <div className="erp-card rounded-xl p-4 border border-slate-200/90 shadow-xs">
              <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Total Collected ({collectionPct}%)</span>
              <span className="text-base sm:text-lg font-bold font-mono text-emerald-600">
                Rs. {totalPaid.toLocaleString('en-US')}
              </span>
              <span className="text-[10px] text-emerald-600 block">{paidFlats.length} flats cleared</span>
            </div>

            <div className="erp-card rounded-xl p-4 border border-slate-200/90 shadow-xs">
              <span className="text-[10px] text-rose-700 uppercase font-semibold block">Pending Arrears</span>
              <span className="text-base sm:text-lg font-bold font-mono text-rose-600">
                Rs. {totalArrears.toLocaleString('en-US')}
              </span>
              <span className="text-[10px] text-rose-600 block">{unpaidFlats.length} flats due</span>
            </div>

            <div className="erp-card rounded-xl p-4 border border-slate-200/90 shadow-xs">
              <span className="text-[10px] text-amber-700 uppercase font-semibold block">Total Expenses</span>
              <span className="text-base sm:text-lg font-bold font-mono text-rose-600">
                Rs. {totalExpenses.toLocaleString('en-US')}
              </span>
              <span className="text-[10px] text-slate-400 block">{expenses.length} bills paid</span>
            </div>

            <div className="erp-card rounded-xl p-4 border border-slate-200/90 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[10px] text-blue-700 uppercase font-semibold block">Net Closing In-Hand</span>
              <span className={`text-base sm:text-lg font-bold font-mono ${closingBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                Rs. {closingBalance.toLocaleString('en-US')}
              </span>
              <span className="text-[10px] text-slate-400 block">Carry: Rs. {prevSavings.toLocaleString('en-US')}</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="erp-card rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
            {/* Table Control Bar */}
            <div className="bg-slate-900 text-white p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search flat or resident..."
                    className="w-full bg-slate-800 text-white placeholder-slate-400 text-xs py-1.5 px-3 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 font-medium"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute end-2.5 top-2.5" />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center bg-slate-800 p-0.5 rounded-lg text-xs border border-slate-700">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 rounded-md font-semibold transition ${filter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                  >
                    All ({flats.length})
                  </button>
                  <button
                    onClick={() => setFilter('paid')}
                    className={`px-3 py-1 rounded-md font-semibold transition ${filter === 'paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                  >
                    Paid ({paidFlats.length})
                  </button>
                  <button
                    onClick={() => setFilter('arrears')}
                    className={`px-3 py-1 rounded-md font-semibold transition ${filter === 'arrears' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                  >
                    Pending ({unpaidFlats.length})
                  </button>
                  <button
                    onClick={() => setFilter('closed')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${filter === 'closed' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
                  >
                    🔒 Closed ({closedFlats.length})
                  </button>
                </div>
              </div>

              {/* Floor Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-bold">Floor:</span>
                {['all', 'G', 'F', 'S', 'T', 'P', 'Shop'].map(fl => (
                  <button
                    key={fl}
                    onClick={() => setFloorFilter(fl)}
                    className={`px-2 py-0.5 rounded-lg font-bold transition ${
                      floorFilter === fl
                        ? 'bg-white text-slate-900 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {fl === 'all' ? 'All' : fl}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Sorted Table */}
            <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full min-w-[700px] text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="glass-table-head text-slate-800 font-extrabold border-b border-slate-300 text-xs select-none">
                    <th
                      onClick={() => handleSort('sno')}
                      className="p-3 text-center w-12 cursor-pointer hover:bg-slate-200/60"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>#</span>
                        {sortField === 'sno' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('flat')}
                      className="p-3 text-center w-24 cursor-pointer hover:bg-slate-200/60"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Flat No</span>
                        {sortField === 'flat' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('name')}
                      className="p-3 cursor-pointer hover:bg-slate-200/60"
                    >
                      <div className="flex items-center gap-1">
                        <span>Resident Name</span>
                        {sortField === 'name' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('due')}
                      className="p-3 text-center w-28 cursor-pointer hover:bg-slate-200/60"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Monthly Due</span>
                        {sortField === 'due' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('paid')}
                      className="p-3 text-center w-28 cursor-pointer hover:bg-slate-200/60"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Paid</span>
                        {sortField === 'paid' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('arrears')}
                      className="p-3 text-center w-28 cursor-pointer hover:bg-slate-200/60 text-rose-700 font-black"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Arrears (Baqaya)</span>
                        {sortField === 'arrears' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th className="p-3 text-center w-36">
                      Status
                    </th>
                    <th className="p-3 text-center w-28 no-print">
                      Ledger Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200/70 font-medium">
                  {processedFlats.map((flat) => {
                    const isClosed = flat.status === 'closed';
                    const isPaid = !isClosed && Number(flat.paid) >= Number(flat.due) && Number(flat.paid) > 0;
                    const hasArrears = !isClosed && Number(flat.arrears) > 0;

                    return (
                      <tr
                        key={flat.sno}
                        className={`transition hover:bg-white/80 ${
                          isClosed
                            ? 'bg-amber-50/50'
                            : isPaid && !hasArrears
                            ? 'bg-emerald-50/30'
                            : hasArrears
                            ? 'bg-rose-50/40'
                            : 'bg-white/40'
                        }`}
                      >
                        <td className="p-3 text-center font-bold text-slate-400">
                          {flat.sno}
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-black text-slate-900 bg-white/80 px-2 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
                            {flat.flat}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-extrabold text-slate-900">
                            {formatResidentDisplayName(flat)}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">
                          {isClosed ? '-' : `Rs. ${Number(flat.due).toLocaleString('en-US')}`}
                        </td>
                        <td className="p-3 text-center font-black">
                          {isClosed ? (
                            <span className="text-amber-800 text-xs">گھر بند ہے</span>
                          ) : isPaid ? (
                            <span className="text-emerald-700 font-extrabold">Rs. {Number(flat.paid).toLocaleString('en-US')}</span>
                          ) : (
                            <span className="text-slate-400">Rs. {Number(flat.paid || 0).toLocaleString('en-US')}</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-black">
                          {isClosed ? (
                            <span className="text-slate-400">-</span>
                          ) : hasArrears ? (
                            <span className="text-rose-700 font-black bg-rose-100/70 px-2 py-0.5 rounded-lg border border-rose-300/40">
                              Rs. {Number(flat.arrears).toLocaleString('en-US')}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold">0</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {isClosed ? (
                            <span className="inline-block bg-amber-500/20 text-amber-900 border border-amber-400/40 text-xs font-bold px-2.5 py-0.5 rounded-full">
                              🔒 بند گھر (Closed)
                            </span>
                          ) : isPaid && !hasArrears ? (
                            <span className="inline-block bg-emerald-500/20 text-emerald-800 border border-emerald-400/40 text-xs font-black px-2.5 py-0.5 rounded-full">
                              ✓ Fully Paid
                            </span>
                          ) : isPaid && hasArrears ? (
                            <span className="inline-block bg-amber-500/20 text-amber-900 border border-amber-400/40 text-xs font-bold px-2.5 py-0.5 rounded-full">
                              ⚠️ Paid (Rs. {flat.arrears} Bal)
                            </span>
                          ) : (
                            <span className="inline-block bg-rose-500/20 text-rose-800 border border-rose-400/40 text-xs font-bold px-2.5 py-0.5 rounded-full">
                              ⚠️ Unpaid (Pending)
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center no-print">
                          <button
                            onClick={() => {
                              if (onSelectMonth) onSelectMonth(selectedMonth);
                              if (onNavigate) onNavigate('collections');
                            }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>Open MR</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Table Footer Total Summary */}
                <tfoot className="glass-table-head font-black border-t-2 border-slate-300 text-slate-900 text-xs sm:text-sm">
                  <tr>
                    <td colSpan="3" className="p-3 text-center font-black text-blue-950">
                      Total Summary ({selectedMonth} 2026)
                    </td>
                    <td className="p-3 text-center font-bold text-slate-800">
                      Rs. {totalDue.toLocaleString('en-US')}
                    </td>
                    <td className="p-3 text-center font-black text-emerald-800 text-base">
                      Rs. {totalPaid.toLocaleString('en-US')}
                    </td>
                    <td className="p-3 text-center font-black text-rose-700 text-base">
                      Rs. {totalArrears.toLocaleString('en-US')}
                    </td>
                    <td colSpan="2" className="p-3 text-center text-xs text-slate-600">
                      {processedFlats.length} of {flats.length} flats displayed
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-4 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
              <span className="font-medium">Official Ledger Record — {buildingName}</span>
              <span className="font-bold text-slate-800">Maintenance Managed by: <strong className="text-blue-900 font-black">Hafiz Muhammad Saad</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TAB 2: MULTI-MONTH COMPARATIVE MATRIX                  */}
      {/* ======================================================== */}
      {viewSubTab === 'annual-matrix' && (
        <div className="space-y-6">
          {/* Comparative Matrix Card */}
          <div className="erp-card rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    Resident Multi-Month Payment Matrix (تمام رہائشیوں کا تاریخی ریکارڈ)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Side-by-side comparison across all tracked months
                  </p>
                </div>
              </div>
              <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-full font-medium">
                {sortedMonthKeys.length} Active Months
              </span>
            </div>

            <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full min-w-[1000px] text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="glass-table-head text-slate-800 font-extrabold border-b border-slate-300 text-xs">
                    <th className="p-3 text-center w-12">#</th>
                    <th className="p-3 text-center w-24">Flat No</th>
                    <th className="p-3">Resident Name</th>
                    {sortedMonthKeys.map(mKey => (
                      <th key={mKey} className="p-3 text-center font-black">
                        {mKey}
                      </th>
                    ))}
                    <th className="p-3 text-center font-black text-rose-700">
                      Current Arrears
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200/70 font-medium">
                  {Array.from({ length: 20 }).map((_, idx) => {
                    const firstMonthFlats = (allMonthsData[sortedMonthKeys[0]]?.flats) || [];
                    const flatMeta = firstMonthFlats[idx] || {};

                    return (
                      <tr key={idx} className="hover:bg-white/80 transition bg-white/40">
                        <td className="p-3 text-center text-slate-400 font-bold">
                          {idx + 1}
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-black text-slate-900 bg-white/80 px-2 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
                            {flatMeta.flat}
                          </span>
                        </td>
                        <td className="p-3 font-extrabold text-slate-900">
                          {formatResidentDisplayName(flatMeta)}
                        </td>

                        {/* Month columns */}
                        {sortedMonthKeys.map(mKey => {
                          const mFlats = allMonthsData[mKey]?.flats || [];
                          const item = mFlats.find(f => f.flat === flatMeta.flat || f.sno === (idx + 1));
                          if (!item) {
                            return <td key={mKey} className="p-3 text-center text-slate-400">-</td>;
                          }

                          if (item.status === 'closed') {
                            return (
                              <td key={mKey} className="p-3 text-center bg-amber-50/60">
                                <span className="text-[11px] font-bold text-amber-900">🔒 بند</span>
                              </td>
                            );
                          }

                          const isPaid = Number(item.paid) >= Number(item.due) && Number(item.paid) > 0;
                          const hasArr = Number(item.arrears) > 0;

                          return (
                            <td key={mKey} className={`p-3 text-center ${isPaid && !hasArr ? 'bg-emerald-50/40' : hasArr ? 'bg-rose-50/50' : ''}`}>
                              {isPaid && !hasArr ? (
                                <span className="font-black text-emerald-700 text-xs">
                                  ✓ Rs. {Number(item.paid).toLocaleString('en-US')}
                                </span>
                              ) : hasArr ? (
                                <span className="font-black text-rose-600 text-xs">
                                  ⚠️ Rs. {Number(item.arrears).toLocaleString('en-US')}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">Rs. 0</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Current Arrears from active/latest month */}
                        <td className="p-3 text-center font-black text-rose-700">
                          {(() => {
                            const latestItem = (allMonthsData[sortedMonthKeys[sortedMonthKeys.length - 1]]?.flats || []).find(f => f.flat === flatMeta.flat);
                            const arr = Number(latestItem?.arrears || 0);
                            return arr > 0 ? `Rs. ${arr.toLocaleString('en-US')}` : <span className="text-emerald-700 font-bold">Cleared ✓</span>;
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Monthly Overview Table (ماہانہ جائزہ) */}
          <div className="erp-card rounded-2xl p-6 shadow-xs border border-slate-200/90 space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">
              Financial Summary (ماہانہ جائزہ خلاصہ)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-900 text-white font-extrabold text-xs">
                    <th className="p-3 border border-slate-700">مالیاتی تفصیلات (Metrics)</th>
                    {sortedMonthKeys.map(m => (
                      <th key={m} className="p-3 text-center border border-slate-700 font-black">{m} 2026</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  <tr className="bg-emerald-50/60 font-bold text-emerald-950">
                    <td className="p-3 border border-slate-300">💰 کُل وصول شدہ مینٹیننس (Collections)</td>
                    {sortedMonthKeys.map(m => {
                      const data = allMonthsData[m];
                      const val = (data?.flats || []).reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
                      return <td key={m} className="p-3 text-center border border-slate-300 font-black">Rs. {val.toLocaleString('en-US')}</td>;
                    })}
                  </tr>
                  <tr className="bg-rose-50/50 font-bold text-rose-950">
                    <td className="p-3 border border-slate-300">📉 کُل بلڈنگ اخراجات (Expenses)</td>
                    {sortedMonthKeys.map(m => {
                      const data = allMonthsData[m];
                      const val = (data?.expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
                      return <td key={m} className="p-3 text-center border border-slate-300 font-black">Rs. {val.toLocaleString('en-US')}</td>;
                    })}
                  </tr>
                  <tr className="bg-blue-50/60 font-bold text-blue-950">
                    <td className="p-3 border border-slate-300">🏦 حتمی کیش بچت (Closing Cash)</td>
                    {sortedMonthKeys.map(m => {
                      const data = allMonthsData[m];
                      const coll = (data?.flats || []).reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
                      const exp = (data?.expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
                      const prev = Number(data?.prevSavings || 0);
                      const val = coll + prev - exp;
                      return <td key={m} className="p-3 text-center border border-slate-300 font-black">Rs. {val.toLocaleString('en-US')}</td>;
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Detailed Itemized Multi-Month Expense Ledger */}
            <div className="pt-4 border-t border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-base">
                    تفصیلی اخراجات برائے تمام مہینے (Item-by-Item Multi-Month Expense Ledger)
                  </h4>
                  <p className="text-xs text-slate-500">
                    بجلی، جمعدار، موٹر اور ہر مد میں ہونے والے اخراجات کا تمام مہینوں میں موازنہ
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
                  {allExpenseHeads.length} Expense Heads
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-300 rounded-2xl">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead className="bg-slate-900 text-white font-extrabold text-xs">
                    <tr>
                      <th className="p-3 border border-slate-700 min-w-[180px]">خرچے کا نام (Expense Head)</th>
                      {sortedMonthKeys.map(m => (
                        <th key={m} className="p-3 text-center border border-slate-700 font-black min-w-[110px]">
                          {m} 2026
                        </th>
                      ))}
                      <th className="p-3 text-center border border-slate-700 font-black min-w-[120px] bg-blue-950">
                        کُل خرچ (Total)
                      </th>
                      <th className="p-3 text-center border border-slate-700 font-black min-w-[110px] bg-indigo-950">
                        ماہانہ اوسط (Avg)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {allExpenseHeads.map((head, idx) => (
                      <tr key={head.name} className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50/50' : 'bg-slate-50/60 hover:bg-blue-50/50'}>
                        <td className="p-2.5 border border-slate-300 font-black text-slate-900">
                          {head.name}
                        </td>
                        {sortedMonthKeys.map(m => {
                          const val = head.months[m] || 0;
                          return (
                            <td key={m} className={`p-2.5 text-center border border-slate-300 font-mono text-xs ${
                              val > 0 ? 'font-black text-slate-900' : 'text-slate-300'
                            }`}>
                              {val > 0 ? `Rs. ${val.toLocaleString('en-US')}` : '—'}
                            </td>
                          );
                        })}
                        <td className="p-2.5 text-center border border-slate-300 font-mono font-black text-blue-900 bg-blue-50/60 text-xs sm:text-sm">
                          Rs. {head.total.toLocaleString('en-US')}
                        </td>
                        <td className="p-2.5 text-center border border-slate-300 font-mono font-bold text-indigo-900 bg-indigo-50/40 text-xs">
                          Rs. {Math.round(head.total / sortedMonthKeys.length).toLocaleString('en-US')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white font-black text-xs sm:text-sm border-t-2 border-slate-700">
                    <tr>
                      <td className="p-3 border border-slate-700">
                        کُل بلڈنگ اخراجات (Grand Total Expenses)
                      </td>
                      {sortedMonthKeys.map(m => {
                        const val = (allMonthsData[m]?.expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
                        return (
                          <td key={m} className="p-3 text-center border border-slate-700 font-mono font-black text-emerald-300">
                            Rs. {val.toLocaleString('en-US')}
                          </td>
                        );
                      })}
                      <td className="p-3 text-center border border-slate-700 font-mono font-black text-amber-300 bg-blue-950">
                        Rs. {allExpenseHeads.reduce((acc, h) => acc + h.total, 0).toLocaleString('en-US')}
                      </td>
                      <td className="p-3 text-center border border-slate-700 font-mono font-bold text-indigo-200 bg-indigo-950">
                        Rs. {Math.round(allExpenseHeads.reduce((acc, h) => acc + h.total, 0) / sortedMonthKeys.length).toLocaleString('en-US')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
              <span className="font-medium">Official Ledger Record — {buildingName}</span>
              <span className="font-bold text-slate-800">Maintenance Managed by: <strong className="text-blue-900 font-black">Hafiz Muhammad Saad</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TAB 3: AGM ANNUAL EXECUTIVE FINANCIAL REPORT          */}
      {/* ======================================================== */}
      {viewSubTab === 'agm-report' && (
        <AgmAnnualReportView
          allMonthsData={allMonthsData}
          monthOrder={monthOrder}
          buildingName={buildingName}
          lang={lang}
          onNotify={onNotify}
        />
      )}
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import {
  X,
  Zap,
  Receipt,
  TrendingDown,
  TrendingUp,
  Calendar,
  Layers,
  ArrowRight,
  Search,
  Filter,
  Printer,
  Sparkles,
  BarChart3,
  Table as TableIcon,
  CheckCircle2,
  Building2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { sortMonthsChronologically } from '../utils/monthUtils';

export default function MultiMonthExpensesModal({
  isOpen,
  onClose,
  allMonthsData = {},
  monthOrder = [],
  initialExpenseName = '',
  onSelectMonth,
  buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19',
  lang = 'en'
}) {
  const sortedMonthKeys = useMemo(() => {
    return sortMonthsChronologically(monthOrder && monthOrder.length > 0 ? monthOrder : Object.keys(allMonthsData || {}));
  }, [monthOrder, allMonthsData]);

  // Aggregate all unique expense heads across all chronological months
  const expenseHeadsMap = useMemo(() => {
    const map = {};
    sortedMonthKeys.forEach(mKey => {
      const mData = allMonthsData[mKey] || {};
      const expList = mData.expenses || [];
      expList.forEach(e => {
        const name = (e.desc || '').trim();
        if (!name) return;
        if (!map[name]) {
          map[name] = {
            name,
            total: 0,
            monthsPresentCount: 0,
            months: {}
          };
        }
        const amt = Number(e.amount || 0);
        map[name].total += amt;
        if (amt > 0) map[name].monthsPresentCount += 1;
        map[name].months[mKey] = {
          amount: amt,
          details: e.details || '',
          id: e.id
        };
      });
    });
    return map;
  }, [sortedMonthKeys, allMonthsData]);

  // All expense heads sorted by total money spent (highest to lowest)
  const sortedHeads = useMemo(() => {
    return Object.values(expenseHeadsMap).sort((a, b) => b.total - a.total);
  }, [expenseHeadsMap]);

  // Default selected head: initialExpenseName if valid, or the biggest expense (like بجلی کا بل)
  const defaultHead = useMemo(() => {
    if (initialExpenseName && expenseHeadsMap[initialExpenseName]) {
      return initialExpenseName;
    }
    const electricityMatch = sortedHeads.find(h => h.name.includes('بجلی') || h.name.toLowerCase().includes('bill') || h.name.toLowerCase().includes('electric'));
    if (electricityMatch) return electricityMatch.name;
    return sortedHeads[0]?.name || '';
  }, [initialExpenseName, expenseHeadsMap, sortedHeads]);

  const [selectedHead, setSelectedHead] = useState(defaultHead);
  // Synchronize when initialExpenseName changes
  React.useEffect(() => {
    if (initialExpenseName && expenseHeadsMap[initialExpenseName]) {
      setSelectedHead(initialExpenseName);
    } else if (defaultHead && !selectedHead) {
      setSelectedHead(defaultHead);
    }
  }, [initialExpenseName, defaultHead, expenseHeadsMap]);

  // View mode: 'single' (deep dive into 1 utility/bill) | 'matrix' (master comparison table)
  const [viewMode, setViewMode] = useState('single');
  const [searchMatrix, setSearchMatrix] = useState('');

  if (!isOpen) return null;

  const currentHeadData = expenseHeadsMap[selectedHead] || { name: selectedHead, total: 0, months: {} };

  // Calculate stats for current selected head
  const monthDataList = sortedMonthKeys.map(mKey => {
    const mData = allMonthsData[mKey] || {};
    const monthExpenses = mData.expenses || [];
    const monthTotalExpenses = monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const entry = currentHeadData.months[mKey] || { amount: 0, details: '' };
    const amt = Number(entry.amount || 0);
    const pctOfMonth = monthTotalExpenses > 0 ? Math.round((amt / monthTotalExpenses) * 100) : 0;
    return {
      monthKey: mKey,
      monthName: mData.name || mKey,
      urduName: mData.urduName || '',
      dateStr: mData.dateStr || '',
      amount: amt,
      details: entry.details || '',
      pctOfMonth,
      monthTotalExpenses
    };
  });

  const nonZeroMonths = monthDataList.filter(m => m.amount > 0);
  const totalSpent = currentHeadData.total || 0;
  const avgSpent = nonZeroMonths.length > 0 ? Math.round(totalSpent / nonZeroMonths.length) : 0;
  const maxEntry = nonZeroMonths.length > 0 ? [...nonZeroMonths].sort((a, b) => b.amount - a.amount)[0] : null;
  const minEntry = nonZeroMonths.length > 0 ? [...nonZeroMonths].sort((a, b) => a.amount - b.amount)[0] : null;

  // Max value for bar chart height scaling
  const maxChartVal = maxEntry ? maxEntry.amount : 1;

  // Filtered matrix rows
  const filteredMatrixHeads = sortedHeads.filter(h => {
    if (!searchMatrix.trim()) return true;
    return h.name.toLowerCase().includes(searchMatrix.toLowerCase().trim());
  });

  // Master monthly totals across all expenses
  const monthlyGrandTotals = sortedMonthKeys.map(mKey => {
    const mData = allMonthsData[mKey] || {};
    return (mData.expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  });
  const allTimeGrandTotal = monthlyGrandTotals.reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-fade-in no-print-overlay overflow-y-auto">
      <div className="backdrop-blur-2xl bg-white/95 rounded-2xl sm:rounded-3xl border border-white/80 shadow-[0_25px_60px_rgba(0,0,0,0.3)] max-w-5xl w-full max-h-[92vh] flex flex-col text-slate-900 overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200/80 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight truncate">
                  {lang === 'ur'
                    ? 'تمام مہینوں کے اخراجات کا تقابلی ریکارڈ (All Months Expense Tracker)'
                    : lang === 'roman'
                    ? 'Tamam Mahino Ka Expense Record & Trend'
                    : 'Multi-Month Building Expenses & Bill Comparison'}
                </h3>
                <span className="hidden sm:inline-block bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-200">
                  {sortedMonthKeys.length} Months Linked
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {buildingName} — بجلی، جمعدار، موٹر، اور بلڈنگ کے تمام اخراجات کا تاریخی تجزیہ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold border border-slate-200">
              <button
                onClick={() => setViewMode('single')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'single'
                    ? 'bg-blue-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>واحد خرچ (Single Bill)</span>
              </button>
              <button
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-blue-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>تمام اخراجات ٹیبل (All Matrix)</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* ======================================================== */}
          {/* VIEW MODE 1: SINGLE EXPENSE HEAD DRILLDOWN & TREND       */}
          {/* ======================================================== */}
          {viewMode === 'single' && (
            <div className="space-y-6">
              
              {/* Quick Category Chips Selector */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  خرچہ منتخب کریں (Select Expense Head to Compare):
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {sortedHeads.map((head) => {
                    const isSelected = head.name === selectedHead;
                    const isElectricity = head.name.includes('بجلی') || head.name.toLowerCase().includes('electric');
                    return (
                      <button
                        key={head.name}
                        onClick={() => setSelectedHead(head.name)}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 border cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md font-black scale-102 ring-2 ring-blue-500/40'
                            : 'bg-slate-50 hover:bg-white text-slate-700 border-slate-200/90 shadow-2xs'
                        }`}
                      >
                        {isElectricity ? (
                          <Zap className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-blue-600'}`} />
                        ) : (
                          <Receipt className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-300' : 'text-slate-500'}`} />
                        )}
                        <span className="font-extrabold">{head.name}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                        }`}>
                          Rs. {head.total.toLocaleString('en-US')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* KPI Summary Cards for Selected Expense */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/80 to-white shadow-xs">
                  <span className="text-[11px] font-bold text-blue-700 block">
                    کُل رقم (Total All Months)
                  </span>
                  <span className="text-base sm:text-xl font-black text-blue-950 mt-1 block font-mono">
                    Rs. {totalSpent.toLocaleString('en-US')}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Across {nonZeroMonths.length} active months
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/80 to-white shadow-xs">
                  <span className="text-[11px] font-bold text-indigo-700 block">
                    ماہانہ اوسط (Monthly Average)
                  </span>
                  <span className="text-base sm:text-xl font-black text-indigo-950 mt-1 block font-mono">
                    Rs. {avgSpent.toLocaleString('en-US')}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Per active billing cycle
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50/80 to-white shadow-xs">
                  <span className="text-[11px] font-bold text-rose-700 block flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-rose-600" />
                    <span>سب سے زیادہ بل (Highest)</span>
                  </span>
                  <span className="text-base sm:text-xl font-black text-rose-950 mt-1 block font-mono">
                    Rs. {maxEntry ? maxEntry.amount.toLocaleString('en-US') : 0}
                  </span>
                  <span className="text-[10px] text-rose-600 font-bold mt-0.5 block truncate">
                    {maxEntry ? maxEntry.monthName : '—'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 to-white shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-700 block flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-emerald-600" />
                    <span>سب سے کم بل (Lowest)</span>
                  </span>
                  <span className="text-base sm:text-xl font-black text-emerald-950 mt-1 block font-mono">
                    Rs. {minEntry ? minEntry.amount.toLocaleString('en-US') : 0}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block truncate">
                    {minEntry ? minEntry.monthName : '—'}
                  </span>
                </div>
              </div>

              {/* Visual Multi-Month Bar Comparison Chart */}
              <div className="p-5 rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50/60 to-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <h4 className="font-black text-sm text-slate-900">
                      ماہانہ تقابلی چارٹ (Month-by-Month Trend Bar Visualizer)
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {selectedHead}
                  </span>
                </div>

                {/* SVG/CSS Interactive Bars */}
                <div className="pt-6 pb-2 px-2">
                  <div className="grid gap-2 sm:gap-4 items-end h-44 sm:h-52 border-b border-slate-300 pb-2" style={{
                    gridTemplateColumns: `repeat(${monthDataList.length}, minmax(0, 1fr))`
                  }}>
                    {monthDataList.map((m, idx) => {
                      const heightPct = maxChartVal > 0 ? Math.max(10, Math.round((m.amount / maxChartVal) * 100)) : 10;
                      const isMax = maxEntry && m.monthKey === maxEntry.monthKey && m.amount > 0;
                      const isMin = minEntry && m.monthKey === minEntry.monthKey && m.amount > 0;
                      const prevMonth = idx > 0 ? monthDataList[idx - 1] : null;
                      const diff = prevMonth && prevMonth.amount > 0 ? m.amount - prevMonth.amount : null;

                      return (
                        <div key={m.monthKey} className="flex flex-col items-center h-full justify-end group relative">
                          {/* Amount floating badge */}
                          <div className="mb-2 text-center transition group-hover:scale-110">
                            <span className="font-mono font-black text-[11px] sm:text-xs text-slate-900 bg-white/90 border border-slate-200 px-1.5 py-0.5 rounded-lg shadow-2xs block">
                              Rs. {m.amount.toLocaleString('en-US')}
                            </span>
                            {diff !== null && (
                              <span className={`text-[9px] font-bold block ${diff > 0 ? 'text-rose-600' : diff < 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                                {diff > 0 ? `+${diff.toLocaleString('en-US')}` : diff < 0 ? diff.toLocaleString('en-US') : '='}
                              </span>
                            )}
                          </div>

                          {/* Bar Element */}
                          <div
                            style={{ height: `${m.amount > 0 ? heightPct : 6}%` }}
                            className={`w-full max-w-[48px] rounded-t-xl transition-all duration-500 shadow-sm relative cursor-pointer ${
                              m.amount === 0
                                ? 'bg-slate-200 border border-dashed border-slate-300'
                                : isMax
                                ? 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-rose-500/25'
                                : isMin
                                ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-emerald-500/25'
                                : 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-blue-500/25'
                            } group-hover:brightness-110`}
                            title={`${m.monthName}: Rs. ${m.amount.toLocaleString('en-US')}`}
                          >
                            {/* Inner shine */}
                            <div className="absolute inset-x-0 top-0 h-1 bg-white/40 rounded-t-xl" />
                          </div>

                          {/* Month Bottom Label */}
                          <span className="mt-2 text-[10px] sm:text-xs font-black text-slate-700 truncate text-center w-full">
                            {m.monthKey}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-bold text-rose-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Highest Month
                    </span>
                    <span className="flex items-center gap-1 font-bold text-emerald-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Lowest Month
                    </span>
                    <span className="flex items-center gap-1 font-bold text-blue-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      Standard Months
                    </span>
                  </div>
                  <span className="font-semibold text-slate-400">
                    Live chronological comparison
                  </span>
                </div>
              </div>

              {/* Month-by-Month Detailed Log Table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-slate-900 text-white p-3 sm:px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <h4 className="font-black text-xs sm:text-sm">
                      ماہ بہ ماہ تفصیلی اندراج (Chronological History Table)
                    </h4>
                  </div>
                  <span className="text-xs text-blue-300 font-bold">
                    {selectedHead} — Total: Rs. {totalSpent.toLocaleString('en-US')}
                  </span>
                </div>

                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead className="bg-slate-100/90 text-slate-700 border-b border-slate-200 text-xs font-black uppercase">
                    <tr>
                      <th className="p-3 border-r border-slate-200/80">مہینہ (Month Cycle)</th>
                      <th className="p-3 text-center border-r border-slate-200/80">تاریخ (Date)</th>
                      <th className="p-3 text-center border-r border-slate-200/80 font-black">رقم (Amount PKR)</th>
                      <th className="p-3 text-center border-r border-slate-200/80">سابقہ مہینے سے فرق (Trend)</th>
                      <th className="p-3 text-center border-r border-slate-200/80">ماہانہ خرچے کا فیصد (% Share)</th>
                      <th className="p-3 border-r border-slate-200/80 min-w-[140px]">تفصیل / نوٹس (Notes)</th>
                      <th className="p-3 text-center w-28 no-print">ایکشن (Action)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {monthDataList.map((m, idx) => {
                      const prevMonth = idx > 0 ? monthDataList[idx - 1] : null;
                      const diff = prevMonth && prevMonth.amount > 0 && m.amount > 0 ? m.amount - prevMonth.amount : null;
                      const diffPct = diff !== null && prevMonth.amount > 0 ? Math.round((diff / prevMonth.amount) * 100) : 0;

                      return (
                        <tr key={m.monthKey} className="hover:bg-blue-50/40 transition">
                          <td className="p-3 font-black text-slate-900 border-r border-slate-200">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                              <span>{m.monthName}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center font-mono text-slate-600 border-r border-slate-200 text-xs">
                            {m.dateStr || '—'}
                          </td>
                          <td className="p-3 text-center border-r border-slate-200 font-mono font-black text-slate-950 text-sm">
                            {m.amount > 0 ? `Rs. ${m.amount.toLocaleString('en-US')}` : <span className="text-slate-400">0</span>}
                          </td>
                          <td className="p-3 text-center border-r border-slate-200 text-xs">
                            {diff === null ? (
                              <span className="text-slate-400">Baseline</span>
                            ) : diff > 0 ? (
                              <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                ↗ +Rs. {diff.toLocaleString('en-US')} (+{diffPct}%)
                              </span>
                            ) : diff < 0 ? (
                              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                ↘ -Rs. {Math.abs(diff).toLocaleString('en-US')} ({diffPct}%)
                              </span>
                            ) : (
                              <span className="font-bold text-slate-500">
                                = Same
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center border-r border-slate-200 text-xs font-bold text-slate-700">
                            {m.amount > 0 ? `${m.pctOfMonth}% of month` : '0%'}
                          </td>
                          <td className="p-3 border-r border-slate-200 text-slate-600 text-xs">
                            {m.details ? (
                              <span className="font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                                {m.details}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">کوئی نوٹس درج نہیں</span>
                            )}
                          </td>
                          <td className="p-3 text-center no-print">
                            {onSelectMonth && (
                              <button
                                onClick={() => {
                                  onSelectMonth(m.monthKey);
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
                                title="اس مہینے کے پیج پر جائیں"
                              >
                                <span>Go to Month</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 text-slate-900 text-xs sm:text-sm">
                    <tr>
                      <td colSpan="2" className="p-3 text-center text-blue-950 font-black">
                        Total {selectedHead} Across All Months
                      </td>
                      <td className="p-3 text-center font-mono font-black text-blue-950 text-base border-r border-slate-300">
                        Rs. {totalSpent.toLocaleString('en-US')}
                      </td>
                      <td colSpan="4" className="p-3 text-slate-600 text-xs">
                        Average Monthly Expense: <strong>Rs. {avgSpent.toLocaleString('en-US')}</strong> ({nonZeroMonths.length} active billing cycles)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW MODE 2: MASTER ALL-EXPENSES COMPARISON MATRIX       */}
          {/* ======================================================== */}
          {viewMode === 'matrix' && (
            <div className="space-y-4">
              
              {/* Matrix Search & Info Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={searchMatrix}
                    onChange={(e) => setSearchMatrix(e.target.value)}
                    placeholder="خرچہ تلاش کریں (e.g. بجلی, بلب, جمعدار)..."
                    className="w-full bg-white text-slate-900 text-xs py-2 ps-8 pe-3 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 font-medium"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute start-2.5 top-2.5" />
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2">
                  <span>Showing <strong>{filteredMatrixHeads.length}</strong> expense heads across <strong>{sortedMonthKeys.length}</strong> months</span>
                </div>
              </div>

              {/* Master Matrix Table */}
              <div className="rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead className="bg-slate-900 text-white font-black text-xs uppercase tracking-wide">
                    <tr>
                      <th className="p-3 border-r border-slate-700 min-w-[180px]">خرچے کا نام (Expense Head)</th>
                      {sortedMonthKeys.map(mKey => (
                        <th key={mKey} className="p-3 text-center border-r border-slate-700 min-w-[110px] font-black">
                          {mKey} 2026
                        </th>
                      ))}
                      <th className="p-3 text-center border-r border-slate-700 min-w-[120px] font-black bg-blue-950">
                        کُل خرچ (Total)
                      </th>
                      <th className="p-3 text-center border-r border-slate-700 min-w-[110px] font-black bg-indigo-950">
                        ماہانہ اوسط (Avg)
                      </th>
                      <th className="p-3 text-center min-w-[80px] bg-slate-950">
                        حصہ (% Share)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredMatrixHeads.map((head, idx) => {
                      const sharePct = allTimeGrandTotal > 0 ? Math.round((head.total / allTimeGrandTotal) * 100) : 0;
                      const isElectricity = head.name.includes('بجلی') || head.name.toLowerCase().includes('electric');

                      return (
                        <tr
                          key={head.name}
                          onClick={() => {
                            setSelectedHead(head.name);
                            setViewMode('single');
                          }}
                          className={`hover:bg-blue-50/60 transition cursor-pointer ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                          }`}
                          title="Click to view detailed trend for this expense"
                        >
                          <td className="p-3 font-extrabold text-slate-900 border-r border-slate-200 flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2">
                              {isElectricity ? (
                                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              ) : (
                                <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span>{head.name}</span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                          </td>

                          {/* Each Month Cell */}
                          {sortedMonthKeys.map(mKey => {
                            const val = head.months[mKey]?.amount || 0;
                            return (
                              <td
                                key={mKey}
                                className={`p-3 text-center border-r border-slate-200 font-mono text-xs ${
                                  val > 0 ? 'font-black text-slate-900' : 'text-slate-300'
                                }`}
                              >
                                {val > 0 ? `Rs. ${val.toLocaleString('en-US')}` : '—'}
                              </td>
                            );
                          })}

                          {/* Row Total */}
                          <td className="p-3 text-center border-r border-slate-200 font-mono font-black text-blue-900 bg-blue-50/50 text-xs sm:text-sm">
                            Rs. {head.total.toLocaleString('en-US')}
                          </td>

                          {/* Row Avg */}
                          <td className="p-3 text-center border-r border-slate-200 font-mono font-bold text-indigo-900 bg-indigo-50/30 text-xs">
                            Rs. {Math.round(head.total / sortedMonthKeys.length).toLocaleString('en-US')}
                          </td>

                          {/* Share % */}
                          <td className="p-3 text-center font-bold text-slate-700 text-xs">
                            {sharePct}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Grand Monthly Totals Footer Row */}
                  <tfoot className="bg-slate-900 text-white font-black text-xs sm:text-sm border-t-2 border-slate-700">
                    <tr>
                      <td className="p-3 border-r border-slate-700">
                        کُل ماہانہ اخراجات (Monthly Totals)
                      </td>
                      {sortedMonthKeys.map((mKey, idx) => (
                        <td key={mKey} className="p-3 text-center font-mono font-black text-emerald-300 border-r border-slate-700">
                          Rs. {monthlyGrandTotals[idx].toLocaleString('en-US')}
                        </td>
                      ))}
                      <td className="p-3 text-center font-mono font-black text-amber-300 bg-blue-950 border-r border-slate-700">
                        Rs. {allTimeGrandTotal.toLocaleString('en-US')}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-indigo-200 bg-indigo-950 border-r border-slate-700">
                        Rs. {Math.round(allTimeGrandTotal / sortedMonthKeys.length).toLocaleString('en-US')}
                      </td>
                      <td className="p-3 text-center text-slate-300">
                        100%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:px-6 border-t border-slate-200/80 bg-slate-50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Al Mustafa Heights Maintenance System</span>
            <span className="text-slate-400">•</span>
            <span>Historical Multi-Month Utility & Expense Intelligence</span>
          </div>
          <div className="font-bold text-slate-800">
            Maintenance Managed by: <strong className="text-blue-900 font-black">Hafiz Muhammad Saad</strong>
          </div>
        </div>

      </div>
    </div>
  );
}

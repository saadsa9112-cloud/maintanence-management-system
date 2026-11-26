import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Receipt,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Users,
  Building2,
  Calendar,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Layers,
  Sparkles,
  PhoneCall,
  Clock,
  Check,
  ChevronRight,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  Zap,
  ShieldAlert,
  Edit3
} from 'lucide-react';
import {
  openGroupWhatsApp,
  openPaidGroupWhatsApp,
  buildShortGroupWhatsAppMessage,
  buildPaidGroupWhatsAppMessage
} from '../utils/whatsapp';
import FloorWiseAnalyticsModal from '../components/FloorWiseAnalyticsModal';
import { sortMonthsChronologically } from '../utils/monthUtils';
import { scanAllSystemClashes } from '../utils/clashDetector';
import MultiMonthExpensesModal from '../components/MultiMonthExpensesModal';
import DefaultersAgingCard from '../components/DefaultersAgingCard';
import FinancialClashModal from '../components/FinancialClashModal';

export default function DashboardPage({
  currentMonthData,
  activeMonthKey,
  allMonthsData = {},
  monthOrder = [],
  onNavigate,
  buildingName,
  t,
  lang,
  onNotify,
  onSelectMonth,
  onOpenEditMonthModal,
  onUpdateFlats,
  onUpdatePrevSavings,
  onSyncChainBalances,
  onRecordAuditEntry,
  onRecordDefaulterNotice
}) {
  const [broadcastMode, setBroadcastMode] = useState('unpaid'); // 'unpaid' | 'paid'
  const [chartMetric, setChartMetric] = useState('all'); // 'all' | 'collections' | 'expenses' | 'net'
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isClashModalOpen, setIsClashModalOpen] = useState(false);
  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [selectedExpenseForModal, setSelectedExpenseForModal] = useState('بجلی کا بل');

  const sortedMonthKeys = useMemo(() => {
    return sortMonthsChronologically(
      monthOrder && monthOrder.length > 0 ? monthOrder : Object.keys(allMonthsData || {})
    );
  }, [monthOrder, allMonthsData]);

  const flats = currentMonthData?.flats || [];
  const expenses = currentMonthData?.expenses || [];

  const totalCollected = flats.reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
  const totalArrears = flats.reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.arrears || 0) : 0), 0);
  const totalExpected = flats.reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.due || 0) : 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const prevSavings = Number(currentMonthData?.prevSavings || 0);
  const closingBalance = totalCollected + prevSavings - totalExpenses;

  const paidFlats = flats.filter(f => f.status !== 'closed' && (Number(f.paid) >= Number(f.due) || (f.status === 'paid' && Number(f.paid) > 0)));
  const unpaidFlats = flats.filter(f => f.status !== 'closed' && (Number(f.arrears) > 0 || Number(f.paid) < Number(f.due)));
  const closedFlats = flats.filter(f => f.status === 'closed');
  const activeCount = flats.length - closedFlats.length;
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  const monthName = currentMonthData?.name || activeMonthKey;

  // Real-time Financial Clash Detector (Zero Silent Auto-Correction)
  const clashesReport = useMemo(() => {
    return scanAllSystemClashes({
      currentMonthData,
      activeMonthKey,
      allMonthsData,
      monthOrder
    });
  }, [currentMonthData, activeMonthKey, allMonthsData, monthOrder]);

  // Direct Resolution Handlers for Dashboard
  const handleResolveFlatClash = (flatSno, field, recommendedValue) => {
    if (!onUpdateFlats) {
      onNavigate('collections');
      return;
    }
    const flats = currentMonthData?.flats || [];
    const originalIndex = flats.findIndex(f => f.sno === flatSno);
    if (originalIndex === -1) return;
    const updated = [...flats];
    const oldVal = updated[originalIndex][field];
    const item = { ...updated[originalIndex], [field]: recommendedValue };
    if (field === 'arrears') {
      item.status = recommendedValue > 0 ? 'arrears' : 'paid';
    }
    updated[originalIndex] = item;
    onUpdateFlats(updated);

    if (onRecordAuditEntry) {
      const currentMonthIdx = sortedMonthKeys.indexOf(activeMonthKey);
      const prevMonthKey = currentMonthIdx > 0 ? sortedMonthKeys[currentMonthIdx - 1] : null;
      const prevMonthData = prevMonthKey ? allMonthsData[prevMonthKey] : null;
      const prevMonthFlat = prevMonthData?.flats?.find(pf => pf.flat === item.flat || pf.sno === item.sno) || null;
      const matched = clashesReport.flatClashes?.find(c => c.sno === flatSno);

      onRecordAuditEntry({
        actionType: 'value_fix',
        field,
        flat: item.flat,
        sno: item.sno,
        name: item.name,
        monthKey: activeMonthKey,
        monthName: currentMonthData?.name || activeMonthKey,
        oldValue: oldVal,
        resolvedValue: recommendedValue,
        expected: matched?.expected,
        actual: oldVal,
        diff: matched?.diff,
        clashTitle: matched?.title || `${field} liability clash fixed`,
        resolutionNote: `User action from dashboard: ${field} set to Rs. ${recommendedValue.toLocaleString('en-US')}`,
        status: 'fixed'
      });
    }

    if (onNotify) onNotify(`Flat ${item.flat} (${field}) updated to Rs. ${recommendedValue.toLocaleString('en-US')}! ✓`);
  };

  const handleResolveChainClash = (targetMonthKey, recommendedValue) => {
    if (typeof onUpdatePrevSavings === 'function') {
      onUpdatePrevSavings(recommendedValue, targetMonthKey);
    } else if (typeof onSyncChainBalances === 'function') {
      onSyncChainBalances();
    }

    if (onRecordAuditEntry) {
      onRecordAuditEntry({
        actionType: 'chain_fix',
        field: 'prevSavings',
        flat: 'CHAIN',
        name: 'Opening Balance (سابقہ بچت)',
        monthKey: targetMonthKey,
        monthName: targetMonthKey,
        resolvedValue: recommendedValue,
        clashTitle: 'Opening Balance Continuity Synced',
        resolutionNote: `Month ${targetMonthKey} opening balance set to Rs. ${recommendedValue.toLocaleString('en-US')}`,
        status: 'fixed'
      });
    }

    if (onNotify) onNotify(`Month ${targetMonthKey} opening bachat updated to Rs. ${recommendedValue.toLocaleString('en-US')}! ✓`);
  };

  // Explicit user-driven saving of adjustment note for a flat clash (e.g. gutter, electrician adjustments)
  const handleSaveAdjustmentNote = (flatSno, noteText) => {
    if (!onUpdateFlats) {
      onNavigate('collections');
      return;
    }
    const flats = currentMonthData?.flats || [];
    const originalIndex = flats.findIndex(f => f.sno === flatSno);
    if (originalIndex === -1) return;
    const updated = [...flats];
    const item = {
      ...updated[originalIndex],
      adjustmentNote: noteText,
      notes: noteText
    };
    updated[originalIndex] = item;
    onUpdateFlats(updated);

    if (onRecordAuditEntry && noteText) {
      const matched = clashesReport.flatClashes?.find(c => c.sno === flatSno);
      onRecordAuditEntry({
        actionType: 'note_adjustment',
        field: 'adjustmentNote',
        flat: item.flat,
        sno: item.sno,
        name: item.name,
        monthKey: activeMonthKey,
        monthName: currentMonthData?.name || activeMonthKey,
        expected: matched?.expected,
        actual: matched?.actual,
        diff: matched?.diff,
        clashTitle: matched?.title || 'Payment Adjustment Note Added',
        resolutionNote: noteText,
        status: 'adjusted_with_note'
      });
    }

    if (onNotify) onNotify(noteText ? `Flat ${item.flat} par adjustment note save ho gaya! 📝` : `Flat ${item.flat} ka note clear ho gaya!`);
  };

  // Multi-Month Trends Data Array
  const multiMonthMetrics = useMemo(() => {
    return sortedMonthKeys.map((key) => {
      const mData = allMonthsData[key] || {};
      const mFlats = mData.flats || [];
      const mExp = mData.expenses || [];
      const coll = mFlats.reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
      const exp = mExp.reduce((acc, e) => acc + Number(e.amount || 0), 0);
      const prev = Number(mData.prevSavings || 0);
      const closing = coll + prev - exp;
      const target = mFlats.reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.due || 0) : 0), 0);
      const arr = mFlats.reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.arrears || 0) : 0), 0);
      const rate = target > 0 ? Math.round((coll / target) * 100) : 0;

      return {
        key,
        name: mData.name || key,
        year: mData.year || 2026,
        coll,
        exp,
        closing,
        target,
        arr,
        rate
      };
    });
  }, [sortedMonthKeys, allMonthsData]);

  // Max value for scaling SVG chart
  const maxChartVal = useMemo(() => {
    let max = 60000;
    multiMonthMetrics.forEach((m) => {
      if (m.coll > max) max = m.coll;
      if (m.exp > max) max = m.exp;
      if (m.closing > max) max = m.closing;
    });
    return Math.ceil(max * 1.15);
  }, [multiMonthMetrics]);

  // Floor-wise statistics
  const floors = [
    { name: 'Ground Floor', prefix: 'G', count: 3 },
    { name: '1st Floor', prefix: 'F', count: 4 },
    { name: '2nd Floor', prefix: 'S', count: 4 },
    { name: '3rd Floor', prefix: 'T', count: 4 },
    { name: 'Penthouse (4th)', prefix: 'P', count: 4 },
    { name: 'Shop (Ground)', prefix: 'Shop', count: 1 }
  ];

  const floorStats = floors.map(fl => {
    const floorFlats = flats.filter(f => {
      if (fl.prefix === 'Shop') return f.flat === 'Shop';
      return f.flat.startsWith(fl.prefix);
    });
    const floorTotal = floorFlats.reduce((sum, f) => sum + (f.status !== 'closed' ? Number(f.due || 0) : 0), 0);
    const floorPaid = floorFlats.reduce((sum, f) => sum + (f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
    const floorArrears = floorFlats.reduce((sum, f) => sum + (f.status !== 'closed' ? Number(f.arrears || 0) : 0), 0);
    const pct = floorTotal > 0 ? Math.round((floorPaid / floorTotal) * 100) : 100;
    return {
      ...fl,
      total: floorTotal,
      paid: floorPaid,
      arrears: floorArrears,
      pct,
      flats: floorFlats
    };
  });

  // Top Defaulters
  const sortedDefaulters = [...unpaidFlats].sort((a, b) => {
    const arrA = Number(a.arrears || (a.due - a.paid) || 0);
    const arrB = Number(b.arrears || (b.due - b.paid) || 0);
    return arrB - arrA;
  });

  // Expense Categories for Donut Chart
  const expenseCategories = useMemo(() => {
    const total = totalExpenses > 0 ? totalExpenses : 1;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    return expenses.map((e, idx) => {
      const amt = Number(e.amount || 0);
      const pct = Math.round((amt / total) * 100);
      return {
        desc: e.desc || `Expense ${idx + 1}`,
        amount: amt,
        pct,
        color: colors[idx % colors.length]
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [expenses, totalExpenses]);

  const handleCopyWhatsApp = () => {
    if (broadcastMode === 'paid') {
      const msg = buildPaidGroupWhatsAppMessage(monthName, paidFlats, totalCollected, buildingName, lang);
      navigator.clipboard.writeText(msg);
      if (onNotify) onNotify('Paid Flats list copied to clipboard! ✓');
    } else {
      const msg = buildShortGroupWhatsAppMessage(monthName, unpaidFlats, totalArrears, buildingName, lang);
      navigator.clipboard.writeText(msg);
      if (onNotify) onNotify(t.whatsAppCopied);
    }
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. HERO COMMAND BANNER                                   */}
      {/* ======================================================== */}
      <div className="erp-card-dark rounded-2xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden border border-slate-800/80">
        <div className="absolute top-0 end-0 -translate-y-12 translate-x-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 translate-y-12 -translate-x-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-blue-500/15 text-blue-300 text-xs font-bold px-3 py-1 rounded-lg border border-blue-400/25">
                <Calendar className="w-3.5 h-3.5" />
                <span>{currentMonthData?.name || activeMonthKey}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-300 text-xs font-bold px-3 py-1 rounded-lg border border-emerald-400/25">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{collectionRate}% Collection Rate</span>
              </span>
              {currentMonthData?.finalized ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-400/25 px-2.5 py-1 rounded-lg">
                  🔒 Statement Finalized
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-400/25 px-2.5 py-1 rounded-lg">
                  🔓 Live Active Sheet
                </span>
              )}

              {onOpenEditMonthModal && (
                <button
                  onClick={onOpenEditMonthModal}
                  className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 px-3 py-1 rounded-lg transition cursor-pointer"
                  title="Edit Month Details (Name, Year, Date, Opening Balance) or Delete Month Sheet"
                >
                  <Edit3 className="w-3 h-3 text-amber-400" />
                  <span>Edit / Delete Sheet</span>
                </button>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {buildingName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed font-normal">
              Comprehensive Financial Analytics & Executive Management Dashboard. Live collection monitoring, 
              budgetary expense breakdown, and historical trend reconciliation.
            </p>
          </div>

          {/* Quick Action Navigation Hub */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('collections')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>{t.navCollections}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('expenses')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold py-2 px-3.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>{t.navExpenses}</span>
            </button>
            <button
              onClick={() => onNavigate('special-funds')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold py-2 px-3.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Special Funds</span>
            </button>
            <button
              onClick={() => onNavigate('overview')}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-medium py-2 px-3.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>All Months Explorer</span>
            </button>
          </div>
        </div>

        {/* Live Segmented Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Financial Target Accomplishment</span>
            <span className="font-mono text-emerald-400 font-bold">
              Rs. {totalCollected.toLocaleString('en-US')} / Rs. {totalExpected.toLocaleString('en-US')} ({collectionRate}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex p-0.5">
            <div
              style={{ width: `${collectionRate}%` }}
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              title={`Collected: ${collectionRate}%`}
            />
            <div
              style={{ width: `${100 - collectionRate}%` }}
              className="h-full bg-rose-500/50 rounded-full transition-all duration-500"
              title={`Pending: ${100 - collectionRate}%`}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{paidFlats.length} Flats Fully Paid (Rs. {totalCollected.toLocaleString('en-US')})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>{unpaidFlats.length} Flats Pending Dues (Rs. {totalArrears.toLocaleString('en-US')})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{closedFlats.length} Closed / Locked Unit</span>
            </span>
          </div>
        </div>
      </div>

      {/* Financial Clash Alert Banner (Dashboard Alert with Itemized Breakdown) */}
      {/* Financial Clash Alert Banner (Dashboard Alert - Only for Unresolved/Unnoted Clashes) */}
      {clashesReport.hasUnresolvedClashes && (
        <div className="backdrop-blur-xl bg-gradient-to-r from-rose-950/95 via-red-900/90 to-amber-950/95 border-2 border-rose-500/80 rounded-3xl p-4 sm:p-5 text-white shadow-xl flex flex-col gap-3.5 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-600/30 border border-rose-400/40 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-rose-300 animate-pulse" />
              </div>
              <div>
                <p className="font-black text-sm sm:text-base text-rose-100 flex items-center gap-2 flex-wrap">
                  <span>🚨 {clashesReport.unresolvedCount} Financial Clash{clashesReport.unresolvedCount > 1 ? 'es' : ''} Detected in {monthName}!</span>
                  <span className="text-[10px] bg-rose-500/40 text-rose-200 border border-rose-400/40 px-2 py-0.5 rounded-full font-mono">
                    Auto-Correction Blocked ✋
                  </span>
                </p>
                <p className="text-xs text-rose-200/90 mt-0.5">
                  System ne auto-correct nahi kiya. Neechay har unresolved error ki mukammal wazahat darj hai:
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end flex-wrap">
              <button
                onClick={() => setIsClashModalOpen(true)}
                className="px-3.5 py-2 rounded-xl font-black text-xs bg-white/15 hover:bg-white/25 text-white border border-white/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <span>🔍 Tafseel Audit ({clashesReport.unresolvedCount})</span>
              </button>
              <button
                onClick={() => onNavigate('collections')}
                className="px-4 py-2 rounded-xl font-black text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/40 transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Collections Mein Fix Karein</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Itemized Direct Error Breakdown - Only Unnoted Clashes */}
          <div className="space-y-2 pt-2 border-t border-rose-500/30">
            {(clashesReport.unresolvedFlatClashes || clashesReport.flatClashes.filter(c => !c.hasAdjustmentNote)).map((c, idx) => (
              <div
                key={c.id || idx}
                className="bg-black/30 backdrop-blur-md rounded-2xl p-3 border border-rose-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <span className="px-2 py-0.5 rounded-lg font-black bg-rose-500/30 text-rose-200 border border-rose-400/30 shrink-0 font-mono">
                    {c.flatNo || `S#${c.sno}`}
                  </span>
                  <div>
                    <p className="font-extrabold text-rose-100 flex items-center gap-2 flex-wrap">
                      <span>{c.title}</span>
                      <span className="text-[11px] text-rose-300 font-normal">({c.name})</span>
                    </p>
                    <p className="text-[11px] text-rose-200/90 mt-0.5 leading-relaxed">
                      {lang === 'ur' ? c.messageUrdu : c.messageRoman}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {c.diff !== undefined && (
                    <div className="text-right bg-rose-900/40 px-2.5 py-1 rounded-xl border border-rose-400/20">
                      <span className="text-[10px] text-rose-300 block font-semibold">Tazaad (Diff)</span>
                      <span className="font-mono font-bold text-rose-100">Rs. {Math.abs(c.diff).toLocaleString()}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setIsClashModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white cursor-pointer shadow-xs transition bg-rose-600 hover:bg-rose-500"
                  >
                    Fix / Add Note
                  </button>
                </div>
              </div>
            ))}

            {clashesReport.activeChainClashes?.map((c, idx) => (
              <div
                key={c.id || idx}
                className="bg-black/30 backdrop-blur-md rounded-2xl p-3 border border-amber-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <span className="px-2 py-0.5 rounded-lg font-black bg-amber-500/30 text-amber-200 border border-amber-400/30 shrink-0 font-mono">
                    Month Chain
                  </span>
                  <div>
                    <p className="font-extrabold text-amber-100">{c.title}</p>
                    <p className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
                      {lang === 'ur' ? c.messageUrdu : c.messageRoman}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {c.diff !== undefined && (
                    <div className="text-right bg-amber-900/40 px-2.5 py-1 rounded-xl border border-amber-400/20">
                      <span className="text-[10px] text-amber-300 block font-semibold">Farq (Diff)</span>
                      <span className="font-mono font-bold text-amber-100">Rs. {Math.abs(c.diff).toLocaleString()}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setIsClashModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-xs transition"
                  >
                    Fix Karein
                  </button>
                </div>
              </div>
            ))}

            {clashesReport.budgetClashes?.map((c, idx) => (
              <div
                key={c.id || idx}
                className="bg-black/30 backdrop-blur-md rounded-2xl p-3 border border-amber-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <span className="px-2 py-0.5 rounded-lg font-black bg-amber-500/30 text-amber-200 border border-amber-400/30 shrink-0 font-mono">
                    Budget
                  </span>
                  <div>
                    <p className="font-extrabold text-amber-100">{c.title}</p>
                    <p className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
                      {lang === 'ur' ? c.messageUrdu : c.messageRoman}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. FOUR KEY FINANCIAL METRIC CARDS                        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total Collections */}
        <div className="erp-card rounded-2xl p-3.5 sm:p-5 hover:border-slate-300 transition duration-200 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.totalCollections}</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <h3 className="text-lg sm:text-2xl font-bold font-mono text-slate-900 tracking-tight">
              Rs. {totalCollected.toLocaleString('en-US')}
            </h3>
            <div className="mt-1.5 sm:mt-2 flex items-center justify-between text-[10px] sm:text-xs text-slate-500 flex-wrap gap-1">
              <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-100">✓ {collectionRate}%</span>
              <span className="text-slate-400 font-mono text-[10px] sm:text-[11px]">{paidFlats.length}/{activeCount}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Arrears */}
        <div className="erp-card rounded-2xl p-3.5 sm:p-5 hover:border-slate-300 transition duration-200 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.unpaidFlats}</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold border border-rose-100 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <h3 className="text-lg sm:text-2xl font-bold font-mono text-rose-600 tracking-tight">
              Rs. {totalArrears.toLocaleString('en-US')}
            </h3>
            <div className="mt-1.5 sm:mt-2 flex items-center justify-between text-[10px] sm:text-xs text-slate-500 flex-wrap gap-1">
              <span className="font-semibold text-rose-600 bg-rose-50 px-1.5 sm:px-2 py-0.5 rounded border border-rose-100">{unpaidFlats.length} pending</span>
              <button
                onClick={() => onNavigate('collections')}
                className="font-medium text-slate-700 hover:text-blue-600 flex items-center gap-0.5 cursor-pointer text-[10px] sm:text-xs"
              >
                <span>Inspect</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="erp-card rounded-2xl p-3.5 sm:p-5 hover:border-slate-300 transition duration-200 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.totalExpenses}</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100 shrink-0">
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <h3 className="text-lg sm:text-2xl font-bold font-mono text-slate-900 tracking-tight">
              Rs. {totalExpenses.toLocaleString('en-US')}
            </h3>
            <div className="mt-1.5 sm:mt-2 flex items-center justify-between text-[10px] sm:text-xs text-slate-500 flex-wrap gap-1">
              <span className="text-slate-500">{expenses.length} heads</span>
              <button
                onClick={() => onNavigate('expenses')}
                className="font-medium text-slate-700 hover:text-blue-600 flex items-center gap-0.5 cursor-pointer text-[10px] sm:text-xs"
              >
                <span>Breakdown</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: Net Balance (Cash in Hand) */}
        <div className="erp-card rounded-2xl p-3.5 sm:p-5 hover:border-slate-300 transition duration-200 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.netSavings}</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100 shrink-0">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <h3 className={`text-lg sm:text-2xl font-bold font-mono tracking-tight ${closingBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              Rs. {closingBalance.toLocaleString('en-US')}
            </h3>
            <div className="mt-1.5 sm:mt-2 flex items-center justify-between text-[10px] sm:text-xs text-slate-500 flex-wrap gap-1">
              <span>Opening: <strong className="font-mono text-slate-700">Rs. {prevSavings.toLocaleString('en-US')}</strong></span>
              <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded border border-blue-100">Reserve</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. INTERACTIVE MULTI-MONTH FINANCIAL ANALYTICS CHART     */}
      {/* ======================================================== */}
      <div className="erp-card rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200/90 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Multi-Month Comparative Financial Chart
              </h3>
              <p className="text-xs text-slate-500">
                Monthly trend analysis: Collections, Utility Expenditures, and Cash-in-Hand reserves
              </p>
            </div>
          </div>

          {/* Metric Selector & Legend */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-3 text-xs font-medium text-slate-600 me-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>Collections</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span>Expenses</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Cash Reserve</span>
              </span>
            </div>

            <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg text-xs font-semibold border border-slate-200">
              <button
                onClick={() => setChartMetric('all')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  chartMetric === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setChartMetric('collections')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  chartMetric === 'collections' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Collections
              </button>
              <button
                onClick={() => setChartMetric('expenses')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  chartMetric === 'expenses' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Expenses
              </button>
              <button
                onClick={() => setChartMetric('net')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  chartMetric === 'net' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Cash Reserve
              </button>
            </div>
          </div>
        </div>

        {/* SVG Multi-Month Chart */}
        <div className="relative w-full overflow-x-auto pt-2">
          <div className="min-w-[650px] h-64 sm:h-72 relative">
            <svg viewBox="0 0 700 240" className="w-full h-full select-none overflow-visible">
              <defs>
                <linearGradient id="gradEmerald" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.75" />
                </linearGradient>
                <linearGradient id="gradRose" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity="0.75" />
                </linearGradient>
                <linearGradient id="gradBlueLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
                <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.18" />
                </filter>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = 190 - pct * 155;
                const labelVal = Math.round((pct * maxChartVal) / 1000);
                return (
                  <g key={i}>
                    <line x1="45" y1={y} x2="685" y2={y} stroke="#e2e8f0" strokeDasharray="3,3" strokeWidth="1" />
                    <text x="40" y={y + 3} textAnchor="end" fontSize="10" fontWeight="bold" fill="#94a3b8">
                      {labelVal}k
                    </text>
                  </g>
                );
              })}

              {/* Bars and Connecting Line */}
              {(() => {
                const count = multiMonthMetrics.length;
                if (count === 0) return null;
                const usableWidth = 620;
                const step = usableWidth / Math.max(count, 1);
                const barW = Math.min(22, step * 0.24);

                // Coordinates for line connecting closing balance
                const linePoints = multiMonthMetrics.map((m, idx) => {
                  const cx = 70 + idx * step + step * 0.35;
                  const cy = 190 - (Math.max(0, m.closing) / maxChartVal) * 155;
                  return { x: cx, y: cy, ...m };
                });

                const pathD = linePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                return (
                  <>
                    {/* Render Bars per Month */}
                    {multiMonthMetrics.map((m, idx) => {
                      const cx = 70 + idx * step + step * 0.35;
                      const isCurrent = m.key === activeMonthKey;
                      const isHovered = hoveredMonth === m.key;

                      const collH = (m.coll / maxChartVal) * 155;
                      const expH = (m.exp / maxChartVal) * 155;

                      return (
                        <g
                          key={m.key}
                          onMouseEnter={() => setHoveredMonth(m.key)}
                          onMouseLeave={() => setHoveredMonth(null)}
                          className="cursor-pointer transition-all"
                        >
                          {/* Active Month Column Background Highlight */}
                          {isCurrent && (
                            <rect
                              x={cx - step * 0.45}
                              y="20"
                              width={step * 0.9}
                              height="175"
                              rx="12"
                              fill="#3b82f6"
                              fillOpacity="0.06"
                              stroke="#60a5fa"
                              strokeWidth="1.5"
                              strokeDasharray="4,4"
                            />
                          )}

                          {/* Collections Bar */}
                          {(chartMetric === 'all' || chartMetric === 'collections') && (
                            <rect
                              x={cx - barW - 2}
                              y={190 - collH}
                              width={barW}
                              height={collH}
                              rx="5"
                              fill="url(#gradEmerald)"
                              filter="url(#shadowFilter)"
                              className="transition-all duration-300"
                              opacity={hoveredMonth && !isHovered ? 0.45 : 1}
                            />
                          )}

                          {/* Expenses Bar */}
                          {(chartMetric === 'all' || chartMetric === 'expenses') && (
                            <rect
                              x={cx + 2}
                              y={190 - expH}
                              width={barW}
                              height={expH}
                              rx="5"
                              fill="url(#gradRose)"
                              filter="url(#shadowFilter)"
                              className="transition-all duration-300"
                              opacity={hoveredMonth && !isHovered ? 0.45 : 1}
                            />
                          )}

                          {/* X-Axis Month Label */}
                          <text
                            x={cx}
                            y="212"
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight={isCurrent ? "900" : "700"}
                            fill={isCurrent ? "#1e40af" : "#475569"}
                          >
                            {m.key.length > 5 ? m.key.substring(0, 3) : m.key}
                          </text>

                          {/* Year / Rate sub-label */}
                          <text
                            x={cx}
                            y="226"
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="600"
                            fill={isCurrent ? "#3b82f6" : "#94a3b8"}
                          >
                            {m.rate}%
                          </text>
                        </g>
                      );
                    })}

                    {/* Net Cash Reserve Trend Curve */}
                    {(chartMetric === 'all' || chartMetric === 'net') && (
                      <>
                        <path
                          d={pathD}
                          fill="none"
                          stroke="url(#gradBlueLine)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#shadowFilter)"
                        />
                        {linePoints.map((p) => (
                          <g key={p.key} className="cursor-pointer">
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={p.key === activeMonthKey ? "6" : "4.5"}
                              fill="#2563eb"
                              stroke="#ffffff"
                              strokeWidth="2.5"
                            />
                          </g>
                        ))}
                      </>
                    )}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* Hover / Current Month Detailed Summary Card */}
        {(() => {
          const activeItem = multiMonthMetrics.find(m => m.key === (hoveredMonth || activeMonthKey)) || multiMonthMetrics[0];
          if (!activeItem) return null;

          return (
            <div className="backdrop-blur-xl bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-white bg-slate-900 px-3 py-1 rounded-xl">
                  {activeItem.name}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Detailed Reconciled Snapshot:
                </span>
              </div>
              <div className="flex items-center gap-4 sm:gap-6 text-xs flex-wrap">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">COLLECTIONS</span>
                  <span className="font-black text-emerald-700">Rs. {activeItem.coll.toLocaleString('en-US')} ({activeItem.rate}%)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">EXPENSES</span>
                  <span className="font-black text-rose-700">Rs. {activeItem.exp.toLocaleString('en-US')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">OUTSTANDING ARREARS</span>
                  <span className="font-black text-amber-700">Rs. {activeItem.arr.toLocaleString('en-US')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">NET CASH IN HAND</span>
                  <span className="font-black text-blue-900">Rs. {activeItem.closing.toLocaleString('en-US')}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ======================================================== */}
      {/* 4. EXPENSES DONUT BREAKDOWN & OCCUPANCY HEALTH CHARTS    */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (6 cols): Expense Category Distribution Donut */}
        <div className="lg:col-span-6 erp-card rounded-2xl p-6 space-y-4 shadow-xs border border-slate-200/90 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Expense Budget Distribution
                </h3>
                <p className="text-xs text-slate-500">
                  Breakdown across {expenses.length} building utilities & service heads
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedExpenseForModal('بجلی کا بل');
                  setIsExpenseModalOpen(true);
                }}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-lg border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                title="تمام مہینوں کے بجلی بل اور دیگر اخراجات کا تاریخی تقابلی جائزہ"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>All Months History</span>
              </button>
              <button
                onClick={() => onNavigate('expenses')}
                className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Manage</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* SVG Donut Chart */}
            <div className="sm:col-span-5 flex items-center justify-center relative">
              <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="14" />
                {(() => {
                  let accum = 0;
                  const circ = 2 * Math.PI * 38; // ~238.76
                  return expenseCategories.map((c, i) => {
                    const strokeLen = (c.pct / 100) * circ;
                    const offset = -accum;
                    accum += strokeLen;
                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke={c.color}
                        strokeWidth="14"
                        strokeDasharray={`${strokeLen} ${circ}`}
                        strokeDashoffset={offset}
                        className="transition-all duration-500 hover:opacity-80"
                      />
                    );
                  });
                })()}
              </svg>
              {/* Donut Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Spent</span>
                <span className="text-xs font-black text-slate-900">Rs. {totalExpenses.toLocaleString('en-US')}</span>
              </div>
            </div>

            {/* Category Breakdown Legend (Clickable to open multi-month history!) */}
            <div className="sm:col-span-7 space-y-1.5 max-h-48 overflow-y-auto pe-1">
              {expenseCategories.map((cat, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedExpenseForModal(cat.desc);
                    setIsExpenseModalOpen(true);
                  }}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded-xl border-b border-slate-100 last:border-none hover:bg-blue-50/70 transition cursor-pointer group"
                  title={`Click to view all months history for "${cat.desc}"`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 group-hover:scale-125 transition" style={{ backgroundColor: cat.color }} />
                    <span className="font-extrabold text-slate-800 truncate group-hover:text-blue-700 transition" title={cat.desc}>
                      {cat.desc}
                    </span>
                  </div>
                  <div className="text-end shrink-0 ps-2 flex items-center gap-1.5">
                    <span className="font-black text-slate-900">Rs. {cat.amount.toLocaleString('en-US')}</span>
                    <span className="text-[10px] text-slate-400 font-bold">({cat.pct}%)</span>
                    <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right (6 cols): Collection & Occupancy Health Ring */}
        <div className="lg:col-span-6 erp-card rounded-2xl p-6 space-y-4 shadow-xs border border-slate-200/90 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Unit Occupancy & Collection Efficiency
                </h3>
                <p className="text-xs text-slate-500">
                  Status breakdown across 20 building flats
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('residents')}
              className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Residents (RD)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* SVG Radial Efficiency Ring */}
            <div className="sm:col-span-5 flex items-center justify-center relative">
              <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="14" />
                {(() => {
                  const circ = 2 * Math.PI * 38;
                  const paidPct = (paidFlats.length / 20) * 100;
                  const unpPct = (unpaidFlats.length / 20) * 100;
                  const clsPct = (closedFlats.length / 20) * 100;

                  const pLen = (paidPct / 100) * circ;
                  const uLen = (unpPct / 100) * circ;
                  const cLen = (clsPct / 100) * circ;

                  return (
                    <>
                      {/* Paid Slice (Emerald) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="14"
                        strokeDasharray={`${pLen} ${circ}`}
                        strokeDashoffset="0"
                      />
                      {/* Unpaid Slice (Rose) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="14"
                        strokeDasharray={`${uLen} ${circ}`}
                        strokeDashoffset={-pLen}
                      />
                      {/* Closed Slice (Amber) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="14"
                        strokeDasharray={`${cLen} ${circ}`}
                        strokeDashoffset={-(pLen + uLen)}
                      />
                    </>
                  );
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-slate-400">Efficiency</span>
                <span className="text-base font-black text-emerald-700">{collectionRate}%</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="sm:col-span-7 grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold block">🟢 Fully Cleared</span>
                <span className="text-base font-black text-emerald-950">{paidFlats.length} Flats</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-rose-50/80 border border-rose-200">
                <span className="text-[10px] text-rose-800 font-bold block">⚠️ Pending Dues</span>
                <span className="text-base font-black text-rose-950">{unpaidFlats.length} Flats</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200">
                <span className="text-[10px] text-amber-800 font-bold block">🔒 Band / Locked</span>
                <span className="text-base font-black text-amber-950">{closedFlats.length} Unit</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-blue-50/80 border border-blue-200">
                <span className="text-[10px] text-blue-800 font-bold block">🏢 Total Units</span>
                <span className="text-base font-black text-blue-950">20 Units</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. FLOOR PERFORMANCE METRICS & PENDING DEFAULTERS RADAR */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols): Floor-by-Floor Performance */}
        <div className="lg:col-span-6 erp-card rounded-2xl p-6 space-y-4 shadow-xs border border-slate-200/90">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Floor-by-Floor Performance
              </h3>
              <p className="text-xs text-slate-500">
                Collection rate comparison across building levels
              </p>
            </div>
            <button
              onClick={() => setIsFloorModalOpen(true)}
              className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
            >
              🏢 مکمل فلور رپورٹ
            </button>
          </div>

          <div className="space-y-3.5">
            {floorStats.map((fl) => (
              <div key={fl.prefix} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{fl.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-600 font-bold">
                      Rs. {fl.paid.toLocaleString('en-US')} / {fl.total.toLocaleString('en-US')}
                    </span>
                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                      fl.pct >= 90 ? 'bg-emerald-100 text-emerald-800' : fl.pct >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {fl.pct}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${fl.pct}%` }}
                    className={`h-full rounded-full transition-all duration-300 ${
                      fl.pct >= 90
                        ? 'bg-emerald-500'
                        : fl.pct >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (6 cols): Defaulters Aging Analysis & Tailored Reminders */}
        <div className="lg:col-span-6">
          <DefaultersAgingCard
            flats={flats}
            allMonthsData={allMonthsData}
            monthOrder={monthOrder}
            activeMonthKey={activeMonthKey}
            monthName={monthName}
            buildingName={buildingName}
            onNavigate={onNavigate}
            onNotify={onNotify}
            lang={lang}
            onRecordDefaulterNotice={onRecordDefaulterNotice}
          />
        </div>
      </div>

      {/* Multi-Month Interactive Expenses & Bill History Modal */}
      <MultiMonthExpensesModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        allMonthsData={allMonthsData}
        monthOrder={monthOrder}
        initialExpenseName={selectedExpenseForModal}
        onSelectMonth={onSelectMonth}
        buildingName={buildingName}
        lang={lang}
      />

      {/* Financial Clashes Inspector Modal */}
      <FinancialClashModal
        isOpen={isClashModalOpen}
        onClose={() => setIsClashModalOpen(false)}
        clashesReport={clashesReport}
        activeMonthKey={activeMonthKey}
        onResolveFlatClash={handleResolveFlatClash}
        onResolveChainClash={handleResolveChainClash}
        onSaveAdjustmentNote={handleSaveAdjustmentNote}
        onNavigateToAuditLog={() => {
          setIsClashModalOpen(false);
          onNavigate('errors-audit');
        }}
        lang={lang}
      />

      {/* Floor-Wise Analytics Modal */}
      <FloorWiseAnalyticsModal
        isOpen={isFloorModalOpen}
        onClose={() => setIsFloorModalOpen(false)}
        flats={flats}
        monthName={monthName}
        buildingName={buildingName}
        onSelectFlat={(flat) => {
          setIsFloorModalOpen(false);
          if (onNavigate) onNavigate('collections');
        }}
      />
    </div>
  );
}
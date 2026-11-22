import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle,
  CheckCheck,
  Check,
  FileText,
  Lock,
  Unlock,
  Search,
  MessageCircle,
  Filter,
  Building2,
  Receipt,
  Sparkles,
  ArrowRight,
  Wallet,
  Calendar,
  ArrowUp,
  ArrowDown,
  Printer,
  X,
  History,
  Edit3,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Clock,
  Flame,
  AlertCircle,
  BookOpen,
  Share2,
  ShieldAlert
} from 'lucide-react';
import {
  openGroupWhatsApp,
  openPaidGroupWhatsApp,
  buildShortGroupWhatsAppMessage,
  buildPaidGroupWhatsAppMessage,
  openSingleReceiptWhatsApp,
  openAgingReminderWhatsApp,
  openAdjustmentSlipWhatsApp
} from '../utils/whatsapp';
import { sortMonthsChronologically } from '../utils/monthUtils';
import { getAgingClassification, getConsecutivePastUnpaidMonths } from '../utils/agingUtils';
import { scanAllSystemClashes, checkFlatClashes } from '../utils/clashDetector';
import { formatResidentDisplayName } from '../utils/residentUtils';
import LockedFullSheet from '../components/LockedFullSheet';
import WhatsAppDigestModal from '../components/WhatsAppDigestModal';
import ResidentLedgerModal from '../components/ResidentLedgerModal';
import FinancialClashModal from '../components/FinancialClashModal';
import FloorWiseAnalyticsModal from '../components/FloorWiseAnalyticsModal';
import { getFlatFloorKey, calculateFloorWiseAnalytics } from '../utils/floorUtils';

// Smart Arrears & Advance Helpers (Internal)
const getPriorArrears = (flat) => {
  if (!flat) return 0;
  if (flat.priorArrears !== undefined && flat.priorArrears !== null) {
    return Number(flat.priorArrears) || 0;
  }
  const total = (Number(flat.arrears || 0) + Number(flat.paid || 0));
  const due = Number(flat.due || 0);
  return Math.max(0, total - due);
};

const getTrueAdvance = (flat) => {
  if (!flat || flat.status === 'closed') return 0;
  const priorArr = getPriorArrears(flat);
  const totalLiability = (Number(flat.due) || 0) + priorArr;
  return Math.max(0, (Number(flat.paid) || 0) - totalLiability);
};

const getArrearsCleared = (flat) => {
  if (!flat || flat.status === 'closed') return 0;
  const priorArr = getPriorArrears(flat);
  const paid = Number(flat.paid) || 0;
  const due = Number(flat.due) || 0;
  if (priorArr <= 0) return 0;
  return Math.min(priorArr, Math.max(0, paid - due));
};

export default function CollectionsPage({
  flats = [],
  onUpdateFlats,
  expenses = [],
  prevSavings = 0,
  monthName,
  dateStr = '',
  onUpdateDate,
  buildingName,
  isFinalized,
  onToggleFinalize,
  onNavigate,
  t,
  lang,
  onNotify,
  monthOrder = [],
  activeMonthKey,
  systemActiveMonth,
  allMonthsData = {},
  onChangeMonth,
  onOpenNewMonthModal,
  onSyncChainBalances,
  residentDirectory = [],
  onUpdateMonthFlats,
  onUpdatePrevSavings,
  onOpenEditMonthModal,
  onRecordAuditEntry,
  onAddContraExpense,
  onRecordCellChange,
  onRecordDefaulterNotice
}) {
  const [filter, setFilter] = useState('all'); // 'all', 'arrears', 'paid', 'closed'
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'cards'
  const [broadcastMode, setBroadcastMode] = useState('unpaid'); // 'unpaid' | 'paid'
  const [broadcastDetailMode, setBroadcastDetailMode] = useState('with_details'); // 'with_details' | 'only_flats'
  const [noticeDetailMode, setNoticeDetailMode] = useState('with_details'); // 'with_details' | 'only_flats'
  const [sortField, setSortField] = useState('sno'); // 'sno' | 'flat' | 'name' | 'due' | 'paid' | 'arrears'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
  const [receiptModalFlat, setReceiptModalFlat] = useState(null);
  const [isDefaultersNoticeOpen, setIsDefaultersNoticeOpen] = useState(false);
  const [selectedLedgerFlat, setSelectedLedgerFlat] = useState(null);
  const [isDigestModalOpen, setIsDigestModalOpen] = useState(false);
  const [isClashModalOpen, setIsClashModalOpen] = useState(false);
  const [editingNoteFlat, setEditingNoteFlat] = useState(null);
  const [noteInputText, setNoteInputText] = useState('');
  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [floorFilter, setFloorFilter] = useState('all'); // 'all', 'G', 'F', 'S', 'T', 'P', 'Shop'
  const [contraEnabled, setContraEnabled] = useState(false);
  const [contraDesc, setContraDesc] = useState('');
  const [contraAmount, setContraAmount] = useState('');
  const [contraDetails, setContraDetails] = useState('');

  // Real-Time Financial Clashes & Discrepancies Scanner (Zero Silent Auto-Correction)
  const clashesReport = useMemo(() => {
    return scanAllSystemClashes({
      currentMonthData: {
        flats,
        expenses,
        prevSavings,
        name: monthName,
        dateStr
      },
      activeMonthKey,
      allMonthsData,
      monthOrder
    });
  }, [flats, expenses, prevSavings, monthName, dateStr, activeMonthKey, allMonthsData, monthOrder]);

  const sortedMonthKeys = sortMonthsChronologically(monthOrder && monthOrder.length > 0 ? monthOrder : Object.keys(allMonthsData || {}));
  const isPreviousMonth = Boolean(activeMonthKey && systemActiveMonth && activeMonthKey !== systemActiveMonth);

  const safeFlats = (flats || []).filter(Boolean);
  const safeExpenses = (expenses || []).filter(Boolean);

  const unpaidFlats = safeFlats.filter(f => f && f.status !== 'closed' && (Number(f.arrears) > 0 || Number(f.paid) < ((Number(f.due) || 0) + getPriorArrears(f))));
  const paidFlats = safeFlats.filter(f => f && f.status !== 'closed' && Number(f.paid) > 0 && Number(f.arrears) === 0);
  const closedFlats = safeFlats.filter(f => f && f.status === 'closed');

  const totalPriorArrears = safeFlats.reduce((sum, f) => sum + (f && f.status !== 'closed' ? getPriorArrears(f) : 0), 0);
  const totalDue = safeFlats.reduce((sum, f) => sum + (f && f.status !== 'closed' ? Number(f.due || 0) : 0), 0);
  const totalPaid = safeFlats.reduce((sum, f) => sum + (f && f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
  const totalArrears = safeFlats.reduce((sum, f) => sum + (f && f.status !== 'closed' ? Number(f.arrears || 0) : 0), 0);
  const totalAdvance = safeFlats.reduce((sum, f) => sum + (f && f.status !== 'closed' ? getTrueAdvance(f) : 0), 0);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Digital Payment Receipt Modal
  const renderReceiptModal = () => {
    if (!receiptModalFlat) return null;
    const dueNum = Number(receiptModalFlat.due || 0);
    const paidNum = Number(receiptModalFlat.paid || 0);
    const arrearsNum = Number(receiptModalFlat.arrears || 0);
    const priorArr = getPriorArrears(receiptModalFlat);
    const totalLiability = dueNum + priorArr;
    const arrearsCleared = priorArr > 0 ? Math.min(priorArr, Math.max(0, paidNum - dueNum)) : 0;
    const trueAdvance = Math.max(0, paidNum - totalLiability);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in no-print-overlay">
        <div className="backdrop-blur-2xl bg-white/95 rounded-3xl border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.25)] max-w-md w-full p-6 text-slate-900 relative">
          <button
            onClick={() => setReceiptModalFlat(null)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Receipt Content */}
          <div id="printable-receipt" className="space-y-4">
            <div className="text-center pb-4 border-b border-slate-200">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-md mb-2">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg text-slate-900 tracking-tight">
                {buildingName || 'AL MUSTAFA HEIGHTS 5-E-18/19'}
              </h3>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5">
                Official Maintenance Receipt • رسید ادائیگی
              </p>
              <div className="inline-block mt-2 bg-slate-100 text-slate-600 text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-slate-200">
                Receipt #: AMH-{monthName.replace(/\s+/g, '').toUpperCase()}-{receiptModalFlat.flat}
              </div>
            </div>

            {/* Details Grid */}
            <div className="bg-slate-50/80 rounded-2xl p-4 space-y-2.5 border border-slate-200/80 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Flat Number:</span>
                <span className="font-black text-slate-900 text-sm">Flat {receiptModalFlat.flat}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Resident Name:</span>
                <span className="font-bold text-slate-900">{formatResidentDisplayName(receiptModalFlat) || 'Resident'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Billing Month:</span>
                <span className="font-bold text-slate-800">{monthName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Issue Date:</span>
                <span className="font-mono text-slate-700">{dateStr || new Date().toLocaleDateString('en-GB')}</span>
              </div>

              <div className="pt-2 space-y-1.5">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Monthly Due (ماہانہ فیس):</span>
                  <span className="font-bold">Rs. {dueNum.toLocaleString('en-US')}</span>
                </div>
                {priorArr > 0 && (
                  <div className="flex justify-between items-center text-amber-800 bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200">
                    <span className="font-medium">Prior Arrears (سابقہ بقایا):</span>
                    <span className="font-black">Rs. {priorArr.toLocaleString('en-US')}</span>
                  </div>
                )}
                {priorArr > 0 && (
                  <div className="flex justify-between items-center text-slate-800 font-bold">
                    <span>Total Payable (کل واجب الادا):</span>
                    <span className="font-black">Rs. {totalLiability.toLocaleString('en-US')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-emerald-700 font-extrabold text-sm pt-1 border-t border-slate-200/60">
                  <span>Amount Received (وصول شدہ):</span>
                  <span>Rs. {paidNum.toLocaleString('en-US')}</span>
                </div>
                {arrearsCleared > 0 && (
                  <div className="flex justify-between items-center text-emerald-800 font-black text-xs bg-emerald-100/80 p-1.5 rounded-lg border border-emerald-300">
                    <span>✓ Arrears Settled (سابقہ ادائیگی):</span>
                    <span>Rs. {arrearsCleared.toLocaleString('en-US')}</span>
                  </div>
                )}
                {trueAdvance > 0 && (
                  <div className="flex justify-between items-center text-cyan-900 font-black text-xs bg-cyan-100/80 p-1.5 rounded-lg border border-cyan-300">
                    <span>⭐ Advance Credit (پیشگی رقم):</span>
                    <span>Rs. {trueAdvance.toLocaleString('en-US')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-rose-700 font-bold">
                  <span>Remaining Arrears (باقی بقایا):</span>
                  <span>Rs. {arrearsNum.toLocaleString('en-US')}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600 px-1">
              <span>Managed by: <strong>Hafiz Muhammad Saad</strong></span>
              <span className={arrearsNum === 0 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                {arrearsNum === 0 ? '✓ Account Fully Cleared' : '⚠️ Balance Pending'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={() => openSingleReceiptWhatsApp(receiptModalFlat, monthName, buildingName, lang, dateStr)}
              className="backdrop-blur-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Receipt</span>
            </button>
            <button
              onClick={() => window.print()}
              className="backdrop-blur-md bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/20 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Defaulters Formal Warning Notice Modal
  const renderDefaultersNoticeModal = () => {
    if (!isDefaultersNoticeOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in no-print-overlay">
        <div className="backdrop-blur-2xl bg-white/95 rounded-3xl border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.25)] max-w-lg w-full p-6 text-slate-900 relative space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-600/15 text-rose-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-slate-900">
                  {lang === 'ur' ? 'رسمی نادہندگان نوٹس (Defaulters Notice)' : 'Official Defaulters Warning Notice'}
                </h3>
                <p className="text-[11px] text-slate-500">{monthName} — {buildingName}</p>
              </div>
            </div>
            <button
              onClick={() => setIsDefaultersNoticeOpen(false)}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Details vs Only Flat Names Format Switcher */}
          <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl text-xs font-bold border border-slate-200">
            <span className="text-slate-600 px-2 font-medium">فارمیٹ (Format):</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setNoticeDetailMode('with_details')}
                className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                  noticeDetailMode === 'with_details'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                📋 With Details (نام کے ساتھ)
              </button>
              <button
                onClick={() => setNoticeDetailMode('only_flats')}
                className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                  noticeDetailMode === 'only_flats'
                    ? 'bg-amber-600 text-white shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                🏢 Only Flat Names (صرف فلیٹ)
              </button>
            </div>
          </div>

          <div className="bg-slate-50/90 rounded-2xl p-4 font-mono text-xs text-slate-800 space-y-2.5 border border-slate-200 max-h-72 overflow-y-auto">
            <p className="font-bold text-center text-rose-700 text-sm">
              🚨 {buildingName} — FORMAL DUES NOTICE 🚨
            </p>
            <p className="text-center text-slate-500 text-[11px]">Issue Date: {dateStr || new Date().toLocaleDateString('en-GB')}</p>
            <hr className="border-slate-300" />
            <p className="font-bold text-slate-900">Respected Building Residents,</p>
            <p className="text-slate-600 leading-relaxed">
              The following flats have outstanding maintenance dues for <strong>{monthName}</strong>:
            </p>
            <div className="space-y-1.5 pt-1">
              {unpaidFlats.map((f, i) => {
                const priorArr = getPriorArrears(f);
                const due = Number(f.due) || 3000;
                const arrears = Number(f.arrears || Math.max(0, due - Number(f.paid || 0)));
                const consecutive = getConsecutivePastUnpaidMonths(f, allMonthsData, sortedMonthKeys, activeMonthKey);
                const aging = getAgingClassification(f, priorArr, due, arrears, consecutive.count);
                return (
                  <div key={f.sno} className="flex justify-between items-center border-b border-slate-200/60 pb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900">
                        {noticeDetailMode === 'with_details'
                          ? `${i + 1}. Flat ${f.flat} (${formatResidentDisplayName(f)})`
                          : `${i + 1}. Flat ${f.flat}`}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${aging.softBadgeClass}`}>
                        {aging.shortLabel}
                      </span>
                    </div>
                    {noticeDetailMode === 'with_details' ? (
                      <span className="font-black text-rose-700">Rs. {Number(f.arrears || f.due).toLocaleString('en-US')}</span>
                    ) : (
                      <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px]">
                        Pending (باقیات)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between font-black pt-2 text-rose-900 border-t-2 border-slate-300 text-sm">
              {noticeDetailMode === 'with_details' ? (
                <>
                  <span>TOTAL PENDING DUES:</span>
                  <span>Rs. {totalArrears.toLocaleString('en-US')}</span>
                </>
              ) : (
                <>
                  <span>TOTAL PENDING FLATS:</span>
                  <span>{unpaidFlats.length} Flats</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-700 pt-2 leading-relaxed">
              ⚠️ <strong>Final Request:</strong> Kindly clear your outstanding dues within 3 days to avoid discontinuation of common building services (water motor, general sanitation & elevator maintenance).
            </p>
            <p className="text-[11px] text-slate-600 font-bold text-right pt-1">— Maintenance Managed by: Hafiz Muhammad Saad</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => {
                let msg = `🚨 *${buildingName} — FORMAL DUES NOTICE (${monthName})*\n`;
                msg += `-----------------------------------\n`;
                msg += `Respected Residents, kindly clear your pending dues:\n\n`;
                unpaidFlats.forEach((f, i) => {
                  const priorArr = getPriorArrears(f);
                  const due = Number(f.due) || 3000;
                  const arrears = Number(f.arrears || Math.max(0, due - Number(f.paid || 0)));
                  const consecutive = getConsecutivePastUnpaidMonths(f, allMonthsData, sortedMonthKeys, activeMonthKey);
                  const aging = getAgingClassification(f, priorArr, due, arrears, consecutive.count);
                  if (noticeDetailMode === 'with_details') {
                    const nameStr = ` (${formatResidentDisplayName(f)})`;
                    msg += `${i + 1}. *Flat ${f.flat}*${nameStr} [${aging.labelRoman}]: Rs. ${Number(f.arrears || f.due).toLocaleString('en-US')}\n`;
                  } else {
                    msg += `${i + 1}. *Flat ${f.flat}* [${aging.labelRoman}]\n`;
                  }
                });
                if (noticeDetailMode === 'with_details') {
                  msg += `\n⚠️ *TOTAL PENDING:* Rs. ${totalArrears.toLocaleString('en-US')}\n`;
                } else {
                  msg += `\n⚠️ *TOTAL PENDING:* ${unpaidFlats.length} Flats\n`;
                }
                msg += `-----------------------------------\n`;
                msg += `Kindly deposit within 3 days to keep all building services running smoothly. Thank you!\n— Maintenance Managed by: Hafiz Muhammad Saad`;
                navigator.clipboard.writeText(msg);
                if (onNotify) onNotify(`Defaulters Notice (${noticeDetailMode === 'with_details' ? 'With Details' : 'Only Flat Names'}) copied! 📋`);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20 transition"
            >
              <span>📋 Copy Notice</span>
            </button>
            <button
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-slate-900/20 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Notice</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // If this month is locked, show the full finalized master sheet cleanly without duplicates
  if (isFinalized) {
    return (
      <div className="space-y-6">
        <LockedFullSheet
          flats={flats}
          expenses={expenses}
          prevSavings={prevSavings}
          monthName={monthName}
          dateStr={dateStr}
          onUpdateDate={onUpdateDate}
          buildingName={buildingName}
          onUnlock={onToggleFinalize}
          t={t}
          lang={lang}
          onNotify={onNotify}
        />
        {renderReceiptModal()}
        {renderDefaultersNoticeModal()}
      </div>
    );
  }

  // Cell edit handler: STRICT ZERO SILENT AUTO-CORRECTION POLICY
  // Preserves exact user inputs without rewriting arrears or other fields behind user's back!
  const handleCellChange = (index, field, value) => {
    if (isFinalized) return;
    const updated = [...flats];
    const item = { ...updated[index] };
    if (!item) return;

    // Locked/closed flats cannot be modified from collections page!
    if (item.status === 'closed') return;
    const oldVal = item[field];

    if (field === 'due' || field === 'paid' || field === 'arrears' || field === 'priorArrears') {
      const numVal = value === '' ? 0 : Number(value);
      item[field] = numVal;

      if (field === 'paid') {
        if (numVal > 0 && !item.paidDate) {
          item.paidDate = dateStr || new Date().toLocaleDateString('en-GB');
        }
      }

      // Update status tag cleanly based on user's values without modifying numbers
      const curArrears = field === 'arrears' ? numVal : (Number(item.arrears) || 0);
      const curPaid = field === 'paid' ? numVal : (Number(item.paid) || 0);
      item.status = curArrears > 0 ? 'arrears' : (curPaid > 0 ? 'paid' : 'arrears');
    } else {
      item[field] = value;
    }

    updated[index] = item;
    onUpdateFlats(updated);

    // Feature 2: Cell-by-cell edit history logger
    if (onRecordCellChange && oldVal !== undefined && String(oldVal) !== String(value)) {
      onRecordCellChange({
        monthKey: activeMonthKey,
        flat: item.flat,
        name: item.name,
        field,
        oldValue: oldVal,
        newValue: value
      });
    }
  };

  // Explicit user-driven resolution of a flat clash (only applied if user clicks fix)
  const handleResolveFlatClash = (flatSno, field, recommendedValue) => {
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

    // Record into permanent Error Audit Log
    if (onRecordAuditEntry) {
      const currentMonthIdx = sortedMonthKeys.indexOf(activeMonthKey);
      const prevMonthKey = currentMonthIdx > 0 ? sortedMonthKeys[currentMonthIdx - 1] : null;
      const prevMonthData = prevMonthKey ? allMonthsData[prevMonthKey] : null;
      const prevMonthFlat = prevMonthData?.flats?.find(pf => pf.flat === item.flat || pf.sno === item.sno) || null;
      const clashList = checkFlatClashes(item, prevMonthFlat);
      const matched = clashList[0];

      onRecordAuditEntry({
        actionType: 'value_fix',
        field,
        flat: item.flat,
        sno: item.sno,
        name: item.name,
        monthKey: activeMonthKey,
        monthName: monthName,
        oldValue: oldVal,
        resolvedValue: recommendedValue,
        expected: matched?.expected,
        actual: oldVal,
        diff: matched?.diff,
        clashTitle: matched?.title || `${field} liability clash fixed`,
        resolutionNote: `User action: ${field} set to recommended Rs. ${recommendedValue.toLocaleString('en-US')}`,
        status: 'fixed'
      });
    }

    if (onNotify) onNotify(`Flat ${item.flat} (${field}) updated to Rs. ${recommendedValue.toLocaleString('en-US')}! ✓`);
  };

  // Explicit user-driven resolution of month opening bachat chain clash
  const handleResolveChainClash = (targetMonthKey, recommendedValue) => {
    if (typeof onUpdatePrevSavings === 'function') {
      onUpdatePrevSavings(recommendedValue, targetMonthKey);
    } else if (typeof onSyncChainBalances === 'function') {
      onSyncChainBalances();
    }

    // Record into permanent Error Audit Log
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

    // Record into permanent Error Audit Log
    if (onRecordAuditEntry && noteText) {
      const currentMonthIdx = sortedMonthKeys.indexOf(activeMonthKey);
      const prevMonthKey = currentMonthIdx > 0 ? sortedMonthKeys[currentMonthIdx - 1] : null;
      const prevMonthData = prevMonthKey ? allMonthsData[prevMonthKey] : null;
      const prevMonthFlat = prevMonthData?.flats?.find(pf => pf.flat === item.flat || pf.sno === item.sno) || null;
      const clashList = checkFlatClashes(item, prevMonthFlat);
      const matched = clashList[0];

      onRecordAuditEntry({
        actionType: 'note_adjustment',
        field: 'adjustmentNote',
        flat: item.flat,
        sno: item.sno,
        name: item.name,
        monthKey: activeMonthKey,
        monthName: monthName,
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

  // Quick paid toggle: preserves remaining balance & clears prior arrears smartly!
  const setQuickPaid = (index) => {
    if (isFinalized) return;
    const updated = [...flats];
    const item = { ...updated[index] };
    if (!item || item.status === 'closed') return; // Strictly ignore locked/closed units

    const due = Number(item.due) || 3000;
    const priorArr = getPriorArrears(item);
    const totalLiability = due + priorArr;
    const currentPaid = Number(item.paid) || 0;
    const currentArrears = Number(item.arrears) || 0;

    if (currentPaid < due) {
      if (priorArr > 0) {
        // Flat has prior arrears
        const clearAll = window.confirm(`Flat ${item.flat} has prior pending arrears:\n- Monthly Due: Rs. ${due.toLocaleString('en-US')}\n- Prior Arrears: Rs. ${priorArr.toLocaleString('en-US')}\n- Total Liability: Rs. ${totalLiability.toLocaleString('en-US')}\n\nClick OK to mark FULL Rs. ${totalLiability.toLocaleString('en-US')} (Both Monthly + Past Arrears) as Paid.\nClick CANCEL to only mark Monthly Rs. ${due.toLocaleString('en-US')}.`);
        if (clearAll) {
          item.paid = totalLiability;
          item.arrears = 0;
          item.status = 'paid';
          item.paidDate = item.paidDate || dateStr || new Date().toLocaleDateString('en-GB');
          if (onNotify) onNotify(`Flat ${item.flat} full Rs. ${totalLiability.toLocaleString('en-US')} paid (Prior arrears cleared!) ✓`);
        } else {
          item.paid = due;
          item.arrears = priorArr;
          item.status = priorArr > 0 ? 'arrears' : 'paid';
          item.paidDate = item.paidDate || dateStr || new Date().toLocaleDateString('en-GB');
          if (onNotify) onNotify(`Flat ${item.flat} monthly paid (Rs. ${priorArr.toLocaleString('en-US')} prior balance remains) ✓`);
        }
      } else {
        item.paid = due;
        item.arrears = 0;
        item.status = 'paid';
        item.paidDate = item.paidDate || dateStr || new Date().toLocaleDateString('en-GB');
        if (onNotify) onNotify(`Flat ${item.flat} marked as Fully Paid ✓`);
      }
    } else if (currentArrears > 0) {
      // Monthly due was already paid (paid >= due), but has leftover balance:
      if (window.confirm(`Flat ${item.flat} has a remaining balance of Rs. ${currentArrears.toLocaleString('en-US')}.\nDo you want to clear this remaining balance to 0 now?`)) {
        item.paid = Number(item.paid) + currentArrears;
        item.arrears = 0;
        item.status = 'paid';
        item.paidDate = item.paidDate || dateStr || new Date().toLocaleDateString('en-GB');
        if (onNotify) onNotify(`Flat ${item.flat} remaining balance cleared! ✓`);
      }
    }
    updated[index] = item;
    onUpdateFlats(updated);
  };

  // Add new flat row
  const handleAddRow = () => {
    if (isFinalized) return;
    const newSno = flats.length + 1;
    const newFlat = {
      sno: newSno,
      flat: `F-${newSno}`,
      name: '',
      priorArrears: 0,
      due: 3000,
      paid: 0,
      arrears: 3000,
      status: 'arrears',
      phone: ''
    };
    onUpdateFlats([...flats, newFlat]);
  };

  // Delete row
  const handleDeleteRow = (index) => {
    if (isFinalized) return;
    if (!window.confirm(`Delete row for Flat (${flats[index].flat})?`)) return;
    const updated = flats.filter((_, idx) => idx !== index).map((f, i) => ({ ...f, sno: i + 1 }));
    onUpdateFlats(updated);
  };

  // Mark all active flats paid (strictly preserves locked/closed homes)
  const handleMarkAllPaid = () => {
    if (isFinalized) return;
    if (!window.confirm('Mark all active flats as fully paid? (Locked/closed units will remain untouched)')) return;
    const updated = flats.map(f => {
      if (f.status === 'closed' || Number(f.due) === 0) {
        return {
          ...f,
          status: 'closed',
          priorArrears: 0,
          due: 0,
          paid: 0,
          arrears: 0
        };
      }
      const due = Number(f.due) || 3000;
      const priorArr = getPriorArrears(f);
      const totalLiability = due + priorArr;
      return { ...f, paid: totalLiability, arrears: 0, status: 'paid' };
    });
    onUpdateFlats(updated);
    if (onNotify) onNotify('All active flats marked as paid! ✓ (Locked homes preserved)');
  };

  // Filtering: Strictly separates paid, arrears, and closed homes
  const filteredFlats = safeFlats.filter((f) => {
    if (!f) return false;
    if (filter === 'arrears') {
      if (f.status === 'closed') return false;
      if (!(Number(f.arrears) > 0 || Number(f.paid) < ((Number(f.due) || 0) + getPriorArrears(f)))) return false;
    }
    if (filter === 'paid') {
      if (f.status === 'closed') return false;
      if (!(Number(f.arrears) === 0 && Number(f.paid) > 0)) return false;
    }
    if (filter === 'closed') {
      if (f.status !== 'closed') return false;
    }

    if (floorFilter !== 'all') {
      const flatFloor = getFlatFloorKey(f.flat);
      if (flatFloor !== floorFilter) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchFlat = (f.flat || '').toLowerCase().includes(q);
      const matchName = (f.name || '').toLowerCase().includes(q);
      if (!matchFlat && !matchName) return false;
    }
    return true;
  });

  const processedFlats = [...filteredFlats].sort((a, b) => {
    let valA = sortField === 'priorArrears' ? getPriorArrears(a) : a[sortField];
    let valB = sortField === 'priorArrears' ? getPriorArrears(b) : b[sortField];

    if (sortField === 'due' || sortField === 'paid' || sortField === 'arrears' || sortField === 'sno' || sortField === 'priorArrears') {
      valA = Number(valA || 0);
      valB = Number(valB || 0);
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    }

    valA = String(valA || '').toLowerCase();
    valB = String(valB || '').toLowerCase();
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Linked calculations with Expenses page
  const totalExpenses = safeExpenses.reduce((sum, e) => sum + (e ? Number(e.amount || 0) : 0), 0);
  const closingBalance = totalPaid + Number(prevSavings || 0) - totalExpenses;

  return (
    <div className="space-y-6">
      {/* If editing previous month, show prominent alert banner */}
      {isPreviousMonth && !isFinalized && (
        <div className="backdrop-blur-xl bg-amber-500/15 border border-amber-400/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md no-print">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 text-xs sm:text-sm">
                {lang === 'ur'
                  ? `سابقہ مہینے (${monthName}) میں ترمیم جاری ہے`
                  : lang === 'roman'
                  ? `Previous Month (${monthName}) Edit Mode Active`
                  : `Editing Previous Month (${monthName})`}
              </h4>
              <p className="text-[11px] text-amber-800">
                {lang === 'ur'
                  ? 'تمام تبدیلیاں خودکار طریقے سے محفوظ ہو رہی ہیں۔ ترمیم مکمل ہونے پر ریکارڈ لاک کر لیں۔'
                  : lang === 'roman'
                  ? 'Tamam tabdeeli automatically disk par save ho rahi hai. Kaam khatam hone par lock kar lein.'
                  : 'All modifications are autosaved to disk. Please re-lock when finished.'}
              </p>
            </div>
          </div>
          <button
            onClick={onToggleFinalize}
            className="backdrop-blur-md bg-amber-700 hover:bg-amber-800 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs border border-amber-500/40 shrink-0 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{lang === 'ur' ? 'محفوظ اور لاک کریں' : lang === 'roman' ? 'Save & Lock Records' : 'Lock & Save'}</span>
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="erp-card rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-900 text-lg sm:text-xl flex items-center gap-2 flex-wrap">
              <span>{t.navCollections}</span>
              <span className="text-slate-400 font-light hidden sm:inline">/</span>
              <select
                value={activeMonthKey}
                onChange={(e) => onChangeMonth && onChangeMonth(e.target.value)}
                className="bg-white hover:bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-xs"
                title="Switch active month sheet"
              >
                {sortedMonthKeys.map((k) => {
                  const mData = allMonthsData[k] || {};
                  return (
                    <option key={k} value={k}>
                      📅 {k} {mData.year ? `(${mData.year})` : ''} — {mData.name || k}
                    </option>
                  );
                })}
              </select>
            </h2>
            {onOpenEditMonthModal && (
              <button
                onClick={onOpenEditMonthModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:text-blue-600 border border-slate-300 transition cursor-pointer shadow-xs ml-1"
                title="Edit Month Details (Name, Year, Date, Opening Balance) or Delete Month Sheet"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Edit / Delete Sheet</span>
              </button>
            )}

            <button
              onClick={() => onNavigate && onNavigate('bills-whatsapp')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition cursor-pointer shadow-xs ml-1"
              title="تمام فلیٹس کے ماہانہ مانگ بلز اور واٹس ایپ چٹس دیکھیں"
            >
              <span>🧾 Monthly Bills & WhatsApp (بلز سنٹر)</span>
            </button>

            {/* Feature 5: 100% Reconciled Official Stamp Badge */}
            {clashesReport.hasClashes ? (
              <button
                onClick={() => setIsClashModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 transition cursor-pointer shadow-xs"
                title="Active clashes detected! Click to inspect and reconcile"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                <span>⚠️ {clashesReport.totalCount} {clashesReport.totalCount > 1 ? 'Clashes' : 'Clash'} (Pending)</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-xs select-none print:hidden">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-100" />
                <span>🎖️ {lang === 'ur' ? 'مکمل جانچ شدہ و مصدقہ (100% Reconciled)' : '✓ 100% Reconciled & Audited'}</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2.5 mt-2">
            <p className="text-xs text-slate-500">
              {t.clickToEditHint}
            </p>
            <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs transition relative">
              <div className="relative flex items-center cursor-pointer">
                <input
                  type="date"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const [y, m, d] = val.split('-').map(Number);
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const formatted = `${d}-${months[m - 1] || 'Jan'}-${y}`;
                    if (onUpdateDate) onUpdateDate(formatted);
                  }}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                  title="Calendar se date select karein"
                />
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0 cursor-pointer" />
              </div>
              <span className="text-slate-600 font-medium text-xs select-none">
                {lang === 'ur' ? 'تاریخ:' : lang === 'roman' ? 'Tareekh:' : 'Date:'}
              </span>
              <input
                type="text"
                value={dateStr || ''}
                onChange={(e) => onUpdateDate && onUpdateDate(e.target.value)}
                className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-300 text-xs w-28 text-center focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-text"
                placeholder="e.g. 3-Oct-2026"
                title="Editable date: Is date ko aap type kar sakte hain ya calendar icon se select kar sakte hain"
              />
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Excel Table View
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Separated Cards View
            </button>
          </div>
        </div>
      </div>

      {/* Live Financial Reconciliation Bar (Connected directly with Expenses) */}
      <div className="erp-card-dark rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">{t.totalCollections} (MR)</span>
            <span className="text-sm sm:text-base font-bold font-mono text-emerald-400">
              Rs. {totalPaid.toLocaleString('en-US')}
            </span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">{t.previousSavings}</span>
            <span className="text-sm sm:text-base font-bold font-mono text-slate-200">
              Rs. {Number(prevSavings).toLocaleString('en-US')}
            </span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">{t.totalExpenses}</span>
            <span className="text-sm sm:text-base font-bold font-mono text-rose-400">
              Rs. {totalExpenses.toLocaleString('en-US')}
            </span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">{t.netSavings}</span>
            <span className={`text-sm sm:text-base font-bold font-mono ${closingBalance >= 0 ? 'text-blue-300' : 'text-rose-400'}`}>
              Rs. {closingBalance.toLocaleString('en-US')}
            </span>
          </div>
        </div>

        <button
          onClick={() => onNavigate('expenses')}
          className="w-full lg:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
        >
          <Receipt className="w-4 h-4" />
          <span>{lang === 'ur' ? 'اخراجات درج کریں ➡️' : lang === 'roman' ? 'Ikhrajat Page Par Jayein ➡️' : 'Add / View Expenses ➡️'}</span>
        </button>
      </div>

      {/* Lock Status Banner */}
      {isFinalized && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{t.lockedNotice}</span>
          </div>
          <button
            onClick={onToggleFinalize}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
          >
            {t.unlockMonth}
          </button>
        </div>
      )}

      {/* WhatsApp Group Quick Broadcast Box (Supports 2 Scenarios: Unpaid Alert vs Paid List Only FN) */}
      <div className="erp-card-dark rounded-2xl p-5 sm:p-6 text-white border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm sm:text-base">
                {broadcastMode === 'paid'
                  ? `✅ Wusool Shuda Maintenance List (${paidFlats.length} Flats Cleared)`
                  : `📢 Combined WhatsApp Group Broadcast (${unpaidFlats.length} Flats Pending)`}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {broadcastMode === 'paid'
                ? `Showing flat numbers only (FN): ${paidFlats.map(f => f.flat).join(', ')}`
                : `Pending dues alert (${unpaidFlats.length} flats pending, Rs. ${totalArrears.toLocaleString('en-US')} total)`}
            </p>
          </div>

          {/* Scenario & Format Switcher Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Scenario Switcher: Unpaid vs Paid */}
            <div className="flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-slate-700 text-xs font-medium shrink-0">
              <button
                onClick={() => {
                  setBroadcastMode('unpaid');
                  setFilter('arrears');
                }}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  broadcastMode === 'unpaid'
                    ? 'bg-rose-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📢 Unpaid Alert ({unpaidFlats.length})
              </button>
              <button
                onClick={() => {
                  setBroadcastMode('paid');
                  setFilter('paid');
                }}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  broadcastMode === 'paid'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ✅ Paid List ({paidFlats.length})
              </button>
            </div>

            {/* Format Switcher: With Details vs Only Flat Names */}
            <div className="flex items-center bg-black/40 p-1 rounded-2xl border border-white/10 text-xs font-bold shrink-0">
              <button
                onClick={() => setBroadcastDetailMode('with_details')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  broadcastDetailMode === 'with_details'
                    ? 'bg-blue-600 text-white shadow-xs font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="فلیٹ نمبر اور رہائشی کا نام اور رقم کی تفصیل کے ساتھ"
              >
                📋 With Details (نام کے ساتھ)
              </button>
              <button
                onClick={() => setBroadcastDetailMode('only_flats')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  broadcastDetailMode === 'only_flats'
                    ? 'bg-amber-600 text-white shadow-xs font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="رہائشی کا نام ظاہر نہیں ہوگا، صرف فلیٹ نمبر آئے گا"
              >
                🏢 Only Flat Names (صرف فلیٹ)
              </button>
            </div>
          </div>
        </div>

        {/* Live Message Preview Box */}
        <div className="backdrop-blur-md bg-black/35 border border-white/10 rounded-2xl p-3.5 font-mono text-xs text-slate-200 space-y-1 max-h-44 overflow-y-auto">
          {broadcastMode === 'paid' ? (
            <>
              <p className="font-bold text-emerald-300">
                ✅ *{buildingName} — Maintenance Received ({monthName})*
              </p>
              <p className="text-slate-500">-----------------------------------</p>
              <p className="text-white font-bold">
                *Payment Received From ({paidFlats.length} Flats{broadcastDetailMode === 'with_details' ? ' - With Details' : ' - Only Flat Names'}):*
              </p>
              {broadcastDetailMode === 'with_details' ? (
                paidFlats.length === 0 ? (
                  <p className="text-slate-400">None yet</p>
                ) : (
                  paidFlats.map((f, i) => (
                    <p key={f.sno} className="text-emerald-200">
                      {i + 1}. *Flat {f.flat}* ({formatResidentDisplayName(f)}): Rs. {Number(f.paid || 0).toLocaleString('en-US')} ✓
                    </p>
                  ))
                )
              ) : (
                <p className="text-emerald-200 font-bold tracking-wide">
                  {paidFlats.length > 0 ? paidFlats.map(f => f.flat).join(', ') : 'None yet'}
                </p>
              )}
              <p className="text-slate-500">-----------------------------------</p>
              <p className="text-slate-300 font-bold">
                {broadcastDetailMode === 'with_details'
                  ? `💰 *Total Collected:* Rs. ${totalPaid.toLocaleString('en-US')}`
                  : `✅ *Total Cleared Units:* ${paidFlats.length} Flats`}
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-rose-300">
                📢 *{buildingName} — Maintenance Alert ({monthName})*
              </p>
              <p className="text-slate-500">-----------------------------------</p>
              {unpaidFlats.length === 0 ? (
                <p className="text-emerald-400 font-bold">🎉 All flats cleared!</p>
              ) : (
                unpaidFlats.map((f, i) => (
                  <p key={f.sno}>
                    {broadcastDetailMode === 'with_details'
                      ? `${i + 1}. *Flat ${f.flat}* (${formatResidentDisplayName(f)}): Rs. ${Number(f.arrears || f.due).toLocaleString('en-US')}`
                      : `${i + 1}. *Flat ${f.flat}*`}
                  </p>
                ))
              )}
              {closedFlats.length > 0 && (
                <p className="text-amber-300 text-[11px] pt-1">
                  🔒 *Closed:* {closedFlats.map(c => broadcastDetailMode === 'with_details' ? `Flat ${c.flat} (${formatResidentDisplayName(c)})` : `Flat ${c.flat}`).join(', ')}
                </p>
              )}
              <p className="text-slate-500">-----------------------------------</p>
              <p className="font-bold text-rose-400">
                {broadcastDetailMode === 'with_details'
                  ? `⚠️ *Total Pending:* Rs. ${totalArrears.toLocaleString('en-US')}`
                  : `⚠️ *Total Pending Flats:* ${unpaidFlats.length} Units`}
              </p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            onClick={() => {
              const includeNames = broadcastDetailMode === 'with_details';
              if (broadcastMode === 'paid') {
                const msg = buildPaidGroupWhatsAppMessage(monthName, paidFlats, totalPaid, buildingName, lang, includeNames);
                navigator.clipboard.writeText(msg);
                if (onNotify) onNotify(`Paid Flats list (${includeNames ? 'With Details' : 'Only Flat Names'}) copied! ✓`);
              } else {
                const msg = buildShortGroupWhatsAppMessage(monthName, unpaidFlats, totalArrears, buildingName, lang, includeNames);
                navigator.clipboard.writeText(msg);
                if (onNotify) onNotify(`Unpaid Alert (${includeNames ? 'With Details' : 'Only Flat Names'}) copied! 📋`);
              }
            }}
            className="backdrop-blur-md bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-xl text-xs transition border border-white/20 shadow-xs cursor-pointer"
          >
            {t.copyMessage}
          </button>
          <button
            onClick={() => {
              const includeNames = broadcastDetailMode === 'with_details';
              if (broadcastMode === 'paid') {
                openPaidGroupWhatsApp(monthName, paidFlats, totalPaid, buildingName, lang, includeNames);
              } else {
                openGroupWhatsApp(monthName, unpaidFlats, totalArrears, buildingName, lang, includeNames);
              }
            }}
            className="backdrop-blur-md bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold py-2 px-5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30 border border-emerald-400/30 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t.openWhatsApp}</span>
          </button>

          <button
            onClick={() => setIsDigestModalOpen(true)}
            className="backdrop-blur-md bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black py-2 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30 border border-teal-300/40 cursor-pointer"
            title="Generate visual WhatsApp Group Infographic Image"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp Digest Image 🖼️</span>
          </button>

          {unpaidFlats.length > 0 && (
            <button
              onClick={() => setIsDefaultersNoticeOpen(true)}
              className="backdrop-blur-md bg-rose-600/90 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-rose-600/30 border border-rose-400/30 cursor-pointer"
              title="Generate Formal Warning Notice for Defaulters"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{lang === 'ur' ? 'وارننگ نوٹس' : lang === 'roman' ? 'Defaulters Notice' : 'Formal Notice'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Financial Clash & Discrepancy Alert Banner with Itemized Breakdown (Only for Unresolved/Unnoted Clashes) */}
      {clashesReport.hasUnresolvedClashes && (
        <div className="backdrop-blur-xl bg-gradient-to-r from-rose-950/95 via-red-900/90 to-amber-950/95 border-2 border-rose-500/80 rounded-3xl p-4 sm:p-5 text-white shadow-2xl shadow-rose-950/40 animate-fade-in flex flex-col gap-3.5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/30 border border-rose-400/50 flex items-center justify-center shrink-0 shadow-inner">
                <ShieldAlert className="w-7 h-7 text-rose-300 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-black text-sm sm:text-base text-rose-100 tracking-wide flex items-center gap-2">
                    <span>🚨 {clashesReport.unresolvedCount} Financial Clash{clashesReport.unresolvedCount > 1 ? 'es' : ''} Detected!</span>
                    <span className="text-[11px] bg-rose-500/40 text-rose-200 border border-rose-400/40 px-2.5 py-0.5 rounded-full font-mono">
                      Auto-Correct Disabled ✋
                    </span>
                  </h4>
                </div>
                <p className="text-xs text-rose-200/90 leading-relaxed max-w-2xl">
                  System ne auto-correct <strong>nahi kiya</strong>. Har unresolved error ki mukammal wazahat neechay darj hai:
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
              <button
                onClick={() => setIsClashModalOpen(true)}
                className="w-full md:w-auto px-4 py-2.5 rounded-2xl font-black text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40 border border-rose-300/40 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Tafseel Audit & Quick Fix ({clashesReport.unresolvedCount})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Itemized Direct Error Breakdown - Unnoted Clashes Only */}
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
                      <span className="text-[11px] text-rose-300 font-normal">({formatResidentDisplayName(c.name)})</span>
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
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold text-white cursor-pointer shadow-xs transition ${
                      c.hasAdjustmentNote ? 'bg-blue-600 hover:bg-blue-500' : 'bg-rose-600 hover:bg-rose-500'
                    }`}
                  >
                    {c.hasAdjustmentNote ? 'Edit Note' : 'Fix / Add Note'}
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
          </div>
        </div>
      )}

      {/* View Mode: Grid (Excel Table) */}
      {viewMode === 'grid' && (
        <div className="erp-card rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
          {/* Controls Bar: Search, Filter Tabs, Quick Mark */}
          <div className="bg-slate-900 text-white p-3 sm:p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-800">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-56">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-slate-800 text-white placeholder-slate-400 text-xs py-1.5 px-3 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center bg-slate-800/90 p-0.5 rounded-lg text-xs border border-slate-700">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${filter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                  >
                    {t.tabAllFlats} ({flats.length})
                  </button>
                  <button
                    onClick={() => {
                      setFilter('arrears');
                      setBroadcastMode('unpaid');
                    }}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${filter === 'arrears' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                  >
                    {t.tabUnpaidOnly} ({unpaidFlats.length})
                  </button>
                  <button
                    onClick={() => {
                      setFilter('paid');
                      setBroadcastMode('paid');
                    }}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${filter === 'paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                  >
                    {t.tabPaidOnly} ({paidFlats.length})
                  </button>
                  <button
                    onClick={() => setFilter('closed')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${filter === 'closed' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
                    title="Locked / Closed Units (Controlled via Residents Directory RD)"
                  >
                    🔒 Locked ({closedFlats.length})
                  </button>
                </div>

                {/* Floor Selector Filter */}
                <select
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                  className="bg-slate-900/80 text-white text-xs font-bold py-1 px-2.5 rounded-xl border border-white/20 focus:outline-none cursor-pointer"
                  title="فلور منتخب کریں (Filter by Floor)"
                >
                  <option value="all">تمام فلورز (All Floors)</option>
                  <option value="G">Ground Floor (G)</option>
                  <option value="F">1st Floor (F)</option>
                  <option value="S">2nd Floor (S)</option>
                  <option value="T">3rd Floor (T)</option>
                  <option value="P">4th Floor (P)</option>
                  <option value="Shop">دکانات (Shops)</option>
                </select>
              </div>
            </div>

            {/* Quick Actions Group */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFloorModalOpen(true)}
                className="backdrop-blur-md bg-indigo-500/25 hover:bg-indigo-500/40 text-indigo-100 text-xs font-bold py-1.5 px-3 rounded-xl transition flex items-center gap-1.5 border border-indigo-400/40 shrink-0 cursor-pointer shadow-xs"
                title="منزل بہ منزل وصولی و بقایا رپورٹ (Floor-Wise Analytics)"
              >
                <span>🏢 فلور رپورٹ</span>
              </button>

              {onSyncChainBalances && (
                <button
                  onClick={onSyncChainBalances}
                  className="backdrop-blur-md bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold py-1.5 px-3 rounded-xl transition flex items-center gap-1.5 border border-white/15 shrink-0 cursor-pointer"
                  title="Re-calculate and auto-link closing balances across all chronological months"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Sync Balances</span>
                </button>
              )}

              {/* Quick Mark All Paid */}
              {!isFinalized && (
                <button
                  onClick={handleMarkAllPaid}
                  className="backdrop-blur-md bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold py-1.5 px-3 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30 border border-emerald-400/30 shrink-0 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{t.markAllPaid}</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="glass-table-head text-slate-700 border-b border-slate-200 text-xs font-black uppercase tracking-wide select-none">
                <tr>
                  <th onClick={() => handleSort('sno')} className="p-3 text-center w-12 border-r border-slate-200/60 cursor-pointer hover:bg-slate-200/60">
                    <div className="flex items-center justify-center gap-1">
                      <span>{t.thSno}</span>
                      {sortField === 'sno' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('flat')} className="p-3 text-center w-24 border-r border-slate-200/60 cursor-pointer hover:bg-slate-200/60">
                    <div className="flex items-center justify-center gap-1">
                      <span>{t.thFlat}</span>
                      {sortField === 'flat' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('name')} className="p-3 border-r border-slate-200/60 min-w-[150px] cursor-pointer hover:bg-slate-200/60">
                    <div className="flex items-center gap-1">
                      <span>{t.thResident}</span>
                      {sortField === 'name' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('priorArrears')} className="p-3 text-center w-28 border-r border-slate-200/60 cursor-pointer hover:bg-slate-200/60 text-amber-700" title="Unpaid arrears carried over from past months">
                    <div className="flex items-center justify-center gap-1">
                      <span>{t.thPriorArrears || 'Prior Arrears'}</span>
                      {sortField === 'priorArrears' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-600" /> : <ArrowDown className="w-3 h-3 text-amber-600" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('due')} className="p-3 text-center w-28 border-r border-slate-200/60 cursor-pointer hover:bg-slate-200/60">
                    <div className="flex items-center justify-center gap-1">
                      <span>{t.thMonthlyDue}</span>
                      {sortField === 'due' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('paid')} className="p-3 text-center w-32 border-r border-slate-200/60 cursor-pointer hover:bg-slate-200/60">
                    <div className="flex items-center justify-center gap-1">
                      <span>{t.thPaid}</span>
                      {sortField === 'paid' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('arrears')} className="p-3 text-center w-28 border-r border-slate-200/60 cursor-pointer hover:bg-slate-200/60 text-rose-700">
                    <div className="flex items-center justify-center gap-1">
                      <span>{t.thArrears}</span>
                      {sortField === 'arrears' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-rose-600" /> : <ArrowDown className="w-3 h-3 text-rose-600" />)}
                    </div>
                  </th>
                  <th className="p-3 text-center w-36 border-r border-slate-200/60">{t.thStatus}</th>
                  <th className="p-3 text-center min-w-[190px] max-w-[280px] border-r border-slate-200/60" title="ایڈجسٹمنٹ اور کام کی تفصیلات (Adjustment notes & reasons for actual sheet)">
                    <div className="flex items-center justify-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>تفصیلات (Notes)</span>
                    </div>
                  </th>
                  <th className="p-3 text-center w-24 no-print">{t.thActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {processedFlats.map((flat) => {
                  const originalIndex = flats.findIndex((f) => f.sno === flat.sno);
                  const isClosed = flat.status === 'closed';
                  const priorArr = getPriorArrears(flat);
                  const due = Number(flat.due) || 0;
                  const paid = Number(flat.paid) || 0;
                  const totalLiability = due + priorArr;
                  const arrears = Number(flat.arrears) || 0;
                  const trueAdvance = getTrueAdvance(flat);
                  const hasArrears = !isClosed && arrears > 0;
                  const isMonthlyPaid = !isClosed && paid >= due;
                  const isPartialPaid = !isClosed && paid > 0 && paid < totalLiability;
                  const consecutive = getConsecutivePastUnpaidMonths(flat, allMonthsData, sortedMonthKeys, activeMonthKey);
                  const aging = getAgingClassification(flat, priorArr, due, arrears, consecutive.count);

                  // Real-time Flat Clash Checker
                  const currentMonthIdx = sortedMonthKeys.indexOf(activeMonthKey);
                  const prevMonthKey = currentMonthIdx > 0 ? sortedMonthKeys[currentMonthIdx - 1] : null;
                  const prevMonthData = prevMonthKey ? allMonthsData[prevMonthKey] : null;
                  const prevMonthFlat = prevMonthData?.flats?.find(pf => pf.flat === flat.flat || pf.sno === flat.sno) || null;
                  const flatClashList = checkFlatClashes(flat, prevMonthFlat);
                  const hasClash = flatClashList.length > 0;
                  const liabilityClash = flatClashList.find(c => c.category === 'liability_mismatch');
                  const priorBreakClash = flatClashList.find(c => c.category === 'prior_arrears_break');
                  const closedClash = flatClashList.find(c => c.category === 'closed_flat_activity');

                  return (
                    <tr
                      key={flat.sno}
                      className={`hover:bg-blue-50/50 transition ${
                        hasClash
                          ? 'bg-rose-50/90 ring-1 ring-rose-400/80 shadow-xs'
                          : isClosed
                          ? 'bg-amber-50/60 text-amber-900'
                          : isMonthlyPaid && hasArrears
                          ? 'bg-amber-50/40'
                          : isMonthlyPaid
                          ? 'bg-emerald-50/30'
                          : 'bg-rose-50/40'
                      }`}
                    >
                      {/* S.No */}
                      <td className="p-2 text-center text-slate-400 font-bold border-r border-slate-200">
                        {flat.sno}
                      </td>

                      {/* Flat No (Managed via RD) */}
                      <td className="p-2.5 text-center border-r border-slate-200 select-none">
                        <div className="flex items-center justify-center gap-1">
                          <span className="inline-block font-mono font-black text-slate-900 bg-slate-100/90 hover:bg-slate-200/80 px-2 py-0.5 rounded-lg border border-slate-300/80 text-xs shadow-2xs">
                            {flat.flat}
                          </span>
                          {hasClash && (
                            <button
                              onClick={() => setIsClashModalOpen(true)}
                              className={`inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-xs transition cursor-pointer ${
                                flatClashList.some(c => c.hasAdjustmentNote)
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                              }`}
                              title={flatClashList.map(c => c.messageRoman).join('\n')}
                            >
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>{flatClashList.some(c => c.hasAdjustmentNote) ? 'Note' : 'Clash'}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Resident Name (Managed via RD) */}
                      <td className="p-2.5 border-r border-slate-200 select-none">
                        <div className="flex items-center justify-between gap-1.5">
                          <div>
                            <span className="font-extrabold text-slate-900 text-xs sm:text-sm block">
                              {formatResidentDisplayName(flat) || 'Resident'}
                            </span>
                            {flat.adjustmentNote && (
                              <span 
                                className="inline-flex items-center gap-1 text-[10px] text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md font-semibold cursor-help mt-0.5"
                                title={`ایڈجسٹمنٹ نوٹ: ${flat.adjustmentNote}`}
                              >
                                📝 {flat.adjustmentNote.length > 20 ? `${flat.adjustmentNote.slice(0, 20)}...` : flat.adjustmentNote}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold px-1.5 py-0.5 rounded bg-slate-100/90 border border-slate-200" title="Resident Name is managed exclusively in Residents Directory (RD)">
                            RD
                          </span>
                        </div>
                      </td>

                      {/* Prior Arrears (سابقہ بقایا) */}
                      <td className="p-0 border-r border-slate-200">
                        <input
                          type="number"
                          value={isClosed ? '' : (priorArr || '')}
                          disabled={isClosed || isFinalized}
                          onChange={(e) => handleCellChange(originalIndex, 'priorArrears', e.target.value)}
                          className={`cell-input text-center font-bold ${
                            isClosed || isFinalized
                              ? 'bg-amber-100/50 text-slate-400 cursor-not-allowed'
                              : priorBreakClash
                              ? 'text-amber-950 bg-amber-100 font-black ring-2 ring-amber-500'
                              : priorArr > 0
                              ? 'text-amber-800 bg-amber-50/70 font-black'
                              : 'text-slate-400'
                          }`}
                          placeholder={isClosed ? '-' : '—'}
                          title={priorBreakClash ? priorBreakClash.messageRoman : priorArr > 0 ? `Prior Arrears: Rs. ${priorArr.toLocaleString('en-US')}` : 'No prior arrears'}
                        />
                      </td>

                      {/* Monthly Due */}
                      <td className="p-0 border-r border-slate-200">
                        <input
                          type="number"
                          value={isClosed ? '' : (flat.due ?? '')}
                          disabled={isClosed || isFinalized}
                          onChange={(e) => handleCellChange(originalIndex, 'due', e.target.value)}
                          className={`cell-input text-center font-bold text-slate-700 ${isClosed || isFinalized ? 'bg-amber-100/50 text-slate-400 cursor-not-allowed' : ''}`}
                          placeholder={isClosed ? '-' : '3000'}
                        />
                      </td>

                      {/* Collected / Paid */}
                      <td className="p-0 border-r border-slate-200">
                        <div className="flex flex-col items-center justify-center">
                          <input
                            type="number"
                            value={isClosed ? '' : (flat.paid ?? '')}
                            disabled={isClosed || isFinalized}
                            onChange={(e) => handleCellChange(originalIndex, 'paid', e.target.value)}
                            className={`cell-input text-center font-black ${
                              isClosed || isFinalized
                                ? 'bg-amber-100/50 text-slate-400 cursor-not-allowed'
                                : closedClash
                                ? 'text-rose-950 bg-rose-200 font-black ring-2 ring-rose-500'
                                : isMonthlyPaid
                                ? 'text-emerald-700 font-extrabold'
                                : 'text-rose-700 font-extrabold'
                            }`}
                            placeholder={isClosed ? 'Closed' : '0'}
                          />
                          {!isClosed && paid > 0 && (
                            <div className="w-full flex items-center justify-center gap-0.5 text-[10px] text-slate-500 font-mono pb-0.5 bg-slate-50/70 border-t border-slate-200/60">
                              <span title="Tareekh-e-Wusooli">📅</span>
                              <input
                                type="text"
                                value={flat.paidDate || dateStr || ''}
                                disabled={isClosed || isFinalized}
                                onChange={(e) => handleCellChange(originalIndex, 'paidDate', e.target.value)}
                                placeholder="Date"
                                className="w-20 text-center bg-transparent border-b border-dashed border-slate-300 focus:border-purple-600 focus:outline-none text-[10px] font-bold text-slate-700"
                                title="Tareekh-e-Wusooli (Editable Payment Date)"
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Arrears */}
                      <td className="p-0 border-r border-slate-200">
                        <input
                          type="number"
                          value={isClosed ? '' : (flat.arrears ?? '')}
                          disabled={isClosed || isFinalized}
                          onChange={(e) => handleCellChange(originalIndex, 'arrears', e.target.value)}
                          className={`cell-input text-center font-extrabold ${
                            isClosed || isFinalized
                              ? 'bg-amber-100/50 text-slate-400 cursor-not-allowed'
                              : liabilityClash
                              ? 'text-rose-950 bg-rose-200/90 font-black ring-2 ring-rose-500 shadow-inner'
                              : Number(flat.arrears) > 0
                              ? 'text-rose-700 bg-rose-50/70 font-black'
                              : 'text-slate-400'
                          }`}
                          placeholder={isClosed ? '-' : '0'}
                          title={liabilityClash ? `${liabilityClash.title}: ${liabilityClash.messageRoman}` : undefined}
                        />
                      </td>

                      {/* Status Badge */}
                      <td className="p-2 text-center border-r border-slate-200">
                        {isClosed ? (
                          <span className="inline-block bg-amber-500/20 text-amber-900 border border-amber-400/40 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            🔒 {t.statusClosed}
                          </span>
                        ) : arrears === 0 ? (
                          trueAdvance > 0 ? (
                            <span className="inline-block bg-cyan-500/20 text-cyan-900 border border-cyan-400/50 text-xs font-black px-2.5 py-0.5 rounded-full" title={`Advance Paid! Rs. ${trueAdvance.toLocaleString('en-US')} advance credited for next month`}>
                              ⭐ Advance (+Rs. {trueAdvance.toLocaleString('en-US')})
                            </span>
                          ) : priorArr > 0 ? (
                            <span className="inline-block bg-emerald-600/20 text-emerald-950 border border-emerald-400/50 text-xs font-black px-2.5 py-0.5 rounded-full" title={`Previous pending arrears of Rs. ${priorArr.toLocaleString('en-US')} fully settled!`}>
                              ✓ Paid (سابقہ کلیئر)
                            </span>
                          ) : (
                            <span className="inline-block bg-emerald-500/20 text-emerald-800 border border-emerald-400/40 text-xs font-black px-2.5 py-0.5 rounded-full">
                              ✓ Fully Paid
                            </span>
                          )
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1">
                            {isMonthlyPaid ? (
                              <span className="inline-block bg-amber-500/20 text-amber-900 border border-amber-400/40 text-[11px] font-bold px-2 py-0.5 rounded-full" title={`Monthly fee paid! Leftover balance: Rs. ${arrears.toLocaleString('en-US')}`}>
                                ✓ Monthly (Rs. {arrears.toLocaleString('en-US')} سابقہ باقی)
                              </span>
                            ) : isPartialPaid ? (
                              <span className="inline-block bg-rose-500/20 text-rose-800 border border-rose-400/40 text-[11px] font-bold px-2 py-0.5 rounded-full">
                                ⚠️ Partial (Rs. {arrears.toLocaleString('en-US')})
                              </span>
                            ) : (
                              <span className="inline-block bg-rose-500/20 text-rose-800 border border-rose-400/40 text-[11px] font-bold px-2 py-0.5 rounded-full">
                                ⚠️ Unpaid
                              </span>
                            )}
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md inline-flex items-center gap-1 font-black ${aging.softBadgeClass}`}
                              title={aging.labelEn}
                            >
                              <span>⏳ {aging.shortLabel}</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* تفصیلات (Adjustment Note / Details - Appears directly in actual sheet & Excel) */}
                      <td className="p-2 border-r border-slate-200 text-xs">
                        {flat.adjustmentNote || flat.notes ? (
                          <div className="group relative bg-blue-50/90 border border-blue-200/90 rounded-xl p-2 text-blue-950 flex items-start justify-between gap-1.5 shadow-2xs">
                            <div className="flex items-start gap-1 overflow-hidden">
                              <span className="text-blue-600 shrink-0 mt-0.5">📝</span>
                              <span className="font-semibold leading-tight text-[11px] text-slate-800 break-words" title={flat.adjustmentNote || flat.notes}>
                                {flat.adjustmentNote || flat.notes}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => openAdjustmentSlipWhatsApp(flat, monthName, buildingName, flat.adjustmentNote || flat.notes, lang, dateStr)}
                                className="p-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-md transition cursor-pointer"
                                title="Send WhatsApp Adjustment Slip (تفصیلی وضاحتی سلپ)"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                              </button>
                              {!isFinalized && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingNoteFlat(flat);
                                    setNoteInputText(flat.adjustmentNote || flat.notes || '');
                                  }}
                                  className="opacity-70 group-hover:opacity-100 p-1 text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded-md transition cursor-pointer"
                                  title="Edit note"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            {!isFinalized ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNoteFlat(flat);
                                  setNoteInputText('');
                                }}
                                className="text-[10px] font-bold text-slate-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg border border-dashed border-slate-300 transition cursor-pointer flex items-center gap-1"
                                title="Add adjustment note (e.g. gutter, electrician, advance etc.)"
                              >
                                <span>+ نوٹ درج کریں</span>
                              </button>
                            ) : (
                              <span className="text-slate-300 text-center block">-</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-2 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          {isClosed ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-black text-amber-900 bg-amber-500/20 border border-amber-400/50 px-2.5 py-1 rounded-xl shadow-2xs select-none"
                              title="Yeh flat بند گھر (Locked) hai. Isko sirf Residents Directory (RD) se khola ya band kiya ja sakta hai."
                            >
                              <Lock className="w-3 h-3 text-amber-700" />
                              <span>بند (RD)</span>
                            </span>
                          ) : (
                            <>
                              {/* Quick pay button */}
                              <button
                                onClick={() => setQuickPaid(originalIndex)}
                                disabled={isFinalized}
                                className={`font-bold p-1.5 rounded-xl text-xs transition border ${
                                  isFinalized
                                    ? 'opacity-30 cursor-not-allowed bg-slate-200 text-slate-400 border-transparent'
                                    : isMonthlyPaid && !hasArrears
                                    ? 'bg-emerald-600 text-white shadow-xs border-emerald-500'
                                    : isMonthlyPaid && hasArrears
                                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs border-amber-400'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs border-emerald-400'
                                }`}
                                title={
                                  isMonthlyPaid && hasArrears
                                    ? `Monthly paid! Flat ${flat.flat} has Rs. ${flat.arrears} balance remaining (click to clear balance)`
                                    : isMonthlyPaid
                                    ? `Fully cleared`
                                    : `Mark monthly maintenance as paid`
                                }
                              >
                                {isMonthlyPaid && !hasArrears ? (
                                  <CheckCheck className="w-3.5 h-3.5" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Digital Payment Receipt */}
                              <button
                                onClick={() => setReceiptModalFlat(flat)}
                                className="font-bold p-1.5 rounded-xl text-xs transition bg-blue-500/10 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-300/40 hover:border-blue-600 shadow-2xs cursor-pointer"
                                title={lang === 'ur' ? 'رسید بنائیں اور واٹس ایپ کریں' : 'Generate Payment Receipt & WhatsApp'}
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>

                              {/* Resident Individual Ledger & Statement */}
                              <button
                                onClick={() => setSelectedLedgerFlat(flat)}
                                className="font-bold p-1.5 rounded-xl text-xs transition bg-purple-500/10 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-300/40 hover:border-purple-600 shadow-2xs cursor-pointer"
                                title={lang === 'ur' ? 'رہائشی کا مکمل کھاتہ / لیجر' : 'Resident Individual Ledger & Statement'}
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                              </button>

                              {/* Overdue Aging Reminder WhatsApp */}
                              {hasArrears && (
                                <button
                                  onClick={() => {
                                    openAgingReminderWhatsApp(flat, aging.category, monthName, buildingName, lang);
                                    if (onRecordDefaulterNotice) {
                                      onRecordDefaulterNotice({
                                        flat: flat.flat,
                                        name: flat.name,
                                        phone: flat.phone,
                                        agingCategory: aging.category,
                                        arrears: flat.arrears,
                                        noticeType: `${aging.labelEn || aging.shortLabel} Notice`
                                      });
                                    }
                                  }}
                                  className={`font-bold p-1.5 rounded-xl text-xs transition border shadow-2xs cursor-pointer ${
                                    aging.category === '4m+' || aging.category === '90d+'
                                      ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 animate-pulse'
                                      : aging.category === '3m' || aging.category === '60-90d'
                                      ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600'
                                      : aging.category === '2m' || aging.category === '30-60d'
                                      ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600'
                                      : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                                  }`}
                                  title={`Send ${aging.labelRoman} WhatsApp Notice to Flat ${flat.flat}`}
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total Footer Row */}
              <tfoot className="glass-table-head font-black border-t-2 border-slate-300 text-slate-900 text-xs sm:text-sm">
                <tr>
                  <td colSpan="3" className="p-3 text-center text-blue-950 font-black">
                    Total Summary
                  </td>
                  <td className="p-3 text-center text-amber-800 border-r border-slate-200/60 font-black text-sm">
                    Rs. {Number(totalPriorArrears).toLocaleString('en-US')}
                  </td>
                  <td className="p-3 text-center text-slate-800 border-r border-slate-200/60 font-bold">
                    Rs. {Number(totalDue).toLocaleString('en-US')}
                  </td>
                  <td className="p-3 text-center text-emerald-800 border-r border-slate-200/60 font-black text-base">
                    Rs. {Number(totalPaid).toLocaleString('en-US')}
                  </td>
                  <td className="p-3 text-center text-rose-700 border-r border-slate-200/60 font-black text-base">
                    Rs. {Number(totalArrears).toLocaleString('en-US')}
                  </td>
                  <td colSpan="2" className="p-3 text-center text-xs">
                    {totalAdvance > 0 ? (
                      <span className="inline-flex items-center gap-1 font-black text-cyan-900 bg-cyan-100/90 border border-cyan-300 px-2.5 py-1 rounded-lg">
                        ⭐ Real Advance: Rs. {totalAdvance.toLocaleString('en-US')}
                      </span>
                    ) : (
                      <span className="text-slate-600 font-bold">{flats.length} flats</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Bottom Bar: Residents Directory Navigation */}
          <div className="p-3.5 backdrop-blur-md bg-white/40 border-t border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 no-print">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-bold text-slate-800">🏢 Residents Directory (RD):</span>
              <span className="text-slate-500">
                {lang === 'ur'
                  ? 'رہائشیوں کے نام، فون نمبر اور فلیٹ کی تفصیلات Residents Directory (RD) سے کنٹرول ہوتی ہیں۔'
                  : lang === 'roman'
                  ? 'Resident ke naam, phone aur flat status Residents Directory (RD) se manage hote hain.'
                  : 'Resident names, phone and occupancy status are managed in Residents Directory (RD).'}
              </span>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('residents')}
              className="backdrop-blur-md bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
            >
              <span>{lang === 'ur' ? 'ڈائریکٹری کھولیں (RD) ➡️' : lang === 'roman' ? 'Open RD ➡️' : 'Residents Directory ➡️'}</span>
            </button>
          </div>
        </div>
      )}

      {/* View Mode: Cards (Separated Unpaid & Paid) */}
      {viewMode === 'cards' && (
        <div className="space-y-6">
          {/* Unpaid Section */}
          <div className="erp-card rounded-2xl p-5 sm:p-6 border border-rose-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <h3 className="font-bold text-rose-950 text-base">
                  {t.tabUnpaidOnly} ({unpaidFlats.length} Flats Pending)
                </h3>
              </div>
              <span className="text-sm font-bold text-rose-600 font-mono">
                Total Arrears: Rs. {totalArrears.toLocaleString('en-US')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
              {unpaidFlats.map((flat) => {
                const originalIndex = flats.findIndex((f) => f.sno === flat.sno);
                const priorArr = getPriorArrears(flat);
                const due = Number(flat.due) || 3000;
                const arrears = Number(flat.arrears || Math.max(0, due - Number(flat.paid || 0)));
                const consecutive = getConsecutivePastUnpaidMonths(flat, allMonthsData, sortedMonthKeys, activeMonthKey);
                const aging = getAgingClassification(flat, priorArr, due, arrears, consecutive.count);
                return (
                  <div
                    key={flat.sno}
                    className="p-4 rounded-2xl border border-rose-300/40 backdrop-blur-md bg-rose-50/50 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-rose-600 text-white text-xs font-black px-2.5 py-0.5 rounded-lg shadow-2xs">
                            Flat {flat.flat}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${aging.softBadgeClass}`}>
                            {aging.shortLabel}
                          </span>
                        </div>
                        <span className="text-xs font-black text-rose-700">
                          Rs. {arrears.toLocaleString('en-US')} Due
                        </span>
                      </div>
                      <p className="font-bold text-slate-800 text-sm mt-2">
                        {formatResidentDisplayName(flat) || 'Resident Name'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Monthly: Rs. {due.toLocaleString('en-US')} | Paid: Rs. {Number(flat.paid || 0).toLocaleString('en-US')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isFinalized && (
                        <button
                          onClick={() => setQuickPaid(originalIndex)}
                          className="flex-1 backdrop-blur-md bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20 border border-emerald-400/30 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Quick Mark Paid</span>
                        </button>
                      )}
                      <button
                        onClick={() => setReceiptModalFlat(flat)}
                        className="p-1.5 rounded-xl text-xs transition bg-blue-500/10 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-300/40 hover:border-blue-600 shadow-2xs cursor-pointer"
                        title="Payment Receipt & WhatsApp"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedLedgerFlat(flat)}
                        className="p-1.5 rounded-xl text-xs transition bg-purple-500/10 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-300/40 hover:border-purple-600 shadow-2xs cursor-pointer"
                        title="Resident Individual Ledger & Statement"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          openAgingReminderWhatsApp(flat, aging.category, monthName, buildingName, lang);
                          if (onRecordDefaulterNotice) {
                            onRecordDefaulterNotice({
                              flat: flat.flat,
                              name: flat.name,
                              phone: flat.phone,
                              agingCategory: aging.category,
                              arrears: flat.arrears,
                              noticeType: `${aging.labelEn || aging.shortLabel} Notice`
                            });
                          }
                        }}
                        className={`p-1.5 rounded-xl text-xs transition border shadow-2xs cursor-pointer ${
                          aging.category === '4m+' || aging.category === '90d+'
                            ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700'
                            : aging.category === '3m' || aging.category === '60-90d'
                            ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600'
                            : aging.category === '2m' || aging.category === '30-60d'
                            ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600'
                            : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                        }`}
                        title={`Send ${aging.labelRoman} Reminder via WhatsApp`}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Paid Section */}
          <div className="erp-card rounded-2xl p-5 sm:p-6 border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <h3 className="font-bold text-emerald-950 text-base">
                  {t.tabPaidOnly} ({paidFlats.length} Flats Cleared)
                </h3>
              </div>
              <span className="text-sm font-bold text-emerald-700 font-mono">
                Total Collected: Rs. {totalPaid.toLocaleString('en-US')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
              {paidFlats.map((flat) => {
                const priorArr = getPriorArrears(flat);
                const trueAdv = getTrueAdvance(flat);
                return (
                  <div
                    key={flat.sno}
                    className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-center space-y-1 shadow-2xs hover:shadow-xs transition"
                  >
                    <span className="inline-block bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-xs">
                      Flat {flat.flat}
                    </span>
                    <p className="font-semibold text-slate-800 text-xs truncate">
                      {formatResidentDisplayName(flat)}
                    </p>
                    <div className="pt-1 flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center justify-center gap-1.5">
                        <p className="text-[11px] font-bold font-mono text-emerald-700">
                          Rs. {Number(flat.paid).toLocaleString('en-US')} ✓
                        </p>
                        <button
                          onClick={() => setReceiptModalFlat(flat)}
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="Payment Receipt & WhatsApp"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedLedgerFlat(flat)}
                          className="p-1 rounded-md text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                          title="Resident Individual Ledger & Statement"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {priorArr > 0 && (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 rounded">
                          سابقہ کلیئر
                        </span>
                      )}
                      {trueAdv > 0 && (
                        <span className="text-[10px] font-semibold text-cyan-800 bg-cyan-100 border border-cyan-200 px-1.5 py-0.2 rounded">
                          +Rs. {trueAdv.toLocaleString('en-US')} Adv
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Locked / Closed Units Section */}
          {closedFlats.length > 0 && (
            <div className="erp-card rounded-2xl p-5 sm:p-6 border border-amber-200 shadow-xs bg-amber-50/30">
              <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔒</span>
                  <h3 className="font-bold text-amber-950 text-base">
                    Locked / Closed Units ({closedFlats.length} Vacant)
                  </h3>
                </div>
                <button
                  onClick={() => onNavigate('residents')}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Manage in Residents Directory (RD) ➡️</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
                {closedFlats.map((flat) => (
                  <div
                    key={flat.sno}
                    className="p-3.5 rounded-2xl border border-amber-300/40 backdrop-blur-md bg-amber-50/70 text-center space-y-1 shadow-xs"
                  >
                    <span className="inline-block bg-amber-800 text-white text-xs font-black px-2.5 py-0.5 rounded-lg shadow-2xs">
                      Flat {flat.flat}
                    </span>
                    <p className="font-bold text-slate-800 text-xs truncate">
                      {formatResidentDisplayName(flat)}
                    </p>
                    <span className="inline-block text-[11px] font-black text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-md">
                      🔒 بند گھر
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2 Call to Action: Add Expenses (Replaces Finalize on MR) */}
      <div className="backdrop-blur-2xl bg-gradient-to-r from-blue-950/90 via-indigo-950/90 to-slate-950/90 rounded-3xl p-6 text-white shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 no-print border border-blue-400/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="font-black text-sm sm:text-base">
              {lang === 'ur'
                ? 'اگلا مرحلہ: بلڈنگ کے اخراجات درج کریں (Add Expenses)'
                : lang === 'roman'
                ? 'Agla Marhala: Building Ke Ikhrajat Darj Karein (Add Expenses)'
                : 'Next Step: Record Building Expenses'}
            </h3>
          </div>
          <p className="text-xs text-blue-200">
            {lang === 'ur'
              ? `فلیٹس کی وصولی مکمل ہو چکی ہے۔ اب بجلی، موٹر، جمعدار وغیرہ کے اخراجات درج کرنے کے لیے آگے بڑھیں۔ (کُل وصولی: Rs. ${totalPaid.toLocaleString('en-US')})`
              : lang === 'roman'
              ? `Flats ki wusooli mukammal karne ke baad ab ikhrajat darj karein. (Kul Wusooli: Rs. ${totalPaid.toLocaleString('en-US')})`
              : `Flat collection register updated. Proceed to record utility and maintenance bills. (Total Collected: Rs. ${totalPaid.toLocaleString('en-US')})`}
          </p>
        </div>

        <button
          onClick={() => onNavigate('expenses')}
          className="backdrop-blur-md bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-6 rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 border border-emerald-300/40 shrink-0 w-full sm:w-auto"
        >
          <Receipt className="w-4 h-4" />
          <span>{lang === 'ur' ? 'اخراجات درج کریں ➡️' : lang === 'roman' ? 'Ikhrajat Darj Karein ➡️' : 'Add Expenses ➡️'}</span>
        </button>
      </div>

      {/* Digital Payment Receipt Modal */}
      {renderReceiptModal()}

      {/* Defaulters Formal Warning Notice Modal */}
      {renderDefaultersNoticeModal()}

      {/* WhatsApp Group Digest Infographic Modal */}
      <WhatsAppDigestModal
        isOpen={isDigestModalOpen}
        onClose={() => setIsDigestModalOpen(false)}
        monthName={monthName}
        dateStr={dateStr}
        buildingName={buildingName}
        flats={flats}
        expenses={expenses}
        prevSavings={prevSavings}
        lang={lang}
        onNotify={onNotify}
      />

      {/* Resident Individual Ledger & Statement Modal */}
      <ResidentLedgerModal
        isOpen={Boolean(selectedLedgerFlat)}
        onClose={() => setSelectedLedgerFlat(null)}
        flat={selectedLedgerFlat}
        allMonthsData={allMonthsData}
        monthOrder={monthOrder}
        onUpdateMonthFlat={onUpdateMonthFlats}
        flatsList={residentDirectory.length > 0 ? residentDirectory : flats}
        onSelectFlat={setSelectedLedgerFlat}
        buildingName={buildingName}
        lang={lang}
        onNotify={onNotify}
      />

      {/* Quick Adjustment Note Modal for Actual Sheet */}
      {editingNoteFlat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in no-print-overlay">
          <div className="bg-white rounded-3xl border border-blue-200 shadow-2xl max-w-lg w-full p-6 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-blue-600 text-white">
                  {editingNoteFlat.flat}
                </span>
                <h3 className="font-black text-base text-slate-900">
                  {formatResidentDisplayName(editingNoteFlat)} — ایڈجسٹمنٹ نوٹ (Actual Sheet Note)
                </h3>
              </div>
              <button
                onClick={() => setEditingNoteFlat(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              اگر یہ ادائیگی یا بقایا کسی کام (مثلاً گٹر کا کام، الیکٹریشن، موٹر، یا کٹوتی) میں ایڈجسٹ ہوئی ہے، تو یہاں نوٹ لکھیں۔ یہ نوٹ ایکسل شیٹ کے کالم A (تفصیلات) اور رجسٹر دونوں میں ظاہر ہوگا۔
            </p>

            <textarea
              rows={3}
              value={noteInputText}
              onChange={(e) => setNoteInputText(e.target.value)}
              placeholder="مثال: گٹر کا کام 700 کا ہوا اور الیکٹریشن کا 500، 1000 روپے دیے تو 200 ایڈجسٹ کر کے اب 300 بقایا لکھے ہیں..."
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-2xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white resize-none"
              autoFocus
            />

            {/* Quick 1-Click Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400">⚡ پری سیٹس:</span>
              {[
                'گٹر و پلمبنگ کے کام میں رقم ایڈجسٹ ہوئی',
                'الیکٹریشن و سامان مرمت کی مد میں کٹوتی',
                'پیشگی ادائیگی / باہمی طے شدہ رعایت',
                'عمارت کے ہنگامی کام پر رہائشی کا خرچہ ہوا'
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setNoteInputText(prev => prev ? `${prev} | ${preset}` : preset);
                    if (!contraDesc) {
                      setContraDesc(preset);
                    }
                  }}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 border border-slate-200 transition cursor-pointer"
                >
                  + {preset}
                </button>
              ))}
            </div>

            {/* Feature 1: Expense-to-Flat Auto Contra Entry (Fully Editable) */}
            <div className="bg-amber-50/80 border border-amber-300/80 rounded-2xl p-3 space-y-2.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={contraEnabled}
                  onChange={(e) => {
                    setContraEnabled(e.target.checked);
                    if (e.target.checked && !contraDesc) {
                      setContraDesc(`کٹوتی بذریعہ فلیٹ ${editingNoteFlat.flat} (مرمت)`);
                    }
                  }}
                  className="w-4 h-4 text-amber-600 rounded cursor-pointer accent-amber-600"
                />
                <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
                  <span>🔄 خرچہ بنام مینٹیننس لنک (Auto Contra Entry in Expenses)</span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.2 rounded-full border border-amber-300">
                    Fully Editable
                  </span>
                </span>
              </label>

              {contraEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="col-span-2 sm:col-span-1">
                    <span className="block text-[10px] font-bold text-slate-500 mb-1">خرچے کی تفصیل (Description):</span>
                    <input
                      type="text"
                      value={contraDesc}
                      onChange={(e) => setContraDesc(e.target.value)}
                      placeholder={`مرمت بذریعہ فلیٹ ${editingNoteFlat.flat}`}
                      className="w-full text-xs font-bold bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="block text-[10px] font-bold text-slate-500 mb-1">خرچے کی رقم (Amount in PKR):</span>
                    <input
                      type="number"
                      value={contraAmount}
                      onChange={(e) => setContraAmount(e.target.value)}
                      placeholder="e.g. 700 ya 1200"
                      className="w-full text-xs font-black bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-rose-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold text-slate-500 mb-1">رسید و کیفیات (Receipt / Details):</span>
                    <input
                      type="text"
                      value={contraDetails}
                      onChange={(e) => setContraDetails(e.target.value)}
                      placeholder={`Flat ${editingNoteFlat.flat} (${formatResidentDisplayName(editingNoteFlat)}) maintenance contra deduction`}
                      className="w-full text-xs font-medium bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs flex-wrap gap-2">
              {editingNoteFlat.adjustmentNote && (
                <button
                  type="button"
                  onClick={() => {
                    handleSaveAdjustmentNote(editingNoteFlat.sno, '');
                    setEditingNoteFlat(null);
                    setContraEnabled(false);
                  }}
                  className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                >
                  نوٹ ختم کریں (Clear)
                </button>
              )}
              <div className="flex items-center gap-2 ms-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setEditingNoteFlat(null);
                    setContraEnabled(false);
                  }}
                  className="px-3.5 py-2 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const note = noteInputText.trim();
                    handleSaveAdjustmentNote(editingNoteFlat.sno, note);
                    if (contraEnabled && Number(contraAmount) > 0 && onAddContraExpense) {
                      onAddContraExpense({
                        flat: editingNoteFlat.flat,
                        name: editingNoteFlat.name,
                        desc: contraDesc || `کٹوتی بذریعہ فلیٹ ${editingNoteFlat.flat}`,
                        amount: Number(contraAmount),
                        details: contraDetails || `Adjusted in ${monthName} maintenance`
                      });
                    }
                    openAdjustmentSlipWhatsApp(editingNoteFlat, monthName, buildingName, note, lang, dateStr);
                    setEditingNoteFlat(null);
                    setContraEnabled(false);
                  }}
                  className="px-3.5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition cursor-pointer flex items-center gap-1.5"
                  title="Save note and send WhatsApp Adjustment Slip directly"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Save & WhatsApp 📲</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const note = noteInputText.trim();
                    handleSaveAdjustmentNote(editingNoteFlat.sno, note);
                    if (contraEnabled && Number(contraAmount) > 0 && onAddContraExpense) {
                      onAddContraExpense({
                        flat: editingNoteFlat.flat,
                        name: editingNoteFlat.name,
                        desc: contraDesc || `کٹوتی بذریعہ فلیٹ ${editingNoteFlat.flat}`,
                        amount: Number(contraAmount),
                        details: contraDetails || `Adjusted in ${monthName} maintenance`
                      });
                    }
                    setEditingNoteFlat(null);
                    setContraEnabled(false);
                  }}
                  className="px-4 py-2 rounded-xl font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>محفوظ کریں (Save Note)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial & Maintenance Discrepancy / Clash Audit Modal */}
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
          if (onNavigate) onNavigate('errors-audit');
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
          setSelectedLedgerFlat(flat);
        }}
      />
    </div>
  );
}

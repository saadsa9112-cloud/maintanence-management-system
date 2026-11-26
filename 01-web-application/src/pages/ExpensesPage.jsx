import React, { useState, useEffect, useRef } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Sparkles,
  Lock,
  Unlock,
  Wallet,
  TrendingDown,
  Vault,
  ArrowRight,
  Building2,
  Calendar,
  Printer,
  X,
  Zap
} from 'lucide-react';
import { autoConvertRomanToUrdu } from '../utils/romanToUrdu';
import { sortMonthsChronologically } from '../utils/monthUtils.js';
import LockedFullSheet from '../components/LockedFullSheet';
import MultiMonthExpensesModal from '../components/MultiMonthExpensesModal';
import OpeningBalancesReviewModal from '../components/OpeningBalancesReviewModal';

export default function ExpensesPage({
  expenses = [],
  flats = [],
  buildingName,
  onUpdateExpenses,
  prevSavings = 0,
  onUpdatePrevSavings,
  onBatchUpdatePrevSavings,
  dateStr = '',
  onUpdateDate,
  totalCollected = 0,
  isFinalized,
  onToggleFinalize,
  onNavigate,
  monthName,
  activeMonthKey,
  t,
  lang,
  onNotify,
  onSyncChainBalances,
  allMonthsData = {},
  monthOrder = [],
  onSelectMonth
}) {
  const [prevBalInput, setPrevBalInput] = useState(prevSavings);
  const [voucherExpense, setVoucherExpense] = useState(null);
  const [isMultiMonthModalOpen, setIsMultiMonthModalOpen] = useState(false);
  const [isOpeningBalancesModalOpen, setIsOpeningBalancesModalOpen] = useState(false);
  const isEditingRef = useRef(false);

  const sortedMonthKeys = sortMonthsChronologically(monthOrder && monthOrder.length > 0 ? monthOrder : Object.keys(allMonthsData || {}));

  // CRITICAL FIX: Synchronize prevBalInput whenever switching months or when prevSavings changes
  useEffect(() => {
    setPrevBalInput(prevSavings);
    isEditingRef.current = false;
  }, [prevSavings, monthName, activeMonthKey]);

  // When month is finalized, show clean banner in ExpensesPage (not the full collections register)

  const handleCellChange = (index, field, value) => {
    if (isFinalized) return;
    const updated = [...expenses];
    if (field === 'amount') {
      updated[index] = { ...updated[index], amount: value === '' ? 0 : Number(value) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onUpdateExpenses(updated);
  };

  const handleDescriptionBlur = (index) => {
    if (isFinalized) return;
    const item = expenses[index];
    if (item && item.desc) {
      const converted = autoConvertRomanToUrdu(item.desc);
      if (converted !== item.desc) {
        const updated = [...expenses];
        updated[index] = { ...updated[index], desc: converted };
        onUpdateExpenses(updated);
        if (onNotify) onNotify('Transliterated to Urdu! ✓');
      }
    }
  };

  const handleDetailsBlur = (index) => {
    if (isFinalized) return;
    const item = expenses[index];
    if (item && item.details) {
      const converted = autoConvertRomanToUrdu(item.details);
      if (converted !== item.details) {
        const updated = [...expenses];
        updated[index] = { ...updated[index], details: converted };
        onUpdateExpenses(updated);
      }
    }
  };

  const handleAddExpense = () => {
    if (isFinalized) return;
    const newId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id || 0)) + 1 : 1;
    const newExp = {
      id: newId,
      desc: '',
      amount: 0,
      details: ''
    };
    onUpdateExpenses([...expenses, newExp]);
  };

  const handleDeleteExpense = (index) => {
    if (isFinalized) return;
    const item = expenses[index];
    if (!window.confirm(`Delete expense "${item.desc || 'Expense'}"?`)) return;
    const updated = expenses.filter((_, idx) => idx !== index);
    onUpdateExpenses(updated);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const closingBalance = (Number(totalCollected) || 0) + (Number(prevSavings) || 0) - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Locked Status Banner if month is finalized */}
      {isFinalized && (
        <div className="backdrop-blur-xl bg-amber-500/15 border border-amber-400/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md no-print">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 text-xs sm:text-sm">
                {lang === 'ur'
                  ? `ماہ ${monthName} فائنل اور لاک ہے (Finalized & Locked)`
                  : lang === 'roman'
                  ? `Mahina ${monthName} Finalize & Lock Hai`
                  : `Month ${monthName} is Finalized & Locked`}
              </h4>
              <p className="text-[11px] text-amber-800">
                {lang === 'ur'
                  ? 'اخراجات مقفل ہیں تاکہ کوئی غلطی نہ ہو۔ اگر آپ ترمیم کرنا چاہتے ہیں تو ان لاک کریں۔'
                  : lang === 'roman'
                  ? 'Expenses locked hain. Agar tabdeeli karni ho to unlock karein.'
                  : 'Expenses are locked for record integrity. Unlock if you need to make changes.'}
              </p>
            </div>
          </div>
          <button
            onClick={onToggleFinalize}
            className="backdrop-blur-md bg-amber-700 hover:bg-amber-800 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs border border-amber-500/40 shrink-0 cursor-pointer"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>{lang === 'ur' ? 'ترمیم کے لیے ان لاک کریں' : lang === 'roman' ? 'Unlock Karein' : 'Unlock to Edit'}</span>
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="erp-card rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 border border-slate-200/90 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100 shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="font-extrabold text-slate-900 text-base sm:text-xl">
              {t.navExpenses}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <p className="text-xs text-slate-500 hidden sm:inline">
              {t.expensesRomanHint}
            </p>
            <div className="inline-flex items-center gap-1 bg-slate-50 hover:bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs transition relative">
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
                <Calendar className="w-3.5 h-3.5 text-slate-700 shrink-0 cursor-pointer" />
              </div>
              <input
                type="text"
                value={dateStr || ''}
                onChange={(e) => onUpdateDate && onUpdateDate(e.target.value)}
                className="font-mono font-bold text-slate-900 bg-transparent text-xs w-24 text-center focus:outline-none"
                placeholder="e.g. 3-Oct-2026"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate && onNavigate('vendor-ledger')}
            className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs border border-slate-700 cursor-pointer"
            title="وینڈر و ٹھیکیدار لیجر دیکھیں"
          >
            <span>👨‍🔧 Vendor Ledger</span>
          </button>

          <button
            onClick={() => setIsMultiMonthModalOpen(true)}
            className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-slate-300 cursor-pointer"
            title="تمام مہینوں کے بلوں اور اخراجات کا تاریخی تقابلی جائزہ"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>📊 All Months</span>
          </button>

          {!isFinalized && (
            <button
              onClick={handleAddExpense}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addExpense}</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Reconciliation Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Previous Month Balance */}
        <div className="erp-card rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{t.previousSavings}</span>
              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {monthName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Rs.</span>
              <input
                type="number"
                value={prevBalInput ?? ''}
                disabled={isFinalized}
                onChange={(e) => {
                  setPrevBalInput(e.target.value);
                  isEditingRef.current = true;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = prevBalInput === '' ? 0 : Number(prevBalInput);
                    onUpdatePrevSavings(val);
                    isEditingRef.current = false;
                    e.target.blur();
                  }
                }}
                onBlur={() => {
                  if (isEditingRef.current) {
                    const val = prevBalInput === '' ? 0 : Number(prevBalInput);
                    if (val !== prevSavings) {
                      onUpdatePrevSavings(val);
                    }
                    isEditingRef.current = false;
                  }
                }}
                className="text-xl font-bold font-mono text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-300 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Sirf <strong>{monthName}</strong> ka independent opening balance
            </span>
          </div>

          <button
            onClick={() => setIsOpeningBalancesModalOpen(true)}
            className="mt-3 w-full py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold transition border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-slate-500" />
            <span>Har Mahine Ki Pichli Bachat Review Karein 📋</span>
          </button>
        </div>

        {/* Total Collected */}
        <div className="erp-card rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">{t.totalCollections}</span>
          <h3 className="text-xl font-bold font-mono text-emerald-600">
            Rs. {Number(totalCollected).toLocaleString('en-US')}
          </h3>
          <span className="text-[10px] text-slate-400 block mt-1">Current month maintenance pool</span>
        </div>

        {/* Total Expenses */}
        <div className="erp-card rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">{t.totalExpenses}</span>
          <h3 className="text-xl font-bold font-mono text-rose-600">
            Rs. {Number(totalExpenses).toLocaleString('en-US')}
          </h3>
          <span className="text-[10px] text-slate-400 block mt-1">{expenses.length} expense items</span>
        </div>

        {/* Net Closing Balance */}
        <div className="erp-card rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">{t.netSavings}</span>
          <h3 className={`text-xl font-bold font-mono ${closingBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            Rs. {Number(closingBalance).toLocaleString('en-US')}
          </h3>
          <span className="text-[10px] text-slate-400 block mt-1">Net building cash reserve</span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="erp-card rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
        <div className="bg-slate-900 text-white p-3 sm:p-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-sm sm:text-base">
              Monthly Vouchers Register (Live Roman-to-Urdu Transliteration)
            </h3>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 font-medium px-2.5 py-0.5 rounded-full">
            {expenses.length} Vouchers
          </span>
        </div>

        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full min-w-[620px] text-left text-xs sm:text-sm border-collapse">
            <thead className="glass-table-head text-slate-700 border-b border-slate-200 text-xs font-black uppercase">
              <tr>
                <th className="p-3 text-center w-12 border-r border-slate-200/60">{t.thSno}</th>
                <th className="p-3 border-r border-slate-200/60 min-w-[200px]">{t.thExpenseDesc} (Roman / English)</th>
                <th className="p-3 text-center w-36 border-r border-slate-200/60">{t.thExpenseAmount}</th>
                <th className="p-3 border-r border-slate-200/60 min-w-[160px]">{t.thExpenseDetails}</th>
                <th className="p-3 text-center w-24 no-print">{t.thActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {expenses.map((exp, idx) => (
                <tr key={exp.id || idx} className="hover:bg-amber-50/40 transition bg-white/40">
                  {/* S.No */}
                  <td className="p-2 text-center text-slate-400 font-bold border-r border-slate-200/60">
                    {idx + 1}
                  </td>

                  {/* Description Input */}
                  <td className="p-0 border-r border-slate-200/60">
                    <input
                      type="text"
                      value={exp.desc || ''}
                      disabled={isFinalized}
                      onChange={(e) => handleCellChange(idx, 'desc', e.target.value)}
                      onBlur={() => handleDescriptionBlur(idx)}
                      className="cell-input font-bold text-slate-900"
                      placeholder="bijli ka bil, motor operator, jamadar..."
                    />
                  </td>

                  {/* Amount Input */}
                  <td className="p-0 border-r border-slate-200/60">
                    <input
                      type="number"
                      value={exp.amount ?? ''}
                      disabled={isFinalized}
                      onChange={(e) => handleCellChange(idx, 'amount', e.target.value)}
                      className="cell-input text-center font-black text-rose-700"
                      placeholder="0"
                    />
                  </td>

                  {/* Details / Notes */}
                  <td className="p-0 border-r border-slate-200">
                    <input
                      type="text"
                      value={exp.details || ''}
                      disabled={isFinalized}
                      onChange={(e) => handleCellChange(idx, 'details', e.target.value)}
                      onBlur={() => handleDetailsBlur(idx)}
                      className="cell-input text-slate-600 text-xs"
                      placeholder="Bill #, Date, or Notes..."
                    />
                  </td>

                  {/* Actions: Voucher & Delete */}
                  <td className="p-2 text-center no-print">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setVoucherExpense({ ...exp, index: idx })}
                        className="font-bold p-1.5 rounded-xl text-xs transition bg-amber-500/10 hover:bg-amber-600 text-amber-900 hover:text-white border border-amber-300/40 hover:border-amber-600 shadow-2xs cursor-pointer"
                        title="Generate Cash Payment Voucher (واؤچر بنائیں)"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                      </button>
                      {!isFinalized && (
                        <button
                          onClick={() => handleDeleteExpense(idx)}
                          className="text-slate-300 hover:text-rose-600 p-1.5 transition cursor-pointer"
                          title="Delete voucher"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Total Footer */}
            <tfoot className="bg-amber-50 font-extrabold border-t-2 border-amber-300 text-slate-900 text-xs sm:text-sm">
              <tr>
                <td colSpan="2" className="p-3 text-center text-amber-950 font-black">
                  Total Monthly Expenses
                </td>
                <td className="p-3 text-center text-rose-700 border-r border-amber-200/60 font-black text-base">
                  Rs. {Number(totalExpenses).toLocaleString('en-US')}
                </td>
                <td colSpan={isFinalized ? 1 : 2} className="p-3 text-xs text-slate-600 font-medium">
                  Reconciled against building maintenance fund
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Bottom add bar */}
        {!isFinalized && (
          <div className="p-3.5 backdrop-blur-md bg-white/40 border-t border-slate-200/60 flex items-center justify-between no-print">
            <button
              onClick={handleAddExpense}
              className="backdrop-blur-md bg-amber-800/90 hover:bg-amber-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-800/20 border border-amber-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addExpense}</span>
            </button>

            <span className="text-xs text-slate-500 font-medium">
              💡 Type in Roman (e.g. `gatar safai`, `plumber`) and tap outside to convert to Urdu.
            </span>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* FINALIZE & LOCK MONTH BAR (Located on Expenses Page) */}
      {/* ==================================================== */}
      <div className="erp-card rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔒</span>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              {t.finalizeMonth}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'ur'
              ? `فلیٹس کی وصولی (Rs. ${Number(totalCollected).toLocaleString('en-US')}) اور اخراجات (Rs. ${Number(totalExpenses).toLocaleString('en-US')}) کی بنیاد پر حتمی بچت: Rs. ${Number(closingBalance).toLocaleString('en-US')}`
              : lang === 'roman'
              ? `Wusooli (Rs. ${Number(totalCollected).toLocaleString('en-US')}) aur Ikhrajat (Rs. ${Number(totalExpenses).toLocaleString('en-US')}) mukammal hone par mahina lock karein.`
              : `Finalize and lock month figures after completing flat collections (Rs. ${Number(totalCollected).toLocaleString('en-US')}) and expenses (Rs. ${Number(totalExpenses).toLocaleString('en-US')}).`}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Back to Collections */}
          <button
            onClick={() => onNavigate('collections')}
            className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-3.5 rounded-lg text-xs sm:text-sm transition flex items-center gap-1.5 border border-slate-300 shadow-xs shrink-0 cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>{lang === 'ur' ? '⬅️ وصولی رجسٹر' : lang === 'roman' ? '⬅️ Wusooli Register' : '⬅️ Collections (MR)'}</span>
          </button>

          {/* Toggle Finalize */}
          <button
            onClick={onToggleFinalize}
            className={`py-2 px-5 rounded-lg text-xs sm:text-sm font-semibold transition shadow-xs flex items-center justify-center gap-2 w-full md:w-auto shrink-0 cursor-pointer ${
              isFinalized
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isFinalized ? (
              <>
                <Unlock className="w-4 h-4" />
                <span>{t.unlockMonth}</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>{t.finalizeMonth}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Official Building Cash Payment Voucher Modal */}
      {voucherExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in no-print-overlay">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-slate-900 relative space-y-4">
            <button
              onClick={() => setVoucherExpense(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Voucher Header */}
            <div className="text-center pb-3 border-b border-slate-200">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-700 text-white shadow-md mb-2">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg text-slate-900 tracking-tight">
                {buildingName || 'AL MUSTAFA HEIGHTS 5-E-18/19'}
              </h3>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mt-0.5">
                Official Building Payment Voucher • کیش ادائیگی واؤچر
              </p>
              <div className="inline-block mt-2 bg-slate-100 text-slate-600 text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-slate-200">
                Voucher #: VCH-{monthName.replace(/\s+/g, '').toUpperCase()}-{voucherExpense.index + 1}
              </div>
            </div>

            {/* Voucher Body Details */}
            <div className="bg-amber-50/50 rounded-2xl p-4 space-y-2.5 border border-amber-200/60 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-amber-200/50">
                <span className="text-slate-500 font-medium">Payment Head / Paid To:</span>
                <span className="font-black text-slate-900 text-sm">{voucherExpense.desc || 'Expense Item'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-amber-200/50">
                <span className="text-slate-500 font-medium">Billing Month:</span>
                <span className="font-bold text-slate-800">{monthName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-amber-200/50">
                <span className="text-slate-500 font-medium">Issue Date:</span>
                <span className="font-mono text-slate-700">{dateStr || new Date().toLocaleDateString('en-GB')}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-amber-200/50">
                <span className="text-slate-500 font-medium">Bill / Voucher Detail:</span>
                <span className="font-medium text-slate-700">{voucherExpense.details || 'Building Maintenance & Utilities'}</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-sm font-black text-rose-700">
                <span>Total Amount Disbursed:</span>
                <span className="text-base">Rs. {Number(voucherExpense.amount || 0).toLocaleString('en-US')}</span>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-4 pt-3 text-[11px] text-slate-700 border-t border-slate-200">
              <div className="border-t-2 border-slate-700 pt-1 text-center font-bold">
                <span className="block font-black text-slate-900">حافظ محمد سعد</span>
                <span className="text-[10px] text-slate-500">Maintenance Incharge</span>
              </div>
              <div className="border-t-2 border-slate-700 pt-1 text-center font-bold">
                <span className="block font-black text-slate-900">وصول کنندہ دستخط</span>
                <span className="text-[10px] text-slate-500">Recipient Signature</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2">
              <button
                onClick={() => window.print()}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/20 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Month Interactive Expenses & Bill History Modal */}
      <MultiMonthExpensesModal
        isOpen={isMultiMonthModalOpen}
        onClose={() => setIsMultiMonthModalOpen(false)}
        allMonthsData={allMonthsData}
        monthOrder={monthOrder}
        initialExpenseName=""
        onSelectMonth={onSelectMonth}
        buildingName={buildingName}
        lang={lang}
      />

      {/* Review All Months Opening Balances Modal */}
      <OpeningBalancesReviewModal
        isOpen={isOpeningBalancesModalOpen}
        onClose={() => setIsOpeningBalancesModalOpen(false)}
        allMonthsData={allMonthsData}
        monthOrder={monthOrder}
        onSaveBalances={(updatesMap) => {
          if (onBatchUpdatePrevSavings) {
            onBatchUpdatePrevSavings(updatesMap);
          } else {
            Object.entries(updatesMap).forEach(([k, v]) => onUpdatePrevSavings(v, k));
          }
        }}
        activeMonthKey={activeMonthKey}
        onSelectMonth={onSelectMonth}
        buildingName={buildingName}
        lang={lang}
      />
    </div>
  );
}

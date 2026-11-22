import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  X,
  Check,
  Edit3,
  Trash2,
  AlertTriangle,
  Lock,
  Unlock,
  Building2,
  Wallet,
  Receipt,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { sortMonthsChronologically } from '../utils/monthUtils';

const MONTHS_LIST = [
  { key: 'JANUARY', urdu: 'جنوری', eng: 'January', short: 'Jan' },
  { key: 'FEBRUARY', urdu: 'فروری', eng: 'February', short: 'Feb' },
  { key: 'MARCH', urdu: 'مارچ', eng: 'March', short: 'Mar' },
  { key: 'APRIL', urdu: 'اپریل', eng: 'April', short: 'Apr' },
  { key: 'MAY', urdu: 'مئی', eng: 'May', short: 'May' },
  { key: 'JUNE', urdu: 'جون', eng: 'June', short: 'Jun' },
  { key: 'JULY', urdu: 'جولائی', eng: 'July', short: 'Jul' },
  { key: 'AUGUST', urdu: 'اگست', eng: 'August', short: 'Aug' },
  { key: 'SEPTEMBER', urdu: 'ستمبر', eng: 'September', short: 'Sep' },
  { key: 'OCTOBER', urdu: 'اکتوبر', eng: 'October', short: 'Oct' },
  { key: 'NOVEMBER', urdu: 'نومبر', eng: 'November', short: 'Nov' },
  { key: 'DECEMBER', urdu: 'دسمبر', eng: 'December', short: 'Dec' }
];

export default function EditMonthModal({
  isOpen,
  onClose,
  activeMonthKey,
  allMonthsData = {},
  monthOrder = [],
  onEditMonth,
  onDeleteMonth,
  buildingName = 'AL MUSTAFA HEIGHTS',
  lang = 'roman'
}) {
  const sortedMonths = useMemo(() => {
    return sortMonthsChronologically(monthOrder && monthOrder.length > 0 ? monthOrder : Object.keys(allMonthsData || {}));
  }, [monthOrder, allMonthsData]);

  const [selectedKey, setSelectedKey] = useState(activeMonthKey || sortedMonths[0] || 'OCTOBER');
  const [monthName, setMonthName] = useState('');
  const [urduName, setUrduName] = useState('');
  const [year, setYear] = useState('2026');
  const [dateStr, setDateStr] = useState('');
  const [prevSavings, setPrevSavings] = useState(0);
  const [isFinalized, setIsFinalized] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Sync state whenever modal opens or selectedKey changes
  useEffect(() => {
    if (isOpen) {
      const target = selectedKey && allMonthsData[selectedKey] ? selectedKey : (activeMonthKey || sortedMonths[0]);
      setSelectedKey(target);
      const data = allMonthsData[target] || {};

      setMonthName(data.name || target || '');
      setUrduName(data.urduName || '');
      setYear(String(data.year || 2026));
      setDateStr(data.dateStr || '28-Oct-2026');
      setPrevSavings(Number(data.prevSavings) || 0);
      setIsFinalized(Boolean(data.finalized));
      setIsConfirmingDelete(false);
    }
  }, [isOpen, selectedKey, activeMonthKey, allMonthsData]);

  if (!isOpen) return null;

  const currentMonthObj = allMonthsData[selectedKey] || {};
  const flats = currentMonthObj.flats || [];
  const expenses = currentMonthObj.expenses || [];
  const totalPaid = flats.reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
  const totalArrears = flats.reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.arrears || 0) : 0), 0);
  const totalExp = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const closingCash = totalPaid + prevSavings - totalExp;

  const handleSave = (e) => {
    e.preventDefault();
    if (!monthName.trim()) {
      alert('Month Name cannot be empty!');
      return;
    }

    const payload = {
      newKey: monthName.trim().toUpperCase(),
      name: monthName.trim().toUpperCase(),
      urduName: urduName.trim(),
      year: parseInt(year, 10) || 2026,
      dateStr: dateStr.trim(),
      prevSavings: Number(prevSavings) || 0,
      finalized: Boolean(isFinalized)
    };

    onEditMonth(selectedKey, payload);
    onClose();
  };

  const handleDelete = () => {
    if (sortedMonths.length <= 1) {
      alert('Aap aakhri mahina delete nahi kar sakte! System mein kam az kam aik mahina hona zaroori hai.');
      return;
    }

    const success = onDeleteMonth(selectedKey);
    if (success) {
      setIsConfirmingDelete(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fade-in no-print-overlay">
      <div className="backdrop-blur-2xl bg-white/95 rounded-3xl border border-slate-200/90 shadow-[0_25px_60px_rgba(0,0,0,0.25)] max-w-2xl w-full p-5 sm:p-7 text-slate-900 relative space-y-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/15 text-blue-700 flex items-center justify-center font-black">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl text-slate-900">
                {lang === 'ur'
                  ? 'ماہانہ شیٹ میں ترمیم و ڈیلیٹ (Edit / Delete Month)'
                  : 'Mahana Sheet Edit & Delete Option'}
              </h3>
              <p className="text-xs text-slate-500">
                {buildingName} — Mahinay ka naam, tareekh, opening balance edit karein ya sheet delete karein
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Selector Dropdown (Replaces horizontal scrolling pills) */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Select Month Sheet to Edit / Delete (مہینہ منتخب کریں - Dropdown):</span>
            </label>
            <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
              {sortedMonths.length} Sheets Available
            </span>
          </div>
          <div className="relative">
            <select
              value={selectedKey}
              onChange={(e) => {
                setSelectedKey(e.target.value);
                setIsConfirmingDelete(false);
              }}
              className="w-full bg-white hover:bg-slate-50 py-2.5 px-3.5 rounded-xl border-2 border-blue-500 font-black text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-xs"
            >
              {sortedMonths.map((mKey) => {
                const mData = allMonthsData[mKey] || {};
                const mFlats = mData.flats || [];
                const mPaid = mFlats.reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
                const mYear = mData.year || 2026;
                return (
                  <option key={mKey} value={mKey}>
                    📅 {mKey} ({mYear}) — {mData.name || mKey} {mData.urduName ? `[${mData.urduName}]` : ''} | Collections: Rs. {mPaid.toLocaleString('en-US')}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Flats Count:</span>
              <span className="font-black text-slate-800">{flats.length} Flats</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Total Collections:</span>
              <span className="font-black text-emerald-700">Rs. {totalPaid.toLocaleString('en-US')}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Total Expenses:</span>
              <span className="font-black text-rose-700">Rs. {totalExp.toLocaleString('en-US')}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Closing Cash:</span>
              <span className={`font-black ${closingCash >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                Rs. {closingCash.toLocaleString('en-US')}
              </span>
            </div>
          </div>

          {/* Quick Month Preset Template Dropdown */}
          <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-200/80 space-y-1">
            <label className="text-[11px] font-black text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Standard Month Preset Dropdown (مہینہ آٹو سلیکٹ کریں):</span>
            </label>
            <select
              onChange={(e) => {
                const mKey = e.target.value;
                if (!mKey) return;
                const mObj = MONTHS_LIST.find(m => m.key === mKey);
                if (mObj) {
                  const y = year || '2026';
                  setMonthName(y === '2026' ? mObj.key : `${mObj.key}_${y}`);
                  setUrduName(mObj.urdu);
                }
              }}
              defaultValue=""
              className="w-full text-xs font-bold bg-white border border-blue-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-2xs"
            >
              <option value="" disabled>-- Dropdown se Mahina Select Karein (English & Urdu Auto-Fill) --</option>
              {MONTHS_LIST.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.urdu} ({m.eng} / {m.key})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Month Name / Key */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Month Name (English / Label):
              </label>
              <input
                type="text"
                value={monthName}
                onChange={(e) => setMonthName(e.target.value.toUpperCase())}
                placeholder="e.g. OCTOBER"
                className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Yeh sheet ka main identifier hai (e.g. OCTOBER, NOVEMBER).
              </span>
            </div>

            {/* Urdu Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Urdu Name (اردو نام):
              </label>
              <input
                type="text"
                value={urduName}
                onChange={(e) => setUrduName(e.target.value)}
                placeholder="e.g. اکتوبر"
                className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-urdu"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Excel sheet aur Urdu print reports ke liye.
              </span>
            </div>

            {/* Year Dropdown */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Year (سال - Dropdown):
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                {['2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2035'].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Statement Date */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Statement Date (تاریخِ اجراء):
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  placeholder="e.g. 28-Oct-2026"
                  className="flex-1 text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono"
                  required
                />
                <div className="relative">
                  <input
                    type="date"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      const [y, m, d] = val.split('-').map(Number);
                      const mObj = MONTHS_LIST[m - 1];
                      setDateStr(`${d}-${mObj ? mObj.short : 'Oct'}-${y}`);
                    }}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                    title="Select date from calendar"
                  />
                  <button
                    type="button"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Opening Cash Balance (Pichli Bachat) */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                پچھلی بچت (Opening Cash Balance):
              </label>
              <input
                type="number"
                value={prevSavings}
                onChange={(e) => setPrevSavings(Number(e.target.value) || 0)}
                className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-blue-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono"
                placeholder="0"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Is mahine ki opening cash balance (Previous Savings).
              </span>
            </div>

            {/* Sheet Status Dropdown */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Sheet Status (لاک / ان لاک - Dropdown):
              </label>
              <select
                value={isFinalized ? 'locked' : 'open'}
                onChange={(e) => setIsFinalized(e.target.value === 'locked')}
                className={`w-full text-xs font-bold rounded-xl px-3 py-2 border cursor-pointer focus:outline-none ${
                  isFinalized
                    ? 'bg-amber-50 border-amber-300 text-amber-950 font-black'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-950 font-black'
                }`}
              >
                <option value="open">🟢 Open / قابلِ ترمیم (Entries Allowed)</option>
                <option value="locked">🔒 Locked / مقفل (No Changes Allowed)</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Lock karne se ghalti se koi entry edit nahi hogi.
              </span>
            </div>
          </div>

          {/* Danger Zone: Delete Month Sheet */}
          <div className="pt-2">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-xs text-rose-950">
                    Danger Zone: Delete Month Sheet (ماہانہ شیٹ ڈیلیٹ کریں)
                  </h4>
                  <p className="text-[11px] text-rose-800 leading-relaxed mt-0.5">
                    Agar aap <strong>"{selectedKey}"</strong> ki sheet delete karenge to is mahine ka mukammal register, wasooli aur ikhrajat permanently khatam ho jayenge.
                  </p>
                </div>
              </div>

              {isConfirmingDelete ? (
                <div className="bg-white p-3 rounded-xl border border-rose-300 space-y-2 animate-fade-in">
                  <p className="text-xs font-black text-rose-900">
                    ⚠️ Kia aap waqai "{selectedKey}" ki sheet mukammal delete karna chahte hain?
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Is action ko wapas nahi laya ja sakega.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3.5 py-1.5 rounded-xl font-black text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Haan, Mukammal Delete Karein</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    >
                      Cancel (منسوخ)
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  disabled={sortedMonths.length <= 1}
                  className="px-3.5 py-1.5 rounded-xl font-black text-xs bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 transition cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete "{selectedKey}" Sheet</span>
                </button>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-black text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes (تبدیلیاں محفوظ کریں)</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

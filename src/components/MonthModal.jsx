import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, X, Check, Sparkles, History, AlertCircle } from 'lucide-react';
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

// Convert "YYYY-MM-DD" to "D-MMM-YYYY" (e.g. "2026-10-29" -> "29-Oct-2026")
const formatToDisplayDate = (isoStr) => {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length !== 3) return isoStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  const mObj = MONTHS_LIST[m - 1];
  const mShort = mObj ? mObj.short : 'Jan';
  return `${d}-${mShort}-${y}`;
};

// Convert "D-MMM-YYYY" to "YYYY-MM-DD"
const parseToISODate = (displayStr, fallbackYear = 2026, fallbackMonthIdx = 0) => {
  if (!displayStr) return '';
  const match = displayStr.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})$/);
  if (match) {
    const day = parseInt(match[1], 10);
    const mStr = match[2].toUpperCase();
    const year = parseInt(match[3], 10);
    let mIdx = MONTHS_LIST.findIndex(m => m.short.toUpperCase() === mStr || m.key === mStr);
    if (mIdx === -1) mIdx = fallbackMonthIdx;
    const mm = String(mIdx + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }
  const mm = String(fallbackMonthIdx + 1).padStart(2, '0');
  return `${fallbackYear}-${mm}-01`;
};

// Compute smart default date: Today's date if current real month, otherwise 1st of selected month
const computeDefaultDate = (mKey, yStr) => {
  const today = new Date();
  const currentRealYear = today.getFullYear();
  const currentRealMonthIdx = today.getMonth(); // 0-11
  const currentRealDay = today.getDate();

  const y = parseInt(yStr, 10) || currentRealYear;
  const mIdx = MONTHS_LIST.findIndex(m => m.key === mKey);
  const targetMIdx = mIdx !== -1 ? mIdx : currentRealMonthIdx;
  const mObj = MONTHS_LIST[targetMIdx] || MONTHS_LIST[0];

  const isCurrentRealMonth = (y === currentRealYear && targetMIdx === currentRealMonthIdx);

  if (isCurrentRealMonth) {
    // Current ongoing month: auto-detect today's real live date!
    const iso = `${y}-${String(targetMIdx + 1).padStart(2, '0')}-${String(currentRealDay).padStart(2, '0')}`;
    const display = `${currentRealDay}-${mObj.short}-${y}`;
    return { iso, display };
  } else {
    // Other month: auto-align to 1st of that month (not hardcoded static values)
    const day = 1;
    const iso = `${y}-${String(targetMIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const display = `${day}-${mObj.short}-${y}`;
    return { iso, display };
  }
};

export default function MonthModal({
  isOpen,
  onClose,
  onCreateMonth,
  currentMonthKey,
  suggestedBalance,
  allMonthsData = {},
  monthOrder = []
}) {
  const [selectedMonth, setSelectedMonth] = useState('OCTOBER');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [dateStr, setDateStr] = useState('29-Oct-2026');
  const [isoDate, setIsoDate] = useState('2026-10-29');
  const [openingBalance, setOpeningBalance] = useState(0);

  const datePickerRef = useRef(null);

  // Target Key for comparison (e.g., "OCTOBER" for 2026, "OCTOBER_2025" for 2025)
  const targetKey = useMemo(() => {
    const y = parseInt(selectedYear, 10) || 2026;
    return y === 2026 ? selectedMonth : `${selectedMonth}_${y}`;
  }, [selectedMonth, selectedYear]);

  // Duplicate Check: Same Month AND Same Year already exists!
  const isDuplicateMonth = useMemo(() => {
    const yearNum = parseInt(selectedYear, 10);
    if (!yearNum || isNaN(yearNum)) return false;

    return Object.entries(allMonthsData || {}).some(([k, mData]) => {
      if (!mData) return false;
      const kUpper = k.toUpperCase();
      const monthMatches = kUpper === selectedMonth || kUpper.startsWith(`${selectedMonth}_`);
      const mYear = Number(mData.year) || (mData.name ? parseInt(mData.name.match(/\d{4}/)?.[0] || '2026', 10) : 2026);
      return monthMatches && mYear === yearNum;
    });
  }, [selectedMonth, selectedYear, allMonthsData]);

  // Year validation (Must be 2025 or higher)
  const isYearTooLow = useMemo(() => {
    const y = parseInt(selectedYear, 10);
    return !isNaN(y) && y < 2025;
  }, [selectedYear]);

  // Chronological position calculations
  const sortedExisting = useMemo(() => {
    return sortMonthsChronologically(monthOrder && monthOrder.length > 0 ? monthOrder : Object.keys(allMonthsData || {}));
  }, [monthOrder, allMonthsData]);

  const { isHistorical, precedingKey, subsequentKey, precedingClosing } = useMemo(() => {
    const combined = sortMonthsChronologically([...sortedExisting.filter(k => k !== targetKey), targetKey]);
    const selIndex = combined.indexOf(targetKey);
    const prec = selIndex > 0 ? combined[selIndex - 1] : null;
    const sub = selIndex < combined.length - 1 ? combined[selIndex + 1] : null;

    let pClosing = 0;
    if (prec && allMonthsData[prec]) {
      const pData = allMonthsData[prec];
      const coll = (pData.flats || []).reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
      const exp = (pData.expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
      const prev = Number(pData.prevSavings || 0);
      pClosing = coll + prev - exp;
    }

    return {
      isHistorical: !prec,
      precedingKey: prec,
      subsequentKey: sub,
      precedingClosing: pClosing
    };
  }, [targetKey, sortedExisting, allMonthsData]);

  // Auto-detect opening balance when modal opens or target changes
  useEffect(() => {
    if (isOpen) {
      if (!isHistorical && precedingKey) {
        setOpeningBalance(precedingClosing);
      } else {
        setOpeningBalance(0);
      }
    }
  }, [isOpen, targetKey, isHistorical, precedingKey, precedingClosing]);

  // Auto-suggest next month and smart date detection when modal opens
  useEffect(() => {
    if (isOpen) {
      let nextIdx = 9; // October default
      let nextYear = 2026;

      const currIdx = MONTHS_LIST.findIndex(m => currentMonthKey && currentMonthKey.toUpperCase().includes(m.key));
      if (currIdx !== -1) {
        if (currIdx === 11) {
          nextIdx = 0;
          nextYear = 2027;
        } else {
          nextIdx = currIdx + 1;
        }
      }

      const m = MONTHS_LIST[nextIdx];
      setSelectedMonth(m.key);
      setSelectedYear(String(nextYear));

      const def = computeDefaultDate(m.key, String(nextYear));
      setDateStr(def.display);
      setIsoDate(def.iso);
    }
  }, [isOpen, currentMonthKey]);

  // Month change: recalculates aligned date
  const handleMonthChange = (e) => {
    const val = e.target.value;
    setSelectedMonth(val);
    const def = computeDefaultDate(val, selectedYear);
    setDateStr(def.display);
    setIsoDate(def.iso);
  };

  // Year change: recalculates aligned date
  const handleYearChange = (e) => {
    const val = e.target.value;
    setSelectedYear(val);
    const def = computeDefaultDate(selectedMonth, val);
    setDateStr(def.display);
    setIsoDate(def.iso);
  };

  // Visual Calendar date picked
  const handleCalendarDateChange = (e) => {
    const val = e.target.value; // "YYYY-MM-DD"
    if (!val) return;
    setIsoDate(val);
    const display = formatToDisplayDate(val);
    setDateStr(display);

    // Auto-sync Month & Year selectors to match the picked calendar date
    const [y, m] = val.split('-').map(Number);
    const mIdx = m - 1;
    if (mIdx >= 0 && mIdx < MONTHS_LIST.length) {
      setSelectedMonth(MONTHS_LIST[mIdx].key);
    }
    if (y && y >= 2025) {
      setSelectedYear(String(y));
    }
  };

  // Set today's real date instantly
  const handleSetToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const mIdx = today.getMonth();
    const d = today.getDate();
    const mObj = MONTHS_LIST[mIdx] || MONTHS_LIST[0];

    setSelectedMonth(mObj.key);
    setSelectedYear(String(y));

    const iso = `${y}-${String(mIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const display = `${d}-${mObj.short}-${y}`;

    setIsoDate(iso);
    setDateStr(display);
  };

  const handleCreate = () => {
    if (isDuplicateMonth || isYearTooLow || !selectedYear) return;

    const mObj = MONTHS_LIST.find(x => x.key === selectedMonth) || MONTHS_LIST[0];
    const yearNum = parseInt(selectedYear, 10) || 2026;
    const key = yearNum === 2026 ? selectedMonth : `${selectedMonth}_${yearNum}`;
    const name = `${mObj.urdu} ${selectedYear} (${mObj.eng})`;

    onCreateMonth({
      key,
      name,
      year: yearNum,
      dateStr: dateStr.trim(),
      prevSavings: Number(openingBalance) || 0,
      isHistorical,
      precedingKey,
      subsequentKey
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in no-print">
      <div className="backdrop-blur-2xl bg-white/95 rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] p-4 sm:p-7 w-full max-w-sm space-y-4 border border-white/80 text-slate-900 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
          <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>نیا مہینہ منتخب کریں</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Month Error Alert */}
        {isDuplicateMonth && (
          <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-start gap-2.5 shadow-sm animate-pulse">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-xs text-rose-800">
                ⚠️ ڈپلیکیٹ ریکارڈ (Duplicate Month)
              </p>
              <p className="text-[11px] text-rose-700 leading-tight mt-0.5 font-medium">
                ماہ <strong>{selectedMonth} {selectedYear}</strong> پہلے سے موجود ہے! ایک ہی سال میں ڈپلیکیٹ شیٹ نہیں بن سکتی۔ <strong>سال تبدیل کریں</strong> یا دوسرا مہینہ منتخب کریں۔
              </p>
            </div>
          </div>
        )}

        {/* Year Minimum Validation Alert */}
        {isYearTooLow && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>سال کم از کم 2025 یا اس کے بعد کا ہونا چاہیے۔</span>
          </div>
        )}

        {/* Month Dropdown & Editable Year Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            مہینہ (Drop Down) اور سال (Manual / Keyboard):
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Month Dropdown */}
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className={`col-span-2 bg-white hover:bg-slate-50 py-2.5 px-3 rounded-xl border-2 font-black text-sm text-slate-900 focus:outline-none focus:ring-2 cursor-pointer shadow-xs ${
                isDuplicateMonth
                  ? 'border-rose-400 focus:ring-rose-500'
                  : 'border-blue-500 focus:ring-blue-600'
              }`}
            >
              {MONTHS_LIST.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.urdu} ({m.eng})
                </option>
              ))}
            </select>

            {/* Editable Year Input (Manual Keyboard Typing + Up/Down Keys) */}
            <input
              type="number"
              min="2025"
              max="2050"
              step="1"
              value={selectedYear}
              onChange={handleYearChange}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  const next = (parseInt(selectedYear, 10) || 2026) + 1;
                  handleYearChange({ target: { value: String(next) } });
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  const prev = Math.max(2025, (parseInt(selectedYear, 10) || 2026) - 1);
                  handleYearChange({ target: { value: String(prev) } });
                }
              }}
              placeholder="2026"
              className={`col-span-1 bg-white hover:bg-slate-50 py-2.5 px-2 rounded-xl border-2 font-black text-sm text-center text-slate-900 focus:outline-none shadow-xs ${
                isDuplicateMonth || isYearTooLow
                  ? 'border-rose-400 focus:border-rose-600 bg-rose-50/50'
                  : 'border-slate-300 focus:border-blue-600'
              }`}
              title="Keyboard se saal type karein (min: 2025) ya arrow keys use karein"
              dir="ltr"
            />
          </div>

          {/* Quick Year Selection Chips */}
          <div className="flex items-center gap-1.5 mt-2 justify-end">
            <span className="text-[10px] font-bold text-slate-400 me-1">Quick Year:</span>
            {['2025', '2026', '2027', '2028', '2029'].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => handleYearChange({ target: { value: yr } })}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  selectedYear === yr
                    ? 'bg-blue-600 text-white shadow-2xs font-black'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        {/* Date Input with Visual Interactive Calendar Picker */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>تاریخ کا اندراج (Date):</span>
            </label>
            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
              Auto-aligned ✓
            </span>
          </div>

          <div className="relative flex items-center">
            {/* Visual Date String Input (Supports manual keyboard typing) */}
            <input
              type="text"
              value={dateStr}
              onChange={(e) => {
                const val = e.target.value;
                setDateStr(val);
                const iso = parseToISODate(val, parseInt(selectedYear, 10), MONTHS_LIST.findIndex(m => m.key === selectedMonth));
                if (iso) setIsoDate(iso);
              }}
              className="w-full py-2.5 ps-3 pe-12 rounded-xl border-2 border-slate-300 font-black text-sm text-center text-slate-900 bg-white hover:bg-slate-50 focus:border-blue-600 focus:outline-none shadow-xs tracking-wide"
              dir="ltr"
              placeholder="e.g. 29-Oct-2026"
            />

            {/* Clickable Interactive Calendar Picker Trigger */}
            <div className="absolute end-1.5 inset-y-1.5 flex items-center">
              <input
                ref={datePickerRef}
                type="date"
                value={isoDate}
                onChange={handleCalendarDateChange}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                title="Click to open visual calendar date picker"
              />
              <button
                type="button"
                onClick={() => {
                  if (datePickerRef.current) {
                    if (typeof datePickerRef.current.showPicker === 'function') {
                      datePickerRef.current.showPicker();
                    } else {
                      datePickerRef.current.focus();
                    }
                  }
                }}
                className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center justify-center transition border border-blue-300/80 shadow-xs cursor-pointer z-0"
                title="Calendar se date select karein"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Date Helper Bar */}
          <div className="flex items-center justify-between gap-1.5 mt-1.5 text-[11px]">
            <button
              type="button"
              onClick={handleSetToday}
              className="text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>📅 Set Today's Date ({new Date().getDate()}-{MONTHS_LIST[new Date().getMonth()]?.short})</span>
            </button>
            <span className="text-[10px] text-slate-400 font-medium">
              Click 📅 for Calendar
            </span>
          </div>
        </div>

        {/* Opening Cash Balance */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            پچھلی بچت (Opening Cash Balance):
          </label>
          <input
            type="number"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full py-2.5 px-3 rounded-xl border-2 border-indigo-300/80 font-black text-sm focus:border-indigo-600 focus:outline-none text-center text-indigo-950 bg-indigo-50/50 shadow-xs"
            placeholder="0"
          />

          {/* Contextual Notice */}
          {!isDuplicateMonth && (
            <>
              {!isHistorical && precedingKey ? (
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-xs text-emerald-900">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>اگلا تسلسل مہینہ (Next Cycle Detected)</span>
                  </div>
                  <div className="text-[11px] leading-relaxed text-emerald-800 space-y-0.5" dir="rtl">
                    <p>
                      سابقہ مہینے <strong>"{allMonthsData[precedingKey]?.name || precedingKey}"</strong> کی حتمی بچت <span dir="ltr" className="font-bold text-emerald-950 font-mono">(Rs. {Number(precedingClosing).toLocaleString('en-US')})</span>
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold">
                      ✨ فلیٹس کے تمام سابقہ بقایا جات خود کار طریقے سے شامل ہوں گے۔
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-xs text-amber-900">
                    <History className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>سابقہ / نیا دورانیہ (Historical Month)</span>
                  </div>
                  <div className="text-[11px] leading-relaxed text-amber-900 space-y-0.5" dir="rtl">
                    <p>
                      یہ مہینہ زیرو بقایا جات <span dir="ltr" className="font-bold">(Fresh Baseline)</span> سے شروع ہوگا۔
                    </p>
                    {subsequentKey && (
                      <p className="text-[10px] text-amber-800 font-semibold">
                        🔄 اختتامی بچت خود کار طریقے سے اگلے مہینے <strong>"{allMonthsData[subsequentKey]?.name || subsequentKey}"</strong> سے منسلک ہو جائے گی۔
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleCreate}
            disabled={isDuplicateMonth || isYearTooLow || !selectedYear}
            className={`flex-1 font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-1.5 border shadow-md ${
              isDuplicateMonth || isYearTooLow || !selectedYear
                ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-400/30 cursor-pointer shadow-blue-600/25'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>مہینہ بنائیں</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 backdrop-blur-md bg-slate-200/80 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition border border-slate-300/60 cursor-pointer"
          >
            منسوخ
          </button>
        </div>
      </div>
    </div>
  );
}
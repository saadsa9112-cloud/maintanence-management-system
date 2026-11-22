import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Wallet, AlertCircle, Building2, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { sortMonthsChronologically } from '../utils/monthUtils';

export default function OpeningBalancesReviewModal({
  isOpen,
  onClose,
  allMonthsData = {},
  monthOrder = [],
  onSaveBalances,
  activeMonthKey,
  onSelectMonth,
  buildingName = 'AL MUSTAFA HEIGHTS',
  lang = 'roman'
}) {
  const sortedMonthKeys = useMemo(() => {
    return sortMonthsChronologically(monthOrder && monthOrder.length > 0 ? monthOrder : Object.keys(allMonthsData || {}));
  }, [monthOrder, allMonthsData]);

  // Local state for each month's opening balance
  const [balances, setBalances] = useState({});

  useEffect(() => {
    if (isOpen) {
      const initial = {};
      sortedMonthKeys.forEach(mKey => {
        initial[mKey] = Number(allMonthsData[mKey]?.prevSavings || 0);
      });
      setBalances(initial);
    }
  }, [isOpen, sortedMonthKeys, allMonthsData]);

  if (!isOpen) return null;

  const handleChange = (mKey, value) => {
    const num = value === '' ? '' : Number(value);
    setBalances(prev => ({
      ...prev,
      [mKey]: num
    }));
  };

  const handleSaveAll = () => {
    const sanitized = {};
    Object.entries(balances).forEach(([k, v]) => {
      sanitized[k] = v === '' ? 0 : Number(v) || 0;
    });
    onSaveBalances(sanitized);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in no-print-overlay">
      <div className="backdrop-blur-2xl bg-white/95 rounded-3xl border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.25)] max-w-3xl w-full p-5 sm:p-6 text-slate-900 relative space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 text-indigo-700 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900">
                {lang === 'ur'
                  ? 'تمام مہینوں کی پچھلی بچت (Opening Cash Balances)'
                  : 'Har Mahine Ki Opening Cash Balance (Pichli Bachat)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {buildingName} — Har mahine ka balance mustaqil aur alag alag save rahega
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-3 flex items-start gap-2 text-xs text-indigo-950">
          <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Mustaqil Record:</strong> Har mahine ka opening balance bilkul <strong>alag aur independent</strong> hai. Kisi aik mahine ka balance edit karne se doosre mahine ka balance tabdeel nahi hoga.
          </p>
        </div>

        {/* Table of Months */}
        <div className="overflow-y-auto flex-1 rounded-2xl border border-slate-200/80 bg-slate-50/50">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200 sticky top-0">
              <tr>
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3">Mahina (Month)</th>
                <th className="p-3 text-center">پچھلی بچت (Opening Balance)</th>
                <th className="p-3 text-center">Kul Wusooli</th>
                <th className="p-3 text-center">Kul Kharcha</th>
                <th className="p-3 text-center">Khatmi Bachat (Closing)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {sortedMonthKeys.map((mKey, idx) => {
                const mData = allMonthsData[mKey] || {};
                const mName = mData.name || mKey;
                const coll = (mData.flats || []).reduce((acc, f) => acc + (f && f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
                const exp = (mData.expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
                const currOpenBal = balances[mKey] !== undefined ? balances[mKey] : Number(mData.prevSavings || 0);
                const closing = (Number(currOpenBal) || 0) + coll - exp;
                const isActive = mKey === activeMonthKey;

                return (
                  <tr
                    key={mKey}
                    className={`hover:bg-indigo-50/40 transition ${
                      isActive ? 'bg-indigo-50/70 font-semibold' : 'bg-white'
                    }`}
                  >
                    <td className="p-2.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{mName}</span>
                        {isActive && (
                          <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded-md">
                            Current
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="inline-flex items-center gap-1 bg-white border-2 border-indigo-200 rounded-xl px-2 py-1 shadow-2xs focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100">
                        <span className="text-slate-400 font-bold text-[11px]">Rs.</span>
                        <input
                          type="number"
                          value={currOpenBal}
                          onChange={(e) => handleChange(mKey, e.target.value)}
                          className="w-24 text-center font-black text-slate-900 text-xs focus:outline-none"
                          placeholder="0"
                        />
                      </div>
                    </td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">
                      Rs. {coll.toLocaleString('en-US')}
                    </td>
                    <td className="p-2.5 text-center font-bold text-rose-700">
                      Rs. {exp.toLocaleString('en-US')}
                    </td>
                    <td className="p-2.5 text-center font-black text-indigo-950">
                      Rs. {closing.toLocaleString('en-US')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Total Months: <strong>{sortedMonthKeys.length}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save All Opening Balances</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

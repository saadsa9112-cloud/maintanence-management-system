import React from 'react';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { autoConvertRomanToUrdu } from '../utils/romanToUrdu';

export default function ExpensesGrid({
  expenses,
  onUpdateExpenses,
  prevSavings,
  onUpdatePrevSavings,
  totalCollected,
  isFinalized
}) {
  // Handle cell edit
  const handleCellChange = (index, field, value) => {
    const updated = [...expenses];
    if (field === 'amount') {
      updated[index] = { ...updated[index], amount: value === '' ? 0 : Number(value) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onUpdateExpenses(updated);
  };

  // Convert Roman to Urdu on blur or space
  const handleDescriptionBlur = (index) => {
    const item = expenses[index];
    if (item && item.desc) {
      const converted = autoConvertRomanToUrdu(item.desc);
      if (converted !== item.desc) {
        const updated = [...expenses];
        updated[index] = { ...updated[index], desc: converted };
        onUpdateExpenses(updated);
      }
    }
  };

  const handleDetailsBlur = (index) => {
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

  // Add new expense row
  const handleAddExpense = () => {
    const newId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id || 0)) + 1 : 1;
    const newExp = {
      id: newId,
      desc: '',
      amount: 0,
      details: ''
    };
    onUpdateExpenses([...expenses, newExp]);
  };

  // Delete expense row
  const handleDeleteExpense = (index) => {
    const item = expenses[index];
    if (!window.confirm(`کیا آپ اس خرچے "${item.desc || 'خرچہ'}" کو حذف کرنا چاہتے ہیں؟`)) return;
    const updated = expenses.filter((_, idx) => idx !== index);
    onUpdateExpenses(updated);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const closingSavings = (Number(totalCollected) || 0) + (Number(prevSavings) || 0) - totalExpenses;

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col justify-between">
      <div>
        {/* Table Header Bar */}
        <div className="bg-amber-900 text-white p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧾</span>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base">بلڈنگ کے ماہانہ اخراجات (Expenses)</h2>
              <p className="text-[11px] text-amber-200">
                💡 رومن میں لکھیں (مثلاً bijli ka bill, motor operator, jamadar, gatar ka kam) — خود اردو بن جائے گا!
              </p>
            </div>
          </div>
          <span className="text-xs bg-amber-800 text-amber-100 px-2.5 py-1 rounded-full font-bold">
            {expenses.length} مدات
          </span>
        </div>

        {/* Expenses Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm border-collapse">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 text-xs font-extrabold uppercase">
              <tr>
                <th className="p-2.5 text-center w-10 border-l border-slate-200">#</th>
                <th className="p-2.5 border-l border-slate-200">خرچے کی تفصیل (رومن میں لکھیں)</th>
                <th className="p-2.5 text-center w-28 border-l border-slate-200">رقم (روپے)</th>
                <th className="p-2.5 border-l border-slate-200 min-w-[120px]">نوٹس / تاریخ</th>
                {!isFinalized && <th className="p-2.5 text-center w-12 no-print">حذف</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {expenses.map((exp, idx) => (
                <tr key={exp.id || idx} className="hover:bg-amber-50/40 transition bg-white">
                  {/* S.No */}
                  <td className="p-1 text-center text-slate-400 font-bold border-l border-slate-200">
                    {idx + 1}
                  </td>

                  {/* Description (Direct Input + Roman to Urdu on blur) */}
                  <td className="p-0 border-l border-slate-200">
                    <input
                      type="text"
                      value={exp.desc || ''}
                      disabled={isFinalized}
                      onChange={(e) => handleCellChange(idx, 'desc', e.target.value)}
                      onBlur={() => handleDescriptionBlur(idx)}
                      className="cell-input font-bold text-slate-900"
                      placeholder="bijli ka bill, motor operator, jamadar..."
                    />
                  </td>

                  {/* Amount (Direct Input) */}
                  <td className="p-0 border-l border-slate-200">
                    <input
                      type="number"
                      value={exp.amount ?? ''}
                      disabled={isFinalized}
                      onChange={(e) => handleCellChange(idx, 'amount', e.target.value)}
                      className="cell-input text-center font-black text-rose-700 text-sm"
                      placeholder="0"
                    />
                  </td>

                  {/* Details / Note (Direct Input + Roman to Urdu on blur) */}
                  <td className="p-0 border-l border-slate-200">
                    <input
                      type="text"
                      value={exp.details || ''}
                      disabled={isFinalized}
                      onChange={(e) => handleCellChange(idx, 'details', e.target.value)}
                      onBlur={() => handleDetailsBlur(idx)}
                      className="cell-input text-xs text-slate-600"
                      placeholder="تفصیلات / تاریخ..."
                    />
                  </td>

                  {/* Delete Button */}
                  {!isFinalized && (
                    <td className="p-1.5 text-center no-print">
                      <button
                        onClick={() => handleDeleteExpense(idx)}
                        className="text-slate-300 hover:text-rose-600 transition p-1"
                        title="خرچہ حذف کریں"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Expense Button */}
        {!isFinalized && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 no-print flex items-center justify-between">
            <button
              onClick={handleAddExpense}
              className="bg-amber-700 hover:bg-amber-800 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>نیا خرچہ درج کریں (+ Add Expense)</span>
            </button>
            <span className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>رومن ٹائپنگ خود بخود اردو میں تبدیل ہو جائے گی</span>
            </span>
          </div>
        )}
      </div>

      {/* Cash Flow Summary Footer Box */}
      <div className="p-4 bg-slate-50 border-t border-slate-300 space-y-2.5 text-xs sm:text-sm">
        {/* Total Expenses */}
        <div className="flex justify-between items-center py-1 border-b border-slate-200">
          <span className="font-bold text-rose-800 flex items-center gap-1">
            <span>📉</span> کل بلڈنگ اخراجات:
          </span>
          <span className="font-black text-rose-700 text-base">
            Rs. {Number(totalExpenses).toLocaleString('en-US')}
          </span>
        </div>

        {/* Opening Balance (Directly Editable) */}
        <div className="flex justify-between items-center py-1 border-b border-slate-200">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <span>🏦</span> پچھلی بچت (Opening Cash):
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-bold">Rs.</span>
            <input
              type="number"
              value={prevSavings ?? ''}
              disabled={isFinalized}
              onChange={(e) => onUpdatePrevSavings(e.target.value === '' ? 0 : Number(e.target.value))}
              className="w-28 py-1 px-2 border-2 border-indigo-200 rounded-lg text-center font-extrabold text-sm focus:border-indigo-600 focus:outline-none bg-white text-indigo-950"
              placeholder="0"
            />
          </div>
        </div>

        {/* Closing Cash Balance */}
        <div className="flex justify-between items-center py-2 bg-emerald-100/80 px-3 rounded-xl border border-emerald-300">
          <span className="font-black text-emerald-950 flex items-center gap-1">
            <span>💵</span> حتمی بچت (Closing Cash in Hand):
          </span>
          <span className="font-black text-emerald-800 text-base sm:text-lg">
            Rs. {Number(closingSavings).toLocaleString('en-US')}
          </span>
        </div>
      </div>
    </div>
  );
}

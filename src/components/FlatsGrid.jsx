import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Lock, Search } from 'lucide-react';

export default function FlatsGrid({ flats, onUpdateFlats, monthName, buildingName, isFinalized }) {
  const [filter, setFilter] = useState('all'); // 'all', 'arrears', 'paid'
  const [search, setSearch] = useState('');

  // Handle cell edit
  const handleCellChange = (index, field, value) => {
    const updated = [...flats];
    const item = { ...updated[index] };

    if (field === 'due' || field === 'paid' || field === 'arrears') {
      const numVal = value === '' ? 0 : Number(value);
      item[field] = numVal;

      // When paid changes, calculate arrears and status automatically unless status is closed
      if (field === 'paid' && item.status !== 'closed') {
        const due = Number(item.due) || 0;
        if (numVal >= due) {
          item.arrears = 0;
          item.status = 'paid';
        } else {
          item.arrears = due - numVal;
          item.status = 'arrears';
        }
      } else if (field === 'due' && item.status !== 'closed') {
        const paid = Number(item.paid) || 0;
        if (paid >= numVal) {
          item.arrears = 0;
          item.status = 'paid';
        } else {
          item.arrears = numVal - paid;
          item.status = 'arrears';
        }
      }
    } else {
      item[field] = value;
    }

    updated[index] = item;
    onUpdateFlats(updated);
  };

  // Toggle quick paid
  const setQuickPaid = (index) => {
    const updated = [...flats];
    const item = { ...updated[index] };
    const due = Number(item.due) || 3000;
    item.paid = due;
    item.arrears = 0;
    item.status = 'paid';
    updated[index] = item;
    onUpdateFlats(updated);
  };

  // Toggle home closed
  const toggleClosed = (index) => {
    const updated = [...flats];
    const item = { ...updated[index] };
    if (item.status === 'closed') {
      item.status = item.arrears > 0 ? 'arrears' : 'paid';
    } else {
      item.status = 'closed';
      item.paid = 0;
      item.arrears = 0;
    }
    updated[index] = item;
    onUpdateFlats(updated);
  };

  // Add new flat row
  const handleAddRow = () => {
    const newSno = flats.length + 1;
    const newFlat = {
      sno: newSno,
      flat: `F-${newSno}`,
      name: '',
      due: 3000,
      paid: 0,
      arrears: 3000,
      status: 'arrears',
      phone: ''
    };
    onUpdateFlats([...flats, newFlat]);
  };

  // Delete flat row
  const handleDeleteRow = (index) => {
    if (!window.confirm(`کیا آپ اس فلیٹ (${flats[index].flat}) کی قطار حذف کرنا چاہتے ہیں؟`)) return;
    const updated = flats.filter((_, idx) => idx !== index).map((f, i) => ({ ...f, sno: i + 1 }));
    onUpdateFlats(updated);
  };

  // Mark all active flats paid
  const handleMarkAllPaid = () => {
    if (!window.confirm('کیا آپ تمام فعال فلیٹس کو مکمل ادا شدہ درج کرنا چاہتے ہیں؟')) return;
    const updated = flats.map(f => {
      if (f.status === 'closed') return f;
      const due = Number(f.due) || 3000;
      return {
        ...f,
        paid: due,
        arrears: 0,
        status: 'paid'
      };
    });
    onUpdateFlats(updated);
  };

  // Filtering
  const filteredFlats = flats.filter((f) => {
    if (filter === 'arrears' && f.status !== 'arrears') return false;
    if (filter === 'paid' && f.status !== 'paid') return false;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchFlat = (f.flat || '').toLowerCase().includes(q);
      const matchName = (f.name || '').toLowerCase().includes(q);
      if (!matchFlat && !matchName) return false;
    }
    return true;
  });

  // Calculate totals
  const totalDue = flats.reduce((sum, f) => sum + (f.status !== 'closed' ? Number(f.due || 0) : 0), 0);
  const totalPaid = flats.reduce((sum, f) => sum + (f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
  const totalArrears = flats.reduce((sum, f) => sum + (f.status === 'arrears' || (f.status !== 'closed' && Number(f.arrears) > 0) ? Number(f.arrears || 0) : 0), 0);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Table Header Bar */}
      <div className="bg-slate-900 text-white p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏢</span>
          <div>
            <h2 className="font-extrabold text-sm sm:text-base">فلیٹس اور مینٹیننس وصولی رجسٹر</h2>
            <p className="text-[11px] text-slate-300">سیل پر کلک کر کے براہ راست تبدیل کریں (Excel Style Editable Grid)</p>
          </div>
        </div>

        {/* Controls: Search, Filters, Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-44">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 نام یا فلیٹ تلاش کریں..."
              className="w-full bg-slate-800 text-white placeholder-slate-400 text-xs py-1.5 px-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-bold transition ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              سب ({flats.length})
            </button>
            <button
              onClick={() => setFilter('arrears')}
              className={`px-2.5 py-1 rounded-md font-bold transition ${filter === 'arrears' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              صرف بقایا
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-2.5 py-1 rounded-md font-bold transition ${filter === 'paid' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              مکمل ادا
            </button>
          </div>

          {/* Quick Mark All Paid */}
          {!isFinalized && (
            <button
              onClick={handleMarkAllPaid}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-2.5 rounded-lg transition flex items-center gap-1 shadow-xs"
              title="سب فعال فلیٹس کو مکمل ادا شدہ درج کریں"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>سب ادا</span>
            </button>
          )}
        </div>
      </div>

      {/* Finalized Notice */}
      {isFinalized && (
        <div className="bg-amber-100 text-amber-900 px-4 py-2 text-xs font-bold flex items-center gap-2 border-b border-amber-300">
          <Lock className="w-4 h-4 text-amber-700" />
          <span>یہ مہینہ فائنل اور لاک ہے (Finalized & Locked) — تمام خانے محفوظ ہیں، ترامیم کے لیے نیچے سے ان لاک کریں۔</span>
        </div>
      )}

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs sm:text-sm border-collapse">
          <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 text-xs font-extrabold uppercase tracking-wide">
            <tr>
              <th className="p-2.5 text-center w-10 border-l border-slate-200">#</th>
              <th className="p-2.5 text-center w-20 border-l border-slate-200">فلیٹ</th>
              <th className="p-2.5 border-l border-slate-200 min-w-[140px]">رہائشی کا نام</th>
              <th className="p-2.5 text-center w-24 border-l border-slate-200">ماہانہ واجب</th>
              <th className="p-2.5 text-center w-28 border-l border-slate-200">وصول شدہ (Paid)</th>
              <th className="p-2.5 text-center w-24 border-l border-slate-200">بقایا رقم</th>
              <th className="p-2.5 text-center w-28 border-l border-slate-200">اسٹیٹس</th>
              <th className="p-2.5 text-center w-24 no-print">فوری ایکشن</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredFlats.map((flat) => {
              const originalIndex = flats.findIndex((f) => f.sno === flat.sno);
              const isClosed = flat.status === 'closed';
              const isArrears = !isClosed && (Number(flat.arrears) > 0 || Number(flat.paid) < Number(flat.due));
              const isPaid = !isClosed && !isArrears;

              return (
                <tr
                  key={flat.sno}
                  className={`hover:bg-blue-50/50 transition ${
                    isClosed
                      ? 'bg-amber-50/60 text-amber-900'
                      : isArrears
                      ? 'bg-rose-50/40'
                      : 'bg-white'
                  }`}
                >
                  {/* S.No */}
                  <td className="p-1 text-center text-slate-400 font-bold border-l border-slate-200">
                    {flat.sno}
                  </td>

                  {/* Flat No (Direct input) */}
                  <td className="p-0 border-l border-slate-200">
                    <input
                      type="text"
                      value={flat.flat || ''}
                      disabled={isFinalized}
                      onChange={(e) => handleCellChange(originalIndex, 'flat', e.target.value)}
                      className={`cell-input text-center font-extrabold text-slate-900 ${isFinalized ? 'cursor-not-allowed bg-slate-50' : ''}`}
                      placeholder="G-1"
                    />
                  </td>

                  {/* Resident Name (Direct input) */}
                  <td className="p-0 border-l border-slate-200">
                    <input
                      type="text"
                      value={flat.name || ''}
                      disabled={isFinalized}
                      onChange={(e) => handleCellChange(originalIndex, 'name', e.target.value)}
                      className={`cell-input font-bold text-slate-900 ${isFinalized ? 'cursor-not-allowed bg-slate-50' : ''}`}
                      placeholder="رہائشی کا نام..."
                    />
                  </td>

                  {/* Monthly Due (Direct input) */}
                  <td className="p-0 border-l border-slate-200">
                    <input
                      type="number"
                      value={isClosed ? '' : (flat.due ?? '')}
                      disabled={isClosed || isFinalized}
                      onChange={(e) => handleCellChange(originalIndex, 'due', e.target.value)}
                      className={`cell-input text-center font-bold text-slate-700 ${isClosed || isFinalized ? 'bg-amber-100/50 text-slate-400 cursor-not-allowed' : ''}`}
                      placeholder={isClosed ? '-' : '3000'}
                    />
                  </td>

                  {/* Collected / Paid (Direct input) */}
                  <td className="p-0 border-l border-slate-200">
                    <input
                      type="number"
                      value={isClosed ? '' : (flat.paid ?? '')}
                      disabled={isClosed || isFinalized}
                      onChange={(e) => handleCellChange(originalIndex, 'paid', e.target.value)}
                      className={`cell-input text-center font-black ${
                        isClosed || isFinalized
                          ? 'bg-amber-100/50 text-slate-400 cursor-not-allowed'
                          : isPaid
                          ? 'text-emerald-700 font-extrabold'
                          : 'text-rose-700 font-extrabold'
                      }`}
                      placeholder={isClosed ? 'بند' : '0'}
                    />
                  </td>

                  {/* Arrears (Direct input) */}
                  <td className="p-0 border-l border-slate-200">
                    <input
                      type="number"
                      value={isClosed ? '' : (flat.arrears ?? '')}
                      disabled={isClosed || isFinalized}
                      onChange={(e) => handleCellChange(originalIndex, 'arrears', e.target.value)}
                      className={`cell-input text-center font-extrabold ${
                        isClosed || isFinalized
                          ? 'bg-amber-100/50 text-slate-400 cursor-not-allowed'
                          : Number(flat.arrears) > 0
                          ? 'text-rose-700 bg-rose-50/70 font-black'
                          : 'text-slate-400'
                      }`}
                      placeholder={isClosed ? '-' : '0'}
                    />
                  </td>

                  {/* Status Badge */}
                  <td className="p-1.5 text-center border-l border-slate-200">
                    {isClosed ? (
                      <span className="inline-block bg-amber-200 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
                        🔒 گھر بند
                      </span>
                    ) : isArrears ? (
                      <span className="inline-block bg-rose-100 text-rose-800 text-xs font-bold px-2 py-0.5 rounded-full">
                        ⚠️ بقایا
                      </span>
                    ) : (
                      <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                        مکمل ادا ✓
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-1.5 text-center no-print">
                    <div className="flex items-center justify-center gap-1">
                      {/* Quick pay button */}
                      <button
                        onClick={() => setQuickPaid(originalIndex)}
                        disabled={isClosed || isFinalized}
                        className={`bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1 rounded-md text-xs transition ${
                          isClosed || isFinalized ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title="مکمل وصولی درج کریں"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>

                      {/* Lock closed button */}
                      <button
                        onClick={() => toggleClosed(originalIndex)}
                        disabled={isFinalized}
                        className={`p-1 rounded-md text-xs font-bold transition ${
                          isFinalized
                            ? 'opacity-30 cursor-not-allowed bg-slate-200 text-slate-400'
                            : isClosed
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        }`}
                        title={isClosed ? 'گھر کھولیں (فعال کریں)' : 'گھر بند درج کریں'}
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete row */}
                      {!isFinalized && (
                        <button
                          onClick={() => handleDeleteRow(originalIndex)}
                          className="text-slate-300 hover:text-rose-600 p-1 transition"
                          title="قطار حذف کریں"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer Total Row */}
          <tfoot className="bg-blue-50 font-extrabold border-t-2 border-slate-400 text-slate-900 text-xs sm:text-sm">
            <tr>
              <td colSpan="3" className="p-3 text-center text-blue-950 font-black">
                کُل میزان (Total Summary)
              </td>
              <td className="p-3 text-center text-slate-800 border-l border-slate-300 font-bold">
                Rs. {Number(totalDue).toLocaleString('en-US')}
              </td>
              <td className="p-3 text-center text-emerald-800 border-l border-slate-300 font-black text-base">
                Rs. {Number(totalPaid).toLocaleString('en-US')}
              </td>
              <td className="p-3 text-center text-rose-700 border-l border-slate-300 font-black text-base">
                Rs. {Number(totalArrears).toLocaleString('en-US')}
              </td>
              <td colSpan="2" className="p-3 text-center text-xs text-slate-600">
                {flats.length} فلیٹس رجسٹرڈ
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bottom Bar: Add Row Button */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between no-print">
        {!isFinalized ? (
          <button
            onClick={handleAddRow}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>نیا فلیٹ / قطار شامل کریں (+ Add Flat)</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-amber-800 font-bold">
            <Lock className="w-4 h-4" />
            <span>مہینہ فائنل ہے (اضافی فلیٹ شامل کرنے کے لیے پہلے ان لاک کریں)</span>
          </div>
        )}

        <span className="text-xs text-slate-500 font-medium">
          💡 کسی بھی خانے میں کلک کر کے رقم یا نام فوراً بدلیں — خود بخود محفوظ ہو جاتا ہے۔
        </span>
      </div>
    </div>
  );
}

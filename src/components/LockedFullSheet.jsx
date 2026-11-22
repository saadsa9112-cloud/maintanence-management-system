import React from 'react';
import {
  Lock,
  Unlock,
  FileSpreadsheet,
  Printer,
  MessageCircle,
  TrendingUp,
  Receipt,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar
} from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import { openGroupWhatsApp } from '../utils/whatsapp';
import { formatResidentDisplayName } from '../utils/residentUtils';

export default function LockedFullSheet({
  flats = [],
  expenses = [],
  prevSavings = 0,
  monthName,
  dateStr = '',
  onUpdateDate,
  buildingName,
  onUnlock,
  t,
  lang,
  onNotify
}) {
  const totalCollected = (flats || []).reduce((acc, f) => acc + (f && f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
  const totalArrears = (flats || []).reduce((acc, f) => acc + (f && (f.status === 'arrears' || (f.status !== 'closed' && Number(f.arrears) > 0)) ? Number(f.arrears || 0) : 0), 0);
  const totalExpenses = (expenses || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const closingBalance = totalCollected + Number(prevSavings || 0) - totalExpenses;

  const unpaidFlats = (flats || []).filter(f => f && (f.status === 'arrears' || (f.status !== 'closed' && Number(f.arrears) > 0)));
  const paidFlats = (flats || []).filter(f => f && f.status === 'paid' && Number(f.paid) > 0);

  const handleDownloadExcel = async () => {
    try {
      await exportToExcel(monthName, { flats, expenses, prevSavings, name: monthName, dateStr }, buildingName);
      if (onNotify) onNotify(`Excel sheet downloaded for ${monthName}! 📊`);
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Sleek Glassmorphism Lock & Action Bar */}
      <div className="backdrop-blur-xl bg-gradient-to-r from-amber-500/15 via-white/80 to-blue-500/10 border border-amber-300/40 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold shrink-0">
            <Lock className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {buildingName}
              </h2>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300/80 px-2 py-0.5 rounded-lg">
                🔒 {monthName} — Finalized & Locked
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {lang === 'ur'
                ? 'فائنل رجسٹر مقفل ہے۔ آپ اسٹیٹمنٹ پرنٹ یا ان لاک کر سکتے ہیں۔'
                : lang === 'roman'
                ? 'Final register lock hai. Statement print ya unlock karein.'
                : 'Reconciled master register. You can print the official statement or unlock to make adjustments.'}
            </p>
          </div>
        </div>

        {/* Action Glass Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="backdrop-blur-md bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === 'ur' ? 'پرنٹ / PDF' : lang === 'roman' ? 'Print' : 'Print / PDF'}</span>
          </button>

          <button
            onClick={onUnlock}
            className="backdrop-blur-md bg-white hover:bg-slate-50 text-slate-800 font-bold py-2 px-3.5 rounded-xl text-xs transition flex items-center gap-1.5 border border-slate-300 shadow-2xs cursor-pointer"
            title="Unlock to edit records"
          >
            <Unlock className="w-3.5 h-3.5 text-amber-700" />
            <span>{lang === 'ur' ? 'ان لاک کریں' : lang === 'roman' ? 'Unlock Karein' : 'Unlock to Edit'}</span>
          </button>
        </div>
      </div>

      {/* KPI Glass Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="backdrop-blur-xl bg-white/70 border border-white/60 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">💰 {t.totalCollections}</span>
          <h3 className="text-xl sm:text-2xl font-black text-emerald-700">
            Rs. {totalCollected.toLocaleString('en-US')}
          </h3>
          <span className="text-[10px] text-slate-400 font-semibold">{paidFlats.length} flats cleared</span>
        </div>

        <div className="backdrop-blur-xl bg-white/70 border border-white/60 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">🏦 {t.previousSavings}</span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800">
            Rs. {Number(prevSavings).toLocaleString('en-US')}
          </h3>
          <span className="text-[10px] text-slate-400 font-semibold">Prior month carryover</span>
        </div>

        <div className="backdrop-blur-xl bg-white/70 border border-white/60 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">🧾 {t.totalExpenses}</span>
          <h3 className="text-xl sm:text-2xl font-black text-rose-700">
            Rs. {totalExpenses.toLocaleString('en-US')}
          </h3>
          <span className="text-[10px] text-slate-400 font-semibold">{expenses.length} vouchers</span>
        </div>

        <div className="backdrop-blur-xl bg-white/70 border border-white/60 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">💵 {t.netSavings}</span>
          <h3 className={`text-xl sm:text-2xl font-black ${closingBalance >= 0 ? 'text-blue-900' : 'text-rose-700'}`}>
            Rs. {closingBalance.toLocaleString('en-US')}
          </h3>
          <span className="text-[10px] text-slate-400 font-semibold">Net closing cash reserve</span>
        </div>
      </div>

      {/* Complete Master 8-Column Finalized Sheet (Glass Table) */}
      <div className="backdrop-blur-2xl bg-white/80 border border-white/80 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.08)] printable-a4-portrait">
        {/* Document Header */}
        <div className="text-center pb-4 border-b-2 border-slate-700">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wider uppercase">
            {buildingName}
          </h1>
          <p className="text-xs font-bold text-slate-600 mt-0.5">
            ماہانہ مینٹیننس وصولی و اخراجات حتمی رجسٹر (FINALIZED MONTHLY MASTER REGISTER)
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between text-xs font-extrabold text-slate-800 border-t border-slate-300 pt-2 px-2 gap-2">
            <div className="flex items-center gap-1.5 bg-blue-50/90 hover:bg-white px-2.5 py-1 rounded-xl border border-blue-200 shadow-xs transition">
              <Calendar className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <span className="text-slate-600 font-bold">{lang === 'ur' ? 'تاریخ:' : 'تاریخ:'}</span>
              <input
                type="text"
                value={dateStr || ''}
                onChange={(e) => onUpdateDate && onUpdateDate(e.target.value)}
                className="font-mono font-black text-blue-950 bg-white/80 hover:bg-white px-1.5 py-0.5 rounded border border-blue-300 text-xs w-28 text-center focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-text"
                placeholder="3-Oct-2026"
                title="Click to edit statement / creation date"
              />
            </div>
            <span className="text-sm font-black text-blue-900 uppercase">ماہ: {monthName}</span>
          </div>
        </div>

        {/* 8-Column Table (A to H) */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-right text-[11px] border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-200/90 text-slate-900 font-black text-center border-b-2 border-slate-700">
                <th className="p-2 border border-slate-400 w-[24%] text-right">تفصیلات (Notes)</th>
                <th className="p-2 border border-slate-400 w-[12%]">اخراجات رقم</th>
                <th className="p-2 border border-slate-400 w-[16%] text-right">اخراجات تفصیل</th>
                <th className="p-2 border border-slate-400 w-[12%]">مینٹیننس (Paid)</th>
                <th className="p-2 border border-slate-400 w-[10%]">بقایا رقم</th>
                <th className="p-2 border border-slate-400 w-[14%] text-right">نام (Resident)</th>
                <th className="p-2 border border-slate-400 w-[8%]">فلیٹ</th>
                <th className="p-2 border border-slate-400 w-[4%]">#</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 20 }).map((_, i) => {
                const flat = flats[i] || null;
                const exp = expenses[i] || null;

                let expDesc = exp ? exp.desc : '';
                let expAmount = exp ? (Number(exp.amount) || '') : '';
                let expDetails = exp ? (exp.details || '') : '';

                if (i === 10) {
                  expDesc = 'کل اخراجات';
                  expAmount = totalExpenses;
                  expDetails = '';
                } else if (i === 17) {
                  expDesc = 'پچھلی بچت';
                  expAmount = prevSavings;
                  expDetails = '';
                } else if (i === 18) {
                  expDesc = 'کل بچت';
                  expAmount = closingBalance;
                  expDetails = '';
                }

                const isClosed = flat?.status === 'closed';
                const hasArrears = !isClosed && (Number(flat?.arrears) > 0);

                return (
                  <tr key={i} className="hover:bg-blue-50/40 transition">
                    {/* Col A */}
                    <td className="p-1.5 border border-slate-300 text-right text-[10px] text-slate-600">
                      {flat?.adjustmentNote || flat?.notes || expDetails}
                    </td>

                    {/* Col B */}
                    <td className={`p-1.5 border border-slate-300 text-center font-bold ${
                      i === 10 ? 'bg-amber-100 font-black text-rose-700' :
                      i === 17 || i === 18 ? 'bg-blue-100 font-black text-blue-950' : 'text-slate-800'
                    }`}>
                      {expAmount !== '' ? Number(expAmount).toLocaleString('en-US') : ''}
                    </td>

                    {/* Col C */}
                    <td className={`p-1.5 border border-slate-300 text-right font-bold ${
                      i === 10 || i === 17 || i === 18 ? 'font-black text-slate-900 bg-slate-100' : 'text-slate-800'
                    }`}>
                      {expDesc}
                    </td>

                    {/* Col D */}
                    <td className={`p-1.5 border border-slate-300 text-center font-black ${
                      isClosed ? 'bg-amber-100 text-amber-900 text-[10px]' : 'text-emerald-800'
                    }`}>
                      {isClosed ? 'گھر بند ہے' : (flat && Number(flat.paid) > 0 ? Number(flat.paid).toLocaleString('en-US') : '-')}
                    </td>

                    {/* Col E */}
                    <td className={`p-1.5 border border-slate-300 text-center font-black ${
                      hasArrears ? 'bg-rose-100 text-rose-700' : 'text-slate-400'
                    }`}>
                      {hasArrears ? Number(flat.arrears).toLocaleString('en-US') : ''}
                    </td>

                    {/* Col F */}
                    <td className="p-1.5 border border-slate-300 text-right font-extrabold text-slate-900">
                      {formatResidentDisplayName(flat)}
                    </td>

                    {/* Col G */}
                    <td className="p-1.5 border border-slate-300 text-center font-black text-slate-900">
                      {flat?.flat || ''}
                    </td>

                    {/* Col H */}
                    <td className="p-1.5 border border-slate-300 text-center text-slate-400 font-bold">
                      {i + 1}
                    </td>
                  </tr>
                );
              })}

              {/* Total Row */}
              <tr className="bg-slate-200 font-black text-xs border-t-2 border-slate-800">
                <td colSpan="3" className="p-2 text-center text-slate-900 font-black border border-slate-400">
                  کُل میزان (Total Reconciled)
                </td>
                <td className="p-2 text-center text-emerald-800 font-black text-sm border border-slate-400">
                  Rs. {totalCollected.toLocaleString('en-US')}
                </td>
                <td className="p-2 text-center text-rose-700 font-black text-sm border border-slate-400">
                  {totalArrears > 0 ? `Rs. ${totalArrears.toLocaleString('en-US')}` : '0'}
                </td>
                <td colSpan="3" className="p-2 text-center text-slate-700 border border-slate-400 text-[11px]">
                  20 فلیٹس تصدیق شدہ
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t-2 border-slate-400 flex items-center justify-between text-xs text-slate-800">
          <div>
            <p><strong>نوٹ:</strong> یہ دستاویز حتمی طور پر لاک اور فائنل کی جا چکی ہے۔</p>
            <p className="text-[10px] text-slate-500">کمپیوٹرائزڈ رپورٹ — المصطفیٰ ہائٹس بلڈنگ مینٹیننس</p>
            <p className="text-xs font-bold text-slate-800 mt-1">
              🏢 Maintenance Managed by: <span className="font-black text-blue-950">Hafiz Muhammad Saad</span>
            </p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b-2 border-slate-900 mb-1"></div>
            <span className="font-black text-xs text-slate-950 block">دستخط: حافظ محمد سعد</span>
            <span className="text-[10px] text-slate-600 font-bold">Building Maintenance Administrator</span>
          </div>
        </div>
      </div>
    </div>
  );
}

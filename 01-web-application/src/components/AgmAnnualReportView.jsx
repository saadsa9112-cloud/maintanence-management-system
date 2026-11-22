import React, { useMemo } from 'react';
import {
  Printer,
  Calendar,
  Building2,
  TrendingUp,
  Receipt,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Award,
  Users,
  ShieldCheck,
  Download,
  Share2
} from 'lucide-react';
import { sortMonthsChronologically } from '../utils/monthUtils';
import { formatResidentDisplayName } from '../utils/residentUtils';

export default function AgmAnnualReportView({
  allMonthsData = {},
  monthOrder = [],
  buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19',
  lang = 'roman',
  onNotify
}) {
  const sortedMonthKeys = useMemo(() => {
    return sortMonthsChronologically(monthOrder && monthOrder.length > 0 ? monthOrder : Object.keys(allMonthsData || {}));
  }, [monthOrder, allMonthsData]);

  // Aggregate annual financial metrics across all chronological months
  const annualSummary = useMemo(() => {
    let totalAnnualCollections = 0;
    let totalAnnualExpenses = 0;
    let totalAnnualExpectedDue = 0;

    const monthlyRowData = [];
    const expenseHeadsMap = {};
    const flatPaymentFrequency = {};

    sortedMonthKeys.forEach((mKey, idx) => {
      const mData = allMonthsData[mKey];
      if (!mData) return;

      const flats = mData.flats || [];
      const expenses = mData.expenses || [];
      const openingCash = Number(mData.prevSavings || 0);

      const monthColl = flats.reduce((sum, f) => sum + (f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
      const monthDue = flats.reduce((sum, f) => sum + (f.status !== 'closed' ? Number(f.due || 0) : 0), 0);
      const monthExp = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const closingCash = openingCash + monthColl - monthExp;

      totalAnnualCollections += monthColl;
      totalAnnualExpenses += monthExp;
      totalAnnualExpectedDue += monthDue;

      monthlyRowData.push({
        monthKey: mKey,
        monthName: mData.name || mKey,
        year: mData.year || 2026,
        openingCash,
        monthColl,
        monthExp,
        closingCash,
        flatsPaidCount: flats.filter(f => f.status === 'paid' && Number(f.paid) > 0).length,
        totalFlats: flats.length
      });

      // Aggregate expense heads
      expenses.forEach(e => {
        const desc = (e.desc || '').trim();
        if (!desc) return;
        const amt = Number(e.amount || 0);
        expenseHeadsMap[desc] = (expenseHeadsMap[desc] || 0) + amt;
      });

      // Track flats punctuality
      flats.forEach(f => {
        if (f.status === 'closed') return;
        if (!flatPaymentFrequency[f.flat]) {
          flatPaymentFrequency[f.flat] = {
            flat: f.flat,
            name: formatResidentDisplayName(f),
            totalPaid: 0,
            monthsPaidCount: 0,
            currentArrears: Number(f.arrears || 0)
          };
        }
        flatPaymentFrequency[f.flat].totalPaid += Number(f.paid || 0);
        if (f.status === 'paid' || Number(f.paid) >= Number(f.due)) {
          flatPaymentFrequency[f.flat].monthsPaidCount += 1;
        }
        // Update to latest month's arrears
        flatPaymentFrequency[f.flat].currentArrears = Number(f.arrears || 0);
      });
    });

    // Top 5 Expense Heads
    const sortedExpenseHeads = Object.entries(expenseHeadsMap)
      .map(([name, total]) => ({
        name,
        total,
        percentage: totalAnnualExpenses > 0 ? Math.round((total / totalAnnualExpenses) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Initial Opening Cash of the first recorded month
    const initialOpening = monthlyRowData[0]?.openingCash || 0;
    // Latest Closing Cash of the last recorded month
    const finalClosing = monthlyRowData[monthlyRowData.length - 1]?.closingCash || 0;
    const netReserveGenerated = totalAnnualCollections - totalAnnualExpenses;

    const recoveryRate = totalAnnualExpectedDue > 0
      ? Math.round((totalAnnualCollections / totalAnnualExpectedDue) * 100)
      : 100;

    // Punctual flats (never had arrears or cleared most months)
    const allFlatsList = Object.values(flatPaymentFrequency);
    const starResidents = allFlatsList
      .filter(f => f.currentArrears === 0 && f.monthsPaidCount >= Math.max(1, sortedMonthKeys.length - 1))
      .sort((a, b) => a.flat.localeCompare(b.flat));

    const pendingDefaulters = allFlatsList
      .filter(f => f.currentArrears > 0)
      .sort((a, b) => b.currentArrears - a.currentArrears);

    return {
      totalAnnualCollections,
      totalAnnualExpenses,
      totalAnnualExpectedDue,
      initialOpening,
      finalClosing,
      netReserveGenerated,
      recoveryRate,
      sortedExpenseHeads,
      monthlyRowData,
      starResidents,
      pendingDefaulters
    };
  }, [allMonthsData, sortedMonthKeys]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Screen Only) */}
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-black text-slate-900">
              📊 سالانہ جنرل میٹنگ (AGM) ایگزیکٹو فنانشل رپورٹ
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            1-Page official executive audit summary for Annual General Body Meeting distribution.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="bg-slate-900 hover:bg-slate-800 text-white font-black py-2.5 px-5 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          <span>پرنٹ رپورٹ (Print 1-Page AGM Report)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* PRINTABLE A4 SINGLE-PAGE EXECUTIVE REPORT CONTAINER      */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-300 shadow-md printable-a4-portrait">
        {/* Document Header */}
        <div className="text-center border-b-2 border-slate-800 pb-3">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wider uppercase">
            {buildingName}
          </h1>
          <p className="text-xs font-black text-slate-700 mt-0.5">
            سالانہ جنرل میٹنگ (AGM) مالیاتی ایگزیکٹو آڈٹ رپورٹ (ANNUAL EXECUTIVE AUDIT REPORT)
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-600 border-t border-slate-200 pt-1.5 px-1">
            <span>تاریخِ اجراء: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            <span className="text-blue-900 font-black">مالیاتی مدت: {sortedMonthKeys[0]} تا {sortedMonthKeys[sortedMonthKeys.length - 1]}</span>
            <span>بمقام: بلڈنگ کمیٹی آفس</span>
          </div>
        </div>

        {/* 4 Core Financial KPI Blocks */}
        <div className="grid grid-cols-4 gap-3 mt-4 text-center">
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-2.5">
            <span className="text-[10px] font-bold text-slate-500 block">کُل سالانہ وصولیاں (Collections)</span>
            <span className="text-base sm:text-lg font-black text-emerald-800 font-mono">
              Rs. {annualSummary.totalAnnualCollections.toLocaleString('en-US')}
            </span>
          </div>

          <div className="bg-rose-50 border border-rose-300 rounded-2xl p-2.5">
            <span className="text-[10px] font-bold text-slate-500 block">کُل سالانہ اخراجات (Expenses)</span>
            <span className="text-base sm:text-lg font-black text-rose-800 font-mono">
              Rs. {annualSummary.totalAnnualExpenses.toLocaleString('en-US')}
            </span>
          </div>

          <div className="bg-blue-50 border border-blue-300 rounded-2xl p-2.5">
            <span className="text-[10px] font-bold text-slate-500 block">موجودہ محفوظ بچت (Reserve Cash)</span>
            <span className="text-base sm:text-lg font-black text-blue-950 font-mono">
              Rs. {annualSummary.finalClosing.toLocaleString('en-US')}
            </span>
          </div>

          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-2.5">
            <span className="text-[10px] font-bold text-slate-500 block">وصولی شرح (Recovery Rate)</span>
            <span className="text-base sm:text-lg font-black text-amber-900 font-mono">
              {annualSummary.recoveryRate}%
            </span>
          </div>
        </div>

        {/* Two-Column Middle Section: Monthly Trend & Top Expenses */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mt-4">
          {/* Left Table: 12-Month Financial Timeline (7 cols) */}
          <div className="sm:col-span-7">
            <h3 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center justify-between">
              <span>🗓️ ماہ بہ ماہ مالیاتی خلاصہ (Monthly Financial Trail)</span>
              <span className="text-[10px] text-slate-400 font-normal">{sortedMonthKeys.length} Months Tracked</span>
            </h3>

            <table className="w-full text-right text-[10px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 font-black text-slate-800 text-center border-b border-slate-300">
                  <th className="p-1 border border-slate-300 text-right">ماہ</th>
                  <th className="p-1 border border-slate-300">سابقہ بچت</th>
                  <th className="p-1 border border-slate-300">وصولی</th>
                  <th className="p-1 border border-slate-300">اخراجات</th>
                  <th className="p-1 border border-slate-300">اختتامی کیش</th>
                </tr>
              </thead>
              <tbody>
                {annualSummary.monthlyRowData.map((row) => (
                  <tr key={row.monthKey} className="border-b border-slate-200">
                    <td className="p-1 border border-slate-300 font-bold text-slate-900">{row.monthName}</td>
                    <td className="p-1 border border-slate-300 text-center font-mono">Rs. {row.openingCash.toLocaleString('en-US')}</td>
                    <td className="p-1 border border-slate-300 text-center font-mono font-bold text-emerald-800">Rs. {row.monthColl.toLocaleString('en-US')}</td>
                    <td className="p-1 border border-slate-300 text-center font-mono font-bold text-rose-800">Rs. {row.monthExp.toLocaleString('en-US')}</td>
                    <td className="p-1 border border-slate-300 text-center font-mono font-black text-blue-950">Rs. {row.closingCash.toLocaleString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-200 font-black text-slate-900 text-center">
                  <td className="p-1 border border-slate-300 text-right">سالانہ میزان:</td>
                  <td className="p-1 border border-slate-300 font-mono">Rs. {annualSummary.initialOpening.toLocaleString('en-US')}</td>
                  <td className="p-1 border border-slate-300 font-mono text-emerald-900">Rs. {annualSummary.totalAnnualCollections.toLocaleString('en-US')}</td>
                  <td className="p-1 border border-slate-300 font-mono text-rose-900">Rs. {annualSummary.totalAnnualExpenses.toLocaleString('en-US')}</td>
                  <td className="p-1 border border-slate-300 font-mono text-blue-950">Rs. {annualSummary.finalClosing.toLocaleString('en-US')}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Right Column: Top 5 Expense Heads (5 cols) */}
          <div className="sm:col-span-5">
            <h3 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-1 mb-2">
              🧾 سب سے بڑے اخراجات (Top 5 Expense Heads)
            </h3>

            <div className="space-y-1.5">
              {annualSummary.sortedExpenseHeads.map((exp, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 p-1.5 rounded-xl text-[11px]">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span className="truncate">{idx + 1}. {exp.name}</span>
                    <span className="font-mono text-slate-950">Rs. {exp.total.toLocaleString('en-US')}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, exp.percentage)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 block text-left mt-0.5">{exp.percentage}% of total budget</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section: Punctual Residents & Defaulters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-300 text-xs">
          {/* Punctual Residents */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 font-black text-emerald-900 border-b border-emerald-200 pb-1.5 mb-2">
              <Award className="w-4 h-4 text-amber-600 shrink-0" />
              <span>اعزازی فہرست: باقاعدہ و وقت پر ادائیگی والے فلیٹس</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {annualSummary.starResidents.map(r => (
                <span
                  key={r.flat}
                  className="bg-white border border-emerald-300 text-emerald-900 font-bold px-2 py-0.5 rounded-lg text-[10px]"
                >
                  فلیٹ {r.flat} ({formatResidentDisplayName(r)}) ✓
                </span>
              ))}
            </div>
          </div>

          {/* Pending Defaulters */}
          <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 font-black text-rose-900 border-b border-rose-200 pb-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>زیرِ التواء بقایا جات (Defaulters Recovery Action)</span>
            </div>
            {annualSummary.pendingDefaulters.length === 0 ? (
              <p className="text-[11px] text-emerald-700 font-bold">ماشاءاللہ! عمارت میں کوئی بقایا موجود نہیں ہے۔</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {annualSummary.pendingDefaulters.map(r => (
                  <span
                    key={r.flat}
                    className="bg-white border border-rose-300 text-rose-800 font-bold px-2 py-0.5 rounded-lg text-[10px]"
                  >
                    فلیٹ {r.flat}: Rs. {r.currentArrears.toLocaleString('en-US')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Document Formal Sign-Off Footer */}
        <div className="mt-5 pt-3 border-t-2 border-slate-800 flex items-end justify-between text-[11px] text-slate-700 font-bold">
          <div>
            <p>ایڈمنسٹریٹر و آڈٹ انچارج: <span className="font-black text-slate-900">حافظ محمد سعد</span></p>
            <p className="text-[10px] text-slate-500 font-normal">تمام رسیدیں اور واؤچرز بلڈنگ ریکارڈ میں محفوظ و تصدیق شدہ ہیں۔</p>
          </div>

          <div className="text-center">
            <div className="w-32 border-b border-slate-700 pb-6 mb-1" />
            <span className="text-[10px] font-bold text-slate-600">دستخط صدر / جنرل باڈی</span>
          </div>
        </div>
      </div>
    </div>
  );
}

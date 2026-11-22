import React from 'react';
import { DollarSign, AlertTriangle, TrendingDown, Landmark, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';

export default function KPICards({ stats }) {
  const {
    totalCollected,
    totalArrears,
    totalExpenses,
    closingSavings,
    prevSavings,
    paidCount,
    arrearsCount,
    closedCount,
    totalActiveFlats
  } = stats;

  const recoveryPercent = totalActiveFlats > 0 
    ? Math.round((paidCount / totalActiveFlats) * 100) 
    : 0;

  return (
    <div className="space-y-3">
      {/* 4 Cards Grid - Modern Enterprise SaaS Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Collected */}
        <div className="erp-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Collected • وصول شدہ
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
              Rs. {Number(totalCollected || 0).toLocaleString('en-US')}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                <ArrowUpRight className="w-3 h-3" />
                {recoveryPercent}% Recovery
              </span>
              <span className="text-[11px] text-slate-500">
                ({paidCount}/{totalActiveFlats} paid)
              </span>
            </div>
          </div>
        </div>

        {/* Total Arrears */}
        <div className="erp-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pending Arrears • بقایا جات
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-rose-600 tracking-tight font-mono">
              Rs. {Number(totalArrears || 0).toLocaleString('en-US')}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                <ArrowDownRight className="w-3 h-3" />
                {arrearsCount} Flats Due
              </span>
              <span className="text-[11px] text-slate-500">
                Outstanding
              </span>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="erp-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Expenses • کل اخراجات
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
              Rs. {Number(totalExpenses || 0).toLocaleString('en-US')}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1.5">
              Monthly Operational Overhead
            </div>
          </div>
        </div>

        {/* Closing Cash Balance */}
        <div className="erp-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Closing Balance • حتمی بچت
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-extrabold tracking-tight font-mono ${Number(closingSavings || 0) >= 0 ? 'text-blue-900' : 'text-rose-600'}`}>
              Rs. {Number(closingSavings || 0).toLocaleString('en-US')}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1.5 truncate">
              Opening: Rs. {Number(prevSavings || 0).toLocaleString('en-US')}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Status Strip - Sleek Enterprise Ribbon */}
      <div className="bg-white border border-slate-200/80 rounded-xl py-2 px-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-bold">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <span>Building Units Summary (فلیٹ سمری):</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{paidCount} Fully Paid (ادا شدہ)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{arrearsCount} Arrears (بقایا جات)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>{closedCount} Closed (گھر بند)</span>
          </span>
        </div>
      </div>
    </div>
  );
}

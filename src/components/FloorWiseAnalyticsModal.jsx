import React, { useMemo } from 'react';
import { X, Building2, CheckCircle2, AlertTriangle, TrendingUp, Award, Layers } from 'lucide-react';
import { calculateFloorWiseAnalytics } from '../utils/floorUtils';
import { formatResidentDisplayName } from '../utils/residentUtils';

export default function FloorWiseAnalyticsModal({
  isOpen,
  onClose,
  flats = [],
  monthName = '',
  buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19',
  onSelectFlat
}) {
  const analytics = useMemo(() => {
    return calculateFloorWiseAnalytics(flats);
  }, [flats]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in no-print overflow-y-auto">
      <div className="backdrop-blur-2xl bg-white/95 rounded-2xl sm:rounded-3xl border border-white/80 shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 relative my-auto">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200/80 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 font-bold shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-slate-900 tracking-tight">
                  🏢 فلور وائز کلیکشن و ریکوری اینالیٹکس (Floor-Wise Analytics)
                </h3>
                <span className="text-xs font-bold text-blue-700 bg-blue-100 border border-blue-300 px-2.5 py-0.5 rounded-full">
                  {monthName}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {buildingName} — منزل بہ منزل وصولی، بقایاجات، اور 100% کلیئر فلورز کا تفصیلی جائزہ
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

        {/* Top Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50/80 border-b border-slate-200/70 text-xs">
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 block">Total Building Floors</span>
            <span className="text-lg font-black text-slate-900">{analytics.floors.length} Floors</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-emerald-200 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-700 block flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> 100% Cleared Floors
            </span>
            <span className="text-lg font-black text-emerald-800">{analytics.starFloorsCount} Star Floors 🌟</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 block">Total Units Monitored</span>
            <span className="text-lg font-black text-blue-900">{analytics.totalBuildingUnits} Units</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-2xs">
            <span className="text-[11px] font-bold text-amber-700 block">Floors with Pending Dues</span>
            <span className="text-lg font-black text-rose-700">
              {analytics.floors.length - analytics.starFloorsCount} Floors
            </span>
          </div>
        </div>

        {/* Floor Cards Scroll Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {analytics.floors.map((floor) => {
            return (
              <div
                key={floor.key}
                className={`rounded-3xl p-4 sm:p-5 border transition shadow-xs ${
                  floor.is100Percent
                    ? 'border-emerald-300 bg-gradient-to-r from-emerald-50/40 via-white to-emerald-50/20'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                {/* Floor Heading & Progress */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{floor.icon}</span>
                    <div>
                      <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
                        <span>{floor.labelUrdu}</span>
                        {floor.is100Percent && (
                          <span className="text-[11px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                            🌟 100% Reconciled
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Total {floor.totalUnits} Units ({floor.activeCount} Active, {floor.closedCount} Closed) • {floor.paidCount} Cleared • {floor.unpaidCount} Pending
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:text-right shrink-0">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block">Collection Rate</span>
                      <span className={`text-base font-black ${floor.is100Percent ? 'text-emerald-700' : 'text-blue-900'}`}>
                        {floor.collectionPct}%
                      </span>
                    </div>
                    <div className="w-24 sm:w-28 bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          floor.is100Percent ? 'bg-emerald-500' : floor.collectionPct > 60 ? 'bg-blue-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${floor.collectionPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Figures */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3 text-xs bg-slate-50/70 p-3 rounded-2xl border border-slate-200/60 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-sans font-bold">Monthly Due:</span>
                    <span className="font-bold text-slate-800">Rs. {floor.totalDue.toLocaleString('en-US')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-sans font-bold">Prior Arrears:</span>
                    <span className="font-bold text-amber-800">Rs. {floor.totalPrior.toLocaleString('en-US')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-sans font-bold">Received (Wasooli):</span>
                    <span className="font-black text-emerald-700">Rs. {floor.totalPaid.toLocaleString('en-US')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-sans font-bold">Remaining Arrears:</span>
                    <span className={`font-black ${floor.totalArrears > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                      Rs. {floor.totalArrears.toLocaleString('en-US')}
                    </span>
                  </div>
                </div>

                {/* Unit Pills on this Floor */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-[11px] font-bold text-slate-500 me-1">Flats:</span>
                  {floor.flats.map((flat) => {
                    const isClosed = flat.status === 'closed';
                    const isPaid = !isClosed && Number(flat.arrears) === 0 && Number(flat.paid) > 0;
                    return (
                      <div
                        key={flat.flat}
                        onClick={() => onSelectFlat && onSelectFlat(flat)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer select-none ${
                          isClosed
                            ? 'bg-slate-100 text-slate-500 border border-slate-200'
                            : isPaid
                            ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-900 border border-rose-300 hover:bg-rose-200 shadow-2xs'
                        }`}
                        title={`${formatResidentDisplayName(flat)} - ${isClosed ? 'Band 🔒' : isPaid ? 'Full Paid ✓' : `Rs. ${Number(flat.arrears).toLocaleString()} Pending`}`}
                      >
                        <span className="font-black">{flat.flat}</span>
                        <span className="text-[10px] opacity-80">({formatResidentDisplayName(flat).split(' ')[0]})</span>
                        {isClosed ? (
                          <span className="text-[10px]">🔒</span>
                        ) : isPaid ? (
                          <span className="text-[10px] text-emerald-700 font-black">✓</span>
                        ) : (
                          <span className="text-[10px] text-rose-700 font-mono font-black">Rs. {Number(flat.arrears).toLocaleString()}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/90 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            💡 کسی بھی فلیٹ پر کلک کر کے اس کا لیجر یا ریکارڈ دیکھ سکتے ہیں۔
          </span>
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-5 rounded-xl transition cursor-pointer"
          >
            بند کریں (Close)
          </button>
        </div>
      </div>
    </div>
  );
}

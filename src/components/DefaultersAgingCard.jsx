import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  MessageCircle,
  Copy,
  Check,
  ChevronRight,
  Phone,
  ShieldAlert,
  ArrowRight,
  Filter,
  Search,
  ExternalLink,
  Flame,
  AlertCircle
} from 'lucide-react';
import {
  openAgingReminderWhatsApp,
  buildAgingReminderMessage
} from '../utils/whatsapp';
import { sortMonthsChronologically } from '../utils/monthUtils';
import { getAgingClassification } from '../utils/agingUtils';
import { formatResidentDisplayName } from '../utils/residentUtils';

export default function DefaultersAgingCard({
  flats = [],
  allMonthsData = {},
  monthOrder = [],
  activeMonthKey,
  monthName,
  buildingName,
  onNavigate,
  onNotify,
  lang = 'roman',
  onRecordDefaulterNotice
}) {
  const [activeAgingTab, setActiveAgingTab] = useState('all'); // 'all' | '1m' | '2m' | '3m' | '4m+'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedFlat, setCopiedFlat] = useState(null);

  const sortedMonthKeys = useMemo(() => {
    return sortMonthsChronologically(monthOrder && monthOrder.length > 0 ? monthOrder : Object.keys(allMonthsData || {}));
  }, [monthOrder, allMonthsData]);

  // Compute Aging Data for every unpaid flat (Month-based)
  const categorizedDefaulters = useMemo(() => {
    const activeUnpaid = flats.filter(f => f && f.status !== 'closed' && (Number(f.arrears) > 0 || Number(f.paid) < Number(f.due)));

    return activeUnpaid.map(flat => {
      const due = Number(flat.due) || 3000;
      const paid = Number(flat.paid) || 0;
      const arrears = Number(flat.arrears || Math.max(0, due - paid));
      const priorArr = flat.priorArrears !== undefined && flat.priorArrears !== null
        ? Number(flat.priorArrears) || 0
        : Math.max(0, (arrears + paid) - due);

      // Check consecutive unpaid past months from historical month records
      let consecutivePastMonthsCount = 0;
      let oldestUnpaidMonth = monthName;
      if (sortedMonthKeys.length > 0 && activeMonthKey) {
        const currIdx = sortedMonthKeys.indexOf(activeMonthKey);
        if (currIdx > 0) {
          for (let i = currIdx - 1; i >= 0; i--) {
            const pastKey = sortedMonthKeys[i];
            const pastFlats = allMonthsData[pastKey]?.flats || [];
            const matchingPastFlat = pastFlats.find(pf => pf.flat === flat.flat || pf.sno === flat.sno);
            if (matchingPastFlat && (Number(matchingPastFlat.arrears) > 0 || Number(matchingPastFlat.paid) < Number(matchingPastFlat.due))) {
              consecutivePastMonthsCount++;
              oldestUnpaidMonth = allMonthsData[pastKey]?.name || pastKey;
            } else {
              break; // Stop at first paid month
            }
          }
        }
      }

      // Month-based aging classification
      const aging = getAgingClassification(flat, priorArr, due, arrears, consecutivePastMonthsCount);
      const agingCategory = aging.category; // '1m' | '2m' | '3m' | '4m+'
      const agingLabel = lang === 'ur' ? aging.labelUrdu : lang === 'roman' ? aging.labelRoman : aging.labelEn;
      const badgeStyle = aging.softBadgeClass;
      const icon = agingCategory === '4m+' ? Flame : agingCategory === '3m' ? AlertTriangle : agingCategory === '2m' ? AlertCircle : Clock;

      return {
        ...flat,
        due,
        paid,
        arrears,
        priorArrears: priorArr,
        consecutivePastMonthsCount,
        oldestUnpaidMonth,
        agingCategory,
        agingLabel,
        agingUrdu: aging.labelUrdu,
        badgeStyle,
        icon
      };
    }).sort((a, b) => b.arrears - a.arrears);
  }, [flats, allMonthsData, sortedMonthKeys, activeMonthKey, monthName, lang]);

  // Totals by Month-based Aging Bracket
  const agingTotals = useMemo(() => {
    const stats = {
      '1m': { count: 0, sum: 0 },
      '2m': { count: 0, sum: 0 },
      '3m': { count: 0, sum: 0 },
      '4m+': { count: 0, sum: 0 },
      all: { count: categorizedDefaulters.length, sum: categorizedDefaulters.reduce((acc, f) => acc + f.arrears, 0) }
    };

    categorizedDefaulters.forEach(f => {
      const cat = f.agingCategory;
      if (stats[cat]) {
        stats[cat].count += 1;
        stats[cat].sum += f.arrears;
      }
    });

    return stats;
  }, [categorizedDefaulters]);

  // Filtered list by Tab and Search
  const displayList = useMemo(() => {
    return categorizedDefaulters.filter(f => {
      if (activeAgingTab !== 'all' && f.agingCategory !== activeAgingTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mFlat = (f.flat || '').toLowerCase().includes(q);
        const mName = (f.name || '').toLowerCase().includes(q);
        if (!mFlat && !mName) return false;
      }
      return true;
    });
  }, [categorizedDefaulters, activeAgingTab, searchQuery]);

  const handleCopyMessage = (flat) => {
    const text = buildAgingReminderMessage(flat, flat.agingCategory, monthName, buildingName, lang);
    navigator.clipboard.writeText(text);
    setCopiedFlat(flat.flat);
    if (onNotify) onNotify(`Flat ${flat.flat} reminder copied to clipboard! ✓`);
    setTimeout(() => setCopiedFlat(null), 2500);
  };

  const grandArrearsSum = agingTotals.all.sum > 0 ? agingTotals.all.sum : 1;

  return (
    <div className="erp-card rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs border border-slate-200/90">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-rose-500/15 text-rose-700 flex items-center justify-center font-bold border border-rose-500/20 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-base sm:text-lg">
                Defaulters Aging Analysis (بقایا جات کا میعاد وار تجزیہ)
              </h3>
              <span className="text-[10px] font-black bg-rose-100 text-rose-900 px-2 py-0.5 rounded-full border border-rose-200">
                {categorizedDefaulters.length} Units Overdue
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              1 Month (Jari), 2 Months, 3 Months aur 4+ Months Critical baqaya jaat ka hisab
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate && onNavigate('collections')}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
        >
          <span>Open Collections Register</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Visual Debt Aging Meter (Segmented Bar) */}
      <div className="space-y-1.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Building Monthly Unpaid Distribution (مہینے وار بقایا تقسیم):</span>
          <span className="font-mono font-black text-rose-700">
            Total Overdue: Rs. {agingTotals.all.sum.toLocaleString('en-US')}
          </span>
        </div>

        {/* Multi-colored bar */}
        <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
          {agingTotals['4m+'].sum > 0 && (
            <div
              style={{ width: `${(agingTotals['4m+'].sum / grandArrearsSum) * 100}%` }}
              className="bg-rose-600 h-full transition-all duration-500"
              title={`4+ Months: Rs. ${agingTotals['4m+'].sum.toLocaleString('en-US')}`}
            />
          )}
          {agingTotals['3m'].sum > 0 && (
            <div
              style={{ width: `${(agingTotals['3m'].sum / grandArrearsSum) * 100}%` }}
              className="bg-rose-400 h-full transition-all duration-500"
              title={`3 Months: Rs. ${agingTotals['3m'].sum.toLocaleString('en-US')}`}
            />
          )}
          {agingTotals['2m'].sum > 0 && (
            <div
              style={{ width: `${(agingTotals['2m'].sum / grandArrearsSum) * 100}%` }}
              className="bg-amber-400 h-full transition-all duration-500"
              title={`2 Months: Rs. ${agingTotals['2m'].sum.toLocaleString('en-US')}`}
            />
          )}
          {agingTotals['1m'].sum > 0 && (
            <div
              style={{ width: `${(agingTotals['1m'].sum / grandArrearsSum) * 100}%` }}
              className="bg-slate-400 h-full transition-all duration-500"
              title={`1 Month (Current): Rs. ${agingTotals['1m'].sum.toLocaleString('en-US')}`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
            <span className="truncate">1 Month (Jari): Rs. {agingTotals['1m'].sum.toLocaleString('en-US')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span className="truncate">2 Months: Rs. {agingTotals['2m'].sum.toLocaleString('en-US')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
            <span className="truncate">3 Months: Rs. {agingTotals['3m'].sum.toLocaleString('en-US')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
            <span className="truncate font-black text-rose-700">4m+ Critical: Rs. {agingTotals['4m+'].sum.toLocaleString('en-US')}</span>
          </div>
        </div>
      </div>

      {/* Interactive Aging Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {/* All Tab */}
        <button
          onClick={() => setActiveAgingTab('all')}
          className={`p-3 rounded-2xl border text-start transition cursor-pointer ${
            activeAgingTab === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-blue-500/30'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <span className="text-[10px] font-bold block opacity-75">All Defaulters</span>
          <span className="text-sm font-black block font-mono mt-0.5">
            {agingTotals.all.count} Flats
          </span>
          <span className={`text-[10px] font-bold block mt-0.5 ${activeAgingTab === 'all' ? 'text-blue-300' : 'text-slate-500'}`}>
            Rs. {agingTotals.all.sum.toLocaleString('en-US')}
          </span>
        </button>

        {/* 1 Month (Current) */}
        <button
          onClick={() => setActiveAgingTab('1m')}
          className={`p-3 rounded-2xl border text-start transition cursor-pointer ${
            activeAgingTab === '1m'
              ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-400/40'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <span className="text-[10px] font-bold block text-slate-500">1 Month (Jari Mahina)</span>
          <span className="text-sm font-black block font-mono mt-0.5">
            {agingTotals['1m'].count} Flats
          </span>
          <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
            Rs. {agingTotals['1m'].sum.toLocaleString('en-US')}
          </span>
        </button>

        {/* 2 Months */}
        <button
          onClick={() => setActiveAgingTab('2m')}
          className={`p-3 rounded-2xl border text-start transition cursor-pointer ${
            activeAgingTab === '2m'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/50'
              : 'bg-white hover:bg-amber-50/40 text-slate-800 border-amber-200'
          }`}
        >
          <span className={`text-[10px] font-bold block ${activeAgingTab === '2m' ? 'text-amber-100' : 'text-amber-800'}`}>
            2 Months (2 Mahine)
          </span>
          <span className="text-sm font-black block font-mono mt-0.5">
            {agingTotals['2m'].count} Flats
          </span>
          <span className={`text-[10px] font-bold block mt-0.5 ${activeAgingTab === '2m' ? 'text-amber-200' : 'text-amber-700'}`}>
            Rs. {agingTotals['2m'].sum.toLocaleString('en-US')}
          </span>
        </button>

        {/* 3 Months */}
        <button
          onClick={() => setActiveAgingTab('3m')}
          className={`p-3 rounded-2xl border text-start transition cursor-pointer ${
            activeAgingTab === '3m'
              ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-400/50'
              : 'bg-white hover:bg-orange-50/40 text-slate-800 border-orange-200'
          }`}
        >
          <span className={`text-[10px] font-bold block ${activeAgingTab === '3m' ? 'text-orange-100' : 'text-orange-800'}`}>
            3 Months (3 Mahine)
          </span>
          <span className="text-sm font-black block font-mono mt-0.5">
            {agingTotals['3m'].count} Flats
          </span>
          <span className={`text-[10px] font-bold block mt-0.5 ${activeAgingTab === '3m' ? 'text-orange-200' : 'text-orange-700'}`}>
            Rs. {agingTotals['3m'].sum.toLocaleString('en-US')}
          </span>
        </button>

        {/* 4+ Months Critical */}
        <button
          onClick={() => setActiveAgingTab('4m+')}
          className={`p-3 rounded-2xl border text-start transition cursor-pointer col-span-2 sm:col-span-1 ${
            activeAgingTab === '4m+'
              ? 'bg-rose-700 text-white border-rose-800 shadow-md ring-2 ring-rose-400/60'
              : 'bg-rose-50 hover:bg-rose-100/60 text-rose-950 border-rose-300'
          }`}
        >
          <span className={`text-[10px] font-black block flex items-center gap-1 ${activeAgingTab === '4m+' ? 'text-rose-100' : 'text-rose-800'}`}>
            <Flame className="w-3 h-3 text-rose-500 animate-pulse" />
            <span>4m+ Critical</span>
          </span>
          <span className="text-sm font-black block font-mono mt-0.5">
            {agingTotals['4m+'].count} Flats
          </span>
          <span className={`text-[10px] font-bold block mt-0.5 ${activeAgingTab === '4m+' ? 'text-rose-200' : 'text-rose-700'}`}>
            Rs. {agingTotals['4m+'].sum.toLocaleString('en-US')}
          </span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter defaulter by flat or resident name..."
          className="w-full bg-slate-50 hover:bg-white text-slate-900 text-xs py-2 ps-8 pe-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 transition font-medium"
        />
        <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2.5" />
      </div>

      {/* Defaulter Rows List */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pe-1">
        {displayList.map((f) => {
          const isCritical = f.agingCategory === '4m+';

          return (
            <div
              key={f.flat}
              className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs ${
                isCritical
                  ? 'bg-rose-50/90 border-rose-300/80 hover:bg-rose-100/60'
                  : f.agingCategory === '3m'
                  ? 'bg-orange-50/70 border-orange-300/70 hover:bg-orange-100/50'
                  : 'bg-white border-slate-200/90 hover:bg-slate-50'
              }`}
            >
              {/* Left Info */}
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-9 h-9 rounded-2xl font-black text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                  isCritical
                    ? 'bg-rose-700 text-white'
                    : 'bg-slate-900 text-white'
                }`}>
                  {f.flat}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                      {formatResidentDisplayName(f) || 'Resident'}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${f.badgeStyle}`}>
                      {f.agingLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                    {f.priorArrears > 0 ? (
                      <span>
                        Monthly: <strong>Rs. {f.due.toLocaleString('en-US')}</strong> + Prior: <strong className="text-rose-700 font-black">Rs. {f.priorArrears.toLocaleString('en-US')}</strong>
                      </span>
                    ) : (
                      <span>1 Month (Current Cycle Only)</span>
                    )}

                    {f.consecutivePastMonthsCount > 0 && (
                      <span className="text-rose-700 font-bold bg-rose-100/80 px-1.5 py-0.2 rounded text-[10px]">
                        Overdue since {f.oldestUnpaidMonth}
                      </span>
                    )}

                    {f.phone && (
                      <a
                        href={`tel:${f.phone}`}
                        className="text-blue-600 hover:underline flex items-center gap-0.5"
                        title="Click to call"
                      >
                        <Phone className="w-2.5 h-2.5" />
                        <span>{f.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Total Amount & WhatsApp Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                <div className="text-start sm:text-end">
                  <span className="text-xs sm:text-sm font-black text-rose-700 block font-mono">
                    Rs. {f.arrears.toLocaleString('en-US')}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-bold">Total Overdue</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Copy message button */}
                  <button
                    onClick={() => handleCopyMessage(f)}
                    className="p-2 rounded-xl text-xs font-bold transition bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs flex items-center gap-1 cursor-pointer"
                    title="Copy tailored WhatsApp reminder message"
                  >
                    {copiedFlat === f.flat ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[11px] text-emerald-700 font-bold hidden sm:inline">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px] hidden sm:inline">Copy</span>
                      </>
                    )}
                  </button>

                  {/* Direct WhatsApp button */}
                  <button
                    onClick={() => {
                      openAgingReminderWhatsApp(f, f.agingCategory, monthName, buildingName, lang);
                      if (onRecordDefaulterNotice) {
                        onRecordDefaulterNotice({
                          flat: f.flat,
                          name: f.name,
                          phone: f.phone,
                          agingCategory: f.agingCategory,
                          arrears: f.arrears,
                          noticeType: `${f.agingCategory} Defaulter Warning Notice`
                        });
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md border ${
                      isCritical
                        ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-rose-600/30'
                        : f.agingCategory === '3m'
                        ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600 shadow-orange-600/20'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-600/20'
                    }`}
                    title={f.phone ? `Send WhatsApp to ${f.phone}` : 'Open WhatsApp broadcast'}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {displayList.length === 0 && (
          <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Check className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-600">
              No defaulters found in this month category!
            </p>
          </div>
        )}
      </div>

      {/* Attribution footer */}
      <div className="pt-2 text-right text-[11px] text-slate-400 font-medium">
        Maintenance Managed by: <span className="font-bold text-slate-600">Hafiz Muhammad Saad</span>
      </div>
    </div>
  );
}

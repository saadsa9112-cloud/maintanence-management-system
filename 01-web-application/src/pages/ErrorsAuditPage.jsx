import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  FileText,
  Search,
  Filter,
  Trash2,
  ArrowRight,
  Download,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Building2,
  Calendar,
  Clock,
  Check,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  ExternalLink,
  MessageCircle,
  History,
  Send,
  Award
} from 'lucide-react';
import { scanAllSystemClashes } from '../utils/clashDetector';
import { openAdjustmentSlipWhatsApp, openAgingReminderWhatsApp } from '../utils/whatsapp';

export default function ErrorsAuditPage({
  errorAuditLog = [],
  cellChangeHistory = [],
  defaulterNoticeLog = [],
  onClearAuditLog,
  onDeleteAuditEntry,
  allMonthsData = {},
  monthOrder = [],
  activeMonthKey,
  onSelectMonth,
  onNavigate,
  buildingName,
  lang = 'roman',
  t,
  onNotify
}) {
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all'); // 'all', 'fixed', 'adjusted_with_note'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all_history'); // 'all_history', 'cell_history', 'defaulter_notices', 'active_clashes'

  // Scan live clashes for all months to show current pending issues
  const allLiveClashes = useMemo(() => {
    const list = [];
    (monthOrder || []).forEach(mKey => {
      const mData = allMonthsData[mKey];
      if (!mData) return;
      const scan = scanAllSystemClashes({
        currentMonthData: mData,
        currentMonthKey: mKey,
        allMonthsData,
        sortedMonthKeys: monthOrder
      });

      (scan.flatClashes || []).forEach(c => {
        list.push({
          ...c,
          monthKey: mKey,
          monthName: mData.name || mKey,
          type: 'flat',
          isLive: true
        });
      });

      (scan.activeChainClashes || []).forEach(c => {
        list.push({
          ...c,
          monthKey: mKey,
          monthName: mData.name || mKey,
          type: 'chain',
          isLive: true
        });
      });

      (scan.budgetClashes || []).forEach(c => {
        list.push({
          ...c,
          monthKey: mKey,
          monthName: mData.name || mKey,
          type: 'budget',
          isLive: true
        });
      });
    });
    return list;
  }, [allMonthsData, monthOrder]);

  // Combined audit records and filter
  const filteredAuditLog = useMemo(() => {
    return (errorAuditLog || []).filter(item => {
      if (selectedMonthFilter !== 'all' && item.monthKey !== selectedMonthFilter) {
        return false;
      }
      if (selectedStatusFilter === 'fixed' && item.status !== 'fixed') {
        return false;
      }
      if (selectedStatusFilter === 'adjusted_with_note' && item.status !== 'adjusted_with_note') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const flatMatch = (item.flat || '').toLowerCase().includes(q);
        const nameMatch = (item.name || '').toLowerCase().includes(q);
        const noteMatch = (item.resolutionNote || item.note || '').toLowerCase().includes(q);
        const clashMatch = (item.clashTitle || '').toLowerCase().includes(q);
        const monthMatch = (item.monthName || item.monthKey || '').toLowerCase().includes(q);
        return flatMatch || nameMatch || noteMatch || clashMatch || monthMatch;
      }
      return true;
    });
  }, [errorAuditLog, selectedMonthFilter, selectedStatusFilter, searchQuery]);

  // Filtered Cell Changes
  const filteredCellHistory = useMemo(() => {
    return (cellChangeHistory || []).filter(item => {
      if (selectedMonthFilter !== 'all' && item.monthKey !== selectedMonthFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (item.flat || '').toLowerCase().includes(q) ||
               (item.name || '').toLowerCase().includes(q) ||
               (item.field || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [cellChangeHistory, selectedMonthFilter, searchQuery]);

  // Filtered Defaulters Notices
  const filteredDefaulterNotices = useMemo(() => {
    return (defaulterNoticeLog || []).filter(item => {
      if (selectedMonthFilter !== 'all' && item.monthKey !== selectedMonthFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (item.flat || '').toLowerCase().includes(q) ||
               (item.name || '').toLowerCase().includes(q) ||
               (item.agingCategory || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [defaulterNoticeLog, selectedMonthFilter, searchQuery]);

  // Statistics counters
  const totalLogged = (errorAuditLog || []).length;
  const fixedCount = (errorAuditLog || []).filter(e => e.status === 'fixed').length;
  const notedCount = (errorAuditLog || []).filter(e => e.status === 'adjusted_with_note').length;
  const cellEditsCount = (cellChangeHistory || []).length;
  const noticesCount = (defaulterNoticeLog || []).length;
  const activeCount = allLiveClashes.length;
  const is100PercentReconciled = activeCount === 0;

  // Export audit log as CSV
  const handleExportCSV = () => {
    if (!errorAuditLog || errorAuditLog.length === 0) {
      if (onNotify) onNotify('Koi audit record mojood nahi hai.');
      return;
    }

    const headers = ['ID', 'Date', 'Time', 'Month', 'Flat', 'Name', 'Type', 'Status', 'Clash Title', 'Expected', 'Actual', 'Diff', 'Resolution / Note'];
    const rows = errorAuditLog.map(e => [
      `"${e.id || ''}"`,
      `"${e.dateStr || ''}"`,
      `"${e.timeStr || ''}"`,
      `"${e.monthName || e.monthKey || ''}"`,
      `"${e.flat || ''}"`,
      `"${e.name || ''}"`,
      `"${e.actionType || ''}"`,
      `"${e.status || ''}"`,
      `"${(e.clashTitle || '').replace(/"/g, '""')}"`,
      e.expected !== undefined ? e.expected : '',
      e.actual !== undefined ? e.actual : '',
      e.diff !== undefined ? e.diff : '',
      `"${(e.resolutionNote || e.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AlMustafa_Discrepancies_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onNotify) onNotify('Audit Log CSV exported successfully! 📊✓');
  };

  const handleNavigateToFlat = (monthKey, flatNo) => {
    if (onSelectMonth && monthKey) {
      onSelectMonth(monthKey);
    }
    if (onNavigate) {
      onNavigate('collections');
    }
    if (onNotify) {
      onNotify(`Switched to Month ${monthKey} (Flat ${flatNo || ''})!`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Banner Header */}
      <div className="erp-card-dark rounded-2xl p-6 sm:p-7 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center font-bold text-rose-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {lang === 'ur'
                    ? 'تضادات و آڈٹ لاگ سنٹر (Audit & Discrepancies Central)'
                    : 'Errors & Financial Audit Log'}
                </h1>
                
                {/* Feature 5: 100% Reconciled Official Stamp */}
                {is100PercentReconciled ? (
                  <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span>✓ 100% Reconciled & Audited</span>
                  </span>
                ) : (
                  <span className="text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-0.5 rounded-full flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                    <span>{activeCount} Active Discrepancies (Audit Pending)</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {lang === 'ur'
                  ? 'مالیاتی تضادات، حل شدہ غلطیاں، ایڈجسٹمنٹ نوٹس، خلیاتی تبدیلیوں کی مکمل تاریخ اور بقایا داروں کے نوٹسز کا باقاعدہ آڈٹ ٹریل۔'
                  : 'Financial clashes, resolutions, custom adjustment notes, cell change history, aur defaulter warning notices ka live verifiable audit trail.'}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-lg font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition flex items-center gap-2 shadow-xs cursor-pointer"
              title="Download entire log as CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            {onClearAuditLog && totalLogged > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Kiya aap waqayi tamam resolved audit records clear karna chahte hain?\n(Yeh action wapis nahi hoga).')) {
                    onClearAuditLog();
                  }
                }}
                className="px-3.5 py-2 rounded-lg font-semibold text-xs bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Clear History</span>
              </button>
            )}
          </div>
        </div>

        {/* 5 KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-5 mt-5 border-t border-slate-800 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">
              {lang === 'ur' ? 'کُل لاگ شدہ واقعات' : 'Logged Clashes'}
            </span>
            <span className="text-xl font-bold font-mono text-white mt-1 block">
              {totalLogged}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-emerald-400 block font-semibold uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'ur' ? 'حل شدہ' : 'Fixed / Synced'}</span>
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
              {fixedCount}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-blue-400 block font-semibold uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>{lang === 'ur' ? 'وضاحتی نوٹس' : 'Noted Adjustments'}</span>
            </span>
            <span className="text-xl font-bold font-mono text-blue-400 mt-1 block">
              {notedCount}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-purple-400 block font-semibold uppercase tracking-wider flex items-center gap-1">
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span>{lang === 'ur' ? 'خلیاتی تبدیلیاں' : 'Cell Edit Log'}</span>
            </span>
            <span className="text-xl font-bold font-mono text-purple-400 mt-1 block">
              {cellEditsCount}
            </span>
          </div>

          <div className={`p-3.5 rounded-xl border ${activeCount > 0 ? 'bg-rose-950/40 border-rose-800' : 'bg-slate-900/80 border-slate-800'}`}>
            <span className="text-[11px] text-rose-400 block font-semibold uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{lang === 'ur' ? 'فعال تضادات' : 'Active Clashes'}</span>
            </span>
            <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
              {activeCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Tab Navigation Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Main View Tabs (4 Functional Perspectives) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('all_history')}
              className={`px-3.5 py-2 rounded-2xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'all_history'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{lang === 'ur' ? 'حل شدہ و تصدیق شدہ لاگ' : 'Discrepancy Audit Log'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20">
                {errorAuditLog.length}
              </span>
            </button>

            {/* Feature 2 Tab */}
            <button
              onClick={() => setActiveTab('cell_history')}
              className={`px-3.5 py-2 rounded-2xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'cell_history'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{lang === 'ur' ? 'خلیاتی تبدیلیوں کی تاریخ' : 'Cell Edit History'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20">
                {cellEditsCount}
              </span>
            </button>

            {/* Feature 6 Tab */}
            <button
              onClick={() => setActiveTab('defaulter_notices')}
              className={`px-3.5 py-2 rounded-2xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'defaulter_notices'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{lang === 'ur' ? 'بقایا دار وارننگ لاگ' : 'Defaulter Notices Log'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20">
                {noticesCount}
              </span>
            </button>

            {/* Active Unresolved Clashes Tab */}
            <button
              onClick={() => setActiveTab('active_clashes')}
              className={`px-3.5 py-2 rounded-2xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'active_clashes'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{lang === 'ur' ? 'زیرِ التواء تضادات' : 'Active Clashes'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeCount > 0 ? 'bg-white text-rose-700 font-black' : 'bg-rose-200'}`}>
                {activeCount}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Flat (e.g. S-3), resident, or keyword..."
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-2xl ps-10 pe-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-slate-100 text-xs">
          {/* Month Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-500">Filter Month:</span>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">Tamam Mahinay (All Months)</option>
              {monthOrder.map(mKey => (
                <option key={mKey} value={mKey}>
                  {allMonthsData[mKey]?.name || mKey}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Chips for Audit Log */}
          {activeTab === 'all_history' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-500">Status:</span>
              {[
                { id: 'all', label: 'All Statuses' },
                { id: 'fixed', label: 'Fixed / Reconciled ✓' },
                { id: 'adjusted_with_note', label: 'Documented with Note 📝' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedStatusFilter(opt.id)}
                  className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition cursor-pointer ${
                    selectedStatusFilter === opt.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab 1: Main Discrepancy & Adjustment Audit Log Table */}
      {activeTab === 'all_history' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredAuditLog.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <p className="font-extrabold text-slate-700 text-base">
                Koi Audit Record Mojood Nahi Hai
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Jab bhi kisi flat par "Baqaya Set Karein", opening balance fix karein ya "Adjustment Note" add karenge, wo foran yahan register hoga.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase font-black tracking-wider border-b border-slate-200 select-none">
                  <tr>
                    <th className="p-3 text-center w-12 border-r border-slate-200">#</th>
                    <th className="p-3 w-32 border-r border-slate-200">Date & Time</th>
                    <th className="p-3 w-32 border-r border-slate-200">Month</th>
                    <th className="p-3 w-40 border-r border-slate-200">Flat & Resident</th>
                    <th className="p-3 w-48 border-r border-slate-200">Clash Issue</th>
                    <th className="p-3 w-48 border-r border-slate-200">Math Details</th>
                    <th className="p-3 min-w-[220px] border-r border-slate-200">Resolution / Documented Note</th>
                    <th className="p-3 text-center w-36 border-r border-slate-200">Status</th>
                    <th className="p-3 text-center w-36">Actions (WhatsApp / Sheet)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAuditLog.map((entry, idx) => {
                    const isFixed = entry.status === 'fixed';
                    const isNoted = entry.status === 'adjusted_with_note';

                    return (
                      <tr key={entry.id || idx} className="hover:bg-blue-50/40 transition">
                        <td className="p-3 text-center font-bold text-slate-400 border-r border-slate-200">
                          {idx + 1}
                        </td>

                        <td className="p-3 border-r border-slate-200 text-slate-700">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-900 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {entry.dateStr || 'Recent'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <Clock className="w-2.5 h-2.5 text-slate-400" />
                              {entry.timeStr || ''}
                            </span>
                          </div>
                        </td>

                        <td className="p-3 border-r border-slate-200">
                          <span className="font-extrabold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg text-xs inline-block">
                            {entry.monthName || entry.monthKey}
                          </span>
                        </td>

                        <td className="p-3 border-r border-slate-200">
                          <div className="flex items-center gap-2">
                            {entry.flat && entry.flat !== 'CHAIN' ? (
                              <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-300 text-xs">
                                {entry.flat}
                              </span>
                            ) : (
                              <span className="font-mono font-bold text-[10px] text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                                CASH
                              </span>
                            )}
                            <span className="font-bold text-slate-900 truncate">
                              {entry.name || 'Building Cash'}
                            </span>
                          </div>
                        </td>

                        <td className="p-3 border-r border-slate-200">
                          <span className="font-semibold text-rose-900 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md text-[11px] block">
                            {entry.clashTitle || 'Financial Discrepancy'}
                          </span>
                        </td>

                        <td className="p-3 border-r border-slate-200 text-slate-700 font-mono text-[11px]">
                          {entry.expected !== undefined || entry.actual !== undefined ? (
                            <div className="space-y-0.5">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Wajib:</span>
                                <span className="font-bold">Rs. {Number(entry.expected || 0).toLocaleString('en-US')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Actual:</span>
                                <span className="font-bold text-rose-700">Rs. {Number(entry.actual || 0).toLocaleString('en-US')}</span>
                              </div>
                              {entry.diff !== undefined && (
                                <div className="flex justify-between border-t border-slate-200 pt-0.5">
                                  <span className="text-slate-400">Farq:</span>
                                  <span className="font-black text-amber-800">Rs. {Math.abs(entry.diff).toLocaleString('en-US')}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Adjusted in register</span>
                          )}
                        </td>

                        <td className="p-3 border-r border-slate-200">
                          {entry.resolutionNote || entry.note ? (
                            <div className="bg-blue-50/80 border border-blue-200/90 rounded-xl p-2.5 text-blue-950 space-y-1">
                              <span className="text-[10px] font-black text-blue-700 uppercase tracking-wide flex items-center gap-1">
                                <FileText className="w-3 h-3 text-blue-600" />
                                <span>وضاحتی نوٹ (Saved Reason):</span>
                              </span>
                              <p className="font-semibold text-xs leading-relaxed text-slate-900">
                                "{entry.resolutionNote || entry.note}"
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-medium italic">
                              Resolved via system recommendation
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-center border-r border-slate-200">
                          {isFixed ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[11px] px-2.5 py-1 rounded-full">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>درست شدہ (Fixed)</span>
                            </span>
                          ) : isNoted ? (
                            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-900 border border-blue-300 font-black text-[11px] px-2.5 py-1 rounded-full">
                              <FileText className="w-3 h-3 text-blue-600" />
                              <span>مع نوٹ (Documented)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 font-black text-[11px] px-2.5 py-1 rounded-full">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Acknowledged</span>
                            </span>
                          )}
                        </td>

                        {/* Feature 3: WhatsApp Slip Action & Navigation */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {entry.flat && entry.flat !== 'CHAIN' && (
                              <button
                                onClick={() => {
                                  const flatObj = allMonthsData[entry.monthKey]?.flats?.find(f => f.flat === entry.flat || f.sno === entry.sno) || {
                                    flat: entry.flat,
                                    name: entry.name,
                                    due: entry.expected || 3000,
                                    paid: entry.actual || 0,
                                    arrears: (entry.expected || 3000) - (entry.actual || 0),
                                    adjustmentNote: entry.resolutionNote || entry.note || ''
                                  };
                                  openAdjustmentSlipWhatsApp(flatObj, entry.monthName || entry.monthKey, buildingName, entry.resolutionNote || entry.note, lang);
                                  if (onNotify) onNotify(`Opening WhatsApp Adjustment Slip for Flat ${entry.flat}! 📲`);
                                }}
                                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                                title="Send WhatsApp Adjustment Slip with note details"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Slip 📲</span>
                              </button>
                            )}

                            {entry.flat && entry.flat !== 'CHAIN' && (
                              <button
                                onClick={() => handleNavigateToFlat(entry.monthKey, entry.flat)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 transition cursor-pointer"
                                title="Go to this Flat in Maintenance Register"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {onDeleteAuditEntry && (
                              <button
                                onClick={() => {
                                  if (window.confirm('Delete this audit log entry?')) {
                                    onDeleteAuditEntry(entry.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-700 transition cursor-pointer"
                                title="Delete log record"
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
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Feature 2 - Cell-by-Cell Edit History Log */}
      {activeTab === 'cell_history' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
          <div className="p-4 bg-purple-50/70 border-b border-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-700" />
              <div>
                <h3 className="font-black text-sm text-purple-950">
                  خلیاتی تبدیلیوں کی مکمل تاریخچہ (Cell-by-Cell Change Log)
                </h3>
                <p className="text-[11px] text-purple-800/80">
                  کسی بھی خانے (Paid, Due, Arrears, Prior Arrears, Name) میں ہونے والی ہر ترمیم کا لائیو ٹائم اسٹیمپ لاگ۔
                </p>
              </div>
            </div>
            <span className="text-xs font-black bg-purple-200 text-purple-900 px-3 py-1 rounded-full">
              {filteredCellHistory.length} Edits Logged
            </span>
          </div>

          {filteredCellHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <History className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="font-extrabold text-sm">Koi Cell Edit Record Mojood Nahi Hai</p>
              <p className="text-xs text-slate-400">Sheet mein kisi bhi cell ki value change hone par yahan uska record aa jayega.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase font-black tracking-wider border-b border-slate-200 select-none">
                  <tr>
                    <th className="p-3 text-center w-12 border-r border-slate-200">#</th>
                    <th className="p-3 w-36 border-r border-slate-200">Date & Time</th>
                    <th className="p-3 w-32 border-r border-slate-200">Month</th>
                    <th className="p-3 w-36 border-r border-slate-200">Flat & Name</th>
                    <th className="p-3 w-32 border-r border-slate-200">Field Changed</th>
                    <th className="p-3 w-40 border-r border-slate-200">Previous Value</th>
                    <th className="p-3 w-40 border-r border-slate-200">New Value</th>
                    <th className="p-3 text-center w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCellHistory.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-purple-50/30 transition">
                      <td className="p-3 text-center font-bold text-slate-400 border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="p-3 border-r border-slate-200 text-slate-700">
                        <span className="font-extrabold text-slate-900 block">{item.dateStr}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.timeStr}</span>
                      </td>
                      <td className="p-3 border-r border-slate-200 font-bold text-slate-900">
                        {item.monthKey}
                      </td>
                      <td className="p-3 border-r border-slate-200">
                        <span className="font-mono font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 me-1.5">
                          {item.flat}
                        </span>
                        <span className="font-bold text-slate-800">{item.name}</span>
                      </td>
                      <td className="p-3 border-r border-slate-200 font-mono font-bold text-slate-700">
                        {item.field}
                      </td>
                      <td className="p-3 border-r border-slate-200 text-rose-700 font-mono bg-rose-50/40 font-bold">
                        {item.oldValue !== undefined && item.oldValue !== '' ? String(item.oldValue) : '(Empty)'}
                      </td>
                      <td className="p-3 border-r border-slate-200 text-emerald-800 font-mono bg-emerald-50/40 font-bold">
                        {item.newValue !== undefined && item.newValue !== '' ? String(item.newValue) : '(Empty)'}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleNavigateToFlat(item.monthKey, item.flat)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900 font-bold text-[10px] transition cursor-pointer"
                        >
                          View Flat ➔
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Feature 6 - Defaulter Warning Notices Log */}
      {activeTab === 'defaulter_notices' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
          <div className="p-4 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-700" />
              <div>
                <h3 className="font-black text-sm text-amber-950">
                  بقایا داروں کی پیشگی وارننگ لاگ (Defaulters Escalation & Notice Trail)
                </h3>
                <p className="text-[11px] text-amber-900/80">
                  مسلسل واجب الادا بقایا رکھنے والے فلیٹس کو بھیجے گئے تمام وارننگ نوٹسز اور یاد دہانیوں کا لاگ۔
                </p>
              </div>
            </div>
            <span className="text-xs font-black bg-amber-200 text-amber-950 px-3 py-1 rounded-full">
              {filteredDefaulterNotices.length} Notices Sent
            </span>
          </div>

          {filteredDefaulterNotices.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Send className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="font-extrabold text-sm">Koi Warning Notice Log Mojood Nahi Hai</p>
              <p className="text-xs text-slate-400">Jab aap Defaulters aging card se WhatsApp reminder bhejenge to yahan auto-record hoga.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase font-black tracking-wider border-b border-slate-200 select-none">
                  <tr>
                    <th className="p-3 text-center w-12 border-r border-slate-200">#</th>
                    <th className="p-3 w-36 border-r border-slate-200">Notice Sent Date</th>
                    <th className="p-3 w-28 border-r border-slate-200">Month</th>
                    <th className="p-3 w-40 border-r border-slate-200">Flat & Resident</th>
                    <th className="p-3 w-32 border-r border-slate-200">Aging Category</th>
                    <th className="p-3 w-32 border-r border-slate-200">Outstanding Arrears</th>
                    <th className="p-3 min-w-[200px] border-r border-slate-200">Notice Type</th>
                    <th className="p-3 text-center w-32">Action (Re-send)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDefaulterNotices.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-amber-50/30 transition">
                      <td className="p-3 text-center font-bold text-slate-400 border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="p-3 border-r border-slate-200 text-slate-700">
                        <span className="font-extrabold text-slate-900 block">{item.dateStr}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.timeStr}</span>
                      </td>
                      <td className="p-3 border-r border-slate-200 font-bold text-slate-900">
                        {item.monthKey}
                      </td>
                      <td className="p-3 border-r border-slate-200">
                        <span className="font-mono font-black text-rose-900 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 me-1.5">
                          {item.flat}
                        </span>
                        <span className="font-bold text-slate-800">{item.name}</span>
                      </td>
                      <td className="p-3 border-r border-slate-200">
                        <span className="font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full text-[10px] border border-amber-300">
                          {item.agingCategory}
                        </span>
                      </td>
                      <td className="p-3 border-r border-slate-200 font-black text-rose-700 font-mono">
                        Rs. {Number(item.arrears || 0).toLocaleString('en-US')}
                      </td>
                      <td className="p-3 border-r border-slate-200 font-semibold text-slate-800">
                        {item.noticeType}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            const flatObj = { flat: item.flat, name: item.name, phone: item.phone, arrears: item.arrears };
                            openAgingReminderWhatsApp(flatObj, item.agingCategory, item.monthKey, buildingName, lang);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1 mx-auto shadow-xs"
                          title="Re-send WhatsApp Warning"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Re-send 📲</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Active Unresolved Clashes Live Inspector Tab */}
      {activeTab === 'active_clashes' && (
        <div className="space-y-4">
          <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-950 space-y-1">
              <p className="font-black text-sm text-rose-900">
                Live Unresolved Discrepancies Monitor ({allLiveClashes.length})
              </p>
              <p className="leading-relaxed">
                Neechay un تمام flats aur mahino ki live list hai jin mein hisab clash kar raha hai lekin abhi tak fix ya note add nahi kiya gaya. Kisi bhi clash par click karke aap direct usko review ya document kar sakte hain.
              </p>
            </div>
          </div>

          {allLiveClashes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-emerald-200 shadow-sm space-y-3">
              <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
              <h3 className="font-black text-lg text-emerald-950">
                تمام حسابات 100% ہم آہنگ ہیں! (Zero Active Clashes)
              </h3>
              <p className="text-xs text-emerald-800/80 max-w-md mx-auto">
                Pure system mein kisi bhi flat ya mahana bachat mein koi unsolved clash mojood nahi hai.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allLiveClashes.map((c, idx) => (
                <div
                  key={`${c.monthKey}_${c.id || idx}`}
                  className="bg-white rounded-2xl p-4 border border-rose-200 shadow-sm space-y-3 hover:border-rose-400 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-xs px-2.5 py-1 rounded-lg bg-rose-600 text-white font-mono">
                        {c.flatNo || c.prevMonthKey || 'SYSTEM'}
                      </span>
                      <span className="font-black text-sm text-slate-900">
                        {c.name || c.title}
                      </span>
                      <span className="text-[10px] font-extrabold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                        {c.monthName || c.monthKey}
                      </span>
                    </div>

                    <span className="text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full shrink-0">
                      Farq: Rs. {Math.abs(c.diff).toLocaleString('en-US')}
                    </span>
                  </div>

                  {/* Math Box */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block">Expected:</span>
                      <span className="font-bold text-slate-900">Rs. {Number(c.expected || 0).toLocaleString('en-US')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block">Actual:</span>
                      <span className="font-bold text-rose-700">Rs. {Number(c.actual || 0).toLocaleString('en-US')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block">Farq:</span>
                      <span className="font-black text-amber-800">Rs. {Math.abs(c.diff).toLocaleString('en-US')}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {c.messageRoman}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => handleNavigateToFlat(c.monthKey, c.flatNo)}
                      className="px-3 py-1.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Sheet Mein Dekhein ➔</span>
                    </button>

                    <button
                      onClick={() => handleNavigateToFlat(c.monthKey, c.flatNo)}
                      className="px-3 py-1.5 rounded-xl font-black bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Fix Ya Note Add Karein</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

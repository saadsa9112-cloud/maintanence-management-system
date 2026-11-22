import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  CheckCircle,
  CheckCheck,
  Search,
  MessageCircle,
  Filter,
  Building2,
  Receipt,
  Wallet,
  Calendar,
  Printer,
  X,
  FileSpreadsheet,
  TrendingDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  Phone,
  Edit3,
  Clock,
  Flame,
  Check,
  AlertTriangle,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cleanPhoneNumber } from '../utils/whatsapp';
import { exportSpecialFundToExcel } from '../utils/specialFundExcelExport';

const FUND_PRESETS = [
  { name: 'لفٹ فنڈ (Lift Repair & Overhaul)', target: 5000, desc: 'Lift motor, cables, aur emergency technical repairs' },
  { name: 'بلڈنگ رنگ روغن (Building Paint & Renovation)', target: 6000, desc: 'External aur internal walls paint and aesthetic renovation' },
  { name: 'چھت واٹر پروفنگ (Roof Waterproofing Project)', target: 4000, desc: 'Barsaat se pehle chhat par chemical waterproofing aur seam sealing' },
  { name: 'سی سی ٹی وی کیمرہ پروجیکٹ (CCTV Security System)', target: 2500, desc: 'Main gate aur floors par HD security camera installation' },
  { name: 'جنریٹر / سولر سیٹ اپ (Generator & Backup Fund)', target: 8000, desc: 'Load shedding backup ke lie emergency power supply' },
  { name: 'ایمرجنسی سنکنگ فنڈ (Emergency Sinking Fund)', target: 3000, desc: 'Gutter line, water pump aur achanak aane wale nuqsanat ka reserve' }
];

export default function SpecialFundsPage({
  specialFunds = [],
  onUpdateSpecialFunds,
  residentDirectory = [],
  buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19',
  lang = 'roman',
  t = {},
  onNotify,
  onNavigate
}) {
  const activeFundId = specialFunds.length > 0 ? specialFunds[0].id : null;
  const [selectedFundId, setSelectedFundId] = useState(activeFundId);

  // Sub-tab: 'collections' | 'expenses'
  const [activeSubTab, setActiveSubTab] = useState('collections');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unpaid' | 'paid'

  // INLINE CREATE FORM STATE (Directly on this page!)
  const [showInlineCreate, setShowInlineCreate] = useState(specialFunds.length === 0);
  const [newFundName, setNewFundName] = useState('');
  const [newFundDesc, setNewFundDesc] = useState('');
  const [newFundTargetPerFlat, setNewFundTargetPerFlat] = useState(5000);
  const [newFundDate, setNewFundDate] = useState(new Date().toLocaleDateString('en-GB'));

  // Active Fund Object
  const currentFund = useMemo(() => {
    return specialFunds.find(f => f.id === selectedFundId) || specialFunds[0] || null;
  }, [specialFunds, selectedFundId]);

  // Calculations for current fund
  const stats = useMemo(() => {
    if (!currentFund) return { totalTarget: 0, totalCollected: 0, totalSpent: 0, netBalance: 0, paidCount: 0, unpaidCount: 0 };
    const flats = currentFund.flats || [];
    const expenses = currentFund.expenses || [];

    const activeUnits = flats.filter(f => f.status !== 'closed');
    const totalTarget = activeUnits.reduce((acc, f) => acc + Number(f.target || 0), 0);
    const totalCollected = activeUnits.reduce((acc, f) => acc + Number(f.paid || 0), 0);
    const totalSpent = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const netBalance = totalCollected - totalSpent;

    const paidCount = activeUnits.filter(f => Number(f.paid || 0) >= Number(f.target || 0)).length;
    const unpaidCount = activeUnits.filter(f => Number(f.paid || 0) < Number(f.target || 0)).length;

    return { totalTarget, totalCollected, totalSpent, netBalance, paidCount, unpaidCount, totalActiveUnits: activeUnits.length };
  }, [currentFund]);

  // Quick Preset Click Handler
  const handleApplyPreset = (preset) => {
    setNewFundName(preset.name);
    setNewFundTargetPerFlat(preset.target);
    setNewFundDesc(preset.desc);
  };

  // Create New Special Fund Handler (Directly on page)
  const handleCreateFund = (e) => {
    e.preventDefault();
    if (!newFundName.trim()) {
      alert('Barah-e-karam Fund ka naam darj karein!');
      return;
    }

    const target = Number(newFundTargetPerFlat) || 5000;
    const initialFlats = (residentDirectory && residentDirectory.length > 0 ? residentDirectory : []).map(r => {
      const isClosed = r.status === 'closed';
      return {
        sno: r.sno,
        flat: r.flat,
        name: r.name,
        target: isClosed ? 0 : target,
        paid: 0,
        paidDate: '',
        arrears: isClosed ? 0 : target,
        status: isClosed ? 'closed' : 'arrears',
        phone: r.phone || ''
      };
    });

    const newFund = {
      id: `fund_${Date.now()}`,
      name: newFundName.trim(),
      description: newFundDesc.trim(),
      targetPerFlat: target,
      createdDate: newFundDate || new Date().toLocaleDateString('en-GB'),
      status: 'active',
      flats: initialFlats,
      expenses: []
    };

    const updated = [newFund, ...specialFunds];
    onUpdateSpecialFunds(updated);
    setSelectedFundId(newFund.id);
    setShowInlineCreate(false);
    setNewFundName('');
    setNewFundDesc('');
    if (onNotify) onNotify(`Naya Special Fund "${newFund.name}" kamyabi se create ho gaya! ✨✓`);
  };

  // Delete Current Special Fund
  const handleDeleteCurrentFund = () => {
    if (!currentFund) return;
    if (!window.confirm(`⚠️ Kia aap waqai Special Fund "${currentFund.name}" ko permanently delete karna chahte hain?\nIs project ka poora register aur ikhrajat khatam ho jayenge.`)) {
      return;
    }

    const remaining = specialFunds.filter(f => f.id !== currentFund.id);
    onUpdateSpecialFunds(remaining);
    setSelectedFundId(remaining[0]?.id || null);
    if (remaining.length === 0) {
      setShowInlineCreate(true);
    }
    if (onNotify) onNotify(`Special Fund "${currentFund.name}" delete ho gaya! ✓`);
  };

  // Update Flats in Current Fund
  const handleFlatChange = (sno, field, value) => {
    if (!currentFund) return;
    const updatedFlats = (currentFund.flats || []).map(f => {
      if (f.sno === sno) {
        const item = { ...f };
        if (field === 'paid' || field === 'target') {
          const num = value === '' ? 0 : Number(value);
          item[field] = num;
          const target = field === 'target' ? num : Number(item.target || 0);
          const paid = field === 'paid' ? num : Number(item.paid || 0);
          item.arrears = Math.max(0, target - paid);
          item.status = item.arrears === 0 ? 'paid' : (paid > 0 ? 'partial' : 'arrears');
          if (field === 'paid' && num > 0 && !item.paidDate) {
            item.paidDate = new Date().toLocaleDateString('en-GB');
          }
        } else {
          item[field] = value;
        }
        return item;
      }
      return f;
    });

    const updatedFunds = specialFunds.map(fund => {
      if (fund.id === currentFund.id) {
        return { ...fund, flats: updatedFlats };
      }
      return fund;
    });
    onUpdateSpecialFunds(updatedFunds);
  };

  // Quick Pay for Special Fund
  const handleQuickPay = (sno) => {
    if (!currentFund) return;
    const updatedFlats = (currentFund.flats || []).map(f => {
      if (f.sno === sno) {
        const target = Number(f.target || 0);
        return {
          ...f,
          paid: target,
          arrears: 0,
          paidDate: f.paidDate || new Date().toLocaleDateString('en-GB'),
          status: 'paid'
        };
      }
      return f;
    });

    const updatedFunds = specialFunds.map(fund => {
      if (fund.id === currentFund.id) {
        return { ...fund, flats: updatedFlats };
      }
      return fund;
    });
    onUpdateSpecialFunds(updatedFunds);
    if (onNotify) onNotify(`Flat contribution marked as Paid! ✓`);
  };

  // Add Expense to Current Fund
  const handleAddFundExpense = () => {
    if (!currentFund) return;
    const newExp = {
      id: Date.now(),
      desc: '',
      amount: 0,
      paidTo: '',
      date: new Date().toLocaleDateString('en-GB'),
      details: ''
    };
    const updatedExpenses = [...(currentFund.expenses || []), newExp];
    const updatedFunds = specialFunds.map(fund => {
      if (fund.id === currentFund.id) {
        return { ...fund, expenses: updatedExpenses };
      }
      return fund;
    });
    onUpdateSpecialFunds(updatedFunds);
  };

  const handleUpdateFundExpense = (id, field, value) => {
    if (!currentFund) return;
    const updatedExpenses = (currentFund.expenses || []).map(e => {
      if (e.id === id) {
        return {
          ...e,
          [field]: field === 'amount' ? (value === '' ? 0 : Number(value)) : value
        };
      }
      return e;
    });
    const updatedFunds = specialFunds.map(fund => {
      if (fund.id === currentFund.id) {
        return { ...fund, expenses: updatedExpenses };
      }
      return fund;
    });
    onUpdateSpecialFunds(updatedFunds);
  };

  const handleDeleteFundExpense = (id) => {
    if (!currentFund) return;
    if (!window.confirm('Yeh expense item delete karna chahte hain?')) return;
    const updatedExpenses = (currentFund.expenses || []).filter(e => e.id !== id);
    const updatedFunds = specialFunds.map(fund => {
      if (fund.id === currentFund.id) {
        return { ...fund, expenses: updatedExpenses };
      }
      return fund;
    });
    onUpdateSpecialFunds(updatedFunds);
  };

  // WhatsApp Single Receipt for Special Fund
  const handleSendSpecialFundReceipt = (flat) => {
    if (!currentFund) return;
    const residentName = flat.name || 'Resident';
    const paidAmt = Number(flat.paid || 0).toLocaleString('en-US');
    const targetAmt = Number(flat.target || 0).toLocaleString('en-US');
    const remaining = Number(flat.arrears || 0).toLocaleString('en-US');
    const date = flat.paidDate || new Date().toLocaleDateString('en-GB');

    let msg = `🧾 *OFFICIAL PAYMENT RECEIPT — SPECIAL FUND*\n`;
    msg += `*${buildingName}*\n`;
    msg += `------------------------------------\n`;
    msg += `📌 *Project / Special Fund:* ${currentFund.name}\n`;
    msg += `🏢 *Flat:* ${flat.flat} (${residentName})\n`;
    msg += `📅 *Date of Payment:* ${date}\n`;
    msg += `------------------------------------\n`;
    msg += `💵 *Target Contribution:* Rs. ${targetAmt}\n`;
    msg += `✅ *Amount Received:* Rs. ${paidAmt}\n`;
    msg += `⚠️ *Remaining Balance:* Rs. ${remaining}\n`;
    msg += `------------------------------------\n`;
    msg += `${flat.arrears === 0 ? '✨ *Contribution Completed! JazakAllah Khair!*' : 'Barah-e-karam baqaya hissa jald az jald jamah karwayen.'}\n\n`;
    msg += `Maintenance Managed by: *Hafiz Muhammad Saad*`;

    const phone = cleanPhoneNumber(flat.phone);
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // WhatsApp Group Broadcast for Special Fund
  const handleSendGroupBroadcast = () => {
    if (!currentFund) return;
    const flats = (currentFund.flats || []).filter(f => f.status !== 'closed');
    const paidList = flats.filter(f => Number(f.paid || 0) >= Number(f.target || 0));
    const unpaidList = flats.filter(f => Number(f.arrears || 0) > 0);

    let msg = `📢 *${buildingName} — SPECIAL FUND ALERT*\n`;
    msg += `🏗️ *PROJECT:* *${currentFund.name.toUpperCase()}*\n`;
    if (currentFund.description) msg += `📝 *Details:* ${currentFund.description}\n`;
    msg += `------------------------------------\n`;
    msg += `🎯 *Total Target Budget:* Rs. ${stats.totalTarget.toLocaleString('en-US')}\n`;
    msg += `💰 *Total Collected So Far:* Rs. ${stats.totalCollected.toLocaleString('en-US')} (${stats.paidCount}/${stats.totalActiveUnits} Flats Paid)\n`;
    msg += `🧾 *Expenses Incurred:* Rs. ${stats.totalSpent.toLocaleString('en-US')}\n`;
    msg += `💵 *Fund Reserve in Hand:* Rs. ${stats.netBalance.toLocaleString('en-US')}\n`;
    msg += `------------------------------------\n`;

    if (unpaidList.length > 0) {
      msg += `⚠️ *Pending Contributions (${unpaidList.length} Flats):*\n`;
      unpaidList.forEach((f, i) => {
        msg += `${i + 1}. *Flat ${f.flat}* (${f.name}): Rs. ${Number(f.arrears).toLocaleString('en-US')}\n`;
      });
      msg += `------------------------------------\n`;
    }

    msg += `Tamam rehayishiyon se guzarish hai ke project ko barwaqt mukammal karne ke lie apna hissa jald az jald jamah karwayen.\n\n`;
    msg += `— *Building Management Committee*\n_Managed by: Hafiz Muhammad Saad_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Download Excel Specifically for this Special Fund
  const handleExportExcel = async () => {
    if (!currentFund) return;
    try {
      await exportSpecialFundToExcel(currentFund, buildingName);
      if (onNotify) onNotify(`Excel sheet for "${currentFund.name}" downloaded! 📊✓`);
    } catch (e) {
      console.error(e);
      alert('Excel export error!');
    }
  };

  // Filtered flats for display
  const filteredFlats = useMemo(() => {
    if (!currentFund) return [];
    return (currentFund.flats || []).filter(f => {
      if (filter === 'paid' && (f.status === 'closed' || Number(f.arrears) > 0)) return false;
      if (filter === 'unpaid' && (f.status === 'closed' || Number(f.arrears) === 0)) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const mFlat = (f.flat || '').toLowerCase().includes(q);
        const mName = (f.name || '').toLowerCase().includes(q);
        if (!mFlat && !mName) return false;
      }
      return true;
    });
  }, [currentFund, filter, search]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* 100% Saperate Independent Ledger Banner */}
      <div className="erp-card rounded-2xl p-4 sm:p-5 border border-amber-200 bg-amber-50/40 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base text-amber-950">
                🛡️ 100% Mustaqil & Saperate Capital Projects Ledger
              </h3>
              <span className="text-[10px] bg-amber-200/80 text-amber-900 border border-amber-400 px-2 py-0.5 rounded-full font-bold">
                Isolated From Monthly Maintenance
              </span>
            </div>
            <p className="text-xs text-amber-900/80 mt-0.5 leading-relaxed">
              Special Funds ka mahana maintenance (bijli bill, jamadar, motor operator) ke sath koi connection nahi hai. 
              Inka hisab, wusooliyan, aur kharchay bilkul <strong>alag aur independent</strong> save rehte hain.
            </p>
          </div>
        </div>

        {/* Top Toggle: Create New Special Fund On This Page */}
        <button
          onClick={() => setShowInlineCreate(!showInlineCreate)}
          className="w-full md:w-auto px-4 py-2 rounded-xl font-semibold text-xs bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition cursor-pointer flex items-center justify-center gap-2 shrink-0"
        >
          {showInlineCreate ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>Create Form Band Karein</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>+ Naya Special Fund Banayein</span>
            </>
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* INLINE CREATE SPECIAL FUND PANEL (DIRECTLY ON THIS PAGE)  */}
      {/* ======================================================== */}
      {showInlineCreate && (
        <div className="erp-card rounded-2xl border border-amber-300 p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in zoom-in-95 duration-200 bg-white">
          <div className="flex items-center justify-between border-b border-amber-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-slate-900">
                  ✨ Naya Special Sinking Fund Banayein (Create Form)
                </h3>
                <p className="text-xs text-slate-500">
                  Lift, Rang Roghan, Chhat Waterproofing, CCTV ya koi bhi emergency capital project
                </p>
              </div>
            </div>
            {specialFunds.length > 0 && (
              <button
                onClick={() => setShowInlineCreate(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* 1-Click Quick Presets */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              💡 Quick 1-Click Presets (Click karke auto-fill karein):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {FUND_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 text-start transition cursor-pointer flex flex-col justify-between group"
                >
                  <span className="font-bold text-xs text-slate-900 group-hover:text-amber-900 line-clamp-1">
                    {p.name.split('(')[0]}
                  </span>
                  <span className="text-[11px] font-mono font-black text-amber-700 mt-1">
                    Rs. {p.target.toLocaleString('en-US')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Creation Form */}
          <form onSubmit={handleCreateFund} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* Fund Name */}
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Fund Project Name: *
                </label>
                <input
                  type="text"
                  value={newFundName}
                  onChange={(e) => setNewFundName(e.target.value)}
                  placeholder="e.g. Lift Motor Overhaul, Building Rang Roghan 2026..."
                  required
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 shadow-2xs"
                />
              </div>

              {/* Target Per Flat */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Target Per Flat (فی فلیٹ رقم): *
                </label>
                <input
                  type="number"
                  value={newFundTargetPerFlat}
                  onChange={(e) => setNewFundTargetPerFlat(e.target.value)}
                  placeholder="5000"
                  required
                  className="w-full text-xs font-black font-mono bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-amber-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 shadow-2xs"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Start Date:
                </label>
                <input
                  type="text"
                  value={newFundDate}
                  onChange={(e) => setNewFundDate(e.target.value)}
                  placeholder="e.g. 01-Nov-2026"
                  className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 shadow-2xs"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Maqsad / Description:
                </label>
                <input
                  type="text"
                  value={newFundDesc}
                  onChange={(e) => setNewFundDesc(e.target.value)}
                  placeholder="e.g. Building ki chhat par chemical waterproofing aur seam sealing project"
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 shadow-2xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">
                💡 Tamam 20 flats (Residents Directory) is fund sheet mein auto-add ho jayenge.
              </span>
              <div className="flex items-center gap-2">
                {specialFunds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowInlineCreate(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-md shadow-amber-600/30 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Special Fund Now (فنڈ بنائیں)</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Projects Tabs & Actions Bar */}
      {specialFunds.length > 0 && (
        <div className="erp-card rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 ps-1">
                Active Projects:
              </span>
              {specialFunds.map(fund => {
                const isSel = fund.id === selectedFundId;
                return (
                  <button
                    key={fund.id}
                    onClick={() => setSelectedFundId(fund.id)}
                    className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs transition shrink-0 border cursor-pointer ${
                      isSel
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{fund.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions for Selected Fund */}
            {currentFund && (
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 rounded-lg font-medium text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Download Formatted Excel Sheet for this Special Fund"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Excel</span>
                </button>

                <button
                  onClick={handleDeleteCurrentFund}
                  className="p-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                  title="Delete This Special Fund Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {currentFund ? (
        <>
          {/* Top 4 Financial Reconciliation KPI Cards for Selected Fund */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Target */}
            <div className="erp-card rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                🎯 Total Target Budget
              </span>
              <span className="text-lg sm:text-2xl font-bold text-slate-900 font-mono block mt-1">
                Rs. {stats.totalTarget.toLocaleString('en-US')}
              </span>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                Target: Rs. {Number(currentFund.targetPerFlat || 0).toLocaleString('en-US')} / flat
              </span>
            </div>

            {/* Total Collected */}
            <div className="erp-card rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-700 block">
                💰 Total Fund Collected
              </span>
              <span className="text-lg sm:text-2xl font-bold text-emerald-600 font-mono block mt-1">
                Rs. {stats.totalCollected.toLocaleString('en-US')}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">
                {stats.paidCount} of {stats.totalActiveUnits} Flats Paid
              </span>
            </div>

            {/* Total Expenses Incurred */}
            <div className="erp-card rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-rose-700 block">
                🧾 Expenses Spent from Fund
              </span>
              <span className="text-lg sm:text-2xl font-bold text-rose-600 font-mono block mt-1">
                Rs. {stats.totalSpent.toLocaleString('en-US')}
              </span>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                {(currentFund.expenses || []).length} bill items
              </span>
            </div>

            {/* Net Reserve Balance in Hand */}
            <div className="erp-card rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-700 block">
                💵 Remaining Reserve in Hand
              </span>
              <span className="text-lg sm:text-2xl font-bold text-slate-900 font-mono block mt-1">
                Rs. {stats.netBalance.toLocaleString('en-US')}
              </span>
              <span className="text-[11px] text-blue-600 font-medium block mt-0.5">
                Available for project work
              </span>
            </div>
          </div>

          {/* Sub-Tabs: Collections Sheet vs Expenses vs WhatsApp */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('collections')}
                className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer ${
                  activeSubTab === 'collections'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                📋 فلیٹس وصولی شیٹ (Collections Register)
              </button>

              <button
                onClick={() => setActiveSubTab('expenses')}
                className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer ${
                  activeSubTab === 'expenses'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                🧾 اس فنڈ کے اخراجات (Fund Expenses)
              </button>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleSendGroupBroadcast}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Group Broadcast</span>
              </button>
            </div>
          </div>

          {/* ==================================================== */}
          {/* TAB 1: COLLECTIONS SHEET FOR THIS SPECIAL FUND */}
          {/* ==================================================== */}
          {activeSubTab === 'collections' && (
            <div className="erp-card rounded-2xl shadow-xs overflow-hidden border border-slate-200/90 space-y-3 p-4 sm:p-5">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    All ({currentFund.flats?.length || 0})
                  </button>
                  <button
                    onClick={() => setFilter('unpaid')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      filter === 'unpaid' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    Pending ({stats.unpaidCount})
                  </button>
                  <button
                    onClick={() => setFilter('paid')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      filter === 'paid' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    Cleared ({stats.paidCount})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search flat or resident..."
                    className="w-full bg-slate-50 text-xs py-1.5 ps-8 pe-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2.5" />
                </div>
              </div>

              {/* Collections Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200 text-xs uppercase tracking-wider select-none">
                    <tr>
                      <th className="p-3 text-center w-12 border-r border-slate-200/60">#</th>
                      <th className="p-3 text-center w-24 border-r border-slate-200/60">Flat</th>
                      <th className="p-3 border-r border-slate-200/60 min-w-[140px]">Resident Name</th>
                      <th className="p-3 text-center w-28 border-r border-slate-200/60">Target Due</th>
                      <th className="p-3 text-center w-32 border-r border-slate-200/60 text-emerald-800 bg-emerald-50/50">Wusool (Paid)</th>
                      <th className="p-3 text-center w-36 border-r border-slate-200/60 text-purple-900 bg-purple-50/50" title="Wusooli ki tareekh (Directly Editable)">
                        📅 Payment Date
                      </th>
                      <th className="p-3 text-center w-28 border-r border-slate-200/60 text-rose-700">Baqaya</th>
                      <th className="p-3 text-center w-28 border-r border-slate-200/60">Status</th>
                      <th className="p-3 text-center w-24 no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70">
                    {filteredFlats.map((flat) => {
                      const isClosed = flat.status === 'closed';
                      const target = Number(flat.target || 0);
                      const paid = Number(flat.paid || 0);
                      const arrears = Number(flat.arrears || 0);

                      return (
                        <tr
                          key={flat.sno}
                          className={`hover:bg-slate-50/80 transition ${
                            isClosed
                              ? 'bg-amber-50/50 text-amber-900'
                              : arrears === 0
                              ? 'bg-emerald-50/20'
                              : 'bg-rose-50/20'
                          }`}
                        >
                          <td className="p-2.5 text-center font-bold text-slate-400 border-r border-slate-200">
                            {flat.sno}
                          </td>
                          <td className="p-2.5 text-center font-black font-mono text-slate-900 border-r border-slate-200">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-300">
                              {flat.flat}
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-slate-800 border-r border-slate-200">
                            {flat.name || 'Resident'}
                          </td>

                          {/* Target Due */}
                          <td className="p-0 border-r border-slate-200 text-center">
                            <input
                              type="number"
                              value={isClosed ? '' : (flat.target ?? '')}
                              disabled={isClosed}
                              onChange={(e) => handleFlatChange(flat.sno, 'target', e.target.value)}
                              className="cell-input text-center font-bold text-slate-700"
                              placeholder={isClosed ? 'Closed' : '5000'}
                            />
                          </td>

                          {/* Paid Amount */}
                          <td className="p-0 border-r border-slate-200 text-center bg-emerald-50/20">
                            <input
                              type="number"
                              value={isClosed ? '' : (flat.paid ?? '')}
                              disabled={isClosed}
                              onChange={(e) => handleFlatChange(flat.sno, 'paid', e.target.value)}
                              className="cell-input text-center font-black text-emerald-800"
                              placeholder="0"
                            />
                          </td>

                          {/* Payment Date (Directly Editable) */}
                          <td className="p-1 border-r border-slate-200 text-center bg-purple-50/20">
                            <input
                              type="text"
                              value={flat.paidDate || ''}
                              disabled={isClosed}
                              onChange={(e) => handleFlatChange(flat.sno, 'paidDate', e.target.value)}
                              placeholder="e.g. 01-Nov-2026"
                              className="w-full text-center text-xs font-mono font-bold bg-transparent border-b border-dashed border-purple-300 focus:outline-none focus:border-purple-600 text-purple-950 py-1"
                              title="Tareekh-e-Wusooli (Editable Payment Date)"
                            />
                          </td>

                          {/* Arrears */}
                          <td className="p-2.5 text-center font-black text-rose-700 border-r border-slate-200">
                            Rs. {arrears.toLocaleString('en-US')}
                          </td>

                          {/* Status */}
                          <td className="p-2 text-center border-r border-slate-200">
                            {isClosed ? (
                              <span className="text-[10px] font-bold bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full inline-block">
                                🔒 Closed
                              </span>
                            ) : arrears === 0 ? (
                              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full inline-block">
                                ✓ Paid
                              </span>
                            ) : paid > 0 ? (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full inline-block">
                                Partial
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full inline-block">
                                ⚠️ Pending
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-2 text-center no-print">
                            <div className="flex items-center justify-center gap-1.5">
                              {!isClosed && arrears > 0 && (
                                <button
                                  onClick={() => handleQuickPay(flat.sno)}
                                  className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs shadow-2xs transition cursor-pointer"
                                  title="Mark Full Target as Paid"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleSendSpecialFundReceipt(flat)}
                                className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 transition cursor-pointer"
                                title="Send Special Fund WhatsApp Receipt"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Footer Totals */}
                  <tfoot className="bg-slate-100/90 font-black border-t-2 border-slate-300 text-xs">
                    <tr>
                      <td colSpan="3" className="p-3 text-center text-slate-800">
                        Total Project Summary
                      </td>
                      <td className="p-3 text-center text-amber-800 border-r border-slate-200">
                        Rs. {stats.totalTarget.toLocaleString('en-US')}
                      </td>
                      <td className="p-3 text-center text-emerald-800 border-r border-slate-200 font-black text-sm">
                        Rs. {stats.totalCollected.toLocaleString('en-US')}
                      </td>
                      <td className="p-3 text-center text-slate-400 border-r border-slate-200 font-normal">
                        —
                      </td>
                      <td className="p-3 text-center text-rose-700 border-r border-slate-200 font-black text-sm">
                        Rs. {(stats.totalTarget - stats.totalCollected).toLocaleString('en-US')}
                      </td>
                      <td colSpan="2" className="p-3 text-center text-emerald-800 font-bold">
                        {stats.paidCount} / {stats.totalActiveUnits} Cleared
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: EXPENSES SPENT FROM THIS SPECIAL FUND */}
          {/* ==================================================== */}
          {activeSubTab === 'expenses' && (
            <div className="erp-card rounded-2xl shadow-xs overflow-hidden border border-slate-200/90 space-y-4 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {currentFund.name} — Expenses Ledger (اخراجات کی تفصیل)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Is emergency project ke lie khareeda gaya saamaan, contractor advance aur labor bills
                  </p>
                </div>
                <button
                  onClick={handleAddFundExpense}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-600 text-white hover:bg-amber-700 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Naya Expense Add Karein</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-3 text-center w-12 border-r border-slate-200/60">#</th>
                      <th className="p-3 border-r border-slate-200/60 min-w-[180px]">Expense Item (تفصیل)</th>
                      <th className="p-3 text-center w-36 border-r border-slate-200/60">Paid To / Contractor</th>
                      <th className="p-3 text-center w-32 border-r border-slate-200/60">Date</th>
                      <th className="p-3 text-center w-32 border-r border-slate-200/60 text-rose-800 bg-rose-50/50">Amount (رقم)</th>
                      <th className="p-3 border-r border-slate-200/60 min-w-[150px]">Notes</th>
                      <th className="p-3 text-center w-16 no-print">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70">
                    {(currentFund.expenses || []).length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-400">
                          Abhi tak is project mein koi kharcha darj nahi hua.
                        </td>
                      </tr>
                    ) : (
                      currentFund.expenses.map((exp, idx) => (
                        <tr key={exp.id || idx} className="hover:bg-slate-50/80">
                          <td className="p-2.5 text-center font-bold text-slate-400 border-r border-slate-200">
                            {idx + 1}
                          </td>
                          <td className="p-0 border-r border-slate-200">
                            <input
                              type="text"
                              value={exp.desc || ''}
                              onChange={(e) => handleUpdateFundExpense(exp.id, 'desc', e.target.value)}
                              placeholder="e.g. Chemical drums purchase, Cable advance..."
                              className="cell-input font-bold text-slate-800"
                            />
                          </td>
                          <td className="p-0 border-r border-slate-200">
                            <input
                              type="text"
                              value={exp.paidTo || ''}
                              onChange={(e) => handleUpdateFundExpense(exp.id, 'paidTo', e.target.value)}
                              placeholder="Contractor / Vendor"
                              className="cell-input text-center text-slate-700"
                            />
                          </td>
                          <td className="p-0 border-r border-slate-200">
                            <input
                              type="text"
                              value={exp.date || ''}
                              onChange={(e) => handleUpdateFundExpense(exp.id, 'date', e.target.value)}
                              className="cell-input text-center font-mono text-slate-700"
                            />
                          </td>
                          <td className="p-0 border-r border-slate-200 bg-rose-50/30">
                            <input
                              type="number"
                              value={exp.amount ?? ''}
                              onChange={(e) => handleUpdateFundExpense(exp.id, 'amount', e.target.value)}
                              placeholder="0"
                              className="cell-input text-center font-black text-rose-700"
                            />
                          </td>
                          <td className="p-0 border-r border-slate-200">
                            <input
                              type="text"
                              value={exp.details || ''}
                              onChange={(e) => handleUpdateFundExpense(exp.id, 'details', e.target.value)}
                              placeholder="Optional remarks"
                              className="cell-input text-slate-500"
                            />
                          </td>
                          <td className="p-2 text-center no-print">
                            <button
                              onClick={() => handleDeleteFundExpense(exp.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100/90 font-black border-t-2 border-slate-300 text-xs">
                    <tr>
                      <td colSpan="4" className="p-3 text-right text-slate-700">
                        Total Project Expenses Spent:
                      </td>
                      <td className="p-3 text-center text-rose-700 font-black text-sm">
                        Rs. {stats.totalSpent.toLocaleString('en-US')}
                      </td>
                      <td colSpan="2" className="p-3 text-slate-500 text-[11px] font-normal">
                        Fund Reserve Balance in Hand: <strong className="text-emerald-700">Rs. {stats.netBalance.toLocaleString('en-US')}</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="erp-card rounded-2xl p-12 text-center text-slate-500 space-y-3 border border-slate-200/90 shadow-xs">
          <Sparkles className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="font-bold text-slate-900 text-lg">
            Abhi Koi Special Fund Nahi Hai
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Upar diye gaye form mein Lift, Rang Roghan, ya Waterproofing ka naam darj karke 1-click mein pehla fund banayein.
          </p>
          <button
            onClick={() => setShowInlineCreate(true)}
            className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-amber-600 hover:bg-amber-500 shadow-xs transition cursor-pointer"
          >
            + Naya Special Fund Banayein
          </button>
        </div>
      )}

      {/* Attribution */}
      <div className="pt-2 text-right text-[11px] text-slate-400 font-medium">
        Special Funds Managed by: <span className="font-bold text-slate-600">Hafiz Muhammad Saad</span> | Al-Mustafa Heights 5-E-18/19
      </div>
    </div>
  );
}

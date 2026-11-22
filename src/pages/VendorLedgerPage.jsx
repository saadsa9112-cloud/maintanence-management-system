import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Plus,
  Phone,
  MessageCircle,
  Calendar,
  DollarSign,
  Printer,
  Copy,
  Trash2,
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Receipt,
  UserCheck,
  Building2,
  X,
  Send,
  AlertCircle
} from 'lucide-react';
import { openVendorPaymentWhatsApp } from '../utils/whatsapp';

export default function VendorLedgerPage({
  vendors = [],
  onUpdateVendors,
  allMonthsData = {},
  monthOrder = [],
  activeMonthKey,
  onAddExpenseToMonth,
  buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19',
  lang = 'roman',
  t,
  onNotify
}) {
  const [selectedVendorId, setSelectedVendorId] = useState(vendors[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal States
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // New Vendor Form State (100% Dynamic Names)
  const [vendorForm, setVendorForm] = useState({
    name: '',
    role: 'Electrician (الیکٹریشن)',
    phone: '',
    rate: '',
    note: ''
  });

  // Record Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    workDesc: '',
    month: activeMonthKey,
    date: new Date().toLocaleDateString('en-GB'),
    paymentMethod: 'Cash',
    syncWithMonthlyExpenses: true
  });

  // Pre-defined trades list
  const TRADE_CATEGORIES = [
    'All Categories',
    'Electrician (الیکٹریشن)',
    'Plumber (پلمبر)',
    'Lift Technician (لفٹ سروس)',
    'Water Tanker (واٹر ٹینکر)',
    'Janitor / Sweeper (صفائی و کوڑا)',
    'Mason / Civil Works (راج مستری)',
    'Painter (رنگ و روغن)',
    'Security / Guard (چوکیدار)',
    'General Contractor (جنرل ٹھیکیدار)'
  ];

  // Filtered vendors
  const filteredVendors = useMemo(() => {
    return (vendors || []).filter(v => {
      if (categoryFilter !== 'all' && categoryFilter !== 'All Categories') {
        if (!v.role?.toLowerCase().includes(categoryFilter.split(' ')[0].toLowerCase())) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nMatch = (v.name || '').toLowerCase().includes(q);
        const rMatch = (v.role || '').toLowerCase().includes(q);
        const pMatch = (v.phone || '').includes(q);
        return nMatch || rMatch || pMatch;
      }
      return true;
    });
  }, [vendors, categoryFilter, searchQuery]);

  // Selected vendor object
  const activeVendor = useMemo(() => {
    return vendors.find(v => v.id === selectedVendorId) || filteredVendors[0] || null;
  }, [vendors, selectedVendorId, filteredVendors]);

  // Gather all transactions for the active vendor across all months
  const vendorTransactions = useMemo(() => {
    if (!activeVendor) return [];
    const list = [];
    const vName = (activeVendor.name || '').toLowerCase();
    const vRoleKeyword = (activeVendor.role || '').split(' ')[0].toLowerCase();

    // Scan expenses across all chronological months
    (monthOrder || []).forEach(mKey => {
      const mData = allMonthsData[mKey];
      if (!mData || !mData.expenses) return;

      mData.expenses.forEach((exp, idx) => {
        if (!exp || Number(exp.amount) <= 0) return;
        const desc = (exp.desc || '').toLowerCase();
        const details = (exp.details || '').toLowerCase();
        const paidTo = (exp.paidTo || '').toLowerCase();

        // Match if tagged directly or if description matches vendor name/trade
        const isDirectMatch = paidTo && (paidTo.includes(vName) || vName.includes(paidTo));
        const isNameMatch = desc.includes(vName) || details.includes(vName);
        const isRoleMatch = (
          (vRoleKeyword === 'electrician' && (desc.includes('الیکٹریشن') || desc.includes('موٹر') || desc.includes('بجلی') || desc.includes('electric'))) ||
          (vRoleKeyword === 'plumber' && (desc.includes('پلمبر') || desc.includes('پائپ') || desc.includes('gutter') || desc.includes('گٹر') || desc.includes('لیبا'))) ||
          (vRoleKeyword === 'water' && (desc.includes('ٹینکر') || desc.includes('tanker') || desc.includes('پانی'))) ||
          (vRoleKeyword === 'lift' && (desc.includes('لفٹ') || desc.includes('lift') || desc.includes('elevator'))) ||
          (vRoleKeyword === 'janitor' && (desc.includes('جمعدار') || desc.includes('کوڑا') || desc.includes('sweeper') || desc.includes('صفائی')))
        );

        if (isDirectMatch || isNameMatch || isRoleMatch) {
          list.push({
            id: `exp_${mKey}_${exp.id || idx}`,
            date: exp.details || mData.dateStr || mKey,
            monthKey: mKey,
            monthName: mData.name || mKey,
            amount: Number(exp.amount || 0),
            desc: exp.desc,
            details: exp.details || '',
            paymentMethod: exp.paymentMethod || 'Cash',
            voucherNo: exp.id || (idx + 1)
          });
        }
      });
    });

    return list;
  }, [activeVendor, allMonthsData, monthOrder]);

  // Overall financial stats for active vendor
  const totalPaidToActiveVendor = vendorTransactions.reduce((acc, t) => acc + t.amount, 0);

  // Overall total paid to all vendors across all months
  const totalAllVendorsPaid = useMemo(() => {
    let sum = 0;
    Object.values(allMonthsData || {}).forEach(m => {
      (m?.expenses || []).forEach(e => {
        sum += Number(e?.amount || 0);
      });
    });
    return sum;
  }, [allMonthsData]);

  // Handle Save / Add Vendor (Fully Dynamic)
  const handleSaveVendor = (e) => {
    e.preventDefault();
    if (!vendorForm.name.trim()) return;

    if (editingVendor) {
      // Update
      const updated = vendors.map(v => v.id === editingVendor.id ? {
        ...v,
        name: vendorForm.name.trim(),
        role: vendorForm.role.trim(),
        phone: vendorForm.phone.trim(),
        rate: vendorForm.rate.trim(),
        note: vendorForm.note.trim()
      } : v);
      onUpdateVendors(updated);
      if (onNotify) onNotify(`Vendor "${vendorForm.name}" updated! ✓`);
      setEditingVendor(null);
    } else {
      // Create new
      const newV = {
        id: `vendor_${Date.now()}`,
        name: vendorForm.name.trim(),
        role: vendorForm.role.trim() || 'Contractor',
        phone: vendorForm.phone.trim(),
        rate: vendorForm.rate.trim(),
        note: vendorForm.note.trim()
      };
      const updated = [...vendors, newV];
      onUpdateVendors(updated);
      setSelectedVendorId(newV.id);
      if (onNotify) onNotify(`New Vendor "${vendorForm.name}" added to ledger! 👨‍🔧`);
    }

    setVendorForm({ name: '', role: 'Electrician (الیکٹریشن)', phone: '', rate: '', note: '' });
    setIsAddVendorModalOpen(false);
  };

  // Handle Delete Vendor
  const handleDeleteVendor = (id) => {
    const v = vendors.find(x => x.id === id);
    if (!v) return;
    if (window.confirm(`Are you sure you want to remove "${v.name}" from vendors?`)) {
      const updated = vendors.filter(x => x.id !== id);
      onUpdateVendors(updated);
      if (selectedVendorId === id) {
        setSelectedVendorId(updated[0]?.id || null);
      }
      if (onNotify) onNotify(`Vendor "${v.name}" removed.`);
    }
  };

  // Open Edit Modal
  const handleEditVendorClick = (v) => {
    setEditingVendor(v);
    setVendorForm({
      name: v.name || '',
      role: v.role || 'Electrician (الیکٹریشن)',
      phone: v.phone || '',
      rate: v.rate || '',
      note: v.note || ''
    });
    setIsAddVendorModalOpen(true);
  };

  // Handle Record Payment
  const handleRecordPayment = (e) => {
    e.preventDefault();
    const amt = Number(paymentForm.amount);
    if (!amt || amt <= 0 || !activeVendor) return;

    if (paymentForm.syncWithMonthlyExpenses && onAddExpenseToMonth) {
      onAddExpenseToMonth(paymentForm.month, {
        desc: `${activeVendor.name} (${paymentForm.workDesc || activeVendor.role})`,
        amount: amt,
        details: `${paymentForm.date} - ${paymentForm.paymentMethod}`,
        paidTo: activeVendor.name
      });
      if (onNotify) onNotify(`Rs. ${amt.toLocaleString()} recorded in ${paymentForm.month} expenses! 💵`);
    }

    setIsPaymentModalOpen(false);
    setPaymentForm({
      amount: '',
      workDesc: '',
      month: activeMonthKey,
      date: new Date().toLocaleDateString('en-GB'),
      paymentMethod: 'Cash',
      syncWithMonthlyExpenses: true
    });
  };

  // Handle Send WhatsApp Voucher
  const handleSendWhatsAppVoucher = (tx) => {
    if (!activeVendor) return;
    openVendorPaymentWhatsApp({
      vendor: activeVendor,
      amount: tx.amount,
      workDescription: tx.desc,
      monthName: tx.monthName,
      buildingName,
      dateStr: tx.date,
      voucherNo: tx.voucherNo,
      paymentMethod: tx.paymentMethod
    });
    if (onNotify) onNotify(`Opening WhatsApp payment slip for ${activeVendor.name}... 📲`);
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="erp-card-dark rounded-2xl p-5 sm:p-6 text-white border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold border border-blue-500/30 shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {lang === 'ur' ? 'ٹھیکیدار و وینڈر لیجر' : 'Vendor & Contractor Expense Ledger'}
                </h1>
                <span className="text-xs font-semibold text-blue-300 bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                  {vendors.length} Vendors Registered
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {lang === 'ur'
                  ? 'تمام الیکٹریشنز، پلمبرز، سویپرز اور لفٹ ٹیکنیشنز کی ادائیگیوں کا باقاعدہ لیجر اور واٹس ایپ واؤچرز۔'
                  : 'Manage custom contractors (names fully dynamic), track cumulative payments across months & generate WhatsApp payment receipts.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setEditingVendor(null);
                setVendorForm({ name: '', role: 'Electrician (الیکٹریشن)', phone: '', rate: '', note: '' });
                setIsAddVendorModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ نیا وینڈر / ٹھیکیدار شامل کریں</span>
            </button>
          </div>
        </div>

        {/* Global KPI Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Total Active Vendors</span>
            <span className="text-lg font-bold font-mono text-white">{vendors.length} Contractors</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Selected Vendor Spend</span>
            <span className="text-lg font-bold font-mono text-blue-300">
              Rs. {totalPaidToActiveVendor.toLocaleString('en-US')}
            </span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Total Jobs / Vouchers</span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              {vendorTransactions.length} Jobs Logged
            </span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">All Building Expenses</span>
            <span className="text-lg font-bold font-mono text-slate-200">
              Rs. {totalAllVendorsPaid.toLocaleString('en-US')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ======================================================== */}
        {/* LEFT COLUMN: VENDORS LIST & SEARCH (4 COLS)              */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Thekedar ya trade talash karein..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-9 pe-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Vendor Cards List */}
            <div className="space-y-2 max-h-[550px] overflow-y-auto pe-1">
              {filteredVendors.map((vendor) => {
                const isSelected = activeVendor?.id === vendor.id;
                return (
                  <div
                    key={vendor.id}
                    onClick={() => setSelectedVendorId(vendor.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-400 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {vendor.name ? vendor.name.slice(0, 1) : '👨‍🔧'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-xs text-slate-900 truncate">
                          {vendor.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate">
                          {vendor.role}
                        </p>
                        {vendor.phone && (
                          <span className="text-[10px] font-mono text-blue-700">
                            {vendor.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditVendorClick(vendor);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVendor(vendor.id);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                        title="Delete Vendor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: ACTIVE VENDOR LEDGER & ACTIONS (8 COLS)   */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 space-y-4">
          {activeVendor ? (
            <>
              {/* Profile Card Header */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                    👨‍🔧
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-slate-900">
                        {activeVendor.name}
                      </h2>
                      <span className="text-[11px] font-bold text-blue-800 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">
                        {activeVendor.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                      {activeVendor.phone && (
                        <span className="font-mono font-bold text-slate-800">
                          📞 {activeVendor.phone}
                        </span>
                      )}
                      {activeVendor.rate && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700">
                          معاہدہ: {activeVendor.rate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {activeVendor.phone && (
                    <button
                      onClick={() => {
                        const phone = activeVendor.phone.replace(/\D/g, '');
                        const p = phone.startsWith('03') ? `92${phone.slice(1)}` : phone;
                        window.open(`https://api.whatsapp.com/send?phone=${p}`, '_blank');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Chat</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="bg-blue-700 hover:bg-blue-800 text-white font-black py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ ادئیگی درج کریں (Pay)</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    title="Print Statement"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-400" />
                    <span>Print Ledger</span>
                  </button>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="font-black text-sm text-slate-900">
                      📜 مکمل ادائیگیوں کی تفصیل (Payment History & Ledger)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tamam mahino se is thekedar ko di gayi raqam ka verifiable khata.
                    </p>
                  </div>

                  <span className="text-xs font-black text-blue-950 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                    کُل ادا شدہ: Rs. {totalPaidToActiveVendor.toLocaleString('en-US')}
                  </span>
                </div>

                {vendorTransactions.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <p className="text-xs font-bold text-slate-500">
                      Abhi tak is vendor ki koi adaigi register nahi hui.
                    </p>
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="mt-2 text-xs font-black text-blue-700 hover:underline"
                    >
                      + Pehli adaigi darj karein
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-300">
                          <th className="p-2.5 text-center w-12">#</th>
                          <th className="p-2.5">ماہ / تاریخ</th>
                          <th className="p-2.5 text-right">کام کی تفصیل (Description)</th>
                          <th className="p-2.5 text-center">طریقہ</th>
                          <th className="p-2.5 text-center">رقم (Paid)</th>
                          <th className="p-2.5 text-center">واٹس ایپ رسید</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorTransactions.map((tx, idx) => (
                          <tr key={tx.id || idx} className="border-b border-slate-100 hover:bg-slate-50/80 transition">
                            <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-800">
                              <div>{tx.monthName}</div>
                              <span className="text-[10px] text-slate-400 font-normal">{tx.date}</span>
                            </td>
                            <td className="p-2.5 font-bold text-slate-900">
                              {tx.desc}
                              {tx.details && <span className="block text-[10px] text-slate-500 font-normal">{tx.details}</span>}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">
                                {tx.paymentMethod}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-mono font-black text-emerald-800">
                              Rs. {tx.amount.toLocaleString('en-US')}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => handleSendWhatsAppVoucher(tx)}
                                className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-lg text-[11px] border border-emerald-200 transition cursor-pointer"
                                title="Send WhatsApp Slip"
                              >
                                <Send className="w-3 h-3 text-emerald-600" />
                                <span>رسید</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-400">
                          <td colSpan="4" className="p-2.5 text-right">کُل میزان (Total Paid):</td>
                          <td className="p-2.5 text-center font-mono text-sm text-blue-950">
                            Rs. {totalPaidToActiveVendor.toLocaleString('en-US')}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs">
              <Wrench className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="font-black text-sm text-slate-700">Koi Vendor Muntakhab Nahi</h3>
              <p className="text-xs text-slate-400 mt-1">Left side se kisi vendor par click karein ya naya vendor shamil karein.</p>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT DYNAMIC VENDOR                         */}
      {/* ======================================================== */}
      {isAddVendorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsAddVendorModalOpen(false)}
              className="absolute top-4 end-4 text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                <span>{editingVendor ? 'وینڈر کی معلومات تبدیل کریں' : '+ نیا وینڈر / ٹھیکیدار شامل کریں'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Naam fix nahi hai — aap kisi bhi electrician, plumber ya contractor ka naam likh sakte hain.
              </p>
            </div>

            <form onSubmit={handleSaveVendor} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  وینڈر / کاریگر کا نام (Vendor Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. اسلم الیکٹریشن / صفدر پلمبر"
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  شعبہ / کام کی مد (Trade / Category)
                </label>
                <select
                  value={vendorForm.role}
                  onChange={(e) => setVendorForm({ ...vendorForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {TRADE_CATEGORIES.slice(1).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    موبائل / واٹس ایپ (Phone)
                  </label>
                  <input
                    type="text"
                    placeholder="0300-1234567"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ماہانہ فیس / ریٹ (Rate)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4500/Month"
                    value={vendorForm.rate}
                    onChange={(e) => setVendorForm({ ...vendorForm, rate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  اضافی نوٹس (Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="Specialization, emergency availability..."
                  value={vendorForm.note}
                  onChange={(e) => setVendorForm({ ...vendorForm, note: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddVendorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-700 hover:bg-blue-800 text-white font-black px-4 py-2 rounded-xl text-xs transition shadow-sm cursor-pointer"
                >
                  {editingVendor ? 'Save Changes' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: RECORD VENDOR PAYMENT                             */}
      {/* ======================================================== */}
      {isPaymentModalOpen && activeVendor && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-4 end-4 text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>وینڈر کو ادائیگی درج کریں (Record Payment)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeVendor.name} ({activeVendor.role})
              </p>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  رقم (Amount in PKR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 1500"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-black text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  کام کی تفصیل (Work Description / Reason)
                </label>
                <input
                  type="text"
                  placeholder="e.g. موٹر وائرنگ کا کام، نیا سوئچ و پائپ"
                  value={paymentForm.workDesc}
                  onChange={(e) => setPaymentForm({ ...paymentForm, workDesc: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ماہانہ رجسٹر (Month)
                  </label>
                  <select
                    value={paymentForm.month}
                    onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                  >
                    {(monthOrder || []).map(m => (
                      <option key={m} value={m}>{allMonthsData[m]?.name || m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    طریقہ ادائیگی (Method)
                  </label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="Cash">نقد (Cash)</option>
                    <option value="Bank / Online">بینک / آن لائن (Online)</option>
                    <option value="Cheque">چیک (Cheque)</option>
                  </select>
                </div>
              </div>

              {/* Sync with Monthly Expenses Toggle */}
              <label className="flex items-center gap-2 bg-blue-50/80 border border-blue-200 p-2.5 rounded-xl cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={paymentForm.syncWithMonthlyExpenses}
                  onChange={(e) => setPaymentForm({ ...paymentForm, syncWithMonthlyExpenses: e.target.checked })}
                  className="accent-blue-600 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-blue-900 leading-tight">
                  اس خرچے کو {paymentForm.month} کے اخراجات رجسٹر میں بھی خودکار شامل کریں (Auto-sync)
                </span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs transition shadow-sm cursor-pointer"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

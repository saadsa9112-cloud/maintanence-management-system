import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Building2,
  Users,
  Receipt,
  Wrench,
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Phone,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  CornerDownLeft,
  ShieldAlert
} from 'lucide-react';
import { cleanPhoneNumber } from '../utils/whatsapp';
import { formatResidentDisplayName } from '../utils/residentUtils';

export default function GlobalSearchModal({
  isOpen,
  onClose,
  allMonthsData = {},
  monthOrder = [],
  activeMonthKey,
  vendors = [],
  specialFunds = [],
  residentDirectory = [],
  onNavigate,
  onSelectMonth,
  onOpenResidentLedger,
  buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19',
  lang = 'roman',
  onNotify
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedFlatPreview, setSelectedFlatPreview] = useState(null);
  const inputRef = useRef(null);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setQuery('');
      setSelectedIndex(0);
      setSelectedFlatPreview(null);
    }
  }, [isOpen]);

  const activeMonthData = allMonthsData[activeMonthKey] || {};
  const currentFlats = activeMonthData.flats || [];

  // Universal Search Engine across all entities
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default: show quick suggestions (recent flats, quick pages)
      return [
        { type: 'page', id: 'p_coll', title: 'وصولی رجسٹر (Collections Register)', page: 'collections', icon: Building2, desc: 'View monthly flats maintenance' },
        { type: 'page', id: 'p_exp', title: 'اخراجات ٹریکر (Expenses Tracker)', page: 'expenses', icon: Receipt, desc: 'Manage monthly expense vouchers' },
        { type: 'page', id: 'p_bills', title: 'ماہانہ بل و واٹس ایپ (Bills & WhatsApp)', page: 'bills-whatsapp', icon: FileText, desc: 'Print 4-in-1 demand slips & WhatsApp' },
        { type: 'page', id: 'p_vendor', title: 'ٹھیکیدار و وینڈر لیجر (Vendor Ledger)', page: 'vendor-ledger', icon: Wrench, desc: 'Contractors payment history' },
        { type: 'page', id: 'p_audit', title: 'تضادات و آڈٹ لاگ سنٹر (Audit Center)', page: 'errors-audit', icon: ShieldAlert, desc: 'Discrepancy inspection & change log' },
        { type: 'page', id: 'p_agm', title: 'اے جی ایم سالانہ رپورٹ (AGM Annual Report)', page: 'overview', subTab: 'agm-report', icon: Calendar, desc: '1-Page executive annual financial summary' }
      ];
    }

    const results = [];

    // 1. Search Flats & Residents (Current Month & Directory)
    currentFlats.forEach(f => {
      const flatNo = (f.flat || '').toLowerCase();
      const name = (f.name || '').toLowerCase();
      const engName = (f.englishName || '').toLowerCase();
      const phone = (f.phone || '').toLowerCase();

      if (flatNo.includes(q) || name.includes(q) || engName.includes(q) || phone.includes(q)) {
        const isClosed = f.status === 'closed';
        const isPaid = f.status === 'paid' && Number(f.paid) >= Number(f.due);
        results.push({
          type: 'flat',
          id: `flat_${f.sno || f.flat}`,
          flatObj: f,
          title: `فلیٹ ${f.flat} — ${formatResidentDisplayName(f)}`,
          badge: isClosed ? 'Closed 🔒' : isPaid ? 'Paid ✓' : `Due: Rs. ${Number(f.arrears || f.due).toLocaleString()}`,
          badgeColor: isClosed ? 'bg-slate-200 text-slate-700' : isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800',
          icon: Building2,
          desc: `Monthly Due: Rs. ${Number(f.due || 3000).toLocaleString()} | Prior: Rs. ${Number(f.priorArrears || 0).toLocaleString()}`
        });
      }
    });

    // 2. Search Vendors
    (vendors || []).forEach(v => {
      const vName = (v.name || '').toLowerCase();
      const vRole = (v.role || '').toLowerCase();
      const vPhone = (v.phone || '').toLowerCase();

      if (vName.includes(q) || vRole.includes(q) || vPhone.includes(q)) {
        results.push({
          type: 'vendor',
          id: `vendor_${v.id}`,
          vendorObj: v,
          title: `👨‍🔧 ${v.name} (${v.role})`,
          badge: v.rate ? `${v.rate}` : 'Contractor',
          badgeColor: 'bg-blue-100 text-blue-800',
          icon: Wrench,
          desc: `Phone: ${v.phone || 'N/A'} | Notes: ${v.note || 'No notes'}`
        });
      }
    });

    // 3. Search Expenses across Months
    (monthOrder || []).forEach(mKey => {
      const mData = allMonthsData[mKey];
      if (!mData || !mData.expenses) return;

      mData.expenses.forEach((e, idx) => {
        const desc = (e.desc || '').toLowerCase();
        const details = (e.details || '').toLowerCase();
        const amtStr = String(e.amount || '');

        if (desc.includes(q) || details.includes(q) || amtStr.includes(q)) {
          results.push({
            type: 'expense',
            id: `exp_${mKey}_${e.id || idx}`,
            expenseObj: e,
            monthKey: mKey,
            title: `🧾 ${e.desc} (Rs. ${Number(e.amount || 0).toLocaleString()})`,
            badge: mData.name || mKey,
            badgeColor: 'bg-amber-100 text-amber-800',
            icon: Receipt,
            desc: `Month: ${mData.name || mKey} | Details: ${e.details || 'N/A'}`
          });
        }
      });
    });

    // 4. Search Special Funds
    (specialFunds || []).forEach(sf => {
      const sfName = (sf.name || '').toLowerCase();
      const sfDesc = (sf.description || '').toLowerCase();

      if (sfName.includes(q) || sfDesc.includes(q)) {
        results.push({
          type: 'special_fund',
          id: `sf_${sf.id}`,
          fundObj: sf,
          title: `🛠️ ${sf.name}`,
          badge: `Target: Rs. ${Number(sf.targetPerFlat || 0).toLocaleString()}`,
          badgeColor: 'bg-purple-100 text-purple-800',
          icon: Sparkles,
          desc: sf.description || 'Special sinking fund project'
        });
      }
    });

    return results.slice(0, 15);
  }, [query, currentFlats, vendors, allMonthsData, monthOrder, specialFunds]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = searchResults[selectedIndex];
        if (item) handleSelectResult(item);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex]);

  // Handle result selection
  const handleSelectResult = (item) => {
    if (item.type === 'page') {
      onNavigate(item.page);
      onClose();
    } else if (item.type === 'flat') {
      setSelectedFlatPreview(item.flatObj);
    } else if (item.type === 'vendor') {
      onNavigate('vendor-ledger');
      onClose();
    } else if (item.type === 'expense') {
      if (onSelectMonth && item.monthKey) onSelectMonth(item.monthKey);
      onNavigate('expenses');
      onClose();
    } else if (item.type === 'special_fund') {
      onNavigate('special-funds');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-start justify-center pt-12 sm:pt-20 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/80">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Flat (e.g. S-3, G-1), Resident (Nadeem), Expense ya Thekedar talash karein..."
            className="w-full bg-transparent text-sm sm:text-base font-bold text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block bg-white px-2 py-0.5 rounded text-[10px] font-mono font-bold text-slate-500 border border-slate-200 shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Selected Flat Detailed Quick Card (if clicked) */}
        {selectedFlatPreview && (
          <div className="bg-blue-50/90 border-b border-blue-200 p-4 relative">
            <button
              onClick={() => setSelectedFlatPreview(null)}
              className="absolute top-3 end-3 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-blue-700 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/20">
                  {selectedFlatPreview.flat}
                </span>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {selectedFlatPreview.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    {buildingName} — Floor: {selectedFlatPreview.floor || 'Standard'}
                  </p>
                </div>
              </div>

              <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                selectedFlatPreview.status === 'closed'
                  ? 'bg-slate-200 text-slate-700'
                  : selectedFlatPreview.status === 'paid' && Number(selectedFlatPreview.paid) >= Number(selectedFlatPreview.due)
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                {selectedFlatPreview.status === 'closed' ? 'Band 🔒' : selectedFlatPreview.status === 'paid' ? 'Paid ✓' : 'Due ⚠️'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-blue-200/60 text-xs text-center font-bold">
              <div className="bg-white p-2 rounded-xl border border-blue-100">
                <span className="text-[10px] text-slate-400 block font-normal">Monthly Due</span>
                <span className="text-slate-900">Rs. {Number(selectedFlatPreview.due || 3000).toLocaleString()}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-blue-100">
                <span className="text-[10px] text-slate-400 block font-normal">Prior Arrears</span>
                <span className="text-rose-700">Rs. {Number(selectedFlatPreview.priorArrears || 0).toLocaleString()}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-blue-100">
                <span className="text-[10px] text-slate-400 block font-normal">Total Outstanding</span>
                <span className="text-blue-950 font-black">Rs. {Number(selectedFlatPreview.arrears || selectedFlatPreview.due || 0).toLocaleString()}</span>
              </div>
            </div>

            {selectedFlatPreview.adjustmentNote && (
              <div className="mt-2 text-xs bg-amber-50 border border-amber-200 p-2 rounded-xl text-amber-900">
                <span className="font-bold">📝 وضاحتی نوٹ: </span>
                <span>"{selectedFlatPreview.adjustmentNote}"</span>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mt-3 pt-2 flex-wrap">
              {selectedFlatPreview.phone && (
                <button
                  onClick={() => {
                    const phone = cleanPhoneNumber(selectedFlatPreview.phone);
                    window.open(`https://api.whatsapp.com/send?phone=${phone}`, '_blank');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              )}

              {onOpenResidentLedger && (
                <button
                  onClick={() => {
                    onOpenResidentLedger(selectedFlatPreview);
                    onClose();
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Resident Timeline</span>
                </button>
              )}

              <button
                onClick={() => {
                  onNavigate('collections');
                  onClose();
                }}
                className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
              >
                <span>Go to Collections</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <button
                onClick={() => {
                  onNavigate('bills-whatsapp');
                  onClose();
                }}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
              >
                <span>Monthly Bill</span>
              </button>
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 flex-1">
          {searchResults.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Koi record nahi mila "{query}" ke sath.</p>
              <p className="text-[11px] mt-1 text-slate-400">Kisi aur flat ka number ya naam type karein.</p>
            </div>
          ) : (
            searchResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const IconComp = item.icon || Building2;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-white/30 text-white' : item.badgeColor || 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold opacity-75">
                    <span>Open</span>
                    <CornerDownLeft className="w-3 h-3" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-semibold px-4">
          <div className="flex items-center gap-3">
            <span>Navigate: <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[10px]">↑</kbd> <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[10px]">↓</kbd></span>
            <span>Select: <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[10px]">Enter</kbd></span>
            <span>Close: <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[10px]">Esc</kbd></span>
          </div>
          <span className="text-blue-700 font-bold">Universal Search</span>
        </div>
      </div>
    </div>
  );
}

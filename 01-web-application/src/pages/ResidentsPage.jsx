import React, { useState } from 'react';
import {
  Users,
  Search,
  Building,
  Phone,
  Home,
  CheckCircle2,
  Lock,
  Unlock,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Edit3,
  X,
  Check
} from 'lucide-react';
import { masterResidentsList } from '../data/initialData';
import { formatResidentDisplayName, cleanResidentBaseName } from '../utils/residentUtils';

export default function ResidentsPage({
  residentDirectory = [],
  onUpdateDirectory,
  currentFlats = [],
  onUpdateFlats,
  buildingName,
  isFinalized,
  t,
  lang,
  onNotify
}) {
  const [search, setSearch] = useState('');
  const [floorFilter, setFloorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'closed' | 'owner' | 'tenant'
  const [editingResident, setEditingResident] = useState(null);

  // Single Source of Truth: Base on persistent residentDirectory
  const directorySource = (residentDirectory && residentDirectory.length > 0)
    ? residentDirectory
    : masterResidentsList;

  const residents = directorySource.map(master => {
    const liveMatch = currentFlats.find(f => f.flat === master.flat || f.sno === master.sno);
    const isClosed = master.status === 'closed' || (liveMatch && liveMatch.status === 'closed');
    const includeSahab = master.includeSahab !== undefined ? master.includeSahab !== false : (liveMatch?.includeSahab !== false);
    return {
      ...master,
      currentName: master.name || (liveMatch ? liveMatch.name : ''),
      currentDue: isClosed ? 0 : (master.due || (liveMatch ? liveMatch.due : 3000)),
      status: isClosed ? 'closed' : 'active',
      phone: master.phone || (liveMatch ? liveMatch.phone : ''),
      occupantType: master.occupantType || liveMatch?.occupantType || 'owner',
      includeSahab
    };
  });

  const activeCount = residents.filter(r => r.status !== 'closed').length;
  const closedCount = residents.filter(r => r.status === 'closed').length;
  const ownerCount = residents.filter(r => r.occupantType !== 'tenant').length;
  const tenantCount = residents.filter(r => r.occupantType === 'tenant').length;

  // Handle saving resident details edited in RD
  const handleSaveResident = (e) => {
    e.preventDefault();
    if (!editingResident) return;

    const baseName = cleanResidentBaseName(editingResident.currentName || editingResident.name || '');
    if (!baseName) {
      alert('Resident Name cannot be empty!');
      return;
    }

    const occType = editingResident.occupantType || 'owner';
    const includeSahab = editingResident.includeSahab !== false;
    const formattedName = formatResidentDisplayName(baseName, occType, includeSahab);

    const updated = directorySource.map(r => {
      if (r.flat === editingResident.flat || r.sno === editingResident.sno) {
        return {
          ...r,
          name: formattedName,
          englishName: editingResident.englishName || r.englishName || '',
          phone: editingResident.phone || r.phone || '',
          occupantType: occType,
          includeSahab: includeSahab,
          due: editingResident.due !== undefined ? Number(editingResident.due) : (r.due || 3000)
        };
      }
      return r;
    });

    if (onUpdateDirectory) {
      onUpdateDirectory(updated);
    }
    if (onNotify) {
      onNotify(`Flat ${editingResident.flat} (${formattedName}) details updated across all sheets! ✓`);
    }
    setEditingResident(null);
  };

  // Bulk Sahab toggle: Quick building-wide switch
  const handleBulkToggleSahab = (enable) => {
    const updated = directorySource.map(r => {
      const baseName = cleanResidentBaseName(r.name || '');
      const occType = r.occupantType || 'owner';
      return {
        ...r,
        includeSahab: enable,
        name: formatResidentDisplayName(baseName, occType, enable)
      };
    });
    if (onUpdateDirectory) onUpdateDirectory(updated);
    if (onNotify) {
      onNotify(enable ? 'تمام رہائشیوں کے ساتھ "صاحب" فعال کر دیا گیا! ✓' : 'تمام رہائشیوں سے "صاحب" ہٹا دیا گیا! ✓');
    }
  };

  // Occupancy Status Toggle: Exclusively controlled from RD (Residents Directory)
  const handleToggleOccupancy = (flatNo) => {
    const targetResident = residents.find(r => r.flat === flatNo);
    if (!targetResident) return;

    const isCurrentlyClosed = targetResident.status === 'closed';
    const residentName = targetResident.currentName || targetResident.name;

    if (isCurrentlyClosed) {
      // Reopening / activating flat
      const masterInfo = masterResidentsList.find(m => m.flat === flatNo) || {};
      const baseDue = Number(masterInfo.due) || 3000;

      if (!window.confirm(`Kya aap Flat ${flatNo} (${residentName}) ko dobara "Active Resident (فعال)" mark karna chahte hain?\nIs unit par Rs. ${baseDue.toLocaleString('en-US')}/mahina maintenance lag jayegi.`)) {
        return;
      }

      const updated = directorySource.map(r => {
        if (r.flat === flatNo || r.sno === targetResident.sno) {
          return {
            ...r,
            status: 'active',
            due: baseDue
          };
        }
        return r;
      });

      if (onUpdateDirectory) onUpdateDirectory(updated);
      if (onNotify) onNotify(`Flat ${flatNo} (${residentName}) Active ho gaya! Maintenance: Rs. ${baseDue} ✓`);
    } else {
      // Locking / closing flat
      if (!window.confirm(`Kya aap Flat ${flatNo} (${residentName}) ko "Locked / Closed (بند گھر)" mark karna chahte hain?\nTamam mahino aur aane wali new sheets mein yeh flat band ho jayega aur collection 0 ho jayegi.`)) {
        return;
      }

      const updated = directorySource.map(r => {
        if (r.flat === flatNo || r.sno === targetResident.sno) {
          return {
            ...r,
            status: 'closed',
            due: 0
          };
        }
        return r;
      });

      if (onUpdateDirectory) onUpdateDirectory(updated);
      if (onNotify) onNotify(`Flat ${flatNo} (${residentName}) ko "Locked / Closed (بند گھر)" mark kar diya gaya 🔒`);
    }
  };

  const filteredResidents = residents.filter(r => {
    if (statusFilter === 'active' && r.status === 'closed') return false;
    if (statusFilter === 'closed' && r.status !== 'closed') return false;
    if (statusFilter === 'owner' && r.occupantType === 'tenant') return false;
    if (statusFilter === 'tenant' && r.occupantType !== 'tenant') return false;

    if (floorFilter !== 'all' && !r.floor.toLowerCase().includes(floorFilter.toLowerCase())) return false;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchFlat = r.flat.toLowerCase().includes(q);
      const matchName = (r.name || '').toLowerCase().includes(q) || (r.englishName || '').toLowerCase().includes(q);
      if (!matchFlat && !matchName) return false;
    }
    return true;
  });

  const floorList = [
    { id: 'all', label: 'All Floors (20)' },
    { id: 'ground', label: 'Ground Floor' },
    { id: '1st', label: '1st Floor' },
    { id: '2nd', label: '2nd Floor' },
    { id: '3rd', label: '3rd Floor' },
    { id: '4th', label: '4th Floor / Penthouse' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="erp-card rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-900 text-lg sm:text-xl">
              {t.navResidents} (RD) — {buildingName}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ur'
              ? 'رہائشیوں کی مرکزی ڈائرکٹری (RD): گھر بند (Locked)، فعال (Active) اور مالک / کرایہ دار کی مکمل پروفائل کا انتظام۔'
              : lang === 'roman'
              ? 'Residents Directory (RD): Ghar band (Locked), active aur owner/tenant profile management.'
              : 'Master directory: Manage resident profiles, occupancy status, and owner/tenant classifications.'}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-white text-slate-900 text-xs py-2 px-3 ps-8 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 font-medium shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute start-2.5 top-2.5" />
        </div>
      </div>

      {/* KPI Status Strip with Owner vs Tenant Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-2.5 sm:p-3.5 rounded-xl border text-start transition cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
              : 'erp-card text-slate-800 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] sm:text-[11px] font-semibold block opacity-80 uppercase tracking-wider">🏢 Total Units</span>
          <span className="text-base sm:text-lg font-bold font-mono">{residents.length}</span>
        </button>

        <button
          onClick={() => setStatusFilter('active')}
          className={`p-2.5 sm:p-3.5 rounded-xl border text-start transition cursor-pointer ${
            statusFilter === 'active'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
              : 'erp-card text-slate-800 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] sm:text-[11px] font-semibold block opacity-80 uppercase tracking-wider">🟢 Active</span>
          <span className="text-base sm:text-lg font-bold font-mono">{activeCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter('closed')}
          className={`p-2.5 sm:p-3.5 rounded-xl border text-start transition cursor-pointer ${
            statusFilter === 'closed'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-bold'
              : 'erp-card text-slate-800 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] sm:text-[11px] font-semibold block opacity-80 uppercase tracking-wider">🔒 Locked</span>
          <span className="text-base sm:text-lg font-bold font-mono">{closedCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter('owner')}
          className={`p-2.5 sm:p-3.5 rounded-xl border text-start transition cursor-pointer ${
            statusFilter === 'owner'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
              : 'erp-card text-slate-800 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] sm:text-[11px] font-semibold block opacity-80 uppercase tracking-wider">🏠 Owners</span>
          <span className="text-base sm:text-lg font-bold font-mono">{ownerCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter('tenant')}
          className={`p-2.5 sm:p-3.5 rounded-xl border text-start transition cursor-pointer col-span-2 sm:col-span-1 ${
            statusFilter === 'tenant'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-bold'
              : 'erp-card text-slate-800 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] sm:text-[11px] font-semibold block opacity-80 uppercase tracking-wider">🔑 Tenants</span>
          <span className="text-base sm:text-lg font-bold font-mono">{tenantCount}</span>
        </button>
      </div>

      {/* Floor Filter Tabs & Bulk Sahab Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {floorList.map(fl => (
            <button
              key={fl.id}
              onClick={() => setFloorFilter(fl.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                floorFilter === fl.id
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {fl.label}
            </button>
          ))}
        </div>

        {/* Global Sahab Bulk Switch */}
        <div className="flex items-center gap-1.5 shrink-0 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <span className="text-slate-600 font-semibold text-xs">صاحب کا لاحقہ:</span>
          <button
            type="button"
            onClick={() => handleBulkToggleSahab(true)}
            className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition shadow-xs cursor-pointer"
            title="تمام فلیٹس کے ساتھ 'صاحب' فعال کریں"
          >
            سب کیلئے 'صاحب' ✓
          </button>
          <button
            type="button"
            onClick={() => handleBulkToggleSahab(false)}
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition border border-slate-300 cursor-pointer"
            title="تمام فلیٹس سے 'صاحب' ہٹائیں (صرف اصل نام)"
          >
            بغیر صاحب
          </button>
        </div>
      </div>

      {/* Residents Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filteredResidents.map(res => {
          const isClosed = res.status === 'closed';

          return (
            <div
              key={res.sno}
              className={`erp-card rounded-2xl p-3.5 sm:p-5 hover:border-slate-300 transition duration-200 flex flex-col justify-between border ${
                isClosed
                  ? 'border-amber-300 bg-amber-50/30'
                  : 'border-slate-200/90 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded shadow-xs ${
                    isClosed ? 'bg-amber-800 text-white' : 'bg-slate-900 text-white'
                  }`}>
                    Flat {res.flat}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                    isClosed
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {isClosed ? 'بند (0 Due)' : `Rs. ${Number(res.currentDue).toLocaleString('en-US')}/mo`}
                  </span>
                </div>

                <div className="mt-3 flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">
                      {formatResidentDisplayName(res)}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {res.englishName}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${
                      res.occupantType === 'tenant'
                        ? 'bg-purple-100/80 text-purple-900 border-purple-300'
                        : 'bg-indigo-100/80 text-indigo-900 border-indigo-300'
                    }`}>
                      {res.occupantType === 'tenant' ? '🔑 Tenant' : '🏠 Owner'}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg border shrink-0 ${
                      res.includeSahab !== false
                        ? 'bg-blue-100/70 text-blue-900 border-blue-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`} title={res.includeSahab !== false ? "نام کے آگے 'صاحب' شامل ہے" : "صرف نام (بغیر صاحب)"}>
                      {res.includeSahab !== false ? 'صاحب ✓' : 'صرف نام'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{res.floor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-bold">
                      حالت: {isClosed ? '🔒 بند گھر (Closed)' : '✓ فعال رہائشی (Active)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Occupancy & Profile Control Actions: Controlled Exclusively in RD */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl border ${
                    isClosed
                      ? 'bg-amber-500/20 text-amber-900 border-amber-400/50'
                      : 'bg-emerald-500/20 text-emerald-800 border-emerald-400/50'
                  }`}>
                    {isClosed ? '🔒 Closed' : '✓ Active'}
                  </span>

                  <button
                    onClick={() => setEditingResident({
                      ...res,
                      currentName: cleanResidentBaseName(res.currentName || res.name || ''),
                      includeSahab: res.includeSahab !== false
                    })}
                    className="p-1.5 px-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                    title="Edit resident display name and contact"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{lang === 'ur' ? 'ترمیم' : lang === 'roman' ? 'Edit Name' : 'Edit Details'}</span>
                  </button>
                </div>

                <button
                  onClick={() => handleToggleOccupancy(res.flat)}
                  className={`w-full text-xs font-extrabold py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm border cursor-pointer ${
                    isClosed
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40 shadow-emerald-600/25'
                      : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400/40 shadow-amber-600/25'
                  }`}
                  title={
                    isClosed
                      ? 'Isko active karein (monthly maintenance lag jayegi)'
                      : 'Isko band ghar mark karein (maintenance 0 ho jayegi)'
                  }
                >
                  {isClosed ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>فعال کریں (Make Active)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>بند گھر (Lock Unit)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Resident Details Modal */}
      {editingResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in no-print-overlay">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-slate-900 relative">
            <button
              onClick={() => setEditingResident(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/15 text-blue-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  {lang === 'ur' ? `رہائشی کی تفصیلات — فلیٹ ${editingResident.flat}` : `Edit Resident — Flat ${editingResident.flat}`}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ur' ? 'یہاں سے نام اپڈیٹ کرنے پر مینٹیننس شیٹ میں فوراً تبدیل ہو جائے گا' : 'Changes here immediately update the maintenance sheet'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveResident} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ur' ? 'رہائشی کا نام (اردو / ڈسپلے نام):' : 'Resident Name (Urdu / Display Name):'}
                </label>
                <input
                  type="text"
                  required
                  value={editingResident.currentName || ''}
                  onChange={(e) => setEditingResident(prev => ({ ...prev, currentName: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="e.g. انجم پرویز"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ur' ? 'انگریزی نام (English Name):' : 'English Name:'}
                </label>
                <input
                  type="text"
                  value={editingResident.englishName || ''}
                  onChange={(e) => setEditingResident(prev => ({ ...prev, englishName: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="e.g. Anjum Parvez"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ur' ? 'فون نمبر / واٹس ایپ:' : 'Phone / WhatsApp:'}
                </label>
                <input
                  type="text"
                  value={editingResident.phone || ''}
                  onChange={(e) => setEditingResident(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="e.g. 0300-1234567"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ur' ? 'رہائش کی حیثیت (Occupant Type):' : 'Occupant Classification:'}
                </label>
                <select
                  value={editingResident.occupantType || 'owner'}
                  onChange={(e) => setEditingResident(prev => ({ ...prev, occupantType: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
                >
                  <option value="owner">🏠 مالک مکان (Owner)</option>
                  <option value="tenant">🔑 کرایہ دار (Tenant)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ur' ? 'نام کے ساتھ "صاحب" کا لاحقہ (Honorific Suffix):' : "Honorific 'Sahab' Setting:"}
                </label>
                <select
                  value={editingResident.includeSahab !== false ? 'yes' : 'no'}
                  onChange={(e) => setEditingResident(prev => ({ ...prev, includeSahab: e.target.value === 'yes' }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
                >
                  <option value="yes">✅ ہاں، نام کے ساتھ "صاحب" لگائیں (Default: With 'صاحب')</option>
                  <option value="no">❌ نہیں، "صاحب" نہ لگائیں (Without 'صاحب' - صرف اصل نام)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {editingResident.includeSahab !== false
                    ? 'بائی ڈیفالٹ رجسٹر، سلپس، ایکسل اور واٹس ایپ میں "صاحب" لگا رہے گا۔'
                    : 'اس فلیٹ کیلئے "صاحب" ہٹا دیا جائے گا (صرف نام ظاہر ہوگا)۔'}
                </p>
              </div>

              {/* Live Preview Box showing automatic Sahab & Tenant suffix */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-bold">
                  {lang === 'ur' ? 'حتمی ڈسپلے نام (Live Preview):' : 'Final Display Preview:'}
                </span>
                <span className="font-black text-blue-950 bg-white px-2.5 py-1 rounded-lg border border-blue-300 shadow-2xs">
                  {formatResidentDisplayName(
                    editingResident.currentName || editingResident.name,
                    editingResident.occupantType || 'owner',
                    editingResident.includeSahab !== false
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingResident(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  {lang === 'ur' ? 'منسوخ کریں' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{lang === 'ur' ? 'محفوظ کریں' : 'Save Details'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

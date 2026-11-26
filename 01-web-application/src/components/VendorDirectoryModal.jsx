import React, { useState } from 'react';
import {
  Wrench,
  Phone,
  MessageCircle,
  Plus,
  Trash2,
  X,
  Shield,
  Zap,
  Droplets,
  Building2,
  AlertOctagon,
  Users
} from 'lucide-react';

const INITIAL_VENDORS = [
  { id: 1, name: 'اسامہ الیکٹریشن', role: 'Electrician (الیکٹریشن)', phone: '0312-2849102', note: 'Motor & wiring repair specialist' },
  { id: 2, name: 'شفیق پلمبر', role: 'Plumber (پلمبر)', phone: '0321-9876543', note: 'Overhead tank & pipeline leakage' },
  { id: 3, name: 'کراچی ایلیویٹرز سروس', role: 'Lift Maintenance (لفٹ ٹیکنیشن)', phone: '0300-4567891', note: 'Monthly elevator servicing contract' },
  { id: 4, name: 'المدینہ واٹر سپلائی', role: 'Water Tanker (واٹر ٹینکر)', phone: '0333-1122334', note: '1000/2000 gallon sweet water bowsers' },
  { id: 5, name: 'جمعدار (سویپر)', role: 'Janitor & Cleaning (صفائی و کوڑا)', phone: '0345-5566778', note: 'Daily stairs & corridor cleaning' },
  { id: 6, name: 'ایڈمنسٹریٹر / بلڈنگ کمیٹی', role: 'Building Management (انتظامیہ)', phone: '0300-1234567', note: 'Society chairman & accounts' }
];

const EMERGENCY_NUMBERS = [
  { name: 'Police Emergency (پولیس مددگار)', number: '15', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { name: 'Fire Brigade (فائر بریگیڈ)', number: '16', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  { name: 'Rescue / Ambulance (امدادی ایمبولینس)', number: '1122', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { name: 'K-Electric Complaint (کے الیکٹرک)', number: '118', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { name: 'Sui Gas Helpline (سوئی سدرن گیس)', number: '1199', color: 'text-purple-700 bg-purple-50 border-purple-200' }
];

export default function VendorDirectoryModal({
  isOpen,
  onClose,
  buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19',
  onNotify
}) {
  const [vendors, setVendors] = useState(INITIAL_VENDORS);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNote, setNewNote] = useState('');

  if (!isOpen) return null;

  const handleAddVendor = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    const v = {
      id: Date.now(),
      name: newName.trim(),
      role: newRole.trim() || 'Building Technician',
      phone: newPhone.trim(),
      note: newNote.trim()
    };
    setVendors([...vendors, v]);
    setNewName('');
    setNewRole('');
    setNewPhone('');
    setNewNote('');
    if (onNotify) onNotify('Technician added to Directory! 🔧');
  };

  const handleDelete = (id) => {
    setVendors(vendors.filter(v => v.id !== id));
  };

  const handleWhatsAppVendor = (vendor) => {
    const rawDigits = vendor.phone.replace(/[^0-9]/g, '');
    let intlPhone = rawDigits;
    if (rawDigits.startsWith('03')) {
      intlPhone = '92' + rawDigits.substring(1);
    }
    const text = `السلام علیکم ${vendor.name} بھائی، میں ${buildingName} کی مینجمنٹ سے بات کر رہا ہوں۔ عمارت میں ایک کام کے سلسلے میں آپ کی ضرورت ہے۔ براہ کرم رابطہ فرمائیں۔`;
    window.open(`https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto">
      <div className="backdrop-blur-2xl bg-white/95 rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.5)] border border-white/80 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 font-black">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <span>کاریگر و ایمرجنسی سروسز ڈائریکٹری</span>
                <span className="text-[10px] bg-amber-500/15 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  Quick Contacts
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Building maintenance technicians, contractors & emergency helplines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto">
          
          {/* Emergency Helpline Strip */}
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5 mb-2.5">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>Official Emergency Helplines (فوری امدادی نمبرز)</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {EMERGENCY_NUMBERS.map((em) => (
                <a
                  key={em.number}
                  href={`tel:${em.number}`}
                  className={`p-2.5 rounded-2xl border text-center transition hover:scale-102 flex flex-col justify-between ${em.color}`}
                >
                  <span className="text-[10px] font-bold block truncate">{em.name}</span>
                  <span className="text-lg font-black font-mono tracking-tight mt-1">{em.number}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Vendors & Technicians List */}
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2.5">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>Building Services & Technicians ({vendors.length})</span>
            </span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vendors.map((v) => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-slate-900 text-sm font-urdu">
                        {v.name}
                      </h4>
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="text-slate-300 hover:text-rose-500 p-1 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[11px] font-bold text-amber-900 block mt-0.5">
                      {v.role}
                    </span>
                    {v.note && (
                      <p className="text-[10px] text-slate-500 mt-1 italic">
                        {v.note}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-800">
                      {v.phone}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleWhatsAppVendor(v)}
                        className="p-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 border border-emerald-400/30 transition cursor-pointer"
                        title="Open WhatsApp chat"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={`tel:${v.phone.replace(/[^0-9]/g, '')}`}
                        className="p-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 border border-blue-400/30 transition cursor-pointer"
                        title="Call technician"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Technician Form */}
          <form onSubmit={handleAddVendor} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
              + Add New Contractor / Technician:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Technician Name (e.g. ناصر الیکٹریشن)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-white p-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 font-urdu"
              />
              <input
                type="text"
                placeholder="Trade / Role (e.g. پلمبر / واٹر ٹینکر)"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="bg-white p-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
              />
              <input
                type="text"
                placeholder="Mobile (0300-1234567)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="bg-white p-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Notes / Remarks (Optional)"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full bg-white p-2 rounded-xl border border-slate-300 text-xs text-slate-800"
              />
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 rounded-xl text-xs transition shrink-0 cursor-pointer"
              >
                + Add
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

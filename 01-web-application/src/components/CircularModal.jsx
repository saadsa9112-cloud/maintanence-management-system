import React, { useState } from 'react';
import {
  FileText,
  X,
  Printer,
  Copy,
  MessageCircle,
  Share2,
  Check,
  Calendar,
  Building2,
  Sparkles,
  Droplets,
  Zap,
  Users,
  ShieldAlert,
  Car
} from 'lucide-react';

const NOTICE_TEMPLATES = [
  {
    id: 'water',
    titleUrdu: 'پانی کی سپلائی اور ٹینکر کا شیڈول',
    titleEng: 'Water Supply & Tanker Schedule Announcement',
    icon: Droplets,
    badgeColor: 'bg-blue-500/15 text-blue-800 border-blue-400/40',
    defaultUrdu: 'تمام معزز مکینوں کو مطلع کیا جاتا ہے کہ واٹر بورڈ کی لائن میں کام کی وجہ سے پانی کی سپلائی عارضی طور پر متاثر ہے۔ بلڈنگ مینجمنٹ نے اضافی واٹر ٹینکرز کا انتظام کر دیا ہے۔ پانی کو احتیاط سے استعمال فرمائیں اور موٹر چلانے کے مخصوص اوقات کی پابندی کریں۔',
    defaultEng: 'All residents are informed that municipal water supply is temporarily disrupted due to line maintenance. Building management has arranged water tankers. Please conserve water and adhere to motor pumping schedules.'
  },
  {
    id: 'lift',
    titleUrdu: 'لفٹ کی ماہانہ سروس اور وقتی بندش',
    titleEng: 'Elevator Monthly Maintenance Downtime',
    icon: Building2,
    badgeColor: 'bg-amber-500/15 text-amber-900 border-amber-400/40',
    defaultUrdu: 'تمام مکینوں کو آگاہ کیا جاتا ہے کہ لفٹ کی ماہانہ چیکنگ اور آئلنگ/سروس بروز اتوار بوقت 2:00 تا 5:00 بجے شام مقرر کی گئی ہے۔ اس دوران لفٹ بند رہے گی۔ بزرگ اور مریض حضرات پیشگی ضروری کام نمٹا لیں۔ تکلیف کے لیے معذرت خواہ ہیں۔',
    defaultEng: 'Monthly routine servicing and safety inspection of the building elevator is scheduled for Sunday between 2:00 PM to 5:00 PM. The elevator will remain non-operational during these hours.'
  },
  {
    id: 'dues',
    titleUrdu: 'ماہانہ مینٹیننس کی فوری ادائیگی کی اپیل',
    titleEng: 'Urgent Maintenance Dues Clearance Notice',
    icon: ShieldAlert,
    badgeColor: 'bg-rose-500/15 text-rose-800 border-rose-400/40',
    defaultUrdu: 'محترم مکینوں، بلڈنگ کے ضروری اخراجات (بجلی بل، جمعدار تنخواہ، موٹر آپریٹر اور سویپر) کی ادائیگی کے لیے تمام بقایا دار حضرات سے گزارش ہے کہ 3 یوم کے اندر اپنے بقایا جات جمع کروائیں تاکہ بلڈنگ کے بنیادی انتظامات بلا تعطل جاری رہ سکیں۔',
    defaultEng: 'Respected residents, to ensure seamless utility bill payments (K-Electric, sweeper, motor operator), residents with pending arrears are requested to clear dues within 3 days.'
  },
  {
    id: 'meeting',
    titleUrdu: 'تمام مکینوں کا ماہانہ مشاورتی اجلاس',
    titleEng: 'Monthly Residents General Body Meeting',
    icon: Users,
    badgeColor: 'bg-purple-500/15 text-purple-800 border-purple-400/40',
    defaultUrdu: 'بلڈنگ کے انتظامی امور، سیکیورٹی انتظامات اور آئندہ ماہ کے بجٹ پر مشاورت کے لیے تمام فلیٹ مالکان اور کرایہ داروں کا مشترکہ اجلاس بروز اتوار بعد نماز عشاء چھت پر منعقد ہوگا۔ تمام حضرات کی شرکت لازمی ہے۔',
    defaultEng: 'General body meeting regarding building security, cleanliness, and upcoming budget will be held on Sunday after Isha prayer on the rooftop. Your valuable presence is requested.'
  },
  {
    id: 'kelectric',
    titleUrdu: 'لوڈشیڈنگ اور جنریٹر کے قواعد و ضوابط',
    titleEng: 'Generator & Common Power Regulations',
    icon: Zap,
    badgeColor: 'bg-emerald-500/15 text-emerald-800 border-emerald-400/40',
    defaultUrdu: 'لوڈشیڈنگ کے دوران مشترکہ جنریٹر صرف پانی کی موٹر، راہداریوں کی لائٹس اور لفٹ کے لیے چلایا جائے گا۔ کسی بھی فلیٹ کو انفرادی ہیوی لوڈ (اے سی، واشنگ مشین) چلانے کی اجازت نہیں ہے۔',
    defaultEng: 'During power outages, backup generator operates exclusively for common corridor lighting, water pump, and elevator. Individual heavy loads are strictly prohibited.'
  },
  {
    id: 'parking',
    titleUrdu: 'پارکنگ اور مین گیٹ سیکیورٹی گائیڈ لائنز',
    titleEng: 'Parking & Main Gate Security SOPs',
    icon: Car,
    badgeColor: 'bg-slate-500/15 text-slate-800 border-slate-400/40',
    defaultUrdu: 'رات 11:00 بجے کے بعد مین گیٹ بند رکھا جائے گا۔ تمام مکین اپنی گاڑیاں اور موٹر سائیکلیں مختص کردہ نمبرز پر پارک کریں تاکہ راستہ بلاک نہ ہو۔ غیر متعلقہ مہمانوں کا اندراج چوکیدار کے رجسٹر میں لازمی ہے۔',
    defaultEng: 'Main building gate will be locked after 11:00 PM. Please park vehicles in designated bays only. Guest entries must be logged with the security guard.'
  }
];

export default function CircularModal({
  isOpen,
  onClose,
  buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19',
  onNotify
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('water');
  const [customUrduText, setCustomUrduText] = useState('');
  const [customEngText, setCustomEngText] = useState('');
  const [noticeDate, setNoticeDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  });
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const currentTemplate = NOTICE_TEMPLATES.find(t => t.id === selectedTemplateId) || NOTICE_TEMPLATES[0];
  const urduBody = customUrduText || currentTemplate.defaultUrdu;
  const engBody = customEngText || currentTemplate.defaultEng;

  const handleSelectTemplate = (tId) => {
    setSelectedTemplateId(tId);
    setCustomUrduText('');
    setCustomEngText('');
  };

  const getWhatsAppNoticeText = () => {
    let msg = `📜 *${buildingName} — OFFICIAL CIRCULAR*\n`;
    msg += `📅 *Date:* ${noticeDate}\n`;
    msg += `📢 *Subject:* ${currentTemplate.titleEng}\n`;
    msg += `------------------------------------\n`;
    msg += `*محترم مکینوں،*\n\n`;
    msg += `${urduBody}\n\n`;
    msg += `------------------------------------\n`;
    msg += `*English Summary:*\n${engBody}\n`;
    msg += `------------------------------------\n`;
    msg += `جزاکم اللہ خیراً\n`;
    msg += `*بلڈنگ مینجمنٹ کمیٹی / ایڈمنسٹریٹر*\n`;
    msg += `${buildingName}`;
    return msg;
  };

  const handleCopyNotice = () => {
    const text = getWhatsAppNoticeText();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2200);
    if (onNotify) onNotify('Notice copied for WhatsApp Broadcast! 📋');
  };

  const handleOpenWhatsApp = () => {
    const text = getWhatsAppNoticeText();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="backdrop-blur-2xl bg-white/95 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.5)] border border-white/80 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-black">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <span>بلڈنگ سرکلر و نوٹس بورڈ جنریٹر</span>
                <span className="text-[10px] bg-blue-500/15 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
                  Smart Circulars
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Generate official bilingual notices with one click for WhatsApp and printing
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

        {/* Content Body: Left Column Controls, Right Column Live Letterhead */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Template Selector & Custom Notes (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                1. Select Circular Template:
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {NOTICE_TEMPLATES.map((tmpl) => {
                  const Icon = tmpl.icon;
                  const isSelected = tmpl.id === selectedTemplateId;
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => handleSelectTemplate(tmpl.id)}
                      className={`w-full text-start p-2.5 rounded-2xl border transition flex items-center gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/90 border-blue-400 shadow-xs'
                          : 'bg-white/60 hover:bg-white border-slate-200/80'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${tmpl.badgeColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {tmpl.titleUrdu}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate">
                          {tmpl.titleEng}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date field */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                Notice Date:
              </label>
              <input
                type="text"
                value={noticeDate}
                onChange={(e) => setNoticeDate(e.target.value)}
                className="w-full bg-white px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Custom Edit Boxes */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                ترمیم شدہ اردو متن (Optional Customize):
              </label>
              <textarea
                rows={3}
                value={customUrduText}
                placeholder={currentTemplate.defaultUrdu}
                onChange={(e) => setCustomUrduText(e.target.value)}
                className="w-full bg-white p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-urdu text-end leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                English Text (Optional Customize):
              </label>
              <textarea
                rows={3}
                value={customEngText}
                placeholder={currentTemplate.defaultEng}
                onChange={(e) => setCustomEngText(e.target.value)}
                className="w-full bg-white p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Right Column: Live Printable Letterhead Preview (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border-2 border-slate-300/80 shadow-md flex flex-col justify-between space-y-4 font-sans">
            <div>
              {/* Official Letterhead Header */}
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  OFFICIAL RESIDENTS CIRCULAR
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {buildingName}
                </h2>
                <p className="text-[11px] text-slate-600 font-bold mt-0.5">
                  Building Management & Residents Welfare Committee
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 font-bold border-t border-dashed border-slate-300 pt-1.5">
                  <span>Ref: AMH/CIR/{selectedTemplateId.toUpperCase()}</span>
                  <span>Date: {noticeDate}</span>
                </div>
              </div>

              {/* Subject */}
              <div className="mt-4 p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase block">SUBJECT / عنوان</span>
                <h4 className="text-sm font-black text-slate-900 font-urdu mt-0.5">
                  {currentTemplate.titleUrdu}
                </h4>
                <p className="text-xs font-bold text-slate-700">
                  {currentTemplate.titleEng}
                </p>
              </div>

              {/* Body Urdu */}
              <div className="mt-4 p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/60">
                <p className="font-urdu text-sm text-slate-900 text-end leading-loose font-medium">
                  {urduBody}
                </p>
              </div>

              {/* Body English */}
              <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {engBody}
                </p>
              </div>
            </div>

            {/* Official Signatures */}
            <div className="pt-6 border-t border-slate-300 flex items-center justify-between text-xs text-slate-700">
              <div className="text-center">
                <div className="w-36 border-b-2 border-slate-800 mb-1 mx-auto" />
                <span className="font-black text-xs text-slate-900 block">حافظ محمد سعد</span>
                <span className="text-[10px] text-slate-600 font-bold">Maintenance Administrator</span>
              </div>
              <div className="text-center">
                <div className="w-32 border-b-2 border-slate-800 mb-1 mx-auto" />
                <span className="font-bold text-xs text-slate-900 block">دستخط چیئرمین</span>
                <span className="text-[10px] text-slate-600">Building Chairman</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200/80 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            💡 Notice ready for WhatsApp Group Broadcast and Official Notice Board
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyNotice}
              className="backdrop-blur-md bg-white hover:bg-slate-100 text-slate-800 font-black text-xs px-4 py-2.5 rounded-2xl border border-slate-300 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-blue-600" />}
              <span>{isCopied ? 'Copied ✓' : 'Copy WhatsApp Text'}</span>
            </button>
            <button
              onClick={handleOpenWhatsApp}
              className="backdrop-blur-md bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share to WhatsApp Group</span>
            </button>
            <button
              onClick={() => window.print()}
              className="backdrop-blur-md bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Notice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

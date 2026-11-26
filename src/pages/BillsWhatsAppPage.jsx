import React, { useState, useMemo, useRef } from 'react';
import {
  FileText,
  Send,
  Printer,
  Copy,
  Check,
  Search,
  Filter,
  Calendar,
  Building2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare,
  Scissors,
  X,
  Share2,
  ChevronDown,
  Layers,
  ArrowRight,
  Camera,
  Image,
  Download,
  AlertTriangle,
  Hourglass
} from 'lucide-react';
import {
  buildMonthlyDemandBillMessage,
  openMonthlyDemandBillWhatsApp,
  cleanPhoneNumber
} from '../utils/whatsapp';
import { formatResidentDisplayName } from '../utils/residentUtils';
import { getBillingTimelineStatus, buildPhasedWhatsAppMessage } from '../utils/dueDateUtils';
import { downloadElementAsPng, shareElementAsImage } from '../utils/imageExport';

export default function BillsWhatsAppPage({
  currentMonthData,
  activeMonthKey,
  allMonthsData = {},
  monthOrder = [],
  onSelectMonth,
  buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19',
  specialFunds = [],
  lang = 'roman',
  t,
  onNotify
}) {
  const [activeTab, setActiveTab] = useState('demand_slips'); // 'demand_slips', 'broadcast', 'circulars'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'unpaid', 'paid'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlatForModal, setSelectedFlatForModal] = useState(null);
  const [isPaperSaverPrintOpen, setIsPaperSaverPrintOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Bill settings
  const [billDueDate, setBillDueDate] = useState('10th of this month');
  const [includeSpecialFund, setIncludeSpecialFund] = useState(false);
  const [selectedFundId, setSelectedFundId] = useState(specialFunds[0]?.id || '');
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState('unpaid'); // 'unpaid' | 'paid' | 'all'
  const [broadcastDetailMode, setBroadcastDetailMode] = useState('with_details'); // 'with_details' | 'only_flats'
  const billCardRef = useRef(null);

  const flats = currentMonthData?.flats || [];
  const monthName = currentMonthData?.name || activeMonthKey;
  const dateStr = currentMonthData?.dateStr || '28-Oct-2026';

  // Smart Billing Timeline Phase (Due 10th, Grace 15th, Overdue 16th - Zero Surcharge)
  const timelineStatus = useMemo(() => {
    return getBillingTimelineStatus(dateStr, 10, 15);
  }, [dateStr]);

  // Handle single PNG Image Download
  const handleDownloadSlipImage = async (flat) => {
    if (!billCardRef.current) return;
    setIsExportingImage(true);
    const fname = `AlMustafa_Bill_Flat_${flat.flat}_${monthName.replace(/\s+/g, '_')}.png`;
    const ok = await downloadElementAsPng(billCardRef.current, fname);
    setIsExportingImage(false);
    if (ok && onNotify) onNotify(`Bill card downloaded as PNG image for Flat ${flat.flat}! 📸✓`);
  };

  // Handle Mobile WhatsApp Image Share
  const handleShareSlipImage = async (flat) => {
    if (!billCardRef.current) return;
    setIsExportingImage(true);
    const fname = `AlMustafa_Bill_Flat_${flat.flat}_${monthName.replace(/\s+/g, '_')}.png`;
    const ok = await shareElementAsImage(billCardRef.current, fname, `Maintenance Bill - Flat ${flat.flat}`);
    setIsExportingImage(false);
    if (ok && onNotify) onNotify(`Image shared! 📲✓`);
  };

  // Handle Phased WhatsApp sending (Normal, Grace, Overdue)
  const handleSendPhasedWhatsApp = (flat, phase) => {
    const rawPhone = flat.phone || '';
    const phone = cleanPhoneNumber(rawPhone);
    const msg = buildPhasedWhatsAppMessage({
      flat,
      monthName,
      buildingName,
      lang,
      phase: phase || timelineStatus.phase,
      dueDay: 10,
      graceEndDay: 15
    });

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Active special fund details if chosen
  const currentSpecialFund = useMemo(() => {
    if (!includeSpecialFund) return null;
    return specialFunds.find(f => f.id === selectedFundId) || specialFunds[0] || null;
  }, [includeSpecialFund, specialFunds, selectedFundId]);

  // Filtered flats
  const filteredFlats = useMemo(() => {
    return flats.filter(flat => {
      if (filterStatus === 'unpaid') {
        const isUnpaid = flat.status === 'arrears' || (flat.status !== 'closed' && (Number(flat.arrears) > 0 || Number(flat.paid) < Number(flat.due)));
        if (!isUnpaid) return false;
      }
      if (filterStatus === 'paid') {
        if (flat.status !== 'paid' && Number(flat.paid) < Number(flat.due)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fMatch = (flat.flat || '').toLowerCase().includes(q);
        const nMatch = (flat.name || '').toLowerCase().includes(q);
        return fMatch || nMatch;
      }
      return true;
    });
  }, [flats, filterStatus, searchQuery]);

  // Overall stats
  const totalFlats = flats.length;
  const paidCount = flats.filter(f => f.status === 'paid' && Number(f.paid) > 0).length;
  const unpaidCount = flats.filter(f => f.status !== 'closed' && (Number(f.arrears) > 0 || Number(f.paid) < Number(f.due))).length;
  const totalDemandAmount = flats.reduce((acc, f) => {
    if (f.status === 'closed') return acc;
    const due = Number(f.due || 3000);
    const prior = Number(f.priorArrears || (f.arrears > f.due ? f.arrears - f.due : 0));
    const sf = currentSpecialFund ? (currentSpecialFund.flats?.find(sfFlat => sfFlat.flat === f.flat)?.target || 0) : 0;
    return acc + due + prior + sf;
  }, 0);

  // Handle single copy
  const handleCopyBill = (flat) => {
    const sfAmount = currentSpecialFund ? (currentSpecialFund.flats?.find(sfFlat => sfFlat.flat === flat.flat)?.target || 0) : 0;
    const msg = buildMonthlyDemandBillMessage({
      flat,
      monthName,
      buildingName,
      dueDate: billDueDate,
      specialFundAmount: sfAmount,
      specialFundTitle: currentSpecialFund?.name || '',
      lang,
      dateStr
    });
    navigator.clipboard.writeText(msg);
    setCopiedId(flat.sno);
    setTimeout(() => setCopiedId(null), 2500);
    if (onNotify) onNotify(`Bill slip copied for Flat ${flat.flat}! 📋`);
  };

  // Handle WhatsApp bill
  const handleSendWhatsAppBill = (flat) => {
    const sfAmount = currentSpecialFund ? (currentSpecialFund.flats?.find(sfFlat => sfFlat.flat === flat.flat)?.target || 0) : 0;
    openMonthlyDemandBillWhatsApp({
      flat,
      monthName,
      buildingName,
      dueDate: billDueDate,
      specialFundAmount: sfAmount,
      specialFundTitle: currentSpecialFund?.name || '',
      lang,
      dateStr
    });
    if (onNotify) onNotify(`Opening WhatsApp for Flat ${flat.flat}... 📲`);
  };

  // Group broadcast text generator (Supports Target Filter & Details vs Only Flat Names Privacy)
  const groupBroadcastMessage = useMemo(() => {
    const activeUnpaid = flats.filter(f => f.status !== 'closed' && (Number(f.arrears) > 0 || Number(f.paid) < Number(f.due)));
    const activePaid = flats.filter(f => f.status !== 'closed' && Number(f.paid) > 0 && Number(f.arrears) === 0);
    const totalArrears = activeUnpaid.reduce((acc, f) => acc + Number(f.arrears || f.due || 0), 0);
    const totalCollected = activePaid.reduce((acc, f) => acc + Number(f.paid || 0), 0);
    const includeNames = broadcastDetailMode === 'with_details';

    // 1. Paid Only Broadcast
    if (broadcastTarget === 'paid') {
      let msg = `✅ *${buildingName} — وصول شدہ مینٹیننس فہرست (${monthName})*\n`;
      msg += `--------------------------------------------------\n`;
      msg += `*وصول شدہ فلیٹس (${activePaid.length} فلیٹس - ${includeNames ? 'تفصیل و نام کے ساتھ' : 'صرف فلیٹ نمبرز'}):*\n\n`;

      if (includeNames) {
        activePaid.forEach((f, i) => {
          msg += `${i + 1}. *فلیٹ ${f.flat}* (${formatResidentDisplayName(f)}): Rs. ${Number(f.paid || 0).toLocaleString('en-US')} ✓\n`;
        });
        msg += `\n💰 *کُل وصول شدہ رقم:* Rs. ${totalCollected.toLocaleString('en-US')}\n`;
      } else {
        const flatListStr = activePaid.map(f => f.flat).join('، ');
        msg += `فلیٹس: ${flatListStr || 'کوئی نہیں'}\n\n`;
        msg += `✅ *کُل کلیئر شدہ فلیٹس:* ${activePaid.length} فلیٹس\n`;
      }

      msg += `--------------------------------------------------\n`;
      msg += `تمام باقاعدہ فیس ادا کرنے والے معزز رہائشیوں کا شکریہ!\n_ایڈمن: حافظ محمد سعد_`;
      return msg;
    }

    // 2. Unpaid Only Broadcast
    if (broadcastTarget === 'unpaid') {
      let msg = `📢 *${buildingName} — بقایا مینٹیننس الرٹ (${monthName})*\n`;
      msg += `--------------------------------------------------\n`;
      msg += `معزز رہائشی حضرات، السلام علیکم!\n`;
      msg += `ماہِ *${monthName}* کے بقایا جات درج ذیل ہیں (${includeNames ? 'تفصیلات کے ساتھ' : 'صرف فلیٹ نمبرز'}):\n\n`;

      if (activeUnpaid.length > 0) {
        if (includeNames) {
          activeUnpaid.forEach((item, idx) => {
            const arr = Number(item.arrears || item.due || 0);
            msg += `${idx + 1}. *فلیٹ ${item.flat}* (${formatResidentDisplayName(item)}): Rs. ${arr.toLocaleString('en-US')}\n`;
          });
          msg += `\n⚠️ *کُل زیرِ التواء بقایا رقم:* Rs. ${totalArrears.toLocaleString('en-US')}\n`;
        } else {
          activeUnpaid.forEach((item, idx) => {
            msg += `${idx + 1}. *فلیٹ ${item.flat}*\n`;
          });
          msg += `\n⚠️ *کُل زیرِ التواء فلیٹس:* ${activeUnpaid.length} فلیٹس\n`;
        }
      } else {
        msg += `✨ ماشاءاللہ تمام فلیٹس کی مینٹیننس کلیئر ہے!\n`;
      }

      msg += `--------------------------------------------------\n`;
      msg += `برائے مہربانی بقایا جات جلد از جلد ادا فرمائیں تاکہ بلڈنگ کے اخراجات میں رکاوٹ نہ آئے۔ شکریہ!\n_ایڈمن: حافظ محمد سعد_`;
      return msg;
    }

    // 3. General Building Announcement
    let msg = `📢 *${buildingName} — ماہانہ مینٹیننس اعلامیہ (${monthName})*\n`;
    msg += `--------------------------------------------------\n`;
    msg += `محترم تمام معزز رہائشی حضرات، السلام علیکم!\n\n`;
    msg += `ماہِ *${monthName}* کی ماہانہ مینٹیننس سلپس جاری کر دی گئی ہیں۔ برائے مہربانی تاریخ *${billDueDate}* سے قبل اپنی واجب الادا فیس جمع کروا کر رسید حاصل فرمائیں تاکہ بلڈنگ کی مشترکہ سہولیات (پانی موٹر، لفٹ سروس، جمعدار، کے الیکٹرک بل) بلا تعطل جاری رہ سکیں۔\n\n`;
    
    if (activeUnpaid.length > 0) {
      msg += `⚠️ *بقایا دار فلیٹس کی فہرست (${includeNames ? 'تفصیلات کے ساتھ' : 'صرف فلیٹ نمبرز'}):*\n`;
      if (includeNames) {
        activeUnpaid.forEach((item, idx) => {
          const arr = Number(item.arrears || item.due || 0);
          msg += `${idx + 1}. *فلیٹ ${item.flat}* (${formatResidentDisplayName(item)}): Rs. ${arr.toLocaleString('en-US')}\n`;
        });
        msg += `\n*کُل زیرِ التواء بقایا جات:* Rs. ${totalArrears.toLocaleString('en-US')}\n`;
      } else {
        activeUnpaid.forEach((item, idx) => {
          msg += `${idx + 1}. *فلیٹ ${item.flat}*\n`;
        });
        msg += `\n*کُل زیرِ التواء فلیٹس:* ${activeUnpaid.length} فلیٹس\n`;
      }
    } else {
      msg += `✨ تمام فلیٹس کے واجبات کلیئر ہیں۔ آپ سب کے تعاون کا بہت شکریہ!\n`;
    }

    if (includeSpecialFund && currentSpecialFund) {
      msg += `\n🛠️ *خصوصی پروجیکٹ فنڈ (${currentSpecialFund.name}):* براہ کرم پروجیکٹ کنٹری بیوشن بھی جلد جمع کروائیں۔\n`;
    }

    msg += `--------------------------------------------------\n`;
    msg += `ادائیگی نقد یا آن لائن بینکنگ سے ایڈمنسٹریٹر کے پاس جمع کروائی جا سکتی ہے۔\n\n`;
    msg += `والسلام،\n*بلڈنگ مینجمنٹ کمیٹی*\n_ایڈمن: حافظ محمد سعد_`;
    return msg;
  }, [flats, monthName, buildingName, billDueDate, includeSpecialFund, currentSpecialFund, broadcastTarget, broadcastDetailMode]);

  // Pre-made Circulars
  const buildingCirculars = [
    {
      id: 'water_supply',
      titleUrdu: 'پانی کی سپلائی اور ٹینکر کا نوٹس',
      titleRoman: 'Water Supply & Tanker Schedule Notice',
      icon: '💧',
      content: `📢 *ال مصطفیٰ ہائٹس — پانی کی سپلائی و راشننگ نوٹس*\n-----------------------------------\nمعزز رہائشی حضرات، لائن کا پانی کم آنے کی وجہ سے میٹھا پانی کا ٹینکر ڈلوایا گیا ہے۔ موٹر چلانے کے نئے اوقات درج ذیل ہیں:\n\n⏰ صبح: 06:30 AM تا 07:30 AM\n⏰ شام: 06:00 PM تا 07:00 PM\n\nبرائے مہربانی پانی احتیاط سے استعمال کریں اور نل کھلا نہ چھوڑیں۔ شکریہ!\n*انتظامیہ ال مصطفیٰ ہائٹس*`
    },
    {
      id: 'lift_service',
      titleUrdu: 'لفٹ کی ماہانہ سروس و مینٹیننس',
      titleRoman: 'Elevator Monthly Servicing & Maintenance Alert',
      icon: '🛗',
      content: `⚠️ *ال مصطفیٰ ہائٹس — لفٹ سروس کی پیشگی اطلاع*\n-----------------------------------\nتمام رہائشیوں کو مطلع کیا جاتا ہے کہ کل بروز ہفتہ بوقت 11:00 AM سے 02:00 PM تک لفٹ کمپنی کی جانب سے ماہانہ آئلنگ اور وائرنگ انسپکشن کی جائے گی۔\n\nاس دوران لفٹ سروس عارضی بند رہے گی۔ زحمت کے لیے معذرت خواہ ہیں۔\n*بلڈنگ مینجمنٹ کمیٹی*`
    },
    {
      id: 'garbage_timing',
      titleUrdu: 'کوڑا کرکٹ اٹھانے اور صفائی کے اوقات',
      titleRoman: 'Daily Waste Collection & Hygiene Advisory',
      icon: '🧹',
      content: `🧹 *صفائی نصف ایمان ہے — کوڑا کرکٹ کی پابندی*\n-----------------------------------\nرہائشی حضرات سے گزارش ہے کہ رات 10:00 بجے تک کوڑے کا شاپر فلیٹ کے باہر بند کر کے رکھیں۔ جمعدار روزانہ صبح 08:30 بجے کوڑا کلیکٹ کرتا ہے۔\n\nسیڑھیوں اور گلی میں کوڑا یا گندا پانی ہرگز نہ پھینکیں۔ عمارت کو صاف ستھرا رکھنا ہم سب کا فرض ہے۔\n*بلڈنگ کمیٹی — ال مصطفیٰ ہائٹس*`
    },
    {
      id: 'agm_meeting',
      titleUrdu: 'عمومی اجلاس اور سالانہ حساب کتاب (Meeting Notice)',
      titleRoman: 'General Body Emergency Meeting Notice',
      icon: '👥',
      content: `📢 *عمومی اجلاس برائے تمام رہائشی حضرات (Meeting Alert)*\n-----------------------------------\nعمارت کے ضروری معاملات، چھت کی واٹر پروفنگ اور سالانہ مالیاتی آڈٹ رپورٹ پیش کرنے کے لیے اتوار کی شام بعد نمازِ عشاء چھت / گراؤنڈ فلور پر میٹنگ رکھی گئی ہے۔\n\nتمام فلیٹ مالکان و رہائشی حضرات کی شرکت لازمی ہے۔\n*انتظامیہ ال مصطفیٰ ہائٹس*`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="erp-card-dark rounded-2xl p-5 sm:p-6 text-white border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {lang === 'ur' ? 'ماہانہ بل و واٹس ایپ سنٹر' : 'Monthly Bills & WhatsApp Center'}
                </h1>
                <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  {monthName}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {lang === 'ur'
                  ? 'تمام فلیٹس کے ڈیجیٹل مانگ بلز، پیپر سیور 4-in-1 پرنٹ، اور 1-کلک واٹس ایپ سلپس۔'
                  : 'Generate, print 4-in-1 paper-saver slips, and broadcast customized WhatsApp bills & circulars.'}
              </p>
            </div>
          </div>

          {/* Quick Month Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-slate-400">Month:</span>
              <select
                value={activeMonthKey}
                onChange={(e) => onSelectMonth && onSelectMonth(e.target.value)}
                className="bg-transparent font-semibold text-xs text-white focus:outline-none cursor-pointer"
              >
                {(monthOrder || []).map(mKey => (
                  <option key={mKey} value={mKey} className="bg-slate-900 text-white">
                    {allMonthsData[mKey]?.name || mKey}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsPaperSaverPrintOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition shadow-xs cursor-pointer"
            >
              <Scissors className="w-4 h-4 text-white" />
              <span>🖨️ Print 4-in-1 Paper-Saver Slips</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Total Registered Flats</span>
            <span className="text-lg font-bold font-mono text-white">{totalFlats} Flats</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Fully Cleared (Paid)</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{paidCount} Cleared</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Pending Bills (Baqaya)</span>
            <span className="text-lg font-bold font-mono text-rose-400">{unpaidCount} Pending</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Total Expected Demand</span>
            <span className="text-lg font-bold font-mono text-blue-300">Rs. {totalDemandAmount.toLocaleString('en-US')}</span>
          </div>
        </div>

        {/* Due Date & Grace Period Timeline Bar (Zero Surcharge) */}
        <div className={`mt-4 p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-xs ${timelineStatus.badgeClass}`}>
          <div className="flex items-center gap-2.5">
            <span className="text-lg">
              {timelineStatus.phase === 'normal' ? '📅' : timelineStatus.phase === 'grace' ? '⏳' : '🚨'}
            </span>
            <div>
              <p className="font-semibold flex items-center gap-2">
                <span>{timelineStatus.labelUrdu}</span>
                <span className="text-[11px] opacity-80 font-mono">({timelineStatus.labelRoman})</span>
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">
                {timelineStatus.advisoryUrdu} • <span className="font-semibold underline">کوئی لیٹ سرچارج عائد نہیں ہے (No Late Surcharge)</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${timelineStatus.pillClass}`}>
              {timelineStatus.shortBadge}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar max-w-full">
        <button
          onClick={() => setActiveTab('demand_slips')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeTab === 'demand_slips'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>🧾 {lang === 'ur' ? 'ماہانہ بل و مانگ سلپس' : 'Monthly Bills & Slips'}</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeTab === 'broadcast'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>📢 {lang === 'ur' ? 'واٹس ایپ گروپ براڈکاسٹ' : 'WhatsApp Broadcast Notice'}</span>
        </button>

        <button
          onClick={() => setActiveTab('circulars')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeTab === 'circulars'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>🔔 {lang === 'ur' ? 'ہنگامی اعلانات و سرکلرز' : 'Emergency Building Notices'}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: MONTHLY DEMAND SLIPS & INDIVIDUAL BILL CARDS      */}
      {/* ======================================================== */}
      {activeTab === 'demand_slips' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="erp-card rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search & Filter */}
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Flat ya naam talash karein..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-9 pe-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    filterStatus === 'all' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600'
                  }`}
                >
                  All ({totalFlats})
                </button>
                <button
                  onClick={() => setFilterStatus('unpaid')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    filterStatus === 'unpaid' ? 'bg-white text-rose-700 shadow-2xs font-black' : 'text-slate-600'
                  }`}
                >
                  Pending ({unpaidCount})
                </button>
                <button
                  onClick={() => setFilterStatus('paid')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    filterStatus === 'paid' ? 'bg-white text-emerald-700 shadow-2xs font-black' : 'text-slate-600'
                  }`}
                >
                  Cleared ({paidCount})
                </button>
              </div>
            </div>

            {/* Bill Parameters (Due Date & Special Fund toggle) */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-bold text-slate-600">Due Date:</span>
                <input
                  type="text"
                  value={billDueDate}
                  onChange={(e) => setBillDueDate(e.target.value)}
                  className="w-32 bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-800 focus:outline-none"
                  placeholder="10th of month"
                />
              </div>

              {specialFunds.length > 0 && (
                <label className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeSpecialFund}
                    onChange={(e) => setIncludeSpecialFund(e.target.checked)}
                    className="accent-amber-600 rounded cursor-pointer"
                  />
                  <span className="font-bold text-amber-900">+ Special Fund Due</span>
                </label>
              )}
            </div>
          </div>

          {/* 20 Flat Bills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFlats.map((flat) => {
              const due = Number(flat.due || 3000);
              const prior = Number(flat.priorArrears || (flat.arrears > flat.due ? flat.arrears - flat.due : 0));
              const paid = Number(flat.paid || 0);
              const remaining = Number(flat.arrears || 0);
              const isClosed = flat.status === 'closed';
              const isCleared = !isClosed && remaining === 0 && paid >= due;

              const sfAmount = currentSpecialFund ? (currentSpecialFund.flats?.find(sfFlat => sfFlat.flat === flat.flat)?.target || 0) : 0;
              const totalDue = isClosed ? 0 : (due + prior + sfAmount);

              return (
                <div
                  key={flat.flat || flat.sno}
                  className={`bg-white rounded-3xl p-4 border transition-all duration-200 shadow-xs flex flex-col justify-between ${
                    isClosed
                      ? 'border-slate-300 bg-slate-50/70 opacity-75'
                      : isCleared
                      ? 'border-emerald-300 hover:border-emerald-400 bg-emerald-50/20'
                      : 'border-slate-200 hover:border-blue-400 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Bill Header */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                            {flat.flat}
                          </span>
                          <div>
                            <h3 className="font-black text-sm text-slate-900 leading-tight">
                              {formatResidentDisplayName(flat)}
                            </h3>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {buildingName.split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isClosed
                          ? 'bg-slate-200 text-slate-700'
                          : isCleared
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {isClosed ? 'Band 🔒' : isCleared ? 'Cleared ✓' : 'Due ⚠️'}
                      </span>
                    </div>

                    {/* Breakdown Items */}
                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>ماہانہ فیس (Monthly Due):</span>
                        <span className="font-mono font-bold text-slate-900">Rs. {due.toLocaleString('en-US')}</span>
                      </div>

                      {prior > 0 && (
                        <div className="flex justify-between text-rose-600 bg-rose-50/60 px-1.5 py-0.5 rounded">
                          <span>سابقہ بقایا (Prior Arrears):</span>
                          <span className="font-mono font-black text-rose-700">+Rs. {prior.toLocaleString('en-US')}</span>
                        </div>
                      )}

                      {sfAmount > 0 && (
                        <div className="flex justify-between text-amber-700 bg-amber-50/80 px-1.5 py-0.5 rounded">
                          <span>خصوصی فنڈ ({currentSpecialFund?.name?.slice(0, 14)}..):</span>
                          <span className="font-mono font-black text-amber-800">+Rs. {sfAmount.toLocaleString('en-US')}</span>
                        </div>
                      )}

                      {/* Total Box */}
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                        <span className="font-black text-slate-800">کُل مانگ (Total Due):</span>
                        <span className="font-mono font-black text-base text-blue-950 bg-blue-50/80 px-2 py-0.5 rounded-lg border border-blue-200">
                          Rs. {totalDue.toLocaleString('en-US')}
                        </span>
                      </div>

                      {/* Already Paid Info */}
                      {paid > 0 && (
                        <div className="flex justify-between text-[11px] text-emerald-700 pt-1">
                          <span>وصول شدہ (Paid so far):</span>
                          <span className="font-mono font-bold text-emerald-800">Rs. {paid.toLocaleString('en-US')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5">
                    <button
                      onClick={() => handleSendPhasedWhatsApp(flat, timelineStatus.phase)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 transition shadow-xs cursor-pointer"
                      title={`Send WhatsApp Bill (${timelineStatus.shortBadge})`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => setSelectedFlatForModal(flat)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold p-1.5 rounded-xl text-xs transition cursor-pointer"
                      title="Generate Image (PNG) & Print Slip"
                    >
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                    </button>

                    <button
                      onClick={() => handleCopyBill(flat)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-1.5 rounded-xl text-xs transition cursor-pointer"
                      title="Copy Bill Message"
                    >
                      {copiedId === flat.sno ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => setSelectedFlatForModal(flat)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-1.5 rounded-xl text-xs transition cursor-pointer"
                      title="View & Print Single Bill"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: WHATSAPP GROUP BROADCAST DRAFTER                  */}
      {/* ======================================================== */}
      {activeTab === 'broadcast' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">
                📢 {lang === 'ur' ? 'بلڈنگ واٹس ایپ گروپ کے لیے مشترکہ اعلامیہ' : 'Monthly WhatsApp Broadcast Announcement'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ur'
                  ? 'باقیات، وصول شدہ یا عمومی اعلامیہ منتخب کریں — ناموں کے ساتھ یا صرف فلیٹ نمبرز کی پرائیویسی کے ساتھ۔'
                  : 'Select Unpaid, Paid, or General Circular — With resident names or privacy-protected flat numbers only.'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(groupBroadcastMessage);
                  if (onNotify) onNotify('Broadcast message copied to clipboard! 📋');
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Text</span>
              </button>

              <button
                onClick={() => {
                  const url = `https://wa.me/?text=${encodeURIComponent(groupBroadcastMessage)}`;
                  window.open(url, '_blank');
                  if (onNotify) onNotify('Opening WhatsApp with broadcast text... 💬');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm shadow-emerald-600/20 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Open WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Interactive Target & Format Switcher Controls */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            {/* Target Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Target:</span>
              <button
                onClick={() => setBroadcastTarget('unpaid')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  broadcastTarget === 'unpaid'
                    ? 'bg-rose-600 text-white shadow-xs font-black'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                ⚠️ Unpaid Only (صرف بقایا دار)
              </button>
              <button
                onClick={() => setBroadcastTarget('paid')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  broadcastTarget === 'paid'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                ✅ Paid Only (وصول شدہ)
              </button>
              <button
                onClick={() => setBroadcastTarget('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  broadcastTarget === 'all'
                    ? 'bg-blue-600 text-white shadow-xs font-black'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                📢 All (مکمل اعلامیہ)
              </button>
            </div>

            {/* Privacy / Detail Format Switcher */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Format:</span>
              <button
                onClick={() => setBroadcastDetailMode('with_details')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  broadcastDetailMode === 'with_details'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-300 font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📋 With Details (نام کے ساتھ)
              </button>
              <button
                onClick={() => setBroadcastDetailMode('only_flats')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  broadcastDetailMode === 'only_flats'
                    ? 'bg-amber-600 text-white shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🏢 Only Flat Names (صرف فلیٹ)
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              readOnly
              rows={16}
              value={groupBroadcastMessage}
              className="w-full font-mono text-xs leading-relaxed p-4 bg-slate-900 text-emerald-300 rounded-2xl border border-slate-800 shadow-inner focus:outline-none select-all"
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: EMERGENCY BUILDING CIRCULARS & NOTICES            */}
      {/* ======================================================== */}
      {activeTab === 'circulars' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {buildingCirculars.map((c) => (
            <div key={c.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="text-2xl">{c.icon}</span>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">{c.titleUrdu}</h3>
                    <p className="text-[11px] text-slate-500">{c.titleRoman}</p>
                  </div>
                </div>

                <div className="mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs text-slate-700 font-sans whitespace-pre-wrap leading-relaxed">
                  {c.content}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(c.content);
                    if (onNotify) onNotify(`${c.titleUrdu} copied to clipboard! 📋`);
                  }}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copy Notice</span>
                </button>

                <button
                  onClick={() => {
                    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(c.content)}`;
                    window.open(url, '_blank');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="Direct WhatsApp"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4-IN-1 PAPER-SAVER PRINT MODAL VIEW                      */}
      {/* ======================================================== */}
      {isPaperSaverPrintOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col justify-between overflow-y-auto p-4 sm:p-6">
          <div className="bg-white rounded-3xl max-w-5xl w-full mx-auto p-6 shadow-2xl relative my-auto">
            {/* Top Modal Controls */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-emerald-600" />
                  <span>🖨️ A4 Paper-Saver Print Layout (4 Slips Per Page)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ye layout A4 paper par 4 slips aik sath print karta hai taake paper bache aur aasani se cut kar ke baant saken.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Print Now (Ctrl+P)</span>
                </button>
                <button
                  onClick={() => setIsPaperSaverPrintOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content: 4 Slips Per Page Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {flats.map((flat, idx) => {
                const due = Number(flat.due || 3000);
                const prior = Number(flat.priorArrears || (flat.arrears > flat.due ? flat.arrears - flat.due : 0));
                const sfAmount = currentSpecialFund ? (currentSpecialFund.flats?.find(sfFlat => sfFlat.flat === flat.flat)?.target || 0) : 0;
                const totalDue = flat.status === 'closed' ? 0 : (due + prior + sfAmount);

                return (
                  <div
                    key={flat.flat || idx}
                    className="border-2 border-dashed border-slate-400 rounded-2xl p-4 bg-white relative flex flex-col justify-between"
                  >
                    {/* Header */}
                    <div>
                      <div className="text-center border-b border-slate-700 pb-2">
                        <h4 className="font-black text-sm text-slate-900 tracking-wider uppercase">
                          {buildingName}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-600">
                          ماہانہ مینٹیننس مانگ سلپ (MONTHLY DEMAND SLIP)
                        </p>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200 pb-1.5">
                        <span className="bg-slate-900 text-white px-2 py-0.5 rounded font-black">
                          فلیٹ: {flat.flat}
                        </span>
                        <span className="text-slate-900 font-black">
                          {formatResidentDisplayName(flat)}
                        </span>
                        <span className="text-[11px] text-blue-900 font-bold">
                          ماہ: {monthName}
                        </span>
                      </div>

                      {/* Items */}
                      <table className="w-full text-right text-[11px] mt-2 border-collapse">
                        <tbody>
                          <tr className="border-b border-slate-200">
                            <td className="py-1 text-slate-600">ماہانہ مینٹیننس فیس (Due):</td>
                            <td className="py-1 font-mono font-bold text-slate-900 text-left">Rs. {due.toLocaleString('en-US')}</td>
                          </tr>
                          {prior > 0 && (
                            <tr className="border-b border-slate-200 text-rose-700">
                              <td className="py-1">سابقہ بقایا جات (Prior Arrears):</td>
                              <td className="py-1 font-mono font-black text-left">+Rs. {prior.toLocaleString('en-US')}</td>
                            </tr>
                          )}
                          {sfAmount > 0 && (
                            <tr className="border-b border-slate-200 text-amber-800">
                              <td className="py-1">خصوصی فنڈ ({currentSpecialFund?.name?.slice(0, 16)}..):</td>
                              <td className="py-1 font-mono font-black text-left">+Rs. {sfAmount.toLocaleString('en-US')}</td>
                            </tr>
                          )}
                          <tr className="font-black text-slate-900 bg-slate-100">
                            <td className="py-1.5 px-1">کُل قابلِ ادائیگی رقم:</td>
                            <td className="py-1.5 px-1 font-mono text-sm text-blue-950 text-left">
                              Rs. {totalDue.toLocaleString('en-US')}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Footer Box */}
                    <div className="mt-3 pt-2 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-600 font-semibold">
                      <span>تاریخِ اجراء: {dateStr}</span>
                      <span>آخری تاریخ: {billDueDate}</span>
                      <span className="border-t border-slate-400 px-2 pt-0.5">دستخط ایڈمنسٹریٹر</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SINGLE BILL PREVIEW & PNG IMAGE GENERATOR MODAL          */}
      {/* ======================================================== */}
      {selectedFlatForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print-overlay">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative my-auto">
            <button
              onClick={() => setSelectedFlatForModal(null)}
              className="absolute top-4 end-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Visual Graphic Card Container for Image Export (Captured by html-to-image) */}
            <div
              ref={billCardRef}
              id="printable-bill-card"
              className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-xs space-y-3.5 text-slate-900"
            >
              {/* Card Header */}
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white mb-1.5 shadow-sm">
                  <Building2 className="w-5 h-5 text-amber-300" />
                </div>
                <h3 className="font-black text-base text-slate-900 tracking-wide uppercase">
                  {buildingName}
                </h3>
                <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mt-0.5">
                  ماہانہ مینٹیننس بل (OFFICIAL MAINTENANCE DEMAND SLIP)
                </p>
                <div className="inline-block mt-1.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-slate-300">
                  Bill Ref: AMH-{monthName.replace(/\s+/g, '').toUpperCase()}-{selectedFlatForModal.flat}
                </div>
              </div>

              {/* Resident & Flat Info Strip */}
              <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between items-center pb-1 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">فلیٹ نمبر (Flat No):</span>
                  <span className="font-black text-slate-900 text-sm font-mono bg-white px-2 py-0.5 rounded border border-slate-300">
                    Flat {selectedFlatForModal.flat}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">محترم رہائشی (Resident):</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {formatResidentDisplayName(selectedFlatForModal)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">بلنگ کا مہینہ (Billing Month):</span>
                  <span className="font-extrabold text-blue-900">{monthName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">تاریخِ اجراء (Issue Date):</span>
                  <span className="font-mono text-slate-700">{dateStr}</span>
                </div>
              </div>

              {/* Financial Itemized Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-700 py-0.5">
                  <span>ماہانہ مینٹیننس فیس (Monthly Maintenance Due):</span>
                  <span className="font-mono font-bold text-slate-900">
                    Rs. {Number(selectedFlatForModal.due || 3000).toLocaleString('en-US')}
                  </span>
                </div>

                {Number(selectedFlatForModal.priorArrears || 0) > 0 && (
                  <div className="flex justify-between items-center text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 font-bold">
                    <span>سابقہ بقایاجات (Prior Arrears):</span>
                    <span className="font-mono font-black text-rose-700">
                      +Rs. {Number(selectedFlatForModal.priorArrears).toLocaleString('en-US')}
                    </span>
                  </div>
                )}

                {/* Total Box */}
                <div className="mt-2 pt-2 border-t-2 border-slate-900 flex justify-between items-center bg-blue-50/80 p-2.5 rounded-xl border border-blue-200">
                  <span className="font-black text-slate-900 text-sm">کُل واجب الادا رقم (Total Payable):</span>
                  <span className="font-mono font-black text-lg text-blue-950">
                    Rs. {(Number(selectedFlatForModal.due || 3000) + Number(selectedFlatForModal.priorArrears || 0)).toLocaleString('en-US')}
                  </span>
                </div>
              </div>

              {/* Timeline & Due Date Note (No Surcharge) */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900 space-y-0.5">
                <p className="font-bold flex items-center justify-between">
                  <span>📅 آخری تاریخ: 10 تاریخ</span>
                  <span>⏳ رعایتی مہلت: 15 تاریخ تک</span>
                </p>
                <p className="text-[10px] text-slate-600">
                  * بروقت جمع کرائیں تاکہ پانی کی موٹر، لفٹ اور صفائی کی سروسز بلا تعطل جاری رہیں۔ (کوئی لیٹ فیس نہیں)
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span>انتظامیہ: <strong>حافظ محمد سعد</strong></span>
                <span className="border-t border-slate-400 px-3 pt-0.5 font-bold text-slate-700">
                  دستخط ایڈمنسٹریٹر
                </span>
              </div>
            </div>

            {/* Action Buttons Bar */}
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDownloadSlipImage(selectedFlatForModal)}
                  disabled={isExportingImage}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-blue-200" />
                  <span>{isExportingImage ? 'تصویر بن رہی ہے...' : '📸 تصویر ڈاؤن لوڈ کریں (PNG)'}</span>
                </button>

                <button
                  onClick={() => handleShareSlipImage(selectedFlatForModal)}
                  disabled={isExportingImage}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-purple-200" />
                  <span>📲 Share Image</span>
                </button>
              </div>

              {/* WhatsApp & Print Row */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSendPhasedWhatsApp(selectedFlatForModal, timelineStatus.phase)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Send className="w-4 h-4 text-emerald-200" />
                  <span>WhatsApp ({timelineStatus.phase === 'normal' ? 'معمول کا بل' : timelineStatus.phase === 'grace' ? 'گریس ریمائنڈر' : 'فائنل نوٹس'})</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-300" />
                  <span>پرنٹ کریں (Print)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

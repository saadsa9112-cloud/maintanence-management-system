import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Share2,
  Sparkles,
  Building2,
  Calendar,
  Wallet,
  TrendingUp,
  Receipt,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Printer
} from 'lucide-react';
import { toPng } from 'html-to-image';

export default function WhatsAppDigestModal({
  isOpen,
  onClose,
  monthName = 'October 2026',
  dateStr = '',
  buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19',
  flats = [],
  expenses = [],
  prevSavings = 0,
  lang = 'roman',
  onNotify
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const cardRef = useRef(null);

  if (!isOpen) return null;

  // Financial Calculations
  const safeFlats = (flats || []).filter(Boolean);
  const activeFlats = safeFlats.filter(f => f.status !== 'closed');
  const closedFlats = safeFlats.filter(f => f.status === 'closed');

  const totalCollected = activeFlats.reduce((acc, f) => acc + Number(f.paid || 0), 0);
  const totalDue = activeFlats.reduce((acc, f) => acc + Number(f.due || 3000), 0);
  const totalArrears = activeFlats.reduce((acc, f) => acc + Number(f.arrears || 0), 0);
  const totalExpenses = (expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const closingBalance = totalCollected + Number(prevSavings || 0) - totalExpenses;

  const paidFlats = activeFlats.filter(f => Number(f.paid || 0) >= Number(f.due || 0));
  const unpaidFlats = activeFlats.filter(f => Number(f.arrears || 0) > 0 || Number(f.paid || 0) < Number(f.due || 0));

  const collectionPercent = totalDue > 0 ? Math.min(100, Math.round((totalCollected / totalDue) * 100)) : 0;

  // Top 4 Expenses
  const topExpenses = [...(expenses || [])]
    .filter(e => Number(e.amount || 0) > 0)
    .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
    .slice(0, 4);

  // Generate PNG and Download
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      if (onNotify) onNotify('Generating high-resolution digest image... ⏳');
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2.5,
        backgroundColor: '#0f172a'
      });
      const link = document.createElement('a');
      const safeMonth = monthName.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `Al_Mustafa_Heights_Digest_${safeMonth}.png`;
      link.href = dataUrl;
      link.click();
      if (onNotify) onNotify('WhatsApp Digest Image downloaded successfully! 🖼️✓');
    } catch (err) {
      console.error('Failed to generate image:', err);
      if (onNotify) onNotify('Error generating image. You can copy text summary instead.');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopyImageToClipboard = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2.5,
        backgroundColor: '#0f172a'
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopiedImage(true);
      if (onNotify) onNotify('Image copied to clipboard! Paste directly in WhatsApp (Ctrl+V) 📋✓');
      setTimeout(() => setCopiedImage(false), 3000);
    } catch (err) {
      console.error('Failed to copy image blob:', err);
      // Fallback: download image
      handleDownloadImage();
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Formatted WhatsApp Text Caption
  const handleCopyTextCaption = () => {
    let msg = `📢 *${buildingName} — MONTHLY MAINTENANCE DIGEST*\n`;
    msg += `🗓️ *Period:* ${monthName} | *Date:* ${dateStr || new Date().toLocaleDateString('en-GB')}\n`;
    msg += `------------------------------------\n`;
    msg += `💰 *Total Collections (MR):* Rs. ${totalCollected.toLocaleString('en-US')} (${collectionPercent}% Recovery)\n`;
    msg += `🧾 *Total Building Expenses:* Rs. ${totalExpenses.toLocaleString('en-US')}\n`;
    msg += `🏦 *Opening Cash (Pichli Bachat):* Rs. ${Number(prevSavings).toLocaleString('en-US')}\n`;
    msg += `💵 *Net Closing Cash in Hand:* Rs. ${closingBalance.toLocaleString('en-US')}\n`;
    msg += `------------------------------------\n`;
    msg += `✅ *Cleared Flats (${paidFlats.length}/${activeFlats.length}):* ${paidFlats.map(f => f.flat).join(', ')}\n`;
    if (unpaidFlats.length > 0) {
      msg += `⚠️ *Pending Arrears (${unpaidFlats.length} Flats):* Rs. ${totalArrears.toLocaleString('en-US')}\n`;
    }
    if (customNote.trim()) {
      msg += `\n📌 *Committee Note:* ${customNote.trim()}\n`;
    }
    msg += `\nJazakAllah Khair for timely contributions!\n`;
    msg += `— *Maintenance Managed by: Hafiz Muhammad Saad*`;

    navigator.clipboard.writeText(msg);
    setCopiedText(true);
    if (onNotify) onNotify('WhatsApp text digest copied to clipboard! 📋✓');
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in no-print-overlay overflow-y-auto">
      <div className="backdrop-blur-2xl bg-white/95 rounded-3xl border border-white/80 shadow-[0_20px_60px_rgba(0,0,0,0.35)] max-w-2xl w-full p-5 sm:p-6 text-slate-900 relative space-y-4 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <span>WhatsApp Group Digest Infographic</span>
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  Image Generator
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {monthName} — High-resolution summary card for building WhatsApp group
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Optional Committee Note Input */}
        <div className="shrink-0 flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
          <span className="font-bold text-slate-700 shrink-0">Add Note:</span>
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="e.g. Tanker expense included this month, lift servicing scheduled..."
            className="flex-1 bg-white px-2.5 py-1 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-emerald-600"
          />
        </div>

        {/* Card Preview Area (Scrollable) */}
        <div className="overflow-y-auto flex-1 p-1 flex justify-center">
          {/* THE INFOGRAPHIC CARD DOM ELEMENT CAPTURED BY HTML-TO-IMAGE */}
          <div
            ref={cardRef}
            className="w-full max-w-[500px] rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6 space-y-4 font-sans select-none"
            style={{ minHeight: '620px' }}
          >
            {/* Header / Brand */}
            <div className="text-center pb-3 border-b border-slate-800/80">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-black tracking-widest uppercase mb-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Monthly Accounts Digest</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white uppercase drop-shadow-sm">
                {buildingName}
              </h2>
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 mt-0.5">
                <span className="text-blue-400 font-bold">{monthName}</span>
                <span>•</span>
                <span>Issue Date: {dateStr || new Date().toLocaleDateString('en-GB')}</span>
              </div>
            </div>

            {/* 4 Core Financial KPI Blocks */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Total Collections */}
              <div className="bg-slate-900/90 rounded-2xl p-3 border border-emerald-500/30 shadow-inner">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 block">
                  💰 Kul Wusooli (MR)
                </span>
                <span className="text-base sm:text-lg font-black text-white font-mono block mt-0.5">
                  Rs. {totalCollected.toLocaleString('en-US')}
                </span>
                <span className="text-[10px] text-emerald-300 font-bold block mt-0.5">
                  {collectionPercent}% Target Achieved
                </span>
              </div>

              {/* Total Expenses */}
              <div className="bg-slate-900/90 rounded-2xl p-3 border border-rose-500/30 shadow-inner">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-rose-400 block">
                  🧾 Kul Ikhrajat
                </span>
                <span className="text-base sm:text-lg font-black text-white font-mono block mt-0.5">
                  Rs. {totalExpenses.toLocaleString('en-US')}
                </span>
                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                  {(expenses || []).length} Expense Heads
                </span>
              </div>

              {/* Opening Cash */}
              <div className="bg-slate-900/90 rounded-2xl p-3 border border-indigo-500/30 shadow-inner">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-300 block">
                  🏦 Pichli Bachat (Open)
                </span>
                <span className="text-base sm:text-lg font-black text-white font-mono block mt-0.5">
                  Rs. {Number(prevSavings).toLocaleString('en-US')}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                  Carried Forward
                </span>
              </div>

              {/* Net Closing Balance */}
              <div className="bg-gradient-to-br from-blue-950/80 to-indigo-900/80 rounded-2xl p-3 border border-blue-400/50 shadow-inner">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-300 block">
                  💵 Khatmi Bachat (Cash)
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-400 font-mono block mt-0.5">
                  Rs. {closingBalance.toLocaleString('en-US')}
                </span>
                <span className="text-[10px] text-blue-200 font-bold block mt-0.5">
                  Reserve in Hand
                </span>
              </div>
            </div>

            {/* Collection Progress Bar */}
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-300">Flats Recovery Status:</span>
                <span className="text-emerald-400 font-mono font-black">
                  {paidFlats.length} of {activeFlats.length} Flats Cleared ({collectionPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${collectionPercent}%` }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Top Expenses Breakdown */}
            {topExpenses.length > 0 && (
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/90 space-y-1.5">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  ⚡ Major Monthly Expenses:
                </span>
                <div className="space-y-1">
                  {topExpenses.map(e => (
                    <div key={e.id} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium truncate max-w-[220px]">
                        • {e.desc}
                      </span>
                      <span className="font-mono font-black text-rose-300">
                        Rs. {Number(e.amount).toLocaleString('en-US')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Committee Note if provided */}
            {customNote.trim() && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-xs text-amber-200">
                <span className="font-black text-amber-300">Notice: </span>
                <span>{customNote.trim()}</span>
              </div>
            )}

            {/* Footer with Verification & Hafiz Saad Attribution */}
            <div className="pt-2 border-t border-slate-800/90 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-300">Audited & Verified</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Maintenance Managed by:</span>
                <span className="font-black text-white text-xs">Hafiz Muhammad Saad</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 shrink-0">
          <button
            onClick={handleCopyTextCaption}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedText ? 'Text Copied!' : 'Copy Text Caption'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyImageToClipboard}
              disabled={isExporting}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {copiedImage ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedImage ? 'Image Copied! (Ctrl+V)' : 'Copy Image to Clipboard'}</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download Image (PNG)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

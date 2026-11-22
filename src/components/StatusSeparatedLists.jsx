import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, MessageCircle, Copy, Check, Users } from 'lucide-react';
import { openGroupWhatsApp, buildShortGroupWhatsAppMessage } from '../utils/whatsapp';
import { formatResidentDisplayName } from '../utils/residentUtils';

export default function StatusSeparatedLists({
  flats,
  monthName,
  buildingName,
  onNotify
}) {
  const [activeTab, setActiveTab] = useState('unpaid'); // 'unpaid' or 'paid'
  const [copied, setCopied] = useState(false);

  // Separate Paid and Unpaid
  const paidFlats = flats.filter(f => f.status === 'paid' && Number(f.paid) > 0);
  const unpaidFlats = flats.filter(f => {
    return f.status === 'closed' || f.status === 'arrears' || Number(f.arrears) > 0 || Number(f.paid) < Number(f.due);
  });

  const totalPaidAmount = paidFlats.reduce((sum, f) => sum + Number(f.paid || 0), 0);
  const totalArrearsAmount = unpaidFlats.reduce((sum, f) => {
    return sum + (f.status !== 'closed' ? Number(f.arrears || (f.due - f.paid) || 0) : 0);
  }, 0);

  const shortMessage = buildShortGroupWhatsAppMessage(monthName, unpaidFlats, totalArrearsAmount, buildingName);

  const handleCopy = () => {
    navigator.clipboard.writeText(shortMessage).then(() => {
      setCopied(true);
      if (onNotify) onNotify('واٹس ایپ گروپ کا مختصر میسج کاپی ہو گیا! 📋');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSendGroup = () => {
    openGroupWhatsApp(monthName, unpaidFlats, totalArrearsAmount, buildingName);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Switcher Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-2">
        {/* Unpaid Tab */}
        <button
          onClick={() => setActiveTab('unpaid')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
            activeTab === 'unpaid'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-rose-800 hover:bg-rose-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>جن کے وصول نہیں ہوئے (بقایا داران)</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-black ${activeTab === 'unpaid' ? 'bg-white text-rose-700' : 'bg-rose-200 text-rose-900'}`}>
            {unpaidFlats.length} فلیٹس
          </span>
        </button>

        {/* Paid Tab */}
        <button
          onClick={() => setActiveTab('paid')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
            activeTab === 'paid'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-emerald-800 hover:bg-emerald-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>وصول شدہ فلیٹس (مکمل ادا)</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-black ${activeTab === 'paid' ? 'bg-white text-emerald-700' : 'bg-emerald-200 text-emerald-900'}`}>
            {paidFlats.length} فلیٹس
          </span>
        </button>
      </div>

      {/* TAB CONTENT: UNPAID (جن کے وصول نہیں ہوئے) */}
      {activeTab === 'unpaid' && (
        <div className="p-4 sm:p-5 bg-gradient-to-br from-rose-50/60 to-orange-50/40 space-y-4">
          {/* Header & WhatsApp Action */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs">
            <div>
              <h3 className="font-black text-rose-950 text-sm sm:text-base flex items-center gap-2">
                <span>⚠️</span>
                <span>بلڈنگ واٹس ایپ گروپ کے لیے ایک ساتھ مختصر میسج:</span>
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                الگ الگ میسج نہیں، تمام بقایا داران کا ایک ساتھ مختصر اور جامع میسج تیار ہے:
              </p>
            </div>

            {/* Combined Group Action Buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={handleSendGroup}
                className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>پورے گروپ میں بھیجیں</span>
              </button>

              <button
                onClick={handleCopy}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl border border-slate-300 text-xs sm:text-sm flex items-center justify-center gap-1.5 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'کاپی ہو گئی ✓' : 'کاپی میسج'}</span>
              </button>
            </div>
          </div>

          {/* Unpaid Flats Cards Grid */}
          {unpaidFlats.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-emerald-300 shadow-xs">
              <span className="text-4xl">🎉</span>
              <h4 className="font-black text-emerald-800 text-lg mt-2">ماشاءاللہ! تمام فلیٹس کے واجبات کلیئر ہیں۔</h4>
              <p className="text-xs text-emerald-600 mt-1">کوئی بقایا دار باقی نہیں ہے۔</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {unpaidFlats.map((flat) => {
                const isClosed = flat.status === 'closed';
                const arr = Number(flat.arrears || (flat.due - flat.paid) || 0);

                return (
                  <div
                    key={flat.sno}
                    className={`rounded-xl p-3 border-2 shadow-xs flex flex-col justify-between transition ${
                      isClosed
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-white border-rose-300 hover:border-rose-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="bg-slate-900 text-white text-xs font-black px-2 py-0.5 rounded-md" dir="ltr">
                          {flat.flat}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${isClosed ? 'bg-amber-200 text-amber-900' : 'bg-rose-100 text-rose-800'}`}>
                          {isClosed ? 'گھر بند' : 'بقایا'}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800 text-xs truncate">
                        {formatResidentDisplayName(flat) || 'نامعلوم'}
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">واجب:</span>
                      <span className="font-black text-rose-700">
                        {isClosed ? 'گھر بند' : `Rs. ${arr.toLocaleString('en-US')}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Total Footer */}
          <div className="bg-white p-3 rounded-xl border border-rose-200 flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-slate-700">
              کل غیر وصول شدہ فلیٹس: <b className="text-rose-700 font-black">{unpaidFlats.length}</b>
            </span>
            <span className="text-rose-700">
              مجموعی بقایا رقم: <b className="text-rose-900 font-black text-base">Rs. {Number(totalArrearsAmount).toLocaleString('en-US')}</b>
            </span>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PAID (وصول شدہ فلیٹس) */}
      {activeTab === 'paid' && (
        <div className="p-4 sm:p-5 bg-emerald-50/40 space-y-4">
          <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-black text-emerald-950 text-sm sm:text-base flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>وصول شدہ فلیٹس کا ریکارڈ (Paid Flats):</span>
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                جن فلیٹس کے فنڈز کامیابی سے موصول ہو چکے ہیں:
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-900 font-black text-xs sm:text-sm px-3 py-1 rounded-full">
              کل وصولی: Rs. {Number(totalPaidAmount).toLocaleString('en-US')}
            </span>
          </div>

          {paidFlats.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
              ابھی تک اس مہینے کسی فلیٹ کی وصولی درج نہیں کی گئی۔
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {paidFlats.map((flat) => (
                <div
                  key={flat.sno}
                  className="bg-white border-2 border-emerald-300 rounded-xl p-3 shadow-xs flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="bg-emerald-700 text-white text-xs font-black px-2 py-0.5 rounded-md" dir="ltr">
                        {flat.flat}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                        مکمل ادا ✓
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 text-xs truncate">
                      {formatResidentDisplayName(flat) || 'نامعلوم'}
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">موصولہ رقم:</span>
                    <span className="font-black text-emerald-700">
                      Rs. {Number(flat.paid || 0).toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-slate-700">
              کل وصول شدہ فلیٹس: <b className="text-emerald-700 font-black">{paidFlats.length}</b>
            </span>
            <span className="text-emerald-800">
              مجموعی وصول شدہ رقم: <b className="text-emerald-950 font-black text-base">Rs. {Number(totalPaidAmount).toLocaleString('en-US')}</b>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

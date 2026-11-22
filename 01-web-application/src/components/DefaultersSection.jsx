import React from 'react';
import { AlertCircle, MessageCircle, Copy, Check } from 'lucide-react';
import { openGroupWhatsApp, openIndividualWhatsApp, buildGroupWhatsAppMessage } from '../utils/whatsapp';
import { formatResidentDisplayName } from '../utils/residentUtils';

export default function DefaultersSection({ flats, monthName, buildingName, onQuickPay, onNotify }) {
  const [copied, setCopied] = React.useState(false);

  const defaulters = flats.filter(f => {
    return f.status === 'closed' || f.status === 'arrears' || Number(f.arrears) > 0 || Number(f.paid) < Number(f.due);
  });

  const totalArrears = defaulters.reduce((acc, f) => {
    return acc + (f.status !== 'closed' ? Number(f.arrears || 0) : 0);
  }, 0);

  const handleCopy = () => {
    const text = buildGroupWhatsAppMessage(monthName, defaulters, totalArrears, buildingName);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      if (onNotify) onNotify('واٹس ایپ لسٹ کاپی ہو گئی! 📋');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSendGroup = () => {
    openGroupWhatsApp(monthName, defaulters, totalArrears, buildingName);
  };

  return (
    <div className="bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-rose-200 pb-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-rose-950 flex items-center gap-2">
            <span className="bg-rose-600 text-white p-1 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4" />
            </span>
            <span>غیر وصول شدہ و بقایا داران کی فہرست (Defaulters List)</span>
            <span className="bg-rose-200 text-rose-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {defaulters.length} فلیٹس
            </span>
          </h3>
          <p className="text-xs text-rose-700 mt-0.5">
            جن فلیٹس کی ماہانہ مینٹیننس ابھی تک باقی ہے ان کی الگ لسٹ اور واٹس ایپ نوٹس:
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Send to Group */}
          <button
            onClick={handleSendGroup}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            <span>پورے گروپ میں لسٹ بھیجیں</span>
          </button>

          {/* Copy list */}
          <button
            onClick={handleCopy}
            className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-3 rounded-xl border border-slate-300 text-xs sm:text-sm flex items-center gap-1.5 transition shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'کاپی ہو گئی ✓' : 'کاپی کریں'}</span>
          </button>
        </div>
      </div>

      {/* Defaulter Cards */}
      {defaulters.length === 0 ? (
        <div className="p-6 text-center bg-white rounded-xl border border-emerald-200">
          <span className="text-3xl">🎉</span>
          <p className="font-black text-emerald-800 text-base mt-1">ماشاءاللہ! تمام فلیٹس کے واجبات کلیئر ہیں۔</p>
          <p className="text-xs text-emerald-600">اس مہینے کوئی بقایا رقم باقی نہیں ہے۔</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {defaulters.map((flat) => {
            const isClosed = flat.status === 'closed';

            return (
              <div
                key={flat.sno}
                className={`rounded-xl p-3 shadow-xs space-y-2 transition ${
                  isClosed
                    ? 'bg-amber-100/70 border border-amber-300'
                    : 'bg-white border-2 border-rose-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-slate-900 text-sm">{flat.flat}</span>
                    <span className="font-bold text-slate-800 text-sm mr-1.5">{formatResidentDisplayName(flat) || 'نامعلوم'}</span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isClosed ? 'bg-amber-200 text-amber-900' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isClosed ? '🔒 گھر بند' : 'بقایا دار'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500">بقایا واجب الادا:</span>
                  <span className="font-black text-rose-700 text-sm">
                    {isClosed ? 'گھر بند' : `Rs. ${Number(flat.arrears || 0).toLocaleString('en-US')}`}
                  </span>
                </div>

                {!isClosed ? (
                  <div className="pt-1 flex gap-1.5">
                    <button
                      onClick={() => openIndividualWhatsApp(flat, monthName, buildingName)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-center text-xs font-bold py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>واٹس ایپ</span>
                    </button>
                    {onQuickPay && (
                      <button
                        onClick={() => onQuickPay(flat.sno)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-2.5 rounded-lg transition"
                        title="مکمل وصولی درج کریں"
                      >
                        ✓ وصول
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="pt-1 text-center text-[11px] text-amber-800 font-bold">
                    گھر بند ہے (مینٹیننس لاگو نہیں)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Footer */}
      <div className="bg-white/90 p-3 rounded-xl border border-rose-200 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
        <span className="font-bold text-slate-700">کل غیر وصول شدہ / بقایا واجبات:</span>
        <span className="font-black text-rose-700 text-base sm:text-lg">
          Rs. {Number(totalArrears).toLocaleString('en-US')}
        </span>
      </div>
    </div>
  );
}

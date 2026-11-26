import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  TrendingDown,
  ShieldAlert,
  Sparkles,
  Calculator,
  Lock,
  ChevronRight,
  FileText,
  Check
} from 'lucide-react';

export default function FinancialClashModal({
  isOpen,
  onClose,
  clashesReport,
  activeMonthKey,
  onResolveFlatClash,
  onResolveChainClash,
  onSaveAdjustmentNote,
  onNavigateToAuditLog,
  lang = 'roman'
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'flats', 'chain', 'budget'
  const [editingNotes, setEditingNotes] = useState({});
  const [notesDraft, setNotesDraft] = useState({});

  if (!isOpen || !clashesReport) return null;

  const {
    flatClashes = [],
    activeChainClashes = [],
    budgetClashes = [],
    totalCount = 0
  } = clashesReport;

  const filteredFlats = flatClashes;
  const filteredChain = activeChainClashes;
  const filteredBudget = budgetClashes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fade-in no-print-overlay overflow-y-auto">
      <div className="backdrop-blur-2xl bg-white/95 rounded-2xl sm:rounded-3xl border border-rose-200/80 shadow-[0_25px_60px_rgba(225,29,72,0.2)] max-w-3xl w-full p-4 sm:p-7 text-slate-900 relative space-y-4 max-h-[92vh] flex flex-col my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-600/15 text-rose-600 flex items-center justify-center font-black shadow-inner">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg sm:text-xl text-rose-950">
                  {lang === 'ur'
                    ? 'مالیاتی تضادات و آڈٹ الرٹ (Discrepancy Inspector)'
                    : 'Financial Clashes & Audit Inspector'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                  {totalCount} {lang === 'ur' ? 'تضاد' : 'Clash'}{totalCount > 1 ? 'es' : ''}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Mah-e-<strong>{activeMonthKey}</strong> — System ne auto-correct nahi kiya! Har masla tafseel se neechay darj hai.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-950">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-extrabold text-[13px] text-amber-900">
              💡 Zero Silent Auto-Correction Policy:
            </p>
            <p className="leading-relaxed text-amber-900/90">
              Aapka darj karda koi bhi hisab ya balance system ne khud se tabdeel nahi kiya. Jahan bhi hisab clash kar raha hai, wahan ye <strong>Error Badge ⚠️</strong> show kar raha hai taake aap khud faisla kar sakein.
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Kul Tamam</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {totalCount}
            </span>
          </button>
          {flatClashes.length > 0 && (
            <button
              onClick={() => setActiveTab('flats')}
              className={`px-3 py-1.5 rounded-xl font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'flats'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Flats / Maintenance</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {flatClashes.length}
              </span>
            </button>
          )}
          {activeChainClashes.length > 0 && (
            <button
              onClick={() => setActiveTab('chain')}
              className={`px-3 py-1.5 rounded-xl font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'chain'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Mahana Opening Bachat</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {activeChainClashes.length}
              </span>
            </button>
          )}
          {budgetClashes.length > 0 && (
            <button
              onClick={() => setActiveTab('budget')}
              className={`px-3 py-1.5 rounded-xl font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'budget'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Cash Deficit / Kharcha</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {budgetClashes.length}
              </span>
            </button>
          )}
        </div>

        {/* Scrollable Clash List */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {totalCount === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="font-black text-emerald-900 text-base">
                Zabardast! Koi Clash Ya Tazaad Mojood Nahi Hai!
              </p>
              <p className="text-xs text-emerald-800/80">
                Tamam flats ki maintenance, baqaya jat aur pichli bachat 100% reconciled aur mutabiq hain.
              </p>
            </div>
          ) : (
            <>
              {/* Flat Clashes */}
              {(activeTab === 'all' || activeTab === 'flats') &&
                filteredFlats.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl border border-rose-200/90 bg-rose-50/40 hover:bg-rose-50/70 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-rose-600 text-white">
                          {c.flatNo}
                        </span>
                        <span className="font-black text-sm text-slate-900">
                          {c.name}
                        </span>
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200">
                          {c.title}
                        </span>
                        {c.hasAdjustmentNote && (
                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>باقاعدہ نوٹ درج ہے (Documented)</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-black text-rose-700 bg-rose-100/90 px-2.5 py-1 rounded-full shrink-0">
                        Farq: Rs. {Math.abs(c.diff).toLocaleString('en-US')}
                      </span>
                    </div>

                    {/* Breakdown Math Box */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white/90 p-2.5 rounded-xl border border-rose-200/70 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">
                          Total Wajib (Expected):
                        </span>
                        <span className="font-black text-slate-800 text-sm">
                          Rs. {Number(c.expected || 0).toLocaleString('en-US')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">
                          Darj Shuda (Actual Input):
                        </span>
                        <span className="font-black text-rose-700 text-sm">
                          Rs. {Number(c.actual || 0).toLocaleString('en-US')}
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-400 font-bold block">
                          Tazaad / Farq:
                        </span>
                        <span className={`font-black text-sm ${c.diff > 0 ? 'text-amber-700' : 'text-rose-700'}`}>
                          {c.diff > 0 ? `+Rs. ${c.diff.toLocaleString('en-US')} (Ziada)` : `-Rs. ${Math.abs(c.diff).toLocaleString('en-US')} (Ghaib / Kami)`}
                        </span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="text-xs text-slate-700 leading-relaxed bg-rose-100/40 p-2.5 rounded-xl border border-rose-200/50">
                      <p className="font-medium">{c.messageRoman}</p>
                      <p className="text-[11px] text-slate-600 mt-1 font-sans">{c.messageUrdu}</p>
                    </div>

                    {/* Adjustment Note & Generalization Customizer Section */}
                    <div className="bg-white/95 rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span>ایڈجسٹمنٹ و وضاحتی نوٹ (Adjustment Note & Custom Reason):</span>
                        </div>
                        {c.hasAdjustmentNote ? (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>تسلیم شدہ ایڈجسٹمنٹ (Audit Justified)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            Optional Note
                          </span>
                        )}
                      </div>

                      {/* Display saved note if present and not currently editing */}
                      {c.adjustmentNote && !editingNotes[c.sno] ? (
                        <div className="bg-blue-50/80 border border-blue-200/90 rounded-xl p-3 text-xs text-blue-950 flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-blue-700 uppercase tracking-wide flex items-center gap-1">
                              <span>📝 محفوظ شدہ وضاحتی نوٹ (Saved Reason):</span>
                            </span>
                            <p className="font-semibold text-slate-900 leading-relaxed text-xs">
                              "{c.adjustmentNote}"
                            </p>
                            <p className="text-[10px] text-blue-700/80 italic">
                              Is wazahat ki wajah se ye raqam system audit mein legitimate tasleem ki gayi hai.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNotes(prev => ({ ...prev, [c.sno]: true }));
                              setNotesDraft(prev => ({ ...prev, [c.sno]: c.adjustmentNote }));
                            }}
                            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs shrink-0 cursor-pointer"
                          >
                            Edit Note
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            اگر یہ ادائیگی کسی کام (مثلاً گٹر کا کام 700، الیکٹریشن 500، یا پیشگی ادائیگی وغیرہ) میں ایڈجسٹ ہوئی ہے، تو نیچے نوٹ لکھ کر تصدیق کریں:
                          </p>

                          <textarea
                            rows={2}
                            value={notesDraft[c.sno] !== undefined ? notesDraft[c.sno] : (c.adjustmentNote || '')}
                            onChange={(e) => setNotesDraft(prev => ({ ...prev, [c.sno]: e.target.value }))}
                            placeholder="مثال: گٹر کا کام 700 کا ہوا اور الیکٹریشن کا 500، رہائشی نے 1000 دیے تو 200 روپے ایڈجسٹ کر کے اب 300 باقی رہ گئے..."
                            className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white resize-none"
                          />

                          {/* Quick 1-Click Preset Chips */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-400">⚡ تیار شدہ وجوہات (Presets):</span>
                            {[
                              'گٹر و پلمبنگ کے کام میں رقم ایڈجسٹ ہوئی',
                              'الیکٹریشن و سامان مرمت کی مد میں کٹوتی',
                              'پیشگی ادائیگی / باہمی طے شدہ رعایت',
                              'عمارت کے ہنگامی کام پر رہائشی کا خرچہ ہوا'
                            ].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  const current = notesDraft[c.sno] || '';
                                  const newText = current ? `${current} | ${preset}` : preset;
                                  setNotesDraft(prev => ({ ...prev, [c.sno]: newText }));
                                }}
                                className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 border border-slate-200 transition cursor-pointer"
                              >
                                + {preset}
                              </button>
                            ))}
                          </div>

                          {/* Action Buttons for Note */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            {c.adjustmentNote && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSaveAdjustmentNote) onSaveAdjustmentNote(c.sno, '');
                                  setEditingNotes(prev => ({ ...prev, [c.sno]: false }));
                                  setNotesDraft(prev => ({ ...prev, [c.sno]: '' }));
                                }}
                                className="px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                              >
                                نوٹ ختم کریں (Clear)
                              </button>
                            )}
                            {editingNotes[c.sno] && (
                              <button
                                type="button"
                                onClick={() => setEditingNotes(prev => ({ ...prev, [c.sno]: false }))}
                                className="px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const noteVal = notesDraft[c.sno] !== undefined ? notesDraft[c.sno] : (c.adjustmentNote || '');
                                if (onSaveAdjustmentNote) {
                                  onSaveAdjustmentNote(c.sno, noteVal.trim());
                                }
                                setEditingNotes(prev => ({ ...prev, [c.sno]: false }));
                              }}
                              className="px-3.5 py-1.5 rounded-xl font-black text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save Adjustment Note (نوٹ محفوظ کریں)</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[11px] text-slate-400 italic">
                        Yeh auto-change nahi hoga jab tak aap khud select na karein.
                      </span>
                      <div className="flex items-center gap-2">
                        {onResolveFlatClash && c.recommendedArrears !== undefined && (
                          <button
                            onClick={() => onResolveFlatClash(c.sno, 'arrears', c.recommendedArrears)}
                            className="px-3 py-1.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition cursor-pointer flex items-center gap-1"
                            title="Set Baqaya exactly to expected liability minus paid"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Baqaya Rs. {c.recommendedArrears.toLocaleString('en-US')} Karein</span>
                          </button>
                        )}
                        {onResolveFlatClash && c.recommendedPrior !== undefined && (
                          <button
                            onClick={() => onResolveFlatClash(c.sno, 'priorArrears', c.recommendedPrior)}
                            className="px-3 py-1.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition cursor-pointer flex items-center gap-1"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Prior Rs. {c.recommendedPrior.toLocaleString('en-US')} Set Karein</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              {/* Chain / Month Opening Clashes */}
              {(activeTab === 'all' || activeTab === 'chain') &&
                filteredChain.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl border border-amber-300/90 bg-amber-50/50 hover:bg-amber-50/70 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-amber-600 text-white">
                          {c.prevMonthKey} ➔ {c.nextMonthKey}
                        </span>
                        <span className="font-black text-sm text-slate-900">
                          {c.title}
                        </span>
                      </div>
                      <span className="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full shrink-0">
                        Discrepancy: Rs. {Math.abs(c.diff).toLocaleString('en-US')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white/90 p-2.5 rounded-xl border border-amber-200/70 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">
                          {c.prevMonthKey} Closing Bachat:
                        </span>
                        <span className="font-black text-slate-800 text-sm">
                          Rs. {Number(c.expected || 0).toLocaleString('en-US')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">
                          {c.nextMonthKey} Darj Shuda Opening:
                        </span>
                        <span className="font-black text-amber-700 text-sm">
                          Rs. {Number(c.actual || 0).toLocaleString('en-US')}
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-400 font-bold block">
                          Farq:
                        </span>
                        <span className="font-black text-sm text-amber-800">
                          Rs. {Math.abs(c.diff).toLocaleString('en-US')}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 leading-relaxed bg-amber-100/50 p-2.5 rounded-xl border border-amber-200/60">
                      <p className="font-medium">{c.messageRoman}</p>
                      <p className="text-[11px] text-slate-600 mt-1 font-sans">{c.messageUrdu}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[11px] text-slate-400 italic">
                        Aap dono mahinon ka balance alag alag bhi rakh sakte hain.
                      </span>
                      {onResolveChainClash && (
                        <button
                          onClick={() => onResolveChainClash(c.nextMonthKey, c.recommendedOpening)}
                          className="px-3 py-1.5 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{c.nextMonthKey} Ko Rs. {c.recommendedOpening.toLocaleString('en-US')} Par Set Karein</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

              {/* Budget / Cash Deficit Clashes */}
              {(activeTab === 'all' || activeTab === 'budget') &&
                filteredBudget.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl border border-rose-200/90 bg-rose-50/40 hover:bg-rose-50/70 transition space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs px-2.5 py-1 rounded-lg bg-rose-700 text-white">
                        DEFICIT
                      </span>
                      <span className="font-black text-sm text-slate-900">
                        {c.title}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 leading-relaxed bg-rose-100/40 p-2.5 rounded-xl border border-rose-200/50">
                      <p className="font-medium">{c.messageRoman}</p>
                      <p className="text-[11px] text-slate-600 mt-1 font-sans">{c.messageUrdu}</p>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 flex-wrap gap-2">
          <p className="text-[11px] text-slate-500 font-medium">
            🛡️ Antigravity Accounting Protection: Zero automatic changes to maintain absolute audit integrity.
          </p>
          <div className="flex items-center gap-2">
            {onNavigateToAuditLog && (
              <button
                type="button"
                onClick={onNavigateToAuditLog}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
                title="View full historical audit log"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>Errors & Audit Log ➔</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl font-black bg-slate-900 hover:bg-slate-800 text-white text-xs transition cursor-pointer shadow-sm"
            >
              Band Karein (Close)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

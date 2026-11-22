import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  HardDrive,
  Download,
  RotateCcw,
  Sparkles,
  Database,
  History,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Layers,
  Clock
} from 'lucide-react';
import {
  getAllVaultSnapshots,
  createVaultSnapshot,
  exportMasterBackupToDisk,
  checkBackupReminderStatus
} from '../utils/storageVault';

export default function StorageVaultModal({
  isOpen,
  onClose,
  allData,
  onRestoreSnapshot,
  onNotify
}) {
  const [snapshots, setSnapshots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [snapshotNote, setSnapshotNote] = useState('');
  const [reminderStatus, setReminderStatus] = useState(checkBackupReminderStatus());

  const refreshSnapshots = async () => {
    setIsLoading(true);
    try {
      const list = await getAllVaultSnapshots();
      setSnapshots(list);
      setReminderStatus(checkBackupReminderStatus());
    } catch (e) {
      console.warn('Failed to fetch snapshots:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshSnapshots();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1-Click Physical Disk Backup
  const handleExportToDisk = async () => {
    setIsExporting(true);
    try {
      const ok = await exportMasterBackupToDisk(allData);
      if (ok) {
        if (onNotify) onNotify('Master backup file saved directly to your computer! 💾✓');
        setReminderStatus(checkBackupReminderStatus());
      }
    } catch (e) {
      alert('Backup failed: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Create Instant Snapshot
  const handleCreateSnapshot = async () => {
    const note = snapshotNote.trim() || 'Manual Admin Snapshot';
    setIsLoading(true);
    try {
      await createVaultSnapshot(allData, note);
      setSnapshotNote('');
      if (onNotify) onNotify('New safety snapshot created in Vault! 🛡️✓');
      await refreshSnapshots();
    } catch (e) {
      alert('Snapshot failed: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Restore a snapshot
  const handleRestore = (snap) => {
    if (!snap || !snap.data) return;
    const confirmMsg = `کیا آپ واقعی اس اسنیپ شاٹ پر واپس جانا چاہتے ہیں؟\n\nتاریخ: ${snap.dateFormatted}\nتفصیل: ${snap.note}\nمہینے: ${snap.monthCount}\n\nیہ موجودہ ڈیٹا کو اس محفوظ شدہ حالت پر سیٹ کر دے گا۔`;
    if (!window.confirm(confirmMsg)) return;

    if (onRestoreSnapshot) {
      onRestoreSnapshot(snap.data);
      if (onNotify) onNotify(`System restored to snapshot: ${snap.dateFormatted}! 🔄✓`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in no-print">
      <div className="backdrop-blur-2xl bg-white/95 rounded-3xl border border-white/80 shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 relative">
        {/* Header */}
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 font-bold shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-slate-900 tracking-tight">
                  💾 ڈیٹا سیفٹی والٹ و اسنیپ شاٹ ہسٹری (Local Vault & Backups)
                </h3>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  100% Free & Persistent
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                ملٹی ٹیئر پروٹیکشن (IndexedDB + لوکل اسٹوریج + کمپیوٹر ہارڈ ڈسک فائل بیک اپ)
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

        {/* Protection Health Bar */}
        <div className="p-4 bg-slate-50/90 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800">
                IndexedDB Persistent Storage Vault: <span className="text-emerald-700 font-black">فعال (Active)</span>
              </p>
              <p className="text-[11px] text-slate-500">
                براؤزر کی کیشے یا ہسٹری کلیئر ہونے سے بھی آپ کا محفوظ ڈیٹا محفوظ رہے گا۔
              </p>
            </div>
          </div>

          <button
            onClick={handleExportToDisk}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition cursor-pointer shrink-0"
          >
            <HardDrive className="w-4 h-4" />
            <span>{isExporting ? 'محفوظ ہو رہا ہے...' : 'کمپیوٹر پر محفوظ کریں (Save to Disk)'}</span>
          </button>
        </div>

        {/* Create Manual Snapshot Strip */}
        <div className="p-4 bg-white border-b border-slate-200/70">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            📸 فوری دستی اسنیپ شاٹ بنائیں (Create Instant Safety Checkpoint):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={snapshotNote}
              onChange={(e) => setSnapshotNote(e.target.value)}
              placeholder="مثلاً: نومبر کا نیا مہینہ بنانے سے پہلے / اخراجات درج کرنے کے بعد"
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 font-medium"
            />
            <button
              onClick={handleCreateSnapshot}
              disabled={isLoading}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>محفوظ کریں (Snapshot)</span>
            </button>
          </div>
        </div>

        {/* Snapshots List Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>محفوظ شدہ اسنیپ شاٹس ({snapshots.length})</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">
              آخری 15 تاریخی بیک اپس خودکار روٹیشن پر محفوظ رہتے ہیں
            </span>
          </div>

          {snapshots.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
              <Database className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">والٹ میں ابھی تک کوئی اسنیپ شاٹ موجود نہیں۔</p>
              <p className="text-[11px] text-slate-400">
                اوپر دیئے گئے بٹن پر کلک کر کے اپنا پہلا اسنیپ شاٹ محفوظ کریں!
              </p>
            </div>
          ) : (
            snapshots.map((snap, idx) => {
              return (
                <div
                  key={snap.id || idx}
                  className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 font-bold flex items-center justify-center shrink-0 mt-0.5">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {snap.note || 'Automated Snapshot'}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {snap.dateFormatted}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-medium">
                        <span>مہینے: <strong>{snap.monthCount}</strong></span>
                        <span>ایکٹیو مہینہ: <strong>{snap.activeMonth}</strong></span>
                        {snap.totalCollected > 0 && (
                          <span className="text-emerald-700">
                            وصولی: <strong>Rs. {Number(snap.totalCollected).toLocaleString('en-US')}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleRestore(snap)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer border border-slate-200"
                      title="اس اسنیپ شاٹ کے وقت کے ڈیٹا پر واپس جائیں"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>بحال کریں (Restore)</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/90 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            💡 باقاعدگی سے <strong>"کمپیوٹر پر محفوظ کریں"</strong> پر کلک کر کے اپنے پاس .json فائل ڈاؤن لوڈ رکھا کریں۔
          </span>
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-5 rounded-xl transition cursor-pointer"
          >
            بند کریں (Close)
          </button>
        </div>
      </div>
    </div>
  );
}

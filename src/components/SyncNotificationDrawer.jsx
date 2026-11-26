import React, { useState } from 'react';
import {
  X,
  Bell,
  Smartphone,
  Monitor,
  Tablet,
  CloudCheck,
  CloudOff,
  RefreshCw,
  Clock,
  Shield,
  Layers,
  CheckCircle2,
  Trash2,
  Settings,
  ChevronRight
} from 'lucide-react';

export default function SyncNotificationDrawer({
  isOpen,
  onClose,
  syncLogs = [],
  cloudStatus = 'local_only', // 'synced' | 'connecting' | 'unconfigured' | 'error' | 'local_only'
  onClearLogs,
  onOpenCloudSetup,
  onForceSyncNow,
  isSyncing = false
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'mobile' | 'pc'

  if (!isOpen) return null;

  const mobileLogsCount = syncLogs.filter(l => l.deviceType === 'mobile').length;
  const pcLogsCount = syncLogs.filter(l => l.deviceType === 'pc').length;

  const filteredLogs = syncLogs.filter(log => {
    if (filter === 'mobile') return log.deviceType === 'mobile';
    if (filter === 'pc') return log.deviceType === 'pc';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Main Slide-out Panel */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-s border-slate-200 animate-slide-left overflow-hidden">
        {/* Top Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-2">
                <span>Updates & Activity Panel</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded-full border border-blue-500/30">
                  {syncLogs.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                موبائل اور کمپیوٹر کی تمام اپ ڈیٹس کا ریکارڈ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Connection Status Banner */}
        <div className="p-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {cloudStatus === 'synced' ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Cloud Synced (2-Way Live)</span>
                </span>
              ) : cloudStatus === 'connecting' ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-300">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>Connecting to Cloud...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-200/80 px-2.5 py-1 rounded-lg border border-slate-300">
                  <CloudOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>Local Memory (Offline)</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {onForceSyncNow && (
                <button
                  onClick={onForceSyncNow}
                  disabled={isSyncing}
                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition text-xs font-medium flex items-center gap-1"
                  title="Force Sync Now"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              )}
              {onOpenCloudSetup && (
                <button
                  onClick={onOpenCloudSetup}
                  className="px-2 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  <span>Cloud Setup</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({syncLogs.length})
            </button>
            <button
              onClick={() => setFilter('mobile')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${
                filter === 'mobile'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile ({mobileLogsCount})</span>
            </button>
            <button
              onClick={() => setFilter('pc')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${
                filter === 'pc'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>PC ({pcLogsCount})</span>
            </button>
          </div>

          {syncLogs.length > 0 && onClearLogs && (
            <button
              onClick={onClearLogs}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Clear Notification History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Notifications Timeline List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-700 text-sm">کوئی نئی اپ ڈیٹ نہیں</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  جب بھی آپ موبائل یا پی سی سے کوئی وصولی یا خرچہ درج کریں گے، اس کا نوٹیفکیشن یہاں ڈیوائس کے نام کے ساتھ نظر آئے گا۔
                </p>
              </div>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isMobile = log.deviceType === 'mobile';
              const isTablet = log.deviceType === 'tablet';

              return (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl border transition-all hover:shadow-sm bg-white border-slate-200/90 relative overflow-hidden group"
                >
                  {/* Left Accent Stripe */}
                  <div
                    className={`absolute top-0 bottom-0 start-0 w-1 ${
                      isMobile
                        ? 'bg-purple-500'
                        : isTablet
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                  />

                  <div className="flex items-start justify-between gap-2.5 ms-1">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isMobile
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : isTablet
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {isMobile ? (
                          <Smartphone className="w-4 h-4" />
                        ) : isTablet ? (
                          <Tablet className="w-4 h-4" />
                        ) : (
                          <Monitor className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md leading-none ${
                              isMobile
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {isMobile ? '📱 Updated via Mobile' : '💻 Updated via PC'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {log.displayTime}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-xs text-slate-900 mt-1 leading-snug">
                          {log.actionTitle}
                        </h4>

                        {log.actionDetails && (
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">
                            {log.actionDetails}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                          <span className="font-medium text-slate-500">{log.deviceName}</span>
                          <span>•</span>
                          <span>{log.displayDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Note */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
            🔒 <span className="font-bold text-slate-700">پرائیویسی و کلین ڈسپلے:</span> آپ کے فلیٹ رجسٹر کے مین ٹیبل بالکل صاف رہیں گے، جبکہ کس ڈیوائس سے کیا بدلاؤ ہوا اس کا مکمل حساب اس پینل میں محفوظ رہے گا۔
          </p>
        </div>
      </div>
    </div>
  );
}

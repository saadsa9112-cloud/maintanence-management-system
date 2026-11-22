import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Receipt,
  Users,
  LineChart,
  FileSpreadsheet,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  X,
  Wrench,
  Sparkles,
  Send,
  LogOut,
  KeyRound,
  Shield,
  Database
} from 'lucide-react';

export default function Sidebar({
  activePage,
  onNavigate,
  activeMonthKey,
  currentMonthData,
  isFinalized,
  t,
  lang,
  isOpen,
  onClose,
  auditLogCount = 0,
  onLogout,
  onOpenChangePassword,
  onOpenVaultModal
}) {
  const unpaidCount = (currentMonthData?.flats || []).filter(
    f => f && (f.status === 'arrears' || (f.status !== 'closed' && Number(f.arrears) > 0))
  ).length;

  const expensesCount = (currentMonthData?.expenses || []).length;

  const navSections = [
    {
      title: 'Financial Core',
      items: [
        { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
        {
          id: 'collections',
          label: t.navCollections,
          icon: Building2,
          badge: unpaidCount > 0 ? `${unpaidCount} due` : null,
          badgeColor: 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
        },
        {
          id: 'expenses',
          label: t.navExpenses,
          icon: Receipt,
          badge: `${expensesCount}`,
          badgeColor: 'bg-slate-800 text-slate-300 border border-slate-700'
        }
      ]
    },
    {
      title: 'Operations & Billing',
      items: [
        {
          id: 'bills-whatsapp',
          label: t.navBillsWhatsApp || 'Bills & WhatsApp Hub',
          icon: Send,
          badge: 'Bills',
          badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
        },
        {
          id: 'residents',
          label: t.navResidents,
          icon: Users,
          badge: '20',
          badgeColor: 'bg-slate-800 text-slate-400 border border-slate-700'
        },
        { id: 'vendor-ledger', label: t.navVendorLedger || 'Vendor Ledger', icon: Wrench },
        {
          id: 'special-funds',
          label: t.navSpecialFunds || 'Special Funds',
          icon: Sparkles,
          badge: 'Funds',
          badgeColor: 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
        }
      ]
    },
    {
      title: 'Reports & System',
      items: [
        { id: 'overview', label: t.navOverview, icon: LineChart },
        {
          id: 'errors-audit',
          label: t.navErrorsAudit || 'Audit & Discrepancies',
          icon: ShieldAlert,
          badge: auditLogCount > 0 ? `${auditLogCount}` : null,
          badgeColor: 'bg-rose-500 text-white font-bold'
        },
        { id: 'export', label: t.navExport, icon: FileSpreadsheet }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Main Professional Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 start-0 z-50 w-68 bg-[#0b0f19] text-slate-200 flex flex-col justify-between border-e border-slate-800/80 shadow-2xl transition-transform duration-300 ease-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 font-bold">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-extrabold text-sm tracking-tight text-white leading-tight truncate">
                  Al-Mustafa Heights
                </h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase truncate mt-0.5">
                  Building Maintenance ERP
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Active Period Quick Pill */}
          <div className="mx-3 my-2.5 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
              <div className="truncate">
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block leading-none">
                  Billing Period
                </span>
                <span className="text-xs font-bold text-slate-100 truncate block mt-0.5">
                  {currentMonthData?.name || activeMonthKey}
                </span>
              </div>
            </div>
            {isFinalized ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md shrink-0">
                <Lock className="w-3 h-3" />
                <span>Locked</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md shrink-0">
                <Unlock className="w-3 h-3" />
                <span>Open</span>
              </span>
            )}
          </div>

          {/* Categorized Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-4 dark-scrollbar">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <div className="px-3 pt-1 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </span>
                </div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        if (onClose) onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold tracking-wide shrink-0 ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Professional Admin Control Card (Bottom) */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/50 shrink-0">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-blue-400 shrink-0">
                  MS
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate leading-none">
                    Hafiz Muhammad Saad
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium block truncate mt-0.5">
                    Building Administrator
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Security & Vault Action Strip */}
            <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800/80">
              {onOpenVaultModal && (
                <button
                  onClick={() => {
                    onOpenVaultModal();
                    if (onClose) onClose();
                  }}
                  className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 transition cursor-pointer"
                  title="Data Safety Vault & 1-Click Backup (ڈیٹا سیفٹی والٹ)"
                >
                  <Database className="w-3 h-3 shrink-0" />
                  <span>Vault</span>
                </button>
              )}

              {onOpenChangePassword && (
                <button
                  onClick={() => {
                    onOpenChangePassword();
                    if (onClose) onClose();
                  }}
                  className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 transition cursor-pointer"
                  title="Change Admin Password (پاس ورڈ تبدیل کریں)"
                >
                  <KeyRound className="w-3 h-3 shrink-0" />
                  <span>Pass</span>
                </button>
              )}

              {onLogout && (
                <button
                  onClick={() => {
                    if (onClose) onClose();
                    onLogout();
                  }}
                  className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition cursor-pointer"
                  title="Sign Out of Session (لاگ آؤٹ)"
                >
                  <LogOut className="w-3 h-3 shrink-0" />
                  <span>Exit</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
                <span>Disk Saved</span>
              </span>
              <span className="text-[9px] font-mono text-slate-400">v3.8 ERP</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

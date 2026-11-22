import React, { useState, useEffect, useRef } from 'react';
import { initialData, masterResidentsList } from './data/initialData';
import { translations } from './utils/translations';
import { exportToExcel } from './utils/excelExport';
import { sortMonthsChronologically } from './utils/monthUtils';
import { formatResidentDisplayName, cleanResidentBaseName } from './utils/residentUtils';

import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import MonthModal from './components/MonthModal';
import EditMonthModal from './components/EditMonthModal';
import GlobalSearchModal from './components/GlobalSearchModal';
import LoginPage from './components/LoginPage';
import ChangePasswordModal from './components/ChangePasswordModal';
import StorageVaultModal from './components/StorageVaultModal';
import {
  saveStateToIndexedDB,
  createVaultSnapshot,
  exportMasterBackupToDisk,
  checkBackupReminderStatus
} from './utils/storageVault';

import DashboardPage from './pages/DashboardPage';
import CollectionsPage from './pages/CollectionsPage';
import ExpensesPage from './pages/ExpensesPage';
import ResidentsPage from './pages/ResidentsPage';
import SpecialFundsPage from './pages/SpecialFundsPage';
import AnnualOverviewPage from './pages/AnnualOverviewPage';
import ErrorsAuditPage from './pages/ErrorsAuditPage';
import ExportPage from './pages/ExportPage';
import BillsWhatsAppPage from './pages/BillsWhatsAppPage';
import VendorLedgerPage from './pages/VendorLedgerPage';

export const INITIAL_VENDORS = [
  { id: 'v_1', name: 'اسلم الیکٹریشن', role: 'Electrician (الیکٹریشن)', phone: '0312-2849102', rate: '1500/Visit', note: 'Motor & wiring repair specialist' },
  { id: 'v_2', name: 'صفدر پلمبر', role: 'Plumber (پلمبر)', phone: '0321-9876543', rate: '1000/Visit', note: 'Overhead tank & pipeline leakage' },
  { id: 'v_3', name: 'کراچی ایلیویٹرز سروس', role: 'Lift Technician (لفٹ سروس)', phone: '0300-4567891', rate: '6000/Month', note: 'Monthly elevator servicing contract' },
  { id: 'v_4', name: 'المدینہ واٹر سپلائی', role: 'Water Tanker (واٹر ٹینکر)', phone: '0333-1122334', rate: '2500/Bowser', note: '1000/2000 gallon sweet water bowsers' },
  { id: 'v_5', name: 'جمعدار (سویپر)', role: 'Janitor / Sweeper (صفائی و کوڑا)', phone: '0345-5566778', rate: '4500/Month', note: 'Daily stairs & corridor cleaning' },
  { id: 'v_6', name: 'کے الیکٹرک بلنگ', role: 'Electricity Utility (بجلی بل)', phone: '118', rate: 'Variable', note: 'Common area building electric meter' }
];

import { CheckCircle2 } from 'lucide-react';

const DATA_STORAGE_KEY = 'almustafa_maint_erp_v3';
const BACKUP_STORAGE_KEY = 'almustafa_maint_erp_v3_backup';
const LANG_STORAGE_KEY = 'almustafa_maint_lang';
const AUTH_STORAGE_KEY = 'almustafa_auth_config';
const SESSION_STORAGE_KEY = 'almustafa_auth_session';

// Immediate Synchronous Disk Writer (Survives system shutdown & crashes)
const persistDataToDisk = (newData) => {
  try {
    const serialized = JSON.stringify(newData);
    localStorage.setItem(DATA_STORAGE_KEY, serialized);
    localStorage.setItem(BACKUP_STORAGE_KEY, serialized);
    localStorage.setItem('almustafa_last_save_time', new Date().toISOString());
    // Redundant asynchronous backup to native IndexedDB vault
    saveStateToIndexedDB(newData);
  } catch (e) {
    console.error('Failed to write to localStorage:', e);
  }
};

// Automatically links and cascades closing cash of each chronological month into opening cash of subsequent month
export const syncAllChainedBalances = (monthsData = {}, sortedMonthKeys = []) => {
  if (!sortedMonthKeys || sortedMonthKeys.length === 0) return monthsData;
  const updatedMonths = { ...monthsData };

  for (let i = 0; i < sortedMonthKeys.length - 1; i++) {
    const currentKey = sortedMonthKeys[i];
    const nextKey = sortedMonthKeys[i + 1];

    const currentMonth = updatedMonths[currentKey];
    const nextMonth = updatedMonths[nextKey];

    if (!currentMonth || !nextMonth) continue;

    // Calculate current month's closing cash balance
    const coll = (currentMonth.flats || []).reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
    const exp = (currentMonth.expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const prev = Number(currentMonth.prevSavings || 0);
    const closingBalance = coll + prev - exp;

    // Cascade into next month's opening balance (prevSavings)
    updatedMonths[nextKey] = {
      ...nextMonth,
      prevSavings: closingBalance
    };
  }

  return updatedMonths;
};

export default function App() {
  // Load data from localStorage or initialData (Auto-normalized to chronological order)
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(DATA_STORAGE_KEY) || localStorage.getItem(BACKUP_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.monthOrder)) {
          parsed.monthOrder = sortMonthsChronologically(parsed.monthOrder);
        }
        if (!parsed.residentDirectory || !Array.isArray(parsed.residentDirectory)) {
          parsed.residentDirectory = masterResidentsList.map(m => ({
            ...m,
            status: m.flat === 'P-3' ? 'closed' : 'active',
            occupantType: m.occupantType || 'owner'
          }));
        } else {
          // Ensure any closed flat in the system is properly reflected in master residentDirectory
          parsed.residentDirectory = parsed.residentDirectory.map(m => {
            const isClosedInAnyMonth = Object.values(parsed.months || {}).some(mon =>
              (mon.flats || []).some(f => (f.flat === m.flat || f.sno === m.sno) && f.status === 'closed')
            );
            return {
              ...m,
              status: m.status === 'closed' || (m.flat === 'P-3' || isClosedInAnyMonth) ? 'closed' : (m.status || 'active'),
              occupantType: m.occupantType || 'owner'
            };
          });
        }
        if (!parsed.specialFunds || !Array.isArray(parsed.specialFunds)) {
          parsed.specialFunds = [
            {
              id: 'fund_lift_2026',
              name: 'Lift Overhaul & Cable Replacement',
              description: 'Emergency overhaul and main cable replacement for passenger lift',
              targetPerFlat: 5000,
              createdDate: '01-Nov-2026',
              status: 'active',
              flats: (parsed.residentDirectory || masterResidentsList).map(r => ({
                sno: r.sno,
                flat: r.flat,
                name: r.name,
                target: r.status === 'closed' ? 0 : 5000,
                paid: r.flat === 'T-3' ? 5000 : 0,
                paidDate: r.flat === 'T-3' ? '01-Nov-2026' : '',
                arrears: r.status === 'closed' ? 0 : (r.flat === 'T-3' ? 0 : 5000),
                status: r.status === 'closed' ? 'closed' : (r.flat === 'T-3' ? 'paid' : 'arrears'),
                phone: r.phone || ''
              })),
              expenses: [
                { id: 1, desc: 'Lift motor technician inspection advance', amount: 3000, paidTo: 'Schindler Tech', date: '01-Nov-2026' }
              ]
            }
          ];
        }
        if (!parsed.errorAuditLog || !Array.isArray(parsed.errorAuditLog)) {
          parsed.errorAuditLog = [];
        }
        if (!parsed.cellChangeHistory || !Array.isArray(parsed.cellChangeHistory)) {
          parsed.cellChangeHistory = [];
        }
        if (!parsed.defaulterNoticeLog || !Array.isArray(parsed.defaulterNoticeLog)) {
          parsed.defaulterNoticeLog = [];
        }
        if (!parsed.vendors || !Array.isArray(parsed.vendors) || parsed.vendors.length === 0) {
          parsed.vendors = INITIAL_VENDORS;
        }

        // Auto-normalize all resident names across directory, all months, and special funds:
        // Rule: Suffix "صاحب" is configurable (Default: ON), and "(کرایہ دار)" for tenants
        if (Array.isArray(parsed.residentDirectory)) {
          parsed.residentDirectory = parsed.residentDirectory.map(m => {
            const occType = m.occupantType || 'owner';
            const includeSahab = m.includeSahab !== false;
            return {
              ...m,
              occupantType: occType,
              includeSahab: includeSahab,
              name: formatResidentDisplayName(m.name, occType, includeSahab)
            };
          });
        }

        if (parsed.months) {
          Object.keys(parsed.months).forEach(mKey => {
            const mData = parsed.months[mKey];
            if (mData && Array.isArray(mData.flats)) {
              mData.flats = mData.flats.map(f => {
                const dirItem = parsed.residentDirectory?.find(d => d.flat === f.flat || d.sno === f.sno);
                const occType = f.occupantType || dirItem?.occupantType || 'owner';
                const includeSahab = f.includeSahab !== undefined ? f.includeSahab !== false : (dirItem?.includeSahab !== false);
                const resolvedName = dirItem?.name || f.name;
                return {
                  ...f,
                  occupantType: occType,
                  includeSahab: includeSahab,
                  name: formatResidentDisplayName(resolvedName, occType, includeSahab)
                };
              });
            }
          });
        }

        if (Array.isArray(parsed.specialFunds)) {
          parsed.specialFunds = parsed.specialFunds.map(sf => ({
            ...sf,
            flats: (sf.flats || []).map(f => {
              const dirItem = parsed.residentDirectory?.find(d => d.flat === f.flat || d.sno === f.sno);
              const occType = f.occupantType || dirItem?.occupantType || 'owner';
              const includeSahab = f.includeSahab !== undefined ? f.includeSahab !== false : (dirItem?.includeSahab !== false);
              const resolvedName = dirItem?.name || f.name;
              return {
                ...f,
                occupantType: occType,
                includeSahab: includeSahab,
                name: formatResidentDisplayName(resolvedName, occType, includeSahab)
              };
            })
          }));
        }

        return parsed;
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    }
    return {
      ...initialData,
      errorAuditLog: [],
      cellChangeHistory: [],
      defaulterNoticeLog: [],
      monthOrder: sortMonthsChronologically(initialData.monthOrder),
      residentDirectory: masterResidentsList.map(m => ({
        ...m,
        status: m.flat === 'P-3' ? 'closed' : 'active',
        occupantType: m.occupantType || 'owner'
      })),
      specialFunds: [
        {
          id: 'fund_lift_2026',
          name: 'Lift Overhaul & Cable Replacement',
          description: 'Emergency overhaul and main cable replacement for passenger lift',
          targetPerFlat: 5000,
          createdDate: '01-Nov-2026',
          status: 'active',
          flats: masterResidentsList.map(r => ({
            sno: r.sno,
            flat: r.flat,
            name: r.name,
            target: r.flat === 'P-3' ? 0 : 5000,
            paid: r.flat === 'T-3' ? 5000 : 0,
            paidDate: r.flat === 'T-3' ? '01-Nov-2026' : '',
            arrears: r.flat === 'P-3' ? 0 : (r.flat === 'T-3' ? 0 : 5000),
            status: r.flat === 'P-3' ? 'closed' : (r.flat === 'T-3' ? 'paid' : 'arrears'),
            phone: r.phone || ''
          })),
          expenses: [
            { id: 1, desc: 'Lift motor technician inspection advance', amount: 3000, paidTo: 'Schindler Tech', date: '01-Nov-2026' }
          ]
        }
      ],
      vendors: INITIAL_VENDORS
    };
  });

  // Track latest data with ref for instant write on exit/shutdown
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Handle window close / system shutdown
  useEffect(() => {
    const handleExit = () => {
      if (dataRef.current) {
        persistDataToDisk(dataRef.current);
      }
    };
    window.addEventListener('beforeunload', handleExit);
    window.addEventListener('pagehide', handleExit);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handleExit();
    });
    return () => {
      window.removeEventListener('beforeunload', handleExit);
      window.removeEventListener('pagehide', handleExit);
    };
  }, []);

  // Language state (Default: English)
  const [lang, setLang] = useState(() => {
    try {
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
      if (savedLang && (savedLang === 'en' || savedLang === 'roman' || savedLang === 'ur')) {
        return savedLang;
      }
    } catch (e) {}
    return 'en'; // English is default as requested
  });

  // Page routing state
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Active month
  const [activeMonthKey, setActiveMonthKey] = useState(() => {
    return data.activeMonth || data.monthOrder[0] || 'OCTOBER';
  });

  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [isEditMonthModalOpen, setIsEditMonthModalOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [backupReminder, setBackupReminder] = useState(() => checkBackupReminderStatus());
  const [dismissReminder, setDismissReminder] = useState(false);
  const [toast, setToast] = useState(null);

  // Authentication & Security (Admin Login & Password)
  const [authConfig, setAuthConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { username: 'admin', password: '123' };
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const session = localStorage.getItem(SESSION_STORAGE_KEY);
      const sessionTmp = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return session === 'true' || sessionTmp === 'true';
    } catch (e) {
      return false;
    }
  });

  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const handleLoginSuccess = ({ rememberMe }) => {
    setIsAuthenticated(true);
    try {
      if (rememberMe) {
        localStorage.setItem(SESSION_STORAGE_KEY, 'true');
      } else {
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      }
    } catch (e) {}
    showToast('کامیابی سے لاگ ان ہو گئے! خوش آمدید 🎉');
  };

  const handleLogout = () => {
    if (window.confirm('کیا آپ واقعی ایڈمن سسٹم سے لاگ آؤٹ کرنا چاہتے ہیں؟ (Confirm Logout)')) {
      try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch (e) {}
      setIsAuthenticated(false);
      showToast('سسٹم سے لاگ آؤٹ کر دیا گیا۔ 🔒');
    }
  };

  const handleUpdatePassword = (newPassword) => {
    const updated = {
      ...authConfig,
      password: newPassword
    };
    setAuthConfig(updated);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
    showToast('ایڈمن پاس ورڈ کامیابی سے محفوظ ہو گیا! 🔐✓');
  };

  // Global Universal Search Keyboard Shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }, [data]);

  // Save language to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (e) {}
  }, [lang]);

  const t = translations[lang] || translations.en;
  const isRTL = lang === 'ur';

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  const currentMonthData = data.months[activeMonthKey] || data.months[data.monthOrder[0]];
  const isFinalized = Boolean(currentMonthData?.finalized);

  // Handlers for month data
  const handleUpdateFlats = (updatedFlats) => {
    setData(prev => {
      const next = {
        ...prev,
        months: {
          ...prev.months,
          [activeMonthKey]: {
            ...prev.months[activeMonthKey],
            flats: updatedFlats
          }
        }
      };
      persistDataToDisk(next);
      return next;
    });
  };

  // Single Source of Truth: RD Updates (Global across all months & new month creation)
  const handleUpdateResidentDirectory = (newDirectory) => {
    setData(prev => {
      const normalizedDirectory = newDirectory.map(dirItem => {
        const occType = dirItem.occupantType || 'owner';
        const includeSahab = dirItem.includeSahab !== false;
        return {
          ...dirItem,
          occupantType: occType,
          includeSahab: includeSahab,
          name: formatResidentDisplayName(dirItem.name, occType, includeSahab)
        };
      });

      const updatedMonths = { ...prev.months };

      // Propagate resident profile & closed status to all months
      Object.keys(updatedMonths).forEach(mKey => {
        const m = updatedMonths[mKey];
        if (!m || !m.flats) return;

        const updatedFlats = m.flats.map(f => {
          const dirItem = normalizedDirectory.find(d => d.flat === f.flat || d.sno === f.sno);
          if (!dirItem) return f;

          if (dirItem.status === 'closed') {
            return {
              ...f,
              name: dirItem.name,
              englishName: dirItem.englishName || f.englishName,
              phone: dirItem.phone || f.phone,
              occupantType: dirItem.occupantType || 'owner',
              includeSahab: dirItem.includeSahab !== false,
              status: 'closed',
              due: 0,
              paid: 0,
              arrears: 0
            };
          } else if (f.status === 'closed' && dirItem.status === 'active') {
            const baseDue = Number(dirItem.due) || 3000;
            return {
              ...f,
              name: dirItem.name,
              englishName: dirItem.englishName || f.englishName,
              phone: dirItem.phone || f.phone,
              occupantType: dirItem.occupantType || 'owner',
              includeSahab: dirItem.includeSahab !== false,
              status: 'arrears',
              due: baseDue,
              arrears: baseDue
            };
          }

          return {
            ...f,
            name: dirItem.name,
            englishName: dirItem.englishName || f.englishName,
            phone: dirItem.phone || f.phone,
            occupantType: dirItem.occupantType || 'owner',
            includeSahab: dirItem.includeSahab !== false,
            due: Number(dirItem.due) || f.due
          };
        });

        updatedMonths[mKey] = {
          ...m,
          flats: updatedFlats
        };
      });

      const next = {
        ...prev,
        residentDirectory: normalizedDirectory,
        months: updatedMonths
      };
      persistDataToDisk(next);
      return next;
    });
  };

  const handleUpdateExpenses = (updatedExpenses) => {
    setData(prev => {
      const next = {
        ...prev,
        months: {
          ...prev.months,
          [activeMonthKey]: {
            ...prev.months[activeMonthKey],
            expenses: updatedExpenses
          }
        }
      };
      persistDataToDisk(next);
      return next;
    });
  };

  // Feature 1: Expense-to-Flat Auto Contra Entry (Fully editable in Expenses Tracker)
  const handleAddContraExpense = (contraPayload) => {
    setData(prev => {
      const activeMonth = prev.months[activeMonthKey];
      if (!activeMonth) return prev;
      const currentExpenses = activeMonth.expenses || [];
      const newEntry = {
        id: Date.now(),
        desc: contraPayload.desc || `کٹوتی بذریعہ فلیٹ ${contraPayload.flat}`,
        amount: Number(contraPayload.amount) || 0,
        details: contraPayload.details || `Adjusted against Flat ${contraPayload.flat} maintenance (${contraPayload.name || ''})`,
        linkedFlat: contraPayload.flat || '',
        isContra: true
      };
      const updatedMonths = {
        ...prev.months,
        [activeMonthKey]: {
          ...activeMonth,
          expenses: [...currentExpenses, newEntry]
        }
      };
      const next = { ...prev, months: updatedMonths };
      persistDataToDisk(next);
      return next;
    });
    showToast(`Contra expense of Rs. ${Number(contraPayload.amount || 0).toLocaleString('en-US')} added to Expenses Tracker! 🔄✓`);
  };

  const handleUpdatePrevSavings = (newBal, targetMonthKey) => {
    const monthKey = targetMonthKey || activeMonthKey;
    if (!monthKey) return;
    setData(prev => {
      if (!prev.months[monthKey]) return prev;
      const next = {
        ...prev,
        months: {
          ...prev.months,
          [monthKey]: {
            ...prev.months[monthKey],
            prevSavings: Number(newBal) || 0
          }
        }
      };
      persistDataToDisk(next);
      return next;
    });
    showToast('Previous balance updated! ✓');
  };

  const handleBatchUpdatePrevSavings = (updatesMap = {}) => {
    setData(prev => {
      const nextMonths = { ...prev.months };
      Object.entries(updatesMap).forEach(([mKey, bal]) => {
        if (nextMonths[mKey]) {
          nextMonths[mKey] = {
            ...nextMonths[mKey],
            prevSavings: Number(bal) || 0
          };
        }
      });
      const next = { ...prev, months: nextMonths };
      persistDataToDisk(next);
      return next;
    });
    showToast('All opening balances updated successfully! ✓');
  };

  const handleUpdateSpecialFunds = (updatedFunds) => {
    setData(prev => {
      const next = { ...prev, specialFunds: updatedFunds };
      persistDataToDisk(next);
      return next;
    });
  };

  const handleUpdateMonthFlats = (targetMonthKey, updatedFlats) => {
    setData(prev => {
      if (!prev.months[targetMonthKey]) return prev;
      const nextMonths = {
        ...prev.months,
        [targetMonthKey]: {
          ...prev.months[targetMonthKey],
          flats: updatedFlats
        }
      };
      const next = { ...prev, months: nextMonths };
      persistDataToDisk(next);
      return next;
    });
  };

  const handleUpdateDate = (newDateStr) => {
    setData(prev => {
      const next = {
        ...prev,
        months: {
          ...prev.months,
          [activeMonthKey]: {
            ...prev.months[activeMonthKey],
            dateStr: newDateStr
          }
        }
      };
      persistDataToDisk(next);
      return next;
    });
  };

  const handleToggleFinalize = () => {
    if (!isFinalized) {
      if (!window.confirm(`Finalize and lock month "${currentMonthData?.name || activeMonthKey}"?\nThis locks all records to prevent accidental changes.`)) {
        return;
      }
      setData(prev => {
        const next = {
          ...prev,
          months: {
            ...prev.months,
            [activeMonthKey]: {
              ...prev.months[activeMonthKey],
              finalized: true,
              finalizedAt: new Date().toISOString()
            }
          }
        };
        persistDataToDisk(next);
        return next;
      });
      showToast(`Month finalized and locked! 🔒`);
    } else {
      if (!window.confirm('Unlock this month to allow edits?')) {
        return;
      }
      setData(prev => {
        const next = {
          ...prev,
          months: {
            ...prev.months,
            [activeMonthKey]: {
              ...prev.months[activeMonthKey],
              finalized: false
            }
          }
        };
        persistDataToDisk(next);
        return next;
      });
      showToast('Month unlocked for editing! 🔓');
    }
  };

  const handleCreateMonth = (newMonthPayload) => {
    let key = newMonthPayload.key;
    if (data.months[key]) {
      key = `${key}_${newMonthPayload.year}`;
    }

    // Determine chronological positioning of the new month
    const sortedExisting = sortMonthsChronologically(data.monthOrder);
    const combinedKeys = sortMonthsChronologically([...sortedExisting.filter(k => k !== key), key]);
    const selIndex = combinedKeys.indexOf(key);
    const precedingKey = selIndex > 0 ? combinedKeys[selIndex - 1] : null;
    const isHistorical = !precedingKey;

    let autoDetectedFlats = [];

    if (!isHistorical && precedingKey && data.months[precedingKey]) {
      // Forward Next Month: Auto-detect preceding month's live state & carried arrears
      const precData = data.months[precedingKey];
      const precFlats = precData.flats || [];

      const directorySource = (data.residentDirectory && data.residentDirectory.length > 0)
        ? data.residentDirectory
        : masterResidentsList;

      autoDetectedFlats = directorySource.map(master => {
        const prevFlat = precFlats.find(f => f.flat === master.flat || f.sno === master.sno);

        // Single Source of Truth: Check if locked in RD OR locked in previous month
        const isLockedInRD = master.status === 'closed';
        const isLockedInPrev = prevFlat ? prevFlat.status === 'closed' : false;

        if (isLockedInRD || isLockedInPrev) {
          return {
            sno: master.sno,
            flat: master.flat,
            name: master.name || (prevFlat ? prevFlat.name : ''),
            englishName: master.englishName,
            due: 0,
            paid: 0,
            arrears: 0,
            status: 'closed',
            phone: master.phone || (prevFlat ? prevFlat.phone : ''),
            occupantType: master.occupantType || 'owner'
          };
        }

        const monthlyDue = Number(master.due || (prevFlat ? prevFlat.due : 3000));
        const carriedArrears = prevFlat ? Number(prevFlat.arrears || 0) : 0;
        const prevPaid = Number(prevFlat ? prevFlat.paid || 0 : 0);
        const prevDue = Number(prevFlat ? prevFlat.due || 0 : 0);
        const prevPriorArrears = Number(prevFlat?.priorArrears || Math.max(0, (Number(prevFlat?.arrears || 0) + prevPaid) - prevDue));
        const prevTotalLiability = prevDue + prevPriorArrears;

        // Smart True Advance: Only when previous payment exceeded BOTH current due AND prior arrears!
        // Clearing past pendings does NOT count as advance.
        const prevAdvance = Math.max(0, prevPaid - prevTotalLiability);

        if (prevAdvance > 0) {
          const paidFromAdvance = Math.min(prevAdvance, monthlyDue);
          const remainingDue = Math.max(0, monthlyDue - paidFromAdvance);
          return {
            sno: master.sno,
            flat: master.flat,
            name: master.name || (prevFlat ? prevFlat.name : ''),
            englishName: master.englishName,
            due: monthlyDue,
            priorArrears: 0,
            paid: paidFromAdvance,
            arrears: remainingDue,
            advanceCredit: Math.max(0, prevAdvance - paidFromAdvance),
            status: remainingDue === 0 ? 'paid' : 'arrears',
            phone: master.phone || (prevFlat ? prevFlat.phone : ''),
            occupantType: master.occupantType || 'owner',
            notes: paidFromAdvance > 0 ? 'Paid via Advance Credit (سابقہ پیشگی رقم)' : ''
          };
        }

        const newMonthArrears = monthlyDue + carriedArrears;

        return {
          sno: master.sno,
          flat: master.flat,
          name: master.name || (prevFlat ? prevFlat.name : ''),
          englishName: master.englishName,
          due: monthlyDue,
          priorArrears: carriedArrears,
          paid: 0,
          arrears: newMonthArrears,
          status: 'arrears',
          phone: master.phone || (prevFlat ? prevFlat.phone : ''),
          occupantType: master.occupantType || 'owner'
        };
      });
    } else {
      // Historical Prior Month: Baseline entry adhering strictly to RD locked status
      const directorySource = (data.residentDirectory && data.residentDirectory.length > 0)
        ? data.residentDirectory
        : masterResidentsList;

      autoDetectedFlats = directorySource.map(master => {
        const isLockedInRD = master.status === 'closed';
        return {
          sno: master.sno,
          flat: master.flat,
          name: master.name,
          englishName: master.englishName,
          due: isLockedInRD ? 0 : master.due,
          paid: 0,
          arrears: isLockedInRD ? 0 : master.due,
          status: isLockedInRD ? 'closed' : 'arrears',
          phone: master.phone || '',
          occupantType: master.occupantType || 'owner'
        };
      });
    }

    const defaultExpenses = [
      { id: 1, desc: 'بجلی کا بل', amount: 0, details: '' },
      { id: 2, desc: 'موٹر آپریٹر', amount: 1500, details: '' },
      { id: 3, desc: 'جمعدار', amount: 4500, details: '' }
    ];

    const newMonthData = {
      name: newMonthPayload.name,
      year: newMonthPayload.year,
      dateStr: newMonthPayload.dateStr,
      prevSavings: Number(newMonthPayload.prevSavings) || 0,
      finalized: false,
      flats: autoDetectedFlats,
      expenses: defaultExpenses
    };

    setData(prev => {
      const updatedMonths = {
        ...prev.months,
        [key]: newMonthData
      };
      const updatedOrder = sortMonthsChronologically([key, ...prev.monthOrder.filter(k => k !== key)]);

      const next = {
        ...prev,
        monthOrder: updatedOrder,
        activeMonth: key,
        months: updatedMonths
      };
      persistDataToDisk(next);
      return next;
    });

    setActiveMonthKey(key);
    showToast(isHistorical
      ? `Historical month "${newMonthPayload.name}" created fresh & chained forward! ✓`
      : `New month "${newMonthPayload.name}" created with auto-carried balances! ✓`
    );
  };

  // Edit month metadata (Name, Year, Statement Date, Opening Balance, Finalized status)
  const handleEditMonth = (originalMonthKey, updatedPayload) => {
    setData(prev => {
      const monthData = prev.months[originalMonthKey];
      if (!monthData) return prev;

      const newKey = updatedPayload.newKey ? updatedPayload.newKey.toUpperCase().trim() : originalMonthKey;
      const isKeyChanged = newKey !== originalMonthKey;

      if (isKeyChanged && prev.months[newKey]) {
        showToast(`Error: Month "${newKey}" already exists!`);
        return prev;
      }

      const updatedMonthObj = {
        ...monthData,
        name: updatedPayload.name || newKey,
        urduName: updatedPayload.urduName || monthData.urduName,
        year: Number(updatedPayload.year) || monthData.year || 2026,
        dateStr: updatedPayload.dateStr || monthData.dateStr,
        prevSavings: updatedPayload.prevSavings !== undefined ? Number(updatedPayload.prevSavings) : monthData.prevSavings,
        finalized: updatedPayload.finalized !== undefined ? Boolean(updatedPayload.finalized) : monthData.finalized
      };

      const nextMonths = { ...prev.months };
      if (isKeyChanged) {
        delete nextMonths[originalMonthKey];
        nextMonths[newKey] = updatedMonthObj;
      } else {
        nextMonths[originalMonthKey] = updatedMonthObj;
      }

      const nextMonthOrder = isKeyChanged
        ? prev.monthOrder.map(k => k === originalMonthKey ? newKey : k)
        : [...prev.monthOrder];

      const sortedOrder = sortMonthsChronologically(nextMonthOrder);

      const next = {
        ...prev,
        months: nextMonths,
        monthOrder: sortedOrder,
        activeMonth: prev.activeMonth === originalMonthKey ? (isKeyChanged ? newKey : prev.activeMonth) : prev.activeMonth
      };

      persistDataToDisk(next);
      if (isKeyChanged && activeMonthKey === originalMonthKey) {
        setActiveMonthKey(newKey);
      }

      return next;
    });

    showToast(`Month "${originalMonthKey}" details updated successfully! ✓`);
  };

  // Permanently delete a month maintenance sheet register
  const handleDeleteMonth = (monthKeyToDelete) => {
    if (!monthKeyToDelete) return false;

    if (data.monthOrder.length <= 1) {
      showToast('Cannot delete: System must have at least one month register!');
      return false;
    }

    const monthToDelete = data.months[monthKeyToDelete];
    if (!monthToDelete) return false;

    setData(prev => {
      const nextMonths = { ...prev.months };
      delete nextMonths[monthKeyToDelete];

      const nextMonthOrder = prev.monthOrder.filter(k => k !== monthKeyToDelete);
      const sortedOrder = sortMonthsChronologically(nextMonthOrder);

      const nextActiveMonth = activeMonthKey === monthKeyToDelete ? sortedOrder[0] : activeMonthKey;

      const next = {
        ...prev,
        months: nextMonths,
        monthOrder: sortedOrder,
        activeMonth: nextActiveMonth
      };

      persistDataToDisk(next);

      if (activeMonthKey === monthKeyToDelete) {
        setActiveMonthKey(nextActiveMonth);
      }

      return next;
    });

    showToast(`Month "${monthKeyToDelete}" maintenance sheet deleted successfully! ✓`);
    return true;
  };

  // Sync entire chronological cash flow chain across all months
  const handleSyncChainedBalances = () => {
    setData(prev => {
      const sorted = sortMonthsChronologically(prev.monthOrder);
      const syncedMonths = syncAllChainedBalances(prev.months, sorted);
      const next = {
        ...prev,
        months: syncedMonths
      };
      persistDataToDisk(next);
      return next;
    });
    showToast('Multi-month cash flow chain synced successfully! 🔄✓');
  };

  const handleExportExcel = async () => {
    try {
      await exportToExcel(activeMonthKey, currentMonthData, data.buildingName);
      showToast(`Excel downloaded for ${activeMonthKey}! 📊`);
    } catch (e) {
      console.error('Export error:', e);
      showToast('Error exporting Excel');
    }
  };

  const handleRestoreData = (restored) => {
    setData(restored);
    setActiveMonthKey(restored.monthOrder[0]);
    showToast('Backup restored successfully! 📂');
  };

  // Record a discrepancy resolution or adjustment note into permanent Error Audit Log
  const handleRecordAuditEntry = (entry) => {
    if (!entry) return;
    const auditRecord = {
      id: entry.id || `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      dateStr: entry.dateStr || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: entry.timeStr || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      monthKey: entry.monthKey || activeMonthKey,
      monthName: entry.monthName || currentMonthData?.name || activeMonthKey,
      sno: entry.sno !== undefined ? entry.sno : null,
      flat: entry.flat || '',
      name: entry.name || '',
      actionType: entry.actionType || 'note_adjustment', // 'value_fix', 'chain_fix', 'note_adjustment', 'manual_note'
      field: entry.field || 'arrears',
      oldValue: entry.oldValue,
      resolvedValue: entry.resolvedValue,
      expected: entry.expected,
      actual: entry.actual,
      diff: entry.diff,
      clashTitle: entry.clashTitle || 'Discrepancy Logged',
      resolutionNote: entry.resolutionNote || entry.note || '',
      status: entry.status || 'fixed' // 'fixed', 'adjusted_with_note', 'active'
    };

    setData(prev => {
      const existingLogs = Array.isArray(prev.errorAuditLog) ? prev.errorAuditLog : [];
      // If updating a note for the same flat in the same month, replace or prepend
      const nextLogs = [auditRecord, ...existingLogs.filter(l => !(l.monthKey === auditRecord.monthKey && l.flat === auditRecord.flat && l.actionType === auditRecord.actionType && auditRecord.actionType === 'note_adjustment'))];
      const next = {
        ...prev,
        errorAuditLog: nextLogs
      };
      persistDataToDisk(next);
      return next;
    });
  };

  const handleClearAuditLog = () => {
    setData(prev => {
      const next = {
        ...prev,
        errorAuditLog: []
      };
      persistDataToDisk(next);
      return next;
    });
    showToast('Error & Audit Log cleared! 🗑️');
  };

  const handleDeleteAuditEntry = (entryId) => {
    if (!entryId) return;
    setData(prev => {
      const existingLogs = Array.isArray(prev.errorAuditLog) ? prev.errorAuditLog : [];
      const next = {
        ...prev,
        errorAuditLog: existingLogs.filter(e => e.id !== entryId)
      };
      persistDataToDisk(next);
      return next;
    });
    showToast('Audit entry removed! ✓');
  };

  // Feature 2: Cell-by-cell edit history log
  const handleRecordCellChange = (changeRecord) => {
    if (!changeRecord) return;
    const record = {
      id: `cell_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      dateStr: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      monthKey: changeRecord.monthKey || activeMonthKey,
      flat: changeRecord.flat || '',
      name: changeRecord.name || '',
      field: changeRecord.field,
      oldValue: changeRecord.oldValue,
      newValue: changeRecord.newValue,
      userNote: changeRecord.userNote || ''
    };
    setData(prev => {
      const existing = Array.isArray(prev.cellChangeHistory) ? prev.cellChangeHistory : [];
      const nextList = [record, ...existing].slice(0, 300);
      const next = { ...prev, cellChangeHistory: nextList };
      persistDataToDisk(next);
      return next;
    });
  };

  // Feature 6: Defaulters Aging & Reminder History Log
  const handleRecordDefaulterNotice = (noticeRecord) => {
    if (!noticeRecord) return;
    const record = {
      id: `notice_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      dateStr: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      monthKey: noticeRecord.monthKey || activeMonthKey,
      flat: noticeRecord.flat || '',
      name: noticeRecord.name || '',
      phone: noticeRecord.phone || '',
      agingCategory: noticeRecord.agingCategory || '1m',
      arrears: noticeRecord.arrears || 0,
      noticeType: noticeRecord.noticeType || 'WhatsApp Reminder',
      messageSnippet: noticeRecord.messageSnippet || ''
    };
    setData(prev => {
      const existing = Array.isArray(prev.defaulterNoticeLog) ? prev.defaulterNoticeLog : [];
      const nextList = [record, ...existing].slice(0, 200);
      const next = { ...prev, defaulterNoticeLog: nextList };
      persistDataToDisk(next);
      return next;
    });
    showToast(`Notice sent & logged to Defaulters History for Flat ${noticeRecord.flat}! ⚠️✓`);
  };

  // Dynamic Vendors Manager
  const handleUpdateVendors = (updatedVendors) => {
    setData((prev) => {
      const next = {
        ...prev,
        vendors: updatedVendors
      };
      persistDataToDisk(next);
      return next;
    });
  };

  // Add Expense to Specific Month (Linked to Vendor or General)
  const handleAddExpenseToMonth = (monthKey, expenseObj) => {
    setData((prev) => {
      const targetKey = monthKey || activeMonthKey;
      const mData = prev.months[targetKey];
      if (!mData) return prev;

      const existingExp = Array.isArray(mData.expenses) ? mData.expenses : [];
      const newExp = {
        id: Date.now(),
        desc: expenseObj.desc || 'Vendor Payment',
        amount: Number(expenseObj.amount || 0),
        details: expenseObj.details || '',
        paidTo: expenseObj.paidTo || ''
      };

      const updatedMonths = {
        ...prev.months,
        [targetKey]: {
          ...mData,
          expenses: [...existingExp, newExp]
        }
      };

      const synced = syncAllChainedBalances(updatedMonths, prev.monthOrder);
      const next = {
        ...prev,
        months: synced
      };
      persistDataToDisk(next);
      return next;
    });
  };

  // Page Title mapping
  const pageTitles = {
    dashboard: t.navDashboard,
    collections: t.navCollections,
    expenses: t.navExpenses,
    'bills-whatsapp': t.navBillsWhatsApp || 'Bills & WhatsApp Hub',
    'vendor-ledger': t.navVendorLedger || 'Vendor Ledger',
    'special-funds': t.navSpecialFunds || 'Special Funds',
    residents: t.navResidents,
    'errors-audit': t.navErrorsAudit || 'Errors & Audit Log',
    overview: t.navOverview,
    export: t.navExport
  };

  // If not logged in, show Secure Login Screen
  if (!isAuthenticated) {
    return (
      <LoginPage
        buildingName={data.buildingName}
        storedAuth={authConfig}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-slate-100 flex ${isRTL ? 'font-urdu' : 'font-sans'}`}
    >
      {/* Collapsible Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        activeMonthKey={activeMonthKey}
        currentMonthData={currentMonthData}
        isFinalized={isFinalized}
        t={t}
        lang={lang}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        auditLogCount={data.errorAuditLog?.length || 0}
        onLogout={handleLogout}
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        onOpenVaultModal={() => setIsVaultModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
        {/* Top Navbar */}
        <Navbar
          onOpenSidebar={() => setIsSidebarOpen(true)}
          activePageTitle={pageTitles[activePage]}
          monthOrder={data.monthOrder}
          activeMonthKey={activeMonthKey}
          allMonthsData={data.months}
          currentMonthData={currentMonthData}
          onChangeMonth={setActiveMonthKey}
          onOpenNewMonthModal={() => setIsMonthModalOpen(true)}
          onOpenEditMonthModal={() => setIsEditMonthModalOpen(true)}
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
          onExportExcel={handleExportExcel}
          isFinalized={isFinalized}
          onToggleFinalize={handleToggleFinalize}
          lang={lang}
          onChangeLang={setLang}
          t={t}
        />

        {/* Automatic Safety Backup Reminder Banner */}
        {backupReminder.isDue && !dismissReminder && (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-xs px-4 py-2 flex items-center justify-between shadow-md z-20">
            <div className="flex items-center gap-2">
              <span className="text-base">💾</span>
              <span className="font-bold">
                ڈیٹا سیفٹی یاددہانی: پچھلے {backupReminder.daysSince} دنوں سے کمپیوٹر پر بیک اپ محفوظ نہیں کیا گیا۔ اپنی بلڈنگ فائل محفوظ رکھیں۔
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const ok = await exportMasterBackupToDisk(data);
                  if (ok) {
                    showToast('Master backup file saved to PC! 💾✓');
                    setDismissReminder(true);
                  }
                }}
                className="bg-white hover:bg-slate-100 text-slate-900 font-black px-3 py-1 rounded-xl text-xs transition cursor-pointer shadow-xs"
              >
                1-Click بیک اپ ڈاؤن لوڈ
              </button>
              <button
                onClick={() => setDismissReminder(true)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Page Body Viewport */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto relative z-10">
          <ErrorBoundary onReset={() => setActivePage('dashboard')}>
            {activePage === 'dashboard' && (
              <DashboardPage
                currentMonthData={currentMonthData}
                activeMonthKey={activeMonthKey}
                allMonthsData={data.months}
                monthOrder={data.monthOrder}
                onNavigate={setActivePage}
                buildingName={data.buildingName}
                t={t}
                lang={lang}
                onNotify={showToast}
                onOpenEditMonthModal={() => setIsEditMonthModalOpen(true)}
                onSelectMonth={(k) => {
                  setActiveMonthKey(k);
                  showToast(`Switched to month ${k}!`);
                }}
                onUpdateFlats={handleUpdateFlats}
                onUpdatePrevSavings={(newVal, mKey) => handleUpdatePrevSavings(newVal, mKey || activeMonthKey)}
                onSyncChainBalances={handleSyncChainedBalances}
                onRecordAuditEntry={handleRecordAuditEntry}
                onRecordDefaulterNotice={handleRecordDefaulterNotice}
              />
            )}

            {activePage === 'collections' && (
              <CollectionsPage
                flats={currentMonthData?.flats || []}
                onUpdateFlats={handleUpdateFlats}
                expenses={currentMonthData?.expenses || []}
                prevSavings={Number(currentMonthData?.prevSavings || 0)}
                monthName={currentMonthData?.name || activeMonthKey}
                dateStr={currentMonthData?.dateStr || ''}
                onUpdateDate={handleUpdateDate}
                buildingName={data.buildingName}
                isFinalized={isFinalized}
                onToggleFinalize={handleToggleFinalize}
                onNavigate={setActivePage}
                t={t}
                lang={lang}
                onNotify={showToast}
                monthOrder={data.monthOrder}
                activeMonthKey={activeMonthKey}
                systemActiveMonth={data.activeMonth || data.monthOrder[0]}
                allMonthsData={data.months}
                onChangeMonth={setActiveMonthKey}
                onOpenNewMonthModal={() => setIsMonthModalOpen(true)}
                onOpenEditMonthModal={() => setIsEditMonthModalOpen(true)}
                onSyncChainBalances={handleSyncChainedBalances}
                residentDirectory={data.residentDirectory || []}
                onUpdateMonthFlats={handleUpdateMonthFlats}
                onUpdatePrevSavings={(newVal, mKey) => handleUpdatePrevSavings(newVal, mKey || activeMonthKey)}
                onRecordAuditEntry={handleRecordAuditEntry}
                onAddContraExpense={handleAddContraExpense}
                onRecordCellChange={handleRecordCellChange}
                onRecordDefaulterNotice={handleRecordDefaulterNotice}
              />
            )}

            {activePage === 'expenses' && (
              <ExpensesPage
                expenses={currentMonthData?.expenses || []}
                flats={currentMonthData?.flats || []}
                buildingName={data.buildingName}
                onUpdateExpenses={handleUpdateExpenses}
                prevSavings={Number(currentMonthData?.prevSavings || 0)}
                onUpdatePrevSavings={(newVal) => handleUpdatePrevSavings(newVal, activeMonthKey)}
                onBatchUpdatePrevSavings={handleBatchUpdatePrevSavings}
                activeMonthKey={activeMonthKey}
                dateStr={currentMonthData?.dateStr || ''}
                onUpdateDate={handleUpdateDate}
                totalCollected={(currentMonthData?.flats || []).reduce((acc, f) => acc + (f && f.status !== 'closed' ? Number(f.paid || 0) : 0), 0)}
                isFinalized={isFinalized}
                onToggleFinalize={handleToggleFinalize}
                onNavigate={setActivePage}
                monthName={currentMonthData?.name || activeMonthKey}
                t={t}
                lang={lang}
                onNotify={showToast}
                onSyncChainBalances={handleSyncChainedBalances}
                allMonthsData={data.months}
                monthOrder={data.monthOrder}
                onSelectMonth={(k) => {
                  setActiveMonthKey(k);
                  showToast(`Switched to month ${k}!`);
                }}
              />
            )}

            {activePage === 'bills-whatsapp' && (
              <BillsWhatsAppPage
                currentMonthData={currentMonthData}
                activeMonthKey={activeMonthKey}
                allMonthsData={data.months}
                monthOrder={data.monthOrder}
                onSelectMonth={(k) => {
                  setActiveMonthKey(k);
                  showToast(`Switched to month ${k}!`);
                }}
                buildingName={data.buildingName}
                specialFunds={data.specialFunds || []}
                lang={lang}
                t={t}
                onNotify={showToast}
              />
            )}

            {activePage === 'vendor-ledger' && (
              <VendorLedgerPage
                vendors={data.vendors || INITIAL_VENDORS}
                onUpdateVendors={handleUpdateVendors}
                allMonthsData={data.months}
                monthOrder={data.monthOrder}
                activeMonthKey={activeMonthKey}
                onAddExpenseToMonth={handleAddExpenseToMonth}
                buildingName={data.buildingName}
                lang={lang}
                t={t}
                onNotify={showToast}
              />
            )}

            {activePage === 'residents' && (
              <ResidentsPage
                residentDirectory={data.residentDirectory || []}
                onUpdateDirectory={handleUpdateResidentDirectory}
                currentFlats={currentMonthData?.flats || []}
                onUpdateFlats={handleUpdateFlats}
                buildingName={data.buildingName}
                isFinalized={isFinalized}
                t={t}
                lang={lang}
                onNotify={showToast}
              />
            )}

            {activePage === 'special-funds' && (
              <SpecialFundsPage
                specialFunds={data.specialFunds || []}
                onUpdateSpecialFunds={handleUpdateSpecialFunds}
                residentDirectory={data.residentDirectory || []}
                buildingName={data.buildingName}
                lang={lang}
                t={t}
                onNotify={showToast}
                onNavigate={setActivePage}
              />
            )}

            {activePage === 'errors-audit' && (
              <ErrorsAuditPage
                errorAuditLog={data.errorAuditLog || []}
                cellChangeHistory={data.cellChangeHistory || []}
                defaulterNoticeLog={data.defaulterNoticeLog || []}
                onClearAuditLog={handleClearAuditLog}
                onDeleteAuditEntry={handleDeleteAuditEntry}
                allMonthsData={data.months}
                monthOrder={data.monthOrder}
                activeMonthKey={activeMonthKey}
                onSelectMonth={(k) => {
                  setActiveMonthKey(k);
                  showToast(`Switched to month ${k}!`);
                }}
                onNavigate={setActivePage}
                buildingName={data.buildingName}
                lang={lang}
                t={t}
                onNotify={showToast}
              />
            )}

            {activePage === 'overview' && (
              <AnnualOverviewPage
                allMonthsData={data.months}
                monthOrder={data.monthOrder}
                activeMonthKey={activeMonthKey}
                onSelectMonth={(k) => {
                  setActiveMonthKey(k);
                  showToast(`Switched to month ${k}!`);
                }}
                buildingName={data.buildingName}
                onNavigate={setActivePage}
                onNotify={showToast}
                onOpenEditMonthModal={() => setIsEditMonthModalOpen(true)}
                t={t}
                lang={lang}
              />
            )}

            {activePage === 'export' && (
              <ExportPage
                activeMonthKey={activeMonthKey}
                currentMonthData={currentMonthData}
                allData={data}
                buildingName={data.buildingName}
                onRestoreData={handleRestoreData}
                onSelectMonth={(k) => {
                  setActiveMonthKey(k);
                  showToast(`Switched to month ${k}!`);
                }}
                t={t}
                lang={lang}
                onNotify={showToast}
              />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* New Month Creation Modal */}
      <MonthModal
        isOpen={isMonthModalOpen}
        onClose={() => setIsMonthModalOpen(false)}
        onCreateMonth={handleCreateMonth}
        currentMonthKey={activeMonthKey}
        allMonthsData={data.months}
        monthOrder={data.monthOrder}
        suggestedBalance={
          (currentMonthData?.flats || []).reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.paid || 0) : 0), 0) +
          Number(currentMonthData?.prevSavings || 0) -
          (currentMonthData?.expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0)
        }
      />

      {/* Month Edit & Delete Modal */}
      <EditMonthModal
        isOpen={isEditMonthModalOpen}
        onClose={() => setIsEditMonthModalOpen(false)}
        activeMonthKey={activeMonthKey}
        allMonthsData={data.months}
        monthOrder={data.monthOrder}
        onEditMonth={handleEditMonth}
        onDeleteMonth={handleDeleteMonth}
        buildingName={data.buildingName}
        lang={lang}
      />

      {/* Universal Global Search Modal (Ctrl + K) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        allMonthsData={data.months}
        monthOrder={data.monthOrder}
        activeMonthKey={activeMonthKey}
        vendors={data.vendors || INITIAL_VENDORS}
        specialFunds={data.specialFunds || []}
        residentDirectory={data.residentDirectory || []}
        onNavigate={setActivePage}
        onSelectMonth={setActiveMonthKey}
        buildingName={data.buildingName}
        lang={lang}
        onNotify={showToast}
      />

      {/* Change Admin Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        currentStoredPassword={authConfig.password || '123'}
        onUpdatePassword={handleUpdatePassword}
        onNotify={showToast}
      />

      {/* Local Safety Vault & Snapshot History Modal */}
      <StorageVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        allData={data}
        onRestoreSnapshot={(restored) => {
          setData(restored);
          persistDataToDisk(restored);
          if (restored.activeMonth) {
            setActiveMonthKey(restored.activeMonth);
          }
          showToast('System snapshot restored successfully! 🛡️✓');
        }}
        onNotify={showToast}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 start-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs sm:text-sm py-2.5 px-5 rounded-full shadow-2xl z-50 flex items-center gap-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

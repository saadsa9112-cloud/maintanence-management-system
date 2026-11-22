import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Calendar,
  Plus,
  FileSpreadsheet,
  Lock,
  Unlock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Edit3,
  Search,
  Globe
} from 'lucide-react';
import { sortMonthsChronologically } from '../utils/monthUtils';

export default function Navbar({
  onOpenSidebar,
  activePageTitle,
  monthOrder = [],
  activeMonthKey,
  allMonthsData = {},
  currentMonthData,
  onChangeMonth,
  onOpenNewMonthModal,
  onOpenEditMonthModal,
  onOpenGlobalSearch,
  onExportExcel,
  isFinalized,
  onToggleFinalize,
  lang,
  onChangeLang,
  t
}) {
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsMonthDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sort months chronologically
  const sortedMonths = sortMonthsChronologically(monthOrder);
  const currentIndex = sortedMonths.indexOf(activeMonthKey);
  const prevMonthKey = currentIndex > 0 ? sortedMonths[currentIndex - 1] : null;
  const nextMonthKey = currentIndex < sortedMonths.length - 1 ? sortedMonths[currentIndex + 1] : null;

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 sm:px-6 transition-all shadow-2xs">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        
        {/* Left: Mobile Menu Toggle + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition border border-slate-200 cursor-pointer shrink-0"
            title="Open Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline">ERP</span>
              <span className="text-xs text-slate-300 hidden sm:inline">/</span>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight truncate">
                {activePageTitle}
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-0.5">
              <span>Al-Mustafa Heights 5-E-18/19</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Cloud & Disk Active
              </span>
            </div>
          </div>
        </div>

        {/* Center: Precision Month Navigation Segment */}
        <div className="flex items-center justify-center shrink-0">
          <div className="relative inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs" ref={dropdownRef}>
            {/* Previous Month Arrow */}
            <button
              onClick={() => prevMonthKey && onChangeMonth(prevMonthKey)}
              disabled={!prevMonthKey}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white transition disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer"
              title={prevMonthKey ? `Previous (${prevMonthKey})` : 'No previous month'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Active Month Trigger Pill */}
            <button
              onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
              className="px-3 h-7 rounded-lg bg-white text-slate-900 hover:text-blue-700 font-bold text-xs shadow-2xs border border-slate-200/80 flex items-center gap-1.5 sm:gap-2 transition cursor-pointer hover:bg-slate-50"
              title="Click to switch active month"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="tracking-wide uppercase text-[11px] font-extrabold">{activeMonthKey} 2026</span>
              {isFinalized ? (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded shrink-0">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Locked</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded shrink-0">
                  <Unlock className="w-2.5 h-2.5" />
                  <span>Open</span>
                </span>
              )}
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Next Month Arrow */}
            <button
              onClick={() => nextMonthKey && onChangeMonth(nextMonthKey)}
              disabled={!nextMonthKey}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white transition disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer"
              title={nextMonthKey ? `Next (${nextMonthKey})` : 'No next month'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Quick Edit Month Sheet Button */}
            {onOpenEditMonthModal && (
              <button
                onClick={onOpenEditMonthModal}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white transition cursor-pointer border-l border-slate-200 ml-0.5"
                title="Edit Month Details or Delete Month"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Dropdown Menu for Months */}
            {isMonthDropdownOpen && (
              <div className="absolute top-full mt-2 start-1/2 -translate-x-1/2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in duration-150 space-y-2">
                <div className="px-2 py-1 flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Active Month
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    {sortedMonths.length} Months
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto grid grid-cols-2 gap-1.5 p-0.5">
                  {sortedMonths.map((key) => {
                    const mData = (allMonthsData && allMonthsData[key]) || {};
                    const isCurrent = key === activeMonthKey;
                    const isMonthLocked = Boolean(mData.finalized);

                    return (
                      <button
                        key={key}
                        onClick={() => {
                          onChangeMonth(key);
                          setIsMonthDropdownOpen(false);
                        }}
                        className={`p-2 rounded-xl border text-start transition flex items-center justify-between cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-600 text-white font-bold shadow-xs border-blue-600'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate">
                            {key}
                          </div>
                          {mData.urduName && (
                            <div className={`text-[10px] font-urdu truncate ${isCurrent ? 'text-blue-100' : 'text-slate-400'}`}>
                              {mData.urduName}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isMonthLocked ? (
                            <Lock className={`w-3 h-3 ${isCurrent ? 'text-blue-100' : 'text-amber-600'}`} />
                          ) : (
                            <Unlock className={`w-3 h-3 ${isCurrent ? 'text-blue-100' : 'text-emerald-600'}`} />
                          )}
                          {isCurrent && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsMonthDropdownOpen(false);
                      onOpenNewMonthModal();
                    }}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Month</span>
                  </button>
                  {onOpenEditMonthModal && (
                    <button
                      onClick={() => {
                        setIsMonthDropdownOpen(false);
                        onOpenEditMonthModal();
                      }}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit Month</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions (Search, New Month, Language, Export) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Universal Search (Ctrl + K) */}
          <button
            onClick={onOpenGlobalSearch}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-xl text-xs font-bold transition border border-slate-200 cursor-pointer shadow-2xs"
            title="Search flats, residents, expenses (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden xl:inline text-slate-600">Search</span>
            <kbd className="hidden sm:inline-block bg-white px-1.5 py-0.2 rounded text-[10px] font-mono font-bold text-slate-500 border border-slate-200">
              Ctrl K
            </kbd>
          </button>

          {/* New Month Button */}
          <button
            onClick={onOpenNewMonthModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 px-3 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
            title="Create next month maintenance sheet"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ New Month</span>
          </button>

          {/* Export Excel Button */}
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="hidden lg:flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs py-1.5 px-3 rounded-xl transition cursor-pointer shadow-2xs"
              title="Export current month to Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export</span>
            </button>
          )}

          {/* Clean Language Segmented Control */}
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => onChangeLang('en')}
              className={`px-2 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                lang === 'en' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onChangeLang('roman')}
              className={`px-2 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                lang === 'roman' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Roman
            </button>
            <button
              onClick={() => onChangeLang('ur')}
              className={`px-2 py-1 rounded-lg transition cursor-pointer text-[11px] font-urdu ${
                lang === 'ur' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              اردو
            </button>
          </div>

          {/* Finalize / Lock Toggle */}
          {onToggleFinalize && (
            <button
              onClick={onToggleFinalize}
              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                isFinalized
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
              title={isFinalized ? 'Unlock Month for Editing' : 'Finalize & Lock Month Records'}
            >
              {isFinalized ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

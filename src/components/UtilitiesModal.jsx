import React, { useState } from 'react';
import {
  Droplets,
  Zap,
  Plus,
  Trash2,
  X,
  Check,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Receipt
} from 'lucide-react';

export default function UtilitiesModal({
  isOpen,
  onClose,
  activeMonthName = 'October 2026',
  onAddExpenseFromUtility,
  onNotify
}) {
  const [activeTab, setActiveTab] = useState('tankers'); // 'tankers' | 'meter'

  // Tankers state
  const [tankers, setTankers] = useState([
    { id: 1, date: '04-Oct-2026', capacity: '2000 Gallons', vendor: 'المدینہ واٹر سپلائی', cost: 2600, status: 'Paid' },
    { id: 2, date: '12-Oct-2026', capacity: '2000 Gallons', vendor: 'المدینہ واٹر سپلائی', cost: 2600, status: 'Paid' },
    { id: 3, date: '19-Oct-2026', capacity: '1000 Gallons', vendor: 'غلام رسول واٹر', cost: 1800, status: 'Paid' }
  ]);

  const [newDate, setNewDate] = useState('25-Oct-2026');
  const [newCapacity, setNewCapacity] = useState('2000 Gallons');
  const [newVendor, setNewVendor] = useState('المدینہ واٹر سپلائی');
  const [newCost, setNewCost] = useState('2600');

  // Sub-Meter state
  const [prevReading, setPrevReading] = useState(14250);
  const [currReading, setCurrReading] = useState(14820);
  const [ratePerUnit, setRatePerUnit] = useState(48);

  if (!isOpen) return null;

  const totalTankerCost = tankers.reduce((acc, t) => acc + Number(t.cost || 0), 0);
  const unitsConsumed = Math.max(0, Number(currReading) - Number(prevReading));
  const totalElectricityCost = unitsConsumed * Number(ratePerUnit || 0);

  const handleAddTanker = (e) => {
    e.preventDefault();
    if (!newCost || Number(newCost) <= 0) return;
    const entry = {
      id: Date.now(),
      date: newDate,
      capacity: newCapacity,
      vendor: newVendor,
      cost: Number(newCost),
      status: 'Paid'
    };
    setTankers([...tankers, entry]);
    if (onNotify) onNotify('Water tanker recorded! 💧');
  };

  const handleDeleteTanker = (id) => {
    setTankers(tankers.filter(t => t.id !== id));
  };

  const handleSyncTankersToExpenses = () => {
    if (tankers.length === 0) return;
    if (onAddExpenseFromUtility) {
      onAddExpenseFromUtility({
        desc: `واٹر ٹینکرز (${tankers.length} عدد)`,
        amount: totalTankerCost,
        details: `${tankers.length} tankers (${activeMonthName})`
      });
      if (onNotify) onNotify(`Rs. ${totalTankerCost.toLocaleString('en-US')} added to Monthly Expenses! ✓`);
      onClose();
    }
  };

  const handleSyncMeterToExpenses = () => {
    if (totalElectricityCost <= 0) return;
    if (onAddExpenseFromUtility) {
      onAddExpenseFromUtility({
        desc: 'مشترکہ بجلی سب میٹر (موٹر و لفٹ)',
        amount: totalElectricityCost,
        details: `${unitsConsumed} units @ Rs. ${ratePerUnit}/unit`
      });
      if (onNotify) onNotify(`Rs. ${totalElectricityCost.toLocaleString('en-US')} added to Monthly Expenses! ✓`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="backdrop-blur-2xl bg-white/95 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.5)] border border-white/80 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/20 font-black">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <span>پانی کے ٹینکر اور سب میٹر یوٹیلیٹی لاگ</span>
                <span className="text-[10px] bg-cyan-500/15 text-cyan-800 font-bold px-2 py-0.5 rounded-full border border-cyan-400/30">
                  Smart Utilities
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Track water tankers & electric units and sync automatically to Monthly Expenses ({activeMonthName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-slate-200/70 flex gap-2">
          <button
            onClick={() => setActiveTab('tankers')}
            className={`pb-2.5 px-3 text-xs font-black transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'tankers'
                ? 'border-cyan-600 text-cyan-900 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Droplets className="w-4 h-4 text-cyan-600" />
            <span>Water Tankers Log ({tankers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('meter')}
            className={`pb-2.5 px-3 text-xs font-black transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'meter'
                ? 'border-amber-600 text-amber-900 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Electricity Sub-Meter Calculator</span>
          </button>
        </div>

        {/* Tab 1: Water Tankers */}
        {activeTab === 'tankers' && (
          <div className="p-4 sm:p-6 space-y-5">
            {/* KPI Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-cyan-50/80 border border-cyan-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-cyan-800">Total Tankers Ordered</span>
                  <h4 className="text-xl font-black text-cyan-950 mt-0.5">{tankers.length} Bowsers</h4>
                </div>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-700 flex items-center justify-center font-bold">
                  <Droplets className="w-5 h-5" />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-800">Total Water Expenses</span>
                  <h4 className="text-xl font-black text-blue-950 mt-0.5">Rs. {totalTankerCost.toLocaleString('en-US')}</h4>
                </div>
                <button
                  onClick={handleSyncTankersToExpenses}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                  title="Auto-insert this total into active month expenses"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>+ Auto-Add to Expenses</span>
                </button>
              </div>
            </div>

            {/* Log Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-2 text-center">#</th>
                      <th className="p-2 text-start">Date</th>
                      <th className="p-2 text-start">Capacity</th>
                      <th className="p-2 text-start">Supplier</th>
                      <th className="p-2 text-end">Cost</th>
                      <th className="p-2 text-center">Status</th>
                      <th className="p-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {tankers.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-700">{t.date}</td>
                        <td className="p-2 font-bold text-slate-900">{t.capacity}</td>
                        <td className="p-2 font-urdu text-slate-800">{t.vendor}</td>
                        <td className="p-2 text-end font-mono font-black text-blue-900">Rs. {t.cost.toLocaleString('en-US')}</td>
                        <td className="p-2 text-center">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {t.status}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => handleDeleteTanker(t.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Add Tanker Form */}
            <form onSubmit={handleAddTanker} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                + Add Water Tanker Record:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Date (e.g. 25-Oct-2026)"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="bg-white p-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
                />
                <select
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="bg-white p-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
                >
                  <option value="1000 Gallons">1000 Gallons (Small)</option>
                  <option value="2000 Gallons">2000 Gallons (Standard)</option>
                  <option value="3000 Gallons">3000 Gallons (Heavy)</option>
                </select>
                <input
                  type="text"
                  placeholder="Supplier (e.g. المدینہ واٹر)"
                  value={newVendor}
                  onChange={(e) => setNewVendor(e.target.value)}
                  className="bg-white p-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
                />
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    placeholder="Cost (Rs)"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="w-full bg-white p-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
                  />
                  <button
                    type="submit"
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-3 rounded-xl text-xs transition shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Common Sub-Meter Calculator */}
        {activeTab === 'meter' && (
          <div className="p-4 sm:p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-xs text-amber-900 leading-relaxed font-medium">
              💡 Calculate common electricity consumption for water pumping motor, common corridors, and lift. Easily push the computed bill into the active month's Expenses.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Previous Reading (Units):
                </label>
                <input
                  type="number"
                  value={prevReading}
                  onChange={(e) => setPrevReading(Number(e.target.value) || 0)}
                  className="w-full text-lg font-mono font-black text-slate-900 p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Current Reading (Units):
                </label>
                <input
                  type="number"
                  value={currReading}
                  onChange={(e) => setCurrReading(Number(e.target.value) || 0)}
                  className="w-full text-lg font-mono font-black text-slate-900 p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Rate Per Unit (Rs.):
                </label>
                <input
                  type="number"
                  value={ratePerUnit}
                  onChange={(e) => setRatePerUnit(Number(e.target.value) || 0)}
                  className="w-full text-lg font-mono font-black text-slate-900 p-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            {/* Result Box */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-amber-900">
                  Total Units Consumed: <strong className="font-mono text-sm">{unitsConsumed} kWh</strong>
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  Total Bill: <span className="text-amber-700">Rs. {totalElectricityCost.toLocaleString('en-US')}</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Formula: ({currReading} - {prevReading}) × Rs. {ratePerUnit}
                </p>
              </div>

              <button
                onClick={handleSyncMeterToExpenses}
                className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Zap className="w-4 h-4" />
                <span>+ Sync to Monthly Expenses</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

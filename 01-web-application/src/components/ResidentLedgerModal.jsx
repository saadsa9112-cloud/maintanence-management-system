import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  MessageCircle,
  Copy,
  Check,
  Calendar,
  Building2,
  Wallet,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Phone,
  User,
  ShieldCheck,
  Edit2,
  Save,
  ArrowRight
} from 'lucide-react';
import { sortMonthsChronologically } from '../utils/monthUtils';
import { cleanPhoneNumber, openSingleReceiptWhatsApp } from '../utils/whatsapp';
import { formatResidentDisplayName } from '../utils/residentUtils';

export default function ResidentLedgerModal({
  isOpen,
  onClose,
  flat,
  allMonthsData = {},
  monthOrder = [],
  onUpdateMonthFlat,
  flatsList = [],
  onSelectFlat,
  buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19',
  lang = 'roman',
  onNotify
}) {
  const [editingMonthKey, setEditingMonthKey] = useState(null);
  const [editDateValue, setEditDateValue] = useState('');
  const [editPaidValue, setEditPaidValue] = useState('');
  const [copiedStatement, setCopiedStatement] = useState(false);

  const sortedMonthKeys = useMemo(() => {
    return sortMonthsChronologically(monthOrder && monthOrder.length > 0 ? monthOrder : Object.keys(allMonthsData || {}));
  }, [monthOrder, allMonthsData]);

  if (!isOpen || !flat) return null;

  // Build Chronological Ledger History for this specific flat across all existing months
  const ledgerHistory = useMemo(() => {
    return sortedMonthKeys.map(mKey => {
      const mData = allMonthsData[mKey] || {};
      const mName = mData.name || mKey;
      const monthDateStr = mData.dateStr || '';
      const flatList = mData.flats || [];
      const mFlat = flatList.find(f => f && (f.flat === flat.flat || f.sno === flat.sno));

      if (!mFlat) {
        return {
          monthKey: mKey,
          monthName: mName,
          monthDateStr,
          exists: false,
          isClosed: false,
          due: 0,
          priorArrears: 0,
          totalLiability: 0,
          paid: 0,
          paidDate: '',
          arrears: 0,
          advance: 0,
          status: 'none'
        };
      }

      const isClosed = mFlat.status === 'closed';
      const due = Number(mFlat.due || 0);
      const priorArr = mFlat.priorArrears !== undefined && mFlat.priorArrears !== null
        ? Number(mFlat.priorArrears) || 0
        : Math.max(0, (Number(mFlat.arrears || 0) + Number(mFlat.paid || 0)) - due);
      const paid = Number(mFlat.paid || 0);
      const totalLiability = due + priorArr;
      const arrears = Number(mFlat.arrears || 0);
      const advance = Math.max(0, paid - totalLiability);
      const paidDate = mFlat.paidDate || (paid > 0 ? (monthDateStr || 'Recorded') : '');

      return {
        monthKey: mKey,
        monthName: mName,
        monthDateStr,
        exists: true,
        isClosed,
        due,
        priorArrears: priorArr,
        totalLiability,
        paid,
        paidDate,
        arrears,
        advance,
        status: isClosed ? 'closed' : arrears === 0 ? 'paid' : (paid > 0 ? 'partial' : 'arrears'),
        rawFlat: mFlat
      };
    });
  }, [sortedMonthKeys, allMonthsData, flat]);

  // Aggregate Totals
  const lifetimeStats = useMemo(() => {
    let totalPaid = 0;
    let totalBilled = 0;
    let currentOutstanding = 0;
    let totalAdvance = 0;

    ledgerHistory.forEach(h => {
      if (!h.exists || h.isClosed) return;
      totalPaid += h.paid;
      totalBilled += h.due;
    });

    // The most recent chronological month has current ongoing arrears/advance
    const latestRecord = [...ledgerHistory].reverse().find(h => h.exists && !h.isClosed);
    if (latestRecord) {
      currentOutstanding = latestRecord.arrears;
      totalAdvance = latestRecord.advance;
    }

    return { totalPaid, totalBilled, currentOutstanding, totalAdvance };
  }, [ledgerHistory]);

  // Handle Editing Payment Date & Paid Amount directly in Ledger
  const handleStartEdit = (record) => {
    setEditingMonthKey(record.monthKey);
    setEditDateValue(record.paidDate || record.monthDateStr || new Date().toLocaleDateString('en-GB'));
    setEditPaidValue(record.paid);
  };

  const handleSaveEdit = (record) => {
    if (!onUpdateMonthFlat) return;
    const mData = allMonthsData[record.monthKey];
    if (!mData) return;

    const updatedFlats = (mData.flats || []).map(f => {
      if (f.flat === flat.flat || f.sno === flat.sno) {
        const newPaid = Number(editPaidValue) || 0;
        const due = Number(f.due) || 3000;
        const priorArr = f.priorArrears !== undefined ? Number(f.priorArrears) : 0;
        const totalLiability = due + priorArr;
        const newArrears = Math.max(0, totalLiability - newPaid);

        return {
          ...f,
          paid: newPaid,
          arrears: newArrears,
          paidDate: editDateValue.trim(),
          status: newArrears > 0 ? 'arrears' : 'paid'
        };
      }
      return f;
    });

    onUpdateMonthFlat(record.monthKey, updatedFlats);
    setEditingMonthKey(null);
    if (onNotify) onNotify(`Flat ${flat.flat} payment details updated for ${record.monthName}! ✓`);
  };

  // Build WhatsApp Account Statement message
  const handleSendWhatsAppStatement = () => {
    let msg = `📜 *${buildingName} — RESIDENT ACCOUNT STATEMENT*\n`;
    msg += `------------------------------------\n`;
    msg += `🏢 *Flat:* ${flat.flat} | *Resident:* ${formatResidentDisplayName(flat) || 'Mohtaram Rehayishi'}\n`;
    if (flat.phone) msg += `📞 *Phone:* ${flat.phone}\n`;
    msg += `------------------------------------\n`;
    msg += `📊 *SUMMARY:*\n`;
    msg += `• *Total Lifetime Paid:* Rs. ${lifetimeStats.totalPaid.toLocaleString('en-US')}\n`;
    msg += `• *Current Outstanding Dues:* Rs. ${lifetimeStats.currentOutstanding.toLocaleString('en-US')}\n`;
    if (lifetimeStats.totalAdvance > 0) {
      msg += `• *Advance Balance Credited:* Rs. ${lifetimeStats.totalAdvance.toLocaleString('en-US')}\n`;
    }
    msg += `------------------------------------\n`;
    msg += `📅 *MONTH-BY-MONTH RECORD:*\n`;

    ledgerHistory.forEach(h => {
      if (!h.exists) return;
      if (h.isClosed) {
        msg += `🔒 *${h.monthName}:* Flat Band/Closed (No Dues)\n`;
      } else {
        const dateTag = h.paidDate ? ` [Date: ${h.paidDate}]` : '';
        const statusTag = h.arrears === 0 ? '✅ Paid' : `⚠️ Arrears: Rs. ${h.arrears.toLocaleString('en-US')}`;
        msg += `• *${h.monthName}:* Paid: Rs. ${h.paid.toLocaleString('en-US')}${dateTag} — ${statusTag}\n`;
      }
    });

    msg += `------------------------------------\n`;
    msg += `${lifetimeStats.currentOutstanding === 0 ? '✨ *Account Status: Fully Clear!*' : 'Barah-e-karam baqaya adaigi jald az jald karein.'}\n\n`;
    msg += `Maintenance Managed by: *Hafiz Muhammad Saad*`;

    const phone = cleanPhoneNumber(flat.phone);
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleCopyStatement = () => {
    let msg = `📜 ${buildingName} — Statement for Flat ${flat.flat} (${formatResidentDisplayName(flat)})\n`;
    msg += `Current Arrears: Rs. ${lifetimeStats.currentOutstanding.toLocaleString('en-US')} | Total Paid: Rs. ${lifetimeStats.totalPaid.toLocaleString('en-US')}\n`;
    ledgerHistory.forEach(h => {
      if (h.exists && !h.isClosed) {
        msg += `${h.monthName}: Paid Rs. ${h.paid} on ${h.paidDate || 'N/A'}, Remaining: Rs. ${h.arrears}\n`;
      }
    });
    msg += `— Maintenance Managed by: Hafiz Muhammad Saad`;
    navigator.clipboard.writeText(msg);
    setCopiedStatement(true);
    if (onNotify) onNotify('Account statement text copied to clipboard! 📋');
    setTimeout(() => setCopiedStatement(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in no-print-overlay overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-4 sm:p-6 text-slate-900 relative space-y-4 my-auto max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-3 gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {flat.flat}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-slate-900">
                  {lang === 'ur' ? 'کھاتہ / لیجر' : 'Resident Individual Ledger & Statement'}
                </h3>
                <span className="font-semibold text-xs text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Flat {flat.flat} ({formatResidentDisplayName(flat) || 'Resident'})
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {buildingName} — Tarikh-war adaigi ka mukammal hisab kitab
              </p>
            </div>
          </div>

          {/* Quick Flat Switcher Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {flatsList && flatsList.length > 0 && onSelectFlat && (
              <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                <span className="font-medium text-slate-500 text-[11px]">Switch:</span>
                <select
                  value={flat.flat}
                  onChange={(e) => {
                    const selected = flatsList.find(f => f.flat === e.target.value);
                    if (selected) onSelectFlat(selected);
                  }}
                  className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
                >
                  {flatsList.map(f => (
                    <option key={f.flat} value={f.flat}>
                      Flat {f.flat} — {formatResidentDisplayName(f)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Key Lifetime Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          <div className="erp-card p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 block">
              💰 Total Lifetime Collected
            </span>
            <span className="text-lg font-bold text-slate-900 font-mono block mt-0.5">
              Rs. {lifetimeStats.totalPaid.toLocaleString('en-US')}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
              Across {ledgerHistory.filter(h => h.exists && h.paid > 0).length} recorded cycles
            </span>
          </div>

          <div className={`erp-card p-3.5 rounded-xl border shadow-xs ${
            lifetimeStats.currentOutstanding > 0
              ? 'border-rose-200 bg-rose-50/30'
              : 'border-slate-200/90'
          }`}>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-rose-700 block">
              ⚠️ Current Outstanding Arrears
            </span>
            <span className={`text-lg font-bold font-mono block mt-0.5 ${
              lifetimeStats.currentOutstanding > 0 ? 'text-rose-600' : 'text-slate-700'
            }`}>
              Rs. {lifetimeStats.currentOutstanding.toLocaleString('en-US')}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
              {lifetimeStats.currentOutstanding === 0 ? '✨ Fully Clear!' : 'Overdue balance pending'}
            </span>
          </div>

          <div className="erp-card p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-700 block">
              ⭐ Current Advance Balance
            </span>
            <span className="text-lg font-bold text-slate-900 font-mono block mt-0.5">
              Rs. {lifetimeStats.totalAdvance.toLocaleString('en-US')}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
              Credited for next billing cycle
            </span>
          </div>
        </div>

        {/* Chronological Month-by-Month Statement Table */}
        <div className="overflow-y-auto flex-1 rounded-2xl border border-slate-200/90 bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200 sticky top-0 z-10 select-none">
              <tr>
                <th className="p-3 text-center w-10">#</th>
                <th className="p-3 min-w-[120px]">Mahina (Month)</th>
                <th className="p-3 text-center min-w-[140px] text-purple-900 bg-purple-50/60" title="Wusooli ki tareekh (Directly Editable)">
                  📅 Tareekh-e-Wusooli (Payment Date)
                </th>
                <th className="p-3 text-center">Monthly Due</th>
                <th className="p-3 text-center">Prior Arrears</th>
                <th className="p-3 text-center text-emerald-800 bg-emerald-50/40">Wusool (Paid)</th>
                <th className="p-3 text-center text-rose-700">Remaining</th>
                <th className="p-3 text-center w-28">Status</th>
                <th className="p-3 text-center w-20 no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {ledgerHistory.map((rec, idx) => {
                const isEditing = editingMonthKey === rec.monthKey;

                if (!rec.exists) {
                  return (
                    <tr key={rec.monthKey} className="text-slate-400 bg-slate-50/40 italic">
                      <td className="p-2.5 text-center">{idx + 1}</td>
                      <td className="p-2.5">{rec.monthName}</td>
                      <td colSpan="7" className="p-2.5 text-center text-[11px]">
                        Is mahine ka record mojood nahi hai
                      </td>
                    </tr>
                  );
                }

                if (rec.isClosed) {
                  return (
                    <tr key={rec.monthKey} className="bg-amber-50/40 text-amber-900">
                      <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-bold">{rec.monthName}</td>
                      <td colSpan="6" className="p-2.5 text-center text-xs font-bold text-amber-800">
                        🔒 بند گھر (Vacant / Closed Unit) — No maintenance dues
                      </td>
                      <td className="p-2.5 text-center no-print">
                        <span className="text-[10px] font-bold bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-md">
                          Closed
                        </span>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={rec.monthKey}
                    className={`hover:bg-slate-50/80 transition ${
                      rec.arrears === 0 ? 'bg-emerald-50/20' : 'bg-rose-50/20'
                    }`}
                  >
                    <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                    
                    {/* Month Name */}
                    <td className="p-2.5">
                      <span className="font-extrabold text-slate-900 block text-xs">{rec.monthName}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{rec.monthDateStr}</span>
                    </td>

                    {/* EDITABLE PAYMENT DATE (Core User Requirement) */}
                    <td className="p-2.5 text-center bg-purple-50/30 border-x border-purple-100">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="text"
                            value={editDateValue}
                            onChange={(e) => setEditDateValue(e.target.value)}
                            placeholder="e.g. 28-Oct-2026"
                            className="w-28 text-center text-xs font-black bg-white border-2 border-purple-400 rounded-lg py-1 px-1.5 focus:outline-none"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => handleStartEdit(rec)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-purple-200 hover:border-purple-500 hover:shadow-xs transition cursor-pointer group"
                          title="Click to edit payment date"
                        >
                          <Calendar className="w-3 h-3 text-purple-600" />
                          <span className="font-mono font-bold text-xs text-purple-950">
                            {rec.paidDate || '— Set Date —'}
                          </span>
                          <Edit2 className="w-2.5 h-2.5 text-purple-400 group-hover:text-purple-700 opacity-60 group-hover:opacity-100" />
                        </div>
                      )}
                    </td>

                    {/* Monthly Due */}
                    <td className="p-2.5 text-center font-bold text-slate-700">
                      Rs. {rec.due.toLocaleString('en-US')}
                    </td>

                    {/* Prior Arrears */}
                    <td className="p-2.5 text-center font-bold text-amber-800">
                      {rec.priorArrears > 0 ? `Rs. ${rec.priorArrears.toLocaleString('en-US')}` : '—'}
                    </td>

                    {/* Paid Amount (Editable in edit mode) */}
                    <td className="p-2.5 text-center font-black text-emerald-800 bg-emerald-50/30">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editPaidValue}
                          onChange={(e) => setEditPaidValue(e.target.value)}
                          className="w-20 text-center text-xs font-black bg-white border-2 border-emerald-500 rounded-lg py-1 focus:outline-none"
                        />
                      ) : (
                        <span>Rs. {rec.paid.toLocaleString('en-US')}</span>
                      )}
                    </td>

                    {/* Remaining Arrears */}
                    <td className="p-2.5 text-center font-black text-rose-700">
                      {rec.arrears > 0 ? `Rs. ${rec.arrears.toLocaleString('en-US')}` : '0'}
                    </td>

                    {/* Status Badge */}
                    <td className="p-2.5 text-center">
                      {rec.arrears === 0 ? (
                        rec.advance > 0 ? (
                          <span className="text-[10px] font-black text-cyan-900 bg-cyan-100 border border-cyan-300 px-2 py-0.5 rounded-full inline-block">
                            +Rs. {rec.advance} Adv
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full inline-block">
                            ✓ Cleared
                          </span>
                        )
                      ) : rec.paid > 0 ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full inline-block">
                          Partial
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full inline-block">
                          ⚠️ Unpaid
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-2.5 text-center no-print">
                      <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                          <button
                            onClick={() => handleSaveEdit(rec)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
                            title="Save Changes"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(rec)}
                              className="p-1 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                              title="Edit date or payment"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => openSingleReceiptWhatsApp(rec.rawFlat, rec.monthName, buildingName, lang, rec.paidDate || rec.monthDateStr)}
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                              title="Send WhatsApp Receipt for this month"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Footer with Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            💡 Kisi bhi mahine ki <strong className="text-purple-900">Tareekh-e-Wusooli</strong> par click kar ke foran date tabdeel karein.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyStatement}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedStatement ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedStatement ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handleSendWhatsAppStatement}
              className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Statement to Resident</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Statement</span>
            </button>
          </div>
        </div>

        {/* Print Only Header & Footer Styles */}
        <div className="hidden print:block text-right text-xs text-slate-500 pt-4 border-t border-slate-300">
          Maintenance Managed by: <strong>Hafiz Muhammad Saad</strong> — {buildingName}
        </div>
      </div>
    </div>
  );
}

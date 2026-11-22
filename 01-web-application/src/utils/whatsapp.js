import { formatResidentDisplayName } from './residentUtils.js';

export function buildShortGroupWhatsAppMessage(
  monthName,
  unpaidList,
  totalArrears,
  buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19',
  lang = 'en',
  includeNames = true
) {
  const activeUnpaid = unpaidList.filter(d => d.status !== 'closed' && (Number(d.arrears) > 0 || Number(d.paid) < Number(d.due)));
  const closed = unpaidList.filter(d => d.status === 'closed');
  const formattedTotal = Number(totalArrears || 0).toLocaleString('en-US');
  const flatNumbersOnly = activeUnpaid.map(f => f.flat).join(', ');

  if (lang === 'en') {
    let msg = `📢 *${buildingName} — Maintenance Dues Alert (${monthName})*\n`;
    msg += `-----------------------------------\n`;

    if (!includeNames) {
      msg += `*Pending Flats (Flat Numbers Only):*\n`;
      let count = 1;
      activeUnpaid.forEach(item => {
        msg += `${count}. *Flat ${item.flat}*\n`;
        count++;
      });
      if (closed.length > 0) {
        msg += `\n🔒 *Closed / Vacant Flats:* ${closed.map(c => `Flat ${c.flat}`).join(', ')}\n`;
      }
      msg += `\n⚠️ *Total Pending Flats:* ${activeUnpaid.length} Units\n`;
      msg += `-----------------------------------\n`;
      msg += `Kindly clear the maintenance dues at your earliest convenience. Thank you!`;
      return msg;
    }

    let count = 1;
    activeUnpaid.forEach(item => {
      const arr = Number(item.arrears || (item.due - item.paid) || 0);
      msg += `${count}. *Flat ${item.flat}* (${formatResidentDisplayName(item)}): Rs. ${arr.toLocaleString('en-US')}\n`;
      count++;
    });

    if (closed.length > 0) {
      msg += `\n🔒 *Closed / Vacant Flats:* ${closed.map(c => `Flat ${c.flat} (${formatResidentDisplayName(c)})`).join(', ')}\n`;
    }

    msg += `\n⚠️ *Total Pending Arrears:* Rs. ${formattedTotal}\n`;
    msg += `-----------------------------------\n`;
    msg += `Kindly clear the maintenance dues at your earliest convenience. Thank you!`;
    return msg;
  } else if (lang === 'roman') {
    let msg = `📢 *${buildingName} — Baqaya Maintenance Alert (${monthName})*\n`;
    msg += `-----------------------------------\n`;

    if (!includeNames) {
      msg += `*Baqaya Flats (Sirf Flat Numbers):*\n`;
      let count = 1;
      activeUnpaid.forEach(item => {
        msg += `${count}. *Flat ${item.flat}*\n`;
        count++;
      });
      if (closed.length > 0) {
        msg += `\n🔒 *Band Flats:* ${closed.map(c => `Flat ${c.flat}`).join(', ')}\n`;
      }
      msg += `\n⚠️ *Kul Baqaya Flats:* ${activeUnpaid.length} Flats\n`;
      msg += `-----------------------------------\n`;
      msg += `Tamam hazrat se guzarish hai ke maintenance raqam jald az jald jama karwayen. Shukriya!`;
      return msg;
    }

    let count = 1;
    activeUnpaid.forEach(item => {
      const arr = Number(item.arrears || (item.due - item.paid) || 0);
      msg += `${count}. *Flat ${item.flat}* (${formatResidentDisplayName(item)}): Rs. ${arr.toLocaleString('en-US')}\n`;
      count++;
    });

    if (closed.length > 0) {
      msg += `\n🔒 *Band Flats:* ${closed.map(c => `Flat ${c.flat} (${formatResidentDisplayName(c)})`).join(', ')}\n`;
    }

    msg += `\n⚠️ *Kul Baqaya:* Rs. ${formattedTotal}\n`;
    msg += `-----------------------------------\n`;
    msg += `Tamam hazrat se guzarish hai ke maintenance raqam jald az jald jama karwayen. Shukriya!`;
    return msg;
  } else {
    // Urdu
    let msg = `📢 *${buildingName} — بقایا مینٹیننس (${monthName})*\n`;
    msg += `-----------------------------------\n`;

    if (!includeNames) {
      msg += `*بقایاجات والے فلیٹس (صرف فلیٹ نمبرز):*\n`;
      let count = 1;
      activeUnpaid.forEach(item => {
        msg += `${count}. *فلیٹ ${item.flat}*\n`;
        count++;
      });
      if (closed.length > 0) {
        msg += `\n🔒 *بند فلیٹس:* ${closed.map(c => `فلیٹ ${c.flat}`).join('، ')}\n`;
      }
      msg += `\n⚠️ *کُل بقایا فلیٹس:* ${activeUnpaid.length} فلیٹس\n`;
      msg += `-----------------------------------\n`;
      msg += `گزارش ہے کہ مینٹیننس واجبات جلد از جلد جمع کروائیں۔ شکریہ!`;
      return msg;
    }

    let count = 1;
    activeUnpaid.forEach(item => {
      const arr = Number(item.arrears || (item.due - item.paid) || 0);
      msg += `${count}. *فلیٹ ${item.flat}* (${formatResidentDisplayName(item)}): Rs. ${arr.toLocaleString('en-US')}\n`;
      count++;
    });

    if (closed.length > 0) {
      msg += `\n🔒 *بند فلیٹس:* ${closed.map(c => `فلیٹ ${c.flat} (${formatResidentDisplayName(c)})`).join('، ')}\n`;
    }

    msg += `\n⚠️ *کُل بقایا واجبات:* Rs. ${formattedTotal}\n`;
    msg += `-----------------------------------\n`;
    msg += `گزارش ہے کہ مینٹیننس واجبات جلد از جلد جمع کروائیں۔ شکریہ!`;
    return msg;
  }
}

export function buildPaidGroupWhatsAppMessage(
  monthName,
  paidList,
  totalCollected,
  buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19',
  lang = 'en',
  includeNames = false
) {
  const activePaid = paidList.filter(d => d.status !== 'closed' && (Number(d.paid) >= Number(d.due) || Number(d.paid) > 0));
  const flatNumbersOnly = activePaid.map(f => f.flat).join(', ');
  const formattedTotal = Number(totalCollected || 0).toLocaleString('en-US');

  if (lang === 'en') {
    let msg = `✅ *${buildingName} — Maintenance Received (${monthName})*\n`;
    msg += `-----------------------------------\n`;
    msg += `*Payment Received From (${activePaid.length} Flats${includeNames ? ' - With Details' : ' - Only Flat Names'}):*\n`;

    if (includeNames) {
      activePaid.forEach((f, i) => {
        msg += `${i + 1}. *Flat ${f.flat}* (${formatResidentDisplayName(f)}): Rs. ${Number(f.paid || 0).toLocaleString('en-US')} ✓\n`;
      });
      msg += `\n💰 *Total Collected:* Rs. ${formattedTotal}\n`;
    } else {
      msg += `${flatNumbersOnly || 'None yet'}\n\n`;
      msg += `✅ *Total Cleared Units:* ${activePaid.length} Flats\n`;
    }

    msg += `-----------------------------------\n`;
    msg += `Thank you for clearing your maintenance on time!`;
    return msg;
  } else if (lang === 'roman') {
    let msg = `✅ *${buildingName} — Wusool Shuda Maintenance (${monthName})*\n`;
    msg += `-----------------------------------\n`;
    msg += `*In Flats Ki Payment Receive Ho Chuki Hai (${activePaid.length} Flats${includeNames ? ' - With Details' : ' - Sirf Flat Numbers'}):*\n`;

    if (includeNames) {
      activePaid.forEach((f, i) => {
        msg += `${i + 1}. *Flat ${f.flat}* (${formatResidentDisplayName(f)}): Rs. ${Number(f.paid || 0).toLocaleString('en-US')} ✓\n`;
      });
      msg += `\n💰 *Kul Wusooli:* Rs. ${formattedTotal}\n`;
    } else {
      msg += `${flatNumbersOnly || 'Koi nahi'}\n\n`;
      msg += `✅ *Total Cleared Flats:* ${activePaid.length} Flats\n`;
    }

    msg += `-----------------------------------\n`;
    msg += `Waqt par payment jama karwane ka shukriya! JazakAllah!`;
    return msg;
  } else {
    // Urdu
    let msg = `✅ *${buildingName} — موصول شدہ مینٹیننس (${monthName})*\n`;
    msg += `-----------------------------------\n`;
    msg += `*ان فلیٹس کی فیس وصول ہو چکی ہے (${activePaid.length} فلیٹس${includeNames ? ' - تفصیلات کے ساتھ' : ' - صرف فلیٹ نمبرز'}):*\n`;

    if (includeNames) {
      activePaid.forEach((f, i) => {
        msg += `${i + 1}. *فلیٹ ${f.flat}* (${formatResidentDisplayName(f)}): Rs. ${Number(f.paid || 0).toLocaleString('en-US')} ✓\n`;
      });
      msg += `\n💰 *کُل وصولی:* Rs. ${formattedTotal}\n`;
    } else {
      msg += `${activePaid.map(f => f.flat).join('، ') || 'کوئی نہیں'}\n\n`;
      msg += `✅ *کُل کلیئر شدہ فلیٹس:* ${activePaid.length} فلیٹس\n`;
    }

    msg += `-----------------------------------\n`;
    msg += `وقت پر فیس جمع کروانے کا بہت شکریہ! جزاک اللہ!`;
    return msg;
  }
}

export function openGroupWhatsApp(monthName, unpaidList, totalArrears, buildingName, lang = 'en', includeNames = true) {
  const msg = buildShortGroupWhatsAppMessage(monthName, unpaidList, totalArrears, buildingName, lang, includeNames);
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

export function openPaidGroupWhatsApp(monthName, paidList, totalCollected, buildingName, lang = 'en', includeNames = false) {
  const msg = buildPaidGroupWhatsAppMessage(monthName, paidList, totalCollected, buildingName, lang, includeNames);
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

export function buildSingleReceiptMessage(flat, monthName, buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19', lang = 'en', dateStr = '') {
  const receiptNo = `AMH-${monthName.replace(/\s+/g, '').toUpperCase()}-${flat.flat}`;
  const dueNum = Number(flat.due || 0);
  const paidNum = Number(flat.paid || 0);
  const arrearsNum = Number(flat.arrears || 0);
  const priorArrNum = flat.priorArrears !== undefined && flat.priorArrears !== null
    ? Number(flat.priorArrears) || 0
    : Math.max(0, (arrearsNum + paidNum) - dueNum);
  const totalLiability = dueNum + priorArrNum;
  const arrearsCleared = priorArrNum > 0 ? Math.min(priorArrNum, Math.max(0, paidNum - dueNum)) : 0;
  const trueAdvance = Math.max(0, paidNum - totalLiability);
  const date = dateStr || new Date().toLocaleDateString();

  if (lang === 'ur') {
    let msg = `🧾 *${buildingName}* — رسمی مینٹیننس رسید\n`;
    msg += `-----------------------------------\n`;
    msg += `*رسید نمبر:* ${receiptNo}\n`;
    msg += `*تاریخ:* ${date}\n`;
    msg += `*فلیٹ نمبر:* ${flat.flat}\n`;
    msg += `*رہائشی:* ${formatResidentDisplayName(flat) || 'محترم رہائشی'}\n`;
    msg += `*ماہ:* ${monthName}\n`;
    msg += `-----------------------------------\n`;
    msg += `💵 *ماہانہ واجب الادا:* Rs. ${dueNum.toLocaleString('en-US')}\n`;
    if (priorArrNum > 0) {
      msg += `📌 *سابقہ بقایا جات (Prior Arrears):* Rs. ${priorArrNum.toLocaleString('en-US')}\n`;
      msg += `📋 *کل قابل ادا (Total Payable):* Rs. ${totalLiability.toLocaleString('en-US')}\n`;
    }
    msg += `✅ *موصول شدہ رقم (Paid):* Rs. ${paidNum.toLocaleString('en-US')}\n`;
    if (arrearsCleared > 0) {
      msg += `✨ *سابقہ بقایا ادا شدہ (Arrears Cleared):* Rs. ${arrearsCleared.toLocaleString('en-US')}\n`;
    }
    if (trueAdvance > 0) {
      msg += `⭐ *ایڈوانس رقم (Advance Credited):* Rs. ${trueAdvance.toLocaleString('en-US')} (اگلے مہینے میں شامل)\n`;
    }
    msg += `⚠️ *باقی بقایا (Remaining Arrears):* Rs. ${arrearsNum.toLocaleString('en-US')}\n`;
    msg += `-----------------------------------\n`;
    msg += `${arrearsNum === 0 ? '✨ *تمام بقایا جات مکمل کلیئر ہیں (Account Fully Cleared)*' : 'براہ کرم باقی رقم جلد از جلد ادا فرمائیں۔'}\n\n`;
    msg += `Maintenance Managed by: Hafiz Muhammad Saad`;
    return msg;
  } else if (lang === 'roman') {
    let msg = `🧾 *${buildingName}* — Official Maintenance Receipt\n`;
    msg += `-----------------------------------\n`;
    msg += `*Receipt #:* ${receiptNo}\n`;
    msg += `*Date:* ${date}\n`;
    msg += `*Flat #:* ${flat.flat}\n`;
    msg += `*Resident:* ${formatResidentDisplayName(flat) || 'Resident'}\n`;
    msg += `*Month:* ${monthName}\n`;
    msg += `-----------------------------------\n`;
    msg += `💵 *Monthly Due:* Rs. ${dueNum.toLocaleString('en-US')}\n`;
    if (priorArrNum > 0) {
      msg += `📌 *Prior Arrears (Sabiqa Baqaya):* Rs. ${priorArrNum.toLocaleString('en-US')}\n`;
      msg += `📋 *Total Payable (Kul Wajib):* Rs. ${totalLiability.toLocaleString('en-US')}\n`;
    }
    msg += `✅ *Paid Amount:* Rs. ${paidNum.toLocaleString('en-US')}\n`;
    if (arrearsCleared > 0) {
      msg += `✨ *Sabiqa Baqaya Cleared:* Rs. ${arrearsCleared.toLocaleString('en-US')}\n`;
    }
    if (trueAdvance > 0) {
      msg += `⭐ *Advance Credited:* Rs. ${trueAdvance.toLocaleString('en-US')} (Next Month Credit)\n`;
    }
    msg += `⚠️ *Remaining Arrears:* Rs. ${arrearsNum.toLocaleString('en-US')}\n`;
    msg += `-----------------------------------\n`;
    msg += `${arrearsNum === 0 ? '✨ *Account Fully Cleared*' : 'Kindly clear the remaining balance at earliest.'}\n\n`;
    msg += `Maintenance Managed by: Hafiz Muhammad Saad`;
    return msg;
  } else {
    let msg = `🧾 *${buildingName}* — Official Maintenance Receipt\n`;
    msg += `-----------------------------------\n`;
    msg += `*Receipt #:* ${receiptNo}\n`;
    msg += `*Date:* ${date}\n`;
    msg += `*Flat #:* ${flat.flat}\n`;
    msg += `*Resident:* ${formatResidentDisplayName(flat) || 'Resident'}\n`;
    msg += `*Month:* ${monthName}\n`;
    msg += `-----------------------------------\n`;
    msg += `💵 *Monthly Due:* Rs. ${dueNum.toLocaleString('en-US')}\n`;
    if (priorArrNum > 0) {
      msg += `📌 *Prior Arrears:* Rs. ${priorArrNum.toLocaleString('en-US')}\n`;
      msg += `📋 *Total Payable:* Rs. ${totalLiability.toLocaleString('en-US')}\n`;
    }
    msg += `✅ *Paid Amount:* Rs. ${paidNum.toLocaleString('en-US')}\n`;
    if (arrearsCleared > 0) {
      msg += `✨ *Prior Arrears Cleared:* Rs. ${arrearsCleared.toLocaleString('en-US')}\n`;
    }
    if (trueAdvance > 0) {
      msg += `⭐ *Advance Credited:* Rs. ${trueAdvance.toLocaleString('en-US')} (Next Month Credit)\n`;
    }
    msg += `⚠️ *Remaining Arrears:* Rs. ${arrearsNum.toLocaleString('en-US')}\n`;
    msg += `-----------------------------------\n`;
    msg += `${arrearsNum === 0 ? '✨ *Account Fully Cleared*' : 'Kindly clear the remaining balance at earliest.'}\n\n`;
    msg += `Maintenance Managed by: Hafiz Muhammad Saad`;
    return msg;
  }
}

export function openSingleReceiptWhatsApp(flat, monthName, buildingName, lang, dateStr) {
  const msg = buildSingleReceiptMessage(flat, monthName, buildingName, lang, dateStr);
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// Clean phone number for WhatsApp direct link (Pakistan 92 prefix support)
export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('03') && digits.length === 11) {
    return `92${digits.slice(1)}`;
  }
  if (digits.startsWith('92')) {
    return digits;
  }
  return digits;
}

// Build Aging-Specific Tailored Reminder Message (Month-Based)
export function buildAgingReminderMessage(flat, agingCategory, monthName, buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19', lang = 'roman') {
  const residentFormatted = formatResidentDisplayName(flat) || 'Mohtaram Rehayishi';
  const totalArrears = Number(flat.arrears || flat.due || 0).toLocaleString('en-US');
  const monthlyDue = Number(flat.due || 3000).toLocaleString('en-US');

  // 4+ Months Overdue / Critical Chronic Defaulter
  if (agingCategory === '4m+' || agingCategory === '90d+') {
    return `🚨 *FINAL FORMAL NOTICE — OVERDUE ARREARS (4+ Months)* 🚨\n*${buildingName}*\n-----------------------------------\n*Mohtaram ${residentFormatted} (Flat ${flat.flat})*\n\nAap ka maintenance balance pichle *4 ya us se zayed mahino (4+ Months)* se musalsal baqaya chal raha hai:\n\n📌 *Total Outstanding Arrears:* Rs. ${totalArrears}\n💵 *Monthly Standard Fee:* Rs. ${monthlyDue}\n\n⚠️ Building Management Committee aur General Body bylaws k mutabiq, building common utilities (water motor, sweeper, elevator) ko mutasir hone se bachane k lie barah-e-karam *3 din k andar* yeh baqaya bebaaq karein ya committee office se foran rabta karein.\n\nShukriya,\n*Management Committee — ${buildingName}*\n_Managed by: Hafiz Muhammad Saad_`;
  }

  // 3 Months Overdue
  if (agingCategory === '3m' || agingCategory === '60-90d') {
    return `⚠️ *ZAROORI YAAD DIHANI — 3 MONTHS OVERDUE*\n*${buildingName}*\n-----------------------------------\n*Mohtaram ${residentFormatted} (Flat ${flat.flat})*\n\nAap ka maintenance balance pichle *3 mahino* se wajibul ada hai:\n\n📌 *Total Arrears Pending:* Rs. ${totalArrears}\n\nBuilding k rozmarrah ikhrajat (K-Electric bijli bill, sweeper, motor operator) waqt par ada karne k lie aap ka taawun intehai zaroori hai. Barah-e-karam yeh raqam jald az jald jamah karwa kar receipt le lein.\n\nShukriya,\n*Building Management Committee*\n_Managed by: Hafiz Muhammad Saad_`;
  }

  // 2 Months Overdue
  if (agingCategory === '2m' || agingCategory === '30-60d') {
    return `📋 *MAINTENANCE REMINDER — 2 MONTHS DUES*\n*${buildingName}*\n-----------------------------------\n*Mohtaram ${residentFormatted} (Flat ${flat.flat})*\n\nUmeed hai aap khairiyat se honge. Aap ki maintenance ka pichle mahine aur current cycle mila kar *2 mahine ka balance* wajibul ada hai:\n\n📌 *Total Arrears:* Rs. ${totalArrears}\n📅 *Billing Cycle:* ${monthName}\n\nBarah-e-karam building intezamia se rabta farma kar payment clear karein. Agar aap payment ada kar chuke hain toh barah-e-karam committee ko receipt ya screenshot send karein.\n\nShukriya,\n*Building Management Committee*\n_Managed by: Hafiz Muhammad Saad_`;
  }

  // Default: 1 Month Dues (Current Month / 1m)
  return `✨ *MONTHLY MAINTENANCE REMINDER (${monthName})*\n*${buildingName}*\n-----------------------------------\n*Mohtaram ${residentFormatted} (Flat ${flat.flat})*\n\nAssalam-o-Alaikum!\nUmeed hai aap ba-khairiat honge. Maah *${monthName}* ki 1 mahine ki building maintenance fee wajibul ada hai:\n\n💵 *Payable Amount:* Rs. ${totalArrears}\n\nBarah-e-karam waqt par payment ada farma kar official digital receipt hasil karein.\n\nJazakAllah Khair,\n*Building Management Committee*\n_Managed by: Hafiz Muhammad Saad_`;
}

// Open WhatsApp with pre-drafted aging message
export function openAgingReminderWhatsApp(flat, agingCategory, monthName, buildingName, lang = 'roman') {
  const msg = buildAgingReminderMessage(flat, agingCategory, monthName, buildingName, lang);
  const phone = cleanPhoneNumber(flat.phone);
  const url = phone
    ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// Build Dedicated WhatsApp Adjustment Slip (With custom note details like Gutter/Electrician)
export function buildAdjustmentSlipWhatsAppMessage(flat, monthName, buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19', noteText = '', lang = 'roman', dateStr = '') {
  const residentFormatted = formatResidentDisplayName(flat) || 'محترم رہائشی';
  const monthlyDue = Number(flat.due || 3000);
  const paid = Number(flat.paid || 0);
  const arrears = Number(flat.arrears || 0);
  const priorArr = Number(flat.priorArrears || 0);
  const note = noteText || flat.adjustmentNote || flat.notes || '';
  const dateDisplay = flat.paidDate || dateStr || new Date().toLocaleDateString('en-GB');

  if (lang === 'ur') {
    let msg = `🧾 *المصطفیٰ ہائٹس — وضاحتی رسید و ایڈجسٹمنٹ سلپ*\n`;
    msg += `-----------------------------------\n`;
    msg += `🏢 *عمارت:* ${buildingName}\n`;
    msg += `👤 *رہائشی:* ${residentFormatted}\n`;
    msg += `🚪 *فلیٹ نمبر:* ${flat.flat}\n`;
    msg += `📅 *ماہ:* ${monthName} (${dateDisplay})\n`;
    msg += `-----------------------------------\n`;
    msg += `💵 *ماہانہ واجب (Due):* Rs. ${monthlyDue.toLocaleString('en-US')}\n`;
    if (priorArr > 0) {
      msg += `⏳ *سابقہ بقایا (Prior):* Rs. ${priorArr.toLocaleString('en-US')}\n`;
    }
    msg += `💰 *وصول شدہ نقد رقم (Cash Paid):* Rs. ${paid.toLocaleString('en-US')}\n`;
    if (note) {
      msg += `📝 *وضاحتی ایڈجسٹمنٹ کٹوتی:* "${note}"\n`;
    }
    msg += `⚠️ *بقیہ بقایا رقم (Remaining Balance):* Rs. ${arrears.toLocaleString('en-US')}\n`;
    msg += `-----------------------------------\n`;
    msg += `${arrears === 0 ? '✨ *اکاؤنٹ مکمل طور پر کلیئر ہے*' : 'برائے مہربانی بقیہ رقم جلد ادا فرمائیں۔'}\n\n`;
    msg += `مینٹیننس ایڈمن: حافظ محمد سعد`;
    return msg;
  } else {
    let msg = `🧾 *${buildingName} — Payment Adjustment Slip*\n`;
    msg += `-----------------------------------\n`;
    msg += `👤 *Resident:* ${residentFormatted}\n`;
    msg += `🚪 *Flat No:* ${flat.flat}\n`;
    msg += `📅 *Month:* ${monthName} (${dateDisplay})\n`;
    msg += `-----------------------------------\n`;
    msg += `💵 *Monthly Due:* Rs. ${monthlyDue.toLocaleString('en-US')}\n`;
    if (priorArr > 0) {
      msg += `⏳ *Prior Arrears:* Rs. ${priorArr.toLocaleString('en-US')}\n`;
    }
    msg += `💰 *Cash Received:* Rs. ${paid.toLocaleString('en-US')}\n`;
    if (note) {
      msg += `📝 *Documented Adjustment / Deduction:* "${note}"\n`;
    }
    msg += `⚠️ *Remaining Arrears:* Rs. ${arrears.toLocaleString('en-US')}\n`;
    msg += `-----------------------------------\n`;
    msg += `${arrears === 0 ? '✨ *Account Fully Cleared*' : 'Kindly note your remaining balance.'}\n\n`;
    msg += `Maintenance Incharge: Hafiz Muhammad Saad`;
    return msg;
  }
}

export function openAdjustmentSlipWhatsApp(flat, monthName, buildingName, noteText, lang = 'roman', dateStr = '') {
  const msg = buildAdjustmentSlipWhatsAppMessage(flat, monthName, buildingName, noteText, lang, dateStr);
  const phone = cleanPhoneNumber(flat.phone);
  const url = phone
    ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

/**
 * Build Digital Monthly Maintenance Bill / Demand Slip Message
 */
export function buildMonthlyDemandBillMessage({
  flat,
  monthName,
  buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19',
  dueDate = '10th of this month',
  specialFundAmount = 0,
  specialFundTitle = '',
  lang = 'roman',
  dateStr = ''
}) {
  const residentFormatted = formatResidentDisplayName(flat) || 'محترم رہائشی';
  const monthlyDue = Number(flat.due || 3000);
  const priorArrears = Number(flat.priorArrears || (flat.due && flat.arrears && flat.arrears > flat.due ? flat.arrears - flat.due : 0));
  const specialAmount = Number(specialFundAmount || 0);
  const totalPayable = monthlyDue + priorArrears + specialAmount;
  const issueDate = dateStr || new Date().toLocaleDateString('en-GB');

  if (lang === 'ur') {
    let msg = `📜 *ماہانہ مینٹیننس بل و مانگ سلپ (Maintenance Bill)* 📜\n`;
    msg += `🏢 *عمارت:* ${buildingName}\n`;
    msg += `-----------------------------------\n`;
    msg += `👤 *محترم رہائشی:* ${residentFormatted}\n`;
    msg += `🚪 *فلیٹ نمبر:* ${flat.flat}\n`;
    msg += `📅 *ماہ:* ${monthName} (تاریخ اجراء: ${issueDate})\n`;
    msg += `⏳ *آخری تاریخ ادائیگی:* ${dueDate}\n`;
    msg += `-----------------------------------\n`;
    msg += `💵 *ماہانہ مینٹیننس فیس:* Rs. ${monthlyDue.toLocaleString('en-US')}\n`;
    if (priorArrears > 0) {
      msg += `⚠️ *سابقہ بقایا جات (Prior Arrears):* Rs. ${priorArrears.toLocaleString('en-US')}\n`;
    }
    if (specialAmount > 0) {
      msg += `🛠️ *خصوصی فنڈ (${specialFundTitle || 'ایمرجنسی فنڈ'}):* Rs. ${specialAmount.toLocaleString('en-US')}\n`;
    }
    msg += `-----------------------------------\n`;
    msg += `💰 *کُل قابلِ ادائیگی رقم:* *Rs. ${totalPayable.toLocaleString('en-US')}*\n`;
    msg += `-----------------------------------\n`;
    msg += `براہِ کرم وقت پر ادائیگی فرما کر بلڈنگ نظام کو رواں رکھنے میں تعاون کریں۔\n`;
    msg += `ادائیگی پر فوری ڈیجیٹل رسید حاصل فرمائیں۔\n\n`;
    msg += `والسلام،\n*بلڈنگ مینجمنٹ کمیٹی*\nایڈمنسٹریٹر: حافظ محمد سعد`;
    return msg;
  } else {
    let msg = `📜 *MONTHLY MAINTENANCE DEMAND SLIP* 📜\n`;
    msg += `🏢 *${buildingName}*\n`;
    msg += `-----------------------------------\n`;
    msg += `👤 *Resident:* ${residentFormatted}\n`;
    msg += `🚪 *Flat No:* ${flat.flat}\n`;
    msg += `📅 *Billing Month:* ${monthName} (Issued: ${issueDate})\n`;
    msg += `⏳ *Due Date:* ${dueDate}\n`;
    msg += `-----------------------------------\n`;
    msg += `💵 *Monthly Maintenance:* Rs. ${monthlyDue.toLocaleString('en-US')}\n`;
    if (priorArrears > 0) {
      msg += `⚠️ *Prior Outstanding Arrears:* Rs. ${priorArrears.toLocaleString('en-US')}\n`;
    }
    if (specialAmount > 0) {
      msg += `🛠️ *Special Project Fund (${specialFundTitle || 'Emergency Fund'}):* Rs. ${specialAmount.toLocaleString('en-US')}\n`;
    }
    msg += `-----------------------------------\n`;
    msg += `💰 *TOTAL AMOUNT PAYABLE:* *Rs. ${totalPayable.toLocaleString('en-US')}*\n`;
    msg += `-----------------------------------\n`;
    msg += `Kindly ensure payment before the due date to ensure uninterrupted building common services (Water, Elevator, Janitorial).\n\n`;
    msg += `Thank you,\n*Building Management Committee*\n_Managed by: Hafiz Muhammad Saad_`;
    return msg;
  }
}

/**
 * Open Monthly Demand Bill WhatsApp
 */
export function openMonthlyDemandBillWhatsApp(params) {
  const msg = buildMonthlyDemandBillMessage(params);
  const phone = cleanPhoneNumber(params?.flat?.phone);
  const url = phone
    ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

/**
 * Build Vendor Payment Voucher Message
 */
export function buildVendorPaymentWhatsAppMessage({
  vendor,
  amount,
  workDescription,
  monthName,
  buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19',
  dateStr = '',
  voucherNo = '',
  paymentMethod = 'Cash'
}) {
  const vendorName = vendor.name || 'Technician / Contractor';
  const role = vendor.role || vendor.trade || 'Services';
  const amt = Number(amount || 0).toLocaleString('en-US');
  const dStr = dateStr || new Date().toLocaleDateString('en-GB');

  let msg = `🧾 *ادائیگی واؤچر و رسید (Vendor Payment Slip)*\n`;
  msg += `🏢 *${buildingName}*\n`;
  msg += `-----------------------------------\n`;
  msg += `👨‍🔧 *وینڈر / ٹھیکیدار:* ${vendorName} (${role})\n`;
  if (voucherNo) msg += `🔖 *واؤچر نمبر:* #${voucherNo}\n`;
  msg += `📅 *تاریخ ادائیگی:* ${dStr}\n`;
  if (monthName) msg += `🗓️ *ماہ:* ${monthName}\n`;
  msg += `💵 *طریقہ ادائیگی:* ${paymentMethod}\n`;
  msg += `-----------------------------------\n`;
  msg += `🛠️ *کام کی تفصیل:* ${workDescription || 'Maintenance & Repairs'}\n`;
  msg += `💰 *ادا شدہ رقم:* *Rs. ${amt}*\n`;
  msg += `-----------------------------------\n`;
  msg += `✅ *حالت:* رقم وصول ہو گئی (Payment Cleared)\n\n`;
  msg += `شکریہ!\n*بلڈنگ مینجمنٹ کمیٹی*\n_ایڈمنسٹریٹر: حافظ محمد سعد_`;
  return msg;
}

/**
 * Open Vendor Payment Voucher WhatsApp
 */
export function openVendorPaymentWhatsApp(params) {
  const msg = buildVendorPaymentWhatsAppMessage(params);
  const phone = cleanPhoneNumber(params?.vendor?.phone);
  const url = phone
    ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

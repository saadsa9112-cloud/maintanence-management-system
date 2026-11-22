/**
 * dueDateUtils.js
 * Timeline & Grace Period Alert Engine for Building Maintenance
 * 
 * Rules:
 * 1. Default Due Date: 10th of every month.
 * 2. Grace Period: 11th through 15th of the month.
 * 3. Overdue / Service Interruption Warning: 16th onwards.
 * 4. STRICT RULE: NO late surcharge is applied or requested, per user instruction.
 */

import { formatResidentDisplayName } from './residentUtils.js';

export const BILLING_TIMELINE_CONFIG = {
  defaultDueDay: 10,
  defaultGraceEndDay: 15
};

/**
 * Parses day number from a date string (e.g. "28-Oct-2026", "2026-11-06", etc.)
 */
export function extractDayOfMonth(dateStr) {
  if (!dateStr) {
    return new Date().getDate();
  }
  const str = String(dateStr).trim();
  // Match "DD-MMM-YYYY" or "DD/MM/YYYY"
  const dmy = str.match(/^(\d{1,2})[-/]/);
  if (dmy) {
    return parseInt(dmy[1], 10);
  }
  // Match "YYYY-MM-DD"
  const ymd = str.match(/^\d{4}-\d{2}-(\d{1,2})/);
  if (ymd) {
    return parseInt(ymd[1], 10);
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.getDate();
  }
  return new Date().getDate();
}

/**
 * Returns current billing timeline phase
 * @param {string} [dateStr] - Statement date or current date
 * @param {number} [dueDay=10]
 * @param {number} [graceEndDay=15]
 */
export function getBillingTimelineStatus(dateStr, dueDay = 10, graceEndDay = 15) {
  const currentDay = extractDayOfMonth(dateStr);

  if (currentDay <= dueDay) {
    return {
      phase: 'normal',
      currentDay,
      dueDay,
      graceEndDay,
      daysLeft: dueDay - currentDay,
      labelUrdu: 'ماہانہ فیس کی وصولی کا معمول کا وقت',
      labelRoman: 'Normal Due Collection Window',
      shortBadge: `Due: ${dueDay}th (In Time)`,
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      pillClass: 'bg-emerald-600 text-white',
      advisoryUrdu: `آخری تاریخ ${dueDay} تاریخ ہے۔ برائے مہربانی معمول کے مطابق ادائیگی فرمائیں۔`,
      advisoryRoman: `Due date is ${dueDay}th of the month. Kindly submit regular payment in time.`
    };
  }

  if (currentDay <= graceEndDay) {
    return {
      phase: 'grace',
      currentDay,
      dueDay,
      graceEndDay,
      daysLeft: graceEndDay - currentDay,
      labelUrdu: 'رعایتی وقت جاری ہے (Grace Period Active ⏳)',
      labelRoman: 'Grace Period Active (Final Days)',
      shortBadge: `Grace Period: Until ${graceEndDay}th ⏳`,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse',
      pillClass: 'bg-amber-600 text-white',
      advisoryUrdu: `آخری تاریخ (${dueDay} تاریخ) گزر چکی ہے۔ ${graceEndDay} تاریخ تک رعایتی وقت ہے، برائے کرم فوری جمع کرائیں۔`,
      advisoryRoman: `Due date was ${dueDay}th. Grace period active till ${graceEndDay}th. Please clear promptly.`
    };
  }

  return {
    phase: 'overdue',
    currentDay,
    dueDay,
    graceEndDay,
    daysOverdue: currentDay - graceEndDay,
    labelUrdu: 'آخری مہلت ختم - فوری نوٹس (Critical Overdue 🚨)',
    labelRoman: 'Critical Overdue (Action Required)',
    shortBadge: `Overdue (Past ${graceEndDay}th) 🚨`,
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 font-black',
    pillClass: 'bg-rose-600 text-white font-black',
    advisoryUrdu: `رعایتی مدت ختم ہو چکی ہے۔ بلڈنگ کے مشترکہ اخراجات (موٹر، جمعدار وغیرہ) کے لیے فوری ادائیگی ناگزیر ہے۔`,
    advisoryRoman: `Grace deadline expired. Immediate clearance required to maintain uninterrupted building utilities.`
  };
}

/**
 * Builds phased, custom WhatsApp message adhering to timeline stage (Zero Surcharge)
 */
export function buildPhasedWhatsAppMessage({
  flat,
  monthName,
  buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19',
  lang = 'roman',
  phase = 'normal',
  dueDay = 10,
  graceEndDay = 15
}) {
  const residentName = formatResidentDisplayName(flat) || 'Mohtaram Rehayishi';
  const due = Number(flat.due || 3000);
  const prior = Number(flat.priorArrears || (flat.arrears > flat.due ? flat.arrears - flat.due : 0));
  const total = due + prior;

  if (phase === 'grace') {
    return `⏳ *${buildingName} — GRACE PERIOD REMINDER (${monthName})*\n` +
      `-----------------------------------\n` +
      `محترم *${residentName}* (فلیٹ ${flat.flat})\n\n` +
      `آپ کو یاددہانی کرائی جاتی ہے کہ ماہِ *${monthName}* کی مینٹیننس فیس کی باقاعدہ تاریخ (${dueDay} تاریخ) گزر چکی ہے۔\n` +
      `انتظامیہ کی جانب سے *${graceEndDay} تاریخ* تک رعایتی وقت (Grace Period) دیا جا رہا ہے۔\n\n` +
      `🔹 ماہانہ فیس: Rs. ${due.toLocaleString('en-US')}\n` +
      (prior > 0 ? `⚠️ سابقہ بقایاجات: Rs. ${prior.toLocaleString('en-US')}\n` : '') +
      `💰 *کُل قابلِ ادائیگی:* *Rs. ${total.toLocaleString('en-US')}*\n\n` +
      `گزارش ہے کہ رعایتی مہلت ختم ہونے سے قبل واجبات ادا فرما کر تعاون کریں۔ شکریہ!\n` +
      `-----------------------------------\n` +
      `— بلڈنگ مینٹیننس ایڈمنسٹریٹر: حافظ محمد سعد`;
  }

  if (phase === 'overdue') {
    return `🚨 *${buildingName} — URGENT OVERDUE NOTICE (${monthName})*\n` +
      `-----------------------------------\n` +
      `محترم *${residentName}* (فلیٹ ${flat.flat})\n\n` +
      `اطلاع دی جاتی ہے کہ ماہِ *${monthName}* کا رعایتی وقت (${graceEndDay} تاریخ) بھی ختم ہو چکا ہے اور آپ کے ذمہ واجبات ابھی تک بقایا ہیں:\n\n` +
      `🔹 جاریہ ماہانہ فیس: Rs. ${due.toLocaleString('en-US')}\n` +
      (prior > 0 ? `⚠️ سابقہ بقایاجات: Rs. ${prior.toLocaleString('en-US')}\n` : '') +
      `🚨 *کُل واجب الادا رقم:* *Rs. ${total.toLocaleString('en-US')}*\n\n` +
      `عمارت کی بنیادی سروسز (پانی کی موٹر، لفٹ اور صفائی) کی بلا تعطل فراہمی کے لیے فنڈز کی دستیابی اشد ضروری ہے۔ برائے مہربانی آج ہی اپنے واجبات کلیئر فرما لیں۔\n` +
      `-----------------------------------\n` +
      `— بلڈنگ مینٹیننس ایڈمنسٹریٹر: حافظ محمد سعد`;
  }

  // Normal phase
  return `🧾 *${buildingName} — MAINTENANCE DEMAND BILL (${monthName})*\n` +
    `-----------------------------------\n` +
    `محترم *${residentName}* (فلیٹ ${flat.flat})\n\n` +
    `ماہِ *${monthName}* کا مینٹیننس بل درج ذیل ہے:\n\n` +
    `🔹 ماہانہ فیس: Rs. ${due.toLocaleString('en-US')}\n` +
    (prior > 0 ? `⚠️ سابقہ بقایاجات: Rs. ${prior.toLocaleString('en-US')}\n` : '') +
    `💰 *کُل قابلِ ادائیگی:* *Rs. ${total.toLocaleString('en-US')}*\n\n` +
    `📅 آخری تاریخ: *${dueDay} تاریخ*\n` +
    `برائے مہربانی بروقت جمع کرا کر بلڈنگ سروسز کو فعال رکھنے میں تعاون فرمائیں۔ جزاک اللہ!\n` +
    `-----------------------------------\n` +
    `— بلڈنگ مینٹیننس ایڈمنسٹریٹر: حافظ محمد سعد`;
}

/**
 * Financial & Maintenance Clash / Discrepancy Detection Engine
 * 
 * Detects accounting inconsistencies, liability mismatches, month continuity breaks,
 * closed flat activity, and negative balances WITHOUT auto-correcting,
 * providing clear Urdu/Roman Urdu explanations of the exact issue and difference.
 */

import { sortMonthsChronologically } from './monthUtils.js';

/**
 * Calculates prior arrears safely from a flat record
 */
export const getPriorArrears = (flat) => {
  if (!flat) return 0;
  if (flat.priorArrears !== undefined && flat.priorArrears !== null) {
    return Number(flat.priorArrears) || 0;
  }
  const total = (Number(flat.arrears || 0) + Number(flat.paid || 0));
  const due = Number(flat.due || 0);
  return Math.max(0, total - due);
};

/**
 * Evaluates all clashes for a single flat
 */
export function checkFlatClashes(flat, previousMonthFlat = null) {
  if (!flat) return [];
  const clashes = [];
  const isClosed = flat.status === 'closed';
  const due = Number(flat.due || 0);
  const prior = getPriorArrears(flat);
  const paid = Number(flat.paid || 0);
  const arrears = Number(flat.arrears || 0);
  const adjustmentNote = (flat.adjustmentNote || flat.notes || '').trim();
  const hasNote = adjustmentNote.length > 0;

  // 1. Negative amounts
  if (due < 0 || prior < 0 || paid < 0 || arrears < 0) {
    clashes.push({
      id: `neg_${flat.sno}`,
      flatNo: flat.flat,
      name: flat.name,
      sno: flat.sno,
      category: 'negative_value',
      severity: 'error',
      title: 'منفی رقم درج ہے (Negative Amount Error)',
      messageUrdu: `فلیٹ ${flat.flat} (${flat.name}) کے کھاتے میں منفی رقم درج ہے۔ حساب کتاب میں منفی رقم کی اجازت نہیں ہے۔`,
      messageRoman: `Flat ${flat.flat} (${flat.name}) ke account mein negative amount darj hai. Accounting mein negative values allowed nahi hain.`,
      field: paid < 0 ? 'paid' : (arrears < 0 ? 'arrears' : (prior < 0 ? 'priorArrears' : 'due')),
      expected: 0,
      actual: paid < 0 ? paid : (arrears < 0 ? arrears : (prior < 0 ? prior : due)),
      diff: 0
    });
  }

  // 2. Closed flat with financial activity
  if (isClosed && (paid > 0 || arrears > 0)) {
    clashes.push({
      id: `closed_${flat.sno}`,
      flatNo: flat.flat,
      name: flat.name,
      sno: flat.sno,
      category: 'closed_flat_activity',
      severity: 'error',
      title: 'بند فلیٹ میں مالیاتی اندراج (Closed Flat Has Balance)',
      messageUrdu: `فلیٹ ${flat.flat} (${flat.name}) "گھر بند ہے" درج ہے، لیکن اس میں وصولی (Rs. ${paid.toLocaleString()}) یا بقایا (Rs. ${arrears.toLocaleString()}) درج ہے۔ یا تو اس کا اسٹیٹس ایکٹیو کریں یا رقم کو صفر کریں۔`,
      messageRoman: `Flat ${flat.flat} (${flat.name}) "Ghar Band Hai" marked hai, lekin isme Wasooli (Rs. ${paid.toLocaleString()}) ya Baqaya (Rs. ${arrears.toLocaleString()}) darj hai. Ya status Active karein ya raqam 0 karein.`,
      field: paid > 0 ? 'paid' : 'arrears',
      expected: 0,
      actual: paid > 0 ? paid : arrears,
      diff: paid + arrears
    });
  }

  // 3. Maintenance Liability Math Clash (Paid + Arrears != Due + PriorArrears)
  if (!isClosed) {
    const totalExpected = due + prior;
    const totalActual = paid + arrears;
    const diff = totalActual - totalExpected;

    if (Math.abs(diff) > 0) {
      const isExcess = diff > 0;
      clashes.push({
        id: `liability_${flat.sno}`,
        flatNo: flat.flat,
        name: flat.name,
        sno: flat.sno,
        category: 'liability_mismatch',
        severity: 'error',
        title: isExcess 
          ? 'واجبات سے اضافی اندراج (Excess Amount Clash)' 
          : 'بقایا یا وصولی میں کمی / تضاد (Shortfall / Missing Balance Clash)',
        messageUrdu: isExcess
          ? `فلیٹ ${flat.flat} (${flat.name}): کُل واجب الادا Rs. ${totalExpected.toLocaleString()} (ماہانہ Rs. ${due.toLocaleString()} + سابقہ Rs. ${prior.toLocaleString()}) ہے۔ جبکہ آپ نے وصولی (Rs. ${paid.toLocaleString()}) اور بقایا (Rs. ${arrears.toLocaleString()}) ملا کر کل Rs. ${totalActual.toLocaleString()} درج کیا ہے۔ اس میں Rs. ${Math.abs(diff).toLocaleString()} اضافی درج ہو گیا ہے!`
          : `فلیٹ ${flat.flat} (${flat.name}): کُل واجب الادا Rs. ${totalExpected.toLocaleString()} (ماہانہ Rs. ${due.toLocaleString()} + سابقہ Rs. ${prior.toLocaleString()}) بنتا ہے۔ لیکن وصولی (Rs. ${paid.toLocaleString()}) اور بقایا (Rs. ${arrears.toLocaleString()}) ملا کر کل صرف Rs. ${totalActual.toLocaleString()} بن رہا ہے۔ حساب میں Rs. ${Math.abs(diff).toLocaleString()} کا تضاد ہے جو نہ وصول ہوا نہ بقایا میں لکھا گیا!`,
        messageRoman: isExcess
          ? `Flat ${flat.flat} (${flat.name}): Total Wajib Rs. ${totalExpected.toLocaleString()} (Due ${due} + Prior ${prior}) tha. Lekin Paid (${paid}) + Arrears (${arrears}) mila kar Rs. ${totalActual.toLocaleString()} darj hai. Isme Rs. ${Math.abs(diff).toLocaleString()} ziada (excess) hai!`
          : `Flat ${flat.flat} (${flat.name}): Total Wajib Rs. ${totalExpected.toLocaleString()} (Due ${due} + Prior ${prior}) banta hai. Lekin Paid (${paid}) + Arrears (${arrears}) = Rs. ${totalActual.toLocaleString()} likha hai. Rs. ${Math.abs(diff).toLocaleString()} ka hisab clash kar raha hai jo na pay hua aur na baqaya mein likha gaya!`,
        field: 'arrears',
        expected: totalExpected,
        actual: totalActual,
        diff,
        recommendedArrears: Math.max(0, totalExpected - paid),
        recommendedPaid: Math.max(0, totalExpected - arrears),
        hasAdjustmentNote: hasNote,
        adjustmentNote: adjustmentNote,
        isAcknowledged: hasNote
      });
    }
  }

  // 4. Prior Arrears Discontinuity Clash (compared with previous month's ending arrears)
  if (previousMonthFlat && !isClosed && previousMonthFlat.status !== 'closed') {
    const prevEndingArrears = Number(previousMonthFlat.arrears || 0);
    if (prevEndingArrears > 0 && Math.abs(prior - prevEndingArrears) > 0) {
      clashes.push({
        id: `prior_cont_${flat.sno}`,
        flatNo: flat.flat,
        name: flat.name,
        sno: flat.sno,
        category: 'prior_arrears_break',
        severity: 'warning',
        title: 'سابقہ بقایا کا تسلسل ٹوٹ گیا (Arrears Continuity Break)',
        messageUrdu: `گزشتہ ماہ فلیٹ ${flat.flat} کا اختتامی بقایا Rs. ${prevEndingArrears.toLocaleString()} تھا، لیکن موجودہ مہینے میں سابقہ بقایا Rs. ${prior.toLocaleString()} درج ہے۔ دونوں میں Rs. ${Math.abs(prior - prevEndingArrears).toLocaleString()} کا فرق ہے۔`,
        messageRoman: `Pichle mahine Flat ${flat.flat} ka ending arrears Rs. ${prevEndingArrears.toLocaleString()} tha, lekin is mahine prior arrears Rs. ${prior.toLocaleString()} darj hai. Rs. ${Math.abs(prior - prevEndingArrears).toLocaleString()} ka farq hai.`,
        field: 'priorArrears',
        expected: prevEndingArrears,
        actual: prior,
        diff: prior - prevEndingArrears,
        recommendedPrior: prevEndingArrears,
        hasAdjustmentNote: hasNote,
        adjustmentNote: adjustmentNote,
        isAcknowledged: hasNote
      });
    }
  }

  return clashes;
}

/**
 * Checks month-to-month cash chain continuity clashes
 */
export function checkMonthChainClashes(allMonthsData = {}, monthOrder = []) {
  const sorted = sortMonthsChronologically(monthOrder && monthOrder.length > 0 ? monthOrder : Object.keys(allMonthsData || {}));
  const chainClashes = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const prevKey = sorted[i];
    const nextKey = sorted[i + 1];

    const prevMonth = allMonthsData[prevKey];
    const nextMonth = allMonthsData[nextKey];

    if (!prevMonth || !nextMonth) continue;

    // Previous month's true reconciled closing savings
    const prevColl = (prevMonth.flats || []).reduce((acc, f) => acc + (f && f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
    const prevExp = (prevMonth.expenses || []).reduce((acc, e) => acc + Number(e && e.amount || 0), 0);
    const prevOpening = Number(prevMonth.prevSavings || 0);
    const expectedOpeningForNext = prevColl + prevOpening - prevExp;

    const actualOpeningNext = Number(nextMonth.prevSavings || 0);
    const diff = actualOpeningNext - expectedOpeningForNext;

    if (Math.abs(diff) > 0) {
      chainClashes.push({
        id: `chain_${prevKey}_${nextKey}`,
        category: 'month_opening_clash',
        severity: 'error',
        prevMonthKey: prevKey,
        nextMonthKey: nextKey,
        title: `ماہانہ بچت کے تسلسل کا تضاد (${nextKey} vs ${prevKey})`,
        messageUrdu: `ماہِ ${prevKey} کی اختتامی کل بچت Rs. ${expectedOpeningForNext.toLocaleString()} تھی، لیکن ماہِ ${nextKey} میں پچھلی بچت (Opening Balance) Rs. ${actualOpeningNext.toLocaleString()} درج ہے۔ دونوں میں Rs. ${Math.abs(diff).toLocaleString()} کا تضاد ہے!`,
        messageRoman: `Mah-e-${prevKey} ki closing bachat Rs. ${expectedOpeningForNext.toLocaleString()} thi, lekin Mah-e-${nextKey} mein pichli bachat Rs. ${actualOpeningNext.toLocaleString()} darj hai. Dono mein Rs. ${Math.abs(diff).toLocaleString()} ka clash hai!`,
        expected: expectedOpeningForNext,
        actual: actualOpeningNext,
        diff,
        recommendedOpening: expectedOpeningForNext
      });
    }
  }

  return chainClashes;
}

/**
 * Checks current month's overall budget & expense clashes
 */
export function checkBudgetClashes(monthData) {
  if (!monthData) return [];
  const clashes = [];

  const flats = monthData.flats || [];
  const expenses = monthData.expenses || [];
  const prevSavings = Number(monthData.prevSavings || 0);

  const collections = flats.reduce((acc, f) => acc + (f && f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e && e.amount || 0), 0);
  const totalAvailable = collections + prevSavings;
  const netClosing = totalAvailable - totalExpenses;

  // 1. Deficit cash clash
  if (netClosing < 0) {
    clashes.push({
      id: `deficit_${monthData.name || 'current'}`,
      category: 'cash_deficit',
      severity: 'warning',
      title: 'کیش خسارہ / منفی بچت (Cash Deficit Clash)',
      messageUrdu: `موجودہ مہینے میں کل اخراجات (Rs. ${totalExpenses.toLocaleString()}) دستیاب رقم (پچھلی بچت Rs. ${prevSavings.toLocaleString()} + وصولی Rs. ${collections.toLocaleString()} = Rs. ${totalAvailable.toLocaleString()}) سے Rs. ${Math.abs(netClosing).toLocaleString()} زیادہ ہیں۔ کیش منفی (خسارے میں) جا رہا ہے۔`,
      messageRoman: `Is mahine mein Kul Akhrajaat (Rs. ${totalExpenses.toLocaleString()}) Dastyab Raqam (Pichli Bachat ${prevSavings.toLocaleString()} + Wasooli ${collections.toLocaleString()} = Rs. ${totalAvailable.toLocaleString()}) se Rs. ${Math.abs(netClosing).toLocaleString()} ziada hain. Cash negative (deficit) ho raha hai.`,
      expected: totalAvailable,
      actual: totalExpenses,
      diff: netClosing
    });
  }

  // 2. Empty description expenses
  expenses.forEach((exp, idx) => {
    if (exp && Number(exp.amount) > 0 && (!exp.desc || exp.desc.trim() === '')) {
      clashes.push({
        id: `exp_empty_${exp.id || idx}`,
        category: 'expense_no_desc',
        severity: 'warning',
        title: 'نامکمل خرچہ (Expense Missing Description)',
        messageUrdu: `اخراجات کی فہرست میں Rs. ${Number(exp.amount).toLocaleString()} درج ہے لیکن اس کی تفصیل / مد (Description) خالی ہے۔`,
        messageRoman: `Expenses list mein Rs. ${Number(exp.amount).toLocaleString()} darj hai lekin iski Description khali hai.`,
        expected: 'Valid description',
        actual: 'Empty',
        diff: 0
      });
    }
  });

  return clashes;
}

/**
 * Master scanner: gathers all clashes for active month and system
 */
export function scanAllSystemClashes({
  currentMonthData,
  activeMonthKey,
  allMonthsData = {},
  monthOrder = []
}) {
  if (!currentMonthData) return { flatClashes: [], chainClashes: [], budgetClashes: [], totalCount: 0 };

  const sortedKeys = sortMonthsChronologically(monthOrder && monthOrder.length > 0 ? monthOrder : Object.keys(allMonthsData || {}));
  const currentMonthIdx = sortedKeys.indexOf(activeMonthKey);
  const prevMonthKey = currentMonthIdx > 0 ? sortedKeys[currentMonthIdx - 1] : null;
  const prevMonthData = prevMonthKey ? allMonthsData[prevMonthKey] : null;

  const flats = currentMonthData.flats || [];
  const flatClashes = [];

  flats.forEach((flat) => {
    const prevFlat = prevMonthData?.flats?.find(pf => pf.flat === flat.flat || pf.sno === flat.sno) || null;
    const itemClashes = checkFlatClashes(flat, prevFlat);
    if (itemClashes.length > 0) {
      flatClashes.push(...itemClashes);
    }
  });

  const chainClashes = checkMonthChainClashes(allMonthsData, monthOrder);
  const budgetClashes = checkBudgetClashes(currentMonthData);

  // Relevant chain clashes affecting active month
  const activeChainClashes = chainClashes.filter(c => c.nextMonthKey === activeMonthKey || c.prevMonthKey === activeMonthKey);

  const totalCount = flatClashes.length + activeChainClashes.length + budgetClashes.length;

  const unresolvedFlatClashes = flatClashes.filter(c => !c.hasAdjustmentNote);
  const acknowledgedFlatClashes = flatClashes.filter(c => c.hasAdjustmentNote);
  const acknowledgedCount = acknowledgedFlatClashes.length;
  const unresolvedCount = unresolvedFlatClashes.length + activeChainClashes.length + budgetClashes.length;

  return {
    flatClashes,
    unresolvedFlatClashes,
    acknowledgedFlatClashes,
    chainClashes,
    activeChainClashes,
    budgetClashes,
    totalCount,
    acknowledgedCount,
    unresolvedCount,
    hasClashes: totalCount > 0,
    hasUnresolvedClashes: unresolvedCount > 0
  };
}

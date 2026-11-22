// Defaulters Aging Analysis Utility Functions (Month-Based)

/**
 * Classifies an individual flat into month-based aging severity buckets:
 * - '1m': Current billing cycle only (1 Month Dues, priorArrears == 0)
 * - '2m': 2 Months Overdue (1 month prior arrears + current month, or 1 past unpaid month)
 * - '3m': 3 Months Overdue (2 months prior arrears + current month, or 2 past unpaid months)
 * - '4m+': 4+ Months Overdue / Critical (3+ months prior arrears, arrears > 9000, or 3+ past unpaid months)
 */
export function getAgingClassification(flat, priorArr = 0, due = 3000, arrears = 0, consecutivePastMonthsCount = 0) {
  const d = Number(due) || 3000;
  const p = Number(priorArr) || 0;
  const arr = Number(arrears) || 0;
  const count = Number(consecutivePastMonthsCount) || 0;

  if (p > (d * 2) || count >= 3 || arr > 9000) {
    return {
      category: '4m+',
      shortLabel: '4+ Months',
      shortLabelUrdu: '4+ ماہ',
      labelEn: '4+ Months (Critical)',
      labelRoman: '4+ Mahine (Critical)',
      labelUrdu: '4+ ماہ (شدید بقایا جات)',
      badgeClass: 'bg-rose-600 text-white border-rose-700 shadow-xs font-black animate-pulse',
      softBadgeClass: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold',
      pillClass: 'bg-rose-600 text-white font-black',
      color: '#e11d48',
      severity: 4
    };
  }

  if (p > d || count === 2 || arr > 6000) {
    return {
      category: '3m',
      shortLabel: '3 Months',
      shortLabelUrdu: '3 ماہ',
      labelEn: '3 Months Overdue',
      labelRoman: '3 Mahine Baqaya',
      labelUrdu: '3 ماہ کے بقایا جات',
      badgeClass: 'bg-rose-500 text-white border-rose-600 font-black',
      softBadgeClass: 'bg-rose-100 text-rose-900 border border-rose-300 font-bold',
      pillClass: 'bg-rose-500 text-white font-bold',
      color: '#f43f5e',
      severity: 3
    };
  }

  if (p > 0 || count === 1 || arr > 3000) {
    return {
      category: '2m',
      shortLabel: '2 Months',
      shortLabelUrdu: '2 ماہ',
      labelEn: '2 Months Overdue',
      labelRoman: '2 Mahine Baqaya',
      labelUrdu: '2 ماہ کے بقایا جات',
      badgeClass: 'bg-orange-500 text-white border-orange-600 font-black',
      softBadgeClass: 'bg-orange-100 text-orange-900 border border-orange-300 font-bold',
      pillClass: 'bg-orange-500 text-white font-bold',
      color: '#f97316',
      severity: 2
    };
  }

  return {
    category: '1m',
    shortLabel: '1 Month',
    shortLabelUrdu: '1 ماہ',
    labelEn: '1 Month (Current)',
    labelRoman: '1 Mahina (Jari)',
    labelUrdu: '1 ماہ (جاریہ مہینہ)',
    badgeClass: 'bg-amber-500 text-white border-amber-600 font-bold',
    softBadgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
    pillClass: 'bg-amber-500 text-white font-medium',
    color: '#f59e0b',
    severity: 1
  };
}

/**
 * Computes consecutive past unpaid months across historical records
 */
export function getConsecutivePastUnpaidMonths(flat, allMonthsData = {}, sortedMonthKeys = [], activeMonthKey = '') {
  let count = 0;
  let oldestMonth = '';

  if (!sortedMonthKeys || sortedMonthKeys.length === 0 || !activeMonthKey) {
    return { count, oldestMonth };
  }

  const currIdx = sortedMonthKeys.indexOf(activeMonthKey);
  if (currIdx > 0) {
    for (let i = currIdx - 1; i >= 0; i--) {
      const pastKey = sortedMonthKeys[i];
      const pastFlats = allMonthsData[pastKey]?.flats || [];
      const matchingPastFlat = pastFlats.find(pf => pf.flat === flat.flat || pf.sno === flat.sno);
      if (matchingPastFlat && (Number(matchingPastFlat.arrears) > 0 || Number(matchingPastFlat.paid) < Number(matchingPastFlat.due))) {
        count++;
        oldestMonth = allMonthsData[pastKey]?.name || pastKey;
      } else {
        break; // Stop at first paid month
      }
    }
  }

  return { count, oldestMonth };
}

export const CALENDAR_MONTHS = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER'
];

/**
 * Sorts month keys in calendar chronological order across years:
 * e.g., Nov 2025 -> Dec 2025 -> Jan 2026 -> Feb 2026 ...
 */
export function sortMonthsChronologically(keys = []) {
  return [...keys].sort((a, b) => {
    const aParts = a.split('_');
    const bParts = b.split('_');
    const aBase = aParts[0].toUpperCase();
    const bBase = bParts[0].toUpperCase();
    const aIdx = CALENDAR_MONTHS.indexOf(aBase);
    const bIdx = CALENDAR_MONTHS.indexOf(bBase);

    // Extract year: if specified in key like "OCTOBER_2025", use 2025; otherwise default 2026
    const aYear = aParts[1] ? parseInt(aParts[1], 10) : 2026;
    const bYear = bParts[1] ? parseInt(bParts[1], 10) : 2026;

    if (aIdx !== -1 && bIdx !== -1) {
      const aVal = aYear * 12 + aIdx;
      const bVal = bYear * 12 + bIdx;
      if (aVal !== bVal) return aVal - bVal;
      return a.localeCompare(b);
    }
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.localeCompare(b);
  });
}

/**
 * Gets the chronological index (0 to 11) for a month key
 */
export function getMonthIndex(key = '') {
  const base = key.split('_')[0].toUpperCase();
  return CALENDAR_MONTHS.indexOf(base);
}

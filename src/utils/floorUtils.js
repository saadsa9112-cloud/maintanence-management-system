/**
 * floorUtils.js
 * Comprehensive floor-wise analytics and classification for Al-Mustafa Heights.
 * 
 * Building Flat Numbering Scheme:
 * - G-* (e.g. G-1, G-2, G-3) -> Ground Floor
 * - F-* (e.g. F-1, F-2, F-3, F-4) -> 1st Floor
 * - S-* (e.g. S-1, S-2, S-3, S-4) -> 2nd Floor
 * - T-* (e.g. T-1, T-2, T-3, T-4) -> 3rd Floor
 * - P-* (e.g. P-1, P-2, P-3, P-4) -> 4th / Penthouse Floor
 * - Shop* -> Commercial / Ground Shops
 */

export const FLOOR_DEFINITIONS = [
  { key: 'G', prefix: 'G-', labelEn: 'Ground Floor', labelUrdu: 'گراؤنڈ فلور (Ground Floor)', icon: '🏢' },
  { key: 'F', prefix: 'F-', labelEn: '1st Floor', labelUrdu: 'پہلی منزل (1st Floor)', icon: '🥇' },
  { key: 'S', prefix: 'S-', labelEn: '2nd Floor', labelUrdu: 'دوسری منزل (2nd Floor)', icon: '🥈' },
  { key: 'T', prefix: 'T-', labelEn: '3rd Floor', labelUrdu: 'تیسری منزل (3rd Floor)', icon: '🥉' },
  { key: 'P', prefix: 'P-', labelEn: '4th Floor / Penthouse', labelUrdu: 'چوتھی منزل / پینٹ ہاؤس (4th Floor)', icon: '👑' },
  { key: 'Shop', prefix: 'Shop', labelEn: 'Commercial Shops', labelUrdu: 'دکانات (Ground Shops)', icon: '🏪' },
];

/**
 * Determines which floor a flat belongs to based on flat number
 */
export function getFlatFloorKey(flatNo) {
  if (!flatNo) return 'Other';
  const clean = String(flatNo).trim().toUpperCase();
  if (clean.startsWith('G-') || clean === 'G') return 'G';
  if (clean.startsWith('F-') || clean === 'F') return 'F';
  if (clean.startsWith('S-') || clean === 'S') return 'S';
  if (clean.startsWith('T-') || clean === 'T') return 'T';
  if (clean.startsWith('P-') || clean === 'P') return 'P';
  if (clean.includes('SHOP')) return 'Shop';
  return 'Other';
}

/**
 * Calculates detailed financial and collection metrics for each floor
 */
export function calculateFloorWiseAnalytics(flats = []) {
  const safeFlats = (flats || []).filter(Boolean);

  // Group flats by floor
  const floorMap = {
    G: [],
    F: [],
    S: [],
    T: [],
    P: [],
    Shop: [],
    Other: []
  };

  safeFlats.forEach(flat => {
    const floorKey = getFlatFloorKey(flat.flat);
    if (floorMap[floorKey]) {
      floorMap[floorKey].push(flat);
    } else {
      floorMap.Other.push(flat);
    }
  });

  const floorsReport = FLOOR_DEFINITIONS.map(def => {
    const floorFlats = floorMap[def.key] || [];
    const totalUnits = floorFlats.length;
    const closedUnits = floorFlats.filter(f => f.status === 'closed');
    const activeFlats = floorFlats.filter(f => f.status !== 'closed');

    let totalDue = 0;
    let totalPrior = 0;
    let totalPaid = 0;
    let totalArrears = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    activeFlats.forEach(f => {
      const due = Number(f.due || 0);
      const paid = Number(f.paid || 0);
      const arrears = Number(f.arrears || 0);
      const prior = f.priorArrears !== undefined && f.priorArrears !== null
        ? Number(f.priorArrears) || 0
        : Math.max(0, (arrears + paid) - due);

      totalDue += due;
      totalPrior += prior;
      totalPaid += paid;
      totalArrears += arrears;

      if (arrears === 0 && paid > 0) {
        paidCount++;
      } else {
        unpaidCount++;
      }
    });

    const totalPayable = totalDue + totalPrior;
    const collectionPct = totalPayable > 0 ? Math.min(100, Math.round((totalPaid / totalPayable) * 100)) : (activeFlats.length === 0 ? 100 : 0);
    const is100Percent = activeFlats.length > 0 && unpaidCount === 0;

    return {
      key: def.key,
      labelEn: def.labelEn,
      labelUrdu: def.labelUrdu,
      icon: def.icon,
      flats: floorFlats,
      totalUnits,
      closedCount: closedUnits.length,
      activeCount: activeFlats.length,
      paidCount,
      unpaidCount,
      totalDue,
      totalPrior,
      totalPayable,
      totalPaid,
      totalArrears,
      collectionPct,
      is100Percent,
      starBadge: is100Percent ? '🌟 100% Cleared' : `${collectionPct}% Collected`
    };
  });

  // Filter out any floor that has 0 units (e.g. if 'Other' is empty)
  const activeFloors = floorsReport.filter(f => f.totalUnits > 0);

  // Summary figures
  const totalBuildingUnits = safeFlats.length;
  const starFloorsCount = activeFloors.filter(f => f.is100Percent).length;

  return {
    floors: activeFloors,
    totalBuildingUnits,
    starFloorsCount
  };
}

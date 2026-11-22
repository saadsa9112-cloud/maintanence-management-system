/**
 * residentUtils.js
 * Centralized formatting and utilities for Resident Names & Occupancy Classifications.
 * Rules:
 * 1. Honorific suffix "صاحب" (Sahab) is adjustable / configurable:
 *    - By default, it is ON (includeSahab: true)
 *    - Can be turned OFF per-flat (includeSahab: false) or globally.
 * 2. If the resident is a tenant (occupantType === 'tenant' or 'kirayedar'),
 *    "(کرایہ دار)" is appended in brackets: e.g. "سکندر صاحب (کرایہ دار)" or "سکندر (کرایہ دار)".
 * 3. Fully idempotent: will never duplicate "صاحب" or "(کرایہ دار)".
 */

/**
 * Strips existing "صاحب", "(کرایہ دار)", etc. to return the clean base name.
 * e.g. "سکندر صاحب (کرایہ دار)" -> "سکندر"
 *      "راشد صاحب" -> "راشد"
 *      "انجم پرویز" -> "انجم پرویز"
 */
export function cleanResidentBaseName(rawName) {
  if (!rawName) return '';
  let str = String(rawName).trim();
  // Strip tenant bracket in Urdu, English or Roman
  str = str.replace(/\s*\((?:کرایہ\s*دار|کرائے\s*دار|tenant|kirayedar)\)/gi, '').trim();
  // Strip trailing "صاحب" or "Sahab" or "Sahib"
  str = str.replace(/\s+(?:صاحب|sahab|sahib)$/gi, '').trim();
  return str || String(rawName).trim();
}

/**
 * Resolves occupantType ('owner' | 'tenant') for a given flat.
 */
export function resolveResidentOccupantType(flat, residentDirectory = []) {
  if (!flat) return 'owner';
  if (flat.occupantType) return flat.occupantType;
  if (Array.isArray(residentDirectory) && residentDirectory.length > 0) {
    const match = residentDirectory.find(r => r.flat === flat.flat || (r.sno && r.sno === flat.sno));
    if (match && match.occupantType) {
      return match.occupantType;
    }
  }
  if (/\((?:کرایہ\s*دار|کرائے\s*دار|tenant|kirayedar)\)/i.test(flat.name || '')) {
    return 'tenant';
  }
  return 'owner';
}

/**
 * Formats a resident's display name adhering to the building rules:
 * - When includeSahab is true (Default):
 *     - Owner: "[Base Name] صاحب" (e.g. "راشد صاحب", "انجم پرویز صاحب")
 *     - Tenant: "[Base Name] صاحب (کرایہ دار)" (e.g. "سکندر صاحب (کرایہ دار)")
 * - When includeSahab is false:
 *     - Owner: "[Base Name]" (e.g. "راشد", "انجم پرویز")
 *     - Tenant: "[Base Name] (کرایہ دار)" (e.g. "سکندر (کرایہ دار)")
 *
 * @param {object|string} flatOrName - Flat object or resident name string
 * @param {string|Array} [occupantTypeOrDirectory] - Explicit occupantType ('owner'|'tenant') OR residentDirectory array
 * @param {boolean} [explicitIncludeSahab] - Override to force include/exclude "صاحب"
 * @returns {string} Formatted display name
 */
export function formatResidentDisplayName(flatOrName, occupantTypeOrDirectory, explicitIncludeSahab) {
  if (!flatOrName) return '';
  let rawName = '';
  let occupantType = null;
  let hasExplicitOccupantType = false;
  let includeSahab = true; // Default: true (By default likha ho)

  if (typeof flatOrName === 'object' && flatOrName !== null) {
    rawName = flatOrName.name || '';
    if (flatOrName.includeSahab !== undefined) {
      includeSahab = flatOrName.includeSahab !== false;
    }

    if (flatOrName.occupantType) {
      occupantType = flatOrName.occupantType;
      hasExplicitOccupantType = true;
    } else if (Array.isArray(occupantTypeOrDirectory)) {
      const match = occupantTypeOrDirectory.find(r => r.flat === flatOrName.flat || (r.sno && r.sno === flatOrName.sno));
      if (match) {
        if (match.occupantType) {
          occupantType = match.occupantType;
          hasExplicitOccupantType = true;
        }
        if (match.includeSahab !== undefined && flatOrName.includeSahab === undefined) {
          includeSahab = match.includeSahab !== false;
        }
      }
    } else if (typeof occupantTypeOrDirectory === 'string' && occupantTypeOrDirectory) {
      occupantType = occupantTypeOrDirectory;
      hasExplicitOccupantType = true;
    }
  } else {
    rawName = String(flatOrName);
    if (typeof occupantTypeOrDirectory === 'string' && occupantTypeOrDirectory) {
      occupantType = occupantTypeOrDirectory;
      hasExplicitOccupantType = true;
    }
  }

  // Explicit third parameter overrides object setting
  if (typeof explicitIncludeSahab === 'boolean') {
    includeSahab = explicitIncludeSahab;
  }

  // Fallback detection only when occupantType was NOT explicitly specified
  if (!hasExplicitOccupantType) {
    if (/\((?:کرایہ\s*دار|کرائے\s*دار|tenant|kirayedar)\)/i.test(rawName)) {
      occupantType = 'tenant';
    } else if (typeof flatOrName === 'object' && flatOrName?.notes && /(?:tenant|kirayedar|کرایہ)/i.test(flatOrName.notes)) {
      occupantType = 'tenant';
    } else {
      occupantType = 'owner';
    }
  }

  const base = cleanResidentBaseName(rawName);
  if (!base) return '';

  const isTenant = occupantType === 'tenant' || occupantType === 'kirayedar';
  const suffix = includeSahab ? ' صاحب' : '';
  const tenantTag = isTenant ? ' (کرایہ دار)' : '';

  return `${base}${suffix}${tenantTag}`;
}

/**
 * Returns the title name only without the tenant bracket (e.g. "سکندر صاحب" or "سکندر").
 */
export function getResidentTitleOnly(flatOrName, explicitIncludeSahab) {
  if (!flatOrName) return '';
  let includeSahab = true;
  let rawName = '';

  if (typeof flatOrName === 'object' && flatOrName !== null) {
    rawName = flatOrName.name || '';
    if (flatOrName.includeSahab !== undefined) {
      includeSahab = flatOrName.includeSahab !== false;
    }
  } else {
    rawName = String(flatOrName);
  }

  if (typeof explicitIncludeSahab === 'boolean') {
    includeSahab = explicitIncludeSahab;
  }

  const base = cleanResidentBaseName(rawName);
  if (!base) return '';
  return includeSahab ? `${base} صاحب` : base;
}

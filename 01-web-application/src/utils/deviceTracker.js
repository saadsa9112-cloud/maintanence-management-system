/**
 * Device Origin & Fingerprint Detector
 * Accurately determines if the current session is running from a Mobile device,
 * Tablet, or Desktop PC, and formats human-friendly audit action summaries.
 */

export function getDeviceFingerprint() {
  if (typeof window === 'undefined' || !navigator) {
    return {
      type: 'pc',
      name: 'Server / Desktop',
      labelUrdu: 'کمپیوٹر (PC)',
      icon: 'monitor',
      platform: 'Unknown'
    };
  }

  const ua = navigator.userAgent || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /(iPad|Tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua);
  
  let type = 'pc';
  let name = 'Windows PC (Desktop)';
  let labelUrdu = 'کمپیوٹر (PC)';
  let icon = 'monitor';

  if (isTablet) {
    type = 'tablet';
    name = /iPad/i.test(ua) ? 'Apple iPad' : 'Android Tablet';
    labelUrdu = 'ٹیبلٹ (Tablet)';
    icon = 'tablet';
  } else if (isMobile) {
    type = 'mobile';
    if (/iPhone/i.test(ua)) {
      name = 'iPhone (Mobile)';
    } else if (/Android/i.test(ua)) {
      name = 'Android Smartphone';
    } else {
      name = 'Mobile Device';
    }
    labelUrdu = 'موبائل (Mobile)';
    icon = 'smartphone';
  } else {
    if (/Mac/i.test(ua)) {
      name = 'Apple Mac';
      labelUrdu = 'میک بک (Mac)';
    } else if (/Linux/i.test(ua)) {
      name = 'Linux Desktop';
      labelUrdu = 'لینکس پی سی (Linux)';
    } else {
      name = 'Windows PC (Desktop)';
      labelUrdu = 'کمپیوٹر (Windows PC)';
    }
  }

  return {
    type, // 'mobile' | 'pc' | 'tablet'
    name,
    labelUrdu,
    icon,
    userAgent: ua,
    screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'
  };
}

/**
 * Creates a structured audit log entry for any system update
 */
export function createSyncLogEntry(actionTitle, actionDetails = '', category = 'general') {
  const device = getDeviceFingerprint();
  return {
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    displayTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    displayDate: new Date().toLocaleDateString('en-GB'),
    deviceType: device.type,
    deviceName: device.name,
    deviceLabelUrdu: device.labelUrdu,
    actionTitle,
    actionDetails,
    category
  };
}

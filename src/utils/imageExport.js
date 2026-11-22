/**
 * imageExport.js
 * High-Resolution PNG Graphic Card Exporter for Maintenance Bills & Receipts
 * Uses html-to-image with Retina 2x pixel ratio for sharp, crisp printable cards.
 */

import { toPng, toBlob } from 'html-to-image';

/**
 * Downloads a DOM element as a crisp PNG image file
 * @param {HTMLElement} element - Target HTML container
 * @param {string} fileName - Destination file name (e.g. AlMustafa_Bill_Flat_G-1.png)
 * @returns {Promise<boolean>}
 */
export async function downloadElementAsPng(element, fileName = 'AlMustafa_Maintenance_Slip.png') {
  if (!element) {
    console.error('downloadElementAsPng: Target DOM element not found');
    return false;
  }

  try {
    // 2x Retina rendering for crisp text and Urdu font clarity
    const dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true
    });

    const link = document.createElement('a');
    link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Failed to export element to PNG:', err);
    return false;
  }
}

/**
 * Shares image directly via Web Share API (Mobile WhatsApp attachment)
 * Falls back to download if Web Share is unsupported.
 */
export async function shareElementAsImage(element, fileName = 'AlMustafa_Maintenance_Slip.png', title = 'Maintenance Demand Slip') {
  if (!element) return false;

  try {
    const blob = await toBlob(element, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true
    });

    if (!blob) return false;

    const file = new File([blob], fileName, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: title,
        text: `${title} — Al Mustafa Heights 5-E-18/19`
      });
      return true;
    }
  } catch (err) {
    if (err.name === 'AbortError') return true; // User cancelled
    console.warn('Web Share unsupported or failed, falling back to download:', err);
  }

  // Fallback to direct download
  return downloadElementAsPng(element, fileName);
}

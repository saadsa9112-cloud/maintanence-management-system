import ExcelJS from 'exceljs';
import { sortMonthsChronologically } from './monthUtils.js';
import { formatResidentDisplayName } from './residentUtils.js';

// Helper styles
const fontSegoe = (size = 11, bold = false, color = '000000') => ({
  name: 'Segoe UI',
  size,
  bold,
  color: { argb: color }
});

const fillSolid = (argb) => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb }
});

const thinBorder = {
  top: { style: 'thin', color: { argb: 'D0D5DD' } },
  bottom: { style: 'thin', color: { argb: 'D0D5DD' } },
  left: { style: 'thin', color: { argb: 'D0D5DD' } },
  right: { style: 'thin', color: { argb: 'D0D5DD' } }
};

const alignCenter = { vertical: 'middle', horizontal: 'center' };
const alignRight = { vertical: 'middle', horizontal: 'right' };

/**
 * Formats a single monthly sheet with exact colors, zebra styling, and formulas
 * Perfectly scaled to cover 1 full portrait A4 page without spillover
 */
export function populateMonthlyWorksheet(ws, monthKey, monthData, buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19') {
  if (!monthData) return;

  // Page setup: Full Portrait A4, 1-page fit
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    printArea: 'A1:H33',
    horizontalCentered: true,
    verticalCentered: false,
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.35,
      bottom: 0.35,
      header: 0.15,
      footer: 0.15
    }
  };

  ws.views = [{ showGridLines: true, rightToLeft: false }];

  // Column definitions matching master template
  ws.columns = [
    { key: 'A', width: 17 },   // تفصیلات (Notes)
    { key: 'B', width: 16.5 }, // اخراجات کی رقم (Expense Amount)
    { key: 'C', width: 22 },   // اخراجات کی تفصیل (Expense Description)
    { key: 'D', width: 15 },   // مینٹیننس (Maintenance Paid)
    { key: 'E', width: 14 },   // بقایا رقم (Arrears / Outstanding)
    { key: 'F', width: 19 },   // نام (Resident Name)
    { key: 'G', width: 13.5 }, // فلیٹ نمبر (Flat No)
    { key: 'H', width: 12 }    // سیریل نمبر (Serial No)
  ];

  // Row 1: Main Building Title Banner (Merged A1:H1) - Height 36
  ws.mergeCells('A1:H1');
  const titleCell = ws.getCell('A1');
  titleCell.value = buildingName;
  titleCell.font = fontSegoe(15, true, 'FFFFFFFF');
  titleCell.alignment = alignCenter;

  const row1 = ws.getRow(1);
  row1.height = 36;
  for (let c = 1; c <= 8; c++) {
    row1.getCell(c).fill = fillSolid('FF1B365D');
    row1.getCell(c).border = thinBorder;
  }

  // Row 2: Badge Row (Year, Month, Date) - Height 25
  const row2 = ws.getRow(2);
  row2.height = 25;

  // A2: Year Value | B2: 'سال'
  ws.getCell('A2').value = monthData.year || 2026;
  ws.getCell('A2').font = fontSegoe(11, true, 'FF000000');
  ws.getCell('A2').fill = fillSolid('FFF2F4F8');
  ws.getCell('A2').alignment = alignCenter;
  ws.getCell('A2').border = thinBorder;

  ws.getCell('B2').value = 'سال';
  ws.getCell('B2').font = fontSegoe(11, true, 'FF1F4E79');
  ws.getCell('B2').fill = fillSolid('FFD9E1F2');
  ws.getCell('B2').alignment = alignCenter;
  ws.getCell('B2').border = thinBorder;

  // C2: Separator cell
  ws.getCell('C2').value = '';
  ws.getCell('C2').fill = fillSolid('FFFFFFFF');
  ws.getCell('C2').border = thinBorder;

  // D2: Month Name | E2: 'مہینہ'
  ws.getCell('D2').value = String(monthKey || '').toUpperCase();
  ws.getCell('D2').font = fontSegoe(11, true, 'FF000000');
  ws.getCell('D2').fill = fillSolid('FFF2F4F8');
  ws.getCell('D2').alignment = alignCenter;
  ws.getCell('D2').border = thinBorder;

  ws.getCell('E2').value = 'مہینہ';
  ws.getCell('E2').font = fontSegoe(11, true, 'FF1F4E79');
  ws.getCell('E2').fill = fillSolid('FFD9E1F2');
  ws.getCell('E2').alignment = alignCenter;
  ws.getCell('E2').border = thinBorder;

  // F2: Separator cell
  ws.getCell('F2').value = '';
  ws.getCell('F2').fill = fillSolid('FFFFFFFF');
  ws.getCell('F2').border = thinBorder;

  // G2: Statement Date | H2: 'تاریخ'
  const displayDate = monthData.dateStr || '28-Oct-2026';
  ws.getCell('G2').value = displayDate;
  ws.getCell('G2').font = fontSegoe(11, true, 'FF000000');
  ws.getCell('G2').fill = fillSolid('FFF2F4F8');
  ws.getCell('G2').alignment = alignCenter;
  ws.getCell('G2').border = thinBorder;

  ws.getCell('H2').value = 'تاریخ';
  ws.getCell('H2').font = fontSegoe(11, true, 'FF1F4E79');
  ws.getCell('H2').fill = fillSolid('FFD9E1F2');
  ws.getCell('H2').alignment = alignCenter;
  ws.getCell('H2').border = thinBorder;

  // Row 3: Table Column Headers (A to H) - Height 28
  const row3 = ws.getRow(3);
  row3.height = 28;
  const headers = [
    { col: 1, text: 'تفصیلات' },
    { col: 2, text: 'اخراجات کی رقم' },
    { col: 3, text: 'اخراجات کی تفصیل' },
    { col: 4, text: 'مینٹیننس' },
    { col: 5, text: 'بقایا رقم' },
    { col: 6, text: 'نام' },
    { col: 7, text: 'فلیٹ نمبر' },
    { col: 8, text: 'سیریل نمبر' }
  ];

  headers.forEach(h => {
    const cell = row3.getCell(h.col);
    cell.value = h.text;
    cell.font = fontSegoe(11, true, 'FFFFFFFF');
    cell.fill = fillSolid('FF203764');
    cell.alignment = alignCenter;
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF1B365D' } },
      bottom: { style: 'medium', color: { argb: 'FF1B365D' } },
      left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
    };
  });

  const flats = monthData.flats || [];
  const expenses = monthData.expenses || [];

  const totalMaint = flats.reduce((acc, f) => acc + (f && f.status !== 'closed' ? (Number(f.paid) || 0) : 0), 0);
  const totalArrears = flats.reduce((acc, f) => acc + (f && (f.status === 'arrears' || (f.status !== 'closed' && Number(f.arrears) > 0)) ? (Number(f.arrears) || 0) : 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const prevSavings = Number(monthData.prevSavings) || 0;
  const closingSavings = totalMaint + prevSavings - totalExpenses;

  // Data Rows 4 to 23 (Exactly 20 Flats, filling full portrait page)
  const maxRows = Math.max(20, flats.length);

  for (let i = 0; i < maxRows; i++) {
    const rowNum = 4 + i;
    const row = ws.getRow(rowNum);
    row.height = 23; // Fits neatly on 1 portrait page along with executive summary cards

    const isEven = i % 2 === 0;
    const baseZebraFill = isEven ? 'FFF9FAFB' : 'FFFFFFFF';

    const flatItem = flats[i] || null;
    const expItem = expenses[i] || null;

    // Col H (Col 8): Serial No
    const cellH = row.getCell(8);
    cellH.value = flatItem ? flatItem.sno : (i + 1);
    cellH.font = fontSegoe(10.5, false, 'FF000000');
    cellH.alignment = alignCenter;
    cellH.fill = fillSolid(baseZebraFill);
    cellH.border = thinBorder;

    // Col G (Col 7): Flat Number
    const cellG = row.getCell(7);
    cellG.value = flatItem ? flatItem.flat : '';
    cellG.font = fontSegoe(11, true, 'FF000000');
    cellG.alignment = alignCenter;
    cellG.fill = fillSolid(baseZebraFill);
    cellG.border = thinBorder;

    // Col F (Col 6): Resident Name
    const cellF = row.getCell(6);
    cellF.value = flatItem ? formatResidentDisplayName(flatItem) : '';
    cellF.font = fontSegoe(11, true, 'FF1F385C');
    cellF.alignment = alignRight;
    cellF.fill = fillSolid(baseZebraFill);
    cellF.border = thinBorder;

    // Col D (Col 4): Maintenance Paid
    const cellD = row.getCell(4);
    if (flatItem && flatItem.status === 'closed') {
      cellD.value = 'گھر بند ہے';
      cellD.font = fontSegoe(11, true, 'FFB25900'); // Bold Orange/Amber
      cellD.alignment = alignCenter;
    } else {
      const paidNum = flatItem ? (Number(flatItem.paid) || 0) : 0;
      cellD.value = paidNum;
      cellD.numFmt = '#,##0';
      cellD.font = fontSegoe(11, true, 'FF1E4D2B'); // Bold Dark Green
      cellD.alignment = alignCenter;
    }
    cellD.fill = fillSolid(baseZebraFill);
    cellD.border = thinBorder;

    // Col E (Col 5): Arrears / Baqaya
    const cellE = row.getCell(5);
    const arrearsNum = flatItem && flatItem.status !== 'closed' ? (Number(flatItem.arrears) || 0) : 0;
    if (arrearsNum > 0) {
      cellE.value = arrearsNum;
      cellE.numFmt = '#,##0';
      cellE.font = fontSegoe(11, true, 'FFC00000'); // Bold Red
      cellE.fill = fillSolid('FFFFF2F2');          // Soft Red / Pink Tint
    } else {
      cellE.value = null;
      cellE.fill = fillSolid(baseZebraFill);
    }
    cellE.alignment = alignCenter;
    cellE.border = thinBorder;

    // Left Side: Expenses & Summary Rows (Cols A, B, C)
    const cellA = row.getCell(1);
    const cellB = row.getCell(2);
    const cellC = row.getCell(3);

    cellA.border = thinBorder;
    cellB.border = thinBorder;
    cellC.border = thinBorder;

    if (i === 15) {
      // Row 19 (Flat P-1): کل اخراجات
      cellC.value = 'کل اخراجات';
      cellC.font = fontSegoe(11, true, 'FF922B21');
      cellC.fill = fillSolid('FFFCE4D6');
      cellC.alignment = alignCenter;

      cellB.value = { formula: 'SUM(B4:B18)', result: totalExpenses };
      cellB.numFmt = '#,##0';
      cellB.font = fontSegoe(11, true, 'FF922B21');
      cellB.fill = fillSolid('FFFCE4D6');
      cellB.alignment = alignCenter;

      cellA.value = null;
      cellA.fill = fillSolid('FFFFFFFF');
    } else if (i === 17) {
      // Row 21 (Flat P-3): پچھلی بچت
      cellC.value = 'پچھلی بچت';
      cellC.font = fontSegoe(11, true, 'FF1B4F72');
      cellC.fill = fillSolid('FFEDF2F8');
      cellC.alignment = alignCenter;

      cellB.value = prevSavings;
      cellB.numFmt = '#,##0';
      cellB.font = fontSegoe(11, true, 'FF1B4F72');
      cellB.fill = fillSolid('FFEDF2F8');
      cellB.alignment = alignCenter;

      cellA.value = null;
      cellA.fill = fillSolid('FFFFFFFF');
    } else if (i === 18) {
      // Row 22 (Flat P-4): کل بچت (D24 + B21 - B19)
      cellC.value = 'کل بچت';
      cellC.font = fontSegoe(11, true, 'FF145A32');
      cellC.fill = fillSolid('FFD4EFDF');
      cellC.alignment = alignCenter;

      cellB.value = { formula: 'D24+B21-B19', result: closingSavings };
      cellB.numFmt = '#,##0';
      cellB.font = fontSegoe(11, true, 'FF145A32');
      cellB.fill = fillSolid('FFD4EFDF');
      cellB.alignment = alignCenter;

      cellA.value = null;
      cellA.fill = fillSolid('FFFFFFFF');
    } else {
      const noteVal = (flatItem && (flatItem.adjustmentNote || flatItem.notes)) || (expItem ? expItem.details : null);
      if (noteVal) {
        cellA.value = noteVal;
        cellA.font = fontSegoe(9.5, false, 'FF444444');
        cellA.alignment = alignRight;
      } else {
        cellA.value = null;
      }

      if (expItem) {
        cellB.value = Number(expItem.amount) || null;
        if (cellB.value !== null) cellB.numFmt = '#,##0';
        cellB.font = fontSegoe(11, true, 'FF000000');
        cellB.alignment = alignCenter;

        cellC.value = expItem.desc || null;
        cellC.font = fontSegoe(11, true, 'FF1F385C');
        cellC.alignment = alignRight;
      } else {
        cellB.value = null;
        cellC.value = null;
      }

      cellA.fill = fillSolid(baseZebraFill);
      cellB.fill = fillSolid(baseZebraFill);
      cellC.fill = fillSolid(baseZebraFill);
    }
  }

  // Row 24: Total Reconciliation Summary (Double Bottom Border) - Height 32
  const row24 = ws.getRow(24);
  row24.height = 32;

  const totalBorder = {
    top: { style: 'thin', color: { argb: 'FF1F4E79' } },
    bottom: { style: 'double', color: { argb: 'FF1F4E79' } },
    left: { style: 'thin', color: { argb: 'D0D5DD' } },
    right: { style: 'thin', color: { argb: 'D0D5DD' } }
  };

  // Merge F24:H24 for 'کُل میزان (Total Reconciled)'
  ws.mergeCells('F24:H24');
  const labelCell = ws.getCell('F24');
  labelCell.value = 'کُل میزان (Total Reconciled)';
  labelCell.font = fontSegoe(11.5, true, 'FF1F4E79');
  labelCell.alignment = alignCenter;

  for (let c = 1; c <= 8; c++) {
    const cell = row24.getCell(c);
    cell.fill = fillSolid('FFD9E1F2');
    cell.border = totalBorder;
  }

  // D24: Sum of Maintenance D4:D23
  const cellD24 = ws.getCell('D24');
  cellD24.value = { formula: 'SUM(D4:D23)', result: totalMaint };
  cellD24.numFmt = '#,##0';
  cellD24.font = fontSegoe(12, true, 'FF1E4D2B');
  cellD24.alignment = alignCenter;

  // E24: Sum of Arrears E4:E23
  const cellE24 = ws.getCell('E24');
  cellE24.value = { formula: 'SUM(E4:E23)', result: totalArrears };
  cellE24.numFmt = '#,##0';
  cellE24.font = fontSegoe(12, true, 'FFC00000');
  cellE24.alignment = alignCenter;

  // Row 25: Spacer (Height 8)
  const row25 = ws.getRow(25);
  row25.height = 8;

  // Row 26: Section Header Ribbon (Merged A26:H26) - Height 24
  ws.mergeCells('A26:H26');
  const ribbonCell = ws.getCell('A26');
  ribbonCell.value = '📊 ایگزیکٹو سمری و تجزیاتی کارڈز (Executive Summary & KPI Dashboard)';
  ribbonCell.font = fontSegoe(11, true, 'FFFFFFFF');
  ribbonCell.alignment = alignCenter;
  for (let c = 1; c <= 8; c++) {
    const cell = ws.getRow(26).getCell(c);
    cell.fill = fillSolid('FF1B365D');
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF1F4E79' } },
      bottom: { style: 'medium', color: { argb: 'FF1F4E79' } },
      left: { style: c === 1 ? 'medium' : 'thin', color: { argb: 'FF1F4E79' } },
      right: { style: c === 8 ? 'medium' : 'thin', color: { argb: 'FF1F4E79' } }
    };
  }

  // Row Heights for KPI Cards (Rows 27, 28, 29)
  ws.getRow(27).height = 18;
  ws.getRow(28).height = 24;
  ws.getRow(29).height = 16;

  // KPI Subtext calculations
  const activeFlats = flats.filter(f => f && f.status !== 'closed');
  const paidFlats = activeFlats.filter(f => (Number(f.paid) || 0) > 0 && (!f.arrears || Number(f.arrears) === 0));
  const arrearsFlats = activeFlats.filter(f => Number(f.arrears) > 0);
  const closedFlats = flats.filter(f => f && f.status === 'closed');
  const activeExpenses = expenses.filter(e => Number(e.amount) > 0);

  const collectedPct = activeFlats.length > 0 ? Math.round((paidFlats.length / activeFlats.length) * 100) : 0;
  const subtextCollected = `${collectedPct}% وصولی (${paidFlats.length}/${activeFlats.length} فلیٹس)`;
  const subtextArrears = `${arrearsFlats.length} فلیٹس کی طرف بقایا`;
  const subtextExpenses = `${activeExpenses.length} مدات میں خرچ`;
  const subtextClosing = 'پچھلی بچت شامل کر کے';

  // Helper to style each KPI Card across 2 columns and rows 27-29
  const styleCard = (startCol, endCol, fillHex, borderHex, label, formulaStr, resultVal, subtext, textHex, subHex) => {
    for (let r = 27; r <= 29; r++) {
      ws.mergeCells(r, startCol, r, endCol);
      for (let c = startCol; c <= endCol; c++) {
        const cell = ws.getRow(r).getCell(c);
        cell.fill = fillSolid(fillHex);
        cell.border = {
          top: { style: r === 27 ? 'medium' : 'thin', color: { argb: borderHex } },
          bottom: { style: r === 29 ? 'medium' : 'thin', color: { argb: borderHex } },
          left: { style: c === startCol ? 'medium' : 'thin', color: { argb: borderHex } },
          right: { style: c === endCol ? 'medium' : 'thin', color: { argb: borderHex } }
        };
      }
    }

    // Row 27: Title
    const cLbl = ws.getRow(27).getCell(startCol);
    cLbl.value = label;
    cLbl.font = fontSegoe(10, true, textHex);
    cLbl.alignment = alignCenter;

    // Row 28: Formula Value
    const cVal = ws.getRow(28).getCell(startCol);
    cVal.value = { formula: formulaStr, result: resultVal };
    cVal.numFmt = '"Rs. " #,##0';
    cVal.font = fontSegoe(14.5, true, textHex);
    cVal.alignment = alignCenter;

    // Row 29: Subtext
    const cSub = ws.getRow(29).getCell(startCol);
    cSub.value = subtext;
    cSub.font = { name: 'Segoe UI', size: 9, bold: false, italic: true, color: { argb: subHex } };
    cSub.alignment = alignCenter;
  };

  // Card 1 (Cols G & H: 7-8): 💰 کُل وصولی (Total Collected)
  styleCard(7, 8, 'FFE2EFDA', 'FFA9DFBF', '💰 کُل وصولی (Total Collected)', 'D24', totalMaint, subtextCollected, 'FF145A32', 'FF1E8449');

  // Card 2 (Cols E & F: 5-6): ⚠️ کُل بقایا جات (Outstanding)
  styleCard(5, 6, 'FFFCE4D6', 'FFF5B7B1', '⚠️ کُل بقایا جات (Outstanding)', 'E24', totalArrears, subtextArrears, 'FFC00000', 'FFB03A2E');

  // Card 3 (Cols C & D: 3-4): 📉 کُل اخراجات (Expenses)
  styleCard(3, 4, 'FFFFF2CC', 'FFF9E79F', '📉 کُل اخراجات (Expenses)', 'B19', totalExpenses, subtextExpenses, 'FFB25900', 'FFD35400');

  // Card 4 (Cols A & B: 1-2): 🏦 حتمی کیش بیلنس (Closing)
  styleCard(1, 2, 'FFD9E1F2', 'FFAEC6CF', '🏦 حتمی کیش بیلنس (Closing)', 'B22', closingSavings, subtextClosing, 'FF1B4F72', 'FF2980B9');

  // Row 30: Spacer (Height 8)
  ws.getRow(30).height = 8;

  // Row 31: Flat Status Summary Line (Merged A31:H31) - Height 22
  ws.mergeCells('A31:H31');
  const row31 = ws.getRow(31);
  row31.height = 22;

  const partialSummaryStr = arrearsFlats.length > 0
    ? `${arrearsFlats.length} فلیٹ جزوی بقایا (${arrearsFlats.map(f => f.flat).filter(Boolean).join(', ')})`
    : '0 فلیٹ بقایا';
  const closedSummaryStr = closedFlats.length > 0
    ? `${closedFlats.length} گھر بند (${closedFlats.map(f => formatResidentDisplayName(f) || f.flat).filter(Boolean).join(', ')})`
    : 'تمام گھر آباد';
  const statusSummaryText = `🏢 فلیٹ اسٹیٹس سمری:  ${paidFlats.length} فلیٹ ادا شدہ (مکمل)   |   ${partialSummaryStr}   |   ${closedSummaryStr}   |   1 دکاندار`;

  const bannerCell = ws.getCell('A31');
  bannerCell.value = statusSummaryText;
  bannerCell.font = fontSegoe(10.5, true, 'FF2C3E50');
  bannerCell.alignment = alignCenter;

  for (let c = 1; c <= 8; c++) {
    const cell = row31.getCell(c);
    cell.fill = fillSolid('FFF2F4F8');
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFBDC3C7' } },
      bottom: { style: 'thin', color: { argb: 'FFBDC3C7' } },
      left: { style: c === 1 ? 'thin' : undefined, color: { argb: 'FFBDC3C7' } },
      right: { style: c === 8 ? 'thin' : undefined, color: { argb: 'FFBDC3C7' } }
    };
  }

  // Row 32: Spacer (Height 6)
  ws.getRow(32).height = 6;

  // Row 33: Management Attribution Banner (Merged A33:H33) - Height 20
  ws.mergeCells('A33:H33');
  const row33 = ws.getRow(33);
  row33.height = 20;

  const mgrCell = ws.getCell('A33');
  mgrCell.value = '🏢 Maintenance Managed by: Hafiz Muhammad Saad  |  Al-Mustafa Heights 5-E-18/19';
  mgrCell.font = fontSegoe(10, true, 'FF1B365D');
  mgrCell.alignment = alignCenter;

  for (let c = 1; c <= 8; c++) {
    const cell = row33.getCell(c);
    cell.fill = fillSolid('FFE9EEF4');
    cell.border = thinBorder;
  }
}

/**
 * Exports a single month formatted workbook
 */
export async function exportToExcel(monthKey, monthData, buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19') {
  if (!monthData) return;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Hafiz Muhammad Saad - Al-Mustafa Heights Maintenance';
  wb.created = new Date();

  const ws = wb.addWorksheet(monthKey || 'Sheet1');
  populateMonthlyWorksheet(ws, monthKey, monthData, buildingName);

  const buffer = await wb.xlsx.writeBuffer();
  triggerBrowserDownload(buffer, `MAINTANENCE_SHEET_${monthKey}_${monthData.year || 2026}.xlsx`);
}

/**
 * Exports an all-in-one consolidated workbook with:
 * - Overview (ماہانہ جائزہ) tab
 * - Each monthly register in chronological order (Jan -> Dec)
 */
export async function exportAllMonthsToExcel(allMonthsData = {}, monthOrder = [], buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Hafiz Muhammad Saad - Al-Mustafa Heights Maintenance';
  wb.created = new Date();

  const sortedKeys = sortMonthsChronologically(monthOrder);

  // Tab 1: Multi-Month Overview (ماہانہ جائزہ)
  const overviewWs = wb.addWorksheet('ماہانہ جائزہ (Overview)', {
    views: [{ showGridLines: true, rightToLeft: false }],
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1
    }
  });

  overviewWs.columns = [
    { key: 'A', width: 32 },
    ...sortedKeys.map(k => ({ key: k, width: 18 })),
    { key: 'Total', width: 22 }
  ];

  // Header Banner
  overviewWs.mergeCells(2, 1, 3, sortedKeys.length + 2);
  const head = overviewWs.getCell(2, 1);
  head.value = `${buildingName} — سالانہ و ماہانہ مالیاتی جائزہ (ANNUAL LEDGER OVERVIEW 2026)`;
  head.font = fontSegoe(14, true, 'FFFFFFFF');
  head.alignment = alignCenter;

  for (let r = 2; r <= 3; r++) {
    for (let c = 1; c <= sortedKeys.length + 2; c++) {
      overviewWs.getRow(r).getCell(c).fill = fillSolid('FF1B365D');
    }
  }

  // Row 5: Column headers
  const row5 = overviewWs.getRow(5);
  row5.height = 26;
  row5.getCell(1).value = 'مالیاتی خلاصہ (Financial Metrics)';
  row5.getCell(1).font = fontSegoe(11, true, 'FFFFFFFF');
  row5.getCell(1).fill = fillSolid('FF203764');
  row5.getCell(1).alignment = alignCenter;

  sortedKeys.forEach((k, idx) => {
    const c = row5.getCell(idx + 2);
    c.value = `${k} 2026`;
    c.font = fontSegoe(11, true, 'FFFFFFFF');
    c.fill = fillSolid('FF203764');
    c.alignment = alignCenter;
  });

  const totCol = row5.getCell(sortedKeys.length + 2);
  totCol.value = 'سالانہ مجموعہ (Total)';
  totCol.font = fontSegoe(11, true, 'FFFFFFFF');
  totCol.fill = fillSolid('FF203764');
  totCol.alignment = alignCenter;

  // Row 6: Collections
  const row6 = overviewWs.getRow(6);
  row6.getCell(1).value = '💰 کُل وصول شدہ مینٹیننس (Collections)';
  row6.getCell(1).font = fontSegoe(11, true, 'FF145A32');
  row6.getCell(1).fill = fillSolid('FFE2EFDA');

  let grandCollections = 0;
  sortedKeys.forEach((k, idx) => {
    const mData = allMonthsData[k];
    const val = (mData?.flats || []).reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
    grandCollections += val;
    const c = row6.getCell(idx + 2);
    c.value = val;
    c.numFmt = '#,##0';
    c.font = fontSegoe(11, true, 'FF145A32');
    c.fill = fillSolid('FFE2EFDA');
    c.alignment = alignCenter;
  });
  const c6Tot = row6.getCell(sortedKeys.length + 2);
  c6Tot.value = grandCollections;
  c6Tot.numFmt = '#,##0';
  c6Tot.font = fontSegoe(11, true, 'FF145A32');
  c6Tot.fill = fillSolid('FFE2EFDA');
  c6Tot.alignment = alignCenter;

  // Row 7: Expenses
  const row7 = overviewWs.getRow(7);
  row7.getCell(1).value = '📉 کُل بلڈنگ اخراجات (Expenses)';
  row7.getCell(1).font = fontSegoe(11, true, 'FFB25900');
  row7.getCell(1).fill = fillSolid('FFFFF2CC');

  let grandExpenses = 0;
  sortedKeys.forEach((k, idx) => {
    const mData = allMonthsData[k];
    const val = (mData?.expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
    grandExpenses += val;
    const c = row7.getCell(idx + 2);
    c.value = val;
    c.numFmt = '#,##0';
    c.font = fontSegoe(11, true, 'FFB25900');
    c.fill = fillSolid('FFFFF2CC');
    c.alignment = alignCenter;
  });
  const c7Tot = row7.getCell(sortedKeys.length + 2);
  c7Tot.value = grandExpenses;
  c7Tot.numFmt = '#,##0';
  c7Tot.font = fontSegoe(11, true, 'FFB25900');
  c7Tot.fill = fillSolid('FFFFF2CC');
  c7Tot.alignment = alignCenter;

  // Row 8: Net monthly savings
  const row8 = overviewWs.getRow(8);
  row8.getCell(1).value = '💵 ماہانہ نیٹ بچت / (خسارہ)';
  row8.getCell(1).font = fontSegoe(11, true, 'FF000000');
  row8.getCell(1).fill = fillSolid('FFFFFFFF');

  sortedKeys.forEach((k, idx) => {
    const mData = allMonthsData[k];
    const coll = (mData?.flats || []).reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.paid || 0) : 0), 0);
    const exp = (mData?.expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const diff = coll - exp;
    const c = row8.getCell(idx + 2);
    c.value = diff;
    c.numFmt = '#,##0';
    c.font = fontSegoe(11, true, diff >= 0 ? 'FF145A32' : 'FFC00000');
    c.fill = fillSolid('FFFFFFFF');
    c.alignment = alignCenter;
  });
  const c8Tot = row8.getCell(sortedKeys.length + 2);
  c8Tot.value = grandCollections - grandExpenses;
  c8Tot.numFmt = '#,##0';
  c8Tot.font = fontSegoe(11, true, 'FF145A32');
  c8Tot.fill = fillSolid('FFFFFFFF');
  c8Tot.alignment = alignCenter;

  // Row 9: Total Arrears
  const row9 = overviewWs.getRow(9);
  row9.getCell(1).value = '⚠️ کُل بقایا جات (Outstanding Arrears)';
  row9.getCell(1).font = fontSegoe(11, true, 'FFC00000');
  row9.getCell(1).fill = fillSolid('FFFCE4D6');

  sortedKeys.forEach((k, idx) => {
    const mData = allMonthsData[k];
    const arr = (mData?.flats || []).reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.arrears || 0) : 0), 0);
    const c = row9.getCell(idx + 2);
    c.value = arr;
    c.numFmt = '#,##0';
    c.font = fontSegoe(11, true, 'FFC00000');
    c.fill = fillSolid('FFFCE4D6');
    c.alignment = alignCenter;
  });
  const latestMonthKey = sortedKeys[sortedKeys.length - 1];
  const latestArr = (allMonthsData[latestMonthKey]?.flats || []).reduce((acc, f) => acc + (f.status !== 'closed' ? Number(f.arrears || 0) : 0), 0);
  const c9Tot = row9.getCell(sortedKeys.length + 2);
  c9Tot.value = latestArr;
  c9Tot.numFmt = '#,##0';
  c9Tot.font = fontSegoe(11, true, 'FFC00000');
  c9Tot.fill = fillSolid('FFFCE4D6');
  c9Tot.alignment = alignCenter;

  // Add borders to Overview
  for (let r = 5; r <= 9; r++) {
    for (let c = 1; c <= sortedKeys.length + 2; c++) {
      overviewWs.getRow(r).getCell(c).border = thinBorder;
    }
  }

  // Row 11: Management Attribution
  const totalCols = sortedKeys.length + 2;
  overviewWs.mergeCells(11, 1, 11, totalCols);
  const ovMgr = overviewWs.getCell(11, 1);
  ovMgr.value = '🏢 Building Maintenance Managed by: Hafiz Muhammad Saad  |  Al-Mustafa Heights 5-E-18/19';
  ovMgr.font = fontSegoe(10.5, true, 'FF1B365D');
  ovMgr.alignment = alignCenter;
  for (let c = 1; c <= totalCols; c++) {
    const cell = overviewWs.getRow(11).getCell(c);
    cell.fill = fillSolid('FFE9EEF4');
    cell.border = thinBorder;
  }

  // Populate each individual month sheet in chronological order (Jan -> Dec)
  sortedKeys.forEach(mKey => {
    const mData = allMonthsData[mKey];
    if (mData) {
      const monthWs = wb.addWorksheet(mKey);
      populateMonthlyWorksheet(monthWs, mKey, mData, buildingName);
    }
  });

  const buffer = await wb.xlsx.writeBuffer();
  triggerBrowserDownload(buffer, `AL_MUSTAFA_HEIGHTS_MASTER_MAINTENANCE_REGISTER_2026.xlsx`);
}

function triggerBrowserDownload(buffer, filename) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

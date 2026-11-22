import ExcelJS from 'exceljs';
import { formatResidentDisplayName } from './residentUtils.js';

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

export async function exportSpecialFundToExcel(fund, buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19') {
  if (!fund) return;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Hafiz Muhammad Saad - Al-Mustafa Heights';
  wb.created = new Date();

  const wsName = (fund.name || 'SpecialFund').substring(0, 30).replace(/[:\/\\?*\[\]]/g, '_');
  const ws = wb.addWorksheet(wsName);

  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
  };

  ws.views = [{ showGridLines: true }];

  // Column definitions
  ws.columns = [
    { key: 'A', width: 8 },  // S.No
    { key: 'B', width: 14 }, // Flat No
    { key: 'C', width: 22 }, // Resident Name
    { key: 'D', width: 16 }, // Target Due
    { key: 'E', width: 16 }, // Paid Amount
    { key: 'F', width: 16 }, // Paid Date
    { key: 'G', width: 16 }, // Arrears Remaining
    { key: 'H', width: 14 }  // Status
  ];

  // Row 1: Building Banner
  ws.mergeCells('A1:H1');
  const cellA1 = ws.getCell('A1');
  cellA1.value = buildingName;
  cellA1.font = fontSegoe(14, true, 'FFFFFFFF');
  cellA1.fill = fillSolid('FF1B365D');
  cellA1.alignment = alignCenter;
  ws.getRow(1).height = 32;

  // Row 2: Fund Project Title
  ws.mergeCells('A2:H2');
  const cellA2 = ws.getCell('A2');
  cellA2.value = `🏗️ SPECIAL CAPITAL FUND: ${fund.name.toUpperCase()} (مخصوص فنڈ شیٹ)`;
  cellA2.font = fontSegoe(12, true, 'FF1F4E79');
  cellA2.fill = fillSolid('FFD9E1F2');
  cellA2.alignment = alignCenter;
  ws.getRow(2).height = 26;

  // Row 3: Metadata Badges
  ws.mergeCells('A3:D3');
  ws.getCell('A3').value = `Target Per Flat: Rs. ${Number(fund.targetPerFlat || 0).toLocaleString()}  |  Start Date: ${fund.createdDate || 'Nov 2026'}`;
  ws.getCell('A3').font = fontSegoe(10, true, 'FF333333');
  ws.getCell('A3').fill = fillSolid('FFF2F4F8');
  ws.getCell('A3').alignment = alignCenter;

  ws.mergeCells('E3:H3');
  ws.getCell('E3').value = fund.description ? `Project Purpose: ${fund.description}` : 'Independent Special Project Ledger';
  ws.getCell('E3').font = fontSegoe(10, false, 'FF555555');
  ws.getCell('E3').fill = fillSolid('FFF2F4F8');
  ws.getCell('E3').alignment = alignCenter;
  ws.getRow(3).height = 22;

  // Row 4: Spacer
  ws.getRow(4).height = 8;

  // Row 5: Table Header
  const headers = [
    { col: 1, text: 'سیریل #' },
    { col: 2, text: 'فلیٹ نمبر' },
    { col: 3, text: 'رہائشی کا نام' },
    { col: 4, text: 'مقررہ حصہ (Target)' },
    { col: 5, text: 'وصول شدہ (Paid)' },
    { col: 6, text: 'تاریخِ ادائیگی' },
    { col: 7, text: 'بقایا رقم' },
    { col: 8, text: 'اسٹیٹس' }
  ];

  const row5 = ws.getRow(5);
  row5.height = 26;
  headers.forEach(h => {
    const c = row5.getCell(h.col);
    c.value = h.text;
    c.font = fontSegoe(11, true, 'FFFFFFFF');
    c.fill = fillSolid('FF203764');
    c.alignment = alignCenter;
    c.border = thinBorder;
  });

  const flats = fund.flats || [];
  let totalTarget = 0;
  let totalPaid = 0;
  let totalArrears = 0;

  // Data rows
  flats.forEach((f, idx) => {
    const rNum = 6 + idx;
    const row = ws.getRow(rNum);
    row.height = 23;
    const isEven = idx % 2 === 0;
    const bg = isEven ? 'FFF9FAFB' : 'FFFFFFFF';

    const isClosed = f.status === 'closed';
    const target = isClosed ? 0 : Number(f.target || 0);
    const paid = isClosed ? 0 : Number(f.paid || 0);
    const arrears = isClosed ? 0 : Math.max(0, target - paid);

    totalTarget += target;
    totalPaid += paid;
    totalArrears += arrears;

    // Col A: S.No
    row.getCell(1).value = f.sno || idx + 1;
    row.getCell(1).alignment = alignCenter;

    // Col B: Flat
    row.getCell(2).value = f.flat;
    row.getCell(2).font = fontSegoe(11, true, 'FF000000');
    row.getCell(2).alignment = alignCenter;

    // Col C: Name
    row.getCell(3).value = formatResidentDisplayName(f);
    row.getCell(3).font = fontSegoe(11, false, 'FF1F385C');
    row.getCell(3).alignment = alignRight;

    // Col D: Target
    row.getCell(4).value = isClosed ? 'Closed' : target;
    if (!isClosed) row.getCell(4).numFmt = '#,##0';
    row.getCell(4).font = fontSegoe(11, true, 'FF555555');
    row.getCell(4).alignment = alignCenter;

    // Col E: Paid
    row.getCell(5).value = isClosed ? '—' : paid;
    if (!isClosed && paid > 0) row.getCell(5).numFmt = '#,##0';
    row.getCell(5).font = fontSegoe(11, true, paid > 0 ? 'FF1E4D2B' : 'FF555555');
    row.getCell(5).alignment = alignCenter;

    // Col F: Date
    row.getCell(6).value = f.paidDate || '—';
    row.getCell(6).alignment = alignCenter;

    // Col G: Arrears
    row.getCell(7).value = isClosed ? '—' : arrears;
    if (!isClosed && arrears > 0) {
      row.getCell(7).numFmt = '#,##0';
      row.getCell(7).font = fontSegoe(11, true, 'FFC00000');
      row.getCell(7).fill = fillSolid('FFFFF2F2');
    } else {
      row.getCell(7).alignment = alignCenter;
    }

    // Col H: Status
    row.getCell(8).value = isClosed ? 'گھر بند ہے' : (arrears === 0 ? 'ادا شدہ' : 'بقایا');
    row.getCell(8).font = fontSegoe(10, true, isClosed ? 'FFB25900' : (arrears === 0 ? 'FF1E4D2B' : 'FFC00000'));
    row.getCell(8).alignment = alignCenter;

    for (let c = 1; c <= 8; c++) {
      if (!row.getCell(c).fill) row.getCell(c).fill = fillSolid(bg);
      row.getCell(c).border = thinBorder;
    }
  });

  // Flat Summary Total Row
  const totalRowNum = 6 + flats.length;
  const totRow = ws.getRow(totalRowNum);
  totRow.height = 28;

  ws.mergeCells(`A${totalRowNum}:C${totalRowNum}`);
  totRow.getCell(1).value = 'کُل میزان وصولی فنڈ (Total Fund Collections)';
  totRow.getCell(1).font = fontSegoe(11, true, 'FF1F4E79');
  totRow.getCell(1).alignment = alignCenter;

  totRow.getCell(4).value = totalTarget;
  totRow.getCell(4).numFmt = '#,##0';
  totRow.getCell(4).font = fontSegoe(11.5, true, 'FF1F4E79');
  totRow.getCell(4).alignment = alignCenter;

  totRow.getCell(5).value = totalPaid;
  totRow.getCell(5).numFmt = '#,##0';
  totRow.getCell(5).font = fontSegoe(12, true, 'FF1E4D2B');
  totRow.getCell(5).alignment = alignCenter;

  totRow.getCell(6).value = '—';
  totRow.getCell(6).alignment = alignCenter;

  totRow.getCell(7).value = totalArrears;
  totRow.getCell(7).numFmt = '#,##0';
  totRow.getCell(7).font = fontSegoe(12, true, 'FFC00000');
  totRow.getCell(7).alignment = alignCenter;

  totRow.getCell(8).value = `${flats.filter(f => f.status !== 'closed' && Number(f.arrears || 0) === 0).length} Cleared`;
  totRow.getCell(8).font = fontSegoe(10, true, 'FF1E4D2B');
  totRow.getCell(8).alignment = alignCenter;

  for (let c = 1; c <= 8; c++) {
    totRow.getCell(c).fill = fillSolid('FFD9E1F2');
    totRow.getCell(c).border = {
      top: { style: 'thin', color: { argb: 'FF1F4E79' } },
      bottom: { style: 'double', color: { argb: 'FF1F4E79' } },
      left: { style: 'thin', color: { argb: 'D0D5DD' } },
      right: { style: 'thin', color: { argb: 'D0D5DD' } }
    };
  }

  // Section 2: Fund Project Expenses
  const expStartRow = totalRowNum + 2;
  ws.mergeCells(`A${expStartRow}:H${expStartRow}`);
  const expHead = ws.getCell(`A${expStartRow}`);
  expHead.value = '🧾 اس اسپیشل فنڈ کے پروجیکٹ اخراجات (Project Expenses Ledger)';
  expHead.font = fontSegoe(11.5, true, 'FFFFFFFF');
  expHead.fill = fillSolid('FF922B21');
  expHead.alignment = alignCenter;
  ws.getRow(expStartRow).height = 26;

  // Expense Column Headers
  const expColRow = expStartRow + 1;
  ws.getRow(expColRow).height = 24;
  ws.mergeCells(`B${expColRow}:D${expColRow}`);
  ws.getCell(`A${expColRow}`).value = '#';
  ws.getCell(`B${expColRow}`).value = 'اخراجات کی تفصیل (Description)';
  ws.getCell(`E${expColRow}`).value = 'کنٹریکٹر / وینڈر';
  ws.getCell(`F${expColRow}`).value = 'تاریخ';
  ws.getCell(`G${expColRow}`).value = 'رقم (Amount)';
  ws.getCell(`H${expColRow}`).value = 'تفصیل';

  for (let c = 1; c <= 8; c++) {
    const cell = ws.getRow(expColRow).getCell(c);
    cell.font = fontSegoe(10.5, true, 'FF333333');
    cell.fill = fillSolid('FFF2F4F8');
    cell.alignment = alignCenter;
    cell.border = thinBorder;
  }

  const expenses = fund.expenses || [];
  let totalSpent = 0;

  expenses.forEach((e, i) => {
    const eRow = expColRow + 1 + i;
    const amt = Number(e.amount || 0);
    totalSpent += amt;

    ws.getRow(eRow).height = 22;
    ws.mergeCells(`B${eRow}:D${eRow}`);

    ws.getCell(`A${eRow}`).value = i + 1;
    ws.getCell(`A${eRow}`).alignment = alignCenter;

    ws.getCell(`B${eRow}`).value = e.desc;
    ws.getCell(`B${eRow}`).alignment = alignRight;

    ws.getCell(`E${eRow}`).value = e.paidTo || '—';
    ws.getCell(`E${eRow}`).alignment = alignCenter;

    ws.getCell(`F${eRow}`).value = e.date || '—';
    ws.getCell(`F${eRow}`).alignment = alignCenter;

    ws.getCell(`G${eRow}`).value = amt;
    ws.getCell(`G${eRow}`).numFmt = '#,##0';
    ws.getCell(`G${eRow}`).font = fontSegoe(11, true, 'FF922B21');
    ws.getCell(`G${eRow}`).alignment = alignCenter;

    ws.getCell(`H${eRow}`).value = e.details || '—';
    ws.getCell(`H${eRow}`).alignment = alignCenter;

    for (let c = 1; c <= 8; c++) {
      ws.getRow(eRow).getCell(c).border = thinBorder;
    }
  });

  // Net Summary Box (Final 3 Rows)
  const sumRow = expColRow + 1 + Math.max(1, expenses.length);
  ws.getRow(sumRow).height = 26;
  ws.mergeCells(`A${sumRow}:F${sumRow}`);
  ws.getCell(`A${sumRow}`).value = '📉 کُل پروجیکٹ اخراجات (Total Spent From Fund)';
  ws.getCell(`A${sumRow}`).font = fontSegoe(11, true, 'FF922B21');
  ws.getCell(`A${sumRow}`).fill = fillSolid('FFFCE4D6');
  ws.getCell(`A${sumRow}`).alignment = alignCenter;

  ws.mergeCells(`G${sumRow}:H${sumRow}`);
  ws.getCell(`G${sumRow}`).value = totalSpent;
  ws.getCell(`G${sumRow}`).numFmt = '#,##0';
  ws.getCell(`G${sumRow}`).font = fontSegoe(12, true, 'FF922B21');
  ws.getCell(`G${sumRow}`).fill = fillSolid('FFFCE4D6');
  ws.getCell(`G${sumRow}`).alignment = alignCenter;

  const netRow = sumRow + 1;
  ws.getRow(netRow).height = 28;
  ws.mergeCells(`A${netRow}:F${netRow}`);
  ws.getCell(`A${netRow}`).value = '💵 بقیہ محفوظ کیش بیلنس (Remaining Reserve in Hand)';
  ws.getCell(`A${netRow}`).font = fontSegoe(11.5, true, 'FF145A32');
  ws.getCell(`A${netRow}`).fill = fillSolid('FFD4EFDF');
  ws.getCell(`A${netRow}`).alignment = alignCenter;

  const netBalance = totalPaid - totalSpent;
  ws.mergeCells(`G${netRow}:H${netRow}`);
  ws.getCell(`G${netRow}`).value = netBalance;
  ws.getCell(`G${netRow}`).numFmt = '#,##0';
  ws.getCell(`G${netRow}`).font = fontSegoe(13, true, netBalance >= 0 ? 'FF145A32' : 'FFC00000');
  ws.getCell(`G${netRow}`).fill = fillSolid('FFD4EFDF');
  ws.getCell(`G${netRow}`).alignment = alignCenter;

  // Attribution Footer
  const footerRow = netRow + 2;
  ws.getRow(footerRow).height = 22;
  ws.mergeCells(`A${footerRow}:H${footerRow}`);
  const ftCell = ws.getCell(`A${footerRow}`);
  ftCell.value = '🏢 Special Fund Managed by: Hafiz Muhammad Saad  |  Al-Mustafa Heights 5-E-18/19';
  ftCell.font = fontSegoe(10, true, 'FF1F4E79');
  ftCell.fill = fillSolid('FFF2F4F8');
  ftCell.alignment = alignCenter;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SPECIAL_FUND_${wsName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

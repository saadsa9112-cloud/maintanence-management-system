import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side

def build_october_sheet_in_workbook(wb_path):
    print(f"Processing {wb_path}...")
    wb = openpyxl.load_workbook(wb_path)

    # 1. Check or remove existing OCTOBER sheet
    if 'OCTOBER' in wb.sheetnames:
        del wb['OCTOBER']

    # Copy SEPTEMBER sheet as base for OCTOBER
    ws_sep = wb['SEPTEMBER']
    ws = wb.copy_worksheet(ws_sep)
    ws.title = 'OCTOBER'

    # Move OCTOBER right after SEPTEMBER
    sep_idx = wb.sheetnames.index('SEPTEMBER')
    wb._sheets.remove(ws)
    wb._sheets.insert(sep_idx + 1, ws)

    # Enable RightToLeft
    ws.sheet_view.rightToLeft = True

    # Colors and Fonts
    font_family = "Segoe UI"
    font_banner_white = Font(name=font_family, size=12, bold=True, color="FFFFFF")
    font_sub_red = Font(name=font_family, size=10, italic=True, bold=True, color="991B1B")
    font_bold_11 = Font(name=font_family, size=11, bold=True, color="0F172A")
    font_regular_11 = Font(name=font_family, size=11, color="1E293B")
    font_red_bold = Font(name=font_family, size=11, bold=True, color="991B1B")

    fill_unpaid_title = PatternFill(start_color="991B1B", end_color="991B1B", fill_type="solid")
    fill_unpaid_sub = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid")
    fill_unpaid_header = PatternFill(start_color="FECACA", end_color="FECACA", fill_type="solid")
    fill_zebra_pink = PatternFill(start_color="FFF1F2", end_color="FFF1F2", fill_type="solid")
    fill_zebra_white = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
    fill_total_red = PatternFill(start_color="FCA5A5", end_color="FCA5A5", fill_type="solid")

    thin_border_side = Side(style='thin', color='CBD5E1')
    box_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)

    # 2. Update Header info for OCTOBER
    ws['D6'] = 'OCTOBER'
    ws['G6'] = '3-Nov-2026'

    # Clear previous September expenses details
    for r in range(8, 18):
        ws[f'A{r}'] = None
        ws[f'B{r}'] = None
        ws[f'C{r}'] = None

    # Default common October expenses
    ws['C8'] = 'بجلی کا بل'
    ws['B8'] = None  # Will be entered when bill arrives
    ws['C9'] = 'موٹر آپریٹر '
    ws['B9'] = 1500
    ws['C10'] = 'جمعدار'
    ws['B10'] = 4500

    ws['C18'] = 'کل اخراجات'
    ws['B18'] = '=SUM(B8:B17)'

    ws['C25'] = 'پچھلی بچت'
    ws['B25'] = '=SEPTEMBER!B26'  # Link to September Closing Balance

    ws['C26'] = 'کل بچت'
    ws['B26'] = '=D28+B25-B18'

    # 3. Setup Flats Data for October
    flats_data = [
        ('G-1', 'انجم پرویز', 3000),
        ('G-2', 'راشد', 3000),
        ('G-3', 'فرید', 2500),
        ('F-1', 'سبحان', 2500),
        ('F-2', 'سکندر', 3000),
        ('F-3', 'ابراہیم', 3000),
        ('F-4', 'نوید', 2500),
        ('S-1', 'عمران', 3000),
        ('S-2', 'پرویز', 3000),
        ('S-3', 'ندیم', 3000),
        ('S-4', 'جبران', 3000),
        ('T-1', 'کامران', 3000),
        ('T-2', 'عبدالعلیم', 3000),
        ('T-3', 'حافظ سعد', 3000),
        ('T-4', 'عمران', 3000),
        ('P-1', 'حنیف', 3000),
        ('P-2', 'ابو محمد', 3000),
        ('P-3', 'علی', 0),        # Closed
        ('P-4', 'عابد', 3000),
        ('-', 'دکاندار', 500)
    ]

    for idx, (f_num, f_name, f_due) in enumerate(flats_data):
        r = 8 + idx
        ws[f'H{r}'] = idx + 1
        ws[f'G{r}'] = f_num
        ws[f'F{r}'] = f_name

        if f_num == 'P-3':
            ws[f'D{r}'] = 'گھر بند ہے'
            ws[f'E{r}'] = None
        else:
            ws[f'D{r}'] = None
            ws[f'E{r}'] = f'=IF(D{r}="گھر بند ہے", "", IF(ISBLANK(D{r}), {f_due}, IF(D{r}=0, {f_due}, IF(D{r}<{f_due}, {f_due}-D{r}, ""))))'

    # Totals in Row 28
    ws['D28'] = '=SUM(D8:D27)'
    ws['E28'] = '=SUM(E8:E27)'
    ws['F28'] = 'کُل میزان'

    # 4. Executive KPI Cards (Row 30-35)
    ws['A30'] = '📊 ایگزیکٹو سمری و تجزیاتی کارڈز — OCTOBER 2026'
    ws['G31'] = '💰 کُل وصولی (Total Collected)'
    ws['E31'] = '⚠️ کُل بقایا جات (Outstanding)'
    ws['C31'] = '📉 کُل اخراجات (Expenses)'
    ws['A31'] = '🏦 حتمی کیش بیلنس (Closing)'

    ws['G32'] = '=D28'
    ws['E32'] = '=E28'
    ws['C32'] = '=B18'
    ws['A32'] = '=B26'

    ws['G33'] = '=IF((D28+E28)>0, TEXT(D28/(D28+E28), "0%") & " وصولی (" & COUNTIF(D8:D27, ">0") & "/19 فلیٹس)", "0% وصولی")'
    ws['E33'] = '=COUNTIF(E8:E27, ">0") & " فلیٹس کی طرف بقایا"'
    ws['C33'] = '=COUNTA(C8:C17) & " مدات میں خرچ"'
    ws['A33'] = 'پچھلی بچت شامل کر کے'

    ws['A35'] = '="🏢 فلیٹ اسٹیٹس سمری:  " & COUNTIF(D8:D27, ">0") & " فلیٹ ادا شدہ (مکمل)   |   " & COUNTIF(E8:E27, ">0") & " فلیٹ بقایا دار   |   1 گھر بند (علی P-3)   |   1 دکاندار"'

    # 5. Helper Column J (Columns J8 to J27)
    ws['J7'] = 'Helper_Rank'
    ws.column_dimensions['J'].hidden = True

    for idx, (f_num, f_name, f_due) in enumerate(flats_data):
        r = 8 + idx
        if f_num == 'P-3':
            cond = '1'
        else:
            cond = f'IF(AND(ISNUMBER(D{r}), D{r}>={f_due}), 0, 1)'

        if idx == 0:
            ws[f'J{r}'] = f'={cond}'
        else:
            prev = r - 1
            ws[f'J{r}'] = f'=J{prev} + {cond}'

    # 6. DEDICATED LIVE AUTO-UPDATING UNPAID LIST SECTION (Row 37 onwards)
    ws.merge_cells('A37:H37')
    ws['A37'] = '🚨 اکتوبر 2026 — غیر وصول شدہ و بقایا داران کی فہرست (LIVE AUTO-UPDATING UNPAID LIST)'
    ws['A37'].font = font_banner_white
    ws['A37'].fill = fill_unpaid_title
    ws['A37'].alignment = Alignment(horizontal='center', vertical='center')

    ws.merge_cells('A38:H38')
    ws['A38'] = '[یہ لسٹ خود بخود اپڈیٹ ہوتی ہے — جیسے ہی اوپر وصولی درج کریں گے، فلیٹ خود بخود اس لسٹ سے نکل جائے گا]'
    ws['A38'].font = font_sub_red
    ws['A38'].fill = fill_unpaid_sub
    ws['A38'].alignment = Alignment(horizontal='center', vertical='center')

    headers_unpaid = [
        ('A', 'واٹس ایپ میسج نوٹس (کاپی کرنے کے لیے)'),
        ('B', 'اسٹیٹس / حالت'),
        ('C', 'باقی واجب الادا رقم'),
        ('D', 'وصول شدہ'),
        ('E', 'ماہانہ واجب'),
        ('F', 'رہائشی کا نام'),
        ('G', 'فلیٹ نمبر'),
        ('H', 'سیریل')
    ]

    for col_letter, text in headers_unpaid:
        cell = ws[f'{col_letter}39']
        cell.value = text
        cell.font = Font(name=font_family, size=11, bold=True, color="991B1B")
        cell.fill = fill_unpaid_header
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = box_border

    # Unpaid Rows (Rows 40 to 59: Slots 1 to 20)
    for k in range(1, 21):
        r = 39 + k
        zebra = fill_zebra_pink if k % 2 == 1 else fill_zebra_white

        # Col H: Serial
        ws[f'H{r}'] = f'=IF({k}<=MAX($J$8:$J$27), {k}, "")'
        # Col G: Flat No
        ws[f'G{r}'] = f'=IF(H{r}="","", IFERROR(INDEX($G$8:$G$27, MATCH({k}, $J$8:$J$27, 0)), ""))'
        # Col F: Name
        ws[f'F{r}'] = f'=IF(H{r}="","", IFERROR(INDEX($F$8:$F$27, MATCH({k}, $J$8:$J$27, 0)), ""))'
        # Col E: Monthly Due
        ws[f'E{r}'] = f'=IF(H{r}="","", IFERROR(IF(G{r}="-", 500, IF(G{r}="P-3", 0, IF(OR(G{r}="G-3",G{r}="F-1",G{r}="F-4"), 2500, 3000))), ""))'
        # Col D: Received
        ws[f'D{r}'] = f'=IF(H{r}="","", IFERROR(IF(INDEX($D$8:$D$27, MATCH({k}, $J$8:$J$27, 0))="گھر بند ہے", "گھر بند", IF(ISNUMBER(INDEX($D$8:$D$27, MATCH({k}, $J$8:$J$27, 0))), INDEX($D$8:$D$27, MATCH({k}, $J$8:$J$27, 0)), 0)), ""))'
        # Col C: Arrears
        ws[f'C{r}'] = f'=IF(H{r}="","", IFERROR(IF(G{r}="P-3", 0, E{r} - N(D{r})), ""))'
        # Col B: Status
        ws[f'B{r}'] = f'=IF(H{r}="","", IF(G{r}="P-3", "🔒 گھر بند", IF(N(D{r})>0, "⚠️ جزوی بقایا", "غیر ادا شدہ")))'
        # Col A: WhatsApp Message Line
        ws[f'A{r}'] = f'=IF(H{r}="","", "● فلیٹ " & G{r} & " (" & F{r} & "): " & IF(B{r}="🔒 گھر بند", "گھر بند ہے", "واجب الادا Rs. " & TEXT(C{r}, "#,##0")))'

        for col_l in ['A','B','C','D','E','F','G','H']:
            c = ws[f'{col_l}{r}']
            c.border = box_border
            c.fill = zebra
            if col_l in ['G', 'H', 'B']:
                c.alignment = Alignment(horizontal='center', vertical='center')
                c.font = font_bold_11
            elif col_l in ['C', 'D', 'E']:
                c.alignment = Alignment(horizontal='center', vertical='center')
                c.font = font_red_bold if col_l == 'C' else font_bold_11
                c.number_format = '#,##0'
            elif col_l == 'A':
                c.alignment = Alignment(horizontal='right', vertical='center')
                c.font = font_regular_11
            else:
                c.alignment = Alignment(horizontal='right', vertical='center')
                c.font = font_bold_11

    # Row 60: Total Summary Row of Unpaid List
    ws['H60'] = '="کل " & COUNTIF(G40:G59, "?*") & " فلیٹس"'
    ws['G60'] = None
    ws.merge_cells('F60:G60')
    ws['F60'] = 'کُل واجب الادا بقایا جات:'
    ws['E60'] = '=SUM(E40:E59)'
    ws['D60'] = '=SUM(D40:D59)'
    ws['C60'] = '=SUM(C40:C59)'
    ws['B60'] = 'کُل بقایا رقم'
    ws['A60'] = '=IF(COUNTIF(C40:C59, ">0")=0, "ماشاءاللہ! تمام فلیٹس کے واجبات کلیئر ہیں۔", "واٹس ایپ گروپ کے لیے نوٹس تیار ہے")'

    for col_l in ['A','B','C','D','E','F','G','H']:
        c = ws[f'{col_l}{60}']
        c.font = Font(name=font_family, size=11, bold=True, color="991B1B")
        c.fill = fill_total_red
        c.border = Border(top=Side(style='medium', color='991B1B'), bottom=Side(style='double', color='991B1B'), left=thin_border_side, right=thin_border_side)
        if col_l in ['C', 'D', 'E']:
            c.number_format = '#,##0'
            c.alignment = Alignment(horizontal='center', vertical='center')
        else:
            c.alignment = Alignment(horizontal='center', vertical='center')

    # Row 62-63: WhatsApp Group Copy-Paste Box
    ws.merge_cells('A62:H63')
    ws['A62'] = '="📢 المصطفیٰ ہائٹس (5-E-18/19) — اکتوبر 2026: کل " & COUNTIF(C40:C59, ">0") & " فلیٹس کے واجبات (مجموعی رقم: Rs. " & TEXT(C60, "#,##0") & ") تاحال موصول نہیں ہوئے۔ تمام معزز ممبران سے گزارش ہے کہ اپنے واجبات جلد از جلد جمع کروائیں۔ جزاک اللہ خیراً!"'
    ws['A62'].font = Font(name=font_family, size=11, bold=True, color="065F46")
    ws['A62'].fill = PatternFill(start_color="D1FAE5", end_color="D1FAE5", fill_type="solid")
    ws['A62'].alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    ws['A62'].border = Border(top=Side(style='medium', color='059669'), bottom=Side(style='medium', color='059669'), left=thin_border_side, right=thin_border_side)

    # 7. Update Overview tab with October column
    if 'ماہانہ جائزہ (Overview)' in wb.sheetnames:
        ws_ov = wb['ماہانہ جائزہ (Overview)']
        # Check column headers in row 5
        # Col B: جولائی, Col C: اگست, Col D: ستمبر, Col E: سہ ماہی مجموعہ
        # Let's shift Col E to Col F and make Col E October!
        if ws_ov['E5'].value == 'سہ ماہی مجموعہ (Total)':
            ws_ov['F5'] = 'چار ماہی مجموعہ (Total)'
            ws_ov['E5'] = 'اکتوبر (OCTOBER)'
            ws_ov['E6'] = '=OCTOBER!D28'
            ws_ov['E7'] = '=OCTOBER!B18'
            ws_ov['E8'] = '=E6-E7'
            ws_ov['E9'] = '=OCTOBER!E28'
            ws_ov['E10'] = '=OCTOBER!B25'
            ws_ov['E11'] = '=OCTOBER!B26'
            ws_ov['E12'] = '=OCTOBER!G33'
            
            # Update totals in Col F
            ws_ov['F6'] = '=SUM(B6:E6)'
            ws_ov['F7'] = '=SUM(B7:E7)'
            ws_ov['F8'] = '=SUM(B8:E8)'
            ws_ov['F9'] = '=E9'
            ws_ov['F10'] = '-'
            ws_ov['F11'] = '=E11'
            ws_ov['F12'] = '=TEXT(F6/(F6+F9), "0%")'

            # Update flat payments
            ws_ov['F16'] = 'موجودہ صورتحال'
            ws_ov['E16'] = 'اکتوبر'
            for idx in range(20):
                r_flat = 17 + idx
                r_oct = 8 + idx
                ws_ov[f'E{r_flat}'] = f'=OCTOBER!D{r_oct}'
                ws_ov[f'F{r_flat}'] = f'=IF(OCTOBER!D{r_oct}="گھر بند ہے", "🔒 گھر بند", IF(ISNUMBER(OCTOBER!E{r_oct}), "⚠️ " & TEXT(OCTOBER!E{r_oct}, "#,##0") & " بقایا", IF(OCTOBER!D{r_oct}>0, "✅ ادا شدہ", "❌ غیر ادا")))'

    wb.save(wb_path)
    print(f"Successfully updated {wb_path}!")

if __name__ == '__main__':
    for f in ['MAINTANENCE SHEET 2026.xlsx', 'MAINTANENCE SHEET SEPTEMBER 2026.xlsx']:
        build_october_sheet_in_workbook(f)

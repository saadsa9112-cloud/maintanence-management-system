import openpyxl
import datetime
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import CellIsRule
from openpyxl.utils import get_column_letter

def build_kpi_dashboard():
    wb = openpyxl.load_workbook('MAINTANENCE SHEET SEPTEMBER 2026.xlsx')
    
    # -------------------------------------------------------------
    # Styling Palette
    # -------------------------------------------------------------
    navy_dark = '1F4E79'
    navy_slate = '203764'
    blue_header_bg = '1B365D'
    badge_label_bg = 'D9E1F2'
    badge_val_bg = 'F2F4F8'
    
    # KPI Card Colors
    kpi_green_fill = 'E2EFDA'
    kpi_green_text = '145A32'
    kpi_green_sub = '1E8449'
    kpi_green_border = 'A9DFBF'
    
    kpi_red_fill = 'FCE4D6'
    kpi_red_text = 'C00000'
    kpi_red_sub = 'B03A2E'
    kpi_red_border = 'F5B7B1'
    
    kpi_amber_fill = 'FFF2CC'
    kpi_amber_text = 'B25900'
    kpi_amber_sub = 'D35400'
    kpi_amber_border = 'F9E79F'
    
    kpi_blue_fill = 'D9E1F2'
    kpi_blue_text = '1B4F72'
    kpi_blue_sub = '2980B9'
    kpi_blue_border = 'AEC6CF'
    
    banner_fill = 'F2F4F8'
    banner_text = '2C3E50'
    banner_border = 'BDC3C7'
    
    zebra_even = 'F9FAFB'
    zebra_odd = 'FFFFFF'
    summary_bg = 'D9E1F2'
    exp_subtotal_bg = 'FCE4D6'
    exp_prev_bg = 'EDF2F8'
    exp_savings_bg = 'D4EFDF'
    
    border_color_grid = 'D3D3D3'
    border_color_navy = '1F4E79'
    
    thin_grid = Side(style='thin', color=border_color_grid)
    medium_navy = Side(style='medium', color=border_color_navy)
    double_bottom = Side(style='double', color='000000')
    thin_black = Side(style='thin', color='000000')
    
    # Helper to style a rectangular range with an outer border & fill
    def style_card_range(ws, r1, r2, c1, c2, fill_hex, border_hex):
        border_side = Side(style='medium', color=border_hex)
        fill = PatternFill(start_color=fill_hex, end_color=fill_hex, fill_type='solid')
        for r in range(r1, r2 + 1):
            for c in range(c1, c2 + 1):
                cell = ws.cell(r, c)
                cell.fill = fill
                top = border_side if r == r1 else None
                bot = border_side if r == r2 else None
                left = border_side if c == c1 else None
                right = border_side if c == c2 else None
                cell.border = Border(top=top, bottom=bot, left=left, right=right)

    # -------------------------------------------------------------
    # Data definitions for the 20 flats & expenses
    # -------------------------------------------------------------
    flats_data = [
        # (sno, flat, name, maint, baqaya)
        (1, 'G-1', 'انجم پرویز', 3000, None),
        (2, 'G-2', 'راشد', 3000, None),
        (3, 'G-3', 'فرید', 2500, None),
        (4, 'F-1', 'سبحان', 2500, None),
        (5, 'F-2', 'سکندر', 3000, None),
        (6, 'F-3', 'ابراہیم', 3000, 3000),
        (7, 'F-4', 'نوید', 2500, None),
        (8, 'S-1', 'عمران', 3000, None),
        (9, 'S-2', 'پرویز', 3000, None),
        (10, 'S-3', 'ندیم', 2500, 500),
        (11, 'S-4', 'جبران', 3000, None),
        (12, 'T-1', 'کامران', 3000, None),
        (13, 'T-2', 'عبدالعلیم', 3000, None),
        (14, 'T-3', 'حافظ سعد', 3000, None),
        (15, 'T-4', 'عمران', 3000, None),
        (16, 'P-1', 'حنیف', 3000, None),
        (17, 'P-2', 'ابو محمد', 3000, None),
        (18, 'P-3', 'علی', 'گھر بند ہے', None),
        (19, 'P-4', 'عابد', 3000, 3000),
        (20, None, 'دکاندار', 500, None)
    ]
    
    expenses_data = [
        # (row_offset, details, amount, desc)  -- row_offset 0 to 19
        (0, None, 18890, 'بجلی کا بل'),
        (1, None, 1500, 'موٹر آپریٹر '),
        (2, None, 4500, 'جمعدار'),
        (3, '11-SEP , 19-SEP', '=4100+3500', 'الیکٹریشن (اسامہ)'),
        (4, None, 26000, 'پمپ کے اخراجات'),
        (5, None, 1560, 'پلمبر کے اخراجات'),
        (6, None, 130, 'چوتھی منزل کا بلب'),
        # subtotal at offset 9 (row 22)
        (9, None, '=SUM(B13:B19)', 'کل اخراجات'),
        # prev savings at offset 11 (row 24)
        (11, None, 21611, 'پچھلی بچت'),
        # net savings at offset 12 (row 25)
        (12, None, '=D33+B24-B22', 'کل بچت')
    ]

    # Shared conditional formatting rules
    red_fill = PatternFill(start_color='FCE4D6', end_color='FCE4D6', fill_type='solid')
    red_font = Font(name='Segoe UI', size=11, bold=True, color='C00000')
    rule_arrears = CellIsRule(operator='greaterThan', formula=['0'], stopIfTrue=True, fill=red_fill, font=red_font)
    
    amber_fill = PatternFill(start_color='FFF2CC', end_color='FFF2CC', fill_type='solid')
    amber_font = Font(name='Segoe UI', size=11, bold=True, color='B25900')
    rule_closed = CellIsRule(operator='equal', formula=['"گھر بند ہے"'], stopIfTrue=True, fill=amber_fill, font=amber_font)
    
    green_fill = PatternFill(start_color='E2EFDA', end_color='E2EFDA', fill_type='solid')
    green_font = Font(name='Segoe UI', size=11, bold=True, color='276A3C')
    rule_paid = CellIsRule(operator='greaterThan', formula=['0'], stopIfTrue=True, fill=green_fill, font=green_font)

    # =============================================================
    # 1. POPULATE & FORMAT SHEET 2: مینٹیننس شیٹ (A تا H)
    # =============================================================
    sheet2_name = 'مینٹیننس شیٹ (A تا H)'
    if sheet2_name in wb.sheetnames:
        del wb[sheet2_name]
    ws2 = wb.create_sheet(title=sheet2_name, index=0) # Make it first tab!
    ws2.views.sheetView[0].showGridLines = True
    ws2.views.sheetView[0].topLeftCell = 'A1'
    
    col_widths_2 = {
        'A': 19,    # تفصیلات
        'B': 16,    # اخراجات کی رقم
        'C': 20,    # اخراجات کی تفصیل
        'D': 15,    # مینٹیننس
        'E': 14,    # بقایا رقم
        'F': 18,    # نام
        'G': 14.5,  # فلیٹ نمبر
        'H': 12     # سیریل نمبر
    }
    for col, w in col_widths_2.items():
        ws2.column_dimensions[col].width = w

    # Row Heights
    ws2.row_dimensions[1].height = 6
    ws2.row_dimensions[2].height = 22
    ws2.row_dimensions[3].height = 20
    ws2.row_dimensions[4].height = 25
    ws2.row_dimensions[5].height = 8
    ws2.row_dimensions[6].height = 18
    ws2.row_dimensions[7].height = 24
    ws2.row_dimensions[8].height = 16
    ws2.row_dimensions[9].height = 6
    ws2.row_dimensions[10].height = 24
    ws2.row_dimensions[11].height = 8
    ws2.row_dimensions[12].height = 28
    for r in range(13, 33):
        ws2.row_dimensions[r].height = 20
    ws2.row_dimensions[33].height = 26

    # Title Banner (A2:H3)
    ws2.merge_cells('A2:H3')
    ws2['A2'].value = 'AL MUSTAFA HEIGHTS 5-E-18/19'
    for r in range(2, 4):
        for c in range(1, 9):
            cell = ws2.cell(r, c)
            cell.fill = PatternFill(start_color=blue_header_bg, end_color=blue_header_bg, fill_type='solid')
            top = medium_navy if r == 2 else None
            bot = medium_navy if r == 3 else None
            left = medium_navy if c == 1 else None
            right = medium_navy if c == 8 else None
            cell.border = Border(top=top, bottom=bot, left=left, right=right)
    ws2['A2'].font = Font(name='Segoe UI', size=16, bold=True, color='FFFFFF')
    ws2['A2'].alignment = Alignment(horizontal='center', vertical='center')

    # Row 4: Badges (Year, Month, Date)
    # A4: 2026, B4: سال
    # D4: SEPTEMBER, E4: مہینہ
    # G4: Date, H4: تاریخ
    ws2.cell(4, 1).value = 2026
    ws2.cell(4, 2).value = 'سال'
    ws2.cell(4, 4).value = 'SEPTEMBER'
    ws2.cell(4, 5).value = 'مہینہ'
    ws2.cell(4, 7).value = datetime.datetime(2026, 10, 3, 0, 0)
    ws2.cell(4, 8).value = 'تاریخ'

    badges_2 = [(2, 1), (5, 4), (8, 7)]
    for lbl_c, val_c in badges_2:
        c_lbl = ws2.cell(4, lbl_c)
        c_val = ws2.cell(4, val_c)
        c_lbl.fill = PatternFill(start_color=badge_label_bg, end_color=badge_label_bg, fill_type='solid')
        c_lbl.font = Font(name='Segoe UI', size=11, bold=True, color=navy_dark)
        c_lbl.alignment = Alignment(horizontal='center', vertical='center')
        
        c_val.fill = PatternFill(start_color=badge_val_bg, end_color=badge_val_bg, fill_type='solid')
        c_val.font = Font(name='Segoe UI', size=11, bold=True, color='000000')
        c_val.alignment = Alignment(horizontal='center', vertical='center')
        
        c_lbl.border = Border(top=thin_black, bottom=thin_black, left=thin_grid, right=thin_black)
        c_val.border = Border(top=thin_black, bottom=thin_black, left=thin_black, right=thin_grid)
        if isinstance(c_val.value, (datetime.datetime, datetime.date)):
            c_val.number_format = 'd-mmm-yyyy'

    # -------------------------------------------------------------
    # 4 KPI FINANCIAL CARDS (Rows 6 to 8)
    # -------------------------------------------------------------
    # Card 1 (G6:H8): 💰 کُل وصولی (Total Collected)
    ws2.merge_cells('G6:H6')
    ws2.merge_cells('G7:H7')
    ws2.merge_cells('G8:H8')
    style_card_range(ws2, 6, 8, 7, 8, kpi_green_fill, kpi_green_border)
    ws2['G6'].value = '💰 کُل وصولی (Total Collected)'
    ws2['G6'].font = Font(name='Segoe UI', size=10, bold=True, color=kpi_green_text)
    ws2['G6'].alignment = Alignment(horizontal='center', vertical='center')
    ws2['G7'].value = '=D33'
    ws2['G7'].font = Font(name='Segoe UI', size=15, bold=True, color=kpi_green_text)
    ws2['G7'].number_format = '"Rs. " #,##0'
    ws2['G7'].alignment = Alignment(horizontal='center', vertical='center')
    ws2['G8'].value = '89% وصولی (16/19 فلیٹس)'
    ws2['G8'].font = Font(name='Segoe UI', size=9, bold=False, italic=True, color=kpi_green_sub)
    ws2['G8'].alignment = Alignment(horizontal='center', vertical='center')

    # Card 2 (E6:F8): ⚠️ کُل بقایا جات (Total Outstanding)
    ws2.merge_cells('E6:F6')
    ws2.merge_cells('E7:F7')
    ws2.merge_cells('E8:F8')
    style_card_range(ws2, 6, 8, 5, 6, kpi_red_fill, kpi_red_border)
    ws2['E6'].value = '⚠️ کُل بقایا جات (Outstanding)'
    ws2['E6'].font = Font(name='Segoe UI', size=10, bold=True, color=kpi_red_text)
    ws2['E6'].alignment = Alignment(horizontal='center', vertical='center')
    ws2['E7'].value = '=E33'
    ws2['E7'].font = Font(name='Segoe UI', size=15, bold=True, color=kpi_red_text)
    ws2['E7'].number_format = '"Rs. " #,##0'
    ws2['E7'].alignment = Alignment(horizontal='center', vertical='center')
    ws2['E8'].value = '3 فلیٹس کی طرف بقایا'
    ws2['E8'].font = Font(name='Segoe UI', size=9, bold=False, color=kpi_red_sub)
    ws2['E8'].alignment = Alignment(horizontal='center', vertical='center')

    # Card 3 (C6:D8): 📉 کُل اخراجات (Total Expenses)
    ws2.merge_cells('C6:D6')
    ws2.merge_cells('C7:D7')
    ws2.merge_cells('C8:D8')
    style_card_range(ws2, 6, 8, 3, 4, kpi_amber_fill, kpi_amber_border)
    ws2['C6'].value = '📉 کُل اخراجات (Expenses)'
    ws2['C6'].font = Font(name='Segoe UI', size=10, bold=True, color=kpi_amber_text)
    ws2['C6'].alignment = Alignment(horizontal='center', vertical='center')
    ws2['C7'].value = '=B22'
    ws2['C7'].font = Font(name='Segoe UI', size=15, bold=True, color=kpi_amber_text)
    ws2['C7'].number_format = '"Rs. " #,##0'
    ws2['C7'].alignment = Alignment(horizontal='center', vertical='center')
    ws2['C8'].value = '7 مدات میں خرچ'
    ws2['C8'].font = Font(name='Segoe UI', size=9, bold=False, color=kpi_amber_sub)
    ws2['C8'].alignment = Alignment(horizontal='center', vertical='center')

    # Card 4 (A6:B8): 🏦 حتمی کیش بیلنس (Closing Balance)
    ws2.merge_cells('A6:B6')
    ws2.merge_cells('A7:B7')
    ws2.merge_cells('A8:B8')
    style_card_range(ws2, 6, 8, 1, 2, kpi_blue_fill, kpi_blue_border)
    ws2['A6'].value = '🏦 حتمی کیش بیلنس (Closing)'
    ws2['A6'].font = Font(name='Segoe UI', size=10, bold=True, color=kpi_blue_text)
    ws2['A6'].alignment = Alignment(horizontal='center', vertical='center')
    ws2['A7'].value = '=B25'
    ws2['A7'].font = Font(name='Segoe UI', size=15, bold=True, color=kpi_blue_text)
    ws2['A7'].number_format = '"Rs. " #,##0'
    ws2['A7'].alignment = Alignment(horizontal='center', vertical='center')
    ws2['A8'].value = 'پچھلی بچت شامل کر کے'
    ws2['A8'].font = Font(name='Segoe UI', size=9, bold=False, color=kpi_blue_sub)
    ws2['A8'].alignment = Alignment(horizontal='center', vertical='center')

    # -------------------------------------------------------------
    # Card 5: Status Banner (Row 10, A10:H10)
    # -------------------------------------------------------------
    ws2.merge_cells('A10:H10')
    ws2['A10'].value = '🏢 فلیٹ اسٹیٹس سمری:  16 فلیٹ ادا شدہ (مکمل)   |   3 فلیٹ جزوی بقایا (ابراہیم F-3, ندیم S-3, عابد P-4)   |   1 گھر بند (علی P-3)   |   1 دکاندار'
    banner_side = Side(style='thin', color=banner_border)
    fill_banner = PatternFill(start_color=banner_fill, end_color=banner_fill, fill_type='solid')
    for c in range(1, 9):
        cell = ws2.cell(10, c)
        cell.fill = fill_banner
        cell.border = Border(top=banner_side, bottom=banner_side, left=(banner_side if c==1 else None), right=(banner_side if c==8 else None))
    ws2['A10'].font = Font(name='Segoe UI', size=10.5, bold=True, color=banner_text)
    ws2['A10'].alignment = Alignment(horizontal='center', vertical='center')

    # -------------------------------------------------------------
    # Table Header (Row 12)
    # -------------------------------------------------------------
    headers_2 = [
        (1, 'تفصیلات'),
        (2, 'اخراجات کی رقم'),
        (3, 'اخراجات کی تفصیل'),
        (4, 'مینٹیننس'),
        (5, 'بقایا رقم'),
        (6, 'نام'),
        (7, 'فلیٹ نمبر'),
        (8, 'سیریل نمبر')
    ]
    for c, h_text in headers_2:
        cell = ws2.cell(12, c)
        cell.value = h_text
        cell.fill = PatternFill(start_color=navy_slate, end_color=navy_slate, fill_type='solid')
        cell.font = Font(name='Segoe UI', size=11, bold=True, color='FFFFFF')
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        left = medium_navy if c == 1 else (medium_navy if c == 4 else thin_grid)
        right = medium_navy if c == 8 else (medium_navy if c == 3 else thin_grid)
        cell.border = Border(top=medium_navy, bottom=medium_navy, left=left, right=right)

    # -------------------------------------------------------------
    # Populate Data (Rows 13 to 32)
    # -------------------------------------------------------------
    for i, (sno, flat, name, maint, baqaya) in enumerate(flats_data):
        r = 13 + i
        is_even = (r % 2 == 0)
        base_fill = zebra_even if is_even else zebra_odd
        
        # Populate right side (Columns D to H)
        ws2.cell(r, 8).value = sno
        ws2.cell(r, 7).value = flat
        ws2.cell(r, 6).value = name
        ws2.cell(r, 5).value = baqaya
        ws2.cell(r, 4).value = maint

    # Populate left side (Expenses in Columns A to C)
    for row_off, det, amt, desc in expenses_data:
        r = 13 + row_off
        ws2.cell(r, 1).value = det
        ws2.cell(r, 2).value = amt
        ws2.cell(r, 3).value = desc

    # Format Data Cells (Rows 13 to 32)
    for r in range(13, 33):
        is_even = (r % 2 == 0)
        base_fill = zebra_even if is_even else zebra_odd
        
        for c in range(1, 9):
            cell = ws2.cell(r, c)
            cell_fill = base_fill
            cell_font = Font(name='Segoe UI', size=11, bold=False, color='000000')
            cell_align = Alignment(vertical='center')
            
            if c == 8: # H: سیریل نمبر
                cell_align = Alignment(horizontal='center', vertical='center')
            elif c == 7: # G: فلیٹ نمبر
                cell_align = Alignment(horizontal='center', vertical='center')
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='000000')
            elif c == 6: # F: نام
                cell_align = Alignment(horizontal='right', vertical='center')
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='1F385C')
            elif c == 5: # E: بقایا رقم
                cell_align = Alignment(horizontal='right', vertical='center')
                cell.number_format = '#,##0'
                if cell.value is not None:
                    cell_font = Font(name='Segoe UI', size=11, bold=True, color='C00000')
            elif c == 4: # D: مینٹیننس
                cell_align = Alignment(horizontal='right', vertical='center')
                if isinstance(cell.value, (int, float)):
                    cell.number_format = '#,##0'
                    cell_font = Font(name='Segoe UI', size=11, bold=True, color='1E4D2B')
                elif cell.value == 'گھر بند ہے':
                    cell_align = Alignment(horizontal='center', vertical='center')
                    cell_font = Font(name='Segoe UI', size=11, bold=True, color='B25900')
            elif c == 3: # C: اخراجات کی تفصیل
                cell_align = Alignment(horizontal='right', vertical='center')
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='000000')
            elif c == 2: # B: اخراجات کی رقم
                cell_align = Alignment(horizontal='right', vertical='center')
                cell.number_format = '#,##0'
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='000000')
            elif c == 1: # A: تفصیلات
                cell_align = Alignment(horizontal='center', vertical='center')
                cell_font = Font(name='Segoe UI', size=10, bold=False, color='333333')
            
            # Special highlights for summary rows in Expenses side
            if r == 22 and c in [2, 3]: # کل اخراجات
                cell_fill = exp_subtotal_bg
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='922B21')
            elif r == 24 and c in [2, 3]: # پچھلی بچت
                cell_fill = exp_prev_bg
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='1B4F72')
            elif r == 25 and c in [2, 3]: # کل بچت
                cell_fill = exp_savings_bg
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='145A32')
            
            cell.fill = PatternFill(start_color=cell_fill, end_color=cell_fill, fill_type='solid')
            cell.font = cell_font
            cell.alignment = cell_align
            
            top_s = thin_grid
            bot_s = thin_grid
            left_s = medium_navy if c == 1 else (medium_navy if c == 4 else thin_grid)
            right_s = medium_navy if c == 8 else (medium_navy if c == 3 else thin_grid)
            if r == 25 and c in [2, 3]:
                bot_s = double_bottom
            cell.border = Border(top=top_s, bottom=bot_s, left=left_s, right=right_s)

    # -------------------------------------------------------------
    # Total Row (Row 33)
    # -------------------------------------------------------------
    ws2.merge_cells('F33:H33')
    ws2['F33'].value = 'کُل میزان'
    ws2['E33'].value = '=SUM(E13:E32)'
    ws2['D33'].value = '=SUM(D13:D32)'
    
    for c in range(1, 9):
        cell = ws2.cell(33, c)
        cell.fill = PatternFill(start_color=summary_bg, end_color=summary_bg, fill_type='solid')
        left_s = medium_navy if c == 1 else (medium_navy if c == 4 else thin_grid)
        right_s = medium_navy if c == 8 else (medium_navy if c == 3 else thin_grid)
        cell.border = Border(top=thin_black, bottom=double_bottom, left=left_s, right=right_s)
        
        if c in [6, 7, 8]:
            cell.font = Font(name='Segoe UI', size=12, bold=True, color=navy_dark)
            cell.alignment = Alignment(horizontal='center', vertical='center')
        elif c == 5:
            cell.number_format = '#,##0'
            cell.font = Font(name='Segoe UI', size=11, bold=True, color='C00000')
            cell.alignment = Alignment(horizontal='right', vertical='center')
        elif c == 4:
            cell.number_format = '#,##0'
            cell.font = Font(name='Segoe UI', size=12, bold=True, color=navy_dark)
            cell.alignment = Alignment(horizontal='right', vertical='center')

    # Conditional formatting on Sheet2
    ws2.conditional_formatting.add('E13:E32', rule_arrears)
    ws2.conditional_formatting.add('D13:D32', rule_closed)
    ws2.conditional_formatting.add('D13:D32', rule_paid)

    # Page setup
    ws2.print_area = 'A2:H33'
    ws2.page_setup.orientation = ws2.ORIENTATION_LANDSCAPE
    ws2.page_setup.paperSize = ws2.PAPERSIZE_A4
    ws2.page_setup.fitToWidth = 1
    ws2.page_setup.fitToHeight = 1
    ws2.sheet_properties.pageSetUpPr.fitToPage = True

    # =============================================================
    # 2. POPULATE & FORMAT SHEET 1 (Columns L to S)
    # =============================================================
    ws1 = wb['Sheet1']
    ws1.views.sheetView[0].showGridLines = True
    ws1.views.sheetView[0].topLeftCell = 'L1'
    
    col_widths_1 = {
        'L': 19,    # تفصیلات
        'M': 16,    # اخراجات کی رقم
        'N': 20,    # اخراجات کی تفصیل
        'O': 15,    # مینٹیننس
        'P': 14,    # بقایا رقم
        'Q': 18,    # نام
        'R': 14.5,  # فلیٹ نمبر
        'S': 12     # سیریل نمبر
    }
    for col, w in col_widths_1.items():
        ws1.column_dimensions[col].width = w

    # Copy row dimensions
    for r in range(1, 35):
        ws1.row_dimensions[r].height = ws2.row_dimensions[r].height

    # Clear old merges in Sheet1
    ws1_merges = list(ws1.merged_cells.ranges)
    for m in ws1_merges:
        ws1.unmerge_cells(str(m))

    # Clear old cells in L..S
    for r in range(1, 35):
        for c in range(12, 20):
            ws1.cell(r, c).value = None
            ws1.cell(r, c).fill = PatternFill(fill_type=None)
            ws1.cell(r, c).border = Border()

    # Title Banner (L2:S3)
    ws1.merge_cells('L2:S3')
    ws1['L2'].value = 'AL MUSTAFA HEIGHTS 5-E-18/19'
    for r in range(2, 4):
        for c in range(12, 20):
            cell = ws1.cell(r, c)
            cell.fill = PatternFill(start_color=blue_header_bg, end_color=blue_header_bg, fill_type='solid')
            top = medium_navy if r == 2 else None
            bot = medium_navy if r == 3 else None
            left = medium_navy if c == 12 else None
            right = medium_navy if c == 19 else None
            cell.border = Border(top=top, bottom=bot, left=left, right=right)
    ws1['L2'].font = Font(name='Segoe UI', size=16, bold=True, color='FFFFFF')
    ws1['L2'].alignment = Alignment(horizontal='center', vertical='center')

    # Row 4: Badges
    # L4: 2026, M4: سال
    # O4: SEPTEMBER, P4: مہینہ
    # R4: Date, S4: تاریخ
    ws1.cell(4, 12).value = 2026
    ws1.cell(4, 13).value = 'سال'
    ws1.cell(4, 15).value = 'SEPTEMBER'
    ws1.cell(4, 16).value = 'مہینہ'
    ws1.cell(4, 18).value = datetime.datetime(2026, 10, 3, 0, 0)
    ws1.cell(4, 19).value = 'تاریخ'

    badges_1 = [(13, 12), (16, 15), (19, 18)]
    for lbl_c, val_c in badges_1:
        c_lbl = ws1.cell(4, lbl_c)
        c_val = ws1.cell(4, val_c)
        c_lbl.fill = PatternFill(start_color=badge_label_bg, end_color=badge_label_bg, fill_type='solid')
        c_lbl.font = Font(name='Segoe UI', size=11, bold=True, color=navy_dark)
        c_lbl.alignment = Alignment(horizontal='center', vertical='center')
        
        c_val.fill = PatternFill(start_color=badge_val_bg, end_color=badge_val_bg, fill_type='solid')
        c_val.font = Font(name='Segoe UI', size=11, bold=True, color='000000')
        c_val.alignment = Alignment(horizontal='center', vertical='center')
        
        c_lbl.border = Border(top=thin_black, bottom=thin_black, left=thin_grid, right=thin_black)
        c_val.border = Border(top=thin_black, bottom=thin_black, left=thin_black, right=thin_grid)
        if isinstance(c_val.value, (datetime.datetime, datetime.date)):
            c_val.number_format = 'd-mmm-yyyy'

    # KPI CARDS on Sheet1 (Rows 6 to 8)
    # Card 1 (R6:S8): 💰 کُل وصولی
    ws1.merge_cells('R6:S6')
    ws1.merge_cells('R7:S7')
    ws1.merge_cells('R8:S8')
    style_card_range(ws1, 6, 8, 18, 19, kpi_green_fill, kpi_green_border)
    ws1['R6'].value = '💰 کُل وصولی (Total Collected)'
    ws1['R6'].font = Font(name='Segoe UI', size=10, bold=True, color=kpi_green_text)
    ws1['R6'].alignment = Alignment(horizontal='center', vertical='center')
    ws1['R7'].value = '=O33'
    ws1['R7'].font = Font(name='Segoe UI', size=15, bold=True, color=kpi_green_text)
    ws1['R7'].number_format = '"Rs. " #,##0'
    ws1['R7'].alignment = Alignment(horizontal='center', vertical='center')
    ws1['R8'].value = '89% وصولی (16/19 فلیٹس)'
    ws1['R8'].font = Font(name='Segoe UI', size=9, bold=False, italic=True, color=kpi_green_sub)
    ws1['R8'].alignment = Alignment(horizontal='center', vertical='center')

    # Card 2 (P6:Q8): ⚠️ کُل بقایا جات
    ws1.merge_cells('P6:Q6')
    ws1.merge_cells('P7:Q7')
    ws1.merge_cells('P8:Q8')
    style_card_range(ws1, 6, 8, 16, 17, kpi_red_fill, kpi_red_border)
    ws1['P6'].value = '⚠️ کُل بقایا جات (Outstanding)'
    ws1['P6'].font = Font(name='Segoe UI', size=10, bold=True, color=kpi_red_text)
    ws1['P6'].alignment = Alignment(horizontal='center', vertical='center')
    ws1['P7'].value = '=P33'
    ws1['P7'].font = Font(name='Segoe UI', size=15, bold=True, color=kpi_red_text)
    ws1['P7'].number_format = '"Rs. " #,##0'
    ws1['P7'].alignment = Alignment(horizontal='center', vertical='center')
    ws1['P8'].value = '3 فلیٹس کی طرف بقایا'
    ws1['P8'].font = Font(name='Segoe UI', size=9, bold=False, color=kpi_red_sub)
    ws1['P8'].alignment = Alignment(horizontal='center', vertical='center')

    # Card 3 (N6:O8): 📉 کُل اخراجات
    ws1.merge_cells('N6:O6')
    ws1.merge_cells('N7:O7')
    ws1.merge_cells('N8:O8')
    style_card_range(ws1, 6, 8, 14, 15, kpi_amber_fill, kpi_amber_border)
    ws1['N6'].value = '📉 کُل اخراجات (Expenses)'
    ws1['N6'].font = Font(name='Segoe UI', size=10, bold=True, color=kpi_amber_text)
    ws1['N6'].alignment = Alignment(horizontal='center', vertical='center')
    ws1['N7'].value = '=M22'
    ws1['N7'].font = Font(name='Segoe UI', size=15, bold=True, color=kpi_amber_text)
    ws1['N7'].number_format = '"Rs. " #,##0'
    ws1['N7'].alignment = Alignment(horizontal='center', vertical='center')
    ws1['N8'].value = '7 مدات میں خرچ'
    ws1['N8'].font = Font(name='Segoe UI', size=9, bold=False, color=kpi_amber_sub)
    ws1['N8'].alignment = Alignment(horizontal='center', vertical='center')

    # Card 4 (L6:M8): 🏦 حتمی کیش بیلنس
    ws1.merge_cells('L6:M6')
    ws1.merge_cells('L7:M7')
    ws1.merge_cells('L8:M8')
    style_card_range(ws1, 6, 8, 12, 13, kpi_blue_fill, kpi_blue_border)
    ws1['L6'].value = '🏦 حتمی کیش بیلنس (Closing)'
    ws1['L6'].font = Font(name='Segoe UI', size=10, bold=True, color=kpi_blue_text)
    ws1['L6'].alignment = Alignment(horizontal='center', vertical='center')
    ws1['L7'].value = '=M25'
    ws1['L7'].font = Font(name='Segoe UI', size=15, bold=True, color=kpi_blue_text)
    ws1['L7'].number_format = '"Rs. " #,##0'
    ws1['L7'].alignment = Alignment(horizontal='center', vertical='center')
    ws1['L8'].value = 'پچھلی بچت شامل کر کے'
    ws1['L8'].font = Font(name='Segoe UI', size=9, bold=False, color=kpi_blue_sub)
    ws1['L8'].alignment = Alignment(horizontal='center', vertical='center')

    # Card 5: Status Banner (Row 10, L10:S10)
    ws1.merge_cells('L10:S10')
    ws1['L10'].value = '🏢 فلیٹ اسٹیٹس سمری:  16 فلیٹ ادا شدہ (مکمل)   |   3 فلیٹ جزوی بقایا (ابراہیم F-3, ندیم S-3, عابد P-4)   |   1 گھر بند (علی P-3)   |   1 دکاندار'
    for c in range(12, 20):
        cell = ws1.cell(10, c)
        cell.fill = fill_banner
        cell.border = Border(top=banner_side, bottom=banner_side, left=(banner_side if c==12 else None), right=(banner_side if c==19 else None))
    ws1['L10'].font = Font(name='Segoe UI', size=10.5, bold=True, color=banner_text)
    ws1['L10'].alignment = Alignment(horizontal='center', vertical='center')

    # Header Row (Row 12)
    headers_1 = [
        (12, 'تفصیلات'),
        (13, 'اخراجات کی رقم'),
        (14, 'اخراجات کی تفصیل'),
        (15, 'مینٹیننس'),
        (16, 'بقایا رقم'),
        (17, 'نام'),
        (18, 'فلیٹ نمبر'),
        (19, 'سیریل نمبر')
    ]
    for c, h_text in headers_1:
        cell = ws1.cell(12, c)
        cell.value = h_text
        cell.fill = PatternFill(start_color=navy_slate, end_color=navy_slate, fill_type='solid')
        cell.font = Font(name='Segoe UI', size=11, bold=True, color='FFFFFF')
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        left = medium_navy if c == 12 else (medium_navy if c == 15 else thin_grid)
        right = medium_navy if c == 19 else (medium_navy if c == 14 else thin_grid)
        cell.border = Border(top=medium_navy, bottom=medium_navy, left=left, right=right)

    # Populate Data in Sheet1
    for i, (sno, flat, name, maint, baqaya) in enumerate(flats_data):
        r = 13 + i
        ws1.cell(r, 19).value = sno
        ws1.cell(r, 18).value = flat
        ws1.cell(r, 17).value = name
        ws1.cell(r, 16).value = baqaya
        ws1.cell(r, 15).value = maint

    for row_off, det, amt, desc in expenses_data:
        r = 13 + row_off
        formula_amt = amt
        if isinstance(amt, str) and 'B13:B19' in amt:
            formula_amt = amt.replace('B13:B19', 'M13:M19')
        elif isinstance(amt, str) and 'D33+B24-B22' in amt:
            formula_amt = amt.replace('D33+B24-B22', 'O33+M24-M22')
        ws1.cell(r, 12).value = det
        ws1.cell(r, 13).value = formula_amt
        ws1.cell(r, 14).value = desc

    # Format Data Cells in Sheet1
    for r in range(13, 33):
        is_even = (r % 2 == 0)
        base_fill = zebra_even if is_even else zebra_odd
        
        for c in range(12, 20):
            cell = ws1.cell(r, c)
            cell_fill = base_fill
            cell_font = Font(name='Segoe UI', size=11, bold=False, color='000000')
            cell_align = Alignment(vertical='center')
            
            if c == 19: # S: سیریل نمبر
                cell_align = Alignment(horizontal='center', vertical='center')
            elif c == 18: # R: فلیٹ نمبر
                cell_align = Alignment(horizontal='center', vertical='center')
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='000000')
            elif c == 17: # Q: نام
                cell_align = Alignment(horizontal='right', vertical='center')
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='1F385C')
            elif c == 16: # P: بقایا رقم
                cell_align = Alignment(horizontal='right', vertical='center')
                cell.number_format = '#,##0'
                if cell.value is not None:
                    cell_font = Font(name='Segoe UI', size=11, bold=True, color='C00000')
            elif c == 15: # O: مینٹیننس
                cell_align = Alignment(horizontal='right', vertical='center')
                if isinstance(cell.value, (int, float)):
                    cell.number_format = '#,##0'
                    cell_font = Font(name='Segoe UI', size=11, bold=True, color='1E4D2B')
                elif cell.value == 'گھر بند ہے':
                    cell_align = Alignment(horizontal='center', vertical='center')
                    cell_font = Font(name='Segoe UI', size=11, bold=True, color='B25900')
            elif c == 14: # N: اخراجات کی تفصیل
                cell_align = Alignment(horizontal='right', vertical='center')
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='000000')
            elif c == 13: # M: اخراجات کی رقم
                cell_align = Alignment(horizontal='right', vertical='center')
                cell.number_format = '#,##0'
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='000000')
            elif c == 12: # L: تفصیلات
                cell_align = Alignment(horizontal='center', vertical='center')
                cell_font = Font(name='Segoe UI', size=10, bold=False, color='333333')
            
            if r == 22 and c in [13, 14]: # کل اخراجات
                cell_fill = exp_subtotal_bg
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='922B21')
            elif r == 24 and c in [13, 14]: # پچھلی بچت
                cell_fill = exp_prev_bg
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='1B4F72')
            elif r == 25 and c in [13, 14]: # کل بچت
                cell_fill = exp_savings_bg
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='145A32')
            
            cell.fill = PatternFill(start_color=cell_fill, end_color=cell_fill, fill_type='solid')
            cell.font = cell_font
            cell.alignment = cell_align
            
            top_s = thin_grid
            bot_s = thin_grid
            left_s = medium_navy if c == 12 else (medium_navy if c == 15 else thin_grid)
            right_s = medium_navy if c == 19 else (medium_navy if c == 14 else thin_grid)
            if r == 25 and c in [13, 14]:
                bot_s = double_bottom
            cell.border = Border(top=top_s, bottom=bot_s, left=left_s, right=right_s)

    # Row 33 in Sheet1 (Total)
    ws1.merge_cells('Q33:S33')
    ws1['Q33'].value = 'کُل میزان'
    ws1['P33'].value = '=SUM(P13:P32)'
    ws1['O33'].value = '=SUM(O13:O32)'
    
    for c in range(12, 20):
        cell = ws1.cell(33, c)
        cell.fill = PatternFill(start_color=summary_bg, end_color=summary_bg, fill_type='solid')
        left_s = medium_navy if c == 12 else (medium_navy if c == 15 else thin_grid)
        right_s = medium_navy if c == 19 else (medium_navy if c == 14 else thin_grid)
        cell.border = Border(top=thin_black, bottom=double_bottom, left=left_s, right=right_s)
        
        if c in [17, 18, 19]:
            cell.font = Font(name='Segoe UI', size=12, bold=True, color=navy_dark)
            cell.alignment = Alignment(horizontal='center', vertical='center')
        elif c == 16:
            cell.number_format = '#,##0'
            cell.font = Font(name='Segoe UI', size=11, bold=True, color='C00000')
            cell.alignment = Alignment(horizontal='right', vertical='center')
        elif c == 15:
            cell.number_format = '#,##0'
            cell.font = Font(name='Segoe UI', size=12, bold=True, color=navy_dark)
            cell.alignment = Alignment(horizontal='right', vertical='center')

    # Conditional formatting on Sheet1
    ws1.conditional_formatting.add('P13:P32', rule_arrears)
    ws1.conditional_formatting.add('O13:O32', rule_closed)
    ws1.conditional_formatting.add('O13:O32', rule_paid)

    # Page setup for Sheet1
    ws1.print_area = 'L2:S33'
    ws1.page_setup.orientation = ws1.ORIENTATION_LANDSCAPE
    ws1.page_setup.paperSize = ws1.PAPERSIZE_A4
    ws1.page_setup.fitToWidth = 1
    ws1.page_setup.fitToHeight = 1
    ws1.sheet_properties.pageSetUpPr.fitToPage = True

    # Save workbook
    wb.save('MAINTANENCE SHEET SEPTEMBER 2026.xlsx')
    print("KPI Dashboard and enhancement completed successfully!")

if __name__ == '__main__':
    build_kpi_dashboard()

import openpyxl
import datetime
from copy import copy
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import CellIsRule

def build_separated_summary():
    wb = openpyxl.load_workbook('MAINTANENCE SHEET SEPTEMBER 2026.xlsx')
    
    # -------------------------------------------------------------
    # Palette
    # -------------------------------------------------------------
    navy_dark = '1F4E79'
    navy_slate = '203764'
    blue_header_bg = '1B365D'
    badge_label_bg = 'D9E1F2'
    badge_val_bg = 'F2F4F8'
    
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

    flats_data = [
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
        (0, None, 18890, 'بجلی کا بل'),
        (1, None, 1500, 'موٹر آپریٹر '),
        (2, None, 4500, 'جمعدار'),
        (3, '11-SEP , 19-SEP', '=4100+3500', 'الیکٹریشن (اسامہ)'),
        (4, None, 26000, 'پمپ کے اخراجات'),
        (5, None, 1560, 'پلمبر کے اخراجات'),
        (6, None, 130, 'چوتھی منزل کا بلب'),
        (9, None, '=SUM(B8:B14)', 'کل اخراجات'),
        (11, None, 21611, 'پچھلی بچت'),
        (12, None, '=D28+B19-B17', 'کل بچت')
    ]

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
    # 1. TAB 1: مینٹیننس شیٹ (A تا H) - SUMMARY BELOW (نیچے)
    # =============================================================
    tab1_name = 'مینٹیننس شیٹ (خلاصہ نیچے)'
    for s in [tab1_name, 'مینٹیننس شیٹ (A تا H)']:
        if s in wb.sheetnames:
            del wb[s]
    ws = wb.create_sheet(title=tab1_name, index=0)
    ws.views.sheetView[0].showGridLines = True
    ws.views.sheetView[0].topLeftCell = 'A1'

    col_widths = {
        'A': 19,    # تفصیلات
        'B': 16,    # اخراجات کی رقم
        'C': 20,    # اخراجات کی تفصیل
        'D': 15,    # مینٹیننس
        'E': 14,    # بقایا رقم
        'F': 18,    # نام
        'G': 14.5,  # فلیٹ نمبر
        'H': 12     # سیریل نمبر
    }
    for col, w in col_widths.items():
        ws.column_dimensions[col].width = w

    # Heights
    ws.row_dimensions[1].height = 6
    ws.row_dimensions[2].height = 6
    ws.row_dimensions[3].height = 6
    ws.row_dimensions[4].height = 22
    ws.row_dimensions[5].height = 22
    ws.row_dimensions[6].height = 25
    ws.row_dimensions[7].height = 28
    for r in range(8, 28):
        ws.row_dimensions[r].height = 20
    ws.row_dimensions[28].height = 26
    ws.row_dimensions[29].height = 14
    ws.row_dimensions[30].height = 24  # Summary Ribbon
    ws.row_dimensions[31].height = 18  # Card Label
    ws.row_dimensions[32].height = 24  # Card Value
    ws.row_dimensions[33].height = 16  # Card Subtext
    ws.row_dimensions[34].height = 8
    ws.row_dimensions[35].height = 24  # Status Banner

    # --- TOP: Clean Register Title (A4:H5) ---
    ws.merge_cells('A4:H5')
    ws['A4'].value = 'AL MUSTAFA HEIGHTS 5-E-18/19'
    for r in range(4, 6):
        for c in range(1, 9):
            cell = ws.cell(r, c)
            cell.fill = PatternFill(start_color=blue_header_bg, end_color=blue_header_bg, fill_type='solid')
            top = medium_navy if r == 4 else None
            bot = medium_navy if r == 5 else None
            left = medium_navy if c == 1 else None
            right = medium_navy if c == 8 else None
            cell.border = Border(top=top, bottom=bot, left=left, right=right)
    ws['A4'].font = Font(name='Segoe UI', size=16, bold=True, color='FFFFFF')
    ws['A4'].alignment = Alignment(horizontal='center', vertical='center')

    # Row 6: Badges
    ws.cell(6, 1).value = 2026
    ws.cell(6, 2).value = 'سال'
    ws.cell(6, 4).value = 'SEPTEMBER'
    ws.cell(6, 5).value = 'مہینہ'
    ws.cell(6, 7).value = datetime.datetime(2026, 10, 3, 0, 0)
    ws.cell(6, 8).value = 'تاریخ'

    for lbl_c, val_c in [(2, 1), (5, 4), (8, 7)]:
        c_lbl = ws.cell(6, lbl_c)
        c_val = ws.cell(6, val_c)
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

    # Row 7: Table Header
    headers = [
        (1, 'تفصیلات'),
        (2, 'اخراجات کی رقم'),
        (3, 'اخراجات کی تفصیل'),
        (4, 'مینٹیننس'),
        (5, 'بقایا رقم'),
        (6, 'نام'),
        (7, 'فلیٹ نمبر'),
        (8, 'سیریل نمبر')
    ]
    for c, h_text in headers:
        cell = ws.cell(7, c)
        cell.value = h_text
        cell.fill = PatternFill(start_color=navy_slate, end_color=navy_slate, fill_type='solid')
        cell.font = Font(name='Segoe UI', size=11, bold=True, color='FFFFFF')
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        left = medium_navy if c == 1 else (medium_navy if c == 4 else thin_grid)
        right = medium_navy if c == 8 else (medium_navy if c == 3 else thin_grid)
        cell.border = Border(top=medium_navy, bottom=medium_navy, left=left, right=right)

    # Populate Data (Rows 8 to 27)
    for i, (sno, flat, name, maint, baqaya) in enumerate(flats_data):
        r = 8 + i
        ws.cell(r, 8).value = sno
        ws.cell(r, 7).value = flat
        ws.cell(r, 6).value = name
        ws.cell(r, 5).value = baqaya
        ws.cell(r, 4).value = maint

    for row_off, det, amt, desc in expenses_data:
        r = 8 + row_off
        ws.cell(r, 1).value = det
        ws.cell(r, 2).value = amt
        ws.cell(r, 3).value = desc

    # Style Data Cells
    for r in range(8, 28):
        is_even = (r % 2 == 0)
        base_fill = zebra_even if is_even else zebra_odd
        for c in range(1, 9):
            cell = ws.cell(r, c)
            cell_fill = base_fill
            cell_font = Font(name='Segoe UI', size=11, bold=False, color='000000')
            cell_align = Alignment(vertical='center')
            
            if c == 8:
                cell_align = Alignment(horizontal='center', vertical='center')
            elif c == 7:
                cell_align = Alignment(horizontal='center', vertical='center')
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='000000')
            elif c == 6:
                cell_align = Alignment(horizontal='right', vertical='center')
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='1F385C')
            elif c == 5:
                cell_align = Alignment(horizontal='right', vertical='center')
                cell.number_format = '#,##0'
                if cell.value is not None:
                    cell_font = Font(name='Segoe UI', size=11, bold=True, color='C00000')
            elif c == 4:
                cell_align = Alignment(horizontal='right', vertical='center')
                if isinstance(cell.value, (int, float)):
                    cell.number_format = '#,##0'
                    cell_font = Font(name='Segoe UI', size=11, bold=True, color='1E4D2B')
                elif cell.value == 'گھر بند ہے':
                    cell_align = Alignment(horizontal='center', vertical='center')
                    cell_font = Font(name='Segoe UI', size=11, bold=True, color='B25900')
            elif c == 3:
                cell_align = Alignment(horizontal='right', vertical='center')
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='000000')
            elif c == 2:
                cell_align = Alignment(horizontal='right', vertical='center')
                cell.number_format = '#,##0'
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='000000')
            elif c == 1:
                cell_align = Alignment(horizontal='center', vertical='center')
                cell_font = Font(name='Segoe UI', size=10, bold=False, color='333333')
            
            if r == 17 and c in [2, 3]:
                cell_fill = exp_subtotal_bg
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='922B21')
            elif r == 19 and c in [2, 3]:
                cell_fill = exp_prev_bg
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='1B4F72')
            elif r == 20 and c in [2, 3]:
                cell_fill = exp_savings_bg
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='145A32')
            
            cell.fill = PatternFill(start_color=cell_fill, end_color=cell_fill, fill_type='solid')
            cell.font = cell_font
            cell.alignment = cell_align
            
            top_s = thin_grid
            bot_s = thin_grid
            left_s = medium_navy if c == 1 else (medium_navy if c == 4 else thin_grid)
            right_s = medium_navy if c == 8 else (medium_navy if c == 3 else thin_grid)
            if r == 20 and c in [2, 3]:
                bot_s = double_bottom
            cell.border = Border(top=top_s, bottom=bot_s, left=left_s, right=right_s)

    # Row 28: Total Row
    ws.merge_cells('F28:H28')
    ws['F28'].value = 'کُل میزان'
    ws['E28'].value = '=SUM(E8:E27)'
    ws['D28'].value = '=SUM(D8:D27)'
    for c in range(1, 9):
        cell = ws.cell(28, c)
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

    # CF for main table
    ws.conditional_formatting.add('E8:E27', rule_arrears)
    ws.conditional_formatting.add('D8:D27', rule_closed)
    ws.conditional_formatting.add('D8:D27', rule_paid)

    # -------------------------------------------------------------
    # --- BOTTOM SECTION: SEPARATE EXECUTIVE SUMMARY (Rows 30 to 35) ---
    # -------------------------------------------------------------
    # Section Header Ribbon (Row 30, A30:H30)
    ws.merge_cells('A30:H30')
    ws['A30'].value = '📊 ایگزیکٹو سمری و تجزیاتی کارڈز (Executive Summary & KPI Dashboard)'
    for c in range(1, 9):
        cell = ws.cell(30, c)
        cell.fill = PatternFill(start_color=blue_header_bg, end_color=blue_header_bg, fill_type='solid')
        cell.border = Border(top=medium_navy, bottom=medium_navy, left=(medium_navy if c==1 else None), right=(medium_navy if c==8 else None))
    ws['A30'].font = Font(name='Segoe UI', size=11, bold=True, color='FFFFFF')
    ws['A30'].alignment = Alignment(horizontal='center', vertical='center')

    # Card 1 (G31:H33): 💰 کُل وصولی
    ws.merge_cells('G31:H31')
    ws.merge_cells('G32:H32')
    ws.merge_cells('G33:H33')
    style_card_range(ws, 31, 33, 7, 8, kpi_green_fill, kpi_green_border)
    ws['G31'].value = '💰 کُل وصولی (Total Collected)'
    ws['G31'].font = Font(name='Segoe UI', size=10, bold=True, color=kpi_green_text)
    ws['G31'].alignment = Alignment(horizontal='center', vertical='center')
    ws['G32'].value = '=D28'
    ws['G32'].font = Font(name='Segoe UI', size=15, bold=True, color=kpi_green_text)
    ws['G32'].number_format = '"Rs. " #,##0'
    ws['G32'].alignment = Alignment(horizontal='center', vertical='center')
    ws['G33'].value = '89% وصولی (16/19 فلیٹس)'
    ws['G33'].font = Font(name='Segoe UI', size=9, bold=False, italic=True, color=kpi_green_sub)
    ws['G33'].alignment = Alignment(horizontal='center', vertical='center')

    # Card 2 (E31:F33): ⚠️ کُل بقایا جات
    ws.merge_cells('E31:F31')
    ws.merge_cells('E32:F32')
    ws.merge_cells('E33:F33')
    style_card_range(ws, 31, 33, 5, 6, kpi_red_fill, kpi_red_border)
    ws['E31'].value = '⚠️ کُل بقایا جات (Outstanding)'
    ws['E31'].font = Font(name='Segoe UI', size=10, bold=True, color=kpi_red_text)
    ws['E31'].alignment = Alignment(horizontal='center', vertical='center')
    ws['E32'].value = '=E28'
    ws['E32'].font = Font(name='Segoe UI', size=15, bold=True, color=kpi_red_text)
    ws['E32'].number_format = '"Rs. " #,##0'
    ws['E32'].alignment = Alignment(horizontal='center', vertical='center')
    ws['E33'].value = '3 فلیٹس کی طرف بقایا'
    ws['E33'].font = Font(name='Segoe UI', size=9, bold=False, color=kpi_red_sub)
    ws['E33'].alignment = Alignment(horizontal='center', vertical='center')

    # Card 3 (C31:D33): 📉 کُل اخراجات
    ws.merge_cells('C31:D31')
    ws.merge_cells('C32:D32')
    ws.merge_cells('C33:D33')
    style_card_range(ws, 31, 33, 3, 4, kpi_amber_fill, kpi_amber_border)
    ws['C31'].value = '📉 کُل اخراجات (Expenses)'
    ws['C31'].font = Font(name='Segoe UI', size=10, bold=True, color=kpi_amber_text)
    ws['C31'].alignment = Alignment(horizontal='center', vertical='center')
    ws['C32'].value = '=B17'
    ws['C32'].font = Font(name='Segoe UI', size=15, bold=True, color=kpi_amber_text)
    ws['C32'].number_format = '"Rs. " #,##0'
    ws['C32'].alignment = Alignment(horizontal='center', vertical='center')
    ws['C33'].value = '7 مدات میں خرچ'
    ws['C33'].font = Font(name='Segoe UI', size=9, bold=False, color=kpi_amber_sub)
    ws['C33'].alignment = Alignment(horizontal='center', vertical='center')

    # Card 4 (A31:B33): 🏦 حتمی کیش بیلنس
    ws.merge_cells('A31:B31')
    ws.merge_cells('A32:B32')
    ws.merge_cells('A33:B33')
    style_card_range(ws, 31, 33, 1, 2, kpi_blue_fill, kpi_blue_border)
    ws['A31'].value = '🏦 حتمی کیش بیلنس (Closing)'
    ws['A31'].font = Font(name='Segoe UI', size=10, bold=True, color=kpi_blue_text)
    ws['A31'].alignment = Alignment(horizontal='center', vertical='center')
    ws['A32'].value = '=B20'
    ws['A32'].font = Font(name='Segoe UI', size=15, bold=True, color=kpi_blue_text)
    ws['A32'].number_format = '"Rs. " #,##0'
    ws['A32'].alignment = Alignment(horizontal='center', vertical='center')
    ws['A33'].value = 'پچھلی بچت شامل کر کے'
    ws['A33'].font = Font(name='Segoe UI', size=9, bold=False, color=kpi_blue_sub)
    ws['A33'].alignment = Alignment(horizontal='center', vertical='center')

    # Card 5: Status Banner (Row 35, A35:H35)
    ws.merge_cells('A35:H35')
    ws['A35'].value = '🏢 فلیٹ اسٹیٹس سمری:  16 فلیٹ ادا شدہ (مکمل)   |   3 فلیٹ جزوی بقایا (ابراہیم F-3, ندیم S-3, عابد P-4)   |   1 گھر بند (علی P-3)   |   1 دکاندار'
    banner_side = Side(style='thin', color=banner_border)
    fill_banner = PatternFill(start_color=banner_fill, end_color=banner_fill, fill_type='solid')
    for c in range(1, 9):
        cell = ws.cell(35, c)
        cell.fill = fill_banner
        cell.border = Border(top=banner_side, bottom=banner_side, left=(banner_side if c==1 else None), right=(banner_side if c==8 else None))
    ws['A35'].font = Font(name='Segoe UI', size=10.5, bold=True, color=banner_text)
    ws['A35'].alignment = Alignment(horizontal='center', vertical='center')

    # Print setup
    ws.print_area = 'A4:H35'
    ws.page_setup.orientation = ws.ORIENTATION_LANDSCAPE
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 1
    ws.sheet_properties.pageSetUpPr.fitToPage = True

    # =============================================================
    # 2. TAB 2: سائیڈ سمری (Side-by-Side View)
    # =============================================================
    tab2_name = 'سائیڈ سمری (Side View)'
    if tab2_name in wb.sheetnames:
        del wb[tab2_name]
    ws_side = wb.create_sheet(title=tab2_name, index=1)
    ws_side.views.sheetView[0].showGridLines = True
    ws_side.views.sheetView[0].topLeftCell = 'A1'

    # Set widths for A to H (Table) and J to L (Side Cards)
    for col, w in col_widths.items():
        ws_side.column_dimensions[col].width = w
    ws_side.column_dimensions['I'].width = 4   # Spacer
    ws_side.column_dimensions['J'].width = 16  # Side Card Col 1
    ws_side.column_dimensions['K'].width = 16  # Side Card Col 2
    ws_side.column_dimensions['L'].width = 16  # Side Card Col 3

    # Copy Table content from Tab 1 (Rows 4 to 28)
    for r in range(4, 29):
        ws_side.row_dimensions[r].height = ws.row_dimensions[r].height
        for c in range(1, 9):
            cell_src = ws.cell(r, c)
            cell_dst = ws_side.cell(r, c)
            cell_dst.value = cell_src.value
            if cell_src.has_style:
                cell_dst.font = copy(cell_src.font)
                cell_dst.fill = copy(cell_src.fill)
                cell_dst.border = copy(cell_src.border)
                cell_dst.alignment = copy(cell_src.alignment)
                cell_dst.number_format = cell_src.number_format

    ws_side.merge_cells('A4:H5')
    ws_side['A4'].value = 'AL MUSTAFA HEIGHTS 5-E-18/19'
    ws_side.merge_cells('F28:H28')
    ws_side['F28'].value = 'کُل میزان'

    # SIDE CARDS (Columns J to L, alongside rows 4 to 28)
    # Side Title (J4:L5)
    ws_side.merge_cells('J4:L5')
    ws_side['J4'].value = '📊 ایگزیکٹو سمری (Summary Dashboard)'
    for r in range(4, 6):
        for c in range(10, 13):
            cell = ws_side.cell(r, c)
            cell.fill = PatternFill(start_color=blue_header_bg, end_color=blue_header_bg, fill_type='solid')
            top = medium_navy if r == 4 else None
            bot = medium_navy if r == 5 else None
            left = medium_navy if c == 10 else None
            right = medium_navy if c == 12 else None
            cell.border = Border(top=top, bottom=bot, left=left, right=right)
    ws_side['J4'].font = Font(name='Segoe UI', size=12, bold=True, color='FFFFFF')
    ws_side['J4'].alignment = Alignment(horizontal='center', vertical='center')

    # Side Card 1: Total Collected (J7:L9)
    ws_side.merge_cells('J7:L7')
    ws_side.merge_cells('J8:L8')
    ws_side.merge_cells('J9:L9')
    style_card_range(ws_side, 7, 9, 10, 12, kpi_green_fill, kpi_green_border)
    ws_side['J7'].value = '💰 کُل وصولی (Total Collected)'
    ws_side['J7'].font = Font(name='Segoe UI', size=11, bold=True, color=kpi_green_text)
    ws_side['J7'].alignment = Alignment(horizontal='center', vertical='center')
    ws_side['J8'].value = '=D28'
    ws_side['J8'].font = Font(name='Segoe UI', size=16, bold=True, color=kpi_green_text)
    ws_side['J8'].number_format = '"Rs. " #,##0'
    ws_side['J8'].alignment = Alignment(horizontal='center', vertical='center')
    ws_side['J9'].value = '89% وصولی (16/19 فلیٹس موصول)'
    ws_side['J9'].font = Font(name='Segoe UI', size=9.5, italic=True, color=kpi_green_sub)
    ws_side['J9'].alignment = Alignment(horizontal='center', vertical='center')

    # Side Card 2: Total Outstanding (J11:L13)
    ws_side.merge_cells('J11:L11')
    ws_side.merge_cells('J12:L12')
    ws_side.merge_cells('J13:L13')
    style_card_range(ws_side, 11, 13, 10, 12, kpi_red_fill, kpi_red_border)
    ws_side['J11'].value = '⚠️ کُل بقایا جات (Outstanding)'
    ws_side['J11'].font = Font(name='Segoe UI', size=11, bold=True, color=kpi_red_text)
    ws_side['J11'].alignment = Alignment(horizontal='center', vertical='center')
    ws_side['J12'].value = '=E28'
    ws_side['J12'].font = Font(name='Segoe UI', size=16, bold=True, color=kpi_red_text)
    ws_side['J12'].number_format = '"Rs. " #,##0'
    ws_side['J12'].alignment = Alignment(horizontal='center', vertical='center')
    ws_side['J13'].value = '3 فلیٹس کی طرف بقایا (F-3, S-3, P-4)'
    ws_side['J13'].font = Font(name='Segoe UI', size=9.5, color=kpi_red_sub)
    ws_side['J13'].alignment = Alignment(horizontal='center', vertical='center')

    # Side Card 3: Total Expenses (J15:L17)
    ws_side.merge_cells('J15:L15')
    ws_side.merge_cells('J16:L16')
    ws_side.merge_cells('J17:L17')
    style_card_range(ws_side, 15, 17, 10, 12, kpi_amber_fill, kpi_amber_border)
    ws_side['J15'].value = '📉 کُل اخراجات (Total Expenses)'
    ws_side['J15'].font = Font(name='Segoe UI', size=11, bold=True, color=kpi_amber_text)
    ws_side['J15'].alignment = Alignment(horizontal='center', vertical='center')
    ws_side['J16'].value = '=B17'
    ws_side['J16'].font = Font(name='Segoe UI', size=16, bold=True, color=kpi_amber_text)
    ws_side['J16'].number_format = '"Rs. " #,##0'
    ws_side['J16'].alignment = Alignment(horizontal='center', vertical='center')
    ws_side['J17'].value = '7 مختلف مدات میں خرچ'
    ws_side['J17'].font = Font(name='Segoe UI', size=9.5, color=kpi_amber_sub)
    ws_side['J17'].alignment = Alignment(horizontal='center', vertical='center')

    # Side Card 4: Closing Cash (J19:L21)
    ws_side.merge_cells('J19:L19')
    ws_side.merge_cells('J20:L20')
    ws_side.merge_cells('J21:L21')
    style_card_range(ws_side, 19, 21, 10, 12, kpi_blue_fill, kpi_blue_border)
    ws_side['J19'].value = '🏦 حتمی کیش بیلنس (Closing Balance)'
    ws_side['J19'].font = Font(name='Segoe UI', size=11, bold=True, color=kpi_blue_text)
    ws_side['J19'].alignment = Alignment(horizontal='center', vertical='center')
    ws_side['J20'].value = '=B20'
    ws_side['J20'].font = Font(name='Segoe UI', size=16, bold=True, color=kpi_blue_text)
    ws_side['J20'].number_format = '"Rs. " #,##0'
    ws_side['J20'].alignment = Alignment(horizontal='center', vertical='center')
    ws_side['J21'].value = 'پچھلی بچت (Rs. 21,611) شامل کر کے'
    ws_side['J21'].font = Font(name='Segoe UI', size=9.5, color=kpi_blue_sub)
    ws_side['J21'].alignment = Alignment(horizontal='center', vertical='center')

    # Side Status Banner (J23:L26)
    ws_side.merge_cells('J23:L26')
    ws_side['J23'].value = '🏢 فلیٹ اسٹیٹس سمری:\n• 16 فلیٹس ادا شدہ (مکمل)\n• 3 فلیٹس جزوی بقایا (F-3, S-3, P-4)\n• 1 فلیٹ گھر بند ہے (P-3)\n• 1 دکاندار (ادا شدہ)'
    for r in range(23, 27):
        for c in range(10, 13):
            cell = ws_side.cell(r, c)
            cell.fill = fill_banner
            top = banner_side if r == 23 else None
            bot = banner_side if r == 26 else None
            left = banner_side if c == 10 else None
            right = banner_side if c == 12 else None
            cell.border = Border(top=top, bottom=bot, left=left, right=right)
    ws_side['J23'].font = Font(name='Segoe UI', size=10, bold=True, color=banner_text)
    ws_side['J23'].alignment = Alignment(horizontal='right', vertical='center', wrap_text=True)

    # CF for side sheet
    ws_side.conditional_formatting.add('E8:E27', rule_arrears)
    ws_side.conditional_formatting.add('D8:D27', rule_closed)
    ws_side.conditional_formatting.add('D8:D27', rule_paid)

    # Print setup for side sheet
    ws_side.print_area = 'A4:L28'
    ws_side.page_setup.orientation = ws_side.ORIENTATION_LANDSCAPE
    ws_side.page_setup.paperSize = ws_side.PAPERSIZE_A4
    ws_side.page_setup.fitToWidth = 1
    ws_side.page_setup.fitToHeight = 1
    ws_side.sheet_properties.pageSetUpPr.fitToPage = True

    # =============================================================
    # 3. TAB 3: Sheet1 (Columns L to S with summary below)
    # =============================================================
    ws1 = wb['Sheet1']
    ws1.views.sheetView[0].showGridLines = True
    ws1.views.sheetView[0].topLeftCell = 'L1'
    
    col_widths_1 = {
        'L': 19, 'M': 16, 'N': 20, 'O': 15, 'P': 14, 'Q': 18, 'R': 14.5, 'S': 12
    }
    for col, w in col_widths_1.items():
        ws1.column_dimensions[col].width = w
    for r in range(1, 36):
        ws1.row_dimensions[r].height = ws.row_dimensions[r].height

    # Clear old merges
    for m in list(ws1.merged_cells.ranges):
        ws1.unmerge_cells(str(m))
    for r in range(1, 36):
        for c in range(12, 20):
            ws1.cell(r, c).value = None
            ws1.cell(r, c).fill = PatternFill(fill_type=None)
            ws1.cell(r, c).border = Border()

    # Title L4:S5
    ws1.merge_cells('L4:S5')
    ws1['L4'].value = 'AL MUSTAFA HEIGHTS 5-E-18/19'
    for r in range(4, 6):
        for c in range(12, 20):
            cell = ws1.cell(r, c)
            cell.fill = PatternFill(start_color=blue_header_bg, end_color=blue_header_bg, fill_type='solid')
            top = medium_navy if r == 4 else None
            bot = medium_navy if r == 5 else None
            left = medium_navy if c == 12 else None
            right = medium_navy if c == 19 else None
            cell.border = Border(top=top, bottom=bot, left=left, right=right)
    ws1['L4'].font = Font(name='Segoe UI', size=16, bold=True, color='FFFFFF')
    ws1['L4'].alignment = Alignment(horizontal='center', vertical='center')

    # Badges Row 6
    ws1.cell(6, 12).value = 2026
    ws1.cell(6, 13).value = 'سال'
    ws1.cell(6, 15).value = 'SEPTEMBER'
    ws1.cell(6, 16).value = 'مہینہ'
    ws1.cell(6, 18).value = datetime.datetime(2026, 10, 3, 0, 0)
    ws1.cell(6, 19).value = 'تاریخ'

    for lbl_c, val_c in [(13, 12), (16, 15), (19, 18)]:
        c_lbl = ws1.cell(6, lbl_c)
        c_val = ws1.cell(6, val_c)
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

    # Headers Row 7
    headers_1 = [
        (12, 'تفصیلات'), (13, 'اخراجات کی رقم'), (14, 'اخراجات کی تفصیل'),
        (15, 'مینٹیننس'), (16, 'بقایا رقم'), (17, 'نام'), (18, 'فلیٹ نمبر'), (19, 'سیریل نمبر')
    ]
    for c, h_text in headers_1:
        cell = ws1.cell(7, c)
        cell.value = h_text
        cell.fill = PatternFill(start_color=navy_slate, end_color=navy_slate, fill_type='solid')
        cell.font = Font(name='Segoe UI', size=11, bold=True, color='FFFFFF')
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        left = medium_navy if c == 12 else (medium_navy if c == 15 else thin_grid)
        right = medium_navy if c == 19 else (medium_navy if c == 14 else thin_grid)
        cell.border = Border(top=medium_navy, bottom=medium_navy, left=left, right=right)

    # Populate Data in Sheet1
    for i, (sno, flat, name, maint, baqaya) in enumerate(flats_data):
        r = 8 + i
        ws1.cell(r, 19).value = sno
        ws1.cell(r, 18).value = flat
        ws1.cell(r, 17).value = name
        ws1.cell(r, 16).value = baqaya
        ws1.cell(r, 15).value = maint

    for row_off, det, amt, desc in expenses_data:
        r = 8 + row_off
        formula_amt = amt
        if isinstance(amt, str) and 'B8:B14' in amt:
            formula_amt = amt.replace('B8:B14', 'M8:M14')
        elif isinstance(amt, str) and 'D28+B19-B17' in amt:
            formula_amt = amt.replace('D28+B19-B17', 'O28+M19-M17')
        ws1.cell(r, 12).value = det
        ws1.cell(r, 13).value = formula_amt
        ws1.cell(r, 14).value = desc

    # Style Data Cells in Sheet1
    for r in range(8, 28):
        is_even = (r % 2 == 0)
        base_fill = zebra_even if is_even else zebra_odd
        for c in range(12, 20):
            cell = ws1.cell(r, c)
            cell_fill = base_fill
            cell_font = Font(name='Segoe UI', size=11, bold=False, color='000000')
            cell_align = Alignment(vertical='center')
            
            if c == 19:
                cell_align = Alignment(horizontal='center', vertical='center')
            elif c == 18:
                cell_align = Alignment(horizontal='center', vertical='center')
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='000000')
            elif c == 17:
                cell_align = Alignment(horizontal='right', vertical='center')
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='1F385C')
            elif c == 16:
                cell_align = Alignment(horizontal='right', vertical='center')
                cell.number_format = '#,##0'
                if cell.value is not None:
                    cell_font = Font(name='Segoe UI', size=11, bold=True, color='C00000')
            elif c == 15:
                cell_align = Alignment(horizontal='right', vertical='center')
                if isinstance(cell.value, (int, float)):
                    cell.number_format = '#,##0'
                    cell_font = Font(name='Segoe UI', size=11, bold=True, color='1E4D2B')
                elif cell.value == 'گھر بند ہے':
                    cell_align = Alignment(horizontal='center', vertical='center')
                    cell_font = Font(name='Segoe UI', size=11, bold=True, color='B25900')
            elif c == 14:
                cell_align = Alignment(horizontal='right', vertical='center')
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='000000')
            elif c == 13:
                cell_align = Alignment(horizontal='right', vertical='center')
                cell.number_format = '#,##0'
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='000000')
            elif c == 12:
                cell_align = Alignment(horizontal='center', vertical='center')
                cell_font = Font(name='Segoe UI', size=10, bold=False, color='333333')
            
            if r == 17 and c in [13, 14]:
                cell_fill = exp_subtotal_bg
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='922B21')
            elif r == 19 and c in [13, 14]:
                cell_fill = exp_prev_bg
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='1B4F72')
            elif r == 20 and c in [13, 14]:
                cell_fill = exp_savings_bg
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='145A32')
            
            cell.fill = PatternFill(start_color=cell_fill, end_color=cell_fill, fill_type='solid')
            cell.font = cell_font
            cell.alignment = cell_align
            
            top_s = thin_grid
            bot_s = thin_grid
            left_s = medium_navy if c == 12 else (medium_navy if c == 15 else thin_grid)
            right_s = medium_navy if c == 19 else (medium_navy if c == 14 else thin_grid)
            if r == 20 and c in [13, 14]:
                bot_s = double_bottom
            cell.border = Border(top=top_s, bottom=bot_s, left=left_s, right=right_s)

    # Row 28 Total in Sheet1
    ws1.merge_cells('Q28:S28')
    ws1['Q28'].value = 'کُل میزان'
    ws1['P28'].value = '=SUM(P8:P27)'
    ws1['O28'].value = '=SUM(O8:O27)'
    for c in range(12, 20):
        cell = ws1.cell(28, c)
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

    # Summary Below on Sheet1 (Rows 30 to 35)
    ws1.merge_cells('L30:S30')
    ws1['L30'].value = '📊 ایگزیکٹو سمری و تجزیاتی کارڈز (Executive Summary & KPI Dashboard)'
    for c in range(12, 20):
        cell = ws1.cell(30, c)
        cell.fill = PatternFill(start_color=blue_header_bg, end_color=blue_header_bg, fill_type='solid')
        cell.border = Border(top=medium_navy, bottom=medium_navy, left=(medium_navy if c==12 else None), right=(medium_navy if c==19 else None))
    ws1['L30'].font = Font(name='Segoe UI', size=11, bold=True, color='FFFFFF')
    ws1['L30'].alignment = Alignment(horizontal='center', vertical='center')

    # Card 1 (R31:S33): 💰 کُل وصولی
    ws1.merge_cells('R31:S31')
    ws1.merge_cells('R32:S32')
    ws1.merge_cells('R33:S33')
    style_card_range(ws1, 31, 33, 18, 19, kpi_green_fill, kpi_green_border)
    ws1['R31'].value = '💰 کُل وصولی (Total Collected)'
    ws1['R31'].font = Font(name='Segoe UI', size=10, bold=True, color=kpi_green_text)
    ws1['R31'].alignment = Alignment(horizontal='center', vertical='center')
    ws1['R32'].value = '=O28'
    ws1['R32'].font = Font(name='Segoe UI', size=15, bold=True, color=kpi_green_text)
    ws1['R32'].number_format = '"Rs. " #,##0'
    ws1['R32'].alignment = Alignment(horizontal='center', vertical='center')
    ws1['R33'].value = '89% وصولی (16/19 فلیٹس)'
    ws1['R33'].font = Font(name='Segoe UI', size=9, bold=False, italic=True, color=kpi_green_sub)
    ws1['R33'].alignment = Alignment(horizontal='center', vertical='center')

    # Card 2 (P31:Q33): ⚠️ کُل بقایا جات
    ws1.merge_cells('P31:Q31')
    ws1.merge_cells('P32:Q32')
    ws1.merge_cells('P33:Q33')
    style_card_range(ws1, 31, 33, 16, 17, kpi_red_fill, kpi_red_border)
    ws1['P31'].value = '⚠️ کُل بقایا جات (Outstanding)'
    ws1['P31'].font = Font(name='Segoe UI', size=10, bold=True, color=kpi_red_text)
    ws1['P31'].alignment = Alignment(horizontal='center', vertical='center')
    ws1['P32'].value = '=P28'
    ws1['P32'].font = Font(name='Segoe UI', size=15, bold=True, color=kpi_red_text)
    ws1['P32'].number_format = '"Rs. " #,##0'
    ws1['P32'].alignment = Alignment(horizontal='center', vertical='center')
    ws1['P33'].value = '3 فلیٹس کی طرف بقایا'
    ws1['P33'].font = Font(name='Segoe UI', size=9, bold=False, color=kpi_red_sub)
    ws1['P33'].alignment = Alignment(horizontal='center', vertical='center')

    # Card 3 (N31:O33): 📉 کُل اخراجات
    ws1.merge_cells('N31:O31')
    ws1.merge_cells('N32:O32')
    ws1.merge_cells('N33:O33')
    style_card_range(ws1, 31, 33, 14, 15, kpi_amber_fill, kpi_amber_border)
    ws1['N31'].value = '📉 کُل اخراجات (Expenses)'
    ws1['N31'].font = Font(name='Segoe UI', size=10, bold=True, color=kpi_amber_text)
    ws1['N31'].alignment = Alignment(horizontal='center', vertical='center')
    ws1['N32'].value = '=M17'
    ws1['N32'].font = Font(name='Segoe UI', size=15, bold=True, color=kpi_amber_text)
    ws1['N32'].number_format = '"Rs. " #,##0'
    ws1['N32'].alignment = Alignment(horizontal='center', vertical='center')
    ws1['N33'].value = '7 مدات میں خرچ'
    ws1['N33'].font = Font(name='Segoe UI', size=9, bold=False, color=kpi_amber_sub)
    ws1['N33'].alignment = Alignment(horizontal='center', vertical='center')

    # Card 4 (L31:M33): 🏦 حتمی کیش بیلنس
    ws1.merge_cells('L31:M31')
    ws1.merge_cells('L32:M32')
    ws1.merge_cells('L33:M33')
    style_card_range(ws1, 31, 33, 12, 13, kpi_blue_fill, kpi_blue_border)
    ws1['L31'].value = '🏦 حتمی کیش بیلنس (Closing)'
    ws1['L31'].font = Font(name='Segoe UI', size=10, bold=True, color=kpi_blue_text)
    ws1['L31'].alignment = Alignment(horizontal='center', vertical='center')
    ws1['L32'].value = '=M20'
    ws1['L32'].font = Font(name='Segoe UI', size=15, bold=True, color=kpi_blue_text)
    ws1['L32'].number_format = '"Rs. " #,##0'
    ws1['L32'].alignment = Alignment(horizontal='center', vertical='center')
    ws1['L33'].value = 'پچھلی بچت شامل کر کے'
    ws1['L33'].font = Font(name='Segoe UI', size=9, bold=False, color=kpi_blue_sub)
    ws1['L33'].alignment = Alignment(horizontal='center', vertical='center')

    # Status Banner Sheet1 (L35:S35)
    ws1.merge_cells('L35:S35')
    ws1['L35'].value = '🏢 فلیٹ اسٹیٹس سمری:  16 فلیٹ ادا شدہ (مکمل)   |   3 فلیٹ جزوی بقایا (ابراہیم F-3, ندیم S-3, عابد P-4)   |   1 گھر بند (علی P-3)   |   1 دکاندار'
    for c in range(12, 20):
        cell = ws1.cell(35, c)
        cell.fill = fill_banner
        cell.border = Border(top=banner_side, bottom=banner_side, left=(banner_side if c==12 else None), right=(banner_side if c==19 else None))
    ws1['L35'].font = Font(name='Segoe UI', size=10.5, bold=True, color=banner_text)
    ws1['L35'].alignment = Alignment(horizontal='center', vertical='center')

    ws1.conditional_formatting.add('P8:P27', rule_arrears)
    ws1.conditional_formatting.add('O8:O27', rule_closed)
    ws1.conditional_formatting.add('O8:O27', rule_paid)

    ws1.print_area = 'L4:S35'
    ws1.page_setup.orientation = ws1.ORIENTATION_LANDSCAPE
    ws1.page_setup.paperSize = ws1.PAPERSIZE_A4
    ws1.page_setup.fitToWidth = 1
    ws1.page_setup.fitToHeight = 1
    ws1.sheet_properties.pageSetUpPr.fitToPage = True

    wb.save('MAINTANENCE SHEET SEPTEMBER 2026.xlsx')
    print("Separated summary build complete!")

if __name__ == '__main__':
    build_separated_summary()

import openpyxl
import datetime
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import CellIsRule

def build_generalized_maintenance_system():
    # Palette
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

    # -------------------------------------------------------------
    # Month-specific definitions
    # -------------------------------------------------------------
    months_data = {
        'JULY': {
            'month_name': 'JULY',
            'date_val': datetime.datetime(2026, 9, 6, 0, 0),
            'prev_savings': 60776,
            'prev_sheet': None,
            'kpi_recd_sub': '95% وصولی (18/19 فلیٹس)',
            'kpi_arr_sub': '1 فلیٹ کی طرف بقایا',
            'kpi_exp_sub': '5 مدات میں خرچ',
            'status_banner': '🏢 فلیٹ اسٹیٹس سمری:  18 فلیٹ ادا شدہ (مکمل)   |   1 فلیٹ جزوی بقایا (عابد P-4)   |   1 گھر بند (علی P-3)   |   1 دکاندار',
            'expenses': [
                ('یکم اگست سے انجم انکل نے موٹر چلائی۔', 34300, 'بجلی کا بل'),
                (None, 3000, 'موٹر آپریٹر '),
                (None, 4500, 'جمعدار'),
                (None, 6500, 'فلو ر کی لائٹس'),
                (None, 6500, 'موٹر'),
                (None, None, None),
                (None, None, None)
            ],
            'flats': [
                (1, 'G-1', 'انجم پرویز', 3000, None),
                (2, 'G-2', 'راشد', 3000, None),
                (3, 'G-3', 'فرید', 2500, None),
                (4, 'F-1', 'سبحان', 2500, None),
                (5, 'F-2', 'سکندر', 3000, None),
                (6, 'F-3', 'ابراہیم', 3000, None),
                (7, 'F-4', 'نوید', 2500, None),
                (8, 'S-1', 'عمران', 3000, None),
                (9, 'S-2', 'پرویز', 3000, None),
                (10, 'S-3', 'ندیم', 3000, None),
                (11, 'S-4', 'جبران', 3000, None),
                (12, 'T-1', 'کامران', 3000, None),
                (13, 'T-2', 'عبدالعلیم', 3000, None),
                (14, 'T-3', 'حافظ سعد', 3000, None),
                (15, 'T-4', 'عمران', 3000, None),
                (16, 'P-1', 'حنیف', 3000, None),
                (17, 'P-2', 'ابو محمد', 3000, None),
                (18, 'P-3', 'علی', 'گھر بند ہے', None),
                (19, 'P-4', 'عابد', 10000, 3000),
                (20, None, 'دکاندار', 500, None)
            ]
        },
        'AUGUST': {
            'month_name': 'AUGUST',
            'date_val': datetime.datetime(2026, 9, 6, 0, 0),
            'prev_savings': "=JULY!B26", # Automatically carried forward from July!
            'prev_sheet': 'JULY',
            'kpi_recd_sub': '89% وصولی (17/19 فلیٹس)',
            'kpi_arr_sub': '2 فلیٹس کی طرف بقایا',
            'kpi_exp_sub': '7 مدات میں خرچ',
            'status_banner': '🏢 فلیٹ اسٹیٹس سمری:  17 فلیٹ ادا شدہ (مکمل)   |   2 فلیٹ جزوی بقایا (ابراہیم F-3, عابد P-4)   |   1 گھر بند (علی P-3)   |   1 دکاندار',
            'expenses': [
                ('یکم اگست سے انجم انکل نے موٹر چلائی۔', 30685, 'بجلی کا بل'),
                (None, 0, 'موٹر آپریٹر '),
                (None, 4500, 'جمعدار'),
                (None, '=33780+300', 'پمپ کی تبدیلی'),
                (None, 7000, 'پمپ کی مرمت'),
                (None, 14000, 'بورڈ'),
                (None, 4000, 'موٹر')
            ],
            'flats': [
                (1, 'G-1', 'انجم پرویز', 3000, None),
                (2, 'G-2', 'راشد', 3000, None),
                (3, 'G-3', 'فرید', 2500, None),
                (4, 'F-1', 'سبحان', 2500, None),
                (5, 'F-2', 'سکندر', 3000, None),
                (6, 'F-3', 'ابراہیم', 0, 3000),
                (7, 'F-4', 'نوید', 2500, None),
                (8, 'S-1', 'عمران', 3000, None),
                (9, 'S-2', 'پرویز', 3000, None),
                (10, 'S-3', 'ندیم', 3000, None),
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
        },
        'SEPTEMBER': {
            'month_name': 'SEPTEMBER',
            'date_val': datetime.datetime(2026, 10, 3, 0, 0),
            'prev_savings': "=AUGUST!B26", # Automatically carried forward from August!
            'prev_sheet': 'AUGUST',
            'kpi_recd_sub': '89% وصولی (16/19 فلیٹس)',
            'kpi_arr_sub': '3 فلیٹس کی طرف بقایا',
            'kpi_exp_sub': '7 مدات میں خرچ',
            'status_banner': '🏢 فلیٹ اسٹیٹس سمری:  16 فلیٹ ادا شدہ (مکمل)   |   3 فلیٹ جزوی بقایا (ابراہیم F-3, ندیم S-3, عابد P-4)   |   1 گھر بند (علی P-3)   |   1 دکاندار',
            'expenses': [
                (None, 18890, 'بجلی کا بل'),
                (None, 1500, 'موٹر آپریٹر '),
                (None, 4500, 'جمعدار'),
                ('11-SEP , 19-SEP', '=4100+3500', 'الیکٹریشن (اسامہ)'),
                (None, 26000, 'پمپ کے اخراجات'),
                (None, 1560, 'پلمبر کے اخراجات'),
                (None, 130, 'چوتھی منزل کا بلب')
            ],
            'flats': [
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
        }
    }

    # Conditional Formatting Rules
    red_fill = PatternFill(start_color='FCE4D6', end_color='FCE4D6', fill_type='solid')
    red_font = Font(name='Segoe UI', size=11, bold=True, color='C00000')
    rule_arrears = CellIsRule(operator='greaterThan', formula=['0'], stopIfTrue=True, fill=red_fill, font=red_font)
    
    amber_fill = PatternFill(start_color='FFF2CC', end_color='FFF2CC', fill_type='solid')
    amber_font = Font(name='Segoe UI', size=11, bold=True, color='B25900')
    rule_closed = CellIsRule(operator='equal', formula=['"گھر بند ہے"'], stopIfTrue=True, fill=amber_fill, font=amber_font)
    
    green_fill = PatternFill(start_color='E2EFDA', end_color='E2EFDA', fill_type='solid')
    green_font = Font(name='Segoe UI', size=11, bold=True, color='276A3C')
    rule_paid = CellIsRule(operator='greaterThan', formula=['0'], stopIfTrue=True, fill=green_fill, font=green_font)

    # Create fresh workbook
    wb = openpyxl.Workbook()
    default_sheet = wb.active

    # =============================================================
    # 1. BUILD MONTHLY SHEETS (JULY, AUGUST, SEPTEMBER)
    # =============================================================
    col_widths = {
        'A': 20,    # تفصیلات
        'B': 16,    # اخراجات کی رقم
        'C': 20,    # اخراجات کی تفصیل
        'D': 15,    # مینٹیننس
        'E': 14,    # بقایا رقم
        'F': 18,    # نام
        'G': 14.5,  # فلیٹ نمبر
        'H': 12     # سیریل نمبر
    }

    for month_key in ['JULY', 'AUGUST', 'SEPTEMBER']:
        m_data = months_data[month_key]
        ws = wb.create_sheet(title=month_key)
        ws.views.sheetView[0].showGridLines = True
        ws.views.sheetView[0].topLeftCell = 'A1'

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
        ws.cell(6, 4).value = m_data['month_name']
        ws.cell(6, 5).value = 'مہینہ'
        ws.cell(6, 7).value = m_data['date_val']
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

        # Populate Flats Data (Rows 8 to 27)
        for i, (sno, flat, name, maint, baqaya) in enumerate(m_data['flats']):
            r = 8 + i
            ws.cell(r, 8).value = sno
            ws.cell(r, 7).value = flat
            ws.cell(r, 6).value = name
            ws.cell(r, 5).value = baqaya
            ws.cell(r, 4).value = maint

        # Populate Expenses Data (Rows 8 to 14)
        for i, (det, amt, desc) in enumerate(m_data['expenses']):
            r = 8 + i
            ws.cell(r, 1).value = det
            ws.cell(r, 2).value = amt
            ws.cell(r, 3).value = desc

        # Subtotals on Expenses side (Rows 23, 25, 26)
        ws.cell(23, 3).value = 'کل اخراجات'
        ws.cell(23, 2).value = '=SUM(B8:B14)'
        
        ws.cell(25, 3).value = 'پچھلی بچت'
        ws.cell(25, 2).value = m_data['prev_savings']
        
        ws.cell(26, 3).value = 'کل بچت'
        ws.cell(26, 2).value = '=D28+B25-B23'

        # Style Data Cells (Rows 8 to 27)
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
                    elif cell.value == '-':
                        cell_align = Alignment(horizontal='center', vertical='center')
                elif c == 3:
                    cell_align = Alignment(horizontal='right', vertical='center')
                    cell_font = Font(name='Segoe UI', size=11, bold=True, color='000000')
                elif c == 2:
                    cell_align = Alignment(horizontal='right', vertical='center')
                    if isinstance(cell.value, (int, float)) or (isinstance(cell.value, str) and cell.value.startswith('=')):
                        cell.number_format = '#,##0'
                    cell_font = Font(name='Segoe UI', size=11, bold=True, color='000000')
                elif c == 1:
                    cell_align = Alignment(horizontal='center', vertical='center')
                    cell_font = Font(name='Segoe UI', size=10, bold=False, color='333333')
                
                # Special Subtotals Highlighting
                if r == 23 and c in [2, 3]:
                    cell_fill = exp_subtotal_bg
                    cell_font = Font(name='Segoe UI', size=11, bold=True, color='922B21')
                elif r == 25 and c in [2, 3]:
                    cell_fill = exp_prev_bg
                    cell_font = Font(name='Segoe UI', size=11, bold=True, color='1B4F72')
                elif r == 26 and c in [2, 3]:
                    cell_fill = exp_savings_bg
                    cell_font = Font(name='Segoe UI', size=11, bold=True, color='145A32')
                
                cell.fill = PatternFill(start_color=cell_fill, end_color=cell_fill, fill_type='solid')
                cell.font = cell_font
                cell.alignment = cell_align
                
                top_s = thin_grid
                bot_s = thin_grid
                left_s = medium_navy if c == 1 else (medium_navy if c == 4 else thin_grid)
                right_s = medium_navy if c == 8 else (medium_navy if c == 3 else thin_grid)
                if r == 26 and c in [2, 3]:
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

        # Conditional Formatting for table
        ws.conditional_formatting.add('E8:E27', rule_arrears)
        ws.conditional_formatting.add('D8:D27', rule_closed)
        ws.conditional_formatting.add('D8:D27', rule_paid)

        # --- BOTTOM SECTION: SEPARATE EXECUTIVE SUMMARY (Rows 30 to 35) ---
        ws.merge_cells('A30:H30')
        ws['A30'].value = f'📊 ایگزیکٹو سمری و تجزیاتی کارڈز — {m_data["month_name"]} 2026'
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
        ws['G33'].value = m_data['kpi_recd_sub']
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
        ws['E33'].value = m_data['kpi_arr_sub']
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
        ws['C32'].value = '=B23'
        ws['C32'].font = Font(name='Segoe UI', size=15, bold=True, color=kpi_amber_text)
        ws['C32'].number_format = '"Rs. " #,##0'
        ws['C32'].alignment = Alignment(horizontal='center', vertical='center')
        ws['C33'].value = m_data['kpi_exp_sub']
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
        ws['A32'].value = '=B26'
        ws['A32'].font = Font(name='Segoe UI', size=15, bold=True, color=kpi_blue_text)
        ws['A32'].number_format = '"Rs. " #,##0'
        ws['A32'].alignment = Alignment(horizontal='center', vertical='center')
        ws['A33'].value = 'پچھلی بچت شامل کر کے'
        ws['A33'].font = Font(name='Segoe UI', size=9, bold=False, color=kpi_blue_sub)
        ws['A33'].alignment = Alignment(horizontal='center', vertical='center')

        # Card 5: Status Banner (Row 35, A35:H35)
        ws.merge_cells('A35:H35')
        ws['A35'].value = m_data['status_banner']
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
    # 2. MASTER OVERVIEW / DASHBOARD SHEET (TAB 1)
    # =============================================================
    ws_ov = wb.create_sheet(title='ماہانہ جائزہ (Overview)', index=0)
    ws_ov.views.sheetView[0].showGridLines = True
    ws_ov.views.sheetView[0].topLeftCell = 'A1'

    ov_widths = {
        'A': 28,  # مدات / فلیٹ
        'B': 18,  # جولائی (JULY)
        'C': 18,  # اگست (AUGUST)
        'D': 18,  # ستمبر (SEPTEMBER)
        'E': 20,  # مجموعہ / اوسط (TOTAL / STATUS)
        'F': 14,
        'G': 14
    }
    for col, w in ov_widths.items():
        ws_ov.column_dimensions[col].width = w

    # Heights for Overview
    ws_ov.row_dimensions[1].height = 10
    ws_ov.row_dimensions[2].height = 24
    ws_ov.row_dimensions[3].height = 20
    ws_ov.row_dimensions[4].height = 10
    ws_ov.row_dimensions[5].height = 26
    for r in range(6, 15):
        ws_ov.row_dimensions[r].height = 22
    ws_ov.row_dimensions[15].height = 12
    ws_ov.row_dimensions[16].height = 26
    for r in range(17, 38):
        ws_ov.row_dimensions[r].height = 20

    # Title Banner (A2:E3)
    ws_ov.merge_cells('A2:E3')
    ws_ov['A2'].value = 'AL MUSTAFA HEIGHTS 5-E-18/19 — سہ ماہی مالیاتی جائزہ (QUARTERLY OVERVIEW)'
    for r in range(2, 4):
        for c in range(1, 6):
            cell = ws_ov.cell(r, c)
            cell.fill = PatternFill(start_color=blue_header_bg, end_color=blue_header_bg, fill_type='solid')
            top = medium_navy if r == 2 else None
            bot = medium_navy if r == 3 else None
            left = medium_navy if c == 1 else None
            right = medium_navy if c == 5 else None
            cell.border = Border(top=top, bottom=bot, left=left, right=right)
    ws_ov['A2'].font = Font(name='Segoe UI', size=15, bold=True, color='FFFFFF')
    ws_ov['A2'].alignment = Alignment(horizontal='center', vertical='center')

    # Financial Summary Table (Row 5 to 13)
    ov_headers = [(1, 'مالیاتی خلاصہ (Financial Metrics)'), (2, 'جولائی (JULY)'), (3, 'اگست (AUGUST)'), (4, 'ستمبر (SEPTEMBER)'), (5, 'سہ ماہی مجموعہ (Total)')]
    for c, h in ov_headers:
        cell = ws_ov.cell(5, c)
        cell.value = h
        cell.fill = PatternFill(start_color=navy_slate, end_color=navy_slate, fill_type='solid')
        cell.font = Font(name='Segoe UI', size=11, bold=True, color='FFFFFF')
        cell.alignment = Alignment(horizontal='center', vertical='center')
        cell.border = Border(top=medium_navy, bottom=medium_navy, left=thin_grid, right=thin_grid)

    ov_metrics = [
        ('💰 کُل وصول شدہ مینٹیننس', '=JULY!D28', '=AUGUST!D28', '=SEPTEMBER!D28', '=SUM(B6:D6)', '#,##0', True, 'E2EFDA', '145A32'),
        ('📉 کُل بلڈنگ اخراجات', '=JULY!B23', '=AUGUST!B23', '=SEPTEMBER!B23', '=SUM(B7:D7)', '#,##0', True, 'FFF2CC', 'B25900'),
        ('💵 ماہانہ نیٹ بچت / (خسارہ)', '=B6-B7', '=C6-C7', '=D6-D7', '=SUM(B8:D8)', '#,##0', True, 'FFFFFF', '000000'),
        ('⚠️ کُل بقایا جات (Arrears)', '=JULY!E28', '=AUGUST!E28', '=SEPTEMBER!E28', '=D9', '#,##0', True, 'FCE4D6', 'C00000'),
        ('🏦 ابتدائی کیش بیلنس (Opening)', '=JULY!B25', '=AUGUST!B25', '=SEPTEMBER!B25', '-', '#,##0', False, 'FFFFFF', '1F4E79'),
        ('🏦 حتمی کیش بیلنس (Closing)', '=JULY!B26', '=AUGUST!B26', '=SEPTEMBER!B26', '=D11', '#,##0', True, 'D9E1F2', '1B4F72'),
        ('📊 وصولی کی شرح (Collection Rate)', '95%', '89%', '89%', '91%', '0%', False, 'F9FAFB', '333333')
    ]

    for idx, (label, j_val, a_val, s_val, tot_val, num_fmt, is_bold, bg_hex, text_color) in enumerate(ov_metrics):
        r = 6 + idx
        ws_ov.cell(r, 1).value = label
        ws_ov.cell(r, 2).value = j_val
        ws_ov.cell(r, 3).value = a_val
        ws_ov.cell(r, 4).value = s_val
        ws_ov.cell(r, 5).value = tot_val

        for c in range(1, 6):
            cell = ws_ov.cell(r, c)
            cell.fill = PatternFill(start_color=bg_hex, end_color=bg_hex, fill_type='solid')
            cell.font = Font(name='Segoe UI', size=11, bold=is_bold, color=text_color)
            cell.border = Border(top=thin_grid, bottom=thin_grid, left=thin_grid, right=thin_grid)
            if c == 1:
                cell.alignment = Alignment(horizontal='right', vertical='center')
            else:
                cell.alignment = Alignment(horizontal='center', vertical='center')
                if num_fmt != '-':
                    cell.number_format = num_fmt
        if idx == 5: # Closing cash double bottom
            for c in range(1, 6):
                ws_ov.cell(r, c).border = Border(top=thin_grid, bottom=double_bottom, left=thin_grid, right=thin_grid)

    # Flats 3-Month Status Matrix (Row 16 to 37)
    ws_ov.merge_cells('A15:E15')
    ws_ov['A15'].value = '🏢 تمام 20 فلیٹس کی سہ ماہی وصولی رپورٹ (3 Months Flat-by-Flat Payment Status)'
    ws_ov['A15'].fill = PatternFill(start_color=blue_header_bg, end_color=blue_header_bg, fill_type='solid')
    ws_ov['A15'].font = Font(name='Segoe UI', size=11, bold=True, color='FFFFFF')
    ws_ov['A15'].alignment = Alignment(horizontal='center', vertical='center')
    for c in range(1, 6):
        ws_ov.cell(15, c).border = Border(top=medium_navy, bottom=medium_navy, left=(medium_navy if c==1 else None), right=(medium_navy if c==5 else None))

    matrix_headers = [(1, 'فلیٹ و نام'), (2, 'جولائی'), (3, 'اگست'), (4, 'ستمبر'), (5, 'موجودہ صورتحال')]
    for c, h in matrix_headers:
        cell = ws_ov.cell(16, c)
        cell.value = h
        cell.fill = PatternFill(start_color=navy_slate, end_color=navy_slate, fill_type='solid')
        cell.font = Font(name='Segoe UI', size=10.5, bold=True, color='FFFFFF')
        cell.alignment = Alignment(horizontal='center', vertical='center')
        cell.border = Border(top=medium_navy, bottom=medium_navy, left=thin_grid, right=thin_grid)

    # Generate 20 flats matrix
    for i in range(20):
        r = 17 + i
        f_sno = i + 1
        flat_name = months_data['SEPTEMBER']['flats'][i][2]
        flat_no = months_data['SEPTEMBER']['flats'][i][1]
        label_flat = f"{flat_no if flat_no else ''} — {flat_name}" if flat_no else flat_name
        
        ws_ov.cell(r, 1).value = label_flat
        ws_ov.cell(r, 2).value = f"=JULY!D{8+i}"
        ws_ov.cell(r, 3).value = f"=AUGUST!D{8+i}"
        ws_ov.cell(r, 4).value = f"=SEPTEMBER!D{8+i}"
        
        # Status description
        if flat_no == 'F-3':
            status_text = '⚠️ 3,000 بقایا واجب الادا'
            status_color = 'C00000'
        elif flat_no == 'S-3':
            status_text = '⚠️ 500 بقایا واجب الادا'
            status_color = 'C00000'
        elif flat_no == 'P-4':
            status_text = '⚠️ 3,000 بقایا واجب الادا'
            status_color = 'C00000'
        elif flat_no == 'P-3':
            status_text = '🔒 گھر بند ہے'
            status_color = 'B25900'
        else:
            status_text = '✅ کلیئر (تمام ادا شدہ)'
            status_color = '1E8449'
            
        ws_ov.cell(r, 5).value = status_text

        is_even = (r % 2 == 0)
        base_fill = zebra_even if is_even else zebra_odd
        for c in range(1, 6):
            cell = ws_ov.cell(r, c)
            cell.fill = PatternFill(start_color=base_fill, end_color=base_fill, fill_type='solid')
            cell.border = Border(top=thin_grid, bottom=thin_grid, left=thin_grid, right=thin_grid)
            if c == 1:
                cell.font = Font(name='Segoe UI', size=10.5, bold=True, color='1F385C')
                cell.alignment = Alignment(horizontal='right', vertical='center')
            elif c in [2, 3, 4]:
                cell.font = Font(name='Segoe UI', size=10.5, bold=True, color='000000')
                cell.alignment = Alignment(horizontal='center', vertical='center')
                cell.number_format = '#,##0'
            elif c == 5:
                cell.font = Font(name='Segoe UI', size=10.5, bold=True, color=status_color)
                cell.alignment = Alignment(horizontal='center', vertical='center')

    # Total Row for Matrix (Row 37)
    ws_ov.cell(37, 1).value = 'مجموعی وصولی'
    ws_ov.cell(37, 2).value = '=SUM(B17:B36)'
    ws_ov.cell(37, 3).value = '=SUM(C17:C36)'
    ws_ov.cell(37, 4).value = '=SUM(D17:D36)'
    ws_ov.cell(37, 5).value = '=SUM(B37:D37)'
    for c in range(1, 6):
        cell = ws_ov.cell(37, c)
        cell.fill = PatternFill(start_color=summary_bg, end_color=summary_bg, fill_type='solid')
        cell.font = Font(name='Segoe UI', size=11, bold=True, color=navy_dark)
        cell.alignment = Alignment(horizontal='center', vertical='center')
        cell.border = Border(top=thin_black, bottom=double_bottom, left=thin_grid, right=thin_grid)
        if c > 1:
            cell.number_format = '#,##0'

    # Print setup for Overview
    ws_ov.print_area = 'A2:E37'
    ws_ov.page_setup.orientation = ws_ov.ORIENTATION_LANDSCAPE
    ws_ov.page_setup.paperSize = ws_ov.PAPERSIZE_A4
    ws_ov.page_setup.fitToWidth = 1
    ws_ov.page_setup.fitToHeight = 1
    ws_ov.sheet_properties.pageSetUpPr.fitToPage = True

    # Remove temporary default sheet if present
    if default_sheet in wb.worksheets:
        wb.remove(default_sheet)

    # Save
    master_file = 'MAINTANENCE SHEET SEPTEMBER 2026.xlsx'
    wb.save(master_file)
    print("Master Generalized Workbook built successfully!")

if __name__ == '__main__':
    build_generalized_maintenance_system()

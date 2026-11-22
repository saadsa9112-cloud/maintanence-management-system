import openpyxl
import datetime
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import CellIsRule
from openpyxl.utils import get_column_letter

def format_maintenance_workbook():
    wb = openpyxl.load_workbook('MAINTANENCE SHEET SEPTEMBER 2026.xlsx')
    
    # Define styles
    navy_dark = '1F4E79'
    navy_slate = '203764'
    blue_header_bg = '1B365D'
    badge_label_bg = 'D9E1F2'
    badge_val_bg = 'F2F4F8'
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
    
    # -------------------------------------------------------------
    # 1. Format Sheet1 (Columns L to S)
    # -------------------------------------------------------------
    ws1 = wb['Sheet1']
    ws1.views.sheetView[0].showGridLines = True
    ws1.views.sheetView[0].topLeftCell = 'L1'
    
    # Set column widths for L to S
    col_widths_1 = {
        'L': 18,    # تفصیلات
        'M': 16,    # اخراجات کی رقم
        'N': 20,    # اخراجات کی تفصیل
        'O': 15,    # مینٹیننس
        'P': 14,    # بقایا رقم
        'Q': 18,    # نام
        'R': 14.5,  # فلیٹ نمبر (enough for date in R6)
        'S': 12     # سیریل نمبر
    }
    for col, w in col_widths_1.items():
        ws1.column_dimensions[col].width = w
    
    # Title formatting (L4:S5)
    ws1.row_dimensions[4].height = 22
    ws1.row_dimensions[5].height = 22
    for r in range(4, 6):
        for c in range(12, 20):
            cell = ws1.cell(r, c)
            cell.fill = PatternFill(start_color=blue_header_bg, end_color=blue_header_bg, fill_type='solid')
            # Outer border for title
            top = medium_navy if r == 4 else None
            bot = medium_navy if r == 5 else None
            left = medium_navy if c == 12 else None
            right = medium_navy if c == 19 else None
            cell.border = Border(top=top, bottom=bot, left=left, right=right)
    
    title_cell_1 = ws1['L4']
    title_cell_1.font = Font(name='Segoe UI', size=16, bold=True, color='FFFFFF')
    title_cell_1.alignment = Alignment(horizontal='center', vertical='center')
    
    # Row 6: Metadata (Dates & Month)
    ws1.row_dimensions[6].height = 26
    
    # Badges definition: (label_col, val_col, label_text)
    # L6: 2026, M6: سال
    # O6: SEPTEMBER, P6: مہینہ
    # R6: Date, S6: تاریخ
    badges_1 = [
        (13, 12), # M6 (سال), L6 (2026)
        (16, 15), # P6 (مہینہ), O6 (SEPTEMBER)
        (19, 18)  # S6 (تاریخ), R6 (03-Oct-2026)
    ]
    for lbl_c, val_c in badges_1:
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
    
    # Row 7: Header row
    ws1.row_dimensions[7].height = 28
    for c in range(12, 20):
        cell = ws1.cell(7, c)
        cell.fill = PatternFill(start_color=navy_slate, end_color=navy_slate, fill_type='solid')
        cell.font = Font(name='Segoe UI', size=11, bold=True, color='FFFFFF')
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        
        left = medium_navy if c == 12 else (medium_navy if c == 15 else thin_grid)
        right = medium_navy if c == 19 else (medium_navy if c == 14 else thin_grid)
        cell.border = Border(top=medium_navy, bottom=medium_navy, left=left, right=right)
    
    # Rows 8 to 27: Data rows
    for r in range(8, 28):
        ws1.row_dimensions[r].height = 22
        is_even = (r % 2 == 0)
        base_fill = zebra_even if is_even else zebra_odd
        
        for c in range(12, 20):
            cell = ws1.cell(r, c)
            col_letter = get_column_letter(c)
            
            # Default cell fill
            cell_fill = base_fill
            cell_font = Font(name='Segoe UI', size=11, bold=False, color='000000')
            cell_align = Alignment(vertical='center')
            
            # Alignments & Styles per column
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
            
            # Special highlighting on expenses rows:
            if r == 17 and c in [13, 14]: # کل اخراجات
                cell_fill = exp_subtotal_bg
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='922B21')
            elif r == 19 and c in [13, 14]: # پچھلی بچت
                cell_fill = exp_prev_bg
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='1B4F72')
            elif r == 20 and c in [13, 14]: # کل بچت
                cell_fill = exp_savings_bg
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='145A32')
            
            cell.fill = PatternFill(start_color=cell_fill, end_color=cell_fill, fill_type='solid')
            cell.font = cell_font
            cell.alignment = cell_align
            
            # Borders for data cells
            top_s = thin_grid
            bot_s = thin_grid
            left_s = medium_navy if c == 12 else (medium_navy if c == 15 else thin_grid)
            right_s = medium_navy if c == 19 else (medium_navy if c == 14 else thin_grid)
            
            # Special bottom border for row 20 (کل بچت)
            if r == 20 and c in [13, 14]:
                bot_s = double_bottom
            
            cell.border = Border(top=top_s, bottom=bot_s, left=left_s, right=right_s)

    # Row 28: Total Row
    ws1.row_dimensions[28].height = 26
    
    # Merge Q28:S28 for "کُل رقم"
    if 'Q28:S28' not in [str(m) for m in ws1.merged_cells.ranges]:
        ws1.merge_cells('Q28:S28')
    
    ws1['N11'].value = 'الیکٹریشن (اسامہ)'
    ws1['Q28'].value = 'کُل میزان'
    ws1['P28'].value = '=SUM(P8:P27)' # Calculate total pending arrears!
    
    for c in range(12, 20):
        cell = ws1.cell(28, c)
        cell.fill = PatternFill(start_color=summary_bg, end_color=summary_bg, fill_type='solid')
        
        left_s = medium_navy if c == 12 else (medium_navy if c == 15 else thin_grid)
        right_s = medium_navy if c == 19 else (medium_navy if c == 14 else thin_grid)
        cell.border = Border(top=thin_black, bottom=double_bottom, left=left_s, right=right_s)
        
        if c in [17, 18, 19]: # Q28:S28
            cell.font = Font(name='Segoe UI', size=12, bold=True, color=navy_dark)
            cell.alignment = Alignment(horizontal='center', vertical='center')
        elif c == 16: # P28: Total Arrears
            cell.number_format = '#,##0'
            cell.font = Font(name='Segoe UI', size=11, bold=True, color='C00000')
            cell.alignment = Alignment(horizontal='right', vertical='center')
        elif c == 15: # O28: Total Maintenance
            cell.number_format = '#,##0'
            cell.font = Font(name='Segoe UI', size=12, bold=True, color=navy_dark)
            cell.alignment = Alignment(horizontal='right', vertical='center')
    
    # Conditional Formatting for Sheet1
    # 1. Arrears > 0 in P8:P27 (Soft red)
    red_fill = PatternFill(start_color='FCE4D6', end_color='FCE4D6', fill_type='solid')
    red_font = Font(name='Segoe UI', size=11, bold=True, color='C00000')
    rule_arrears = CellIsRule(operator='greaterThan', formula=['0'], stopIfTrue=True, fill=red_fill, font=red_font)
    ws1.conditional_formatting.add('P8:P27', rule_arrears)
    
    # 2. Closed flat in O8:O27 ("گھر بند ہے" soft amber)
    amber_fill = PatternFill(start_color='FFF2CC', end_color='FFF2CC', fill_type='solid')
    amber_font = Font(name='Segoe UI', size=11, bold=True, color='B25900')
    rule_closed = CellIsRule(operator='equal', formula=['"گھر بند ہے"'], stopIfTrue=True, fill=amber_fill, font=amber_font)
    ws1.conditional_formatting.add('O8:O27', rule_closed)
    
    # 3. Paid maintenance > 0 in O8:O27 (Soft mint green)
    green_fill = PatternFill(start_color='E2EFDA', end_color='E2EFDA', fill_type='solid')
    green_font = Font(name='Segoe UI', size=11, bold=True, color='276A3C')
    rule_paid = CellIsRule(operator='greaterThan', formula=['0'], stopIfTrue=True, fill=green_fill, font=green_font)
    ws1.conditional_formatting.add('O8:O27', rule_paid)
    
    # Page Setup for Sheet1
    ws1.print_area = 'L4:S28'
    ws1.page_setup.orientation = ws1.ORIENTATION_LANDSCAPE
    ws1.page_setup.fitToWidth = 1
    ws1.page_setup.fitToHeight = 1
    ws1.sheet_properties.pageSetUpPr.fitToPage = True
    
    # -------------------------------------------------------------
    # 2. Create Sheet2: Clean Layout starting at Column A (Columns A to H)
    # -------------------------------------------------------------
    sheet2_name = 'مینٹیننس شیٹ (A تا H)'
    if sheet2_name in wb.sheetnames:
        del wb[sheet2_name]
    ws2 = wb.create_sheet(title=sheet2_name)
    ws2.views.sheetView[0].showGridLines = True
    ws2.views.sheetView[0].topLeftCell = 'A1'
    
    # Column mapping: L->A, M->B, N->C, O->D, P->E, Q->F, R->G, S->H
    # Set widths for A to H
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
    
    # Copy values from Sheet1 to Sheet2 with formula adaptation
    for r in range(4, 29):
        ws2.row_dimensions[r].height = ws1.row_dimensions[r].height
        for c in range(12, 20):
            target_c = c - 11  # 12->1 (A), 19->8 (H)
            val = ws1.cell(r, c).value
            
            # Formula adaptation:
            if isinstance(val, str) and val.startswith('='):
                formula_val = val
                formula_val = formula_val.replace('M8:M14', 'B8:B14')
                formula_val = formula_val.replace('O28', 'D28')
                formula_val = formula_val.replace('M19', 'B19')
                formula_val = formula_val.replace('M17', 'B17')
                formula_val = formula_val.replace('O8:O27', 'D8:D27')
                formula_val = formula_val.replace('P8:P27', 'E8:E27')
                val = formula_val
            
            ws2.cell(r, target_c).value = val
    
    # Merges for Sheet2
    ws2.merge_cells('A4:H5')
    ws2['A4'].value = 'AL MUSTAFA HEIGHTS 5-E-18/19'
    ws2.merge_cells('F28:H28')
    ws2['C11'].value = 'الیکٹریشن (اسامہ)'
    ws2['F28'].value = 'کُل میزان'
    ws2['E28'].value = '=SUM(E8:E27)'
    
    # Apply Title Formatting on Sheet2
    for r in range(4, 6):
        for c in range(1, 9):
            cell = ws2.cell(r, c)
            cell.fill = PatternFill(start_color=blue_header_bg, end_color=blue_header_bg, fill_type='solid')
            top = medium_navy if r == 4 else None
            bot = medium_navy if r == 5 else None
            left = medium_navy if c == 1 else None
            right = medium_navy if c == 8 else None
            cell.border = Border(top=top, bottom=bot, left=left, right=right)
    title_cell_2 = ws2['A4']
    title_cell_2.font = Font(name='Segoe UI', size=16, bold=True, color='FFFFFF')
    title_cell_2.alignment = Alignment(horizontal='center', vertical='center')
    
    # Row 6 badges on Sheet2:
    # A6: 2026, B6: سال
    # D6: SEPTEMBER, E6: مہینہ
    # G6: Date, H6: تاریخ
    badges_2 = [
        (2, 1), # B6 (سال), A6 (2026)
        (5, 4), # E6 (مہینہ), D6 (SEPTEMBER)
        (8, 7)  # H6 (تاریخ), G6 (03-Oct-2026)
    ]
    for lbl_c, val_c in badges_2:
        c_lbl = ws2.cell(6, lbl_c)
        c_val = ws2.cell(6, val_c)
        
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
    
    # Row 7 Header for Sheet2
    for c in range(1, 9):
        cell = ws2.cell(7, c)
        cell.fill = PatternFill(start_color=navy_slate, end_color=navy_slate, fill_type='solid')
        cell.font = Font(name='Segoe UI', size=11, bold=True, color='FFFFFF')
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        left = medium_navy if c == 1 else (medium_navy if c == 4 else thin_grid)
        right = medium_navy if c == 8 else (medium_navy if c == 3 else thin_grid)
        cell.border = Border(top=medium_navy, bottom=medium_navy, left=left, right=right)

    # Rows 8-27 Data for Sheet2
    for r in range(8, 28):
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
            
            if r == 17 and c in [2, 3]: # کل اخراجات
                cell_fill = exp_subtotal_bg
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='922B21')
            elif r == 19 and c in [2, 3]: # پچھلی بچت
                cell_fill = exp_prev_bg
                cell_font = Font(name='Segoe UI', size=11, bold=True, color='1B4F72')
            elif r == 20 and c in [2, 3]: # کل بچت
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

    # Row 28 on Sheet2
    for c in range(1, 9):
        cell = ws2.cell(28, c)
        cell.fill = PatternFill(start_color=summary_bg, end_color=summary_bg, fill_type='solid')
        left_s = medium_navy if c == 1 else (medium_navy if c == 4 else thin_grid)
        right_s = medium_navy if c == 8 else (medium_navy if c == 3 else thin_grid)
        cell.border = Border(top=thin_black, bottom=double_bottom, left=left_s, right=right_s)
        
        if c in [6, 7, 8]:
            cell.font = Font(name='Segoe UI', size=12, bold=True, color=navy_dark)
            cell.alignment = Alignment(horizontal='center', vertical='center')
        elif c == 5: # E28: Total Arrears
            cell.number_format = '#,##0'
            cell.font = Font(name='Segoe UI', size=11, bold=True, color='C00000')
            cell.alignment = Alignment(horizontal='right', vertical='center')
        elif c == 4: # D28: Total Maintenance
            cell.number_format = '#,##0'
            cell.font = Font(name='Segoe UI', size=12, bold=True, color=navy_dark)
            cell.alignment = Alignment(horizontal='right', vertical='center')

    # Conditional formatting on Sheet2
    ws2.conditional_formatting.add('E8:E27', rule_arrears)
    ws2.conditional_formatting.add('D8:D27', rule_closed)
    ws2.conditional_formatting.add('D8:D27', rule_paid)
    
    # Page Setup for Sheet2
    ws2.print_area = 'A4:H28'
    ws2.page_setup.orientation = ws2.ORIENTATION_LANDSCAPE
    ws2.page_setup.fitToWidth = 1
    ws2.page_setup.fitToHeight = 1
    ws2.sheet_properties.pageSetUpPr.fitToPage = True

    # Save
    wb.save('MAINTANENCE SHEET SEPTEMBER 2026.xlsx')
    print("Formatting complete! Both Sheet1 and Sheet2 updated successfully.")

if __name__ == '__main__':
    format_maintenance_workbook()

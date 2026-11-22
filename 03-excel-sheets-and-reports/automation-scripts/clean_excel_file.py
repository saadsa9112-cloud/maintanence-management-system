import openpyxl

def clean_excel(fname):
    print(f"Cleaning: {fname}")
    wb = openpyxl.load_workbook(fname)
    
    # 1. Clean up OCTOBER sheet
    if 'OCTOBER' in wb.sheetnames:
        ws_sep = wb['SEPTEMBER']
        # Remove current October
        del wb['OCTOBER']
        
        # Create fresh clean copy from SEPTEMBER
        ws_oct = wb.copy_worksheet(ws_sep)
        ws_oct.title = 'OCTOBER'
        
        # Ensure LTR orientation
        if hasattr(ws_oct, 'views') and ws_oct.views and ws_oct.views.sheetView:
            for v in ws_oct.views.sheetView:
                v.rightToLeft = False
                
        # Set Header
        ws_oct['D6'] = 'OCTOBER'
        ws_oct['G6'] = '3-Nov-2026'
        
        # Clear September expense notes & amounts (Rows 8 to 17)
        for r in range(8, 18):
            ws_oct[f'A{r}'] = None
            ws_oct[f'B{r}'] = None
            ws_oct[f'C{r}'] = None
            
        # Standard default expenses
        ws_oct['C8'] = 'بجلی کا بل'
        ws_oct['B8'] = None
        ws_oct['C9'] = 'موٹر آپریٹر '
        ws_oct['B9'] = 1500
        ws_oct['C10'] = 'جمعدار'
        ws_oct['B10'] = 4500
        
        ws_oct['C18'] = 'کل اخراجات'
        ws_oct['B18'] = '=SUM(B8:B17)'
        
        ws_oct['C25'] = 'پچھلی بچت'
        ws_oct['B25'] = '=SEPTEMBER!B26'
        
        ws_oct['C26'] = 'کل بچت'
        ws_oct['B26'] = '=D28+B25-B18'
        
        # Clear paid/arrears for October (ready for entry)
        for r in range(8, 28):
            f_num = ws_oct[f'G{r}'].value
            if f_num == 'P-3':
                ws_oct[f'D{r}'] = 'گھر بند ہے'
                ws_oct[f'E{r}'] = None
            else:
                ws_oct[f'D{r}'] = None
                ws_oct[f'E{r}'] = None
                
        # Totals in row 28
        ws_oct['D28'] = '=SUM(D8:D27)'
        ws_oct['E28'] = '=SUM(E8:E27)'
        ws_oct['F28'] = 'کُل میزان'
        
        # Ensure no rows exist after row 28
        if ws_oct.max_row > 28:
            ws_oct.delete_rows(29, ws_oct.max_row - 28)
            
        # Ensure no columns exist after H
        if ws_oct.max_column > 8:
            ws_oct.delete_cols(9, ws_oct.max_column - 8)
            
    # 2. Clean Overview tab to original 5 columns (A to E)
    if 'ماہانہ جائزہ (Overview)' in wb.sheetnames:
        ws_ov = wb['ماہانہ جائزہ (Overview)']
        # Restore Col E to 'سہ ماہی مجموعہ (Total)'
        ws_ov['E5'] = 'سہ ماہی مجموعہ (Total)'
        ws_ov['E6'] = '=SUM(B6:D6)'
        ws_ov['E7'] = '=SUM(B7:D7)'
        ws_ov['E8'] = '=SUM(B8:D8)'
        ws_ov['E9'] = '=D9'
        ws_ov['E10'] = '-'
        ws_ov['E11'] = '=D11'
        ws_ov['E12'] = '=TEXT(E6/(E6+E9), "0%")'
        
        # Clear Col F
        for r in range(1, 40):
            ws_ov.cell(r, 6).value = None
            
        # Re-set flat summary in Col E
        ws_ov['E16'] = 'مجموعی صورتحال'
        for idx in range(20):
            r_flat = 17 + idx
            r_flat_source = 8 + idx
            # If P-3 (Ali)
            if idx == 17:
                ws_ov[f'E{r_flat}'] = '🔒 گھر بند'
            else:
                ws_ov[f'E{r_flat}'] = f'=IF(SEPTEMBER!E{r_flat_source}>0, "⚠️ " & TEXT(SEPTEMBER!E{r_flat_source}, "#,##0") & " بقایا", "✅ باقاعدہ")'
                
        ws_ov['E37'] = '=SUM(B37:D37)'
        
        # Ensure max columns in overview is 5
        if ws_ov.max_column > 5:
            ws_ov.delete_cols(6, ws_ov.max_column - 5)
            
    # Ensure LTR for all sheets
    for ws in wb.worksheets:
        if hasattr(ws, 'views') and ws.views and ws.views.sheetView:
            for v in ws.views.sheetView:
                v.rightToLeft = False
                
    wb.save(fname)
    print(f"Successfully cleaned: {fname}")

if __name__ == '__main__':
    for f in ['MAINTANENCE SHEET 2026.xlsx', 'MAINTANENCE SHEET SEPTEMBER 2026.xlsx']:
        clean_excel(f)

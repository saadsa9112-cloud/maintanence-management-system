import openpyxl

def set_portrait_page_setup(wb_path):
    print(f"Setting portrait print setup for: {wb_path}")
    wb = openpyxl.load_workbook(wb_path)
    
    for idx, name in enumerate(wb.sheetnames):
        ws = wb[name]
        
        # 1. Orientation to Portrait
        ws.page_setup.orientation = ws.ORIENTATION_PORTRAIT
        ws.page_setup.paperSize = ws.PAPERSIZE_A4
        
        # 2. Fit to 1 page wide, 1 page tall
        ws.page_setup.fitToWidth = 1
        ws.page_setup.fitToHeight = 1
        ws.sheet_properties.pageSetUpPr.fitToPage = True
        
        if name == 'ماہانہ جائزہ (Overview)':
            ws.print_area = 'A2:E37'
        else:
            # Monthly sheets: rows 4 to 28, cols A to H
            ws.print_area = 'A4:H28'
        
        # 3. Horizontal centering
        ws.print_options.horizontalCentered = True
        ws.print_options.verticalCentered = False
        
        # 4. Clean, narrow margins (in inches) so portrait fits with readable text
        ws.page_margins.left = 0.25
        ws.page_margins.right = 0.25
        ws.page_margins.top = 0.4
        ws.page_margins.bottom = 0.4
        ws.page_margins.header = 0.2
        ws.page_margins.footer = 0.2
        
    wb.save(wb_path)
    print(f"Saved portrait setup for {wb_path} successfully!")

if __name__ == '__main__':
    for f in ['MAINTANENCE SHEET 2026.xlsx', 'MAINTANENCE SHEET SEPTEMBER 2026.xlsx']:
        set_portrait_page_setup(f)

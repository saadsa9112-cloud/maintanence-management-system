$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open("I:\building maintanence\MAINTANENCE SHEET SEPTEMBER 2026.xlsx")
    
    # Sheet 1: خلاصہ نیچے
    $ws1 = $wb.Sheets.Item(1)
    $pdfPath1 = "I:\building maintanence\MAINTANENCE SHEET (Summary Below).pdf"
    $ws1.ExportAsFixedFormat(0, $pdfPath1)
    
    # Sheet 2: خلاصہ سائیڈ پر
    $ws2 = $wb.Sheets.Item(2)
    $pdfPath2 = "I:\building maintanence\MAINTANENCE SHEET (Summary Side).pdf"
    $ws2.ExportAsFixedFormat(0, $pdfPath2)
    
    # Sheet 3: Sheet1 (L to S)
    $ws3 = $wb.Sheets.Item(3)
    $pdfPath3 = "I:\building maintanence\MAINTANENCE SHEET SEPTEMBER 2026.pdf"
    $ws3.ExportAsFixedFormat(0, $pdfPath3)
    
    $wb.Save()
    $wb.Close()
    Write-Output "All 3 PDFs exported successfully!"
}
finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}

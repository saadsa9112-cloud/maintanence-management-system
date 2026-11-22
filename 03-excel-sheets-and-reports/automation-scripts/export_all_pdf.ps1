$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open("I:\building maintanence\MAINTANENCE SHEET SEPTEMBER 2026.xlsx")
    
    # Export full workbook
    $pdfAll = "I:\building maintanence\AL MUSTAFA HEIGHTS - COMPLETE REPORT 2026.pdf"
    $wb.ExportAsFixedFormat(0, $pdfAll)
    
    # Export individual sheets by index 1..4
    $names = @("Overview", "JULY", "AUGUST", "SEPTEMBER")
    for ($i = 1; $i -le 4; $i++) {
        $ws = $wb.Sheets.Item($i)
        $cleanName = $names[$i-1]
        $singlePdf = "I:\building maintanence\MAINTENANCE_$cleanName.pdf"
        $ws.ExportAsFixedFormat(0, $singlePdf)
    }
    
    $wb.Save()
    $wb.Close()
    Write-Output "All 5 PDFs exported successfully!"
}
finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}

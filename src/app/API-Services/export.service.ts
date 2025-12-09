import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  /**
   * Export data to Excel file
   * @param data Array of objects to export
   * @param fileName Name of the file (without extension)
   * @param sheetName Name of the worksheet
   */
  exportToExcel(data: any[], fileName: string = 'export', sheetName: string = 'Sheet1'): void {
    try {
      // Create a new workbook
      const workbook: XLSX.WorkBook = XLSX.utils.book_new();
      
      // Convert data to worksheet
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Generate Excel file buffer
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      // Save the file
      this.saveExcelFile(excelBuffer, fileName);
      
      console.log(`Excel file ${fileName}.xlsx exported successfully`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Failed to export data to Excel');
    }
  }

  /**
   * Export data to CSV file
   * @param data Array of objects to export
   * @param fileName Name of the file (without extension)
   */
  exportToCSV(data: any[], fileName: string = 'export'): void {
    try {
      // Convert data to worksheet
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
      
      // Convert worksheet to CSV
      const csvOutput: string = XLSX.utils.sheet_to_csv(worksheet);
      
      // Create blob and save
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${fileName}.csv`);
      
      console.log(`CSV file ${fileName}.csv exported successfully`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Failed to export data to CSV');
    }
  }

  /**
   * Save Excel file using file-saver
   * @param buffer Excel file buffer
   * @param fileName Name of the file (without extension)
   */
  private saveExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    saveAs(data, `${fileName}.xlsx`);
  }

  /**
   * Export data with custom formatting
   * @param data Array of objects to export
   * @param fileName Name of the file
   * @param options Export options
   */
  exportWithFormatting(
    data: any[], 
    fileName: string, 
    options: {
      sheetName?: string;
      headers?: string[];
      title?: string;
      dateFormat?: string;
    } = {}
  ): void {
    try {
      const workbook: XLSX.WorkBook = XLSX.utils.book_new();
      
      // Create worksheet with custom headers if provided
      let worksheet: XLSX.WorkSheet;
      
      if (options.headers && options.headers.length > 0) {
        // Create worksheet with custom headers
        worksheet = XLSX.utils.aoa_to_sheet([options.headers]);
        XLSX.utils.sheet_add_json(worksheet, data, { origin: 'A2', skipHeader: true });
      } else {
        worksheet = XLSX.utils.json_to_sheet(data);
      }
      
      // Add title if provided
      if (options.title) {
        XLSX.utils.sheet_add_aoa(worksheet, [[options.title]], { origin: 'A1' });
        // Shift data down by one row
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        range.e.r += 1;
        worksheet['!ref'] = XLSX.utils.encode_range(range);
      }
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1');
      
      // Generate and save
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveExcelFile(excelBuffer, fileName);
      
      console.log(`Formatted Excel file ${fileName}.xlsx exported successfully`);
    } catch (error) {
      console.error('Error exporting formatted Excel:', error);
      throw new Error('Failed to export formatted data to Excel');
    }
  }

  /**
   * Example usage method - can be called to test the export functionality
   */
  exportSampleData(): void {
    const sampleData = [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager' }
    ];

    // Export to Excel
    this.exportToExcel(sampleData, 'sample-data');
    
    // Export to CSV
    this.exportToCSV(sampleData, 'sample-data');
    
    // Export with formatting
    this.exportWithFormatting(sampleData, 'formatted-sample-data', {
      sheetName: 'Users',
      headers: ['ID', 'Full Name', 'Email Address', 'User Role'],
      title: 'User Export Report - ' + new Date().toLocaleDateString()
    });
  }
}

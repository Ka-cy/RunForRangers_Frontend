// TypeScript interface for export service
export interface ExportOptions {
  sheetName?: string;
  headers?: string[];
  title?: string;
  dateFormat?: string;
  includeTimestamp?: boolean;
}

export interface ExportData {
  [key: string]: any;
}

export interface ExportResult {
  success: boolean;
  fileName?: string;
  error?: string;
}

// Common export formats
export enum ExportFormat {
  EXCEL = 'excel',
  CSV = 'csv',
  PDF = 'pdf'
}

// Export column configuration
export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
  format?: 'text' | 'number' | 'date' | 'currency';
}

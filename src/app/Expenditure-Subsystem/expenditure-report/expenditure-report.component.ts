import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { NotificationModalComponent } from '../../Notification/notification.component';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ExpenditureService } from '../../API-Services/expenditure.service';
import { Iexpenditure } from '../../Interfaces/iexpenditure';

interface ExpenditureReportData {
  byPurpose: { [key: string]: { items: Iexpenditure[], total: number } };
  grandTotal: number;
  totalItems: number;
}

@Component({
  selector: 'app-expenditure-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NavBarAdminComponent, NotificationModalComponent],
  templateUrl: './expenditure-report.component.html',
  styleUrls: ['./expenditure-report.component.css']
})
export class ExpenditureReportComponent implements OnInit, OnDestroy {
  @ViewChild('reportContent', { static: false }) reportContent!: ElementRef;

  // Filter criteria
  startDate: string = '';
  endDate: string = '';
  selectedPurpose: string = '';
  
  // Data
  expenditures: Iexpenditure[] = [];
  filteredExpenditures: Iexpenditure[] = [];
  reportData: ExpenditureReportData | null = null;
  purposes: string[] = [];
  
  // Report metadata
  generatedBy: string = '';
  generatedDate: string = '';
  isLoading: boolean = false;
  reportGenerated: boolean = false;
  private filterTimeout: any;
  private reportGenerationTimeout: any;
  isPdfGenerating: boolean = false;

  constructor(
    private router: Router,
    private expenditureService: ExpenditureService
  ) {
    // Set default date range (last 12 months)
    const today = new Date();
    const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    
    this.endDate = this.formatDate(today);
    this.startDate = this.formatDate(lastYear);
  }

  ngOnInit(): void {
    console.log('ExpenditureReportComponent initialized');
    this.loadExpenditures();
    this.setReportMetadata();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private setReportMetadata(): void {
    // Get logged in user info
    const adminData = sessionStorage.getItem('adminData');
    if (adminData) {
      const admin = JSON.parse(adminData);
      const firstName = admin.firstName || '';
      const lastName = admin.surname || admin.lastName || '';
      this.generatedBy = `${firstName} ${lastName}`.trim() || 'System Administrator';
    } else {
      this.generatedBy = 'System Administrator';
    }
    
    this.generatedDate = new Date().toLocaleString();
  }

  loadExpenditures(): void {
    console.log('Loading expenditures...');
    this.isLoading = true;
    this.expenditureService.GetAllExpenditures().subscribe({
      next: (data) => {
        console.log('Expenditures loaded:', data.length, 'items');
        this.expenditures = data;
        this.extractPurposes();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading expenditures:', err);
        this.isLoading = false;
        alert('Failed to load expenditures.');
      }
    });
  }

  private extractPurposes(): void {
    const purposeSet = new Set<string>();
    this.expenditures.forEach(exp => {
      if (exp.purpose && exp.purpose.trim()) {
        purposeSet.add(exp.purpose.trim());
      }
    });
    this.purposes = Array.from(purposeSet).sort();
  }

  applyFilters(): void {
    console.log('Applying filters...');
    
    // Clear any existing timeout
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    
    // Debounce the filtering to prevent rapid successive calls
    this.filterTimeout = setTimeout(() => {
      this.performFiltering();
    }, 300);
  }

  private performFiltering(): void {
    console.log('Performing filtering...');
    let filtered = this.expenditures;

    // Filter by date range
    if (this.startDate) {
      const start = new Date(this.startDate);
      console.log('Filtering by start date:', start);
      filtered = filtered.filter(exp => {
        const expDate = new Date(exp.dateOfCreation);
        return expDate >= start;
      });
    }
    
    if (this.endDate) {
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      console.log('Filtering by end date:', end);
      filtered = filtered.filter(exp => {
        const expDate = new Date(exp.dateOfCreation);
        return expDate <= end;
      });
    }

    // Filter by purpose
    if (this.selectedPurpose) {
      console.log('Filtering by purpose:', this.selectedPurpose);
      filtered = filtered.filter(exp => exp.purpose === this.selectedPurpose);
    }

    console.log('Filtered expenditures:', filtered.length);
    this.filteredExpenditures = filtered;
    
    // Only generate report data, don't call applyFilters again
    this.generateReportData();
  }

  private generateReportData(): void {
    console.log('Generating report data for', this.filteredExpenditures.length, 'items');
    
    // Safety check
    if (!this.filteredExpenditures || this.filteredExpenditures.length === 0) {
      this.reportData = {
        byPurpose: {},
        grandTotal: 0,
        totalItems: 0
      };
      return;
    }

    const reportData: ExpenditureReportData = {
      byPurpose: {},
      grandTotal: 0,
      totalItems: this.filteredExpenditures.length
    };

    // Process each expenditure with safety checks
    this.filteredExpenditures.forEach((exp, index) => {
      if (!exp) {
        console.warn('Null expenditure at index:', index);
        return;
      }

      const amount = exp.amount || 0;
      reportData.grandTotal += amount;

      // Group by purpose
      const purpose = exp.purpose || 'Uncategorized';
      if (!reportData.byPurpose[purpose]) {
        reportData.byPurpose[purpose] = { items: [], total: 0 };
      }
      reportData.byPurpose[purpose].items.push(exp);
      reportData.byPurpose[purpose].total += amount;

      // Sort items by date
      if (exp.dateOfCreation) {
        reportData.byPurpose[purpose].items.sort((a, b) => {
          const dateA = new Date(a.dateOfCreation || '');
          const dateB = new Date(b.dateOfCreation || '');
          return dateA.getTime() - dateB.getTime();
        });
      }
    });

    this.reportData = reportData;
    console.log('Report data generated successfully');
  }

  generateReport(): void {
    console.log('Generate report requested');
    
    // Clear any existing timeout to prevent multiple rapid calls
    if (this.reportGenerationTimeout) {
      clearTimeout(this.reportGenerationTimeout);
    }
    
    // Debounce the report generation with 500ms delay
    this.reportGenerationTimeout = setTimeout(() => {
      console.log('Executing debounced report generation');
      this.executeReportGeneration();
    }, 500);
  }

  private executeReportGeneration(): void {
    this.isLoading = true;
    this.applyFilters();
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      this.reportGenerated = true;
      this.isLoading = false;
    }, 50);
  }

  async generatePDF(): Promise<void> {
    console.log('Generating PDF...');
    if (!this.reportGenerated) {
      alert('Please generate the report first.');
      return;
    }
    if (this.isPdfGenerating) {
      console.log('PDF generation already in progress');
      return;
    }
    this.isPdfGenerating = true;
    try {
      // PDF setup
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let y = margin;
      const usableWidth = pageWidth - (2 * margin);

      // Add logo (RFRLogoNoBG)
      const logoUrl = 'assets/Images/RFRLogoNoBG.png';
      try {
        pdf.addImage(logoUrl, 'PNG', margin, y, 40, 24);
        y += 28;
      } catch (e) {
        y += 5;
      }

      // Header
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(31, 41, 55); // #1f2937
      pdf.text('Expenditure Report', pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Metadata
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(107, 114, 128); // #6b7280
      pdf.text(`Period: ${new Date(this.startDate).toLocaleDateString()} - ${new Date(this.endDate).toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' });
      y += 7;
      pdf.text(`Purpose Filter: ${this.selectedPurpose || 'All Purposes'}`, pageWidth / 2, y, { align: 'center' });
      y += 7;
      pdf.text(`Generated by: ${this.generatedBy}`, pageWidth / 2, y, { align: 'center' });
      y += 7;
      pdf.text(`Generated on: ${this.generatedDate}`, pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Summary Cards
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(55, 65, 81); // #374151
      pdf.text('Summary', margin, y);
      y += 8;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      const totalItems = this.reportData?.totalItems || 0;
      const grandTotal = this.reportData?.grandTotal || 0;
      const categories = Object.keys(this.reportData?.byPurpose || {}).length;
      const avgPerTrans = totalItems ? (grandTotal / totalItems) : 0;
      pdf.text(`Total Transactions: ${totalItems}`, margin, y);
  pdf.text(`Total Expenditure: R${grandTotal.toFixed(2)}`, margin + 60, y);
  pdf.text(`Categories: ${categories}`, margin + 120, y);
      y += 10;

      // Control breaks and subtotals by purpose
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(31, 41, 55);
      pdf.text('Expenditure Breakdown by Purpose', margin, y);
      y += 8;

      // Table header
      pdf.setFontSize(10);
      pdf.setFillColor(243, 244, 246); // Gray-100
      pdf.rect(margin, y, usableWidth, 8, 'F');
      pdf.setTextColor(55, 65, 81);
      let xPos = margin;
      const columns = [
        { header: 'Purpose', width: usableWidth * 0.35, align: 'left' },
        { header: 'Date', width: usableWidth * 0.25, align: 'left' },
        { header: 'Amount', width: usableWidth * 0.2, align: 'right' },
        { header: 'Subtotal', width: usableWidth * 0.2, align: 'right' }
      ];
      columns.forEach(col => {
  pdf.text(col.header, col.align === 'right' ? xPos + col.width - 2 : xPos + 2, y + 6, { align: col.align as 'left' | 'right' | 'center' | 'justify' | undefined });
        xPos += col.width;
      });
      y += 8;

      // Table rows with control breaks and subtotals
      const { byPurpose } = this.reportData || { byPurpose: {} };
      Object.entries(byPurpose || {}).forEach(([purpose, data], idx) => {
        let subtotal = 0;
        const items = (data as { items: any[] }).items;
        items.forEach((item: any, i: number) => {
          if (y > pageHeight - margin - 20) {
            pdf.addPage();
            y = margin;
          }
          xPos = margin;
          const rowData = [
            purpose,
            new Date(item.dateOfCreation).toLocaleDateString(),
            `R ${item.amount.toFixed(2)}`,
            ''
          ];
          columns.forEach((col, j) => {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.setTextColor(55, 65, 81);
            pdf.text(rowData[j], col.align === 'right' ? xPos + col.width - 2 : xPos + 2, y + 6, { align: col.align as 'left' | 'right' | 'center' | 'justify' | undefined });
            xPos += col.width;
          });
          y += 7;
          subtotal += item.amount;
        });
        // Subtotal row (control break)
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(5, 150, 105); // Green
        pdf.text(`Subtotal for ${purpose}: R${subtotal.toFixed(2)}`, margin + usableWidth - 2, y + 6, { align: 'right' });
        y += 8;
        // Divider after each purpose
        pdf.setDrawColor(229, 231, 235); // Gray-200
        pdf.line(margin, y, margin + usableWidth, y);
        y += 2;
      });

      // Footer
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(156, 163, 175); // #9ca3af
      pdf.text(`Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Save PDF
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `Expenditure_Report_${timestamp}.pdf`;
      pdf.save(filename);
      this.handlePdfSuccess(null, filename, 'PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.handlePdfError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
    this.isPdfGenerating = false;
  }

  private async generatePdfWithTimeout(element: HTMLElement): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use setTimeout to prevent blocking
      setTimeout(async () => {
        try {
          await this.performPdfGeneration(element);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 100);
    });
  }

  private async performPdfGeneration(element: HTMLElement): Promise<void> {
    if (!this.reportData) {
      throw new Error('Report data is not available');
    }

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const usableWidth = pageWidth - (2 * margin);

    // Add logo
    const logoImg = document.querySelector('.report-logo') as HTMLImageElement;
    if (logoImg) {
      const canvas = document.createElement('canvas');
      canvas.width = logoImg.width;
      canvas.height = logoImg.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(logoImg, 0, 0);
        const logoData = canvas.toDataURL('image/jpeg');
        const logoWidth = 40;
        const aspectRatio = logoImg.height / logoImg.width;
        const logoHeight = logoWidth * aspectRatio;
        pdf.addImage(logoData, 'JPEG', margin, margin, logoWidth, logoHeight);
      }
    }
    
    // Add title with styling
    pdf.setFontSize(24);
    pdf.setTextColor(51, 65, 81); // Dark gray
    pdf.text('Run For Rangers', pageWidth / 2, margin + 15, { align: 'center' });
    pdf.setFontSize(18);
    pdf.text('Expenditure Analysis Report', pageWidth / 2, margin + 25, { align: 'center' });
    
    // Add report metadata with styling
    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99); // Gray-600
    let y = margin + 40;
    
    // Add metadata box with light gray background
    pdf.setFillColor(249, 250, 251); // Gray-50
    pdf.setDrawColor(229, 231, 235); // Gray-200
    const metadataBoxHeight = 35;
    pdf.roundedRect(margin, y, usableWidth, metadataBoxHeight, 3, 3, 'FD');
    
    y += 7;
    pdf.text(`Generated by: ${this.generatedBy}`, margin + 5, y);
    y += 7;
    pdf.text(`Generated on: ${this.generatedDate}`, margin + 5, y);
    y += 7;
    pdf.text(`Period: ${new Date(this.startDate).toLocaleDateString()} - ${new Date(this.endDate).toLocaleDateString()}`, margin + 5, y);
    pdf.text(`Purpose Filter: ${this.selectedPurpose || 'All Purposes'}`, margin + usableWidth/2 + 5, y);

    // Add summary with cards
    y += 15;
    pdf.setFontSize(14);
    pdf.setTextColor(31, 41, 55); // Gray-800
    pdf.text('Executive Summary', margin, y);
    y += 10;

    // Create summary cards with grid layout
    const cardWidth = usableWidth / 2 - 5;
    const cardHeight = 30;
    const cards = [
      {
        label: 'Total Transactions',
        value: this.reportData.totalItems.toString()
      },
      {
        label: 'Total Expenditure',
        value: `R ${this.reportData.grandTotal.toFixed(2)}`
      },
      {
        label: 'Categories',
        value: Object.keys(this.reportData.byPurpose).length.toString()
      },
      {
        label: 'Average per Transaction',
        value: `R ${(this.reportData.grandTotal / this.reportData.totalItems).toFixed(2)}`
      }
    ];

    cards.forEach((card, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const cardX = margin + (col * (cardWidth + 10));
      const cardY = y + (row * (cardHeight + 10));

      // Draw card background
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(229, 231, 235);
      pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 3, 3, 'FD');

      // Add card content
      pdf.setFontSize(16);
      pdf.setTextColor(31, 41, 55);
      pdf.text(card.value, cardX + cardWidth/2, cardY + 12, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text(card.label, cardX + cardWidth/2, cardY + 22, { align: 'center' });
    });

    y += 85; // Move past the summary cards

    // Add purpose breakdown section
    pdf.setDrawColor(229, 231, 235);
    pdf.line(margin, y - 5, pageWidth - margin, y - 5);
    pdf.setFontSize(14);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Expenditure Analysis by Purpose', margin, y);
    y += 10;
    
    // Table styles
    const headerBgColor: [number, number, number] = [243, 244, 246]; // Gray-100
    const borderColor: [number, number, number] = [229, 231, 235]; // Gray-200
    const textColor: [number, number, number] = [31, 41, 55]; // Gray-800
    const alternateRowColor: [number, number, number] = [249, 250, 251]; // Gray-50
    
    // Column configuration
    const columns = [
      { header: 'Purpose', width: usableWidth * 0.35, align: 'left' as const },
      { header: 'Total Amount', width: usableWidth * 0.25, align: 'right' as const },
      { header: 'Count', width: usableWidth * 0.2, align: 'right' as const },
      { header: '% of Total', width: usableWidth * 0.2, align: 'right' as const }
    ];
    
    // Draw table header
    pdf.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
    pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    pdf.rect(margin, y, usableWidth, 10, 'FD');
    
    pdf.setFontSize(10);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    let xPos = margin;
    
    columns.forEach(col => {
      pdf.text(col.header, 
        col.align === 'right' ? xPos + col.width - 2 : xPos + 2, 
        y + 7, 
        { align: col.align || 'left' }
      );
      xPos += col.width;
    });
    
    y += 10;

    // Table rows
    const { byPurpose, grandTotal } = this.reportData;
    Object.entries(byPurpose).forEach(([purpose, data], index) => {
      if (y > pageHeight - margin - 20) {
        pdf.addPage();
        y = margin;
      }

      // Alternate row background
      if (index % 2 === 0) {
        pdf.setFillColor(alternateRowColor[0], alternateRowColor[1], alternateRowColor[2]);
        pdf.rect(margin, y, usableWidth, 8, 'F');
      }

      xPos = margin;
      const rowData = [
        purpose,
        `R ${data.total.toFixed(2)}`,
        data.items.length.toString(),
        `${((data.total / grandTotal) * 100).toFixed(1)}%`
      ];

      columns.forEach((col, i) => {
        pdf.text(
          rowData[i],
          col.align === 'right' ? xPos + col.width - 2 : xPos + 2,
          y + 6,
          { align: col.align || 'left' }
        );
        xPos += col.width;
      });

      // Draw cell borders
      pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      pdf.line(margin, y, margin + usableWidth, y);

      y += 8;
    });

    // Draw final border
    pdf.line(margin, y, margin + usableWidth, y);
    
    // Draw vertical borders
    let verticalX = margin;
    columns.forEach(col => {
      pdf.line(verticalX, y - (8 * Object.keys(byPurpose).length), verticalX, y);
      verticalX += col.width;
    });
    pdf.line(verticalX, y - (8 * Object.keys(byPurpose).length), verticalX, y);

    // Generate filename and save
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `Expenditure_Report_${timestamp}.pdf`;
    
    console.log('Saving PDF as:', filename);
    pdf.save(filename);    this.handlePdfSuccess(null, filename, 'PDF generated successfully!');
  }

  private handlePdfSuccess(pdfBlob: Blob | null, filename: string, message: string): void {
    if (pdfBlob) {
      // Download the blob (from worker)
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    alert(message);
    this.updatePdfButton('Export PDF', false);
    this.isPdfGenerating = false;
  }

  private handlePdfError(error: string): void {
    console.error('PDF Generation Error:', error);
    alert('Error generating PDF: ' + error);
    this.updatePdfButton('Export PDF', false);
    this.isPdfGenerating = false;
  }

  private updatePdfButton(text: string, disabled: boolean): void {
    const button = document.querySelector('.btn-success') as HTMLButtonElement;
    if (button) {
      button.textContent = text;
      button.disabled = disabled;
    }
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  getMonthlyPurposeBreakdown(items: Iexpenditure[]): any[] {
    const breakdown: { [key: string]: { total: number, count: number } } = {};
    
    items.forEach(item => {
      const purpose = item.purpose || 'Uncategorized';
      if (!breakdown[purpose]) {
        breakdown[purpose] = { total: 0, count: 0 };
      }
      breakdown[purpose].total += item.amount || 0;
      breakdown[purpose].count += 1;
    });

    return Object.keys(breakdown).map(purpose => ({
      purpose,
      total: breakdown[purpose].total,
      count: breakdown[purpose].count
    })).sort((a, b) => b.total - a.total);
  }

  goBack(): void {
    console.log('Navigating back to reports dashboard');
    
    // Prevent multiple rapid clicks
    const button = event?.target as HTMLButtonElement;
    if (button) {
      button.disabled = true;
      setTimeout(() => button.disabled = false, 1000);
    }
    
    try {
      this.router.navigate(['/reports']).then(
        (success) => {
          if (!success) {
            console.warn('Navigation failed, trying fallback');
            this.fallbackNavigation();
          }
        }
      ).catch((error) => {
        console.error('Navigation error:', error);
        this.fallbackNavigation();
      });
    } catch (error) {
      console.error('Navigation error:', error);
      this.fallbackNavigation();
    }
  }

  private fallbackNavigation(): void {
    // Fallback navigation methods
    try {
      window.history.back();
    } catch (error) {
      console.error('History back failed:', error);
      window.location.href = '/reports';
    }
  }

  clearFilters(): void {
    console.log('Clearing filters');
    
    // Clear any pending timeouts to prevent conflicts
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    if (this.reportGenerationTimeout) {
      clearTimeout(this.reportGenerationTimeout);
    }
    
    this.selectedPurpose = '';
    const today = new Date();
    const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    
    this.endDate = this.formatDate(today);
    this.startDate = this.formatDate(lastYear);
    
    this.performFiltering(); // Use performFiltering directly to avoid debounce delay
  }

  ngOnDestroy(): void {
    // Clean up timeouts
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    if (this.reportGenerationTimeout) {
      clearTimeout(this.reportGenerationTimeout);
    }
  }
}

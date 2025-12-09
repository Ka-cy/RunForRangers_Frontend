import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { IDelivery, IDeliveryStatus } from '../../Interfaces/idelivery';
import { DeliveryService } from '../../API-Services/delivery.service';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';

Chart.register(...registerables);

@Component({
  selector: 'app-delivery-analytics',
  standalone: true,
  imports: [CommonModule, NavBarAdminComponent],
  templateUrl: './delivery-analytics.component.html',
  styleUrl: './delivery-analytics.component.css'
})
export class DeliveryAnalyticsComponent implements OnInit {
  showProfileMenu: boolean = false;
  activeSection: string = 'delivery';
  
  deliveries: IDelivery[] = [];
  deliveryStatuses: IDeliveryStatus[] = [];
  
  // Analytics data
  totalDeliveries: number = 0;
  pendingDeliveries: number = 0;
  completedDeliveries: number = 0;
  cancelledDeliveries: number = 0;
  
  // Chart references
  statusChart: Chart | null = null;
  weeklyChart: Chart | null = null;
  monthlyChart: Chart | null = null;

  // PDF Generation Properties
  isGeneratingPDF: boolean = false;
  pdfProgress: string = '';
  currentUser: string = 'Administrator';
  logoBase64: string = '';
  
  isLoading: boolean = false;
  error: string = '';

  constructor(
    private deliveryService: DeliveryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAnalyticsData();
    this.loadLogoAsBase64();
  }

  ngOnDestroy(): void {
    // Clean up charts
    if (this.statusChart) this.statusChart.destroy();
    if (this.weeklyChart) this.weeklyChart.destroy();
    if (this.monthlyChart) this.monthlyChart.destroy();
  }

  loadAnalyticsData(): void {
    this.isLoading = true;
    
    // Load deliveries and statuses
    Promise.all([
      this.deliveryService.getAllDeliveries().toPromise(),
      this.deliveryService.getDeliveryStatuses().toPromise()
    ]).then(([deliveries, statuses]) => {
      this.deliveries = deliveries || [];
      this.deliveryStatuses = statuses || [];
      
      this.calculateMetrics();
      this.createCharts();
      this.isLoading = false;
    }).catch(error => {
      console.error('Error loading analytics data:', error);
      this.error = 'Failed to load analytics data';
      this.isLoading = false;
    });
  }

  private calculateMetrics(): void {
    this.totalDeliveries = this.deliveries.length;
    
    // Count by status
    this.pendingDeliveries = this.deliveries.filter(d => 
      d.deliveryStatus?.toLowerCase().includes('pending') || 
      d.deliveryStatus?.toLowerCase().includes('processing')
    ).length;
    
    this.completedDeliveries = this.deliveries.filter(d => 
      d.deliveryStatus?.toLowerCase().includes('delivered') || 
      d.deliveryStatus?.toLowerCase().includes('completed')
    ).length;
    
    this.cancelledDeliveries = this.deliveries.filter(d => 
      d.deliveryStatus?.toLowerCase().includes('cancelled') || 
      d.deliveryStatus?.toLowerCase().includes('failed')
    ).length;
  }

  private createCharts(): void {
    setTimeout(() => {
      this.createStatusChart();
      this.createWeeklyChart();
      this.createMonthlyChart();
    }, 100);
  }

  private createStatusChart(): void {
    const ctx = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!ctx) return;

    const statusCounts = this.deliveryStatuses.map(status => {
      return this.deliveries.filter(d => d.deliveryStatus === status.statusName).length;
    });

    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.deliveryStatuses.map(s => s.statusName),
        datasets: [{
          data: statusCounts,
          backgroundColor: [
            '#3b82f6', // Blue
            '#10b981', // Green
            '#f59e0b', // Yellow
            '#ef4444', // Red
            '#8b5cf6', // Purple
            '#06b6d4'  // Cyan
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: 'Delivery Status Distribution'
          }
        }
      }
    });
  }

  private createWeeklyChart(): void {
    const ctx = document.getElementById('weeklyChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Get last 7 days data
    const last7Days = this.getLast7DaysData();

    this.weeklyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: last7Days.map(d => d.date),
        datasets: [{
          label: 'Deliveries',
          data: last7Days.map(d => d.count),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Last 7 Days Deliveries'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  private createMonthlyChart(): void {
    const ctx = document.getElementById('monthlyChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Get last 6 months data
    const last6Months = this.getLast6MonthsData();

    this.monthlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: last6Months.map(d => d.month),
        datasets: [{
          label: 'Deliveries',
          data: last6Months.map(d => d.count),
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Last 6 Months Deliveries'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  private getLast7DaysData(): { date: string, count: number }[] {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      const count = this.deliveries.filter(d => {
        const deliveryDate = new Date(d.deliveryDate);
        return deliveryDate.toDateString() === date.toDateString();
      }).length;
      
      data.push({ date: dateStr, count });
    }
    
    return data;
  }

  private getLast6MonthsData(): { month: string, count: number }[] {
    const data = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: '2-digit' 
      });
      
      const count = this.deliveries.filter(d => {
        const deliveryDate = new Date(d.deliveryDate);
        return deliveryDate.getMonth() === date.getMonth() && 
               deliveryDate.getFullYear() === date.getFullYear();
      }).length;
      
      data.push({ month: monthStr, count });
    }
    
    return data;
  }

  getCompletionRate(): number {
    if (this.totalDeliveries === 0) return 0;
    return Math.round((this.completedDeliveries / this.totalDeliveries) * 100);
  }

  getPendingRate(): number {
    if (this.totalDeliveries === 0) return 0;
    return Math.round((this.pendingDeliveries / this.totalDeliveries) * 100);
  }

  getStatusCount(statusName: string): number {
    return this.deliveries.filter(d => d.deliveryStatus === statusName).length;
  }

  getStatusPercentage(statusName: string): number {
    if (this.totalDeliveries === 0) return 0;
    return Math.round((this.getStatusCount(statusName) / this.totalDeliveries) * 100 * 10) / 10;
  }

  getAverageDeliveriesPerDay(): number {
    return Math.round((this.totalDeliveries / 30) * 10) / 10;
  }

  goBack(): void {
    this.router.navigate(['/delivery']);
  }

  exportData(): void {
    try {
      if (!this.deliveries || this.deliveries.length === 0) {
        alert('No delivery data available to export.');
        return;
      }

      // Enhanced CSV export with more comprehensive data
      const csvData = this.deliveries.map(d => ({
        'Delivery ID': d.deliveryId || 'N/A',
        'Tracking Number': d.trackingNumber || 'N/A',
        'Order ID': d.orderId || 'N/A',
        'Status': d.deliveryStatus || 'Unknown',
        'Delivery Date': d.deliveryDate ? new Date(d.deliveryDate).toLocaleDateString() : 'N/A',
        'Street Address': d.deliveryAddress?.streetAddress || 'N/A',
        'Postal Code': d.deliveryAddress?.postalCode || 'N/A',
        'Courier': d.courier?.courierName || 'Unassigned',
        'Waybill': d.waybill || 'N/A'
      }));
      
      const csv = this.convertToCSV(csvData);
      const timestamp = new Date().toISOString().split('T')[0];
      this.downloadCSV(csv, `delivery-analytics-${timestamp}.csv`);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  }

  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle null, undefined, and special characters
          if (value === null || value === undefined) return '""';
          const stringValue = String(value);
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return `"${stringValue}"`;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  }

  private downloadCSV(csv: string, filename: string): void {
    try {
      // Add BOM for UTF-8 encoding to handle special characters
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // Show success message
      setTimeout(() => {
        alert(`CSV file "${filename}" has been downloaded successfully!`);
      }, 100);
      
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Failed to download CSV file. Please try again.');
    }
  }

  refreshData(): void {
    this.loadAnalyticsData();
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout(): void {
    localStorage.removeItem('currentUserLoggedIn');
    this.router.navigate(['/home']);
  }

  // PDF Generation Methods
  private async loadLogoAsBase64(): Promise<void> {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          this.logoBase64 = canvas.toDataURL('image/png');
          resolve();
        };
        img.onerror = () => {
          console.log('Logo not found, using fallback');
          resolve();
        };
        img.src = '/assets/Images/RFRLogoNoBG.png';
      });
    } catch (error) {
      console.log('Error loading logo:', error);
    }
  }

  async printReport(): Promise<void> {
    try {
      this.isGeneratingPDF = true;
      this.pdfProgress = 'Preparing report data...';

      const currentDate = new Date();
      const timestamp = currentDate.toISOString().replace(/[:.]/g, '-').split('T')[0];
      const formattedDate = currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = currentDate.toLocaleTimeString('en-US');

      const reportHTML = this.generateReportHTML(formattedDate, formattedTime);
      await this.generatePDFDirect(reportHTML, timestamp);

    } catch (error) {
      console.error('Error generating PDF:', error);
      this.pdfProgress = 'Failed to generate PDF. Please try again.';
      
      setTimeout(() => {
        this.isGeneratingPDF = false;
        this.pdfProgress = '';
      }, 3000);
    }
  }

  private generateReportHTML(date: string, time: string): string {
    const statusChartImage = this.statusChart?.toBase64Image() || '';
    const weeklyChartImage = this.weeklyChart?.toBase64Image() || '';
    const monthlyChartImage = this.monthlyChart?.toBase64Image() || '';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #ffffff; line-height: 1.4;">
        <!-- Header with Logo -->
        <div style="display: flex; align-items: center; margin-bottom: 30px; border-bottom: 3px solid #667eea; padding-bottom: 20px;">
          ${this.logoBase64 ? 
            `<img src="${this.logoBase64}" style="width: 60px; height: 60px; margin-right: 15px; object-fit: contain; flex-shrink: 0;">` :
            `<div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; margin-right: 15px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; flex-shrink: 0;">RFR</div>`
          }
          <div style="flex: 1;">
            <h1 style="color: #667eea; margin: 0; font-size: 24px; font-weight: bold; line-height: 1.2;">Delivery Analytics Report</h1>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">Run For Rangers - Delivery Management System</p>
          </div>
        </div>

        <!-- Report Info -->
        <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #667eea;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; padding: 5px; vertical-align: top;">
                <strong style="color: #374151; font-size: 12px;">Report Generated:</strong><br>
                <span style="color: #666; font-size: 11px;">${date} at ${time}</span>
              </td>
              <td style="width: 50%; padding: 5px; vertical-align: top;">
                <strong style="color: #374151; font-size: 12px;">Generated By:</strong><br>
                <span style="color: #666; font-size: 11px;">${this.currentUser}</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Summary Statistics -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Delivery Summary</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 25%; padding: 10px; text-align: center;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px;">
                  <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">${this.totalDeliveries}</div>
                  <div style="font-size: 11px; opacity: 0.9;">Total Deliveries</div>
                </div>
              </td>
              <td style="width: 25%; padding: 10px; text-align: center;">
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 15px; border-radius: 8px;">
                  <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">${this.pendingDeliveries}</div>
                  <div style="font-size: 11px; opacity: 0.9;">Pending</div>
                </div>
              </td>
              <td style="width: 25%; padding: 10px; text-align: center;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px; border-radius: 8px;">
                  <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">${this.completedDeliveries}</div>
                  <div style="font-size: 11px; opacity: 0.9;">Completed</div>
                </div>
              </td>
              <td style="width: 25%; padding: 10px; text-align: center;">
                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 15px; border-radius: 8px;">
                  <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">${this.cancelledDeliveries}</div>
                  <div style="font-size: 11px; opacity: 0.9;">Cancelled</div>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Charts Section -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Visual Analytics</h2>
          
          ${statusChartImage ? `
          <div style="margin-bottom: 25px; text-align: center; page-break-inside: avoid;">
            <h3 style="color: #374151; margin-bottom: 10px; font-size: 14px;">Delivery Status Distribution</h3>
            <img src="${statusChartImage}" style="max-width: 100%; max-height: 300px; height: auto; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          </div>
          ` : ''}

          ${weeklyChartImage ? `
          <div style="margin-bottom: 25px; text-align: center; page-break-inside: avoid;">
            <h3 style="color: #374151; margin-bottom: 10px; font-size: 14px;">Weekly Delivery Trends</h3>
            <img src="${weeklyChartImage}" style="max-width: 100%; max-height: 300px; height: auto; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          </div>
          ` : ''}

          ${monthlyChartImage ? `
          <div style="margin-bottom: 25px; text-align: center; page-break-inside: avoid;">
            <h3 style="color: #374151; margin-bottom: 10px; font-size: 14px;">Monthly Delivery Performance</h3>
            <img src="${monthlyChartImage}" style="max-width: 100%; max-height: 300px; height: auto; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          </div>
          ` : ''}
        </div>

        <!-- Delivery Performance Table -->
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <h2 style="color: #374151; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Recent Deliveries</h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; font-size: 11px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; color: #374151; font-size: 10px;">Delivery ID</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; color: #374151; font-size: 10px;">Address</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; color: #374151; font-size: 10px;">Date</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; color: #374151; font-size: 10px;">Status</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; color: #374151; font-size: 10px;">Courier</th>
              </tr>
            </thead>
            <tbody>
              ${this.deliveries.slice(0, 15).map(delivery => `
                <tr>
                  <td style="padding: 6px 8px; border: 1px solid #e5e7eb; font-size: 10px;">${delivery.deliveryId}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e5e7eb; font-size: 10px; max-width: 150px; word-wrap: break-word;">${(delivery.deliveryAddress?.streetAddress || 'N/A').substring(0, 30)}${(delivery.deliveryAddress?.streetAddress || '').length > 30 ? '...' : ''}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e5e7eb; font-size: 10px;">${new Date(delivery.deliveryDate).toLocaleDateString()}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e5e7eb; font-size: 10px;">${delivery.deliveryStatus || 'Unknown'}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e5e7eb; font-size: 10px;">${(delivery.courier?.courierName || 'Unassigned').substring(0, 15)}${(delivery.courier?.courierName || '').length > 15 ? '...' : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #e5e7eb; text-align: center; color: #666; font-size: 10px;">
          <p style="margin: 0;">This report was automatically generated by the Run For Rangers Delivery Management System</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Run For Rangers. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  private async generatePDFDirect(htmlContent: string, timestamp: string): Promise<void> {
    try {
      this.pdfProgress = 'Loading PDF libraries...';
      
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      this.pdfProgress = 'Preparing content for PDF...';
      
      // Create temporary div with better styling for PDF
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0px';
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.maxWidth = '210mm';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.padding = '20px';
      tempDiv.style.boxSizing = 'border-box';
      document.body.appendChild(tempDiv);

      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 100));

      this.pdfProgress = 'Converting to PDF...';

      const canvas = await html2canvas(tempDiv, {
        useCORS: true,
        allowTaint: true,
        height: tempDiv.scrollHeight,
        width: tempDiv.scrollWidth
      });

      const imgData = canvas.toDataURL('image/png', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 10mm margin
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);
      
      // Calculate dimensions to maintain aspect ratio
      const canvasAspectRatio = canvas.height / canvas.width;
      const scaledHeight = availableWidth * canvasAspectRatio;

      if (scaledHeight <= availableHeight) {
        // Content fits on one page
        pdf.addImage(imgData, 'PNG', margin, margin, availableWidth, scaledHeight);
      } else {
        // Multi-page handling with proper scaling
        const pageCount = Math.ceil(scaledHeight / availableHeight);
        const segmentHeight = canvas.height / pageCount;
        
        for (let i = 0; i < pageCount; i++) {
          if (i > 0) {
            pdf.addPage();
          }
          
          const segmentCanvas = document.createElement('canvas');
          segmentCanvas.width = canvas.width;
          segmentCanvas.height = Math.min(segmentHeight, canvas.height - (i * segmentHeight));
          
          const segmentCtx = segmentCanvas.getContext('2d');
          segmentCtx?.drawImage(
            canvas,
            0, i * segmentHeight, canvas.width, segmentCanvas.height,
            0, 0, canvas.width, segmentCanvas.height
          );
          
          const segmentImgData = segmentCanvas.toDataURL('image/png', 0.95);
          const segmentScaledHeight = availableWidth * (segmentCanvas.height / segmentCanvas.width);
          
          pdf.addImage(segmentImgData, 'PNG', margin, margin, availableWidth, segmentScaledHeight);
        }
      }

      document.body.removeChild(tempDiv);

      this.pdfProgress = 'Downloading PDF...';
      pdf.save(`Delivery_Analytics_Report_${timestamp}.pdf`);

      this.pdfProgress = 'PDF generated successfully!';
      setTimeout(() => {
        this.isGeneratingPDF = false;
        this.pdfProgress = '';
      }, 2000);

    } catch (error) {
      console.error('PDF Generation Error:', error);
      this.pdfProgress = 'Failed to generate PDF';
      setTimeout(() => {
        this.isGeneratingPDF = false;
        this.pdfProgress = '';
      }, 3000);
    }
  }
}

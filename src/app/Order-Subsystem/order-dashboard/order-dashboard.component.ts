import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { OrderService, OrderDashboardDto, OrderInvoiceDto, UserDto } from '../../API-Services/order.service';
import { NotificationService } from '../../API-Services/notification.service';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { NotificationModalComponent } from '../../Notification/notification.component';
import { HelpButtonComponent } from "../../Admin-Subsystem/help-button/help-button/help-button.component";
import { UserService } from '../../API-Services/user.service';
import { ExportService } from '../../API-Services/export.service';

Chart.register(...registerables);

// Interfaces for backward compatibility
interface IOrderStatus {
  orderStatusId: number;
  orderStatusName: string;
  description?: string;
}

interface IPaymentStatus {
  paymentStatusId: number;
  paymentStatusName: string;
}

@Component({
  selector: 'app-order-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NavBarAdminComponent, HelpButtonComponent, NotificationModalComponent],
  templateUrl: './order-dashboard.component.html',
  styleUrls: ['./order-dashboard.component.css']
})
export class OrderDashboardComponent implements OnInit, OnDestroy {
  showProfileMenu: boolean = false;

  orders: OrderDashboardDto[] = [];
  filteredOrders: OrderDashboardDto[] = [];
  orderStatuses: IOrderStatus[] = [];
  paymentStatuses: IPaymentStatus[] = [];
  selectedOrderInvoice: OrderInvoiceDto | null = null;

  searchTerm: string = '';
  selectedStatus: string = '';
  selectedPaymentStatus: string = '';
  sortField: string = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  isLoading: boolean = false;
  error: string = '';

  // Chart instance
  ordersChart: Chart | null = null;

  // PDF Generation Properties
  isGeneratingPDF: boolean = false;
  pdfProgress: string = '';
  currentUser: string = 'Administrator';
  logoBase64: string = '';

  constructor(
    private orderService: OrderService,
    private router: Router,
    private userService: UserService,
    private exportService: ExportService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadOrderStatuses();
    this.loadPaymentStatuses();
    this.loadLogoAsBase64();
  }

  ngOnDestroy(): void {
    if (this.ordersChart) {
      this.ordersChart.destroy();
    }
  }

  // Add HostListener to close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-info')) {
      this.showProfileMenu = false;
    }
  }

  // Add clearSearch method
  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error = '';

    this.orderService.getAllOrders().subscribe({
      next: (orders: OrderDashboardDto[]) => {
        this.orders = orders || [];
        this.filteredOrders = [...this.orders];
        this.isLoading = false;
        this.applyFilters();
        this.createOrderChart();
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.error = 'Failed to load orders. Please try again.';
        this.orders = [];
        this.filteredOrders = [];
        this.isLoading = false;
      }
    });
  }

  loadOrderStatuses(): void {
    // Try to load from API first
    this.orderService.getOrderStatuses().subscribe({
      next: (statuses) => {
        this.orderStatuses = statuses;
      },
      error: (error) => {
        console.error('Error loading order statuses from API, using fallback:', error);
        // Fallback to mock statuses if API fails
        this.orderStatuses = [
          { orderStatusId: 3, orderStatusName: 'Payment Received' },
          { orderStatusId: 4, orderStatusName: 'Processing' },
          { orderStatusId: 5, orderStatusName: 'Completed' }
        ];
      }
    });
  }

  loadPaymentStatuses(): void {
    // Create mock payment statuses
    this.paymentStatuses = [
      { paymentStatusId: 1, paymentStatusName: 'Pending' },
      { paymentStatusId: 2, paymentStatusName: 'Paid' },
      { paymentStatusId: 3, paymentStatusName: 'Failed' },
      { paymentStatusId: 4, paymentStatusName: 'Refunded' }
    ];
  }

  applyFilters(): void {
    let filtered = [...this.orders];

    // Search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderId.toString().includes(this.searchTerm) ||
        order.user?.firstName?.toLowerCase().includes(searchLower) ||
        order.user?.surname?.toLowerCase().includes(searchLower) ||
        order.user?.email?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(order => order.orderStatusName === this.selectedStatus);
    }

    // Payment status filter - Note: This would need to be integrated with invoice data
    // For now, we'll skip this filter since OrderDashboardDto doesn't include payment status
    // You may want to load invoice data separately or modify the API to include it

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortField) {
        case 'orderId':
          aValue = a.orderId;
          bValue = b.orderId;
          break;
        case 'createdAt':
        case 'orderDate':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'totalAmount':
        case 'orderTotal':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredOrders = filtered;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatusFilter(): void {
    this.applyFilters();
  }

  onPaymentStatusFilter(): void {
    this.applyFilters();
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return '↕️';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  onOrderStatusChange(orderId: number, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const statusId = +target.value;
    this.updateOrderStatus(orderId, statusId);
  }

  updateOrderStatus(orderId: number, statusId: number): void {
    this.orderService.updateOrderStatus(orderId, statusId).subscribe({
      next: (response) => {
        if (response.success === false) {
          // Backend endpoint not implemented, update locally for now
          console.warn('Backend status update not available, updating locally');
          this.notificationService.showWarning('Status Update', 'Status updated locally. Backend update not available.');
        } else {
          this.notificationService.showSuccess('Status Updated', 'Order status has been updated successfully.');
        }
        
        const order = this.orders.find(o => o.orderId === orderId);
        if (order) {
          const status = this.orderStatuses.find(s => s.orderStatusId === statusId);
          if (status) {
            order.orderStatusId = statusId;
            order.orderStatusName = status.orderStatusName;
          }
        }
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        this.notificationService.showError('Update Failed', 'Failed to update order status. Please try again.');
      }
    });
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'processing':
        return 'status-processing';
      case 'shipped':
        return 'status-shipped';
      case 'delivered':
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      case 'payment received':
        return 'status-processing';
      default:
        return 'status-default';
    }
  }

  getPaymentStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'payment-pending';
      case 'paid':
      case 'completed':
        return 'payment-paid';
      case 'failed':
        return 'payment-failed';
      case 'refunded':
        return 'payment-refunded';
      default:
        return 'payment-default';
    }
  }

  viewOrderDetails(orderId: number): void {
    // Load the invoice when viewing details
    this.orderService.getOrderInvoice(orderId).subscribe({
      next: (invoice) => {
        this.selectedOrderInvoice = invoice;
        this.router.navigate(['/orders/details', orderId]);
      },
      error: (error) => {
        console.error('Error loading invoice:', error);
        // Navigate anyway, just without invoice data
        this.router.navigate(['/orders/details', orderId]);
      }
    });
  }

  isOrderCompletedForDelivery(order: OrderDashboardDto): boolean {
    return order.orderStatusName?.toLowerCase() === 'completed';
  }

  createOrderChart(): void {
    if (this.ordersChart) {
      this.ordersChart.destroy();
    }

    const ctx = document.getElementById('ordersChart') as HTMLCanvasElement;
    if (!ctx) return;

    const ordersByMonth = this.getOrdersByMonth();
    const months = Object.keys(ordersByMonth);
    const orderCounts = Object.values(ordersByMonth);

    this.ordersChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Orders',
          data: orderCounts,
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Orders Over Time'
          },
          legend: {
            display: false
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

  getOrdersByMonth(): { [key: string]: number } {
    const ordersByMonth: { [key: string]: number } = {};

    this.orders.forEach(order => {
      const orderDate = order.createdAt;
      if (orderDate) {
        const date = new Date(orderDate);
        const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

        if (ordersByMonth[monthYear]) {
          ordersByMonth[monthYear]++;
        } else {
          ordersByMonth[monthYear] = 1;
        }
      }
    });

    return ordersByMonth;
  }

  getTotalOrders(): number {
    return this.orders.length;
  }

  getTotalRevenue(): number {
    return this.orders.reduce((total, order) => total + (order.totalAmount || 0), 0);
  }

  getPendingOrders(): number {
    return this.orders.filter(order =>
      order.orderStatusName?.toLowerCase().includes('pending')
    ).length;
  }

  getCompletedOrders(): number {
    return this.orders.filter(order =>
      order.orderStatusName?.toLowerCase() === 'completed'
    ).length;
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout(): void {
    localStorage.removeItem('currentUserLoggedIn');
    sessionStorage.removeItem('adminData'); // Also clear admin session data
    this.showProfileMenu = false; // Close dropdown
    this.router.navigate(['/signin']);
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
    const chartImage = this.ordersChart?.toBase64Image() || '';

    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #ffffff;">
        <!-- Header with Logo -->
        <div style="display: flex; align-items: center; margin-bottom: 30px; border-bottom: 3px solid #667eea; padding-bottom: 20px;">
          ${this.logoBase64 ?
            `<img src="${this.logoBase64}" style="width: 80px; height: 80px; margin-right: 20px; object-fit: contain;">` :
            `<div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin-right: 20px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px;">RFR</div>`
          }
          <div>
            <h1 style="color: #667eea; margin: 0; font-size: 28px; font-weight: bold;">Order Management Report</h1>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">Run For Rangers - Order Management System</p>
          </div>
        </div>

        <!-- Report Info -->
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #667eea;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <strong style="color: #374151;">Report Generated:</strong><br>
              <span style="color: #666;">${date} at ${time}</span>
            </div>
            <div>
              <strong style="color: #374151;">Generated By:</strong><br>
              <span style="color: #666;">${this.currentUser}</span>
            </div>
          </div>
        </div>

        <!-- Summary Statistics -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Summary</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
              <h3 style="margin: 0; font-size: 32px; font-weight: bold;">${this.getTotalOrders()}</h3>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Total Orders</p>
            </div>
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
              <h3 style="margin: 0; font-size: 32px; font-weight: bold;">R${this.getTotalRevenue().toFixed(2)}</h3>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Total Revenue</p>
            </div>
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
              <h3 style="margin: 0; font-size: 32px; font-weight: bold;">${this.getPendingOrders()}</h3>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Pending Orders</p>
            </div>
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
              <h3 style="margin: 0; font-size: 32px; font-weight: bold;">${this.getCompletedOrders()}</h3>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Completed Orders</p>
            </div>
          </div>
        </div>

        <!-- Chart Section -->
        ${chartImage ? `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Analytics</h2>
          <div style="text-align: center;">
            <img src="${chartImage}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          </div>
        </div>
        ` : ''}

        <!-- Orders Table -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Recent Orders</h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left; color: #374151;">Order ID</th>
                <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left; color: #374151;">Customer</th>
                <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left; color: #374151;">Date</th>
                <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left; color: #374151;">Total</th>
                <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left; color: #374151;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${this.filteredOrders.slice(0, 10).map(order => `
                <tr>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">#${order.orderId}</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">${order.user?.firstName || ''} ${order.user?.surname || ''}</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">${new Date(order.createdAt).toLocaleDateString()}</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">R${order.totalAmount.toFixed(2)}</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">${order.orderStatusName}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">This report was automatically generated by the Run For Rangers Order Management System</p>
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

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0px';
      tempDiv.style.width = '794px';
      document.body.appendChild(tempDiv);

      this.pdfProgress = 'Converting to PDF...';

      const canvas = await html2canvas(tempDiv, {
        useCORS: true,
        allowTaint: true,
        height: tempDiv.scrollHeight,
        width: 794
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasAspectRatio = canvas.height / canvas.width;
      const pdfContentHeight = pdfWidth * canvasAspectRatio;

      if (pdfContentHeight <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfContentHeight);
      } else {
        let yPosition = 0;
        const pageHeight = pdfHeight;
        const pageAspectRatio = pdfWidth / pageHeight;
        const segmentHeight = canvas.width * pageAspectRatio;

        while (yPosition < canvas.height) {
          const segmentCanvas = document.createElement('canvas');
          segmentCanvas.width = canvas.width;
          segmentCanvas.height = Math.min(segmentHeight, canvas.height - yPosition);

          const segmentCtx = segmentCanvas.getContext('2d');
          segmentCtx?.drawImage(
            canvas,
            0, yPosition, canvas.width, segmentCanvas.height,
            0, 0, canvas.width, segmentCanvas.height
          );

          const segmentImgData = segmentCanvas.toDataURL('image/png');

          if (yPosition > 0) {
            pdf.addPage();
          }

          pdf.addImage(segmentImgData, 'PNG', 0, 0, pdfWidth, pageHeight);
          yPosition += segmentHeight;
        }
      }

      document.body.removeChild(tempDiv);

      this.pdfProgress = 'Downloading PDF...';
      pdf.save(`Order_Report_${timestamp}.pdf`);

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

  // Export functionality
  exportToExcel(): void {
    try {
      const exportData = this.prepareOrderDataForExport();
      this.exportService.exportToExcel(
        exportData, 
        `order-report-${new Date().toISOString().split('T')[0]}`,
        'Orders Report'
      );
      console.log('✅ Orders exported to Excel successfully!');
      this.notificationService.showSuccess('Orders exported to Excel successfully!', 'Export Success');
    } catch (error) {
      console.error('Export to Excel failed:', error);
      this.notificationService.showError('Failed to export orders to Excel', 'Export Error');
    }
  }

  exportToCSV(): void {
    try {
      const exportData = this.prepareOrderDataForExport();
      this.exportService.exportToCSV(
        exportData, 
        `order-report-${new Date().toISOString().split('T')[0]}`
      );
      console.log('✅ Orders exported to CSV successfully!');
      this.notificationService.showSuccess('Orders exported to CSV successfully!', 'Export Success');
    } catch (error) {
      console.error('Export to CSV failed:', error);
      this.notificationService.showError('Failed to export orders to CSV', 'Export Error');
    }
  }

  private prepareOrderDataForExport(): any[] {
    return this.filteredOrders.map(order => ({
      'Order ID': order.orderId,
      'Customer Name': `${order.user?.firstName || ''} ${order.user?.surname || ''}`.trim(),
      'Customer Email': order.user?.email || '',
      'Order Date': new Date(order.createdAt).toLocaleDateString(),
      'Total Amount': `R${order.totalAmount.toFixed(2)}`,
      'Order Status': order.orderStatusName || '',
      'Created Date': this.formatDate(order.createdAt)
    }));
  }
}

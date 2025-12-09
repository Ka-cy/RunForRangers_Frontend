import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { UserService } from '../../API-Services/user.service';
import { OrderService } from '../../API-Services/order.service';
import { ProductService } from '../../API-Services/product.service';
import { InventoryService } from '../../API-Services/inventory.service';

Chart.register(...registerables);

interface ManagerialReportData {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  lowStockItems: number;
  topSellingProducts: Array<{
    productName: string;
    totalSold: number;
    revenue: number;
  }>;
  monthlyOrderData: Array<{
    month: string;
    orders: number;
    revenue: number;
  }>;
  stockLevels: Array<{
    productName: string;
    currentStock: number;
    minStock: number;
    status: 'Low' | 'Normal' | 'Overstock';
  }>;
}

@Component({
  selector: 'app-managerial-report',
  imports: [CommonModule, FormsModule],
  templateUrl: './managerial-report.component.html',
  styleUrl: './managerial-report.component.css'
})
export class ManagerialReportComponent implements OnInit {
  @ViewChild('reportContent', { static: false }) reportContent!: ElementRef;
  @ViewChild('revenueChartCanvas', { static: false }) revenueChartCanvas!: ElementRef;

  reportData: ManagerialReportData | null = null;
  revenueChart: Chart | null = null;
  isLoading: boolean = false;
  isGeneratingPDF: boolean = false;
  reportGenerated: boolean = false;
  generatedBy: string = '';
  generatedDate: string = '';

  constructor(
    private userService: UserService,
    private orderService: OrderService,
    private productService: ProductService,
    private inventoryService: InventoryService
  ) {}

  ngOnInit(): void {
    this.setReportMetadata();
    this.generateReport();
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

  async generateReport(): Promise<void> {
    this.isLoading = true;
    this.reportGenerated = false;

    try {
      // Load all data in parallel
      const [users, orders, products, inventory] = await Promise.all([
        this.userService.GetAllUsers().toPromise(),
        this.orderService.getAllOrders().toPromise(),
        this.productService.GetAllProducts().toPromise(),
        this.inventoryService.getAll().toPromise()
      ]);

      // Process the data
      this.reportData = this.processReportData(users || [], orders || [], products || [], inventory || []);

      // Generate chart after data is processed
      setTimeout(() => {
        this.createRevenueChart();
      }, 100);

      this.reportGenerated = true;
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  private processReportData(users: any[], orders: any[], products: any[], inventory: any[]): ManagerialReportData {
    // Calculate basic metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalUsers = users.length;
    const totalProducts = products.length;

    // Calculate low stock items
    const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock).length;

    // Calculate top selling products
    const productSales = new Map<string, { quantity: number; revenue: number; name: string }>();

    orders.forEach(order => {
      if (order.orderItems && Array.isArray(order.orderItems)) {
        order.orderItems.forEach((item: any) => {
          const productId = item.productId;
          const quantity = item.quantity || 0;
          const price = item.price || 0;

          if (!productSales.has(productId)) {
            const product = products.find(p => p.productId === productId);
            productSales.set(productId, {
              quantity: 0,
              revenue: 0,
              name: product?.productName || `Product ${productId}`
            });
          }

          const sales = productSales.get(productId)!;
          sales.quantity += quantity;
          sales.revenue += quantity * price;
        });
      }
    });

    const topSellingProducts = Array.from(productSales.entries())
      .map(([productId, data]) => ({
        productName: data.name,
        totalSold: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10);

    // Calculate monthly order data (last 12 months)
    const monthlyData = new Map<string, { orders: number; revenue: number }>();
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      monthlyData.set(monthKey, { orders: 0, revenue: 0 });
    }

    orders.forEach(order => {
      if (order.orderDate) {
        const orderDate = new Date(order.orderDate);
        const monthKey = orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

        if (monthlyData.has(monthKey)) {
          const data = monthlyData.get(monthKey)!;
          data.orders += 1;
          data.revenue += order.totalAmount || 0;
        }
      }
    });

    const monthlyOrderData = Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      orders: data.orders,
      revenue: data.revenue
    }));

    // Process stock levels
    const stockLevels = inventory.slice(0, 20).map(item => {
      const product = products.find(p => p.productId === item.productId);
      let status: 'Low' | 'Normal' | 'Overstock' = 'Normal';

      if (item.currentStock <= item.minStock) {
        status = 'Low';
      } else if (item.currentStock > item.minStock * 2) {
        status = 'Overstock';
      }

      return {
        productName: product?.productName || `Product ${item.productId}`,
        currentStock: item.currentStock,
        minStock: item.minStock,
        status
      };
    });

    return {
      totalOrders,
      totalRevenue,
      totalUsers,
      totalProducts,
      lowStockItems,
      topSellingProducts,
      monthlyOrderData,
      stockLevels
    };
  }

  private createRevenueChart(): void {
    if (!this.revenueChartCanvas || !this.reportData) return;

    const ctx = this.revenueChartCanvas.nativeElement.getContext('2d');

    // Destroy existing chart
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    const data = this.reportData.monthlyOrderData;

    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(item => item.month),
        datasets: [{
          label: 'Monthly Revenue (R)',
          data: data.map(item => item.revenue),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Monthly Revenue Trend'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }

  async generatePDF(): Promise<void> {
    if (!this.reportGenerated || !this.reportData) {
      alert('Please generate the report first.');
      return;
    }

    if (this.isGeneratingPDF) return;

    this.isGeneratingPDF = true;

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let y = margin;
      const usableWidth = pageWidth - (2 * margin);

      // Add logo
      const logoUrl = 'assets/Images/RFRLogoNoBG.png';
      try {
        pdf.addImage(logoUrl, 'PNG', margin, y, 40, 24);
        y += 28;
      } catch (e) {
        console.warn('Logo not found, continuing without logo');
        y += 5;
      }

      // Header
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(31, 41, 55);
      pdf.text('Managerial Report', pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Metadata
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Generated by: ${this.generatedBy}`, pageWidth / 2, y, { align: 'center' });
      y += 7;
      pdf.text(`Generated on: ${this.generatedDate}`, pageWidth / 2, y, { align: 'center' });
      y += 15;

      // Executive Summary
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(55, 65, 81);
      pdf.text('Executive Summary', margin, y);
      y += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);

      const summaryText = [
        `Total Orders: ${this.reportData.totalOrders.toLocaleString()}`,
        `Total Revenue: R${this.reportData.totalRevenue.toLocaleString()}`,
        `Total Users: ${this.reportData.totalUsers.toLocaleString()}`,
        `Total Products: ${this.reportData.totalProducts.toLocaleString()}`,
        `Low Stock Items: ${this.reportData.lowStockItems}`
      ];

      summaryText.forEach(text => {
        pdf.text(text, margin, y);
        y += 6;
      });

      y += 10;

      // Top Selling Products
      if (y > pageHeight - 60) {
        pdf.addPage();
        y = margin;
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(55, 65, 81);
      pdf.text('Top Selling Products', margin, y);
      y += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);

      this.reportData.topSellingProducts.slice(0, 10).forEach((product, index) => {
        if (y > pageHeight - 20) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(`${index + 1}. ${product.productName}`, margin, y);
        pdf.text(`${product.totalSold} units`, margin + 100, y);
        pdf.text(`R${product.revenue.toLocaleString()}`, margin + 140, y);
        y += 6;
      });

      y += 10;

      // Stock Levels Alert
      if (y > pageHeight - 60) {
        pdf.addPage();
        y = margin;
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(55, 65, 81);
      pdf.text('Stock Levels Alert', margin, y);
      y += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);

      const lowStockItems = this.reportData.stockLevels.filter(item => item.status === 'Low');
      if (lowStockItems.length > 0) {
        lowStockItems.slice(0, 15).forEach(item => {
          if (y > pageHeight - 20) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(`${item.productName}`, margin, y);
          pdf.text(`${item.currentStock}/${item.minStock}`, margin + 100, y);
          pdf.setTextColor(220, 38, 38); // Red for low stock
          pdf.text('LOW STOCK', margin + 140, y);
          pdf.setTextColor(0, 0, 0);
          y += 6;
        });
      } else {
        pdf.text('All items are adequately stocked.', margin, y);
      }

      // Save the PDF
      const fileName = `Managerial_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      this.isGeneratingPDF = false;
    }
  }

  getRevenueTrend(): 'up' | 'down' | 'stable' {
    if (!this.reportData || this.reportData.monthlyOrderData.length < 2) return 'stable';

    const data = this.reportData.monthlyOrderData;
    const recent = data.slice(-3); // Last 3 months
    const earlier = data.slice(-6, -3); // Previous 3 months

    const recentAvg = recent.reduce((sum, item) => sum + item.revenue, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, item) => sum + item.revenue, 0) / earlier.length;

    if (recentAvg > earlierAvg * 1.05) return 'up';
    if (recentAvg < earlierAvg * 0.95) return 'down';
    return 'stable';
  }

  getAverageOrderValue(): number {
    if (!this.reportData || this.reportData.totalOrders === 0) return 0;
    return this.reportData.totalRevenue / this.reportData.totalOrders;
  }

  getLowStockItems() {
    if (!this.reportData) return [];
    return this.reportData.stockLevels.filter(item => item.status === 'Low');
  }

  hasMultipleMonths(): boolean {
    return this.reportData ? this.reportData.monthlyOrderData.length > 1 : false;
  }

  getTopProductName(): string {
    if (!this.reportData || !this.reportData.topSellingProducts.length) return 'N/A';
    return this.reportData.topSellingProducts[0].productName;
  }

  getTopProductSales(): number {
    if (!this.reportData || !this.reportData.topSellingProducts.length) return 0;
    return this.reportData.topSellingProducts[0].totalSold;
  }
}

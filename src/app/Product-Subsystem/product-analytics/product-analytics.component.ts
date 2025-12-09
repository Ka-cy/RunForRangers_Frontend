/**
 * product-analytics.component.ts
 * -----------------------------
 * Angular component for displaying analytics and statistics about products.
 * Shows summary stats, charts, and allows PDF export of analytics data.
 * Used by admins to visualize product data and trends.
 */
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Iproduct, IproductCategory, IproductType } from '../../Interfaces/iproduct';
import { ProductService } from '../../API-Services/product.service';
import { NotificationService } from '../../API-Services/notification.service';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { NotificationModalComponent } from '../../Notification/notification.component';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

/**
 * Interface for holding all analytics data for products
 */
interface ProductAnalytics {
  totalProducts: number; // Total number of products
  totalCategories: number; // Total number of categories
  totalTypes: number; // Total number of types
  averagePrice: number; // Average price of all products
  highestPricedProduct: Iproduct | null; // Product with highest price
  lowestPricedProduct: Iproduct | null; // Product with lowest price
  productsByCategory: { [key: string]: number }; // Product count by category
  productsByType: { [key: string]: number }; // Product count by type
  priceRanges: { [key: string]: number }; // Product count by price range
}

/**
 * ProductAnalyticsComponent
 * ------------------------
 * Displays product analytics, summary statistics, and charts for admin users.
 * Handles data loading, chart rendering, and PDF export of analytics.
 */
@Component({
  selector: 'app-product-analytics',
  standalone: true,
  imports: [CommonModule, NavBarAdminComponent, NotificationModalComponent],
  templateUrl: './product-analytics.component.html',
  styleUrl: './product-analytics.component.css'
})
export class ProductAnalyticsComponent implements OnInit, AfterViewInit {
  /** Reference to the category chart canvas element */
  @ViewChild('categoryChart', { static: false }) categoryChart!: ElementRef;
  /** Reference to the type chart canvas element */
  @ViewChild('typeChart', { static: false }) typeChart!: ElementRef;
  /** Reference to the price chart canvas element */
  @ViewChild('priceChart', { static: false }) priceChart!: ElementRef;

  /** Chart.js instance for category chart */
  private categoryChartInstance: Chart | null = null;
  /** Chart.js instance for type chart */
  private typeChartInstance: Chart | null = null;
  /** Chart.js instance for price chart */
  private priceChartInstance: Chart | null = null;

  /** Holds all analytics data for display */
  analytics: ProductAnalytics = {
    totalProducts: 0,
    totalCategories: 0,
    totalTypes: 0,
    averagePrice: 0,
    highestPricedProduct: null,
    lowestPricedProduct: null,
    productsByCategory: {},
    productsByType: {},
    priceRanges: {}
  };

  /** All products loaded from backend */
  products: Iproduct[] = [];
  /** All categories loaded from backend */
  categories: IproductCategory[] = [];
  /** All types loaded from backend */
  types: IproductType[] = [];

  /** Loading state for analytics data */
  isLoading: boolean = true;
  /** Error message for UI display */
  error: string = '';

  /** Injects product service and router for data and navigation */
  constructor(
    private productService: ProductService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadAnalyticsData();
    this.loadLogoAsBase64();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after analytics data is loaded
  }

  private loadAnalyticsData(): void {
    this.isLoading = true;
    
    // Load all required data
    Promise.all([
      this.productService.GetAllProducts().toPromise(),
      this.productService.GetProductCategories().toPromise(),
      this.productService.GetProductTypes().toPromise()
    ]).then(([products, categories, types]) => {
      this.products = products || [];
      this.categories = categories || [];
      this.types = types || [];
      
      this.calculateAnalytics();
      this.isLoading = false;
      
      // Initialize charts after data is loaded and view is initialized
      setTimeout(() => this.initializeCharts(), 100);
    }).catch(error => {
      console.error('Error loading analytics data:', error);
      this.error = 'Failed to load analytics data';
      this.isLoading = false;
    });
  }

  private calculateAnalytics(): void {
    // Basic counts
    this.analytics.totalProducts = this.products.length;
    this.analytics.totalCategories = this.categories.length;
    this.analytics.totalTypes = this.types.length;

    if (this.products.length === 0) return;

    // Price analytics
    const prices = this.products.map(p => p.price);
    this.analytics.averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    this.analytics.highestPricedProduct = this.products.reduce((max, product) => 
      product.price > max.price ? product : max
    );
    
    this.analytics.lowestPricedProduct = this.products.reduce((min, product) => 
      product.price < min.price ? product : min
    );

    // Products by category
    this.analytics.productsByCategory = {};
    this.categories.forEach(category => {
      const count = this.products.filter(p => {
        const productType = this.types.find(type => type.productTypeId === p.productTypeId);
        return productType?.productCategoryId === category.productCategoryId;
      }).length;
      this.analytics.productsByCategory[category.categoryName] = count;
    });

    // Products by type
    this.analytics.productsByType = {};
    this.types.forEach(type => {
      const count = this.products.filter(p => p.productTypeId === type.productTypeId).length;
      this.analytics.productsByType[type.typeName] = count;
    });

    // Price ranges
    this.analytics.priceRanges = {
      '0-50': this.products.filter(p => p.price <= 50).length,
      '51-100': this.products.filter(p => p.price > 50 && p.price <= 100).length,
      '101-200': this.products.filter(p => p.price > 100 && p.price <= 200).length,
      '201-500': this.products.filter(p => p.price > 200 && p.price <= 500).length,
      '500+': this.products.filter(p => p.price > 500).length
    };
  }

  goBackToProducts(): void {
    this.router.navigate(['/products']);
  }

  manageCategories(): void {
    this.router.navigate(['/products/manage-categories']);
  }

  manageTypes(): void {
    this.router.navigate(['/products/manage-types']);
  }

  manageColors(): void {
    this.router.navigate(['/products/manage-colors']);
  }

  manageSizes(): void {
    this.router.navigate(['/products/manage-sizes']);
  }

  // PDF Generation Properties
  isGeneratingPDF: boolean = false;
  pdfProgress: string = '';
  currentUser: string = 'Administrator'; //  from auth service
  logoBase64: string = '';

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
          resolve(); // Continue without logo
        };
        img.src = '/assets/Images/RFRLogoNoBG.png';
      });
    } catch (error) {
      console.log('Error loading logo:', error);
      // Continue without logo
    }
  }

  async printReport(): Promise<void> {
    try {
      this.isGeneratingPDF = true;
      this.pdfProgress = 'Preparing report data...';

      // Get current date and time
      const currentDate = new Date();
      const timestamp = currentDate.toISOString().replace(/[:.]/g, '-').split('T')[0];
      const formattedDate = currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = currentDate.toLocaleTimeString('en-US');

      // Create report HTML with logo and user info
      const reportHTML = this.generateReportHTML(formattedDate, formattedTime);

      // Generate PDF directly in main thread (DOM operations need main thread)
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
    // Convert charts to base64 images
    const categoryChartImage = this.categoryChartInstance?.toBase64Image() || '';
    const typeChartImage = this.typeChartInstance?.toBase64Image() || '';
    const priceChartImage = this.priceChartInstance?.toBase64Image() || '';

    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #ffffff;">
        <!-- Header with Logo -->
        <div style="display: flex; align-items: center; margin-bottom: 30px; border-bottom: 3px solid #667eea; padding-bottom: 20px;">
          ${this.logoBase64 ? 
            `<img src="${this.logoBase64}" style="width: 80px; height: 80px; margin-right: 20px; object-fit: contain;">` :
            `<div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin-right: 20px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px;">RFR</div>`
          }
          <div>
            <h1 style="color: #667eea; margin: 0; font-size: 28px; font-weight: bold;">Product Analytics Report</h1>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">Run For Rangers - Product Management System</p>
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
          <h2 style="color: #374151; font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Summary Statistics</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
              <h3 style="margin: 0; font-size: 32px; font-weight: bold;">${this.analytics.totalProducts}</h3>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Total Products</p>
            </div>
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
              <h3 style="margin: 0; font-size: 32px; font-weight: bold;">${this.analytics.totalCategories}</h3>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Categories</p>
            </div>
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
              <h3 style="margin: 0; font-size: 32px; font-weight: bold;">${this.analytics.totalTypes}</h3>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Product Types</p>
            </div>
            <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
              <h3 style="margin: 0; font-size: 28px; font-weight: bold;">R${this.analytics.averagePrice.toFixed(2)}</h3>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Average Price</p>
            </div>
          </div>
        </div>

        <!-- Price Analytics -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Price Analytics</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
              <h3 style="color: #059669; margin: 0 0 10px 0; font-size: 18px;">Highest Priced Product</h3>
              <p style="margin: 0; font-weight: bold; color: #374151;">${this.analytics.highestPricedProduct?.productName || 'N/A'}</p>
              <p style="margin: 5px 0 0 0; color: #059669; font-size: 20px; font-weight: bold;">R${this.analytics.highestPricedProduct?.price.toFixed(2) || '0.00'}</p>
            </div>
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
              <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 18px;">Lowest Priced Product</h3>
              <p style="margin: 0; font-weight: bold; color: #374151;">${this.analytics.lowestPricedProduct?.productName || 'N/A'}</p>
              <p style="margin: 5px 0 0 0; color: #dc2626; font-size: 20px; font-weight: bold;">R${this.analytics.lowestPricedProduct?.price.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Visual Analytics</h2>
          
          <!-- Category Distribution Chart -->
          ${categoryChartImage ? `
          <div style="margin-bottom: 30px; text-align: center;">
            <h3 style="color: #374151; margin-bottom: 15px;">Products by Category</h3>
            <img src="${categoryChartImage}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          </div>
          ` : ''}

          <!-- Type Distribution Chart -->
          ${typeChartImage ? `
          <div style="margin-bottom: 30px; text-align: center;">
            <h3 style="color: #374151; margin-bottom: 15px;">Products by Type</h3>
            <img src="${typeChartImage}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          </div>
          ` : ''}

          <!-- Price Range Chart -->
          ${priceChartImage ? `
          <div style="margin-bottom: 30px; text-align: center;">
            <h3 style="color: #374151; margin-bottom: 15px;">Price Range Distribution</h3>
            <img src="${priceChartImage}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          </div>
          ` : ''}
        </div>

        <!-- Data Tables -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Detailed Breakdown</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
            <!-- Category Breakdown -->
            <div>
              <h3 style="color: #374151; margin-bottom: 15px;">Products by Category</h3>
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
                <thead>
                  <tr style="background: #f8fafc;">
                    <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left; color: #374151;">Category</th>
                    <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; color: #374151;">Count</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(this.analytics.productsByCategory).map(([category, count]) => `
                    <tr>
                      <td style="padding: 10px; border: 1px solid #e5e7eb;">${category}</td>
                      <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; font-weight: bold;">${count}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Price Range Breakdown -->
            <div>
              <h3 style="color: #374151; margin-bottom: 15px;">Price Range Distribution</h3>
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
                <thead>
                  <tr style="background: #f8fafc;">
                    <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left; color: #374151;">Price Range</th>
                    <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; color: #374151;">Count</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(this.analytics.priceRanges).map(([range, count]) => `
                    <tr>
                      <td style="padding: 10px; border: 1px solid #e5e7eb;">R${range}</td>
                      <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; font-weight: bold;">${count}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #666; font-size: 12px;">
          <p style="margin: 0;">This report was automatically generated by the Run For Rangers Product Management System</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Run For Rangers. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  private async generatePDFDirect(htmlContent: string, timestamp: string): Promise<void> {
    try {
      this.pdfProgress = 'Loading PDF libraries...';
      
      // Dynamic imports for PDF generation
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      this.pdfProgress = 'Preparing content for PDF...';

      // Create a temporary container for the HTML content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-10000px';
      tempDiv.style.top = '-10000px';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      
      // Append to body temporarily to render
      document.body.appendChild(tempDiv);

      this.pdfProgress = 'Converting content to image...';

      // Wait a moment for content to render
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture the content as canvas
      const canvas = await html2canvas(tempDiv, {
        useCORS: true,
        allowTaint: true,
        width: 800,
        height: tempDiv.scrollHeight
      });

      // Clean up - remove the temporary element
      document.body.removeChild(tempDiv);

      this.pdfProgress = 'Creating PDF document...';

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let yPosition = 10; // Start 10mm from top
      
      // Add the image to PDF
      if (imgHeight <= pdfHeight - 20) {
        // Content fits on one page
        pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
      } else {
        // Content spans multiple pages
        let remainingHeight = imgHeight;
        let sourceY = 0;
        
        while (remainingHeight > 0) {
          const pageHeight = Math.min(remainingHeight, pdfHeight - 20);
          
          // Create a cropped canvas for this page
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = (pageHeight * canvas.width) / imgWidth;
          
          const pageCtx = pageCanvas.getContext('2d');
          if (pageCtx) {
            pageCtx.drawImage(
              canvas,
              0, sourceY, canvas.width, pageCanvas.height,
              0, 0, canvas.width, pageCanvas.height
            );
            
            const pageImgData = pageCanvas.toDataURL('image/png');
            pdf.addImage(pageImgData, 'PNG', 10, 10, imgWidth, pageHeight);
          }
          
          remainingHeight -= pageHeight;
          sourceY += pageCanvas.height;
          
          if (remainingHeight > 0) {
            pdf.addPage();
          }
        }
      }

      this.pdfProgress = 'Finalizing PDF...';

      // Generate and download the PDF
      const pdfBlob = pdf.output('blob');
      this.downloadPDF(pdfBlob, `Product_Analytics_Report_${timestamp}.pdf`);

      this.pdfProgress = 'PDF generated successfully!';
      
      setTimeout(() => {
        this.isGeneratingPDF = false;
        this.pdfProgress = '';
      }, 2000);

    } catch (error) {
      console.error('Direct PDF generation error:', error);
      this.pdfProgress = 'Failed to generate PDF. Please try again.';
      
      setTimeout(() => {
        this.isGeneratingPDF = false;
        this.pdfProgress = '';
      }, 3000);
      throw error;
    }
  }

  private downloadPDF(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  private initializeCharts(): void {
    this.createCategoryChart();
    this.createTypeChart();
    this.createPriceChart();
  }

  private createCategoryChart(): void {
    if (this.categoryChart?.nativeElement) {
      const ctx = this.categoryChart.nativeElement.getContext('2d');
      
      const labels = Object.keys(this.analytics.productsByCategory);
      const data = Object.values(this.analytics.productsByCategory);
      
      this.categoryChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40'
            ],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 15,
                font: {
                  size: 11
                }
              }
            },
            title: {
              display: true,
              text: 'Products by Category',
              font: {
                size: 14,
                weight: 'bold'
              }
            }
          }
        }
      });
    }
  }

  private createTypeChart(): void {
    if (this.typeChart?.nativeElement) {
      const ctx = this.typeChart.nativeElement.getContext('2d');
      
      const labels = Object.keys(this.analytics.productsByType);
      const data = Object.values(this.analytics.productsByType);
      
      this.typeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Number of Products',
            data: data,
            backgroundColor: '#36A2EB',
            borderColor: '#36A2EB',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Products by Type',
              font: {
                size: 14,
                weight: 'bold'
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                font: {
                  size: 10
                }
              }
            },
            x: {
              ticks: {
                font: {
                  size: 10
                },
                maxRotation: 45
              }
            }
          }
        }
      });
    }
  }

  private createPriceChart(): void {
    if (this.priceChart?.nativeElement) {
      const ctx = this.priceChart.nativeElement.getContext('2d');
      
      const labels = Object.keys(this.analytics.priceRanges);
      const data = Object.values(this.analytics.priceRanges);
      
      this.priceChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: [
              '#FF6384',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40'
            ],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 15,
                font: {
                  size: 11
                }
              }
            },
            title: {
              display: true,
              text: 'Price Range Distribution',
              font: {
                size: 14,
                weight: 'bold'
              }
            }
          }
        }
      });
    }
  }

  private destroyCharts(): void {
    if (this.categoryChartInstance) {
      this.categoryChartInstance.destroy();
      this.categoryChartInstance = null;
    }
    if (this.typeChartInstance) {
      this.typeChartInstance.destroy();
      this.typeChartInstance = null;
    }
    if (this.priceChartInstance) {
      this.priceChartInstance.destroy();
      this.priceChartInstance = null;
    }
  }

  refreshAnalytics(): void {
    this.destroyCharts();
    this.loadAnalyticsData();
  }
}

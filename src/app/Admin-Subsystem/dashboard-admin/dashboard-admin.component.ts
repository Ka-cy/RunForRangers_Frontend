import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { ManagerialReportComponent } from '../managerial-report/managerial-report.component';
import { UserService } from '../../API-Services/user.service';
import { OrderService } from '../../API-Services/order.service';
import { DeliveryService } from '../../API-Services/delivery.service';
import { DonationService } from '../../API-Services/donation.service';
import { ProductService } from '../../API-Services/product.service';
import { InventoryService } from '../../API-Services/inventory.service';
import { EmployeeService } from '../../API-Services/employee.service';
import { RunnerService } from '../../API-Services/runner.service';

Chart.register(...registerables);

interface DashboardAnalytics {
  totalUsers: number;
  totalSales: number;
  totalEmployees: number;
  totalRunners: number;
  pendingDeliveries: number;
  lowStockItems: number;
  monthlyOrders: { month: string; count: number }[];
  monthlyDonations: { month: string; amount: number }[];
  newUsersPerMonth: { month: string; count: number }[];
  newRunnersPerMonth: { month: string; count: number }[];
}

interface SettingsData {
  youtubeVideoUrl: string;
  companyName: string;
  contactEmail: string;
  welcomeMessage: string;
}

@Component({
  selector: 'app-dashboard-admin',
  imports: [CommonModule, FormsModule, NavBarAdminComponent, ManagerialReportComponent],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit, AfterViewInit {
  
  // Dashboard Data
  analytics: DashboardAnalytics = {
    totalUsers: 0,
    totalSales: 0,
    totalEmployees: 0,
    totalRunners: 0,
    pendingDeliveries: 0,
    lowStockItems: 0,
    monthlyOrders: [],
    monthlyDonations: [],
    newUsersPerMonth: [],
    newRunnersPerMonth: []
  };

  // Chart instances
  ordersChart: Chart | null = null;
  donationsChart: Chart | null = null;
  usersChart: Chart | null = null;
  runnersChart: Chart | null = null;

  // UI State
  isLoading: boolean = true;
  chartsLoading: boolean = false;
  error: string = '';
  selectedFilter: string = '6'; // Default to 6 months
  showSettings: boolean = false;
  showManagerialReport: boolean = false;

  // Settings
  settings: SettingsData = {
    youtubeVideoUrl: 'https://www.youtube.com/embed/XxUrC1v8zp8',
    companyName: 'Run For Rangers',
    contactEmail: 'info@runforrangers.com',
    welcomeMessage: 'Challenge yourself with the ultimate endurance test'
  };

  // Recent data for tables
  pendingDeliveries: any[] = [];
  lowStockInventory: any[] = [];
  recentOrders: any[] = [];

  constructor(
    private router: Router,
    private userService: UserService,
    private orderService: OrderService,
    private deliveryService: DeliveryService,
    private donationService: DonationService,
    private productService: ProductService,
    private inventoryService: InventoryService,
    private employeeService: EmployeeService,
    private runnerService: RunnerService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadSettings();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded in loadDashboardData
  }

  ngOnDestroy(): void {
    // Clean up charts
    this.destroyExistingCharts();
  }

  async loadDashboardData(): Promise<void> {
    try {
      console.log('🚀 Loading Dashboard Data - Prioritizing REAL API data...');
      this.isLoading = true;
      this.error = '';

      // Load basic analytics first (these are simpler and don't affect charts)
      await Promise.all([
        this.loadUserAnalytics(),
        this.loadSalesAnalytics(),
        this.loadEmployeeAnalytics(),
        this.loadRunnerAnalytics(),
        this.loadDeliveryAnalytics(),
        this.loadInventoryAnalytics()
      ]);

      console.log('📊 Basic analytics loaded. Current totals:');
      console.log('- Users:', this.analytics.totalUsers);
      console.log('- Sales: R', this.analytics.totalSales);
      console.log('- Employees:', this.analytics.totalEmployees);
      console.log('- Runners:', this.analytics.totalRunners);
      console.log('- Pending Deliveries:', this.analytics.pendingDeliveries);
      console.log('- Low Stock Items:', this.analytics.lowStockItems);

      // Set loading to false so DOM elements become available
      this.isLoading = false;

      // Wait a bit for DOM to render, then load monthly data which will handle chart initialization
      setTimeout(async () => {
        await this.loadMonthlyData();
      }, 100);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.error = 'Failed to load dashboard data. Please try again.';
      this.isLoading = false;
    }
  }

  private async loadUserAnalytics(): Promise<void> {
    return new Promise((resolve) => {
      try {
        // Get total users from the user service
        this.userService.GetAllUsers().subscribe({
          next: (users: any[]) => {
            this.analytics.totalUsers = users.length;
            resolve();
          },
          error: (error: any) => {
            console.error('Error loading users:', error);
            this.analytics.totalUsers = 0;
            resolve();
          }
        });
      } catch (error) {
        console.error('Error in loadUserAnalytics:', error);
        resolve();
      }
    });
  }

  private async loadSalesAnalytics(): Promise<void> {
    return new Promise((resolve) => {
      try {
        console.log('Loading sales analytics - requesting real data from API...');
        // Get total sales from orders
        this.orderService.getAllOrders().subscribe({
          next: (orders: any) => {
            console.log('Received orders data:', orders);
            console.log('Number of orders:', orders?.length || 0);
            
            if (orders && orders.length > 0) {
              // Check if this appears to be real data vs sample data
              const hasRealisticData = orders.some((order: any) => 
                order.orderId > 50 || // Real systems typically have higher IDs
                order.totalAmount > 1000 || // Real orders might have substantial amounts
                new Date(order.createdAt).getFullYear() === 2025 // Current year data
              );
              
              console.log('Data appears to be real:', hasRealisticData);
              
              // Calculate total sales using totalAmount property
              this.analytics.totalSales = orders.reduce((total: number, order: any) => {
                const amount = order.totalAmount || 0;
                console.log(`Order ${order.orderId}: R${amount}`);
                return total + amount;
              }, 0);
              
              console.log('Total sales calculated: R', this.analytics.totalSales);
              
              // Get recent orders for table display
              this.recentOrders = orders
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 10);
              
              console.log('Recent orders for display:', this.recentOrders);
            } else {
              console.log('No orders data available');
              this.analytics.totalSales = 0;
              this.recentOrders = [];
            }
            
            resolve();
          },
          error: (error: any) => {
            console.error('Failed to load orders from API:', error);
            console.log('Setting sales to 0 due to API error');
            this.analytics.totalSales = 0;
            this.recentOrders = [];
            resolve();
          }
        });
      } catch (error) {
        console.error('Error in loadSalesAnalytics:', error);
        resolve();
      }
    });
  }

  private async loadEmployeeAnalytics(): Promise<void> {
    try {
      // Get total employees from the employee service
      this.employeeService.GetAllEmployees().subscribe({
        next: (employees: any[]) => {
          this.analytics.totalEmployees = employees.length;
        },
        error: (error: any) => {
          console.error('Error loading employees:', error);
          this.analytics.totalEmployees = 0;
        }
      });
    } catch (error) {
      console.error('Error in loadEmployeeAnalytics:', error);
    }
  }

  private async loadRunnerAnalytics(): Promise<void> {
    try {
      // Get total runners from the runner service
      this.runnerService.getAllRunners().subscribe({
        next: (runners: any[]) => {
          this.analytics.totalRunners = runners.length;
        },
        error: (error: any) => {
          console.error('Error loading runners:', error);
          this.analytics.totalRunners = 0;
        }
      });
    } catch (error) {
      console.error('Error in loadRunnerAnalytics:', error);
    }
  }

  private async loadDeliveryAnalytics(): Promise<void> {
    try {
      console.log('Loading delivery analytics from real API...');
      
      // Use the new analytics endpoint for better data
      this.deliveryService.getDeliveryStats().subscribe({
        next: (stats: any) => {
          console.log('Received delivery stats:', stats);
          this.analytics.pendingDeliveries = stats.pendingDeliveries || 0;
          console.log('Pending deliveries from stats:', this.analytics.pendingDeliveries);
        },
        error: (error: any) => {
          console.error('Error loading delivery stats:', error);
          this.analytics.pendingDeliveries = 0;
        }
      });

      // Get pending deliveries for the table display
      this.deliveryService.getPendingDeliveries().subscribe({
        next: (deliveries: any[]) => {
          console.log('Received pending deliveries for table:', deliveries);
          this.pendingDeliveries = deliveries.slice(0, 10); // Limit to 10 for display
          console.log('Pending deliveries for display:', this.pendingDeliveries);
        },
        error: (error: any) => {
          console.error('Error loading pending deliveries:', error);
          this.pendingDeliveries = [];
        }
      });
      
    } catch (error) {
      console.error('Error in loadDeliveryAnalytics:', error);
    }
  }

  private async loadInventoryAnalytics(): Promise<void> {
    return new Promise((resolve) => {
      try {
        console.log('Loading inventory analytics - requesting real data from API...');
        // Load real inventory data
        this.inventoryService.getAll().subscribe({
          next: (inventory: any[]) => {
            console.log('Received inventory data:', inventory);
            console.log('Number of inventory items:', inventory?.length || 0);
            
            if (inventory && inventory.length > 0) {
              // Calculate low stock items (items where quantity is below a threshold, e.g., 10)
              const lowStockThreshold = 10;
              const lowStockItems = inventory.filter(item => item.quantity < lowStockThreshold);
              this.analytics.lowStockItems = lowStockItems.length;
              
              console.log(`Found ${lowStockItems.length} low stock items (threshold: ${lowStockThreshold})`);
              
              // Get actual low stock inventory for table display
              this.lowStockInventory = lowStockItems.slice(0, 10).map(item => ({
                productName: item.productName || item.name || `Product ID: ${item.productId || item.id}`,
                currentStock: item.quantity || 0,
                minStock: lowStockThreshold
              }));
              
              console.log('Low stock inventory for display:', this.lowStockInventory);
              
              // If no low stock items, check if we have any inventory at all
              if (this.lowStockInventory.length === 0) {
                this.analytics.lowStockItems = 0;
                this.lowStockInventory = [];
                console.log('No low stock items found - all inventory levels are adequate');
              }
            } else {
              console.log('No inventory data available from API');
              this.analytics.lowStockItems = 0;
              this.lowStockInventory = [];
            }
            
            resolve();
          },
          error: (error: any) => {
            console.error('Failed to load inventory from API:', error);
            // Set to zero values instead of sample data
            this.analytics.lowStockItems = 0;
            this.lowStockInventory = [];
            console.log('Using zero values due to API error');
            resolve();
          }
        });
      } catch (error) {
        console.error('Error in loadInventoryAnalytics:', error);
        resolve();
      }
    });
  }

  private async loadMonthlyData(): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.chartsLoading = true;
        const months = this.getLastNMonths(parseInt(this.selectedFilter));
        
        // Initialize arrays
        this.analytics.monthlyOrders = [];
        this.analytics.monthlyDonations = [];
        this.analytics.newUsersPerMonth = [];
        this.analytics.newRunnersPerMonth = [];
        
        // Track how many API calls have completed
        let completedCalls = 0;
        const totalCalls = 4;
        
        const checkIfAllLoaded = () => {
          completedCalls++;
          console.log(`Chart data loading progress: ${completedCalls}/${totalCalls}`);
          if (completedCalls === totalCalls) {
            this.chartsLoading = false;
            console.log('All chart data loaded, initializing charts...');
            // All data has been loaded, now update the charts
            // Use a longer timeout to ensure DOM is ready
            setTimeout(() => {
              this.destroyExistingCharts();
              this.initializeCharts();
              resolve();
            }, 1000);
          }
        };
        
        // Load real orders data
        this.orderService.getAllOrders().subscribe({
          next: (orders: any[]) => {
            console.log('Loading monthly orders chart data...');
            console.log('Raw orders data for charts:', orders);
            
            if (orders && orders.length > 0) {
              this.analytics.monthlyOrders = this.calculateMonthlyData(orders, months, 'createdAt');
              console.log('Calculated monthly orders from REAL data:', this.analytics.monthlyOrders);
            } else {
              console.log('No order data available, using zero values');
              this.analytics.monthlyOrders = months.map(month => ({ month, count: 0 }));
            }
            
            checkIfAllLoaded();
          },
          error: (error: any) => {
            console.error('Error loading monthly orders from API:', error);
            // Only use minimal fallback data if API completely fails
            this.analytics.monthlyOrders = months.map(month => ({ month, count: 0 }));
            console.log('Using fallback zero data for monthly orders');
            checkIfAllLoaded();
          }
        });
        
        // Load real donations data
        this.donationService.getAllDonations().subscribe({
          next: (donations: any[]) => {
            console.log('Loading monthly donations chart data...');
            console.log('Raw donations data for charts:', donations);
            
            if (donations && donations.length > 0) {
              this.analytics.monthlyDonations = this.calculateMonthlyDonations(donations, months);
              console.log('Calculated monthly donations from REAL data:', this.analytics.monthlyDonations);
            } else {
              console.log('No donation data available, using zero values');
              this.analytics.monthlyDonations = months.map(month => ({ month, amount: 0 }));
            }
            
            checkIfAllLoaded();
          },
          error: (error: any) => {
            console.error('Error loading monthly donations from API:', error);
            // Only use minimal fallback data if API completely fails
            this.analytics.monthlyDonations = months.map(month => ({ month, amount: 0 }));
            console.log('Using fallback zero data for monthly donations');
            checkIfAllLoaded();
          }
        });
        
        // Load real users data
        this.userService.GetAllUsers().subscribe({
          next: (users: any[]) => {
            console.log('Loading monthly users chart data...');
            console.log('Raw users data for charts:', users);
            
            if (users && users.length > 0) {
              this.analytics.newUsersPerMonth = this.calculateMonthlyData(users, months, 'createdDate');
              console.log('Calculated monthly users from REAL data:', this.analytics.newUsersPerMonth);
            } else {
              console.log('No user data available, using zero values');
              this.analytics.newUsersPerMonth = months.map(month => ({ month, count: 0 }));
            }
            
            checkIfAllLoaded();
          },
          error: (error: any) => {
            console.error('Error loading monthly users from API:', error);
            // Only use minimal fallback data if API completely fails
            this.analytics.newUsersPerMonth = months.map(month => ({ month, count: 0 }));
            console.log('Using fallback zero data for monthly users');
            checkIfAllLoaded();
          }
        });
        
        // Load real runners data
        this.runnerService.getAllRunners().subscribe({
          next: (runners: any[]) => {
            console.log('Loading monthly runners chart data...');
            console.log('Raw runners data for charts:', runners);
            
            if (runners && runners.length > 0) {
              // Try to calculate based on available date fields, or use overall count
              this.analytics.newRunnersPerMonth = this.calculateMonthlyData(runners, months, 'createdDate');
              console.log('Calculated monthly runners from REAL data:', this.analytics.newRunnersPerMonth);
              
              // If no date-based data available, distribute existing runners across months
              if (this.analytics.newRunnersPerMonth.every(item => item.count === 0) && runners.length > 0) {
                const runnersPerMonth = Math.ceil(runners.length / months.length);
                this.analytics.newRunnersPerMonth = months.map(month => ({ 
                  month, 
                  count: runnersPerMonth 
                }));
                console.log('Distributed existing runners across months:', this.analytics.newRunnersPerMonth);
              }
            } else {
              console.log('No runner data available, using zero values');
              this.analytics.newRunnersPerMonth = months.map(month => ({ month, count: 0 }));
            }
            
            checkIfAllLoaded();
          },
          error: (error: any) => {
            console.error('Error loading monthly runners from API:', error);
            // Only use minimal fallback data if API completely fails
            this.analytics.newRunnersPerMonth = months.map(month => ({ month, count: 0 }));
            console.log('Using fallback zero data for monthly runners');
            checkIfAllLoaded();
          }
        });
        
      } catch (error) {
        console.error('Error in loadMonthlyData:', error);
        this.chartsLoading = false;
        resolve();
      }
    });
  }
  
  /**
   * Helper method to calculate monthly data counts from an array of items
   */
  private calculateMonthlyData(items: any[], months: string[], dateField: string): { month: string; count: number }[] {
    console.log(`Calculating monthly data for ${dateField} from ${items.length} items`);
    
    return months.map(month => {
      const monthCount = items.filter(item => {
        // Try multiple possible date field names
        const possibleFields = [dateField, 'createdDate', 'createdAt', 'dateCreated', 'created', 'date'];
        let itemDate: Date | null = null;
        
        for (const field of possibleFields) {
          if (item[field]) {
            try {
              itemDate = new Date(item[field]);
              if (!isNaN(itemDate.getTime())) {
                console.log(`Using date field '${field}' for item:`, item[field], '->', itemDate);
                break;
              }
            } catch (error) {
              // Continue to next field
            }
          }
        }
        
        if (!itemDate || isNaN(itemDate.getTime())) {
          console.log('No valid date found for item:', item);
          return false;
        }
        
        const itemMonthYear = itemDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const matches = itemMonthYear === month;
        
        if (matches) {
          console.log(`Item matches month ${month}:`, item);
        }
        
        return matches;
      }).length;
      
      console.log(`Month ${month}: ${monthCount} items`);
      return { month, count: monthCount };
    });
  }
  
  /**
   * Helper method to calculate monthly donation amounts from an array of donations
   */
  private calculateMonthlyDonations(donations: any[], months: string[]): { month: string; amount: number }[] {
    console.log(`Calculating monthly donations from ${donations.length} donations`);
    
    return months.map(month => {
      const monthTotal = donations
        .filter(donation => {
          // Try multiple possible date field names
          const possibleFields = ['donationDate', 'createdDate', 'createdAt', 'dateCreated', 'created', 'date'];
          let donationDate: Date | null = null;
          
          for (const field of possibleFields) {
            if (donation[field]) {
              try {
                donationDate = new Date(donation[field]);
                if (!isNaN(donationDate.getTime())) {
                  console.log(`Using date field '${field}' for donation:`, donation[field], '->', donationDate);
                  break;
                }
              } catch (error) {
                // Continue to next field
              }
            }
          }
          
          if (!donationDate || isNaN(donationDate.getTime())) {
            console.log('No valid date found for donation:', donation);
            return false;
          }
          
          const donationMonthYear = donationDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          const matches = donationMonthYear === month;
          
          if (matches) {
            console.log(`Donation matches month ${month}:`, donation);
          }
          
          return matches;
        })
        .reduce((total, donation) => {
          const amount = donation.amount || donation.donationAmount || 0;
          console.log(`Adding donation amount: ${amount}`);
          return total + amount;
        }, 0);
      
      console.log(`Month ${month}: R${monthTotal} total donations`);
      return { month, amount: monthTotal };
    });
  }

  private getLastNMonths(n: number): string[] {
    const months = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    }
    return months;
  }

  private initializeCharts(): void {
    console.log('🎯 Initializing charts with data:', {
      monthlyOrders: this.analytics.monthlyOrders,
      monthlyDonations: this.analytics.monthlyDonations,
      newUsersPerMonth: this.analytics.newUsersPerMonth,
      newRunnersPerMonth: this.analytics.newRunnersPerMonth
    });
    
    // Validate data before creating charts
    const hasOrdersData = this.analytics.monthlyOrders && this.analytics.monthlyOrders.length > 0;
    const hasDonationsData = this.analytics.monthlyDonations && this.analytics.monthlyDonations.length > 0;
    const hasUsersData = this.analytics.newUsersPerMonth && this.analytics.newUsersPerMonth.length > 0;
    const hasRunnersData = this.analytics.newRunnersPerMonth && this.analytics.newRunnersPerMonth.length > 0;
    
    console.log('📊 Data validation:', {
      hasOrdersData,
      hasDonationsData,
      hasUsersData,
      hasRunnersData
    });
    
    // Check if DOM elements are ready before creating charts
    this.waitForDOMElements().then(() => {
      console.log('✅ DOM elements ready, creating charts...');
      this.createOrdersChart();
      this.createDonationsChart();
      this.createUsersChart();
      this.createRunnersChart();
      console.log('🎉 All charts created successfully');
    }).catch(error => {
      console.error('❌ Error waiting for DOM elements:', error);
    });
  }

  private async waitForDOMElements(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      const checkElements = () => {
        attempts++;
        
        const ordersCanvas = document.getElementById('ordersChart') as HTMLCanvasElement;
        const donationsCanvas = document.getElementById('donationsChart') as HTMLCanvasElement;
        const usersCanvas = document.getElementById('usersChart') as HTMLCanvasElement;
        const runnersCanvas = document.getElementById('runnersChart') as HTMLCanvasElement;

        const allFound = ordersCanvas && donationsCanvas && usersCanvas && runnersCanvas;
        
        if (allFound) {
          console.log(`✅ All chart canvas elements found after ${attempts} attempts`);
          resolve();
        } else {
          if (attempts >= maxAttempts) {
            console.error(`❌ Chart canvas elements not found after ${maxAttempts} attempts:`, {
              ordersCanvas: !!ordersCanvas,
              donationsCanvas: !!donationsCanvas,
              usersCanvas: !!usersCanvas,
              runnersCanvas: !!runnersCanvas
            });
            reject(new Error('Chart canvas elements not found'));
          } else {
            // Retry after a short delay
            setTimeout(checkElements, 100);
          }
        }
      };
      
      // Start checking immediately
      checkElements();
    });
  }

  private destroyExistingCharts(): void {
    if (this.ordersChart) {
      this.ordersChart.destroy();
      this.ordersChart = null;
    }
    if (this.donationsChart) {
      this.donationsChart.destroy();
      this.donationsChart = null;
    }
    if (this.usersChart) {
      this.usersChart.destroy();
      this.usersChart = null;
    }
    if (this.runnersChart) {
      this.runnersChart.destroy();
      this.runnersChart = null;
    }
  }

  private createOrdersChart(): void {
    const ctx = document.getElementById('ordersChart') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('Orders chart canvas element not found');
      return;
    }

    try {
      const labels = this.analytics.monthlyOrders.map(item => item.month);
      const data = this.analytics.monthlyOrders.map(item => item.count);
      
      console.log('Creating orders chart with:', { labels, data });

      this.ordersChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Orders per Month',
            data: data,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#667eea',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
                callback: function(value: any) {
                  return Math.floor(value);
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            },
            x: {
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          }
        }
      });
      
      console.log('Orders chart created successfully');
    } catch (error) {
      console.error('Error creating orders chart:', error);
    }
  }

  private createDonationsChart(): void {
    const ctx = document.getElementById('donationsChart') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('Donations chart canvas element not found');
      return;
    }

    try {
      const labels = this.analytics.monthlyDonations.map(item => item.month);
      const data = this.analytics.monthlyDonations.map(item => item.amount);
      
      console.log('Creating donations chart with:', { labels, data });

      this.donationsChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Donations per Month (R)',
            data: data,
            backgroundColor: '#10b981',
            borderColor: '#059669',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  return 'R' + context.parsed.y.toLocaleString();
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return 'R' + value.toLocaleString();
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            },
            x: {
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            }
          }
        }
      });
      
      console.log('Donations chart created successfully');
    } catch (error) {
      console.error('Error creating donations chart:', error);
    }
  }

  private createUsersChart(): void {
    const ctx = document.getElementById('usersChart') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('Users chart canvas element not found');
      return;
    }

    try {
      const labels = this.analytics.newUsersPerMonth.map(item => item.month);
      const data = this.analytics.newUsersPerMonth.map(item => item.count);
      
      console.log('Creating users chart with:', { labels, data });

      this.usersChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'New Users per Month',
            data: data,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
                callback: function(value: any) {
                  return Math.floor(value);
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            },
            x: {
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          }
        }
      });
      
      console.log('Users chart created successfully');
    } catch (error) {
      console.error('Error creating users chart:', error);
    }
  }

  private createRunnersChart(): void {
    const ctx = document.getElementById('runnersChart') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('Runners chart canvas element not found');
      return;
    }

    try {
      // Filter out months with zero runners for better visualization
      const runnersData = this.analytics.newRunnersPerMonth.filter(item => item.count > 0);
      
      console.log('Creating runners chart with filtered data:', runnersData);
      
      // If no data, show a placeholder
      const labels = runnersData.length > 0 ? runnersData.map(item => item.month) : ['No Data'];
      const data = runnersData.length > 0 ? runnersData.map(item => item.count) : [1];
      const backgroundColors = runnersData.length > 0 ? [
        '#667eea', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'
      ] : ['#e5e7eb'];
      
      this.runnersChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: backgroundColors,
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverBorderWidth: 3
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
                usePointStyle: true,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  return `${label}: ${value} runner${value !== 1 ? 's' : ''}`;
                }
              }
            }
          },
          cutout: '60%'
        }
      });
      
      console.log('Runners chart created successfully');
    } catch (error) {
      console.error('Error creating runners chart:', error);
    }
  }

  onFilterChange(): void {
    this.chartsLoading = true;
    this.destroyExistingCharts();
    this.loadMonthlyData();
  }

  // Settings Methods
  private loadSettings(): void {
    const savedSettings = localStorage.getItem('dashboardSettings');
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
    }
  }

  saveSettings(): void {
    localStorage.setItem('dashboardSettings', JSON.stringify(this.settings));
    this.showSettings = false;
    alert('Settings saved successfully!');
  }

  toggleSettings(): void {
    this.showSettings = !this.showSettings;
  }

  refreshData(): void {
    this.destroyExistingCharts();
    this.loadDashboardData();
  }

  // Navigation methods
  navigateToDeliveries(): void {
    this.router.navigate(['/deliveries']);
  }

  navigateToInventory(): void {
    this.router.navigate(['/inventory']);
  }

  navigateToUsers(): void {
    this.router.navigate(['/users']);
  }

  navigateToOrders(): void {
    this.router.navigate(['/orders']);
  }

  // --- Minimal user header helpers (safe defaults) ---
  showUserDropdown: boolean = false;

  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
  }

  // Wrapper helpers to perform actions and close the dropdown for better UX
  refreshAndClose(): void {
    this.refreshData();
    this.showUserDropdown = false;
  }

  openSettingsAndClose(): void {
    this.toggleSettings();
    this.showUserDropdown = false;
  }

  openManagerialReport(): void {
    this.showManagerialReport = true;
    this.showUserDropdown = false;
  }

  closeManagerialReport(): void {
    this.showManagerialReport = false;
  }

  getCurrentUserInitials(): string {
    // Prefer sessionStorage/adminData, then localStorage/currentUserLoggedIn, then userService
    try {
      // adminData in sessionStorage (some admin flows use this)
      const adminRaw = sessionStorage.getItem('adminData');
      if (adminRaw) {
        const a = JSON.parse(adminRaw);
        const first = (a.firstName || a.firstname || a.name || '').toString();
        const last = (a.lastName || a.surname || '').toString();
        const initials = ((first[0] || '') + (last[0] || '')).toUpperCase();
        if (initials.trim()) return initials;
      }

      const uRaw = localStorage.getItem('currentUserLoggedIn');
      if (uRaw) {
        const u = JSON.parse(uRaw);
        const first = (u.firstName || u.firstname || u.name || '').toString();
        const last = (u.lastName || u.surname || '').toString();
        const initials = ((first[0] || '') + (last[0] || '')).toUpperCase();
        if (initials.trim()) return initials;
      }

      // Fallback to injected userService currentUser if present
      const svc: any = (this as any).userService;
      if (svc && svc.currentUser) {
        const s = svc.currentUser;
        const first = (s.firstName || s.firstname || s.name || '').toString();
        const last = (s.lastName || s.surname || '').toString();
        const initials = ((first[0] || '') + (last[0] || '')).toUpperCase();
        if (initials.trim()) return initials;
      }
    } catch (e) {
      // ignore parse errors
    }
    return 'AD';
  }

  getCurrentUserName(): string {
    try {
      const adminRaw = sessionStorage.getItem('adminData');
      if (adminRaw) {
        const a = JSON.parse(adminRaw);
        const name = `${a.firstName || a.firstname || a.name || ''} ${a.lastName || a.surname || ''}`.trim();
        if (name) return name;
      }

      const uRaw = localStorage.getItem('currentUserLoggedIn');
      if (uRaw) {
        const u = JSON.parse(uRaw);
        const name = `${u.firstName || u.firstname || u.name || ''} ${u.lastName || u.surname || ''}`.trim();
        if (name) return name;
      }

      const svc: any = (this as any).userService;
      if (svc && svc.currentUser) {
        const s = svc.currentUser;
        const name = `${s.firstName || s.firstname || s.name || ''} ${s.lastName || s.surname || ''}`.trim();
        if (name) return name;
      }
    } catch (e) {}
    return 'Admin';
  }

  getCurrentUserRole(): string {
    try {
      const adminRaw = sessionStorage.getItem('adminData');
      if (adminRaw) {
        const a = JSON.parse(adminRaw);
        if (a.role) return a.role;
      }

      const uRaw = localStorage.getItem('currentUserLoggedIn');
      if (uRaw) {
        const u = JSON.parse(uRaw);
        if (u.role || u.userRole) return u.role || u.userRole;
      }

      const svc: any = (this as any).userService;
      if (svc && svc.currentUser) return svc.currentUser.role || 'Administrator';
    } catch (e) {}
    return 'Administrator';
  }

  // Logout helper used by header dropdown
  logout(): void {
    try {
      localStorage.removeItem('currentUserLoggedIn');
    } catch (e) { /* ignore */ }
    this.router.navigate(['/signin']);
  }

  // Handle window resize to make charts responsive
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    setTimeout(() => {
      if (this.ordersChart) this.ordersChart.resize();
      if (this.donationsChart) this.donationsChart.resize();
      if (this.usersChart) this.usersChart.resize();
      if (this.runnersChart) this.runnersChart.resize();
    }, 100);
  }
}

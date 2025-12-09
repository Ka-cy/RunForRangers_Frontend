import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { IDelivery, IDeliveryStatus, IOrder } from '../../Interfaces/idelivery';
import { DeliveryService } from '../../API-Services/delivery.service';
import { NotificationService } from '../../API-Services/notification.service';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { NotificationModalComponent } from '../../Notification/notification.component';
import { DeleteDeliveryComponent } from '../delete-delivery/delete-delivery.component';

@Component({
  selector: 'app-delivery-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NavBarAdminComponent, NotificationModalComponent],
  templateUrl: './delivery-dashboard.component.html',
  styleUrl: './delivery-dashboard.component.css'
})
export class DeliveryDashboardComponent implements OnInit {
  showProfileMenu: boolean = false;
  activeSection: string = 'delivery';
  
  deliveries: IDelivery[] = [];
  filteredDeliveries: IDelivery[] = [];
  deliveryStatuses: IDeliveryStatus[] = [];
  orders: IOrder[] = [];
  ordersWithoutDeliveries: IOrder[] = [];
  
  searchTerm: string = '';
  selectedStatus: string = '';
  sortField: string = 'deliveryDate';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  isLoading: boolean = false;
  error: string = '';
  showOrderSelection: boolean = false;

  constructor(
    private deliveryService: DeliveryService,
    private router: Router,
    private dialog: MatDialog,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadDeliveries();
    this.loadDeliveryStatuses();
    this.loadOrdersWithoutDeliveries();
  }

  // Robust header helpers: check sessionStorage.adminData, localStorage.currentUserLoggedIn
  getCurrentUserInitials(): string {
    try {
      const adminRaw = sessionStorage.getItem('adminData');
      if (adminRaw) {
        const a: any = JSON.parse(adminRaw);
        const first = (a.firstName || a.firstname || a.name || '').toString();
        const last = (a.lastName || a.surname || '').toString();
        const initials = ((first[0] || '') + (last[0] || '')).toUpperCase();
        if (initials.trim()) return initials;
      }

      const uRaw = localStorage.getItem('currentUserLoggedIn');
      if (uRaw) {
        const u: any = JSON.parse(uRaw);
        const first = (u.firstName || u.firstname || u.name || '').toString();
        const last = (u.lastName || u.surname || '').toString();
        const initials = ((first[0] || '') + (last[0] || '')).toUpperCase();
        if (initials.trim()) return initials;
      }
    } catch (e) {}
    return 'AD';
  }

  getCurrentUserName(): string {
    try {
      const adminRaw = sessionStorage.getItem('adminData');
      if (adminRaw) {
        const a: any = JSON.parse(adminRaw);
        const name = `${a.firstName || a.firstname || a.name || ''} ${a.lastName || a.surname || ''}`.trim();
        if (name) return name;
      }

      const uRaw = localStorage.getItem('currentUserLoggedIn');
      if (uRaw) {
        const u: any = JSON.parse(uRaw);
        const name = `${u.firstName || u.firstname || u.name || ''} ${u.lastName || u.surname || ''}`.trim();
        if (name) return name;
      }
    } catch (e) {}
    return 'Admin';
  }

  getCurrentUserRole(): string {
    try {
      const adminRaw = sessionStorage.getItem('adminData');
      if (adminRaw) {
        const a: any = JSON.parse(adminRaw);
        if (a.role) return a.role;
      }

      const uRaw = localStorage.getItem('currentUserLoggedIn');
      if (uRaw) {
        const u: any = JSON.parse(uRaw);
        if (u.role || u.userRole) return u.role || u.userRole;
      }
    } catch (e) {}
    return 'Administrator';
  }

  // Add HostListener to close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-info')) {
      this.showProfileMenu = false;
    }
  }

  loadDeliveries(): void {
    this.isLoading = true;
    this.deliveryService.getAllDeliveries().subscribe({
      next: (deliveries) => {
        this.deliveries = deliveries || [];
        this.filteredDeliveries = [...this.deliveries];
        this.isLoading = false;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading deliveries:', error);
        this.error = 'Failed to load deliveries. Please try again.';
        this.deliveries = [];
        this.filteredDeliveries = [];
        this.isLoading = false;
      }
    });
  }

  loadDeliveryStatuses(): void {
    this.deliveryService.getDeliveryStatuses().subscribe({
      next: (statuses) => {
        this.deliveryStatuses = statuses;
      },
      error: (error) => {
        console.error('Error loading delivery statuses:', error);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.deliveries];

    // Search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(delivery =>
        delivery.trackingNumber.toLowerCase().includes(searchLower) ||
        delivery.deliveryStatus.toLowerCase().includes(searchLower) ||
        delivery.deliveryId.toString().includes(this.searchTerm)
      );
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(delivery => delivery.deliveryStatus === this.selectedStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[this.sortField as keyof IDelivery];
      let bValue: any = b[this.sortField as keyof IDelivery];

      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredDeliveries = filtered;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatusFilter(): void {
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
    if (this.sortField !== field) return '';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  editDelivery(deliveryId: number): void {
    this.router.navigate(['/delivery/edit', deliveryId]);
  }

  deleteDelivery(delivery: IDelivery): void {
    const dialogRef = this.dialog.open(DeleteDeliveryComponent, {
      width: '400px',
      data: { delivery }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDeliveries();
      }
    });
  }

  createDelivery(): void {
    this.router.navigate(['/delivery/create']);
  }

  formatDate(date: Date | string): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'in transit':
      case 'in_transit':
        return 'status-in-transit';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      case 'failed':
        return 'status-failed';
      default:
        return 'status-default';
    }
  }

  trackDelivery(trackingNumber: string): void {
    console.log('Tracking delivery:', trackingNumber);
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  manageCouriers(): void {
    this.router.navigate(['/manage-couriers']);
  }

  viewAnalytics(): void {
    this.router.navigate(['/delivery-analytics']);
  }

  loadOrdersWithoutDeliveries(): void {
    this.deliveryService.getOrdersWithoutDeliveries().subscribe({
      next: (orders) => {
        this.ordersWithoutDeliveries = orders;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.notificationService.showError('Load Orders Error', 'Failed to load orders for delivery creation. Please try again.');
      }
    });
  }

  toggleOrderSelection(): void {
    this.showOrderSelection = !this.showOrderSelection;
  }

  createDeliveryFromOrder(orderId: number): void {
    this.isLoading = true;
    this.deliveryService.createDeliveryFromOrder(orderId).subscribe({
      next: (delivery) => {
        console.log('Delivery created successfully:', delivery);
        this.notificationService.showSuccess('Delivery Created', 'Delivery has been successfully created from order.');
        this.loadDeliveries();
        this.loadOrdersWithoutDeliveries();
        this.showOrderSelection = false;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating delivery:', error);
        this.notificationService.showError('Creation Failed', 'Failed to create delivery. Please try again.');
        this.isLoading = false;
      }
    });
  }

  logout(): void {
    localStorage.removeItem('currentUserLoggedIn');
    sessionStorage.removeItem('adminData');
    this.showProfileMenu = false;
    this.router.navigate(['/home']);
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { IDelivery } from '../../Interfaces/idelivery';
import { DeliveryService } from '../../API-Services/delivery.service';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';

@Component({
  selector: 'app-delete-delivery',
  standalone: true,
  imports: [CommonModule, NavBarAdminComponent],
  templateUrl: './delete-delivery.component.html',
  styleUrl: './delete-delivery.component.css'
})
export class DeleteDeliveryComponent implements OnInit {
  showProfileMenu: boolean = false;
  activeSection: string = 'delivery';
  
  deliveryId: number;
  delivery: IDelivery | null = null;
  
  isLoading: boolean = false;
  isDeleting: boolean = false;
  error: string = '';
  showConfirmation: boolean = false;

  constructor(
    private deliveryService: DeliveryService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.deliveryId = +this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.loadDeliveryData();
  }

  public loadDeliveryData(): void {
    this.isLoading = true;
    this.error = '';
    
    this.deliveryService.getDeliveryById(this.deliveryId).subscribe({
      next: (delivery) => {
        if (delivery) {
          this.delivery = delivery;
        } else {
          this.error = 'Delivery not found.';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading delivery:', error);
        this.error = 'Failed to load delivery data. Please try again.';
        this.isLoading = false;
      }
    });
  }

  showDeleteConfirmation(): void {
    this.showConfirmation = true;
  }

  hideDeleteConfirmation(): void {
    this.showConfirmation = false;
  }

  confirmDelete(): void {
    if (!this.delivery) return;

    this.isDeleting = true;
    this.deliveryService.deleteDelivery(this.delivery.deliveryId).subscribe({
      next: (response) => {
        console.log('Delivery deleted successfully:', response);
        alert('Delivery deleted successfully');
        this.router.navigate(['/delivery']);
      },
      error: (error) => {
        console.error('Error deleting delivery:', error);
        alert('Failed to delete delivery. Please try again.');
        this.isDeleting = false;
        this.showConfirmation = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/delivery']);
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'badge-warning';
      case 'processing':
        return 'badge-info';
      case 'shipped':
        return 'badge-primary';
      case 'in transit':
        return 'badge-secondary';
      case 'delivered':
        return 'badge-success';
      case 'cancelled':
        return 'badge-danger';
      case 'returned':
        return 'badge-dark';
      default:
        return 'badge-light';
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(date: Date | string | undefined): string {
    if (!date) return 'Not set';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
}

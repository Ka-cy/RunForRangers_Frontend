import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ICourier } from '../../Interfaces/idelivery';
import { DeliveryService } from '../../API-Services/delivery.service';
import { NotificationService } from '../../API-Services/notification.service';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { NotificationModalComponent } from '../../Notification/notification.component';

@Component({
  selector: 'app-manage-couriers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NavBarAdminComponent, NotificationModalComponent],
  templateUrl: './manage-couriers.component.html',
  styleUrl: './manage-couriers.component.css'
})
export class ManageCouriersComponent implements OnInit {
  showProfileMenu: boolean = false;
  activeSection: string = 'delivery';
  
  couriers: ICourier[] = [];
  filteredCouriers: ICourier[] = [];
  
  courierForm!: FormGroup;
  isEditing: boolean = false;
  selectedCourier: ICourier | null = null;
  
  isLoading: boolean = false;
  isSaving: boolean = false;
  error: string = '';
  searchTerm: string = '';

  constructor(
    private fb: FormBuilder,
    private deliveryService: DeliveryService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCouriers();
  }

  private initializeForm(): void {
    this.courierForm = this.fb.group({
      courierName: ['', [Validators.required, Validators.minLength(2)]],
      contactNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      imageUrl: ['']
    });
  }

  loadCouriers(): void {
    this.isLoading = true;
    this.deliveryService.getAllCouriers().subscribe({
      next: (couriers) => {
        this.couriers = couriers;
        this.filteredCouriers = [...couriers];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading couriers:', error);
        this.error = 'Failed to load couriers';
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCouriers = [...this.couriers];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredCouriers = this.couriers.filter(courier =>
      courier.courierName.toLowerCase().includes(term) ||
      courier.email.toLowerCase().includes(term) ||
      courier.contactNumber.includes(term)
    );
  }

  onSubmit(): void {
    if (this.courierForm.valid) {
      this.isSaving = true;
      const formValue = this.courierForm.value;
      
      if (this.isEditing && this.selectedCourier) {
        const updatedCourier: ICourier = {
          ...this.selectedCourier,
          ...formValue
        };
        
        this.deliveryService.updateCourier(updatedCourier).subscribe({
          next: () => {
            this.notificationService.showSuccess('Courier updated successfully', 'Success');
            this.resetForm();
            this.loadCouriers();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error updating courier:', error);
            this.notificationService.showError('Failed to update courier', 'Error');
            this.error = 'Failed to update courier';
            this.isSaving = false;
          }
        });
      } else {
        const newCourier: Partial<ICourier> = {
          ...formValue,
          courierId: 0 // Will be set by backend
        };
        
        this.deliveryService.createCourier(newCourier as ICourier).subscribe({
          next: () => {
            this.notificationService.showSuccess('Courier created successfully', 'Success');
            this.resetForm();
            this.loadCouriers();
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error creating courier:', error);
            this.notificationService.showError('Failed to create courier', 'Error');
            this.error = 'Failed to create courier';
            this.isSaving = false;
          }
        });
      }
    }
  }

  editCourier(courier: ICourier): void {
    this.isEditing = true;
    this.selectedCourier = courier;
    this.courierForm.patchValue({
      courierName: courier.courierName,
      contactNumber: courier.contactNumber,
      email: courier.email,
      imageUrl: courier.imageUrl || ''
    });
  }

  deleteCourier(courier: ICourier): void {
    this.notificationService.showWarning(
      `Are you sure you want to delete courier "${courier.courierName}"?`,
      'Confirm Deletion'
    );
    
    this.notificationService.confirmation$.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.deliveryService.deleteCourier(courier.courierId).subscribe({
          next: () => {
            this.notificationService.showSuccess('Courier deleted successfully', 'Success');
            this.loadCouriers();
          },
          error: (error) => {
            console.error('Error deleting courier:', error);
            this.notificationService.showError('Failed to delete courier', 'Error');
            this.error = 'Failed to delete courier';
          }
        });
      }
    });
  }

  resetForm(): void {
    this.courierForm.reset();
    this.isEditing = false;
    this.selectedCourier = null;
    this.error = '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.courierForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.courierForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['pattern']) return 'Please enter a valid phone number (10 digits)';
      if (field.errors['minlength']) return `${fieldName} must be at least 2 characters`;
    }
    return '';
  }

  goBack(): void {
    this.router.navigate(['/delivery']);
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

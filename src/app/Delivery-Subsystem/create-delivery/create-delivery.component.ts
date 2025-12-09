import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IDelivery, IDeliveryStatus, IDeliveryAddress } from '../../Interfaces/idelivery';
import { DeliveryService } from '../../API-Services/delivery.service';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';

@Component({
  selector: 'app-create-delivery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavBarAdminComponent],
  templateUrl: './create-delivery.component.html',
  styleUrl: './create-delivery.component.css'
})
export class CreateDeliveryComponent implements OnInit {
  showProfileMenu: boolean = false;
  activeSection: string = 'delivery';
  
  deliveryForm!: FormGroup;
  deliveryStatuses: IDeliveryStatus[] = [];
  
  isLoading: boolean = false;
  isSaving: boolean = false;
  error: string = '';

  constructor(
    private fb: FormBuilder,
    private deliveryService: DeliveryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadDropdownData();
  }

  private initializeForm(): void {
    this.deliveryForm = this.fb.group({
      orderId: ['', [Validators.required, Validators.min(1)]],
      deliveryAddressId: ['', [Validators.required, Validators.min(1)]],
      deliveryStatusId: ['', [Validators.required, Validators.min(1)]],
      deliveryFeeId: ['', [Validators.required, Validators.min(1)]],
      deliveryDate: ['', Validators.required],
      deliveryStatus: ['', Validators.required],
      trackingNumber: ['']
    });
  }

  private loadDropdownData(): void {
    this.deliveryService.getDeliveryStatuses().subscribe({
      next: (statuses) => {
        this.deliveryStatuses = statuses;
      },
      error: (error) => {
        console.error('Error loading delivery statuses:', error);
        this.error = 'Failed to load delivery statuses';
      }
    });
  }

  onSubmit(): void {
    if (this.deliveryForm.valid) {
      this.isSaving = true;
      this.error = '';
      
      const formValue = this.deliveryForm.value;
      
      const newDelivery: IDelivery = {
        deliveryId: 0, // Will be set by backend
        deliveryStatusId: parseInt(formValue.deliveryStatusId),
        deliveryFeeId: parseInt(formValue.deliveryFeeId),
        orderId: parseInt(formValue.orderId),
        deliveryAddressId: parseInt(formValue.deliveryAddressId),
        deliveryDate: new Date(formValue.deliveryDate),
        deliveryStatus: formValue.deliveryStatus,
        trackingNumber: formValue.trackingNumber || this.deliveryService.generateTrackingNumber()
      };

      this.deliveryService.createDelivery(newDelivery).subscribe({
        next: (response) => {
          console.log('Delivery created successfully:', response);
          this.router.navigate(['/delivery']);
        },
        error: (error) => {
          console.error('Error creating delivery:', error);
          this.error = 'Failed to create delivery. Please try again.';
          this.isSaving = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.deliveryForm.controls).forEach(key => {
      const control = this.deliveryForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.router.navigate(['/delivery']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.deliveryForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.deliveryForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['min']) return `${fieldName} must be greater than 0`;
    }
    return '';
  }

  generateTrackingNumber(): void {
    const trackingNumber = this.deliveryService.generateTrackingNumber();
    this.deliveryForm.patchValue({ trackingNumber });
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

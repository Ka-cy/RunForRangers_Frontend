import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IDelivery, IDeliveryStatus, ICourier } from '../../Interfaces/idelivery';
import { DeliveryService } from '../../API-Services/delivery.service';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';

@Component({
  selector: 'app-edit-delivery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavBarAdminComponent],
  templateUrl: './edit-delivery.component.html',
  styleUrl: './edit-delivery.component.css'
})
export class EditDeliveryComponent implements OnInit {
  showProfileMenu: boolean = false;
  activeSection: string = 'delivery';
  
  deliveryForm!: FormGroup;
  deliveryId: number;
  currentDelivery: IDelivery | null = null;
  
  deliveryStatuses: IDeliveryStatus[] = [];
  couriers: ICourier[] = [];
  
  isLoading: boolean = false;
  isSaving: boolean = false;
  error: string = '';

  constructor(
    private fb: FormBuilder,
    private deliveryService: DeliveryService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.deliveryId = +this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadDropdownData();
    this.loadDeliveryData();
  }

  private initializeForm(): void {
    this.deliveryForm = this.fb.group({
      orderId: [{value: '', disabled: true}, Validators.required],
      deliveryAddressId: [{value: '', disabled: true}, Validators.required],
      deliveryStatusId: ['', Validators.required],
      deliveryFeeId: [{value: '', disabled: true}, Validators.required],
      deliveryDate: [{value: '', disabled: true}, Validators.required],
      trackingNumber: [{value: '', disabled: true}, Validators.required],
      deliveryStatus: ['', Validators.required],
      waybill: [''],
      courierId: ['']
    });
  }

  private loadDropdownData(): void {
    this.deliveryService.getDeliveryStatuses().subscribe({
      next: (statuses) => {
        this.deliveryStatuses = statuses;
      },
      error: (error) => {
        console.error('Error loading delivery statuses:', error);
      }
    });

    this.deliveryService.getAllCouriers().subscribe({
      next: (couriers) => {
        this.couriers = couriers;
      },
      error: (error) => {
        console.error('Error loading couriers:', error);
      }
    });
  }

  loadDeliveryData(): void {
    this.isLoading = true;
    this.deliveryService.getDeliveryById(this.deliveryId).subscribe({
      next: (delivery) => {
        this.currentDelivery = delivery;
        this.populateForm(delivery);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading delivery:', error);
        this.error = 'Failed to load delivery data';
        this.isLoading = false;
      }
    });
  }

  private populateForm(delivery: IDelivery): void {
    this.deliveryForm.patchValue({
      orderId: delivery.orderId,
      deliveryAddressId: delivery.deliveryAddressId,
      deliveryStatusId: delivery.deliveryStatusId,
      deliveryFeeId: delivery.deliveryFeeId,
      deliveryDate: this.formatDateForInput(delivery.deliveryDate),
      trackingNumber: delivery.trackingNumber,
      deliveryStatus: delivery.deliveryStatus,
      waybill: delivery.waybill || '',
      courierId: delivery.courierId || ''
    });
    
    // Setup status change listener
    this.deliveryForm.get('deliveryStatus')?.valueChanges.subscribe(status => {
      this.onStatusChange(status);
    });
    
    // Initial check for waybill editing
    this.onStatusChange(delivery.deliveryStatus);
  }

  onStatusChange(status: string): void {
    const waybillControl = this.deliveryForm.get('waybill');
    
    if (status?.toLowerCase() === 'in transit') {
      waybillControl?.enable();
    } else {
      waybillControl?.disable();
    }
  }

  private formatDateForInput(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  }

  onSubmit(): void {
    if (this.deliveryForm.valid && this.currentDelivery) {
      this.isSaving = true;
      this.error = '';
      
      const formValue = this.deliveryForm.getRawValue(); // Get all values including disabled ones
      const updatedDelivery: IDelivery = {
        ...this.currentDelivery,
        deliveryStatusId: parseInt(formValue.deliveryStatusId),
        deliveryStatus: formValue.deliveryStatus,
        waybill: formValue.waybill,
        courierId: formValue.courierId ? parseInt(formValue.courierId) : undefined
      };

      // Update delivery status and basic info
      this.deliveryService.updateDelivery(updatedDelivery).subscribe({
        next: (response) => {
          console.log('Delivery updated successfully:', response);
          
          // If waybill was updated and status is "In Transit", update waybill separately
          if (formValue.deliveryStatus?.toLowerCase() === 'in transit' && formValue.waybill) {
            this.deliveryService.updateWaybill(this.deliveryId, formValue.waybill).subscribe({
              next: () => {
                console.log('Waybill updated successfully');
                this.handleCourierAssignment(formValue.courierId);
              },
              error: (error) => {
                console.error('Error updating waybill:', error);
                this.handleCourierAssignment(formValue.courierId);
              }
            });
          } else {
            this.handleCourierAssignment(formValue.courierId);
          }
        },
        error: (error) => {
          console.error('Error updating delivery:', error);
          this.error = 'Failed to update delivery. Please try again.';
          this.isSaving = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private handleCourierAssignment(courierId: string): void {
    if (courierId) {
      this.deliveryService.assignCourier(this.deliveryId, parseInt(courierId)).subscribe({
        next: () => {
          console.log('Courier assigned successfully');
          this.router.navigate(['/delivery']);
        },
        error: (error) => {
          console.error('Error assigning courier:', error);
          this.router.navigate(['/delivery']);
        }
      });
    } else {
      this.router.navigate(['/delivery']);
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

  goBack(): void {
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
    }
    return '';
  }

  generateTrackingNumber(): void {
    const trackingNumber = this.deliveryService.generateTrackingNumber();
    this.deliveryForm.patchValue({ trackingNumber });
  }

  formatDateTime(date: Date | string): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

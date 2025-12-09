import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../API-Services/product.service';
import { NotificationService } from '../../API-Services/notification.service';
import { Iproductsize, IsizeType } from '../../Interfaces/iproduct';
import { NavBarAdminComponent } from "../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component";
import { NotificationModalComponent } from '../../Notification/notification.component';

@Component({
  selector: 'app-manage-sizes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavBarAdminComponent, NotificationModalComponent],
  templateUrl: './manage-sizes.component.html',
  styleUrl: './manage-sizes.component.css'
})
export class ManageSizesComponent implements OnInit {
  sizes: Iproductsize[] = [];
  sizeTypes: IsizeType[] = [];
  sizeForm: FormGroup;
  showForm = false;
  editingSize: Iproductsize | null = null;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private productService: ProductService,
    private formBuilder: FormBuilder,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.sizeForm = this.formBuilder.group({
      sizeName: ['', [Validators.required, Validators.minLength(1)]],
      sizeDescription: ['', [Validators.required, Validators.minLength(3)]],
      sizeTypeId: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadSizes();
    this.loadSizeTypes();
  }

  loadSizeTypes(): void {
    this.productService.GetSizeTypes().subscribe({
      next: (sizeTypes) => {
        this.sizeTypes = sizeTypes.filter(st => st.isActive);
        this.error = null;
      },
      error: (error: any) => {
        console.error('Error loading size types:', error);

        // Create user-friendly error message with developer context
        const errorCode = `SIZETYPE_LOAD_${error?.status || 'UNKNOWN'}_${Date.now()}`;

        let userMessage = '❌ Unable to load size types.\n\n';
        userMessage += '📸 Please screenshot this message and email it to: support@runforrangers.com\n\n';
        userMessage += '💡 Tell support: "Cannot see size type dropdown. Error code: ' + errorCode + '"\n\n';

        // Add specific error context for developers
        if (error?.status === 401) {
          userMessage += '🔍 Developer Info: Unauthorized - Authentication token may be expired\n';
        } else if (error?.status === 403) {
          userMessage += '🔍 Developer Info: Forbidden - User lacks permission to view size types\n';
        } else if (error?.status === 500) {
          userMessage += '🔍 Developer Info: Server error - Check backend size type endpoint\n';
        } else {
          userMessage += '🔍 Developer Info: Network or server connectivity issue\n';
        }

        console.error('=== SIZE TYPE LOAD ERROR ===');
        console.error('Error Code:', errorCode);
        console.error('Full Error Object:', error);
        console.error('===========================');

        this.error = userMessage;
        this.notificationService.showError(userMessage, 'Load Failed - Contact Support');
      }
    });
  }

  loadSizes(): void {
    this.productService.GetProductSizes().subscribe({
      next: (sizes) => {
        this.sizes = sizes;
        this.error = null;
      },
      error: (error: any) => {
        console.error('Error loading sizes:', error);

        // Create user-friendly error message with developer context
        const errorCode = `SIZE_LOAD_${error?.status || 'UNKNOWN'}_${Date.now()}`;

        let userMessage = '❌ Unable to load product sizes.\n\n';
        userMessage += '📸 Please screenshot this message and email it to: support@runforrangers.com\n\n';
        userMessage += '💡 Tell support: "Cannot see product sizes list. Error code: ' + errorCode + '"\n\n';

        // Add specific error context for developers
        if (error?.status === 401) {
          userMessage += '🔍 Developer Info: Unauthorized - Authentication token may be expired\n';
        } else if (error?.status === 403) {
          userMessage += '🔍 Developer Info: Forbidden - User lacks permission to view product sizes\n';
        } else if (error?.status === 500) {
          userMessage += '🔍 Developer Info: Server error - Check backend product size endpoint\n';
        } else {
          userMessage += '🔍 Developer Info: Network or server connectivity issue\n';
        }

        console.error('=== PRODUCT SIZE LOAD ERROR ===');
        console.error('Error Code:', errorCode);
        console.error('Full Error Object:', error);
        console.error('===============================');

        this.error = userMessage;
        this.notificationService.showError(userMessage, 'Load Failed - Contact Support');
      }
    });
  }

  showAddForm(): void {
    this.showForm = true;
    this.editingSize = null;
    this.sizeForm.reset();
    this.clearMessages();
  }

  showEditForm(size: Iproductsize): void {
    this.showForm = true;
    this.editingSize = size;
    this.sizeForm.patchValue({
      sizeName: size.sizeName,
      sizeDescription: size.sizeDescription,
      sizeTypeId: size.sizeTypeId
    });
    this.clearMessages();
  }

  deleteSize(size: Iproductsize): void {
    this.notificationService.showWarning(
      `Are you sure you want to delete "${size.sizeName}"?`,
      'Confirm Deletion'
    );
    
    this.notificationService.confirmation$.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.productService.DeleteProductSize(size.productSizeId).subscribe({
          next: (response: any) => {
            this.notificationService.showSuccess(
              response?.message || 'Size deleted successfully!',
              'Success'
            );
            this.error = null;
            this.loadSizes();
          },
          error: (error: any) => {
            console.error('Error deleting size:', error);
            
            let errorMessage = 'Failed to delete size. Please try again.';
            
            if (error?.error?.message) {
              errorMessage = error.error.message;
            } else if (error?.status === 400) {
              errorMessage = 'Cannot delete this size as it is being used by existing products.';
            } else if (error?.status === 404) {
              errorMessage = 'Size not found. It may have already been deleted.';
              this.loadSizes();
            } else if (error?.status === 500) {
              errorMessage = 'Server error occurred while deleting size. Please contact support.';
            }
            
            this.notificationService.showError(errorMessage, 'Error');
            this.error = errorMessage;
            this.success = null;
          }
        });
      }
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingSize = null;
    this.sizeForm.reset();
    this.clearMessages();
  }

  onSubmit(): void {
    if (this.sizeForm.valid) {
      const formValue = this.sizeForm.value;
      
      if (this.editingSize) {
        // Update existing size
        const updatedSize: Iproductsize = {
          ...this.editingSize,
          sizeName: formValue.sizeName,
          sizeDescription: formValue.sizeDescription,
          sizeTypeId: parseInt(formValue.sizeTypeId)
        };

        this.productService.UpdateProductSize(updatedSize).subscribe({
          next: (result: any) => {
            this.notificationService.showSuccess('Size updated successfully!', 'Success');
            this.loadSizes();
            this.cancelForm();
          },
          error: (error: any) => {
            console.error('Error updating size:', error);

            // Create user-friendly error message with developer context
            const errorCode = `SIZE_UPDATE_${error?.status || 'UNKNOWN'}_${Date.now()}`;
            const developerInfo = `Error Code: ${errorCode} | Status: ${error?.status} | URL: ${error?.url || 'N/A'}`;

            let userMessage = '❌ Unable to update product size.\n\n';
            userMessage += '📸 Please screenshot this message and email it to: support@runforrangers.com\n\n';
            userMessage += '💡 Tell support: "Error updating product size. Error code: ' + errorCode + '"\n\n';

            // Add specific error context for developers
            if (error?.error?.errors) {
              const validationErrors = Object.values(error.error.errors).flat();
              userMessage += `🔍 Developer Info: Validation failed - ${validationErrors.join(', ')}\n`;
            } else if (error?.error?.message) {
              userMessage += `🔍 Developer Info: ${error.error.message}\n`;
            } else if (error?.status === 400) {
              userMessage += '🔍 Developer Info: Bad Request - Check data format and required fields\n';
            } else if (error?.status === 401) {
              userMessage += '🔍 Developer Info: Unauthorized - Authentication token may be expired\n';
            } else if (error?.status === 403) {
              userMessage += '🔍 Developer Info: Forbidden - User lacks permission to update product sizes\n';
            } else if (error?.status === 404) {
              userMessage += '🔍 Developer Info: Product size not found - May have been deleted\n';
            } else if (error?.status === 409) {
              userMessage += '🔍 Developer Info: Conflict - Product size name may already exist\n';
            } else if (error?.status === 500) {
              userMessage += '🔍 Developer Info: Server error - Check backend logs for stack trace\n';
            } else {
              userMessage += '🔍 Developer Info: Unknown error - Check network connectivity and server status\n';
            }

            // Log full error details for developers
            console.error('=== PRODUCT SIZE UPDATE ERROR ===');
            console.error('Error Code:', errorCode);
            console.error('Full Error Object:', error);
            console.error('Request Payload:', updatedSize);
            console.error('================================');

            this.notificationService.showError(userMessage, 'Update Failed - Contact Support');
          }
        });
      } else {
        // Create new size
        const newSize: Iproductsize = {
          productSizeId: 0, // Will be set by backend
          sizeName: formValue.sizeName,
          sizeDescription: formValue.sizeDescription,
          sizeTypeId: parseInt(formValue.sizeTypeId),
          isActive: true
        };

        this.productService.AddProductSize(newSize).subscribe({
          next: (result: any) => {
            this.notificationService.showSuccess('Size created successfully!', 'Success');
            this.loadSizes();
            this.cancelForm();
          },
          error: (error: any) => {
            console.error('Error creating size:', error);

            // Create user-friendly error message with developer context
            const errorCode = `SIZE_CREATE_${error?.status || 'UNKNOWN'}_${Date.now()}`;
            const developerInfo = `Error Code: ${errorCode} | Status: ${error?.status} | URL: ${error?.url || 'N/A'}`;

            let userMessage = '❌ Unable to create product size.\n\n';
            userMessage += '📸 Please screenshot this message and email it to: support@runforrangers.com\n\n';
            userMessage += '💡 Tell support: "Error creating product size. Error code: ' + errorCode + '"\n\n';

            // Add specific error context for developers
            if (error?.error?.errors) {
              const validationErrors = Object.values(error.error.errors).flat();
              userMessage += `🔍 Developer Info: Validation failed - ${validationErrors.join(', ')}\n`;
            } else if (error?.error?.message) {
              userMessage += `🔍 Developer Info: ${error.error.message}\n`;
            } else if (error?.status === 400) {
              userMessage += '🔍 Developer Info: Bad Request - Check data format and required fields\n';
            } else if (error?.status === 401) {
              userMessage += '🔍 Developer Info: Unauthorized - Authentication token may be expired\n';
            } else if (error?.status === 403) {
              userMessage += '🔍 Developer Info: Forbidden - User lacks permission to create product sizes\n';
            } else if (error?.status === 409) {
              userMessage += '🔍 Developer Info: Conflict - Product size name may already exist\n';
            } else if (error?.status === 500) {
              userMessage += '🔍 Developer Info: Server error - Check backend logs for stack trace\n';
            } else {
              userMessage += '🔍 Developer Info: Unknown error - Check network connectivity and server status\n';
            }

            // Log full error details for developers
            console.error('=== PRODUCT SIZE CREATE ERROR ===');
            console.error('Error Code:', errorCode);
            console.error('Full Error Object:', error);
            console.error('Request Payload:', newSize);
            console.error('================================');

            this.notificationService.showError(userMessage, 'Create Failed - Contact Support');
          }
        });
      }
    }
  }

  goBack(): void {
    this.router.navigate(['products']);
  }

  getSizeTypeName(sizeTypeId: number): string {
    const sizeType = this.sizeTypes.find(st => st.sizeTypeId === sizeTypeId);
    return sizeType ? sizeType.sizeTypeName : 'Unknown Size Type';
  }

  private clearMessages(): void {
    this.error = null;
    this.success = null;
  }
}

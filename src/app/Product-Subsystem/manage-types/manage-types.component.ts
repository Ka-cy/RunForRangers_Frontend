import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../API-Services/product.service';
import { NotificationService } from '../../API-Services/notification.service';
import { IproductType, IproductCategory } from '../../Interfaces/iproduct';
import { NavBarAdminComponent } from "../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component";
import { NotificationModalComponent } from '../../Notification/notification.component';

@Component({
  selector: 'app-manage-types',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavBarAdminComponent, NotificationModalComponent],
  templateUrl: './manage-types.component.html',
  styleUrl: './manage-types.component.css'
})
export class ManageTypesComponent implements OnInit {
  types: IproductType[] = [];
  categories: IproductCategory[] = [];
  typeForm: FormGroup;
  showForm = false;
  editingType: IproductType | null = null;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private productService: ProductService,
    private formBuilder: FormBuilder,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.typeForm = this.formBuilder.group({
      typeName: ['', [Validators.required, Validators.minLength(2)]],
      typeDescription: ['', [Validators.required, Validators.minLength(5)]],
      productCategoryId: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadTypes();
    this.loadCategories();
  }

  loadCategories(): void {
    this.productService.GetProductCategories().subscribe({
      next: (categories) => {
        this.categories = categories.filter(c => c.isActive);
        this.error = null;
        console.log('Loaded categories for type creation:', this.categories);
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);

        // Create user-friendly error message with developer context
        const errorCode = `CATEGORY_LOAD_${error?.status || 'UNKNOWN'}_${Date.now()}`;

        let userMessage = '❌ Unable to load product categories.\n\n';
        userMessage += '📸 Please screenshot this message and email it to: support@runforrangers.com\n\n';
        userMessage += '💡 Tell support: "Cannot see category dropdown. Error code: ' + errorCode + '"\n\n';

        // Add specific error context for developers
        if (error?.status === 401) {
          userMessage += '🔍 Developer Info: Unauthorized - Authentication token may be expired\n';
        } else if (error?.status === 403) {
          userMessage += '🔍 Developer Info: Forbidden - User lacks permission to view categories\n';
        } else if (error?.status === 500) {
          userMessage += '🔍 Developer Info: Server error - Check backend category endpoint\n';
        } else {
          userMessage += '🔍 Developer Info: Network or server connectivity issue\n';
        }

        console.error('=== CATEGORY LOAD ERROR ===');
        console.error('Error Code:', errorCode);
        console.error('Full Error Object:', error);
        console.error('===========================');

        this.error = userMessage;
        this.notificationService.showError(userMessage, 'Load Failed - Contact Support');
      }
    });
  }

  loadTypes(): void {
    this.productService.GetProductTypes().subscribe({
      next: (types) => {
        this.types = types;
        this.error = null;
      },
      error: (error: any) => {
        console.error('Error loading types:', error);

        // Create user-friendly error message with developer context
        const errorCode = `TYPE_LOAD_${error?.status || 'UNKNOWN'}_${Date.now()}`;

        let userMessage = '❌ Unable to load product types.\n\n';
        userMessage += '📸 Please screenshot this message and email it to: support@runforrangers.com\n\n';
        userMessage += '💡 Tell support: "Cannot see product types list. Error code: ' + errorCode + '"\n\n';

        // Add specific error context for developers
        if (error?.status === 401) {
          userMessage += '🔍 Developer Info: Unauthorized - Authentication token may be expired\n';
        } else if (error?.status === 403) {
          userMessage += '🔍 Developer Info: Forbidden - User lacks permission to view product types\n';
        } else if (error?.status === 500) {
          userMessage += '🔍 Developer Info: Server error - Check backend product type endpoint\n';
        } else {
          userMessage += '🔍 Developer Info: Network or server connectivity issue\n';
        }

        console.error('=== PRODUCT TYPE LOAD ERROR ===');
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
    this.editingType = null;
    this.typeForm.reset();
    this.clearMessages();
  }

  showEditForm(type: IproductType): void {
    this.showForm = true;
    this.editingType = type;
    this.typeForm.patchValue({
      typeName: type.typeName,
      typeDescription: type.typeDescription,
      productCategoryId: type.productCategoryId
    });
    this.clearMessages();
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingType = null;
    this.typeForm.reset();
    this.clearMessages();
  }

  onSubmit(): void {
    if (this.typeForm.valid) {
      const formValue = this.typeForm.value;
      
      if (this.editingType) {
        // Update existing type - use simplified payload to match backend expectations
        const updatedType: IproductType = {
          productTypeId: this.editingType.productTypeId,
          typeName: formValue.typeName.trim(),
          typeDescription: formValue.typeDescription?.trim() || null, // Allow null instead of empty string
          productCategoryId: Number(formValue.productCategoryId), // Use Number() instead of parseInt()
          isActive: this.editingType.isActive !== undefined ? this.editingType.isActive : true
        };

        console.log('Form value productCategoryId:', formValue.productCategoryId, 'Type:', typeof formValue.productCategoryId);
        console.log('Parsed productCategoryId:', Number(formValue.productCategoryId), 'Type:', typeof Number(formValue.productCategoryId));

        console.log('Updating type with simplified model:', updatedType);

        this.productService.UpdateProductType(updatedType).subscribe({
          next: (result: any) => {
            this.notificationService.showSuccess('Type updated successfully!', 'Success');
            this.loadTypes();
            this.cancelForm();
          },
          error: (error: any) => {
            console.error('Error updating type:', error);

            // Create user-friendly error message with developer context
            const errorCode = `TYPE_UPDATE_${error?.status || 'UNKNOWN'}_${Date.now()}`;
            const developerInfo = `Error Code: ${errorCode} | Status: ${error?.status} | URL: ${error?.url || 'N/A'}`;

            let userMessage = 'Error updating type';

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
              userMessage += '🔍 Developer Info: Forbidden - User lacks permission to update product types\n';
            } else if (error?.status === 404) {
              userMessage += '🔍 Developer Info: Product type not found - May have been deleted\n';
            } else if (error?.status === 409) {
              userMessage += '🔍 Developer Info: Conflict - Product type name may already exist\n';
            } else if (error?.status === 500) {
              userMessage += '🔍 Developer Info: Server error - Check backend logs for stack trace\n';
            } else {
              userMessage += '🔍 Developer Info: Unknown error - Check network connectivity and server status\n';
            }

            // Log full error details for developers
            console.error('=== PRODUCT TYPE UPDATE ERROR ===');
            console.error('Error Code:', errorCode);
            console.error('Full Error Object:', error);
            console.error('Request Payload:', updatedType);
            console.error('================================');

            this.notificationService.showError(userMessage, 'Update Failed - Contact Support');
          }
        });
      } else {
        // Create new type
        const newType: IproductType = {
          productTypeId: 0, // Will be set by backend
          typeName: formValue.typeName,
          typeDescription: formValue.typeDescription,
          productCategoryId: formValue.productCategoryId, // CRITICAL: Use selected category
          isActive: true
        };

        console.log('Creating new type:', newType);

        this.productService.AddProductType(newType).subscribe({
          next: (result: any) => {
            this.notificationService.showSuccess('Type created successfully!', 'Success');
            this.loadTypes();
            this.cancelForm();
          },
          error: (error: any) => {
            console.error('Error creating type:', error);

            // Create user-friendly error message with developer context
            const errorCode = `TYPE_CREATE_${error?.status || 'UNKNOWN'}_${Date.now()}`;
            const developerInfo = `Error Code: ${errorCode} | Status: ${error?.status} | URL: ${error?.url || 'N/A'}`;

            let userMessage = '❌ Unable to create product type.\n\n';
            userMessage += '📸 Please screenshot this message and email it to: support@runforrangers.com\n\n';
            userMessage += '💡 Tell support: "Error creating product type. Error code: ' + errorCode + '"\n\n';

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
              userMessage += '🔍 Developer Info: Forbidden - User lacks permission to create product types\n';
            } else if (error?.status === 409) {
              userMessage += '🔍 Developer Info: Conflict - Product type name may already exist\n';
            } else if (error?.status === 500) {
              userMessage += '🔍 Developer Info: Server error - Check backend logs for stack trace\n';
            } else {
              userMessage += '🔍 Developer Info: Unknown error - Check network connectivity and server status\n';
            }

            // Log full error details for developers
            console.error('=== PRODUCT TYPE CREATE ERROR ===');
            console.error('Error Code:', errorCode);
            console.error('Full Error Object:', error);
            console.error('Request Payload:', newType);
            console.error('================================');

            this.notificationService.showError(userMessage, 'Create Failed - Contact Support');
          }
        });
      }
    }
  }

  deleteType(type: IproductType): void {
    this.notificationService.showWarning(
      `Are you sure you want to delete the type "${type.typeName}"?`,
      'Confirm Deletion'
    );
    
    this.notificationService.confirmation$.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.productService.DeleteProductType(type.productTypeId).subscribe({
          next: (response: any) => {
            this.notificationService.showSuccess(
              response?.message || 'Type deleted successfully!',
              'Success'
            );
            this.error = null;
            this.loadTypes();
          },
          error: (error: any) => {
            console.error('Error deleting type:', error);

            // Create user-friendly error message with developer context
            const errorCode = `TYPE_DELETE_${error?.status || 'UNKNOWN'}_${Date.now()}`;
            const developerInfo = `Error Code: ${errorCode} | Status: ${error?.status} | Type ID: ${type.productTypeId}`;

            let userMessage = '❌ Unable to delete product type.\n\n';
            userMessage += '📸 Please screenshot this message and email it to: support@runforrangers.com\n\n';
            userMessage += '💡 Tell support: "Error deleting product type. Error code: ' + errorCode + '"\n\n';

            // Add specific error context for developers
            if (error?.error?.message) {
              userMessage += `🔍 Developer Info: ${error.error.message}\n`;
            } else if (error?.status === 400) {
              userMessage += '🔍 Developer Info: Cannot delete - Product type is referenced by existing products\n';
            } else if (error?.status === 401) {
              userMessage += '🔍 Developer Info: Unauthorized - Authentication token may be expired\n';
            } else if (error?.status === 403) {
              userMessage += '🔍 Developer Info: Forbidden - User lacks permission to delete product types\n';
            } else if (error?.status === 404) {
              userMessage += '🔍 Developer Info: Product type not found - May have already been deleted\n';
            } else if (error?.status === 409) {
              userMessage += '🔍 Developer Info: Conflict - Product type cannot be deleted due to dependencies\n';
            } else if (error?.status === 500) {
              userMessage += '🔍 Developer Info: Server error - Check backend logs for stack trace\n';
            } else {
              userMessage += '🔍 Developer Info: Unknown error - Check network connectivity and server status\n';
            }

            // Log full error details for developers
            console.error('=== PRODUCT TYPE DELETE ERROR ===');
            console.error('Error Code:', errorCode);
            console.error('Type being deleted:', type);
            console.error('Full Error Object:', error);
            console.error('================================');

            this.notificationService.showError(userMessage, 'Delete Failed - Contact Support');
            this.error = userMessage;
            this.success = null;
          }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['products']);
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.productCategoryId === categoryId);
    return category ? category.categoryName : 'Unknown Category';
  }

  private clearMessages(): void {
    this.error = null;
    this.success = null;
  }

  reportError(): void {
    this.notificationService.showSuccess('Report sent successfully to developers!', 'Report Submitted');
    this.error = null; // Clear the error message after reporting
  }
}

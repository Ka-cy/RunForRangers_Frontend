
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogActions } from '@angular/material/dialog';
import { MatDialogContent } from '@angular/material/dialog';
import { ProductService } from '../../API-Services/product.service';
import { NotificationService } from '../../API-Services/notification.service';
import { IproductCategory } from '../../Interfaces/iproduct';
import { NotificationModalComponent } from '../../Notification/notification.component';

/**
 * CreateCategoryComponent
 * ----------------------
 * Dialog component for creating a new product category.
 * Handles form validation, submission, and dialog control.
 */
@Component({
  selector: 'app-create-category',
  imports: [ReactiveFormsModule, MatDialogActions, MatDialogContent, NotificationModalComponent],
  templateUrl: './create-category.component.html',
  styleUrl: './create-category.component.css'
})
export class CreateCategoryComponent {
  /**
   * Form control for the category name (required)
   */
  categoryName = new FormControl('', [Validators.required]);
  /**
   * Form control for the category description (optional)
   */
  description = new FormControl('');
  /**
   * Indicates if the save operation is in progress
   */
  isSaving: boolean = false;

  /**
   * Injects dialog reference and product service
   */
  constructor(
    public dialogRef: MatDialogRef<CreateCategoryComponent>,
    private productService: ProductService,
    private notificationService: NotificationService
  ) {}

  /**
   * Handles the save action. Validates the form and submits the new category to the backend.
   * Closes the dialog on success.
   */
  onSave(): void {
    if (this.categoryName.valid) {
      this.isSaving = true;
      // Build the new category object
      const newCategory: IproductCategory = {
        productCategoryId: 0,
        categoryName: this.categoryName.value || '',
        categoryDescription: this.description.value || '',
        isActive: true
      };

      this.productService.AddProductCategory(newCategory).subscribe({
        next: (response: any) => {
          console.log('Category created successfully:', response);
          this.notificationService.showSuccess('Category created successfully!', 'Success');
          this.dialogRef.close(response);
        },
        error: (error: any) => {
          console.error('Error creating category:', error);
          this.notificationService.showError('Failed to create category. Please try again.', 'Error');
        },
        complete: () => {
          this.isSaving = false;
        }
      });
    }
  }

  /**
   * Handles the cancel action. Closes the dialog without saving.
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}

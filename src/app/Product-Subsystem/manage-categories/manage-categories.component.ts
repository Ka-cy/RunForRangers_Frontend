import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../API-Services/product.service';
import { NotificationService } from '../../API-Services/notification.service';
import { IproductCategory, ICreateCategoryDto, ICreateTypeDto } from '../../Interfaces/iproduct';
import { NavBarAdminComponent } from "../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component";
import { NotificationModalComponent } from '../../Notification/notification.component';

@Component({
  selector: 'app-manage-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavBarAdminComponent, NotificationModalComponent],
  templateUrl: './manage-categories.component.html',
  styleUrl: './manage-categories.component.css'
})
export class ManageCategoriesComponent implements OnInit {
  categories: IproductCategory[] = [];
  categoryForm: FormGroup;
  showForm = false;
  editingCategory: IproductCategory | null = null;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private productService: ProductService,
    private formBuilder: FormBuilder,
    private router: Router,
    private notificationService: NotificationService
  ) {
    // Simple form with just category fields
    this.categoryForm = this.formBuilder.group({
      categoryName: ['', [Validators.required, Validators.minLength(2)]],
      categoryDescription: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.productService.GetProductCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.error = null;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.error = 'Failed to load categories. Please try again.';
      }
    });
  }

  showAddForm(): void {
    this.showForm = true;
    this.editingCategory = null;
    this.categoryForm.reset();
    this.clearMessages();
  }

  showEditForm(category: IproductCategory): void {
    this.showForm = true;
    this.editingCategory = category;
    this.categoryForm.patchValue({
      categoryName: category.categoryName,
      categoryDescription: category.categoryDescription
    });
    this.clearMessages();
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingCategory = null;
    this.categoryForm.reset();
    this.clearMessages();
  }

  onSubmit(): void {
    if (this.categoryForm.valid) {
      const formValue = this.categoryForm.value;
      
      if (this.editingCategory) {
        // Update existing category
        const updatedCategory: IproductCategory = {
          productCategoryId: this.editingCategory.productCategoryId,
          categoryName: formValue.categoryName,
          categoryDescription: formValue.categoryDescription,
          isActive: this.editingCategory.isActive || true
        };

        this.productService.UpdateProductCategory(updatedCategory).subscribe({
          next: (result: any) => {
            this.success = 'Category updated successfully!';
            this.loadCategories();
            this.cancelForm();
          },
          error: (error: any) => {
            console.error('Error updating category:', error);
            this.error = 'Failed to update category. Please try again.';
          }
        });
      } else {
        // Create new category with a default type (BUSINESS RULE WORKAROUND)
        const defaultType: ICreateTypeDto = {
          typeName: `${formValue.categoryName} Items`,
          typeDescription: `General items for ${formValue.categoryName} category`
        };

        const newCategory: ICreateCategoryDto = {
          categoryName: formValue.categoryName,
          categoryDescription: formValue.categoryDescription,
          initialTypes: [defaultType]
        };

        console.log('Creating category with default type:', newCategory);

        this.productService.CreateProductCategory(newCategory).subscribe({
          next: (result: any) => {
            console.log('Category creation successful:', result);
            this.notificationService.showSuccess(
              'Category Created Successfully!',
              `"${formValue.categoryName}" has been added to the product categories with a default type.`
            );
            this.loadCategories();
            this.cancelForm();
          },
          error: (error: any) => {
            console.error('Error creating category:', error);
            console.error('Error details:', error.error);
            
            // Extract validation errors if available
            if (error.error && error.error.errors) {
              console.error('Validation errors:', error.error.errors);
              const validationMessages = Object.values(error.error.errors).flat();
              this.notificationService.showError(
                'Validation Error',
                'Validation errors: ' + validationMessages.join(', ')
              );
            } else {
              this.notificationService.showError(
                'Creation Failed',
                'Failed to create category. Please try again.'
              );
            }
          }
        });
      }
    }
  }

  deleteCategory(category: IproductCategory): void {
    // Show confirmation modal
    this.notificationService.showWarning(
      'Delete Category',
      `Are you sure you want to delete "${category.categoryName}"? This action cannot be undone.`,
      'Delete',
      'Cancel'
    );

    // Subscribe to confirmation result
    this.notificationService.confirmation$.subscribe(confirmed => {
      if (confirmed) {
        this.productService.DeleteProductCategory(category.productCategoryId).subscribe({
          next: (response: any) => {
            this.notificationService.showSuccess(
              'Category Deleted Successfully',
              `"${category.categoryName}" has been removed from the product categories.`
            );
            this.loadCategories();
          },
          error: (error: any) => {
            console.error('Error deleting category:', error);
            
            // Extract specific error message from backend
            let errorMessage = 'Failed to delete category. Please try again.';
            
            if (error?.error?.message) {
              errorMessage = error.error.message;
            } else if (error?.status === 400) {
              errorMessage = 'Cannot delete this category as it is being used by products or product types.';
            } else if (error?.status === 404) {
              errorMessage = 'Category not found. It may have already been deleted.';
              this.loadCategories();
            } else if (error?.status === 500) {
              errorMessage = 'Server error occurred while deleting category. Please contact support.';
            }
            
            this.notificationService.showError(
              'Delete Failed',
              errorMessage
            );
          }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['products']);
  }

  private clearMessages(): void {
    this.error = null;
    this.success = null;
  }
}

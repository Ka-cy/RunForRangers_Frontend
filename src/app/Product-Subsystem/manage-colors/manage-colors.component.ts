import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../API-Services/product.service';
import { NotificationService } from '../../API-Services/notification.service';
import { Iproductcolor } from '../../Interfaces/iproduct';
import { NavBarAdminComponent } from "../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component";
import { NotificationModalComponent } from '../../Notification/notification.component';

@Component({
  selector: 'app-manage-colors',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavBarAdminComponent, NotificationModalComponent],
  templateUrl: './manage-colors.component.html',
  styleUrl: './manage-colors.component.css'
})
export class ManageColorsComponent implements OnInit {
  colors: Iproductcolor[] = [];
  colorForm: FormGroup;
  showForm = false;
  editingColor: Iproductcolor | null = null;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private productService: ProductService,
    private formBuilder: FormBuilder,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.colorForm = this.formBuilder.group({
      colourName: ['', [Validators.required, Validators.minLength(2)]],
      colourDescription: ['', [Validators.required, Validators.minLength(3)]],
      hexCode: ['', [Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]]
    });
  }

  ngOnInit(): void {
    this.loadColors();
  }

  loadColors(): void {
    this.productService.GetProductColors().subscribe({
      next: (colors) => {
        this.colors = colors;
        this.error = null;
      },
      error: (error: any) => {
        console.error('Error loading colors:', error);
        this.error = 'Failed to load colors. Please try again.';
      }
    });
  }

  showAddForm(): void {
    this.showForm = true;
    this.editingColor = null;
    this.colorForm.reset();
    this.clearMessages();
  }

  showEditForm(color: Iproductcolor): void {
    this.showForm = true;
    this.editingColor = color;
    this.colorForm.patchValue({
      colourName: color.colorName,
      colourDescription: color.colorDescription,
      hexCode: color.hexCode || ''
    });
    this.clearMessages();
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingColor = null;
    this.colorForm.reset();
    this.clearMessages();
  }

  onSubmit(): void {
    if (this.colorForm.valid) {
      const formValue = this.colorForm.value;
      if (this.editingColor) {
        const updated: Iproductcolor = {
          productColorId: this.editingColor.productColorId,
          colorName: formValue.colourName,
          colorDescription: formValue.colourDescription,
          hexCode: formValue.hexCode || undefined,
          isActive: this.editingColor.isActive || true
        };
        this.productService.UpdateProductColor(updated).subscribe({
          next: (response: any) => {
            this.notificationService.showSuccess(
              'Color Updated Successfully!',
              `"${formValue.colourName}" has been updated in the color catalog.`
            );
            this.loadColors();
            this.cancelForm();
          },
          error: (error: any) => {
            console.error('Error updating color:', error);
            
            let errorMessage = 'Failed to update color. Please try again.';
            
            if (error?.error?.message) {
              errorMessage = error.error.message;
            } else if (error?.status === 400) {
              errorMessage = 'Invalid color data. Please check your input.';
            } else if (error?.status === 404) {
              errorMessage = 'Color not found. It may have been deleted.';
              this.loadColors();
            } else if (error?.status === 500) {
              errorMessage = 'Server error occurred while updating color. Please contact support.';
            }
            
            this.notificationService.showError(
              'Update Failed',
              errorMessage
            );
          }
        });
      } else {
        const newColor: Iproductcolor = {
          productColorId: 0,
          colorName: formValue.colourName,
          colorDescription: formValue.colourDescription,
          hexCode: formValue.hexCode || undefined,
          isActive: true
        };
        this.productService.CreateProductColor(newColor).subscribe({
          next: (response: any) => {
            this.notificationService.showSuccess(
              'Color Created Successfully!',
              `"${formValue.colourName}" has been added to the color catalog.`
            );
            this.loadColors();
            this.cancelForm();
          },
          error: (error: any) => {
            console.error('Error creating color:', error);
            
            let errorMessage = 'Failed to create color. Please try again.';
            
            if (error?.error?.message) {
              errorMessage = error.error.message;
            } else if (error?.status === 400) {
              errorMessage = 'Invalid color data or color name already exists.';
            } else if (error?.status === 500) {
              errorMessage = 'Server error occurred while creating color. Please contact support.';
            }
            
            this.notificationService.showError(
              'Creation Failed',
              errorMessage
            );
          }
        });
      }
    }
  }

  deleteColor(color: Iproductcolor): void {
    // Show confirmation modal
    this.notificationService.showWarning(
      'Delete Color',
      `Are you sure you want to delete "${color.colorName}"? This action cannot be undone.`,
      'Delete',
      'Cancel'
    );

    // Subscribe to confirmation result
    this.notificationService.confirmation$.subscribe(confirmed => {
      if (confirmed) {
        this.productService.DeleteProductColor(color.productColorId).subscribe({
          next: (response: any) => {
            this.notificationService.showSuccess(
              'Color Deleted Successfully',
              `"${color.colorName}" has been removed from the color catalog.`
            );
            this.loadColors();
          },
          error: (error: any) => {
            console.error('Error deleting color:', error);
            
            let errorMessage = 'Failed to delete color. Please try again.';
            
            if (error?.error?.message) {
              errorMessage = error.error.message;
            } else if (error?.status === 400) {
              errorMessage = 'Cannot delete this color as it is being used by existing products.';
            } else if (error?.status === 404) {
              errorMessage = 'Color not found. It may have already been deleted.';
              this.loadColors();
            } else if (error?.status === 500) {
              errorMessage = 'Server error occurred while deleting color. Please contact support.';
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

  getColorPreview(color: Iproductcolor | string): string {
    // If it's a color object with hex code, use that
    if (typeof color === 'object' && color.hexCode) {
      return color.hexCode;
    }
    
    // Extract color name for fallback mapping
    const colorName = typeof color === 'string' ? color : color.colorName;
    
    // Simple color mapping for fallback when no hex code available
    const colorMap: { [key: string]: string } = {
      'red': '#ff0000',
      'blue': '#0000ff',
      'green': '#008000',
      'black': '#000000',
      'white': '#ffffff',
      'yellow': '#ffff00',
      'orange': '#ffa500',
      'purple': '#800080',
      'pink': '#ffc0cb',
      'brown': '#a52a2a',
      'gray': '#808080',
      'grey': '#808080'
    };
    
    return colorMap[colorName.toLowerCase()] || '#cccccc';
  }

  private clearMessages(): void {
    this.error = null;
    this.success = null;
  }
}

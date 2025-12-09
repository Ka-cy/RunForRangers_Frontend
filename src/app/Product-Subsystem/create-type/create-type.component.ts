import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogContent } from '@angular/material/dialog';
import { MatDialogActions } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../API-Services/product.service';
import { NotificationService } from '../../API-Services/notification.service';
import { IproductType, IproductCategory } from '../../Interfaces/iproduct';
import { NotificationModalComponent } from '../../Notification/notification.component';

@Component({
  selector: 'app-create-type',
  imports: [ReactiveFormsModule,
    MatDialogActions,
    MatDialogContent,
    CommonModule,
    NotificationModalComponent
  ],
  templateUrl: './create-type.component.html',
  styleUrl: './create-type.component.css'
})
export class CreateTypeComponent implements OnInit {

  typeName = new FormControl('', [Validators.required]);
  description = new FormControl('');
  selectedCategory = new FormControl('', [Validators.required]);
  isSaving: boolean = false;
  categories: IproductCategory[] = [];

 constructor(
    public dialogRef: MatDialogRef<CreateTypeComponent>,
    private productService: ProductService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.productService.GetProductCategories().subscribe({
      next: (categories: IproductCategory[]) => {
        this.categories = categories.filter(cat => cat.isActive);
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onSave(): void {
    if (this.typeName.valid && this.selectedCategory.valid) {
      this.isSaving = true;
      
      const newType: IproductType = {
        productTypeId: 0,
        typeName: this.typeName.value || '',
        typeDescription: this.description.value || '',
        productCategoryId: parseInt(this.selectedCategory.value || '0'),
        isActive: true
      };

      this.productService.AddProductType(newType).subscribe({
        next: (response: any) => {
          console.log('Type created successfully:', response);
          this.notificationService.showSuccess('Type created successfully!', 'Success');
          this.dialogRef.close(response);
        },
        error: (error: any) => {
          console.error('Error creating type:', error);
          this.notificationService.showError('Failed to create type. Please try again.', 'Error');
        },
        complete: () => {
          this.isSaving = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

}

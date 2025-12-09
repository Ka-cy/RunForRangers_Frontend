import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../API-Services/product.service';
import { NotificationService } from '../../API-Services/notification.service';
import { IsizeType } from '../../Interfaces/iproduct';
import { NavBarAdminComponent } from "../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component";
import { NotificationModalComponent } from '../../Notification/notification.component';

@Component({
  selector: 'app-manage-size-types',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavBarAdminComponent, NotificationModalComponent],
  templateUrl: './manage-size-types.component.html',
  styleUrl: './manage-size-types.component.css'
})
export class ManageSizeTypesComponent implements OnInit {
  sizeTypes: IsizeType[] = [];
  sizeTypeForm: FormGroup;
  showForm = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private productService: ProductService,
    private formBuilder: FormBuilder,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.sizeTypeForm = this.formBuilder.group({
      sizeTypeName: ['', [Validators.required, Validators.minLength(2)]],
      sizeTypeDescription: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void {
    this.loadSizeTypes();
  }

  loadSizeTypes(): void {
    this.productService.GetSizeTypes().subscribe({
      next: (sizeTypes) => {
        this.sizeTypes = sizeTypes;
        this.error = null;
      },
      error: (error: any) => {
        console.error('Error loading size types:', error);
        this.error = 'Failed to load size types. Please try again.';
      }
    });
  }

  showAddForm(): void {
    this.showForm = true;
    this.sizeTypeForm.reset();
    this.clearMessages();
  }

  cancelForm(): void {
    this.showForm = false;
    this.sizeTypeForm.reset();
    this.clearMessages();
  }

  onSubmit(): void {
    if (this.sizeTypeForm.valid) {
      const formValue = this.sizeTypeForm.value;
      
      // For now, create with empty initial sizes - can be enhanced later
      this.productService.CreateSizeType({
        sizeTypeName: formValue.sizeTypeName,
        sizeTypeDescription: formValue.sizeTypeDescription,
        initialSizes: [] // Empty array for now
      }).subscribe({
        next: (result: any) => {
          this.success = 'Size type created successfully! You can now add sizes to this type.';
          this.loadSizeTypes();
          this.cancelForm();
        },
        error: (error: any) => {
          console.error('Error creating size type:', error);
          this.error = 'Failed to create size type. Please try again.';
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['products']);
  }

  private clearMessages(): void {
    this.error = null;
    this.success = null;
  }
}

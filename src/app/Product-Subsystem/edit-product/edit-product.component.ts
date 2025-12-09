import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { 
  Iproduct, 
  IproductCategory, 
  Iproductcolor, 
  Iproductsize, 
  IproductType,
  IsizeType,
  IUpdateProductDto,
  IProductWithDetails
} from '../../Interfaces/iproduct';
import { ProductService } from '../../API-Services/product.service';
import { ImageService } from '../../API-Services/image.service';
import { FileUploadService } from '../../API-Services/file-upload.service';
import { NotificationService } from '../../API-Services/notification.service';
import { CreateCategoryComponent } from '../create-category/create-category.component';
import { CreateTypeComponent } from '../create-type/create-type.component';
import { NotificationModalComponent } from '../../Notification/notification.component';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';

@Component({
  selector: 'app-edit-product',
  imports: [ReactiveFormsModule, CommonModule, MatDialogModule, NotificationModalComponent, NavBarAdminComponent],
  templateUrl: './edit-product.component.html',
  styleUrl: './edit-product.component.css',
  standalone: true
})
export class EditProductComponent implements OnInit, OnDestroy {
  showProfileMenu: boolean = false;
  activeSection: string = 'products';
  productForm!: FormGroup;
  productId: number = 0;
  currentProduct: IProductWithDetails | null = null; // Updated to use detailed interface
  
  // Lookup data
  sizes: Iproductsize[] = [];
  colors: Iproductcolor[] = [];
  categories: IproductCategory[] = [];
  types: IproductType[] = [];
  filteredTypes: IproductType[] = []; // Types filtered by selected category
  sizeTypes: IsizeType[] = []; // Size types
  filteredSizes: Iproductsize[] = []; // Sizes filtered by selected size type
  
  // Image handling properties
  imagePreview: string | null = null;
  selectedImageFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;
  isDragOver = false;
  
  // Loading states
  loading = false;
  saving = false;
  submitted = false; // Track if form has been submitted
  
  // Cleanup subject for subscriptions
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private productService: ProductService,
    private imageService: ImageService,
    private fileUploadService: FileUploadService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  // Add HostListener to close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-info')) {
      this.showProfileMenu = false;
    }
  }

  ngOnInit(): void {
    this.getProductId();
    this.setupForm();
    this.setupFormSubscriptions();
    this.loadAllData();
  }

  // Get product ID from route parameters
  private getProductId(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId = +id;
    } else {
      alert('Invalid product ID');
      this.router.navigate(['/products']);
    }
  }

  // Initialize the reactive form
  private setupForm(): void {
    this.productForm = this.fb.group({
      productName: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      category: [null, Validators.required],
      type: [null, Validators.required],
      sizeType: [null, Validators.required], // NEW: Size type field
      price: [null, [Validators.required, Validators.min(0.01)]],
      selectedSizes: this.fb.array([]),
      selectedColors: this.fb.array([]),
      productImage: ['']
    });
  }

  // Load all necessary data
  private loadAllData(): void {
    this.loading = true;
    this.loadCategories();
    this.loadTypes();
    this.loadSizeTypes(); // NEW: Load size types
    this.loadSizes();
    this.loadColors();
    this.loadProduct();
  }

  private loadCategories(): void {
    this.productService.GetProductCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        alert('Failed to load categories');
      }
    });
  }

  private loadTypes(): void {
    this.productService.GetProductTypes().subscribe({
      next: (data) => {
        this.types = data;
      },
      error: (error) => {
        console.error('Error loading types:', error);
        alert('Failed to load types');
      }
    });
  }

  private loadSizes(): void {
    this.productService.GetProductSizes().subscribe({
      next: (data) => {
        this.sizes = data;
        this.updateSizeFormArray();
      },
      error: (error) => {
        console.error('Error loading sizes:', error);
        alert('Failed to load sizes');
      }
    });
  }

  private loadColors(): void {
    this.productService.GetProductColors().subscribe({
      next: (data) => {
        this.colors = data;
        this.updateColorFormArray();
      },
      error: (error) => {
        console.error('Error loading colors:', error);
        alert('Failed to load colors');
      }
    });
  }

  private loadSizeTypes(): void {
    this.productService.GetSizeTypes().subscribe({
      next: (data) => {
        this.sizeTypes = data;
      },
      error: (error) => {
        console.error('Error loading size types:', error);
        alert('Failed to load size types');
      }
    });
  }

  // Setup form subscriptions for cascading dropdowns
  private setupFormSubscriptions(): void {
    // Category change subscription
    this.productForm.get('category')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(categoryId => {
        if (categoryId) {
          this.onCategoryChange(categoryId);
        }
      });

    // Size type change subscription
    this.productForm.get('sizeType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(sizeTypeId => {
        if (sizeTypeId) {
          this.onSizeTypeChange(sizeTypeId);
        }
      });
  }

  private loadProduct(): void {
    this.productService.GetProductById(this.productId).subscribe({
      next: (product) => {
        if (product) {
          this.currentProduct = product;
          this.populateForm(product);
          this.setImagePreview(product.productImage);
          this.loading = false;
        } else {
          alert('Product not found');
          this.router.navigate(['/products']);
        }
      },
      error: (error) => {
        console.error('Error loading product:', error);
        alert('Failed to load product');
        this.router.navigate(['/products']);
      }
    });
  }

  private populateForm(product: IProductWithDetails): void {
    this.productForm.patchValue({
      productName: product.productName,
      description: product.productDescription,
      category: product.productType?.productCategoryId,
      type: product.productTypeId,
      sizeType: product.sizeTypeId,
      price: product.price,
      productImage: product.productImage
    });

    // Trigger cascading dropdowns based on the existing data
    if (product.productType?.productCategoryId) {
      this.onCategoryChange(product.productType.productCategoryId);
    }
    
    if (product.sizeTypeId) {
      this.onSizeTypeChange(product.sizeTypeId);
    }

    // Set selected sizes and colors from the detailed product data
    this.setSelectedSizesFromAvailable(product.availableSizes || []);
    this.setSelectedColorsFromAvailable(product.availableColors || []);
  }

  private setSelectedSizesFromAvailable(availableSizes: Iproductsize[]): void {
    // Wait for the sizes to be loaded, then set the selections
    setTimeout(() => {
      availableSizes.forEach((availableSize) => {
        this.filteredSizes.forEach((size, index) => {
          if (size.productSizeId === availableSize.productSizeId) {
            this.selectedSizes.at(index)?.setValue(true);
          }
        });
      });
    }, 100);
  }

  private setSelectedColorsFromAvailable(availableColors: Iproductcolor[]): void {
    // Wait for the colors to be loaded, then set the selections
    setTimeout(() => {
      availableColors.forEach((availableColor) => {
        this.colors.forEach((color, index) => {
          if (color.productColorId === availableColor.productColorId) {
            this.selectedColors.at(index)?.setValue(true);
          }
        });
      });
    }, 100);
  }

  private setImagePreview(imagePath?: string): void {
    if (imagePath && imagePath !== 'default-product.png') {
      this.imagePreview = `https://localhost:7158/uploads/${imagePath}`;
    }
  }

  private updateSizeFormArray(): void {
    const sizeArray = this.productForm.get('selectedSizes') as FormArray;
    sizeArray.clear();
    this.sizes.forEach(() => {
      sizeArray.push(this.fb.control(false));
    });
  }

  private updateColorFormArray(): void {
    const colorArray = this.productForm.get('selectedColors') as FormArray;
    colorArray.clear();
    this.colors.forEach(() => {
      colorArray.push(this.fb.control(false));
    });
  }

  // Getter methods for form arrays
  get selectedSizes() {
    return this.productForm.get('selectedSizes') as FormArray;
  }

  get selectedColors() {
    return this.productForm.get('selectedColors') as FormArray;
  }

  // Cascading dropdown methods
  onCategoryChange(categoryId: number): void {
    // Reset type and size type selections
    this.productForm.patchValue({
      type: null,
      sizeType: null
    });
    
    // Clear filtered arrays
    this.filteredTypes = [];
    this.filteredSizes = [];
    
    // Filter types by selected category
    if (categoryId) {
      this.productService.GetTypesByCategory(categoryId).subscribe({
        next: (response) => {
          this.filteredTypes = response.types;
        },
        error: (error) => {
          console.error('Error loading types for category:', error);
          alert('Failed to load types for selected category');
        }
      });
    }
  }

  onSizeTypeChange(sizeTypeId: number): void {
    // Reset size selections
    this.filteredSizes = [];
    
    // Filter sizes by selected size type
    if (sizeTypeId) {
      this.productService.GetSizesBySizeType(sizeTypeId).subscribe({
        next: (response) => {
          this.filteredSizes = response.sizes;
          // Update the size form array with new filtered sizes
          this.updateSizeFormArrayWithFilteredSizes();
        },
        error: (error) => {
          console.error('Error loading sizes for size type:', error);
          alert('Failed to load sizes for selected size type');
        }
      });
    }
  }

  private updateSizeFormArrayWithFilteredSizes(): void {
    const sizeArray = this.productForm.get('selectedSizes') as FormArray;
    sizeArray.clear();
    
    this.filteredSizes.forEach(() => {
      sizeArray.push(this.fb.control(false));
    });
  }

  // Dialog methods
  openAddTypeDialog(): void {
    const dialogRef = this.dialog.open(CreateTypeComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTypes();
      }
    });
  }

  openAddCategoryDialog(): void {
    const dialogRef = this.dialog.open(CreateCategoryComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCategories();
      }
    });
  }

  // Main submit method
  onSubmit(): void {
    this.submitted = true; // Mark form as submitted
    
    if (!this.productForm.valid) {
      this.markFormGroupTouched();
      this.notificationService.showError(
        'Form Validation Error',
        'Please fill in all required fields correctly.'
      );
      return;
    }

    const formData = this.productForm.value;
    
    // Validate at least one size and color is selected
    const selectedSizeIds = this.getSelectedSizeIds();
    const selectedColorIds = this.getSelectedColorIds();

    if (selectedSizeIds.length === 0) {
      this.notificationService.showError(
        'Size Selection Required',
        'Please select at least one size for the product.'
      );
      return;
    }

    if (selectedColorIds.length === 0) {
      this.notificationService.showError(
        'Color Selection Required',
        'Please select at least one color for the product.'
      );
      return;
    }

    // Show confirmation modal before updating product
    const productName = formData.productName || this.currentProduct?.productName || 'this product';
    this.notificationService.showWarning(
      'Update Product',
      `Are you sure you want to update "${productName}"?`,
      'Update',
      'Cancel'
    );

    // Subscribe to confirmation result
    this.notificationService.confirmation$.pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (confirmed) {
        // Create updated product DTO
        const updatedProduct: IUpdateProductDto = {
          productId: this.productId,
          productName: formData.productName.trim(),
          productDescription: formData.description.trim(),
          price: Number(formData.price),
          productImage: formData.productImage || this.currentProduct?.productImage || 'default-product.png',
          productTypeId: Number(formData.type),
          sizeTypeId: Number(formData.sizeType),
          sizeIds: selectedSizeIds,
          colorIds: selectedColorIds
        };

        this.saving = true;

        // Update the product using the new DTO structure
        this.productService.UpdateProduct(updatedProduct).subscribe({
          next: (response) => {
            console.log('Product updated successfully:', response);
            
            this.notificationService.showSuccess(
              'Product Updated Successfully!',
              `"${updatedProduct.productName}" has been updated in the product catalog.`,
              'Continue'
            );
            this.saving = false;
            
            // Navigate immediately after success
            setTimeout(() => {
              this.router.navigate(['/products']);
            }, 1500);
          },
          error: (error) => {
            console.error('Error updating product:', error);
            this.saving = false;
            
            if (error.status === 400 && error.error?.errors) {
              const errorMessages = this.extractValidationErrors(error.error.errors);
              this.notificationService.showError(
                'Validation Error',
                errorMessages
              );
            } else {
              this.notificationService.showError(
                'Update Failed',
                'Failed to update product. Please check your data and try again.'
              );
            }
          }
        });
      }
    });
  }

  private getSelectedSizeIds(): number[] {
    return this.sizes
      .filter((_, index) => this.selectedSizes.at(index)?.value)
      .map(size => size.productSizeId);
  }

  private getSelectedColorIds(): number[] {
    return this.colors
      .filter((_, index) => this.selectedColors.at(index)?.value)
      .map(color => color.productColorId);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper method to check if validation errors should be shown
  shouldShowValidationError(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.submitted));
  }

  // Helper method to get validation error message for a field
  getValidationError(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['min']) {
        return `${this.getFieldDisplayName(fieldName)} must be greater than ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  // Helper method to get display name for fields
  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'productName': 'Product Name',
      'description': 'Description',
      'category': 'Category',
      'type': 'Type',
      'sizeType': 'Size Type',
      'price': 'Price'
    };
    return displayNames[fieldName] || fieldName;
  }

  private extractValidationErrors(errors: any): string {
    return Object.entries(errors)
      .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
      .join('\n');
  }

  private assignMultipleSelections(productId: number, sizeIds: number[], colorIds: number[]): void {
    // Assign all selected sizes
    if (sizeIds.length > 0) {
      this.productService.AssignSizesToProductLegacy(productId, sizeIds).subscribe({
        next: () => console.log('Sizes assigned successfully'),
        error: (error) => console.error('Error assigning sizes:', error)
      });
    }

    // Assign all selected colors
    if (colorIds.length > 0) {
      this.productService.AssignColoursToProduct(productId, colorIds).subscribe({
        next: () => console.log('Colors assigned successfully'),
        error: (error) => console.error('Error assigning colors:', error)
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }

  // Image handling methods
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      if (this.validateImageFile(file)) {
        this.selectedImageFile = file;
        this.createImagePreview(file);
        this.productForm.patchValue({ productImage: file.name });
      }
    }
  }

  private validateImageFile(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSizeInMB = 5;
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, GIF, WEBP)');
      return false;
    }
    
    if (file.size > maxSizeInMB * 1024 * 1024) {
      alert(`File size must be less than ${maxSizeInMB}MB`);
      return false;
    }
    
    return true;
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  uploadImage(): void {
    if (!this.selectedImageFile) {
      alert('Please select an image first');
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    this.fileUploadService.uploadImageWithProgress(this.selectedImageFile).subscribe({
      next: (event) => {
        if (event.progress !== undefined) {
          this.uploadProgress = event.progress;
        }
        
        if (event.response) {
          console.log('Image uploaded successfully:', event.response);
          this.productForm.patchValue({ productImage: event.response.fileName });
          this.imagePreview = `https://localhost:7158${event.response.imageUrl}`;
          this.isUploading = false;
          this.uploadProgress = 0;
          alert('Image uploaded successfully!');
        }
      },
      error: (error) => {
        console.error('Upload failed:', error);
        alert('Image upload failed. Please try again.');
        this.isUploading = false;
        this.uploadProgress = 0;
      }
    });
  }

  removeImage(): void {
    this.selectedImageFile = null;
    this.imagePreview = null;
    this.uploadProgress = 0;
    this.productForm.patchValue({ productImage: this.currentProduct?.productImage || '' });
    
    // Reset to original product image
    if (this.currentProduct?.productImage) {
      this.setImagePreview(this.currentProduct.productImage);
    }
  }

  // Drag and drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const fakeEvent = {
        target: { files: [files[0]] }
      } as any;
      this.onFileSelected(fakeEvent);
    }
  }

  // UI helper methods
  getImagePreview(): string | null {
    return this.imagePreview || this.getDefaultImagePreview();
  }

  private getDefaultImagePreview(): string {
    if (this.currentProduct?.productImage && this.currentProduct.productImage !== 'default-product.png') {
      return `https://localhost:7158/uploads/${this.currentProduct.productImage}`;
    }
    
    const selectedCategory = this.categories.find(c => 
      c.productCategoryId === this.productForm.get('category')?.value
    );
    const selectedType = this.types.find(t => 
      t.productTypeId === this.productForm.get('type')?.value
    );
    
    if (selectedCategory?.categoryName?.toLowerCase().includes('clothing')) {
      return 'assets/Images/t-shirt.png';
    }
    if (selectedCategory?.categoryName?.toLowerCase().includes('electronic')) {
      return 'assets/Images/Headphones.webp';
    }
    if (selectedType?.typeName?.toLowerCase().includes('jacket')) {
      return 'assets/Images/Jacket.png';
    }
    
    return 'assets/Images/default-product.svg';
  }

  getColorStyle(colorName: string): string {
    const colorMap: { [key: string]: string } = {
      'black': '#000000',
      'white': '#ffffff',
      'red': '#ff0000',
      'blue': '#0000ff',
      'green': '#008000',
      'yellow': '#ffff00',
      'purple': '#800080',
      'orange': '#ffa500',
      'pink': '#ffc0cb',
      'brown': '#a52a2a',
      'grey': '#808080',
      'gray': '#808080',
      'silver': '#c0c0c0',
      'gold': '#ffd700'
    };
    
    return colorMap[colorName?.toLowerCase()] || '#cccccc';
  }

  onImageLoadError(event: any): void {
    console.warn('Image failed to load:', event.target.src);
  }

  // Helper methods for getting names
  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.productCategoryId === categoryId);
    return category ? category.categoryName : '';
  }

  getTypeName(typeId: number): string {
    const type = this.types.find(t => t.productTypeId === typeId);
    return type ? type.typeName : '';
  }

  getCurrentProductImageSrc(): string {
    if (this.currentProduct?.productImage && this.currentProduct.productImage !== 'default-product.png') {
      return `https://localhost:7158/uploads/${this.currentProduct.productImage}`;
    }
    return 'assets/Images/default-product.svg';
  }

  // Navigation methods
  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  // User methods for header
  getCurrentUserInitials(): string {
    try {
      const adminRaw = sessionStorage.getItem('adminData');
      if (adminRaw) {
        const a: any = JSON.parse(adminRaw);
        const first = (a.firstName || a.firstname || a.name || '').toString();
        const last = (a.lastName || a.surname || '').toString();
        const initials = ((first[0] || '') + (last[0] || '')).toUpperCase();
        if (initials.trim()) return initials;
      }

      const uRaw = localStorage.getItem('currentUserLoggedIn');
      if (uRaw) {
        const u: any = JSON.parse(uRaw);
        const first = (u.firstName || u.firstname || u.name || '').toString();
        const last = (u.lastName || u.surname || '').toString();
        const initials = ((first[0] || '') + (last[0] || '')).toUpperCase();
        if (initials.trim()) return initials;
      }
    } catch (e) {}
    return 'AD';
  }

  getCurrentUserName(): string {
    try {
      const adminRaw = sessionStorage.getItem('adminData');
      if (adminRaw) {
        const a: any = JSON.parse(adminRaw);
        const name = `${a.firstName || a.firstname || a.name || ''} ${a.lastName || a.surname || ''}`.trim();
        if (name) return name;
      }

      const uRaw = localStorage.getItem('currentUserLoggedIn');
      if (uRaw) {
        const u: any = JSON.parse(uRaw);
        const name = `${u.firstName || u.firstname || u.name || ''} ${u.lastName || u.surname || ''}`.trim();
        if (name) return name;
      }
    } catch (e) {}
    return 'Admin';
  }

  getCurrentUserRole(): string {
    try {
      const adminRaw = sessionStorage.getItem('adminData');
      if (adminRaw) {
        const a: any = JSON.parse(adminRaw);
        if (a.role) return a.role;
      }

      const uRaw = localStorage.getItem('currentUserLoggedIn');
      if (uRaw) {
        const u: any = JSON.parse(uRaw);
        if (u.role || u.userRole) return u.role || u.userRole;
      }
    } catch (e) {}
    return 'Administrator';
  }

  logout(): void {
    localStorage.removeItem('currentUserLoggedIn');
    sessionStorage.removeItem('adminData');
    this.showProfileMenu = false;
    this.router.navigate(['/home']);
  }

  // Management functions for categories, types, sizes, and colors
  manageCategories(): void {
    this.router.navigate(['/manage-categories']);
  }

  manageTypes(): void {
    this.router.navigate(['/manage-types']);
  }

  manageSizes(): void {
    this.router.navigate(['/manage-sizes']);
  }

  manageColors(): void {
    this.router.navigate(['/manage-colors']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

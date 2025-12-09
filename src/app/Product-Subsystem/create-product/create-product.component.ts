
/**
 * create-product.component.ts
 * --------------------------
 * Angular component for creating new products in the Product Subsystem.
 * Handles form logic, cascading dropdowns, image upload, and submission to backend.
 * Provides a user-friendly UI for admins to add products with all required details.
 */
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormArray } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateTypeComponent } from '../create-type/create-type.component';
import { CreateCategoryComponent } from '../create-category/create-category.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { 
  Iproduct, 
  IproductCategory, 
  Iproductcolor, 
  Iproductsize, 
  IproductType,
  IsizeType,
  ICreateProductDto
} from '../../Interfaces/iproduct';
import { ProductService } from '../../API-Services/product.service';
import { ImageService } from '../../API-Services/image.service';
import { FileUploadService } from '../../API-Services/file-upload.service';
import { NotificationService } from '../../API-Services/notification.service';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { NotificationModalComponent } from '../../Notification/notification.component';


/**
 * CreateProductComponent
 * ---------------------
 * Provides a form for creating new products, including all required fields,
 * image upload, and assignment of sizes, colors, categories, and types.
 * Handles form validation, cascading dropdowns, and submission to the backend.
 * Also manages UI state for image preview, drag-and-drop, and navigation.
 */
@Component({
  selector: 'app-create-product',
  imports: [ReactiveFormsModule, CommonModule, NavBarAdminComponent, FormsModule, MatDialogModule, NotificationModalComponent],
  templateUrl: './create-product.component.html',
  styleUrl: './create-product.component.css',
  standalone: true
})
export class CreateProductComponent implements OnInit, OnDestroy {

  showProfileMenu: boolean = false;
  activeSection: string = 'products';
  productForm!: FormGroup;
  loading = false;
  saving = false;
  submitted = false; // Track if form has been submitted
  
  // Data arrays for dropdowns
  sizes: Iproductsize[] = [];
  colors: Iproductcolor[] = [];
  categories: IproductCategory[] = [];
  types: IproductType[] = [];
  filteredTypes: IproductType[] = []; //  Types filtered by selected category
  sizeTypes: IsizeType[] = []; //  Size types
  filteredSizes: Iproductsize[] = []; //  Sizes filtered by selected size type
  
  // Image handling properties
  imagePreview: string | null = null;
  selectedImageFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;
  isDragOver = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private productService: ProductService,
    private imageService: ImageService,
    private fileUploadService: FileUploadService,
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    this.setupForm();
    this.loadProductData();
    this.setupFormSubscriptions(); // Setup reactive form subscriptions
  }

  // Initialize the reactive form with new business logic
  private setupForm(): void {
    this.productForm = this.fb.group({
      productName: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      category: [null, Validators.required],
      type: [null, Validators.required],
      sizeType: [null, Validators.required], //  Size type selection
      price: [null, [Validators.required, Validators.min(0.01)]],
      selectedSizes: this.fb.array([]),
      selectedColors: this.fb.array([]),
      productImage: [''],
    
    });
  }

  // Setup reactive form subscriptions for cascading dropdowns
  private setupFormSubscriptions(): void {
    // When category changes, filter types and reset dependent fields
    this.productForm.get('category')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(categoryId => {
        this.onCategoryChange(categoryId);
      });

    // When size type changes, filter sizes and reset size selections
    this.productForm.get('sizeType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(sizeTypeId => {
        this.onSizeTypeChange(sizeTypeId);
      });
  }

  // Handle category change (filter types)
  private onCategoryChange(categoryId: number): void {
    console.log('Category changed to:', categoryId); // DEBUG
    if (categoryId) {
      // Call backend API to get types for the selected category
      this.productService.GetTypesByCategory(categoryId).subscribe({
        next: (data) => {
          console.log('Types received for category:', data); // DEBUG
          this.filteredTypes = data.types || [];
        },
        error: (error) => {
          console.error('Error loading types for category:', error);
          this.filteredTypes = [];
        }
      });
    } else {
      this.filteredTypes = [];
    }
    
    // Reset dependent fields
    this.productForm.patchValue({
      type: null
    });
  }

  // Handle size type change (filter sizes)
  private onSizeTypeChange(sizeTypeId: number): void {
    console.log('Size type changed to:', sizeTypeId); // DEBUG
    
    // Reset size selections first
    const sizeArray = this.productForm.get('selectedSizes') as FormArray;
    sizeArray.clear();
    
    if (sizeTypeId) {
      // Call backend API to get sizes for the selected size type
      this.productService.GetSizesBySizeType(sizeTypeId).subscribe({
        next: (data) => {
          console.log('Sizes received for size type:', data); // DEBUG
          this.filteredSizes = data.sizes || [];
          this.updateSizeFormArray();
        },
        error: (error) => {
          console.error('Error loading sizes for size type:', error);
          this.filteredSizes = [];
          this.updateSizeFormArray();
        }
      });
    } else {
      this.filteredSizes = [];
      this.updateSizeFormArray();
    }
  }

  // Load all necessary data for dropdowns
  private loadProductData(): void {
    this.loadCategories();
    this.loadTypes();
    this.loadSizeTypes(); //  Load size types
    this.loadSizes();
    this.loadColors();
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
        this.filteredTypes = []; // Start with empty filtered list
      },
      error: (error) => {
        console.error('Error loading types:', error);
        alert('Failed to load types');
      }
    });
  }

  //  Load size types
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

  private updateSizeFormArray(): void {
    const sizeArray = this.productForm.get('selectedSizes') as FormArray;
    sizeArray.clear();
    this.filteredSizes.forEach(() => { // Use filtered sizes instead of all sizes
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
    //Updated to include ownerId
     const owerId:any = JSON.parse(sessionStorage.getItem('adminData')!);
     formData.ownerId = owerId?.userId;
    
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

    // Show confirmation modal before creating product
    this.notificationService.showWarning(
      'Create Product',
      'Are you sure you want to create this product?',
      'Create',
      'Cancel'
    );

    // Subscribe to confirmation result
    this.notificationService.confirmation$.pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (confirmed) {
        // If there's a selected image file, upload it first, then create the product
        if (this.selectedImageFile) {
          this.uploadImageAndCreateProduct(formData, selectedSizeIds, selectedColorIds);
        } else {
          // Create product without image
          this.createProductWithData(formData, selectedSizeIds, selectedColorIds, 'default-product.png');
        }
      }
    });
  }

  private uploadImageAndCreateProduct(formData: any, selectedSizeIds: number[], selectedColorIds: number[]): void {
    this.saving = true;
    this.isUploading = true;
    this.uploadProgress = 0;

    console.log('Uploading image before creating product...');

    this.fileUploadService.uploadImageWithProgress(this.selectedImageFile!).subscribe({
      next: (event) => {
        if (event.progress !== undefined) {
          this.uploadProgress = event.progress;
        }
        
        if (event.response) {
          console.log('Image uploaded successfully:', event.response);
          this.isUploading = false;
          
          // Now create the product with the uploaded image filename
          this.createProductWithData(formData, selectedSizeIds, selectedColorIds, event.response.fileName);
        }
      },
      error: (error) => {
        console.error('Image upload failed:', error);
        this.isUploading = false;
        this.saving = false;
        this.uploadProgress = 0;
        this.notificationService.showError(
          'Upload Failed',
          'Image upload failed. Please try again.'
        );
      }
    });
  }

  private createProductWithData(formData: any, selectedSizeIds: number[], selectedColorIds: number[], imageName: string): void {
    // Create product object using new DTO structure
    const newProduct: ICreateProductDto = {
      productName: formData.productName.trim(),
      productDescription: formData.description.trim(),
      price: Number(formData.price),
      productImage: imageName,
      productTypeId: Number(formData.type),
      sizeTypeId: Number(formData.sizeType), // Size type ID
      sizeIds: selectedSizeIds, //  Array of selected size IDs
      colorIds: selectedColorIds, // Array of selected color IDs
      userId: formData.ownerId // Admin creating the product
    };

    console.log('Creating product with data:', newProduct);

    // Submit the product
    this.productService.CreateProduct(newProduct).subscribe({
      next: (response) => {
        console.log('Product created successfully:', response);
        
        this.notificationService.showSuccess(
          'Product Created Successfully!',
          `${newProduct.productName} has been added to the product catalog.`,
          'Continue'
        );
        this.saving = false;
        
        // Navigate immediately after success
        setTimeout(() => {
          this.router.navigate(['/products']);
        }, 1500);
      },
      error: (error) => {
        console.error('Error creating product:', error);
        this.saving = false;
        
        if (error.status === 400 && error.error?.errors) {
          const errorMessages = this.extractValidationErrors(error.error.errors);
          this.notificationService.showError(
            'Validation Error',
            errorMessages
          );
        } else {
          this.notificationService.showError(
            'Creation Failed',
            'Failed to create product. Please check your data and try again.'
          );
        }
      }
    });
  }

  private getSelectedSizeIds(): number[] {
    return this.filteredSizes // Use filtered sizes instead of all sizes
      .filter((_, index) => this.selectedSizes.at(index)?.value)
      .map(size => size.productSizeId);
  }

  private getSelectedColorIds(): number[] {
    return this.colors
      .filter((_, index) => this.selectedColors.at(index)?.value)
      .map(color => color.productColorId); // use productColorId instead of productColourId
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

  removeImage(): void {
    this.selectedImageFile = null;
    this.imagePreview = null;
    this.uploadProgress = 0;
    this.productForm.patchValue({ productImage: '' });
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
    this.router.navigate(['/products/manage-categories']);
  }

  manageTypes(): void {
    this.router.navigate(['/products/manage-types']);
  }

  manageSizes(): void {
    this.router.navigate(['/products/manage-sizes']);
  }

  manageColors(): void {
    this.router.navigate(['/products/manage-colors']);
  }
}



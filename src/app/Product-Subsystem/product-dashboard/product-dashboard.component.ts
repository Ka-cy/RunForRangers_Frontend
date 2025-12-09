import { Component, OnInit } from '@angular/core';
import { Iproduct, IproductCategory, IproductType, Iproductcolor, IProductWithDetails} from '../../Interfaces/iproduct';
import { CommonModule } from '@angular/common';
import { Route, Router, NavigationEnd, provideRouter } from '@angular/router';
import { filter } from 'rxjs/operators';
import { EditProductComponent } from '../edit-product/edit-product.component';
import { ProductService } from '../../API-Services/product.service';
import { ImageService } from '../../API-Services/image.service';
import { UserService } from '../../API-Services/user.service';
import { NotificationService } from '../../API-Services/notification.service';
import { NavBarAdminComponent } from "../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component";
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DynamicImageComponent } from '../../shared/dynamic-image/dynamic-image.component';
import { HelpButtonComponent } from '../../Admin-Subsystem/help-button/help-button/help-button.component';
import { NotificationModalComponent } from '../../Notification/notification.component';

/**
 * ProductDashboardComponent
 * ------------------------
 * This component provides a dashboard for managing products, including listing, searching,
 * filtering, sorting, and navigation to product management features (add, edit, analytics, etc).
 * It also handles category/type/color management navigation and user profile menu.
 */
@Component({
  selector: 'app-product-dashboard',
  imports: [CommonModule, NavBarAdminComponent, ReactiveFormsModule, FormsModule, DynamicImageComponent, HelpButtonComponent, NotificationModalComponent],
  standalone: true,
  templateUrl: './product-dashboard.component.html',
  styleUrls: ['./product-dashboard.component.css']
})
export class ProductDashboardComponent implements OnInit {
 
  activeRoute: string = 'products';
 
  showProfileMenu: boolean = false;

  // Minimal user helpers for header
  

  /**
   * Constructor injects required services for product management and navigation
   */
  constructor(
    private productService: ProductService,
    private imageService: ImageService,
    private router: Router,
    private userService: UserService,
    private notificationService: NotificationService
  ) { }

  // Robust user helpers for header: check sessionStorage.adminData, localStorage.currentUserLoggedIn, then userService.currentUser
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

      const svc: any = (this as any).userService;
      if (svc && svc.currentUser) {
        const s = svc.currentUser;
        const first = (s.firstName || s.firstname || s.name || '').toString();
        const last = (s.lastName || s.surname || '').toString();
        const initials = ((first[0] || '') + (last[0] || '')).toUpperCase();
        if (initials.trim()) return initials;
      }
    } catch (e) {
      // ignore parse errors
    }
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

      const svc: any = (this as any).userService;
      if (svc && svc.currentUser) {
        const s = svc.currentUser;
        const name = `${s.firstName || s.firstname || s.name || ''} ${s.lastName || s.surname || ''}`.trim();
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

      const svc: any = (this as any).userService;
      if (svc && svc.currentUser) return svc.currentUser.role || 'Administrator';
    } catch (e) {}
    return 'Administrator';
  }
 
  selectedProductId: number | null = null;

  products: Iproduct[] = [];

  filteredProducts: Iproduct[] = [];

  categories: IproductCategory[] = [];

  types: IproductType[] = [];

  colors: Iproductcolor[] = [];
 
  productColors: { [productId: number]: Iproductcolor[] } = {};
  
  activeSection: string = 'products';

  error: string | null = null;


  searchTerm: string = '';

  selectedCategory: string = '';

  selectedType: string = '';
 
  priceRangeMin: number | null = null;
 
  priceRangeMax: number | null = null;

  sortBy: string = 'name';
  
  sortOrder: 'asc' | 'desc' = 'asc';
  /**
   * OnInit lifecycle hook: loads all required data and sets up route tracking
   */
  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.loadTypes();
    this.loadColors();
    // Track route changes for active section highlighting
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.activeRoute = event.url.split('/')[1] || 'products';
      });
  }
  selectProduct(productId: number): void {
    this.selectedProductId = productId === this.selectedProductId ? null : productId;
  }

  loadProducts(): void {
    this.productService.GetAllProducts().subscribe({
      next: (products: Iproduct[]) => {
        this.products = products;
        this.filteredProducts = [...products]; // Initialize filtered products
        this.applyFilters(); // Apply any existing filters
      },
         error: (error: any) => {
        console.error('Error loading products:', error);
        this.error = 'Failed to load products. Please try again later.';
        this.products = []; // Clear products on error
        this.filteredProducts = [];
      }
    });
  }

  loadCategories(): void {
    this.productService.GetProductCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadTypes(): void {
    this.productService.GetProductTypes().subscribe({
      next: (types) => {
        this.types = types;
      },
      error: (error) => {
        console.error('Error loading types:', error);
      }
    });
  }

  loadColors(): void {
    this.productService.GetProductColors().subscribe({
      next: (colors) => {
        this.colors = colors;
      },
      error: (error) => {
        console.error('Error loading colors:', error);
      }
    });
  }

  // Search functionality
  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyFilters();
  }

  // Handle search input events
  onSearchInput(event: any): void {
    const value = event.target.value;
    this.onSearchChange(value);
  }

  // Handle search button click
  onSearchClick(): void {
    this.onSearchChange(this.searchTerm);
  }

  // Filter by category
  onCategoryFilter(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.applyFilters();
  }

  // Filter by type
  onTypeFilter(typeId: string): void {
    this.selectedType = typeId;
    this.applyFilters();
  }

  // Filter by price range
  onPriceFilter(): void {
    this.applyFilters();
  }

  // Sort functionality
  onSort(sortBy: string): void {
    if (this.sortBy === sortBy) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'asc';
    }
    this.applyFilters();
  }

  // Clear all filters
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedType = '';
    this.priceRangeMin = null;
    this.priceRangeMax = null;
    this.sortBy = 'name';
    this.sortOrder = 'asc';
    this.applyFilters();
  }

  // Apply all filters and sorting
  applyFilters(): void {
    let filtered = [...this.products];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.productName.toLowerCase().includes(searchLower) ||
        product.productDescription?.toLowerCase().includes(searchLower) ||
        product.productId.toString().includes(searchLower)
      );
    }

    // Apply category filter - need to check through product type relationship
    if (this.selectedCategory && this.selectedCategory !== '') {
      const categoryId = parseInt(this.selectedCategory, 10);
      filtered = filtered.filter(product => {
        const productType = this.types.find(type => type.productTypeId === product.productTypeId);
        return productType?.productCategoryId === categoryId;
      });
    }

    // Apply type filter
    if (this.selectedType && this.selectedType !== '') {
      const typeId = parseInt(this.selectedType, 10);
      filtered = filtered.filter(product => product.productTypeId === typeId);
    }

    // Apply price range filter
    if (this.priceRangeMin !== null) {
      filtered = filtered.filter(product => product.price >= this.priceRangeMin!);
    }
    if (this.priceRangeMax !== null) {
      filtered = filtered.filter(product => product.price <= this.priceRangeMax!);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'name':
          comparison = a.productName.localeCompare(b.productName);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'id':
          comparison = a.productId - b.productId;
          break;
        default:
          comparison = 0;
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredProducts = filtered;
  }

  // Get category name by ID
  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.productCategoryId === categoryId);
    return category ? category.categoryName : `Category ${categoryId}`;
  }

  // Get category name from product (through type relationship)
  getCategoryNameForProduct(product: Iproduct): string {
    const productType = this.types.find(type => type.productTypeId === product.productTypeId);
    if (productType) {
      return this.getCategoryName(productType.productCategoryId);
    }
    return 'Unknown Category';
  }

  // Get type name by ID  
  getTypeName(typeId: number): string {
    const type = this.types.find(t => t.productTypeId === typeId);
    return type ? type.typeName : `Type ${typeId}`;
  }

  // Get color name by ID
  getColorName(colorId: number): string {
    const color = this.colors.find(c => c.productColorId === colorId);
    return color ? color.colorName : `Color ${colorId}`;
  }

  // Get available colors for a specific product (simulated based on product ID)
  getAvailableColorsForProduct(product: Iproduct): Iproductcolor[] {
    if (!this.colors.length) return [];
    
    // Simulate different color combinations based on product ID and type
    const productSeed = product.productId + (product.productTypeId || 0);
    const numberOfColors = Math.min(2 + (productSeed % 4), this.colors.length); // 2-5 colors
    const startIndex = productSeed % Math.max(1, this.colors.length - numberOfColors + 1);
    
    // Get a unique subset of colors for this product
    const productColors: Iproductcolor[] = [];
    for (let i = 0; i < numberOfColors; i++) {
      const colorIndex = (startIndex + i) % this.colors.length;
      productColors.push(this.colors[colorIndex]);
    }
    
    return productColors;
  }

  // Get color by ID
  getColorById(colorId: number): Iproductcolor | undefined {
    return this.colors.find(c => c.productColorId === colorId);
  }

  // Convert color name to CSS color value
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
      'gold': '#ffd700',
      'beige': '#f5f5dc',
      'navy': '#000080',
      'maroon': '#800000',
      'teal': '#008080',
      'olive': '#808000',
      'lime': '#00ff00',
      'aqua': '#00ffff',
      'fuchsia': '#ff00ff'
    };
    
    return colorMap[colorName.toLowerCase()] || '#cccccc';
  }

  // Check if any filters are active
  hasActiveFilters(): boolean {
    return !!(this.searchTerm || 
             (this.selectedCategory && this.selectedCategory !== '') || 
             (this.selectedType && this.selectedType !== '') || 
             this.priceRangeMin !== null || 
             this.priceRangeMax !== null);
  }

  // Get filter status for UI
  getFilterStatus(): string {
    const activeFilters: string[] = [];
    
    if (this.searchTerm) activeFilters.push('Search');
    if (this.selectedCategory && this.selectedCategory !== '') activeFilters.push('Category');
    if (this.selectedType && this.selectedType !== '') activeFilters.push('Type');
    if (this.priceRangeMin !== null || this.priceRangeMax !== null) activeFilters.push('Price');
    
    return activeFilters.length > 0 ? `Filtered by: ${activeFilters.join(', ')}` : '';
  }


 

   deleteProduct(productId: number): void {
    // Find the product to get its name for the confirmation
    const product = this.filteredProducts.find(p => p.productId === productId);
    const productName = product ? product.productName : 'this product';

    // Show confirmation modal
    this.notificationService.showWarning(
      'Delete Product',
      `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
      'Delete',
      'Cancel'
    );

    // Subscribe to confirmation result
    this.notificationService.confirmation$.subscribe(confirmed => {
      if (confirmed) {
        this.productService.DeleteProduct(productId).subscribe({
          next: (response: string) => {
            console.log('Product deleted:', response);
            this.notificationService.showSuccess(
              'Product Deleted Successfully',
              `"${productName}" has been removed from the product catalog.`
            );
            this.loadProducts(); // This will reload and apply filters
          },
          error: (error: any) => {
            console.error('Error deleting product:', error);
            this.notificationService.showError(
              'Delete Failed',
              'Failed to delete product. Please try again.'
            );
          }
        });
      }
    });
  }
editProduct(productId: number): void {
  if (productId) {
    this.router.navigate(['/products/edit', productId]);
  }
}


  addProduct(): void {
    this.router.navigate(['products/add']);
  }

  viewAnalytics(): void {
    this.router.navigate(['products/analytics']);
  }

  // Management navigation methods
  manageCategories(): void {
    this.router.navigate(['products/manage-categories']);
  }

  manageTypes(): void {
    this.router.navigate(['products/manage-types']);
  }

  manageColors(): void {
    this.router.navigate(['products/manage-colors']);
  }

  manageSizes(): void {
    this.router.navigate(['products/manage-sizes']);
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }


toggleProfileMenu(): void {
  this.showProfileMenu = !this.showProfileMenu;
}




// Add logout method
logout() {
  localStorage.removeItem('currentUserLoggedIn');
  this.router.navigate(['/home']); // Or your login route
}
}

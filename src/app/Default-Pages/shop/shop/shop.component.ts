import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartDto, CreateCartItemDto } from '../../../API-Services/cart.service';
import { ProductService } from '../../../API-Services/product.service';
import { Iproduct, IproductType, IproductCategory, IProductWithDetails, Iproductcolor, Iproductsize } from '../../../Interfaces/iproduct';
import { DynamicImageComponent } from '../../../shared/dynamic-image/dynamic-image.component';
import { forkJoin } from 'rxjs';
import { NavBarDefaultComponent } from "../../../nav-bar-default/nav-bar-default.component";

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicImageComponent, NavBarDefaultComponent],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css']
})
export class ShopComponent implements OnInit {
  products: Iproduct[] = [];
  productsWithDetails: IProductWithDetails[] = [];
  cartItems: any[] = []; // handles both CartItem and local storage format
  showDropdown: boolean = false;
  isMenuOpen: boolean = false;
  currentUser: any = null;
  error: string | null = null;
  isSidebarOpen: boolean = false;
  showFilters: boolean = false;
  searchQuery: string = '';
  selectedType: string = 'All';
  selectedPrice: string = 'All';
  selectedFeatured: string = '';
  sortOption: string = 'featured';
  filteredProducts: Iproduct[] = [];
  showQuickView: boolean = false;
  selectedProduct: Iproduct | null = null;
  selectedProductDetails: IProductWithDetails | null = null;
  productTypes: IproductType[] = [];
  productCategories: IproductCategory[] = [];

  // Product variant selection state
  selectedColors: { [productId: number]: Iproductcolor | null } = {};
  selectedSizes: { [productId: number]: Iproductsize | null } = {};

  // Quick view variant selection
  quickViewSelectedColor: Iproductcolor | null = null;
  quickViewSelectedSize: Iproductsize | null = null;

  // Cart hover functionality
  showCartDropdown: boolean = false;
  cartHoverTimeout: any = null;

  constructor(
    private router: Router,
    private cartService: CartService,
    private productService: ProductService
  ) {}

  // Get the cart storage key for the current user
  private getCartStorageKey(): string {
    if (this.currentUser?.userId) {
      return `cart_user_${this.currentUser.userId}`;
    }
    return 'cart_guest';
  }

  // Save cart to localStorage with user-specific key
  private saveCartToStorage(cartItems: any[]): void {
    const storageKey = this.getCartStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(cartItems));
  }

  // Load cart from localStorage with user-specific key
  private loadCartFromStorage(): any[] {
    const storageKey = this.getCartStorageKey();
    const cartData = localStorage.getItem(storageKey);
    return cartData ? JSON.parse(cartData) : [];
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadProducts();
    this.loadProductTypes();
    this.loadProductCategories();
    this.loadCart();
  }

  loadProducts(): void {
    this.productService.GetAllProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = products;

        // Load detailed product information with variants for each product
        const productDetailRequests = products.map(product =>
          this.productService.GetProductById(product.productId)
        );

        forkJoin(productDetailRequests).subscribe({
          next: (detailedProducts) => {
            this.productsWithDetails = detailedProducts;
            console.log('Products with details loaded:', this.productsWithDetails);
          },
          error: (err) => {
            console.error('Error fetching product details:', err);
            // Continue with basic products if details fail
          }
        });
      },
      error: (err) => {
        console.error('Error fetching products:', err);
        this.error = 'Failed to load products.';
      }
    });
  }

  loadProductTypes(): void {
    this.productService.GetProductTypes().subscribe({
      next: (types) => {
        this.productTypes = types;
      },
      error: (err) => {
        console.error('Error fetching product types:', err);
      }
    });
  }

  loadProductCategories(): void {
    this.productService.GetProductCategories().subscribe({
      next: (categories) => {
        this.productCategories = categories;
      },
      error: (err) => {
        console.error('Error fetching product categories:', err);
      }
    });
  }

  loadCart(): void {
    if (this.isUserLoggedIn() && this.currentUser?.userId) {
      // Load cart from database for logged-in users
      this.cartService.getCart(this.currentUser.userId).subscribe({
        next: (cartDto: CartDto) => {
          this.cartItems = cartDto.cartItems || [];
          console.log('Cart loaded from database:', this.cartItems);
        },
        error: (err) => {
          console.error('Error loading cart from database, falling back to localStorage:', err);
          // Fallback to localStorage if database fails
          this.loadCartFromLocalStorage();
        }
      });
    } else {
      // Load from localStorage for guests
      this.loadCartFromLocalStorage();
    }
  }

  private loadCartFromLocalStorage(): void {
    const cartData = this.loadCartFromStorage();
    this.cartItems = cartData.map((item: any) => ({
      cartItemId: item.cartItemId || 0,
      cartId: item.cartId || 0,
      productId: item.productId || 0,
      productColorId: item.productColorId || item.productColourId || 0,
      productSizeId: item.productSizeId || 0,
      quantity: item.quantity ?? 1,
      price: item.price || 0
    }));
  }

  loadCurrentUser(): void {
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
        console.log('Current user loaded from sessionStorage:', this.currentUser);
        // Transfer guest cart to user cart when logging in
        this.transferGuestCartToUser();
      } catch (error) {
        console.error('Error parsing user data from sessionStorage:', error);
        this.currentUser = null;
      }
    } else {
      console.log('No user data found in sessionStorage');
      this.currentUser = null;
    }
  }

  // Transfer guest cart to user cart when logging in and sync to database
  private transferGuestCartToUser(): void {
    const guestCart = localStorage.getItem('cart_guest');
    if (guestCart && this.currentUser?.userId) {
      const guestItems = JSON.parse(guestCart);
      if (guestItems.length > 0) {
        // Convert localStorage items to CreateCartItemDto format
        const cartItems: CreateCartItemDto[] = guestItems.map((item: any) => ({
          productId: item.productId,
          productColorId: item.productColorId || item.productColourId || 0,
          productSizeId: item.productSizeId || 0,
          quantity: item.quantity || 1,
          price: item.price
        }));

        // Create cart with items in database
        this.cartService.createCartWithItems(this.currentUser.userId, cartItems).subscribe({
          next: (cartDto) => {
            console.log('Guest cart transferred to database successfully:', cartDto);
            this.cartItems = cartDto.cartItems || [];
            // Remove guest cart from localStorage
            localStorage.removeItem('cart_guest');
            // Remove user-specific localStorage cart as we're now using database
            localStorage.removeItem(`cart_user_${this.currentUser.userId}`);
          },
          error: (err) => {
            console.error('Error transferring guest cart to database:', err);
            // Fallback: transfer to user's localStorage
            const userCartKey = `cart_user_${this.currentUser.userId}`;
            const existingUserCart = localStorage.getItem(userCartKey);

            if (!existingUserCart) {
              localStorage.setItem(userCartKey, guestCart);
            } else {
              const userItems = JSON.parse(existingUserCart);
              const mergedItems = [...userItems, ...guestItems];
              localStorage.setItem(userCartKey, JSON.stringify(mergedItems));
            }
            localStorage.removeItem('cart_guest');
            this.loadCartFromLocalStorage();
          }
        });
      }
    }
  }

  isUserLoggedIn(): boolean {
    return !!this.currentUser;
  }

  onSearch(): void {
    this.filterProducts();
  }

  onTypeFilter(type: string): void {
    this.selectedType = type;
    this.filterProducts();
  }

  onPriceFilter(price: string): void {
    this.selectedPrice = price;
    this.filterProducts();
  }

  onFeaturedFilter(featured: string): void {
    this.selectedFeatured = this.selectedFeatured === featured ? '' : featured;
    this.filterProducts();
  }

  onSortChange(): void {
    this.filterProducts();
  }

  clearFilters(): void {
    this.selectedType = 'All';
    this.selectedPrice = 'All';
    this.selectedFeatured = '';
    this.sortOption = 'featured';
    this.searchQuery = '';
    this.filterProducts();
  }

  filterProducts(): void {
    let filtered = [...this.products];

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.productName.toLowerCase().includes(query) ||
        this.getTypeName(product.productTypeId).toLowerCase().includes(query)
      );
    }

    if (this.selectedType !== 'All') {
      const type = this.productTypes.find(t => t.typeName === this.selectedType);
      if (type) {
        filtered = filtered.filter(product => product.productTypeId === type.productTypeId);
      }
    }

    if (this.selectedPrice !== 'All') {
      filtered = filtered.filter(product => {
        const price = product.price;
        switch (this.selectedPrice) {
          case 'Low':
            return price < 50;
          case 'Medium':
            return price >= 50 && price <= 200;
          case 'High':
            return price > 200;
          default:
            return true;
        }
      });
    }

    if (this.selectedFeatured) {
      if (this.selectedFeatured === 'bestsellers') {
        const bestSellerIds = this.products.slice(0, 5).map(p => p.productId);
        filtered = filtered.filter(product => bestSellerIds.includes(product.productId));
      } else if (this.selectedFeatured === 'new') {
        const newArrivalIds = this.products.slice(-5).map(p => p.productId);
        filtered = filtered.filter(product => newArrivalIds.includes(product.productId));
      }
    }

    filtered.sort((a, b) => {
      switch (this.sortOption) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return a.productName.localeCompare(b.productName);
        case 'name-desc':
          return b.productName.localeCompare(a.productName);
        case 'featured':
        default:
          return 0;
      }
    });

    this.filteredProducts = filtered;
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  addToCart(product: Iproduct): void {
    if (!this.canAddToCart(product.productId)) {
      alert('Please select all required options (color/size) before adding to cart.');
      return;
    }

    const selectedColor = this.getSelectedColor(product.productId);
    const selectedSize = this.getSelectedSize(product.productId);

    if (this.isUserLoggedIn() && this.currentUser?.userId) {
      // Add to database for logged-in users
      const cartItem: CreateCartItemDto = {
        productId: product.productId,
        productColorId: selectedColor?.productColorId || 0,
        productSizeId: selectedSize?.productSizeId || 0,
        quantity: 1,
        price: product.price
      };

      this.cartService.addItemToUserCart(this.currentUser.userId, cartItem).subscribe({
        next: (addedItem) => {
          console.log('Item added to cart in database:', addedItem);
          // Reload cart to get updated state
          this.loadCart();
          alert('Product added to cart successfully!');
        },
        error: (err) => {
          console.error('Error adding item to database cart, using localStorage fallback:', err);
          this.addToCartLocalStorage(product, selectedColor, selectedSize);
        }
      });
    } else {
      // Add to localStorage for guests
      this.addToCartLocalStorage(product, selectedColor, selectedSize);
    }
  }

  private addToCartLocalStorage(product: Iproduct, selectedColor: Iproductcolor | null, selectedSize: Iproductsize | null): void {
    const cartData = this.loadCartFromStorage();
    let cartItems: any[] = cartData;

    // Check if item with same product, color, and size already exists
    const existingItemIndex = cartItems.findIndex(item =>
      item.productId === product.productId &&
      item.productColorId === selectedColor?.productColorId &&
      item.productSizeId === selectedSize?.productSizeId
    );

    if (existingItemIndex > -1) {
      cartItems[existingItemIndex].quantity = (cartItems[existingItemIndex].quantity ?? 1) + 1;
    } else {
      cartItems.push({
        cartItemId: Date.now() + Math.random(),
        cartId: 0,
        productId: product.productId,
        productColorId: selectedColor?.productColorId || 0,
        productSizeId: selectedSize?.productSizeId || 0,
        quantity: 1,
        price: product.price
      });
    }
    this.saveCartToStorage(cartItems);
    this.cartItems = cartItems;
    alert('Product added to cart successfully!');
  }

  addToCartFromQuickView(): void {
    if (!this.selectedProduct || !this.canAddToCartQuickView()) {
      return;
    }

    const selectedColor = this.quickViewSelectedColor;
    const selectedSize = this.quickViewSelectedSize;

    if (this.isUserLoggedIn() && this.currentUser?.userId) {
      // Add to database for logged-in users
      const cartItem: CreateCartItemDto = {
        productId: this.selectedProduct.productId,
        productColorId: selectedColor?.productColorId || 0,
        productSizeId: selectedSize?.productSizeId || 0,
        quantity: 1,
        price: this.selectedProduct.price
      };

      this.cartService.addItemToUserCart(this.currentUser.userId, cartItem).subscribe({
        next: (addedItem) => {
          console.log('Item added to cart in database from quick view:', addedItem);
          // Reload cart to get updated state
          this.loadCart();
          alert('Product added to cart successfully!');
          this.closeQuickView();
        },
        error: (err) => {
          console.error('Error adding item to database cart, using localStorage fallback:', err);
          this.addToCartLocalStorage(this.selectedProduct!, selectedColor, selectedSize);
          this.closeQuickView();
        }
      });
    } else {
      // Add to localStorage for guests
      this.addToCartLocalStorage(this.selectedProduct, selectedColor, selectedSize);
      this.closeQuickView();
    }
  }

  getTypeCount(typeName: string): number {
    const type = this.productTypes.find(t => t.typeName === typeName);
    if (!type) return 0;
    return this.products.filter(product => product.productTypeId === type.productTypeId).length;
  }

  getPriceCount(priceRange: string): number {
    return this.products.filter(product => {
      const price = product.price;
      switch (priceRange) {
        case 'Low':
          return price < 50;
        case 'Medium':
          return price >= 50 && price <= 200;
        case 'High':
          return price > 200;
        default:
          return false;
      }
    }).length;
  }

  getBestSellersCount(): number {
    return Math.min(5, this.products.length);
  }

  getNewArrivalsCount(): number {
    return Math.min(5, this.products.length);
  }

  openQuickView(product: Iproduct): void {
    this.selectedProduct = product;
    this.quickViewSelectedColor = null;
    this.quickViewSelectedSize = null;

    // Find the detailed product information
    this.selectedProductDetails = this.productsWithDetails.find(p => p.productId === product.productId) || null;

    this.showQuickView = true;
    document.body.style.overflow = 'hidden';
  }

  closeQuickView(): void {
    this.showQuickView = false;
    this.selectedProduct = null;
    document.body.style.overflow = 'auto';
  }

  navigateToSignIn(): void {
    this.router.navigate(['/signIn']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  navigateToAbout(): void {
    this.router.navigate(['/about']);
  }

  navigateToShop(): void {
    this.router.navigate(['/shop']);
  }

  navigateToCart(): void {
    this.router.navigate(['/cart']);
  }

  openEditProfile(): void {
    this.showDropdown = false;
    this.router.navigate(['/edit-user-profile']);
  }

  logout(): void {
    localStorage.removeItem('currentUserLoggedIn');
    sessionStorage.removeItem('userData');
    this.currentUser = null;
    this.showDropdown = false;
    this.router.navigate(['/home']);
  }

  // ====================================================================
  // CART HOVER FUNCTIONALITY
  // ====================================================================

  showCartHover(): void {
    if (this.cartHoverTimeout) {
      clearTimeout(this.cartHoverTimeout);
    }
    this.showCartDropdown = true;
  }

  hideCartHover(): void {
    this.cartHoverTimeout = setTimeout(() => {
      this.showCartDropdown = false;
    }, 300);
  }

  getCartItemProductName(cartItem: any): string {
    const product = this.products.find(p => p.productId === cartItem.productId);
    return product?.productName || 'Unknown Product';
  }

  getCartItemProductImage(cartItem: any): string {
    const product = this.products.find(p => p.productId === cartItem.productId);
    return product?.productImage || '';
  }

  getCartItemProduct(cartItem: any): Iproduct | undefined {
    return this.products.find(p => p.productId === cartItem.productId);
  }

  getCartItemTypeName(cartItem: any): string {
    const product = this.getCartItemProduct(cartItem);
    return product ? this.getTypeName(product.productTypeId) : '';
  }

  getCartItemColorName(cartItem: any): string {
    if (!cartItem.productColorId) return '';

    const productDetails = this.productsWithDetails.find(p => p.productId === cartItem.productId);
    const color = productDetails?.availableColors?.find(c => c.productColorId === cartItem.productColorId);
    return color?.colorName || '';
  }

  getCartItemSizeName(cartItem: any): string {
    if (!cartItem.productSizeId) return '';

    const productDetails = this.productsWithDetails.find(p => p.productId === cartItem.productId);
    const size = productDetails?.availableSizes?.find(s => s.productSizeId === cartItem.productSizeId);
    return size?.sizeName || '';
  }

  getCartTotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getCartItemCount(): number {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }

  // ====================================================================
  // PRODUCT VARIANT SELECTION METHODS
  // ====================================================================

  getAvailableColors(productId: number): Iproductcolor[] {
    const productDetails = this.productsWithDetails.find(p => p.productId === productId);
    return productDetails?.availableColors || [];
  }

  getAvailableSizes(productId: number): Iproductsize[] {
    const productDetails = this.productsWithDetails.find(p => p.productId === productId);
    return productDetails?.availableSizes || [];
  }

  selectColor(productId: number, color: Iproductcolor): void {
    this.selectedColors[productId] = color;
  }

  selectSize(productId: number, size: Iproductsize): void {
    this.selectedSizes[productId] = size;
  }

  getSelectedColor(productId: number): Iproductcolor | null {
    return this.selectedColors[productId] || null;
  }

  getSelectedSize(productId: number): Iproductsize | null {
    return this.selectedSizes[productId] || null;
  }

  selectQuickViewColor(color: Iproductcolor): void {
    this.quickViewSelectedColor = color;
  }

  selectQuickViewSize(size: Iproductsize): void {
    this.quickViewSelectedSize = size;
  }

  hasColors(productId: number): boolean {
    return this.getAvailableColors(productId).length > 0;
  }

  hasSizes(productId: number): boolean {
    return this.getAvailableSizes(productId).length > 0;
  }

  canAddToCart(productId: number): boolean {
    const hasColors = this.hasColors(productId);
    const hasSizes = this.hasSizes(productId);
    const selectedColor = this.getSelectedColor(productId);
    const selectedSize = this.getSelectedSize(productId);

    if (hasColors && !selectedColor) return false;
    if (hasSizes && !selectedSize) return false;

    return true;
  }

  canAddToCartQuickView(): boolean {
    if (!this.selectedProductDetails) return false;

    const hasColors = (this.selectedProductDetails.availableColors?.length || 0) > 0;
    const hasSizes = (this.selectedProductDetails.availableSizes?.length || 0) > 0;

    if (hasColors && !this.quickViewSelectedColor) return false;
    if (hasSizes && !this.quickViewSelectedSize) return false;

    return true;
  }

  getQuickViewAvailableColors(): Iproductcolor[] {
    return this.selectedProductDetails?.availableColors || [];
  }

  getQuickViewAvailableSizes(): Iproductsize[] {
    return this.selectedProductDetails?.availableSizes || [];
  }

  quickViewHasColors(): boolean {
    return this.getQuickViewAvailableColors().length > 0;
  }

  quickViewHasSizes(): boolean {
    return this.getQuickViewAvailableSizes().length > 0;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  getTypeName(typeId: number | string): string {
    if (!typeId) return 'Unknown';
    const type = this.productTypes.find(t => t.productTypeId.toString() === typeId.toString());
    return type ? type.typeName : 'Unknown';
  }

  getCategoryName(categoryId: string): string {
    const category = this.productCategories.find(c => c.productCategoryId.toString() === categoryId);
    return category ? category.categoryName : 'Unknown';
  }

  getCategoryNameForProduct(product: Iproduct): string {
    const type = this.productTypes.find(t => t.productTypeId === product.productTypeId);
    if (type) {
      return this.getCategoryName(type.productCategoryId.toString());
    }
    return 'Unknown';
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile-container')) {
      this.showDropdown = false;
    }
  }
}

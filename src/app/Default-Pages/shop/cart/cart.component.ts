import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartDto, CreateCartItemDto, CartItemDto } from '../../../API-Services/cart.service';
import { ProductService } from '../../../API-Services/product.service';
import { OrderService, CreateInitialOrderDto, InitialOrderResponseDto } from '../../../API-Services/order.service';
import { IProductWithDetails, Iproductcolor, Iproductsize } from '../../../Interfaces/iproduct';
import { DynamicImageComponent } from '../../../shared/dynamic-image/dynamic-image.component';
import { forkJoin } from 'rxjs';

export interface EnhancedCartItem extends CartItemDto {
  productDetails?: IProductWithDetails;
  selectedColor?: string;
  selectedSize?: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicImageComponent],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems: EnhancedCartItem[] = [];
  showDropdown: boolean = false;
  isMenuOpen: boolean = false;
  currentUser: any = null;
  error: string | null = null;
  isLoading: boolean = false;
  showLoginPrompt: boolean = false;

  constructor(
    private router: Router,
    private cartService: CartService,
    private productService: ProductService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    console.log('After loadCurrentUser in ngOnInit:', this.currentUser);
    this.loadCart();
  }

  private getCartStorageKey(): string {
    if (this.currentUser?.userId) {
      return `cart_user_${this.currentUser.userId}`;
    }
    return 'cart_guest';
  }

  private saveCartToStorage(cartItems: EnhancedCartItem[]): void {
    const storageKey = this.getCartStorageKey();
    const storageItems = cartItems.map(item => ({
      cartItemId: item.cartItemId,
      cartId: item.cartId,
      productId: item.productId,
      productColorId: item.productColorId,
      productSizeId: item.productSizeId,
      quantity: item.quantity,
      price: item.price
    }));
    localStorage.setItem(storageKey, JSON.stringify(storageItems));
  }

  private loadCartFromStorage(): EnhancedCartItem[] {
    const storageKey = this.getCartStorageKey();
    const cartData = localStorage.getItem(storageKey);
    if (!cartData) return [];

    const items = JSON.parse(cartData);
    return items.map((item: any) => ({
      cartItemId: item.cartItemId || 0,
      cartId: item.cartId || 0,
      productId: item.productId || 0,
      productColorId: item.productColorId || 0,
      productSizeId: item.productSizeId || 0,
      quantity: item.quantity || 1,
      price: item.price || 0
    }));
  }

  private async transferGuestCartToDatabase(): Promise<void> {
    const guestCart = localStorage.getItem('cart_guest');
    if (!guestCart || !this.currentUser?.userId) return;

    try {
      const guestItems = JSON.parse(guestCart);
      if (guestItems.length === 0) return;

      const cartItems: CreateCartItemDto[] = guestItems.map((item: any) => ({
        productId: item.productId,
        productColorId: item.productColorId || 0,
        productSizeId: item.productSizeId || 0,
        quantity: item.quantity || 1,
        price: item.price
      }));

      await new Promise<void>((resolve, reject) => {
        this.cartService.createCartWithItems(this.currentUser.userId, cartItems).subscribe({
          next: (cartDto) => {
            if (cartDto) {
              this.cartItems = cartDto.cartItems.map(item => ({
                ...item,
                productDetails: undefined,
                selectedColor: undefined,
                selectedSize: undefined
              }));
              localStorage.removeItem('cart_guest');
              resolve();
            }
          },
          error: (error) => {
            console.error('Error transferring guest cart to database:', error);
            this.error = 'Failed to sync guest cart to database. Using local storage.';
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('Error transferring guest cart to database:', error);
      this.error = 'Failed to sync guest cart to database. Using local storage.';
      throw error;
    }
  }

    loadCurrentUser(): void {
    const userData = sessionStorage.getItem('userData');
    console.log('Raw userData from sessionStorage:', userData);

    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
        console.log('Parsed currentUser:', this.currentUser);
        console.log('Current user userId:', this.currentUser?.userId);
      } catch (error) {
        console.error('Error parsing user data from sessionStorage:', error);
        this.currentUser = null;
      }
    } else {
      console.log('No userData found in sessionStorage');
    }
  }

  async loadCart(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      if (this.isUserLoggedIn() && this.currentUser?.userId) {
        await this.transferGuestCartToDatabase();
        this.cartService.getCart(this.currentUser.userId).subscribe({
          next: (cartDto) => {
            if (cartDto && cartDto.cartItems) {
              this.cartItems = cartDto.cartItems.map(item => ({
                ...item,
                productDetails: undefined,
                selectedColor: undefined,
                selectedSize: undefined
              }));
            } else {
              this.cartItems = [];
            }
            this.loadProductDetails();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading cart from database:', error);
            this.error = 'Failed to load cart from server. Using local storage.';
            this.cartItems = this.loadCartFromStorage();
            this.loadProductDetails();
            this.isLoading = false;
          }
        });
      } else {
        this.cartItems = this.loadCartFromStorage();
        this.loadProductDetails();
        this.isLoading = false;
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      this.error = 'Failed to load cart. Please try again.';
      this.cartItems = this.loadCartFromStorage();
      this.loadProductDetails();
      this.isLoading = false;
    }
  }

  private loadProductDetails(): void {
    if (!this.cartItems.length) return;

    const productObservables = this.cartItems.map(item =>
      this.productService.GetProductById(item.productId)
    );

    forkJoin(productObservables).subscribe({
      next: (products: IProductWithDetails[]) => {
        this.cartItems = this.cartItems.map((item, index) => ({
          ...item,
          productDetails: products[index],
          selectedColor: products[index]?.availableColors?.length
            ? products[index].availableColors.find((c: Iproductcolor) => c.productColorId === item.productColorId)?.colorName ?? 'Unknown Color'
            : 'No Color Available',
          selectedSize: products[index]?.availableSizes?.length
            ? products[index].availableSizes.find((s: Iproductsize) => s.productSizeId === item.productSizeId)?.sizeName ?? 'Unknown Size'
            : 'No Size Available'
        }));

        if (!this.isUserLoggedIn()) {
          this.saveCartToStorage(this.cartItems);
        }
      },
      error: (err) => {
        console.error('Error fetching product details:', err);
        this.error = 'Failed to load product details.';
      }
    });
  }

  isUserLoggedIn(): boolean {
  const isLoggedIn = !!this.currentUser?.userId;
  console.log('isUserLoggedIn check:', {
    currentUser: this.currentUser,
    userId: this.currentUser?.userId,
    isLoggedIn: isLoggedIn
  });
  return isLoggedIn;
}

  async updateQuantity(item: EnhancedCartItem, newQuantity: number): Promise<void> {
    if (newQuantity < 1) return;

    item.quantity = newQuantity;

    if (this.isUserLoggedIn() && this.currentUser?.userId && item.cartId && item.cartItemId) {
      const updateDto: CreateCartItemDto = {
        productId: item.productId,
        productColorId: item.productColorId,
        productSizeId: item.productSizeId,
        quantity: newQuantity,
        price: item.price
      };

      this.cartService.updateCartItem(item.cartId, item.cartItemId, updateDto).subscribe({
        next: (updatedItem) => {
          item.quantity = updatedItem.quantity;
          item.price = updatedItem.price;
          console.log('Cart item updated successfully:', updatedItem);
        },
        error: (error) => {
          console.error('Error updating cart item:', error);
          this.error = 'Failed to update cart item quantity.';
          item.quantity = item.quantity; // Revert on failure
        }
      });
    } else {
      this.saveCartToStorage(this.cartItems);
    }
  }

  async removeFromCart(cartItemId: number): Promise<void> {
    const itemIndex = this.cartItems.findIndex(i => i.cartItemId === cartItemId);
    if (itemIndex === -1) return;

    const removedItem = this.cartItems[itemIndex];
    this.cartItems.splice(itemIndex, 1);

    if (this.isUserLoggedIn() && this.currentUser?.userId && removedItem.cartId && removedItem.cartItemId) {
      this.cartService.removeCartItem(removedItem.cartId, removedItem.cartItemId).subscribe({
        next: () => {
          console.log('Cart item removed successfully');
        },
        error: (error) => {
          console.error('Error removing cart item:', error);
          this.error = 'Failed to remove cart item.';
          this.cartItems.splice(itemIndex, 0, removedItem); // Revert on failure
        }
      });
    } else {
      this.saveCartToStorage(this.cartItems);
    }
  }

  async clearCart(): Promise<void> {
    const cartId = this.cartItems.length > 0 ? this.cartItems[0].cartId : 0;
    this.cartItems = [];

    if (this.isUserLoggedIn() && this.currentUser?.userId && cartId) {
      this.cartService.clearCart(cartId).subscribe({
        next: () => {
          console.log('Cart cleared successfully');
          localStorage.removeItem(this.getCartStorageKey());
        },
        error: (error) => {
          console.error('Error clearing cart:', error);
          this.error = 'Failed to clear cart.';
          this.loadCart(); // Reload cart on failure
        }
      });
    } else {
      localStorage.removeItem(this.getCartStorageKey());
    }
  }

  private validateCartItem(item: EnhancedCartItem): boolean {
    return !!(
      item.productId > 0 &&
      item.productColorId > 0 &&
      item.productSizeId > 0 &&
      item.quantity > 0 &&
      item.price > 0
    );
  }

  private getValidCartItems(): EnhancedCartItem[] {
    return this.cartItems.filter(item => this.validateCartItem(item));
  }

  calculateSubtotal(): number {
    const validItems = this.getValidCartItems();
    return validItems.reduce((total, item) => total + item.price * (item.quantity ?? 1), 0);
  }

  calculateVat(): number {
    return this.calculateSubtotal() * 0.15;
  }

  calculateTotal(): number {
    return this.calculateSubtotal() + this.calculateVat();
  }

  async proceedToCheckout(): Promise<void> {
    this.error = null;
    this.showLoginPrompt = false;

    if (!this.isUserLoggedIn()) {
      this.showLoginPrompt = true;
      return;
    }

    if (this.cartItems.length === 0) {
      this.error = 'Your cart is empty. Add some items before checkout.';
      return;
    }

    this.isLoading = true;

    try {
      await this.transferGuestCartToDatabase();
      this.cartService.getCart(this.currentUser.userId).subscribe({
        next: (cartDto: CartDto) => {
          if (!cartDto || !cartDto.cartItems || cartDto.cartItems.length === 0) {
            this.error = 'Cart is empty or unavailable. Please refresh and try again.';
            this.isLoading = false;
            return;
          }

          const initialOrderRequest: CreateInitialOrderDto = {
            userId: this.currentUser.userId,
            cartId: cartDto.cartId
          };

          this.orderService.createInitialOrder(initialOrderRequest).subscribe({
            next: (orderResponse: InitialOrderResponseDto) => {
              this.cartItems = cartDto.cartItems.map(item => ({
                ...item,
                productDetails: this.cartItems.find(i => i.productId === item.productId)?.productDetails,
                selectedColor: this.cartItems.find(i => i.productId === item.productId)?.selectedColor,
                selectedSize: this.cartItems.find(i => i.productId === item.productId)?.selectedSize
              }));

              this.router.navigate(['/checkout'], {
                queryParams: {
                  orderId: orderResponse.orderId,
                  cartId: cartDto.cartId,
                  userId: this.currentUser.userId
                }
              });
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error creating initial order:', error);
              this.error = 'Failed to create order. Please try again.';
              this.isLoading = false;
            }
          });
        },
        error: (error) => {
          console.error('Error retrieving cart for checkout:', error);
          this.error = 'Failed to retrieve cart for checkout. Please try again.';
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Unexpected error during checkout process:', error);
      this.error = 'An unexpected error occurred. Please try again.';
      this.isLoading = false;
    }
  }

  getCartItemProductImage(cartItem: EnhancedCartItem): string {
    return cartItem.productDetails?.productImage || '';
  }

  getCartItemProductName(cartItem: EnhancedCartItem): string {
    return cartItem.productDetails?.productName || `Product #${cartItem.productId}`;
  }

  getCartItemTypeName(cartItem: EnhancedCartItem): string {
    return cartItem.productDetails?.productType?.typeName || '';
  }

  getCartItemCategoryName(cartItem: EnhancedCartItem): string {
    return cartItem.productDetails?.productType?.productCategory?.categoryName || '';
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  openEditProfile(): void {
    this.showDropdown = false;
    this.router.navigate(['/edit-user-profile']);
  }

  logout(): void {
    localStorage.removeItem('currentUserLoggedIn');
    sessionStorage.removeItem('userData');
    this.currentUser = null;
    this.router.navigate(['/home']);
    this.showDropdown = false;
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
}

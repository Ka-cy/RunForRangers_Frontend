import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { filter, Subscription, interval } from 'rxjs';
import { UserDataService } from '../API-Services/user-data.service';
import { SystemNotificationService, SystemNotification } from '../API-Services/system-notification.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationDetailComponent } from '../notification-detail/notification-detail.component';
import { CartService, CartDto } from '../API-Services/cart.service';
import { ProductService } from '../API-Services/product.service';
import { Iproduct } from '../Interfaces/iproduct';

@Component({
  selector: 'app-nav-bar-default',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nav-bar-default.component.html',
  styleUrls: ['./nav-bar-default.component.css']
})
export class NavBarDefaultComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  userIsLoggedIn: boolean = false;
  currentRoute: string = '';
  showDropdown = false;
  showNotifications = false;
  private hideDropdownTimeout: any;
  private userDataSubscription: Subscription | null = null;
  private notificationSubscription: Subscription | null = null;

  // Notification properties
  systemNotifications: SystemNotification[] = [];
  unreadCount: number = 0;

  // Cart properties
  cartItems: any[] = [];
  showCartDropdown: boolean = false;
  private cartHoverTimeout: any = null;
  products: Iproduct[] = [];

  constructor(
    private router: Router,
    private userDataService: UserDataService,
    private systemNotificationService: SystemNotificationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cartService: CartService,
    private productService: ProductService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
      });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadCart();
    this.loadProductsForCart();

    // Subscribe to user data updates
    this.userDataSubscription = this.userDataService.userDataUpdated$.subscribe(userData => {
      this.currentUser = userData;
      this.userIsLoggedIn = !!this.currentUser;
      this.loadCart(); // Reload cart when user changes
      if (this.currentUser?.roleId === 2) {
        this.refreshNotifications();
      } else {
        this.clearNotifications();
      }
    });

    // Set initial route
    this.currentRoute = this.router.url;

    // Load notifications for runners
    if (this.currentUser?.roleId === 2) {
      this.refreshNotifications();
      this.notificationSubscription = interval(60000).subscribe(() => this.refreshNotifications());
    }
  }

  ngOnDestroy(): void {
    this.userDataSubscription?.unsubscribe();
    this.notificationSubscription?.unsubscribe();
    if (this.cartHoverTimeout) {
      clearTimeout(this.cartHoverTimeout);
    }
  }

  private loadCurrentUser(): void {
    this.currentUser = JSON.parse(sessionStorage.getItem('userData') || 'null');
    this.userIsLoggedIn = !!this.currentUser;
  }

  // Cart functionality
  loadCart(): void {
    if (this.isUserLoggedIn() && this.currentUser?.userId) {
      this.cartService.getCart(this.currentUser.userId).subscribe({
        next: (cartDto: CartDto) => {
          this.cartItems = cartDto.cartItems || [];
          console.log('Cart loaded from database:', this.cartItems);
        },
        error: (err) => {
          console.error('Error loading cart from database, falling back to localStorage:', err);
          this.loadCartFromLocalStorage();
        }
      });
    } else {
      this.loadCartFromLocalStorage();
    }
  }

  private loadCartFromLocalStorage(): void {
    const cartData = localStorage.getItem(this.getCartStorageKey());
    this.cartItems = cartData ? JSON.parse(cartData).map((item: any) => ({
      cartItemId: item.cartItemId || 0,
      cartId: item.cartId || 0,
      productId: item.productId || 0,
      productColorId: item.productColorId || item.productColourId || 0,
      productSizeId: item.productSizeId || 0,
      quantity: item.quantity ?? 1,
      price: item.price || 0
    })) : [];
  }

  private getCartStorageKey(): string {
    if (this.currentUser?.userId) {
      return `cart_user_${this.currentUser.userId}`;
    }
    return 'cart_guest';
  }

  private loadProductsForCart(): void {
    this.productService.GetAllProducts().subscribe({
      next: (products) => {
        this.products = products;
      },
      error: (err) => {
        console.error('Error loading products for cart:', err);
      }
    });
  }

  showCartHover(): void {
    if (this.cartHoverTimeout) {
      clearTimeout(this.cartHoverTimeout);
    }
    this.showCartDropdown = true;
    this.showNotifications = false;
    this.showDropdown = false;
  }

  hideCartHover(): void {
    this.cartHoverTimeout = setTimeout(() => {
      this.showCartDropdown = false;
    }, 300);
  }

  getCartItemCount(): number {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }

  getCartTotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getCartItemProductName(cartItem: any): string {
    const product = this.products.find(p => p.productId === cartItem.productId);
    return product?.productName || 'Unknown Product';
  }

  getCartItemProductImage(cartItem: any): string {
    const product = this.products.find(p => p.productId === cartItem.productId);
    return product?.productImage || '';
  }

  getCartItemColorName(cartItem: any): string {
    if (!cartItem.productColorId) return '';
    return cartItem.productColorId ? 'Selected Color' : '';
  }

  getCartItemSizeName(cartItem: any): string {
    if (!cartItem.productSizeId) return '';
    return cartItem.productSizeId ? 'Selected Size' : '';
  }

  navigateToCart(): void {
    this.showCartDropdown = false;
    this.router.navigate(['/cart']);
  }

  private clearNotifications(): void {
    this.systemNotifications = [];
    this.unreadCount = 0;
    this.showNotifications = false;
  }

  /** Notifications */
  refreshNotifications(): void {
    if (!this.currentUser?.userId || this.currentUser.roleId !== 2) {
      this.clearNotifications();
      return;
    }

    this.systemNotificationService.getRunnerNotifications(this.currentUser.userId).subscribe({
      next: notifications => {
        this.systemNotifications = notifications.slice(0, 5);
        this.unreadCount = notifications.filter(n => !n.isRead).length;
      },
      error: err => {
        console.error('Failed to load notifications:', err);
        this.snackBar.open('❌ Failed to load notifications.', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
        this.clearNotifications();
      }
    });
  }

  viewNotification(notification: SystemNotification): void {
    if (!notification.isRead) {
      this.systemNotificationService.markAsRead(notification.notificationId).subscribe({
        next: () => {
          notification.isRead = true;
          this.unreadCount = this.systemNotifications.filter(n => !n.isRead).length;
        },
        error: err => {
          console.error('Failed to mark notification as read:', err);
          this.snackBar.open('❌ Failed to mark notification as read.', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
        }
      });
    }

    this.showNotifications = false;
    this.dialog.open(NotificationDetailComponent, { width: '400px', data: notification });
  }

  viewAllNotifications(): void {
    this.showNotifications = false;
    this.showDropdown = false;
    this.router.navigate(['/runner-notifications']);
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showDropdown = false;
    this.showCartDropdown = false;
  }

  /** Dropdown */
  showUserDropdown(): void {
    clearTimeout(this.hideDropdownTimeout);
    this.showDropdown = true;
    this.showNotifications = false;
    this.showCartDropdown = false;
  }

  hideUserDropdown(): void {
    this.hideDropdownTimeout = setTimeout(() => {
      this.showDropdown = false;
    }, 1000);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-bell, .user-image-container, .cart-container')) {
      this.showNotifications = false;
      this.showDropdown = false;
      this.showCartDropdown = false;
    }
  }

  /** Routes */
  isRouteActive(route: string): boolean {
    if (route === '/home') {
      return this.currentRoute === '/' || this.currentRoute === '/home' || this.currentRoute === '';
    }
    if (route === '/shop') {
      return this.currentRoute === '/shop' || this.currentRoute.startsWith('/shop') ||
             this.currentRoute === '/cart' || this.currentRoute === '/checkout';
    }
    return this.currentRoute.startsWith(route);
  }

  isUserLoggedIn(): boolean {
    return !!this.currentUser;
  }

  logout(): void {
    sessionStorage.removeItem('userData');
    this.currentUser = null;
    this.userIsLoggedIn = false;
    this.clearNotifications();
    this.cartItems = [];
    localStorage.removeItem(this.getCartStorageKey());
    this.router.navigate(['/home']);
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = (firstName || '').trim();
    const last = (lastName || '').trim();
    return (first.charAt(0).toUpperCase() + last.charAt(0).toUpperCase()) || 'U';
  }

  getProfileImageSrc(): string | null {
    if (!this.currentUser) return null;
    let base64Data = this.currentUser.profileImageBase64 || this.currentUser.runnerImageBase64 || null;

    if (!base64Data || base64Data === 'null' || base64Data === 'undefined') return null;

    if (base64Data.startsWith('data:image/')) return base64Data;

    const imagePrefix = base64Data.startsWith('/9j/') ? 'jpeg' :
                        base64Data.startsWith('iVBORw0KGgo') ? 'png' :
                        base64Data.startsWith('R0lGOD') ? 'gif' : 'jpeg';

    return `data:image/${imagePrefix};base64,${base64Data}`;
  }

  /** Navigation */
  navigateTHome(): void {
    this.router.navigate([this.currentUser?.roleId === 2 ? '/runner-page' : '/home']);
  }

  openEditProfile(): void {
    this.showDropdown = false;
    this.router.navigate([this.currentUser?.roleId === 2 ? '/edit-runner-profile' : '/edit-user-profile']);
  }

  navigateToSettings(): void {
    this.showDropdown = false;
    this.router.navigate(['/otp-configure']);
  }

  navigateToRunnerMilestone(): void {
    this.router.navigate(['/runner-milestone']);
  }

  navigateYToHelp(): void {
    this.router.navigate(['/help-section']);
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

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateToShop(): void {
    this.router.navigate(['/shop']);
  }

  navigateToEvents(): void {
    this.router.navigate(['/events-page']);
  }

  navigateToRegisterToRun(): void {
    this.router.navigate(['runners/register']);
  }
}
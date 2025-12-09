import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService, OrderResponseDto } from '../../../API-Services/order.service';
import { CartService, CartDto, CartItemDto } from '../../../API-Services/cart.service';

interface CartItem {
  price: number;
  quantity?: number;
}

interface CartResponse {
  items: CartItem[];
}


@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  orderId: number | null = null;
  cartItems: CartItem[] = [];
  order: any = null;
  currentUser: any = null;
  paymentForm: any = {
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: ''
  };
  formSubmitted: boolean = false;
  error: string | null = null;
  showDropdown: boolean = false;
  isMenuOpen: boolean = false;

  constructor(
    private router: Router,
    private orderService: OrderService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    if (!this.isUserLoggedIn()) {
      this.error = 'Please log in to proceed with payment.';
      this.router.navigate(['/signIn']);
      return;
    }
    const navigation = this.router.getCurrentNavigation();
    this.orderId = navigation?.extras.state?.['orderId'] || null;
    if (!this.orderId) {
      this.error = 'No order found. Please start over.';
      this.router.navigate(['/cart']);
      return;
    }
    this.loadOrder();
    this.loadCart();
  }

  loadCurrentUser(): void {
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
        console.log('Current user loaded from sessionStorage:', this.currentUser);
      } catch (error) {
        console.error('Error parsing user data from sessionStorage:', error);
        this.currentUser = null;
      }
    } else {
      console.log('No user data found in sessionStorage');
      this.currentUser = null;
    }
  }

  isUserLoggedIn(): boolean {
    return !!this.currentUser;
  }

  loadOrder(): void {
    if (!this.orderId) {
      this.error = 'Invalid order ID.';
      return;
    }
    this.orderService.getOrder(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
      },
      error: (err) => {
        console.error('Error fetching order:', err);
        this.error = 'Failed to load order details.';
      }
    });
  }

  loadCart(): void {
    if (!this.currentUser?.userId) {
      this.error = 'User ID not available. Please log in again.';
      this.router.navigate(['/signIn']);
      return;
    }
    this.cartService.getCart(this.currentUser.userId).subscribe({
      next: (cartResponse: CartDto) => {
        // Map CartDto to CartItem array
        this.cartItems = cartResponse.cartItems.map(item => ({
          price: item.price,
          quantity: item.quantity
        }));
      },
      error: (err) => {
        console.error('Error fetching cart:', err);
        this.error = 'Failed to load cart.';
      }
    });
  }

  calculateSubtotal(): number {
    return this.cartItems.reduce((total, item) => total + item.price * (item.quantity ?? 1), 0);
  }

  calculateVat(): number {
    return this.calculateSubtotal() * 0.15;
  }

  calculateTotal(): number {
    return this.calculateSubtotal() + this.calculateVat();
  }

  submitPayment(): void {
    this.formSubmitted = true;
    if (
      !this.paymentForm.cardNumber ||
      !this.paymentForm.expiryDate ||
      !this.paymentForm.cvv ||
      !this.paymentForm.cardHolder
    ) {
      this.error = 'Please fill in all payment fields.';
      return;
    }
    if (!this.currentUser?.userId || !this.orderId) {
      this.error = 'User or order information missing. Please start over.';
      this.router.navigate(['/cart']);
      return;
    }
    this.orderService.updatePaymentStatus(this.orderId, 2).subscribe({
      next: () => {
        this.cartService.clearCart(this.currentUser.userId).subscribe({
          next: () => {
            localStorage.setItem('cart', JSON.stringify([])); // reset cart
            this.router.navigate(['/order-confirmation'], { state: { orderId: this.orderId } });
          },
          error: (err) => {
            console.error('Error clearing cart:', err);
            this.error = 'Failed to clear cart after payment.';
          }
        });
      },
      error: (err) => {
        console.error('Error processing payment:', err);
        this.error = 'Payment failed. Please try again.';
      }
    });
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

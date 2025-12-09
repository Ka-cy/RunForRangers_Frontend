import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-success.component.html',
  styleUrl: './order-success.component.css'
})
export class OrderSuccessComponent implements OnInit {
  orderId: string | null = null;
  orderTotal: number = 0;
  countdown: number = 10;
  countdownInterval: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get order details from route parameters or query params
    this.orderId = this.route.snapshot.paramMap.get('orderId') || 
                   this.route.snapshot.queryParamMap.get('orderId');
    
    const total = this.route.snapshot.queryParamMap.get('total');
    if (total) {
      this.orderTotal = parseFloat(total);
    }

    // Start countdown to redirect to shop
    this.startCountdown();

    // Clear cart from localStorage since order is complete
    this.clearCart();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.redirectToShop();
      }
    }, 1000);
  }

  clearCart(): void {
    // Clear cart from localStorage
    const userLoggedIn = localStorage.getItem('currentUserLoggedIn');
    if (userLoggedIn) {
      const user = JSON.parse(userLoggedIn);
      localStorage.removeItem(`cart_user_${user.userId}`);
    }
    
    // Also clear any generic cart
    localStorage.removeItem('cart');
  }

  redirectToShop(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.router.navigate(['/shop']);
  }

  continueShoppping(): void {
    this.redirectToShop();
  }

  viewOrderDetails(): void {
    if (this.orderId) {
      this.router.navigate(['/orders/details', this.orderId]);
    }
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}

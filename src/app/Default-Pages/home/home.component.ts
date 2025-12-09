import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../API-Services/user.service';
import { DonationService, Donation, CreateDonationDto } from '../../API-Services/donation.service';
import { Iproduct } from '../../Interfaces/iproduct';
import { NavBarDefaultComponent } from "../../nav-bar-default/nav-bar-default.component";
import { HelpSectionComponent } from "../help-section/help-section.component";
import { EventCalendarComponent } from '../../events/event-calendar/event-calendar.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, NavBarDefaultComponent],
  templateUrl: 'home.component.html',
  standalone: true,
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  currentUser: any = null;
  userIsLoggedIn: boolean = false;
  cartItems: Iproduct[] = [];
  youtubeVideoUrl: string = 'https://www.youtube.com/embed/XxUrC1v8zp8'; // Default video
  safeVideoUrl: SafeResourceUrl;
  donation: Partial<Donation> = {
    type: 'Organisation',
    amount: 0,
    date: new Date(),
    userId: undefined
  };

  constructor(
    private router: Router,
    private userService: UserService,
    private donationService: DonationService,
    private sanitizer: DomSanitizer
  ) { 
    this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.youtubeVideoUrl);
  }

  ngOnInit(): void {
    this.loadCart();
    this.loadSettings();
    this.currentUser = sessionStorage.getItem('userData');
    console.log(this.currentUser);
this.userService.DeleteUser().subscribe({
      next: (data) => {
        console.log('User deleted successfully:', data);
      },
      error: (error: any) => {
        console.error('Error deleting user:', error);
      }
    });

  }

  loadSettings(): void {
    const settings = localStorage.getItem('dashboardSettings');
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        if (parsedSettings.youtubeVideoUrl) {
          this.youtubeVideoUrl = parsedSettings.youtubeVideoUrl;
          this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.youtubeVideoUrl);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }

  loadCart(): void {
    const cart = localStorage.getItem('cart');
    if (cart) {
      this.cartItems = JSON.parse(cart);
    }
  }

  showDropdown = false;

  openEditProfile(): void {
    this.showDropdown = false;
    this.router.navigate(['/edit-user-profile']);
  }

  logout(): void {
    localStorage.removeItem('currentUserLoggedIn');
    this.currentUser = null;
    this.userIsLoggedIn = false;
    this.router.navigate(['/home']);
    this.showDropdown = false;
  }

  submitDonation(): void {
    if (!this.donation.amount || this.donation.amount <= 0) {
      alert('Please enter a valid donation amount.');
      return;
    }

    // Construct CreateDonationDto
    const donationDto: CreateDonationDto = {
      type: this.donation.type || 'Organisation', // Fallback to 'Organisation'
      amount: this.donation.amount,
      donorName: 'Quick Donation',
      loggedByAdminId: 1,
      userId: this.donation.userId
    };

    this.donationService.createDonation(donationDto).subscribe({
      next: () => {
        alert('Donation saved successfully!');
        this.donation.amount = 0;
      },
      error: (err) => {
        alert('Failed to save donation: ' + (err.error?.error || err.message));
      }
    });
  }

  setDonationAmount(amount: number): void {
    this.donation.amount = amount;
  }

  navigateToSignIn() {
    this.router.navigate(['/signIn']);
  }

  isUserLoggedIn(): boolean {
    return !!this.currentUser;
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  navigateToAbout() {
    this.router.navigate(['/about']);
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  navigateToShop() {
    this.router.navigate(['/shop']);
  }

  navigateToCart(): void {
    this.router.navigate(['/cart']);
  }
}
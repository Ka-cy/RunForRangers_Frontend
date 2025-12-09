import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../API-Services/user.service';
import { NotificationService } from '../API-Services/notification.service';
import { Router } from '@angular/router';
import { NavBarDefaultComponent } from '../nav-bar-default/nav-bar-default.component';
import { FormsModule } from '@angular/forms';
import { setEngine } from 'crypto';
import { NavBarAdminComponent } from '../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { NotificationModalComponent } from '../Notification/notification.component';

@Component({
  selector: 'app-two-fa-page',
  imports: [CommonModule, FormsModule, NotificationModalComponent],
  templateUrl: './two-fa-page.component.html',
  styleUrl: './two-fa-page.component.css'
})
export class TwoFAPageComponent implements OnInit {

  email: string = '';
  showCodeInput: boolean = false;
  code: string[] = ['', '', '', '', ''];
  userId: number = 0;
  isLoading: boolean = false;
   isVerifying: boolean = false; // Add this to prevent duplicate calls

  constructor(
    private userService: UserService, 
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.code = ['', '', '', '', ''];
    
    // Get user data and extract email and userId
    const userData = sessionStorage.getItem('userData');
    const adminData = sessionStorage.getItem('adminData');
    
    if (userData) {
      const user = JSON.parse(userData);
      this.email = user.email || '';
      this.userId = user.userId || 0;
    } else if (adminData) {
      const admin = JSON.parse(adminData);
      this.email = admin.email || '';
      this.userId = admin.userId || 0;
    }
    
    console.log('Initialized with email:', this.email, 'userId:', this.userId);
  }

  onCodeInput(event: any, index: number) {
    const value = event.target.value;

    // Only allow digits
    if (!/^\d*$/.test(value)) {
      event.target.value = '';
      this.code[index] = '';
      return;
    }

    this.code[index] = value;

    // Move to next input if current field has value and it's not the last field
    if (value && index < 4) {
      const nextInput = document.querySelector(`input[name="code${index + 2}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onKeyDown(event: any, index: number) {
    if (event.key === 'Backspace' && !this.code[index] && index > 0) {
      // Move to previous input on backspace if current field is empty
      const prevInput = document.querySelector(`input[name="code${index}"]`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  onCodeSubmit() {
    // Prevent duplicate submissions
    if (this.isVerifying) {
      console.log('Verification already in progress...');
      return;
    }

    if (!this.isCodeComplete()) {
      console.log('Code is not complete');
      // Show notification for incomplete code
      this.notificationService.showError(
        'Incomplete Code',
        'Please enter all 5 digits of the verification code.',
        'OK'
      );
      return;
    }

    if (!this.userId || !this.email) {
      console.error('Missing userId or email');
      
      // Show notification for missing user data
      this.notificationService.showError(
        'Authentication Error',
        'User session expired. Please login again.',
        'Login'
      );
      
      this.router.navigate(['/login']);
      return;
    }

    const fullCode = this.code.join('');
    
    // Set both loading states
    this.isLoading = true;
    this.isVerifying = true;

    console.log('Verifying code:', fullCode, 'for userId:', this.userId);

    this.userService.TwoFAVerfication(this.userId, fullCode).subscribe({
      next: (response: any) => {
        // Reset both loading states
        this.isLoading = false;
        this.isVerifying = false;
        
        console.log("2FA Verification successful:", response);
        
        // Check which type of user and navigate accordingly
        const userData = sessionStorage.getItem('userData');
        const adminData = sessionStorage.getItem('adminData');
        
        if (userData) {
          this.navigateToUserProfile();
        } else if (adminData) {
          this.navigateToAdminProfile();
        } else {
          // Fallback navigation
          this.router.navigate(['/home']);
        }
      },
      error: (error: any) => {
        // IMPORTANT: Reset both loading states on error
        this.isLoading = false;
        this.isVerifying = false;
        
        console.error('Error with 2FA verification:', error);
        
        // Show error notification for incorrect 2FA code
        this.notificationService.showError(
          'Verification Failed',
          'The verification code you entered is incorrect or has expired. Please try again.',
          'Try Again'
        );
        
        // Clear the code inputs on error and re-enable the form
        this.code = ['', '', '', '', ''];
        this.focusFirstInput();
      }
    });
  }

  isCodeComplete(): boolean {
    return this.code.every(digit => digit !== '' && digit.length === 1);
  }

  // Method to check if submit button should be disabled
  isSubmitDisabled(): boolean {
    return this.isVerifying || !this.isCodeComplete();
  }

  goBack() {
    this.showCodeInput = false;
    this.code = ['', '', '', '', ''];
    // Reset loading states
    this.isLoading = false;
    this.isVerifying = false;
    
    // Navigate back to login or previous page
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('adminData');
   
    this.router.navigate(['/home']);
  }

  navigateToUserProfile() {
    // Get user data to check role
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      // Check user role and redirect accordingly
      if (user.roleId === 2) {
        // Runner role - redirect to runner page
        this.router.navigate(['/runner-page']);
      } else if (user.roleId === 1) {
        // Regular user role - redirect to home
        this.router.navigate(['/home']);
      } else {
        // Fallback to home for any other user roles
        this.router.navigate(['/home']);
      }
    } else {
      // No user data found, redirect to home
      this.router.navigate(['/home']);
    }
  }

  navigateToAdminProfile() {
    this.router.navigate(['/admin-home']);
  }

  private focusFirstInput() {
    setTimeout(() => {
      const firstInput = document.querySelector('input[name="code1"]') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }
}
import { Component, OnInit } from '@angular/core';
import { UserService } from '../../API-Services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavBarAdminComponent } from "../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component";
import { NavBarDefaultComponent } from '../../nav-bar-default/nav-bar-default.component';
import { NotificationModalComponent } from '../../Notification/notification.component';
import { NotificationService } from '../../API-Services/notification.service';
@Component({
  selector: 'app-update-password',
  imports: [CommonModule, FormsModule, NavBarAdminComponent, NavBarDefaultComponent, NotificationModalComponent],
  templateUrl: './update-password.component.html',
  styleUrl: './update-password.component.css'
})
export class UpdatePasswordComponent implements OnInit {
  
  constructor(private userService: UserService,private notificationservice: NotificationService) { }

  adminData: any = {};
  userData: any = {};
  verifyPassword: boolean = false;
  
  inPuts: any = {
    Password: '',
    ConfirmPassword: ''
  };

  errorMessage: any = {
    errorPassword: '',
    errorConfirmPassword: ''
  };
  
  successMessage: string = '';

  ngOnInit(): void {
    this.adminData = sessionStorage.getItem('adminData') 
      ? JSON.parse(sessionStorage.getItem('adminData')!) 
      : null; 
    this.userData = sessionStorage.getItem('userData') 
      ? JSON.parse(sessionStorage.getItem('userData')!) 
      : null;
    
    console.log('Admin Data:', this.adminData);
    console.log('User Data:', this.userData);
  }

  /**
   * Clear form inputs and error messages
   */
  cancel(): void {
    this.clearErrors();
    this.clearInputs();
    this.successMessage = '';
  }

  /**
   * Clear all error messages
   */
  private clearErrors(): void {
    this.errorMessage.errorPassword = '';
    this.errorMessage.errorConfirmPassword = '';
  }

  /**
   * Clear all form inputs
   */
  private clearInputs(): void {
    this.inPuts.Password = '';
    this.inPuts.ConfirmPassword = '';
  }

  /**
   * Validate password inputs
   * @returns boolean - true if validation passes
   */
  private verifyPasswordInputs(): boolean {
    this.clearErrors();
    this.verifyPassword = false;

    // Check if password is empty
    if (!this.inPuts.Password.trim()) {
      this.errorMessage.errorPassword = "Password is required";
      return false;
    }

    // Check if confirm password is empty
    if (!this.inPuts.ConfirmPassword.trim()) {
      this.errorMessage.errorConfirmPassword = "Confirm Password is required";
      return false;
    }

    // Check password length
    if (this.inPuts.Password.length < 8) {
      this.errorMessage.errorPassword = "Password must be at least 8 characters long";
      return false;
    }

    // Check if passwords match
    if (this.inPuts.Password !== this.inPuts.ConfirmPassword) {
      this.errorMessage.errorConfirmPassword = "Passwords do not match";
      return false;
    }

    this.verifyPassword = true;
    return true;
  }

  /**
   * Update password for current user
   */
  updatePassword(): void {
    // Clear any existing success message
    this.successMessage = '';

    // Validate inputs
    if (!this.verifyPasswordInputs()) {
      return;
    }

    // Determine which user data to use
    const currentUser = this.userData || this.adminData;
    
    if (!currentUser?.email) {
      console.error('No user email found');
      this.errorMessage.errorPassword = 'Unable to update password. Please log in again.';
      return;
    }

    // Call the update password service
    this.userService.UpdatePassword(currentUser.email, this.inPuts.Password).subscribe({
      next: (response) => {
        console.log('Password updated successfully:', response);
        this.successMessage = 'Password updated successfully!';
        
        // Clear form after successful update
        this.notificationservice.showSuccess('Success', this.successMessage, 'OK');
      },
      error: (error) => {
        console.error('Error updating password:', error);
        this.errorMessage.errorPassword = 'Failed to update password. Please try again.';
        this.notificationservice.showError('Error', this.errorMessage.errorPassword, 'OK');
      }
    });
  }
}
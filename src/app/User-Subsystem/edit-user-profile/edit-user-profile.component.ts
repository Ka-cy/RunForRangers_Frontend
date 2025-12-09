// edit-user-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IUser } from '../../Interfaces/IUser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavBarDefaultComponent } from "../../nav-bar-default/nav-bar-default.component";
import { UserService } from '../../API-Services/user.service';
import { NotificationService } from '../../API-Services/notification.service';
import { NotificationModalComponent } from '../../Notification/notification.component';
@Component({
  selector: 'app-edit-user-profile',
  templateUrl: './edit-user-profile.component.html',
  imports: [FormsModule, CommonModule, NavBarDefaultComponent,NotificationModalComponent],
  styleUrls: ['./edit-user-profile.component.css']
})
export class EditUserProfileComponent implements OnInit {

  constructor(private router: Router, private userService: UserService,private notificationservice: NotificationService) {}

  userUpdates: any = {
    userId: '',
    firstName: '',
    surname: '',
    email: '',
    cellphone: '',
    profileImageBase64: ''
  };
  
  // Image upload properties
  selectedFile: File | null = null;
  selectedImagePreview: string | null = null;
  currentProfileImage: string | null = null;

  objErrorMessage: any = {
    FirstnameError: '',
    SurnameError: '',
    EmailError: '',

    CellphoneError: '',
    ProfileImageError: ''
  };

  // Message properties
  showSuccessMessage: boolean = false;
  showErrorMessage: boolean = false;

  ngOnInit(): void {
    // Get user from sessionStorage
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      this.userUpdates = JSON.parse(userData);
      console.log(this.userUpdates);
      
      // Set current profile image if exists
      if (this.userUpdates.profileImageBase64) {
        this.currentProfileImage = `data:image/jpeg;base64,${this.userUpdates.profileImageBase64}`;
      }
    } else {
      // Handle case where no user data exists
      console.warn('No user data found in sessionStorage');
      this.router.navigate(['/login']); // or wherever you want to redirect
    }
  }

  // Message methods
  showSuccessMessageFor3Seconds(): void {
    this.showSuccessMessage = true;
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 3000); // Hide after 3 seconds
  }

  showErrorMessageFor3Seconds(): void {
    this.showErrorMessage = true;
    setTimeout(() => {
      this.showErrorMessage = false;
      this.notificationservice.showError('Update Failed','There was an error updating your profile. Please try again.','OK');
    }, 3000); // Hide after 3 seconds
  }

  // Image upload methods
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.objErrorMessage.ProfileImageError = 'Please select a valid image file.';
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.objErrorMessage.ProfileImageError = 'Image size must be less than 5MB.';
        return;
      }

      this.selectedFile = file;
      this.objErrorMessage.ProfileImageError = '';

      // Create image preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('profileImage') as HTMLInputElement;
    fileInput.click();
  }

  removeImage(): void {
    this.selectedFile = null;
    this.selectedImagePreview = null;
    this.currentProfileImage = null;
    const fileInput = document.getElementById('profileImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.objErrorMessage.ProfileImageError = '';
  }

  // Get the display image (preview > current > default)
  getDisplayImage(): string | null {
    return this.selectedImagePreview || this.currentProfileImage;
  }

  validateInputs(): boolean {
    // Reset all error messages
    this.objErrorMessage = {
      FirstnameError: '',
      SurnameError: '',
      EmailError: '',
      CellphoneError: '',
      ProfileImageError: ''
    };

    let isValid = true;

    // Name length validation
    if (!this.userUpdates.firstName || this.userUpdates.firstName.length < 2) {
      this.objErrorMessage.FirstnameError = 'Name must be at least 2 characters long';
      isValid = false;
    }
    
    // surname length validation
    if (!this.userUpdates.surname || this.userUpdates.surname.length < 2) {
      this.objErrorMessage.SurnameError = 'Surname must be at least 2 characters long';
      isValid = false;
    }

    // email validation
    if (!this.userUpdates.email || !this.userUpdates.email.includes('@') || !this.userUpdates.email.includes('.')) {
      this.objErrorMessage.EmailError = 'Email is not valid';
      isValid = false;
    }
    
    // Cell number validation
    if (!this.userUpdates.cellphone || this.userUpdates.cellphone.length != 10) {
      this.objErrorMessage.CellphoneError = 'Cell number must be 10 digits long';
      isValid = false;
    } else if (!this.userUpdates.cellphone.startsWith('0')) {
      this.objErrorMessage.CellphoneError = 'Cell number must start with 0';
      isValid = false;
    }

  

    
    
    
    return isValid;
  }
  
  onSave(): void {
    if (this.validateInputs()) {
      // Always use FormData since backend expects [FromForm]
      const formData = new FormData();
      formData.append('UserId', this.userUpdates.userId.toString());
      formData.append('FirstName', this.userUpdates.firstName);
      formData.append('Surname', this.userUpdates.surname);
      formData.append('Email', this.userUpdates.email);
      formData.append('Cellphone', this.userUpdates.cellphone);
      
      // Add image if selected
      if (this.selectedFile) {
        formData.append('ProfileImage', this.selectedFile);
      }

      this.userService.UpdateUserWithImage(formData).subscribe({
        next: (response) => {
          console.log('User updated successfully:', response);
          
          // Update session storage with new data
          if (response.profileImageBase64) {
            this.userUpdates.profileImageBase64 = response.profileImageBase64;
          }
          // Update other fields from response
          this.userUpdates.firstName = response.firstName;
          this.userUpdates.surname = response.surname;
          this.userUpdates.cellphone = response.cellphone;
          
          sessionStorage.setItem('userData', JSON.stringify(this.userUpdates));
          
          // Show success message for 3 seconds
          this.showSuccessMessageFor3Seconds();
          
          this.notificationservice.showSuccess('Profile Updated','Your profile has been updated successfully','OK');
        },
        error: (error) => {
          console.error('Error updating user:', error);
          
          // Show error message for 3 seconds instead of alert
          this.showErrorMessageFor3Seconds();
        }
      });
    }
  }

  onCancel(): void {
    // Navigate back to home without saving
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      this.userUpdates = JSON.parse(userData);
    }
  }

  changePassword() {
this.router.navigate(['/update-password']);
}

}
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IUser } from '../../Interfaces/IUser';
import { UserService } from '../../API-Services/user.service';
import { NotificationService } from '../../API-Services/notification.service';
import { NotificationModalComponent } from '../../Notification/notification.component';

@Component({
  selector: 'app-update-admin',
  imports: [FormsModule, CommonModule, NotificationModalComponent],
  templateUrl: './update-admin.component.html',
  styleUrl: './update-admin.component.css'
})
export class UpdateAdminComponent implements OnInit {

  errorMessage: string = '';
  successMessage: string = '';
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isImageUploading: boolean = false;
  showImageOverlay: boolean = false;

  constructor(private router: Router, private userService: UserService,private notificationservice: NotificationService) { }
 
  adminData: any = {};
  
  objErrorMessage: any = {
    FirstnameError: '',
    SurnameError: '',
    EmailError: '',
    CellphoneError: '',
    ImageError: ''   
  };

  updateAdmin: IUser = {
    email: '',
    firstName: '',
    surname: '',
    cellphone: '',
    profileImage: '',
    password: ''
  };

 ngOnInit(): void {
  const adminDataString = sessionStorage.getItem('adminData');
  
  if (adminDataString) {
    try {
      // Parse the JSON string to get the actual object
      this.adminData = JSON.parse(adminDataString);
      console.log('Admin Data:', this.adminData);
      
      // Now you can access the properties
      this.updateAdmin.cellphone = this.adminData.cellphone || '';
      this.updateAdmin.email = this.adminData.email || '';
      this.updateAdmin.firstName = this.adminData.firstName || '';
      this.updateAdmin.surname = this.adminData.surname || '';
      this.updateAdmin.profileImage = this.adminData.profileImage || this.adminData.profileImageBase64 || '';

      if (this.updateAdmin.profileImage) {
        this.imagePreview = this.updateAdmin.profileImage;
      }
    } catch (error) {
      console.error('Error parsing admin data from sessionStorage:', error);
      // Handle the error - maybe redirect to login or show an error message
      this.errorMessage = 'Error loading admin data. Please try logging in again.';
    }
  } else {
    console.warn('No admin data found in sessionStorage');
    // Handle case where no data exists - maybe redirect to login
    this.errorMessage = 'No admin data found. Please log in again.';
  }
}

  back() {
    this.router.navigate(['/admin-home']);
  }

  cancel() {
    
    this.resetImageSelection();
  }


    
  

  triggerFileUpload() {
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!this.isValidImageType(file)) {
        this.objErrorMessage.ImageError = 'Please select a valid image file (JPG, PNG, GIF)';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.objErrorMessage.ImageError = 'Image size must be less than 5MB';
        return;
      }

      this.selectedFile = file;
      this.objErrorMessage.ImageError = '';
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  private isValidImageType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    return validTypes.includes(file.type);
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = this.updateAdmin.profileImage || null;
    this.objErrorMessage.ImageError = '';
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    fileInput.value = '';
  }

  private resetImageSelection() {
    this.selectedFile = null;
    this.imagePreview = this.updateAdmin.profileImage || null;
    this.objErrorMessage.ImageError = '';
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    fileInput.value = '';
  }

  Submit() {
    this.clearErrors();

    if (this.validateInputs()) {
      this.isImageUploading = true;
      
      const formData = new FormData();
      formData.append('UserId', this.adminData.userId.toString());
      formData.append('Email', this.updateAdmin.email || '');
      formData.append('FirstName', this.updateAdmin.firstName || '');
      formData.append('Surname', this.updateAdmin.surname || '');
      formData.append('Cellphone', this.updateAdmin.cellphone || '');

      if (this.selectedFile) {
        formData.append('ProfileImage', this.selectedFile);
      }

      this.userService.UpdateAdminWithImage(formData).subscribe({
        next: (response) => {
          this.isImageUploading = false;
          if (response) {
            const updatedAdminData = {
              ...this.adminData,
              firstName: response.firstName,
              surname: response.surname,
              cellphone: response.cellphone,
              profileImageBase64: response.profileImageBase64
            };
            sessionStorage.setItem('adminData', JSON.stringify(updatedAdminData));
          }
          this.successMessage = 'Admin profile updated successfully!';
          this.notificationservice.showSuccess('Success', 'Admin profile updated successfully!', 'OK');
        },
        error: (error) => {
          console.error('Error updating admin:', error);
          this.isImageUploading = false;
          this.errorMessage = error.error?.message || 'Error updating admin. Please try again.';
          this.notificationservice.showError('Error', this.errorMessage, 'OK');
        }
      });
    }
  }

  private clearErrors() {
    this.errorMessage = '';
    this.objErrorMessage = {
      FirstnameError: '',
      SurnameError: '',
      EmailError: '',
      CellphoneError: '',
      ImageError: ''
    };
  }

  validateInputs(): boolean {
    let isValid = true;

    if (!this.updateAdmin.firstName || this.updateAdmin.firstName.trim().length === 0) {
      this.objErrorMessage.FirstnameError = 'First name is required';
      isValid = false;
    } else if (this.updateAdmin.firstName.trim().length < 2) {
      this.objErrorMessage.FirstnameError = 'First name must be at least 2 characters long';
      isValid = false;
    }

    if (!this.updateAdmin.surname || this.updateAdmin.surname.trim().length === 0) {
      this.objErrorMessage.SurnameError = 'Surname is required';
      isValid = false;
    } else if (this.updateAdmin.surname.trim().length < 2) {
      this.objErrorMessage.SurnameError = 'Surname must be at least 2 characters long';
      isValid = false;
    }

    if (!this.updateAdmin.email || this.updateAdmin.email.trim().length === 0) {
      this.objErrorMessage.EmailError = 'Email is required';
      isValid = false;
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(this.updateAdmin.email)) {
        this.objErrorMessage.EmailError = 'Please enter a valid email address';
        isValid = false;
      }
    }

    if (!this.updateAdmin.cellphone || this.updateAdmin.cellphone.trim().length === 0) {
      this.objErrorMessage.CellphoneError = 'Phone number is required';
      isValid = false;
    } else if (this.updateAdmin.cellphone.length !== 10) {
      this.objErrorMessage.CellphoneError = 'Cell number must be 10 digits long';
      isValid = false;
    } else if (!this.updateAdmin.cellphone.startsWith('0')) {
      this.objErrorMessage.CellphoneError = 'Cell number must start with 0';
      isValid = false;
    } else if (!/^\d+$/.test(this.updateAdmin.cellphone)) {
      this.objErrorMessage.CellphoneError = 'Cell number must contain only digits';
      isValid = false;
    }

    if (!isValid) {
      this.errorMessage = 'Please fix the errors below and try again';
    }

    return isValid;
  }
  // navigation 
  changePassword() {
this.router.navigate(['/update-password']);
}
}
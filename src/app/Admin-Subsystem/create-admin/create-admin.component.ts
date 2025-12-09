import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IUser } from '../../Interfaces/IUser';
import { UserService } from '../../API-Services/user.service';
import { IEmail } from '../../Interfaces/IEmail';
import { EmailService } from '../../API-Services/email.service';
import { NotificationService } from '../../API-Services/notification.service';
import { NotificationModalComponent } from '../../Notification/notification.component';

@Component({
  selector: 'app-create-admin',
    imports: [FormsModule, CommonModule,NotificationModalComponent],
  templateUrl: './create-admin.component.html',
  styleUrl: './create-admin.component.css'
})

export class CreateAdminComponent implements OnInit {
  isLoading: boolean = false;
  showSuccess: any;
  
  // Image handling properties
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isImageUploading: boolean = false;
  showImageOverlay: boolean = false;
  imageError: string = '';


  constructor(private router: Router, private userService: UserService, private emailService:EmailService,private notificationService: NotificationService) { }
ownerId: any = JSON.parse(sessionStorage.getItem('adminData')!)
  admin: IUser = {
    email: '',
    password: 'administrator',
    confirmPassword: 'administrator',
    firstName: '',
    surname: '',
    cellphone: '',
    roleId: 3,
    profileImage: '', // Add this if not already in IUser interface
    EnableProductCRUD : false,
    EnableEventCRUD: false,
    EnableDonationCRUD: false,
    EnableExpenditureCRUD: false,
    EnableInventoryCRUD: false

  };



  errorMessage: string = '';
  successMessage: string = '';

  ngOnInit() {
this.admin = {
  email: '',
    password: 'administrator',
    confirmPassword: 'administrator',
    firstName: '',
    surname: '',
    cellphone: '',
    roleId: 3,
    profileImage: '', // Add this if not already in IUser interface
    EnableProductCRUD : false,
    EnableEventCRUD: false,
    EnableDonationCRUD: false,
    EnableExpenditureCRUD: false,
    EnableInventoryCRUD: false,
     // Add these new properties
    EnableDeliveryCRUD: false,
    EnableEmployeeCRUD: false,
    EnableOrderCRUD: false,
    EnableRunnerCRUD: false
};
this.clearAllPermissions()


  };


  // Image handling methods
  triggerFileUpload() {
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!this.isValidImageType(file)) {
        this.imageError = 'Please select a valid image file (JPG, PNG, GIF)';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.imageError = 'Image size must be less than 5MB';
        return;
      }

      this.selectedFile = file;
      this.imageError = '';
      
      // Create image preview
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
    this.imagePreview = null;
    this.imageError = '';
    
    // Reset file input
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  private resetImageSelection() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.imageError = '';
    
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

createAdmin() {
  // Clear previous messages
  this.errorMessage = '';
  this.successMessage = '';
  this.imageError = '';

  // Validate inputs
  if (this.validateInputs()) {
    console.log('Admin data being sent:', this.admin);
    
    this.isLoading = true;
    if (this.selectedFile) {
      this.isImageUploading = true;
    }

    // Use FormData - match the backend UserVM property names exactly (PascalCase)
    const formData = new FormData();
    formData.append('FirstName', this.admin.firstName ?? '');      // Match UserVM.FirstName
    formData.append('Surname', this.admin.surname ?? '');          // Match UserVM.Surname  
    formData.append('Email', this.admin.email ?? '');              // Match UserVM.Email
    formData.append('Cellphone', this.admin.cellphone ?? '');      // Match UserVM.Cellphone
    formData.append('Password', 'administrator');                  // Match UserVM.Password
    formData.append('ConfirmPassword', 'administrator');           // Match UserVM.ConfirmPassword
    formData.append('RoleId', (this.admin.roleId || 3).toString()); // Match UserVM.RoleId
    // Add all permissions
    formData.append('EnableEventCRUD', this.admin.EnableEventCRUD?.toString() || 'false');
    formData.append('EnableProductCRUD', this.admin.EnableProductCRUD?.toString() || 'false');
    formData.append('EnableDonationCRUD', this.admin.EnableDonationCRUD?.toString() || 'false');
    formData.append('EnableExpenditureCRUD', this.admin.EnableExpenditureCRUD?.toString() || 'false');
    formData.append('EnableInventoryCRUD', this.admin.EnableInventoryCRUD?.toString() || 'false');
    formData.append('EnableDeliveryCRUD', this.admin.EnableDeliveryCRUD?.toString() || 'false');
    formData.append('EnableEmployeeCRUD', this.admin.EnableEmployeeCRUD?.toString() || 'false');
    formData.append('EnableOrderCRUD', this.admin.EnableOrderCRUD?.toString() || 'false');
    formData.append('EnableRunnerCRUD', this.admin.EnableRunnerCRUD?.toString() || 'false');

    // Only append image if one is selected
    if (this.selectedFile) {
      formData.append('ProfileImage', this.selectedFile, this.selectedFile.name); // Match UserVM.ProfileImage
    }

    // Debug: Log FormData contents
    console.log('FormData contents:');
    for (let pair of formData.entries()) {
      if (pair[1] instanceof File) {
        console.log(pair[0] + ': [File] ' + pair[1].name + ' (' + pair[1].size + ' bytes)');
      } else {
        console.log(pair[0] + ': ' + pair[1]);
      }
    }

    this.userService.CreateAdminWithImage(formData, this.ownerId.userId).subscribe({
      next: (response) => {
        console.log('Admin created successfully:', response);
        this.successMessage = 'Admin created successfully!';
        this.errorMessage = '';
        this.showSuccess = true;
        this.isLoading = false;
        this.isImageUploading = false;

        // Send email
        const emailToUser: IEmail = {
          to: this.admin.email,
          subject: "Run For Rangers Account Created",
          body:
            "You have successfully been signed up to Run For Rangers as an Admin.\n" +
            "Here is your default password (please update it immediately after logging in).\n" +
            "Password: administrator"
        };

        this.emailService.sendEmail(emailToUser).subscribe({
          next: () => console.log('Email sent to admin:', this.admin.email),
          error: (err) => console.error('Failed to send email:', err)
        });

        this.notificationService.showSuccess('Admin Created', 'The admin account has been created successfully.');
      
    },
      error: (error) => {
        console.error('Error creating admin:', error);
       this.errorMessage = 'Account Exists with this email address';
        this.notificationService.showError('Creation Failed', this.errorMessage);
        this.successMessage = '';
        this.isLoading = false;
        this.isImageUploading = false;
      }
    });
  }
}

  private createAdminWithImage() {
  this.isLoading = true;
  this.isImageUploading = true;

  const formData = new FormData();
  formData.append('email', this.admin.email ?? '');
  formData.append('firstName', this.admin.firstName ?? '');
  formData.append('surname', this.admin.surname ?? '');
  formData.append('cellphone', this.admin.cellphone ?? '');
  formData.append('password', this.admin.password ?? '');
 formData.append('confirmPassword', this.admin.confirmPassword ?? '');
  formData.append('roleId', this.admin.roleId?.toString() ?? '3');
  formData.append('ProfileImageBase64', this.admin.ProfileImageBase64 ?? '');


  if (this.selectedFile) {
    formData.append('profileImage', this.selectedFile, this.selectedFile.name);
  }

  this.userService.CreateAdminWithImage(formData,this.ownerId.userId).subscribe({
    next: (response) => {
      console.log('Admin created successfully with image:', response);
      this.successMessage = 'Admin created successfully!';
      this.errorMessage = '';
      this.showSuccess = true;
      this.isLoading = false;
      this.isImageUploading = false;

      // Build and send email
      const emailToUser: IEmail = {
        to: this.admin.email,
        subject: "Run For Rangers Account",
        body:
          "You have successfully signed up to Run For Rangers as an Admin.\n" +
          "Here is your default password (please update it immediately upon login):\n" +
          "Password: administrator"
      };

      this.emailService.sendEmail(emailToUser).subscribe({
        next: () => console.log('Email sent to admin:', this.admin.email),
        error: (err) => console.error('Failed to send email:', err)
      });

      // Hide success message
      setTimeout(() => {
        this.showSuccess = false;
      }, 3000);

      this.clear();
    },
    error: (error) => {
      console.error('Error creating admin with image:', error);
      this.errorMessage = 'Account Exists with this email address';
      this.notificationService.showError('Creation Failed', this.errorMessage);
      this.successMessage = '';
      this.isLoading = false;
      this.isImageUploading = false;
    }
  });
}


private createAdminWithoutImage() {
  this.isLoading = true;

  // Use FormData even when not sending an image
  const formData = new FormData();
  formData.append('email', this.admin.email ?? '');
  formData.append('firstName', this.admin.firstName ?? '');
  formData.append('surname', this.admin.surname ?? '');
  formData.append('cellphone', this.admin.cellphone ?? '');
  formData.append('password', this.admin.password ?? '');
  formData.append('confirmPassword', this.admin.confirmPassword ?? '');
  formData.append('roleId', this.admin.roleId?.toString() ?? '3');
  // Don't append profileImage - let it be null

  this.userService.CreateAdminWithImage(formData, this.ownerId.userId).subscribe({
    next: (response) => {
      console.log('Admin created successfully:', response);
      this.successMessage = 'Admin created successfully!';
      this.errorMessage = '';
      this.showSuccess = true;
      this.isLoading = false;

      // Build email before clearing the form
      const emailToUser: IEmail = {
        to: this.admin.email,
        subject: "Run For Rangers Account",
        body:
          "You have successfully signed up to Run For Rangers as an Admin.\n" +
          "Here is your default password (please update it immediately upon login):\n" +
          "Password: administrator"
      };

      this.emailService.sendEmail(emailToUser).subscribe({
        next: () => console.log('Email sent to admin:', this.admin.email),
        error: (err) => console.error('Failed to send email:', err)
      });

     this.notificationService.showSuccess('Admin Created', 'The admin account has been created successfully.');
      this.clear();
    },
    error: (error) => {
      console.error('API Error:', error);
       this.errorMessage = 'Account Exists with this email address';
      this.notificationService.showError('Creation Failed', this.errorMessage);
      this.successMessage = '';
      this.isLoading = false;
    }
  });
}

// Add these methods to your CreateAdminComponent class

selectAllPermissions() {
  this.admin.EnableProductCRUD = true;
  this.admin.EnableEventCRUD = true;
  this.admin.EnableDonationCRUD = true;
  this.admin.EnableExpenditureCRUD = true;
  this.admin.EnableInventoryCRUD = true;
}

clearAllPermissions() {
  this.admin.EnableProductCRUD = false;
  this.admin.EnableEventCRUD = false;
  this.admin.EnableDonationCRUD = false;
  this.admin.EnableExpenditureCRUD = false;
  this.admin.EnableInventoryCRUD = false;
}

// Also update your clear() method to reset permissions
clear() {
  this.admin = {
    email: '',
    password: 'administrator',
    confirmPassword: 'administrator',
    firstName: '',
    surname: '',
    cellphone: '',
    roleId: 3,
    profileImage: '',
    EnableProductCRUD: false,
    EnableEventCRUD: false,
    EnableDonationCRUD: false,
    EnableExpenditureCRUD: false,
    EnableInventoryCRUD: false
  };
  this.errorMessage = '';
  this.successMessage = '';
  this.resetImageSelection();
}

onRoleChange() {
  // If Head Admin is selected, clear all permissions
  if (this.admin.roleId == 4) {
    this.clearAllPermissions();
  }
}

  back() {
    this.router.navigate(['/admin-home']);
  }

  validateInputs(): boolean {
    // Empty fields validation
    if (!this.admin.firstName || !this.admin.surname || !this.admin.email || 
        !this.admin.password || !this.admin.confirmPassword) {
      this.errorMessage = 'Please fill in all fields';
      console.log('Validation failed - empty fields:', this.admin);
      return false;
    }
    
    // Password match validation
    if (this.admin.password !== this.admin.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return false;
    }
    
    // Password length validation
    if (this.admin.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long';
      return false;
    }
    
    // Cell number validation
    if (!this.admin.cellphone || this.admin.cellphone.length !== 10) {
      this.errorMessage = 'Cell number must be 10 digits long';
      return false;
    }
    
    // Cell number must start with 0
    if (!this.admin.cellphone.startsWith('0')) {
      this.errorMessage = 'Cell number must start with 0';
      return false;
    }
    
    // Cell number must be all digits
    if (!/^\d+$/.test(this.admin.cellphone)) {
      this.errorMessage = 'Cell number must contain only digits';
      return false;
    }
    
    // Email validation (basic)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.admin.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return false;
    }
    
    // Name length validation
    if (this.admin.firstName.trim().length < 2) {
      this.errorMessage = 'First name must be at least 2 characters long';
      return false;
    }
    
    // Surname length validation
    if (this.admin.surname.trim().length < 2) {
      this.errorMessage = 'Surname must be at least 2 characters long';
      return false;
    }

    
    
    return true;
  }
}



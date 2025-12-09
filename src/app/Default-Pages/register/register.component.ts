import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IUser } from '../../Interfaces/IUser';
import { IEmail } from '../../Interfaces/IEmail';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../API-Services/user.service';
import { NavBarDefaultComponent } from "../../nav-bar-default/nav-bar-default.component";
import { EmailService } from '../../API-Services/email.service';
import { finalize, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, NavBarDefaultComponent],
  standalone: true,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  user: IUser = {
    userId: 0,
    firstName: '',
    surname: '',
    cellphone: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  loading: boolean = false;
  // Image upload properties
  selectedFile: File | null = null;
  selectedImagePreview: string | null = null;

  errorMessages: any = {
    FirstName: '',
    Surname: '',
    Cellphone: '',
    Email: '',
    Password: '',
    ConfirmPassword: '',
    ProfileImage: '',
    AccountExists: '',
  };
  

  isSubmitted: boolean = false;
  
  constructor(private router: Router, private userService: UserService, private emailService: EmailService) {}
  
  ngOnInit(): void {
    this.clearForm();
    this.loading = false;
  }
  
  clearForm() {
    this.user.firstName = '';
    this.user.surname = '';
    this.user.cellphone = '';
    this.user.email = '';
    this.user.password = '';
    this.user.confirmPassword = '';
    this.selectedFile = null;
    this.selectedImagePreview = null;
    this.clearErrors();
  }

  clearErrors() {
    this.errorMessages = {
      FirstName: '',
      Surname: '',
      Cellphone: '',
      Email: '',
      Password: '',
      ConfirmPassword: '',
      ProfileImage: ''
    };
  }

  // Image upload methods
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.errorMessages.ProfileImage = 'Please select a valid image file.';
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.errorMessages.ProfileImage = 'Image size must be less than 5MB.';
        return;
      }

      this.selectedFile = file;
      this.errorMessages.ProfileImage = '';

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
    const fileInput = document.getElementById('profileImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.errorMessages.ProfileImage = '';
  }

  onSubmit() {
    this.isSubmitted = true;
    this.clearErrors();

    if (!this.validateInputs()) { 
      return; 
    }

    // Start loading
    this.loading = true;

    const formData = new FormData();
    formData.append('FirstName', this.user.firstName ?? '');
    formData.append('Surname', this.user.surname ?? '');
    formData.append('Email', this.user.email ?? '');
    formData.append('Cellphone', this.user.cellphone ?? '');
    formData.append('Password', this.user.password ?? '');
    if (this.selectedFile) {
      formData.append('ProfileImage', this.selectedFile);
    }

    // keep a copy BEFORE we clear the form
    const emailToUser: IEmail = {
      to: this.user.email,
      subject: 'Run For Rangers Account',
      body: `Hi ${this.user.firstName},

You have successfully signed up to Run For Rangers as a user.

Regards,
Run For Rangers Team`
    };

    this.userService.CreateUserWithImage(formData).pipe(
      switchMap(response => {
        console.log('User created successfully:', response);

        // send email, but pass original response forward
        return this.emailService.sendEmail(emailToUser).pipe(
          catchError(err => {
            console.error('Failed to send email:', err);
            return of(null); // ignore email error
          }),
          switchMap(() => of(response)) // ✅ pass original user response forward
        );
      }),
      finalize(() => {
        // Stop loading when everything is complete
        this.loading = false;
        this.clearForm();
      })
    ).subscribe({
      next: (response) => {
        console.log("Register Response", response);

        if (response) {
          sessionStorage.setItem('userData', JSON.stringify(response)); // ✅ Now this won't be null
        }

        // Small delay to show success before navigation
        setTimeout(() => {
          this.navigateToHome();
        }, 500);
      },
      error: (error) => {
        console.error('Registration failed:', error);
        this.errorMessages.AccountExists = 'An account with this email already exists.';
        if (error.error && error.error.errors) {
          this.errorMessages = { ...this.errorMessages, ...error.error.errors };
        } else {
          this.errorMessages.general = 'Registration failed. Please try again.';
        }
         setTimeout(() => {
       
          this.errorMessages.AccountExists = 'An account with this email already exists.';
        }, 50);
      }
    });
  }

  validateInputs(): boolean {
    let isValid = true;

    // First Name validation
    if (!this.user.firstName) {
      this.errorMessages.FirstName = 'First name is required';
      isValid = false;
    } else if (this.user.firstName.length < 2) {
      this.errorMessages.FirstName = 'Name must be at least 2 characters long';
      isValid = false;
    }

    // Surname validation
    if (!this.user.surname) {
      this.errorMessages.Surname = 'Surname is required';
      isValid = false;
    } else if (this.user.surname.length < 2) {
      this.errorMessages.Surname = 'Surname must be at least 2 characters long';
      isValid = false;
    }

    // Email validation
    if (!this.user.email) {
      this.errorMessages.Email = 'Email is required';
      isValid = false;
    } else if (!this.validateEmail(this.user.email)) {
      this.errorMessages.Email = 'Email is not valid';
      isValid = false;
    }

    // Cellphone validation
    if (!this.user.cellphone) {
      this.errorMessages.Cellphone = 'Cell number is required';
      isValid = false;
    } else if (this.user.cellphone.length !== 10) {
      this.errorMessages.Cellphone = 'Cell number must be 10 digits long';
      isValid = false;
    } else if (!this.user.cellphone.startsWith('0')) {
      this.errorMessages.Cellphone = 'Cell number must start with 0';
      isValid = false;
    }

    // Password validation
    if (!this.user.password) {
      this.errorMessages.Password = 'Password is required';
      isValid = false;
    } else if (this.user.password.length < 8) {
      this.errorMessages.Password = 'Password must be at least 8 characters long';
      isValid = false;
    }

    // Confirm Password validation
    if (!this.user.confirmPassword) {
      this.errorMessages.ConfirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (this.user.password !== this.user.confirmPassword) {
      this.errorMessages.ConfirmPassword = 'Passwords do not match';
      isValid = false;
    }

    return isValid;
  }

  private validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  getLabelClass(fieldName: string): string {
    return this.errorMessages[fieldName] && this.isSubmitted ? 'error-label' : '';
  }

  getInputClass(fieldName: string): string {
    return this.errorMessages[fieldName] && this.isSubmitted ? 'error-input' : '';
  }
  
  // Navigation methods
  navigateToHome() {
    this.router.navigate(['/home']);
  }
  
  navigateToSignIn() {
    this.router.navigate(["/signIn"]);
  }
}
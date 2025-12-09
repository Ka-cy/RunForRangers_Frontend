import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Irunner } from '../../Interfaces/irunner';
import { Country } from '../../Interfaces/icountry';
import { RunnerService } from '../../API-Services/runner.service';
import { CountryService } from '../../API-Services/country.service';
import { HttpErrorResponse } from '@angular/common/http';
import { NavBarDefaultComponent } from '../../nav-bar-default/nav-bar-default.component';

@Component({
  selector: 'app-register-runner',
  templateUrl: './register-runner.component.html',
  styleUrls: ['./register-runner.component.css'],
  standalone: true,
  imports: [FormsModule, NgSelectModule, CommonModule, NavBarDefaultComponent, RouterModule, MatSnackBarModule]
})
export class RegisterRunnerComponent implements OnInit {
  newRunner: Irunner = {
    userId: 0,
    countryOfResidence: '',
    nationality: '',
    allergies: '',
    shoeSize: '',
    medicalHistory: '',
    clothingSize: '',
    runnerImage: '',
    idNumber: ''
  };

  userInfo: { firstName: string; surname: string; email: string; profileImageBase64?: string } | null = null;
  countries: Country[] = [];
  selectedFile: File | null = null;
  selectedImagePreview: string | null = null;
  errorMessages: { [key: string]: string } = {};
  isSubmitted = false;
  isLoading = false;
  userInfoLoading = false;
userData: any  = JSON.parse(sessionStorage.getItem('userData') || '{}');
  constructor(
    private router: Router,
    private runnerService: RunnerService,
    private countryService: CountryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('=== RegisterRunnerComponent ngOnInit started ===');
    
    // ✅ Load user from session storage
    const sessionUser = this.runnerService.getCurrentUser();
    console.log('User from session:', sessionUser);

    if (sessionUser && sessionUser.userId) {
      this.newRunner.userId = sessionUser.userId;

      // Also load user details for display
      const storedUser = sessionStorage.getItem('userData') || sessionStorage.getItem('adminData');
      console.log('Stored user data:', storedUser);
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        
        // Ensure profile image has proper data URL format
        let profileImageBase64 = parsedUser.profileImageBase64 || '';
        if (profileImageBase64 && !profileImageBase64.startsWith('data:image/')) {
          profileImageBase64 = `data:image/jpeg;base64,${profileImageBase64}`;
        }
        
        this.userInfo = {
          firstName: parsedUser.firstName || '',
          surname: parsedUser.surname || '',
          email: parsedUser.email || '',
          profileImageBase64: profileImageBase64
        };
        
        // Set the existing profile image as preview
        if (profileImageBase64) {
          this.selectedImagePreview = profileImageBase64;
          console.log('Using existing user profile image:', this.selectedImagePreview?.substring(0, 50) + '...');
        }
      }

      // Try fetching runner info (safe 404 handling)
      this.fetchUserInfo(sessionUser.userId);
      this.fetchCountries();
    } else {
      console.error('Invalid user session:', sessionUser);
      this.errorMessages['general'] = 'Please log in to register as a runner.';
      this.router.navigate(['/signIn']);
    }
  }

  fetchUserInfo(userId: number): void {
    this.userInfoLoading = true;
    this.runnerService.getRunnerById(userId).subscribe({
      next: (res) => {
        console.log('Fetched runner info:', res);
        if (res.user) {
          this.userInfo = {
            firstName: res.user.firstName,
            surname: res.user.surname,
            email: res.user.email || ''
          };
        }
        this.userInfoLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          console.log('No runner profile yet. Showing session user only.');
        } else {
          console.error('Failed to load user info', err);
          // Silently handle the error without showing it to the user
        }
        this.userInfoLoading = false;
      }
    });
  }

  fetchCountries(): void {
    this.isLoading = true;
    this.countryService.getAllCountries().subscribe({
      next: (res) => {
        this.countries = res;
        console.log('Countries loaded:', res);
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading countries:', err);
        // Add comprehensive fallback countries list
        this.countries = [
          { countryId: 1, countryName: 'Afghanistan' },
          { countryId: 2, countryName: 'Albania' },
          { countryId: 3, countryName: 'Algeria' },
          { countryId: 4, countryName: 'Argentina' },
          { countryId: 5, countryName: 'Armenia' },
          { countryId: 6, countryName: 'Australia' },
          { countryId: 7, countryName: 'Austria' },
          { countryId: 8, countryName: 'Azerbaijan' },
          { countryId: 9, countryName: 'Bangladesh' },
          { countryId: 10, countryName: 'Belgium' },
          { countryId: 11, countryName: 'Bolivia' },
          { countryId: 12, countryName: 'Bosnia and Herzegovina' },
          { countryId: 13, countryName: 'Botswana' },
          { countryId: 14, countryName: 'Brazil' },
          { countryId: 15, countryName: 'Bulgaria' },
          { countryId: 16, countryName: 'Cambodia' },
          { countryId: 17, countryName: 'Cameroon' },
          { countryId: 18, countryName: 'Canada' },
          { countryId: 19, countryName: 'Chile' },
          { countryId: 20, countryName: 'China' },
          { countryId: 21, countryName: 'Colombia' },
          { countryId: 22, countryName: 'Croatia' },
          { countryId: 23, countryName: 'Czech Republic' },
          { countryId: 24, countryName: 'Denmark' },
          { countryId: 25, countryName: 'Ecuador' },
          { countryId: 26, countryName: 'Egypt' },
          { countryId: 27, countryName: 'Estonia' },
          { countryId: 28, countryName: 'Ethiopia' },
          { countryId: 29, countryName: 'Finland' },
          { countryId: 30, countryName: 'France' },
          { countryId: 31, countryName: 'Germany' },
          { countryId: 32, countryName: 'Ghana' },
          { countryId: 33, countryName: 'Greece' },
          { countryId: 34, countryName: 'Guatemala' },
          { countryId: 35, countryName: 'Hungary' },
          { countryId: 36, countryName: 'Iceland' },
          { countryId: 37, countryName: 'India' },
          { countryId: 38, countryName: 'Indonesia' },
          { countryId: 39, countryName: 'Iran' },
          { countryId: 40, countryName: 'Iraq' },
          { countryId: 41, countryName: 'Ireland' },
          { countryId: 42, countryName: 'Israel' },
          { countryId: 43, countryName: 'Italy' },
          { countryId: 44, countryName: 'Japan' },
          { countryId: 45, countryName: 'Jordan' },
          { countryId: 46, countryName: 'Kazakhstan' },
          { countryId: 47, countryName: 'Kenya' },
          { countryId: 48, countryName: 'Kuwait' },
          { countryId: 49, countryName: 'Latvia' },
          { countryId: 50, countryName: 'Lebanon' },
          { countryId: 51, countryName: 'Lesotho' },
          { countryId: 52, countryName: 'Lithuania' },
          { countryId: 53, countryName: 'Luxembourg' },
          { countryId: 54, countryName: 'Malaysia' },
          { countryId: 55, countryName: 'Malta' },
          { countryId: 56, countryName: 'Mexico' },
          { countryId: 57, countryName: 'Morocco' },
          { countryId: 58, countryName: 'Namibia' },
          { countryId: 59, countryName: 'Nepal' },
          { countryId: 60, countryName: 'Netherlands' },
          { countryId: 61, countryName: 'New Zealand' },
          { countryId: 62, countryName: 'Nigeria' },
          { countryId: 63, countryName: 'North Korea' },
          { countryId: 64, countryName: 'Norway' },
          { countryId: 65, countryName: 'Pakistan' },
          { countryId: 66, countryName: 'Peru' },
          { countryId: 67, countryName: 'Philippines' },
          { countryId: 68, countryName: 'Poland' },
          { countryId: 69, countryName: 'Portugal' },
          { countryId: 70, countryName: 'Qatar' },
          { countryId: 71, countryName: 'Romania' },
          { countryId: 72, countryName: 'Russia' },
          { countryId: 73, countryName: 'Saudi Arabia' },
          { countryId: 74, countryName: 'Senegal' },
          { countryId: 75, countryName: 'Serbia' },
          { countryId: 76, countryName: 'Singapore' },
          { countryId: 77, countryName: 'Slovakia' },
          { countryId: 78, countryName: 'Slovenia' },
          { countryId: 79, countryName: 'South Africa' },
          { countryId: 80, countryName: 'South Korea' },
          { countryId: 81, countryName: 'Spain' },
          { countryId: 82, countryName: 'Sri Lanka' },
          { countryId: 83, countryName: 'Swaziland' },
          { countryId: 84, countryName: 'Sweden' },
          { countryId: 85, countryName: 'Switzerland' },
          { countryId: 86, countryName: 'Thailand' },
          { countryId: 87, countryName: 'Tunisia' },
          { countryId: 88, countryName: 'Turkey' },
          { countryId: 89, countryName: 'Uganda' },
          { countryId: 90, countryName: 'Ukraine' },
          { countryId: 91, countryName: 'United Arab Emirates' },
          { countryId: 92, countryName: 'United Kingdom' },
          { countryId: 93, countryName: 'United States' },
          { countryId: 94, countryName: 'Uruguay' },
          { countryId: 95, countryName: 'Venezuela' },
          { countryId: 96, countryName: 'Vietnam' },
          { countryId: 97, countryName: 'Zambia' },
          { countryId: 98, countryName: 'Zimbabwe' }
        ];
        console.log('Using comprehensive fallback countries:', this.countries.length, 'countries loaded');
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessages['ProfileImage'] =
          'Only JPG, PNG, or GIF files are allowed';
        this.selectedFile = null;
        this.selectedImagePreview = null;
      } else if (file.size > 5 * 1024 * 1024) {
        this.errorMessages['ProfileImage'] = 'File size exceeds 5MB limit';
        this.selectedFile = null;
        this.selectedImagePreview = null;
      } else {
        this.selectedFile = file;
        this.errorMessages['ProfileImage'] = '';
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.selectedImagePreview = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('runnerImage') as HTMLInputElement;
    fileInput.click();
  }

  removeImage(): void {
    this.selectedFile = null;
    // Revert to original user profile image
    this.selectedImagePreview = this.userInfo?.profileImageBase64 || null;
    const fileInput = document.getElementById('runnerImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    // Clear any error messages since we're using the user's existing image
    delete this.errorMessages['ProfileImage'];
  }

  validateInputs(): boolean {
    let isValid = true;
    this.errorMessages = {};
    
    console.log('=== Validating runner data ===');
    console.log('Runner data:', this.newRunner);

    // Required field validations
    if (!this.newRunner.countryOfResidence?.trim()) {
      this.errorMessages['countryOfResidence'] = 'Country of Residence is required';
      console.log('❌ Country of Residence is missing');
      isValid = false;
    } else {
      console.log('✅ Country of Residence:', this.newRunner.countryOfResidence);
    }

    if (!this.newRunner.nationality?.trim()) {
      this.errorMessages['nationality'] = 'Nationality is required';
      console.log('❌ Nationality is missing');
      isValid = false;
    } else {
      console.log('✅ Nationality:', this.newRunner.nationality);
    }

    // ID Number validation (13 digits for South African ID)
    if (!this.newRunner.idNumber?.trim()) {
      this.errorMessages['idNumber'] = 'ID Number is required';
      console.log('❌ ID Number is missing');
      isValid = false;
    } else if (!/^\d{13}$/.test(this.newRunner.idNumber.trim())) {
      this.errorMessages['idNumber'] = 'ID Number must be exactly 13 digits';
      console.log('❌ ID Number format invalid:', this.newRunner.idNumber);
      isValid = false;
    } else {
      console.log('✅ ID Number:', this.newRunner.idNumber);
    }

    // Allergies validation (required)
    if (!this.newRunner.allergies?.trim()) {
      this.errorMessages['allergies'] = 'Allergies field is required (enter "None" if no allergies)';
      console.log('❌ Allergies is missing');
      isValid = false;
    } else {
      console.log('✅ Allergies:', this.newRunner.allergies);
    }

    // Medical History validation (required)
    if (!this.newRunner.medicalHistory?.trim()) {
      this.errorMessages['medicalHistory'] = 'Medical History is required (enter "None" if no medical history)';
      console.log('❌ Medical History is missing');
      isValid = false;
    } else {
      console.log('✅ Medical History:', this.newRunner.medicalHistory);
    }

    // Shoe Size validation (required)
    if (!this.newRunner.shoeSize?.trim()) {
      this.errorMessages['shoeSize'] = 'Shoe Size is required';
      console.log('❌ Shoe Size is missing');
      isValid = false;
    } else {
      const shoeSize = this.newRunner.shoeSize.trim();
      if (!/^\d+(\.\d+)?$/.test(shoeSize)) {
        this.errorMessages['shoeSize'] = 'Shoe Size must be a number';
        console.log('❌ Shoe Size not numeric:', this.newRunner.shoeSize);
        isValid = false;
      } else {
        const size = parseFloat(shoeSize);
        if (size < 3 || size > 50) {
          this.errorMessages['shoeSize'] = 'Shoe Size must be between 3 and 50 (supports US, UK, and EU sizes)';
          console.log('❌ Shoe Size out of range:', size);
          isValid = false;
        } else {
          console.log('✅ Shoe Size:', this.newRunner.shoeSize);
        }
      }
    }

    // Clothing Size validation (required)
    if (!this.newRunner.clothingSize?.trim()) {
      this.errorMessages['clothingSize'] = 'Clothing Size is required';
      console.log('❌ Clothing Size is missing');
      isValid = false;
    } else {
      const validSizes = ['S', 'M', 'L', 'XL', 'XXL'];
      if (!validSizes.includes(this.newRunner.clothingSize.trim().toUpperCase())) {
        this.errorMessages['clothingSize'] = 'Clothing Size must be S, M, L, XL, or XXL';
        console.log('❌ Clothing Size invalid:', this.newRunner.clothingSize);
        isValid = false;
      } else {
        // Normalize the size
        this.newRunner.clothingSize = this.newRunner.clothingSize.trim().toUpperCase();
        console.log('✅ Clothing Size:', this.newRunner.clothingSize);
      }
    }

    // Profile image is automatically taken from user profile, no validation needed
    
    console.log('=== Validation summary ===');
    console.log('Is valid:', isValid);
    console.log('Error messages:', this.errorMessages);

    return isValid;
  }

  saveRunner(): void {
    this.isSubmitted = true;
    if (!this.validateInputs()) {
      this.snackBar.open('Please correct the errors below before submitting.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isLoading = true;
    
    // Show loading message
    this.snackBar.open('Registering runner, please wait...', '', {
      duration: 2000,
      panelClass: ['info-snackbar']
    });

    console.log('Sending runner data:', this.newRunner);
    
    // Use the existing user profile image instead of uploaded file
    let profileImageFile = null;
    if (this.userInfo?.profileImageBase64 && !this.selectedFile) {
      // Convert base64 to File object if we have user's existing image
      try {
        const base64Data = this.userInfo.profileImageBase64.split(',')[1] || this.userInfo.profileImageBase64;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        profileImageFile = new File([byteArray], 'profile-image.jpg', { type: 'image/jpeg' });
        console.log('Using existing user profile image');
      } catch (error) {
        console.warn('Could not convert base64 image:', error);
      }
    } else if (this.selectedFile) {
      profileImageFile = this.selectedFile;
      console.log('Using newly uploaded image');
    }

    this.runnerService
      .createRunner(this.newRunner, profileImageFile)
      .subscribe({
        next: (response) => {
          console.log('Runner created successfully:', response);
          this.snackBar.open('✅ Runner registered successfully! Welcome to Run for Rangers!', 'Close', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          
          // Update user role in session
          this.userData.roleId = 2;
          sessionStorage.setItem('userData', JSON.stringify(this.userData));
          
          this.isLoading = false;
          this.router.navigate(['/runner-page']);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error:', err);
          this.isLoading = false;
          
          let errorMessage = 'Something went wrong. Please try again.';
          
          if (err.error && err.error.Message) {
            errorMessage = err.error.Message;
          } else if (err.status === 400) {
            errorMessage = 'Invalid data provided. Please check your information and try again.';
          } else if (err.status === 409) {
            errorMessage = 'A runner with this ID number already exists.';
          } else if (err.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          
          this.errorMessages['general'] = errorMessage;
          this.snackBar.open(`❌ ${errorMessage}`, 'Close', {
            duration: 7000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  cancel(): void {
    this.router.navigate(['/home']);
  }

  getInputClass(field: keyof Irunner | 'ProfileImage'): string {
    return this.isSubmitted && this.errorMessages[field]
      ? 'error-input'
      : '';
  }

  getLabelClass(field: keyof Irunner | 'ProfileImage'): string {
    return this.isSubmitted && this.errorMessages[field]
      ? 'error-label'
      : '';
  }
}

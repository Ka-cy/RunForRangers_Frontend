import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RunnerService } from '../../API-Services/runner.service';
import { UserService } from '../../API-Services/user.service';
import { UserDataService } from '../../API-Services/user-data.service';
import { NavBarDefaultComponent } from "../../nav-bar-default/nav-bar-default.component";

@Component({
  selector: 'app-edit-runner-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, NavBarDefaultComponent],
  templateUrl: './edit-runner-profile.component.html',
  styleUrls: ['./edit-runner-profile.component.css']
})
export class EditRunnerProfileComponent implements OnInit {
  currentUser: any = null;
  runner: any = {};
  originalRunner: any = {};
  
  // Form data
  runnerUpdates = {
    nationality: '',
    countryOfResidence: '',
    shoeSize: '',
    clothingSize: '',
    allergies: '',
    medicalHistory: '',
    profileImage: null as File | null
  };

  userUpdates = {
    firstName: '',
    surname: '',
    email: '',
    cellphone: '',
    profileImage: null as File | null
  };

  // UI state
  isLoading = false;
  isSaving = false;
  showSuccessMessage = false;
  showErrorMessage = false;
  
  // Image handling (following register-runner pattern)
  selectedImagePreview: string | null = null;
  userInfo: any = {};
  
  // Error handling
  objErrorMessage: any = {};

  // Dropdown options
  countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bangladesh', 'Belgium', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Bulgaria',
    'Cambodia', 'Cameroon', 'Canada', 'Chile', 'China', 'Colombia', 'Croatia', 'Czech Republic',
    'Denmark', 'Ecuador', 'Egypt', 'Estonia', 'Ethiopia', 'Finland', 'France', 'Germany', 'Ghana',
    'Greece', 'Guatemala', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
    'Israel', 'Italy', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Latvia', 'Lebanon',
    'Lesotho', 'Lithuania', 'Luxembourg', 'Malaysia', 'Malta', 'Mexico', 'Morocco', 'Namibia',
    'Nepal', 'Netherlands', 'New Zealand', 'Nigeria', 'North Korea', 'Norway', 'Pakistan', 'Peru',
    'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Saudi Arabia', 'Senegal',
    'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'South Korea', 'Spain',
    'Sri Lanka', 'Swaziland', 'Sweden', 'Switzerland', 'Thailand', 'Tunisia', 'Turkey', 'Uganda',
    'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Venezuela',
    'Vietnam', 'Zambia', 'Zimbabwe'
  ];

  shoeSizes = [
    '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5',
    '11', '11.5', '12', '12.5', '13', '13.5', '14', '14.5', '15'
  ];

  clothingSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  constructor(
    private runnerService: RunnerService,
    private userService: UserService,
    private userDataService: UserDataService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = JSON.parse(sessionStorage.getItem('userData') || 'null');
    
    if (!this.currentUser || this.currentUser.roleId !== 2) {
      this.router.navigate(['/home']);
      return;
    }

    // Load runner data
    this.loadRunnerData();
  }

  loadRunnerData(): void {
    this.isLoading = true;
    
    // Try getRunnerById first since the server seems to have issues with WithDonations
    this.runnerService.getRunnerById(this.currentUser.userId).subscribe({
      next: (response: any) => {
        this.runner = response;
        this.originalRunner = { ...response };
        
        // Set userInfo for image display and populate selectedImagePreview
        this.userInfo = this.currentUser || {};
        
        // Handle image URL construction properly
        let imageUrl = null;
        
        // Priority 1: Check currentUser.profileImageBase64 (this has the base64 data!)
        if (this.currentUser?.profileImageBase64) {
          imageUrl = `data:image/png;base64,${this.currentUser.profileImageBase64}`;
        }
        // Priority 2: Check runner.runnerImage (this exists!)
        else if (this.runner?.runnerImage) {
          imageUrl = this.constructImageUrl(this.runner.runnerImage);
        }
        // Priority 3: Check runner user profile image
        else if (this.runner?.user?.profileImage) {
          imageUrl = this.constructImageUrl(this.runner.user.profileImage);
        }
        // Priority 4: Check currentUser.profileImage
        else if (this.currentUser?.profileImage) {
          imageUrl = this.constructImageUrl(this.currentUser.profileImage);
        }
        
        if (imageUrl) {
          this.userInfo.profileImageBase64 = imageUrl;
          this.selectedImagePreview = imageUrl;
        }
        
        // Populate form data with proper null checks
        this.runnerUpdates = {
          nationality: this.runner?.nationality || '',
          countryOfResidence: this.runner?.countryOfResidence || '',
          shoeSize: this.runner?.shoeSize || '',
          clothingSize: this.runner?.clothingSize || '',
          allergies: this.runner?.allergies || '',
          medicalHistory: this.runner?.medicalHistory || '',
          profileImage: null
        };

        // Use runner user data if available, otherwise fall back to session data
        this.userUpdates = {
          firstName: this.runner?.user?.firstName || this.currentUser?.firstName || '',
          surname: this.runner?.user?.surname || this.currentUser?.surname || '',
          email: this.runner?.user?.email || this.currentUser?.email || '',
          cellphone: this.runner?.user?.cellphone || this.currentUser?.cellphone || '',
          profileImage: null
        };

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading runner data:', error);
        
        // If API fails, just populate with current user data
        this.userInfo = this.currentUser || {};
        let imageUrl = null;
        
        if (this.currentUser?.profileImageBase64) {
          imageUrl = `data:image/png;base64,${this.currentUser.profileImageBase64}`;
        } else if (this.currentUser?.profileImage) {
          imageUrl = this.constructImageUrl(this.currentUser.profileImage);
        }
        
        if (imageUrl) {
          this.userInfo.profileImageBase64 = imageUrl;
          this.selectedImagePreview = imageUrl;
        }
        
        this.userUpdates = {
          firstName: this.currentUser?.firstName || '',
          surname: this.currentUser?.surname || '',
          email: this.currentUser?.email || '',
          cellphone: this.currentUser?.cellphone || '',
          profileImage: null
        };
        
        this.runnerUpdates = {
          nationality: '',
          countryOfResidence: '',
          shoeSize: '',
          clothingSize: '',
          allergies: '',
          medicalHistory: '',
          profileImage: null
        };
        
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.objErrorMessage.ProfileImageError = 'Please select a valid image file.';
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        this.objErrorMessage.ProfileImageError = 'Image size must be less than 5MB.';
        return;
      }

      this.objErrorMessage.ProfileImageError = '';

      // Create preview using FileReader (following register-runner pattern)
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput(): void {
    document.getElementById('profileImage')?.click();
  }

  removeImage(): void {
    // Revert to original profile image (like register-runner does)
    this.selectedImagePreview = this.userInfo?.profileImageBase64 || null;
    this.runnerUpdates.profileImage = null;
    this.userUpdates.profileImage = null;
    
    // Clear the file input
    const fileInput = document.getElementById('profileImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  constructImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it's a base64 image, return as is
    if (imagePath.startsWith('data:image')) {
      return imagePath;
    }
    
    // Otherwise, construct the full URL
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return `https://localhost:7158/${cleanPath}`;
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.onerror = null; // Prevent infinite loop
    // Hide the image element to show the default avatar
    target.style.display = 'none';
  }

  onImageLoad(event: Event): void {
    // Image loaded successfully
  }

  onSave(): void {
    if (this.validateForm()) {
      this.isSaving = true;
      this.objErrorMessage = {};

      // Save user data first
      this.saveUserData().then(() => {
        // Then save runner data
        this.saveRunnerData();
      }).catch((error) => {
        console.error('Error saving user data:', error);
        this.showErrorMessage = true;
        this.hideMessageAfterDelay('error');
        this.isSaving = false;
      });
    }
  }

  private async saveUserData(): Promise<void> {
    if (this.hasUserDataChanged()) {
      const formData = new FormData();
      formData.append('UserId', this.currentUser.userId.toString());
      formData.append('FirstName', this.userUpdates.firstName);
      formData.append('Surname', this.userUpdates.surname);
      formData.append('Email', this.userUpdates.email);
      formData.append('Cellphone', this.userUpdates.cellphone);

      // If there's a new image selected, convert it from base64 to File
      if (this.selectedImagePreview && this.selectedImagePreview !== this.userInfo?.profileImageBase64) {
        // Get the file from the input element
        const fileInput = document.getElementById('profileImage') as HTMLInputElement;
        if (fileInput && fileInput.files && fileInput.files[0]) {
          formData.append('ProfileImage', fileInput.files[0]);
        }
      }

      console.log('Saving user data with FormData...');
      const response = await this.userService.UpdateUserWithImage(formData).toPromise();
      console.log('UpdateUserWithImage response:', response);
      
      // Update session storage immediately with the new image data
      if (this.selectedImagePreview && this.selectedImagePreview !== this.userInfo?.profileImageBase64) {
        console.log('Updating session storage with new profile image');
        const updatedUser = { ...this.currentUser };
        updatedUser.firstName = this.userUpdates.firstName;
        updatedUser.surname = this.userUpdates.surname;
        updatedUser.cellphone = this.userUpdates.cellphone;
        
        // Update the profile image in session storage
        updatedUser.profileImageBase64 = this.selectedImagePreview;
        
        // If the response contains updated user data, use it
        if (response && response.profileImageBase64) {
          updatedUser.profileImageBase64 = response.profileImageBase64;
        } else if (response && response.profileImage) {
          updatedUser.profileImage = response.profileImage;
        }
        
        // Update session storage and notify other components
        sessionStorage.setItem('userData', JSON.stringify(updatedUser));
        this.userDataService.notifyUserDataUpdate(updatedUser);
        this.currentUser = updatedUser;
      }
    }
  }

  private saveRunnerData(): void {
    if (this.hasRunnerDataChanged()) {
      // Create runner data object that matches Irunner interface
      const runnerData = {
        userId: this.runner.userId,
        countryOfResidence: this.runnerUpdates.countryOfResidence,
        nationality: this.runnerUpdates.nationality,
        allergies: this.runnerUpdates.allergies,
        shoeSize: this.runnerUpdates.shoeSize,
        medicalHistory: this.runnerUpdates.medicalHistory,
        clothingSize: this.runnerUpdates.clothingSize,
        runnerImage: this.runner.runnerImage || '',
        idNumber: this.runner.idNumber || ''
      };

      this.runnerService.updateRunner(this.currentUser.userId, runnerData, null).subscribe({
        next: (response: any) => {
          this.showSuccessMessage = true;
          this.hideMessageAfterDelay('success');
          
          // Update session storage with basic user info changes (not image, that's handled in saveUserData)
          if (this.hasUserDataChanged()) {
            const updatedUser = { ...this.currentUser };
            updatedUser.firstName = this.userUpdates.firstName;
            updatedUser.surname = this.userUpdates.surname;
            updatedUser.cellphone = this.userUpdates.cellphone;
            
            // Only update session if image wasn't already updated in saveUserData
            if (!this.selectedImagePreview || this.selectedImagePreview === this.userInfo?.profileImageBase64) {
              sessionStorage.setItem('userData', JSON.stringify(updatedUser));
              this.userDataService.notifyUserDataUpdate(updatedUser);
              this.currentUser = updatedUser;
            }
          }
          
          this.isSaving = false;
          
          // Redirect after success message
          setTimeout(() => {
            this.router.navigate(['/runner-milestone']);
          }, 2000);
        },
        error: (error: any) => {
          console.error('Error saving runner data:', error);
          this.showErrorMessage = true;
          this.hideMessageAfterDelay('error');
          this.isSaving = false;
        }
      });
    } else {
      // No runner data changed, just show success and redirect
      this.showSuccessMessage = true;
      this.hideMessageAfterDelay('success');
      this.isSaving = false;
      
      setTimeout(() => {
        this.router.navigate(['/runner-milestone']);
      }, 2000);
    }
  }

  private validateForm(): boolean {
    this.objErrorMessage = {};
    let isValid = true;

    // Validate required fields
    if (!this.userUpdates.firstName.trim()) {
      this.objErrorMessage.FirstnameError = 'First name is required.';
      isValid = false;
    }

    if (!this.userUpdates.surname.trim()) {
      this.objErrorMessage.SurnameError = 'Surname is required.';
      isValid = false;
    }

    if (!this.userUpdates.email.trim()) {
      this.objErrorMessage.EmailError = 'Email is required.';
      isValid = false;
    }

    if (!this.userUpdates.cellphone.trim()) {
      this.objErrorMessage.CellphoneError = 'Cellphone number is required.';
      isValid = false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.userUpdates.email && !emailRegex.test(this.userUpdates.email)) {
      this.objErrorMessage.EmailError = 'Please enter a valid email address.';
      isValid = false;
    }

    // Validate cellphone format (South African format)
    const cellphoneRegex = /^(\+27|0)[6-8][0-9]{8}$/;
    if (this.userUpdates.cellphone && !cellphoneRegex.test(this.userUpdates.cellphone)) {
      this.objErrorMessage.CellphoneError = 'Please enter a valid South African cellphone number.';
      isValid = false;
    }

    return isValid;
  }

  private hasUserDataChanged(): boolean {
    const hasImageChanged = this.selectedImagePreview && 
                           this.selectedImagePreview !== this.userInfo?.profileImageBase64;
    
    const hasDataChanged = (
      this.userUpdates.firstName !== (this.runner?.user?.firstName || this.currentUser?.firstName) ||
      this.userUpdates.surname !== (this.runner?.user?.surname || this.currentUser?.surname) ||
      this.userUpdates.cellphone !== (this.runner?.user?.cellphone || this.currentUser?.cellphone)
    );
    
    console.log('User data change check:', {
      hasImageChanged,
      hasDataChanged,
      selectedImagePreview: this.selectedImagePreview ? 'Present' : 'None',
      originalImage: this.userInfo?.profileImageBase64 ? 'Present' : 'None'
    });
    
    return hasDataChanged || !!hasImageChanged;
  }

  private hasRunnerDataChanged(): boolean {
    return (
      this.runnerUpdates.nationality !== this.originalRunner.nationality ||
      this.runnerUpdates.countryOfResidence !== this.originalRunner.countryOfResidence ||
      this.runnerUpdates.shoeSize !== this.originalRunner.shoeSize ||
      this.runnerUpdates.clothingSize !== this.originalRunner.clothingSize ||
      this.runnerUpdates.allergies !== this.originalRunner.allergies ||
      this.runnerUpdates.medicalHistory !== this.originalRunner.medicalHistory
    );
  }

  private hideMessageAfterDelay(type: 'success' | 'error'): void {
    setTimeout(() => {
      if (type === 'success') {
        this.showSuccessMessage = false;
      } else {
        this.showErrorMessage = false;
      }
    }, 3000);
  }

  onCancel(): void {
    this.router.navigate(['/runner-milestone']);
  }

  changePassword(): void {
    this.router.navigate(['/update-password']);
  }
}

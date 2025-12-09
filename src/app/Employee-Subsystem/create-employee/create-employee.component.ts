import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Iemployee } from '../../Interfaces/iemployee';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../API-Services/employee.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { NotificationService } from '../../API-Services/notification.service';
import { NotificationModalComponent } from '../../Notification/notification.component';

// Define the error response interface
interface ApiErrorResponse {
  message: string;
  errors?: { [key: string]: string[] };
}

@Component({
  selector: 'app-create-employee',
  standalone: true,
  imports: [
    FormsModule, 
    CommonModule, 
    MatSnackBarModule, 
    RouterModule,
    NavBarAdminComponent,
    NotificationModalComponent
  ],
  templateUrl: './create-employee.component.html',
  styleUrls: ['./create-employee.component.css']
})
export class CreateEmployeeComponent {
  newEmployee: Iemployee = {
    employeeId: 0,
    firstName: '',
    lastName: '',
    cellPhone: '',
    email: '',
    employeeImage: '',
    userId: JSON.parse(sessionStorage.getItem('adminData')!).userId,
  };

  selectedFile: File | null = null;
  selectedFileName: string = '';

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private snackBar: MatSnackBar,
    private notificationService: NotificationService
  ) {}
 ownerId = JSON.parse(sessionStorage.getItem('adminData')!).userId;
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.selectedFileName = this.selectedFile.name;

      // Validate file size (5MB limit)
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      if (this.selectedFile.size > maxSizeInBytes) {
        this.snackBar.open('⚠️ File size must be less than 5MB', 'Close', {
          duration: 3000,
          panelClass: ['warn-snackbar']
        });
        this.selectedFile = null;
        this.selectedFileName = '';
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(this.selectedFile.type)) {
        this.snackBar.open('⚠️ Please select a valid image file (JPG, PNG, GIF)', 'Close', {
          duration: 3000,
          panelClass: ['warn-snackbar']
        });
        this.selectedFile = null;
        this.selectedFileName = '';
        return;
      }

      // Preview only (base64)
      const reader = new FileReader();
      reader.onload = () => {
        this.newEmployee.employeeImage = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  saveEmployee(): void {
    const { firstName, lastName, email, cellPhone } = this.newEmployee;

    // Validate all required fields and formats
    if (!firstName || firstName.trim().length < 2) {
      this.notificationService.showWarning('Validation Error', 'First name must be at least 2 characters long.');
      return;
    }

    if (!lastName || lastName.trim().length < 2) {
      this.notificationService.showWarning('Validation Error', 'Last name must be at least 2 characters long.');
      return;
    }

    if (!email || !this.isValidEmail(email)) {
      this.notificationService.showWarning('Validation Error', 'Please enter a valid email address.');
      return;
    }

    if (!cellPhone || !this.isValidCellPhone(cellPhone)) {
      this.notificationService.showWarning('Validation Error', 'Cell phone must be 1-20 digits.');
      return;
    }

    const formData = new FormData();
    formData.append('FirstName', firstName.trim());
    formData.append('LastName', lastName.trim());
    formData.append('Email', email.trim().toLowerCase());
    formData.append('CellPhone', cellPhone.trim());
    if (this.newEmployee.userId !== undefined && this.newEmployee.userId !== null) {
      formData.append('UserId', String(this.newEmployee.userId));
    }
    // Only append the image file if one was selected
    if (this.selectedFile) {
      formData.append('EmployeeImageFile', this.selectedFile, this.selectedFile.name);
    }

    // Show loading state
    const createButton = document.querySelector('.btn-primary') as HTMLButtonElement;
    if (createButton) {
      createButton.classList.add('loading');
      createButton.disabled = true;
    }

    this.employeeService.create(formData,this.ownerId).subscribe({
      next: (response: Iemployee) => {
        this.newEmployee = response;
        this.notificationService.showSuccess('Success', 'Employee created successfully');
        
        // Add success animation to form
        const formGroups = document.querySelectorAll('.form-group');
        formGroups.forEach(group => group.classList.add('success'));

        setTimeout(() => {
          this.router.navigate(['/employees']);
        }, 1000);
      },
      error: (err) => {
        console.error('Error creating employee:', err);
        let errorMessage = 'Failed to create employee';
        
        const errorResponse = err.error as ApiErrorResponse;
        if (errorResponse?.errors) {
          console.log('Validation errors:', errorResponse.errors);
          errorMessage = Object.entries(errorResponse.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('; ');
        } else if (errorResponse?.message) {
          errorMessage = errorResponse.message;
        }
        
        this.notificationService.showError('Error', errorMessage);
      },
      complete: () => {
        // Remove loading state
        const createButton = document.querySelector('.btn-primary') as HTMLButtonElement;
        if (createButton) {
          createButton.classList.remove('loading');
          createButton.disabled = false;
        }
      }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }

  private isValidCellPhone(phone: string): boolean {
    const phonePattern = /^[0-9]{1,20}$/;
    return phonePattern.test(phone);
  }

  getImageUrl(imageName: string | null): string {
    if (!imageName?.trim()) {
      return 'assets/Images/default-avatar.png';
    }
    if (imageName.startsWith('data:image')) {
      return imageName; // Base64 preview
    }
    // Remove any leading slashes and construct the full URL
    const cleanImageName = imageName.replace(/^\/+/, '');
    return `https://localhost:7158/${cleanImageName}`;
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.onerror = null; // Prevent infinite loop
    target.src = 'assets/Images/default-avatar.png';
  }

  cancel(): void {
    // Add confirmation dialog for unsaved changes
    const hasChanges = this.newEmployee.firstName || this.newEmployee.lastName || 
                      this.newEmployee.email || this.newEmployee.cellPhone || 
                      this.selectedFile;
    
    if (hasChanges) {
      this.notificationService.showWarning(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave?',
        'Leave',
        'Stay'
      );

      // Subscribe to confirmation result
      const confirmationSub = this.notificationService.confirmation$.subscribe(confirmed => {
        if (confirmed) {
          this.router.navigate(['/employees']);
        }
        confirmationSub.unsubscribe(); // Clean up subscription
      });
    } else {
      this.router.navigate(['/employees']);
    }
  }

  // Navigation methods (keeping existing functionality)
  navigateToEmployees() { this.router.navigate(['/employees']); }
  navigateToProducts() { this.router.navigate(['/products']); }
  navigateToRunner() { this.router.navigate(['/runners']); }
  navigateToUser() { this.router.navigate(['/viewUsers']); }
  navigateToDonation() { this.router.navigate(['/donations']); }
  navigateToInventory() { this.router.navigate(['/inventory']); }

  logout() {
    localStorage.removeItem('currentUserLoggedIn');
    this.router.navigate(['/home']);
  }
}
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExpenditureService } from '../../API-Services/expenditure.service';
import { Iexpenditure } from '../../Interfaces/iexpenditure';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { NotificationService } from '../../API-Services/notification.service';
import { NotificationModalComponent } from '../../Notification/notification.component';

@Component({
  selector: 'app-create-expenditure',
  standalone: true,
  templateUrl: './create-expenditure.component.html',
  styleUrls: ['./create-expenditure.component.css'],
  imports: [FormsModule, CommonModule, NavBarAdminComponent, NotificationModalComponent]
})
export class CreateExpenditureComponent {
  expenditure: Iexpenditure = {
    expenditureId: 0,
    purpose: '',
    description: '',
    amount: 0,
    dateOfCreation: new Date().toISOString().split('T')[0], // Default to today
    receiptImage: ''
  };

  today: string = new Date().toISOString().split('T')[0];
  isLoading: boolean = false;
  private adminData: any;

  constructor(
    private router: Router, 
    private expenditureService: ExpenditureService,
    private notificationService: NotificationService
  ) {
    // Move admin data initialization to constructor
    const adminDataString = sessionStorage.getItem('adminData');
    if (adminDataString) {
      this.adminData = JSON.parse(adminDataString);
    } else {
      this.notificationService.showError(
        'Authentication Error',
        'Admin data not found. Please log in again.'
      );
      this.router.navigate(['/signIn']);
    }
  }

  // Role-based access control methods
  canModifyData(): boolean {
    return true; // All admins can create/edit/delete expenditures
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        this.notificationService.showError(
          'Invalid File Type',
          'Please upload a valid file (JPEG, PNG, or PDF).'
        );
        input.value = '';
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        this.notificationService.showError(
          'File Too Large',
          'File size must be less than 5MB.'
        );
        input.value = '';
        return;
      }

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        this.expenditure.receiptImage = e.target?.result as string;
      };
      reader.onerror = () => {
        this.notificationService.showError(
          'File Read Error',
          'Error reading file. Please try again.'
        );
      };
      reader.readAsDataURL(file);
    }
  }

  removeReceipt(): void {
    this.expenditure.receiptImage = '';
    const fileInput = document.getElementById('receipt') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  isImage(): boolean {
    return this.expenditure.receiptImage ? this.expenditure.receiptImage.startsWith('data:image/') : false;
  }

  isPDF(): boolean {
    return this.expenditure.receiptImage ? this.expenditure.receiptImage.startsWith('data:application/pdf') : false;
  }

  downloadPDF(): void {
    if (this.isPDF() && this.expenditure.receiptImage) {
      const link = document.createElement('a');
      link.href = this.expenditure.receiptImage;
      link.download = 'receipt.pdf';
      link.click();
    }
  }

  validatePurpose(): void {
    // This method triggers when user types in purpose field
    // Validation styling will be applied automatically through the template
  }

  validateDescription(): void {
    // This method triggers when user types in description field  
    // Validation styling will be applied automatically through the template
  }

  onSubmit(): void {
    // Check for validation errors including character limits
    if (!this.expenditure.purpose || !this.expenditure.description || this.expenditure.amount <= 0 || !this.expenditure.dateOfCreation) {
      this.notificationService.showError(
        'Validation Error',
        'Please fill all required fields correctly.'
      );
      return;
    }

    if (this.expenditure.purpose.length > 50) {
      this.notificationService.showError(
        'Purpose Too Long',
        'Purpose must not exceed 50 characters.'
      );
      return;
    }

    if (this.expenditure.description.length > 200) {
      this.notificationService.showError(
        'Description Too Long',
        'Description must not exceed 200 characters.'
      );
      return;
    }

    this.isLoading = true; // Start loading

    this.expenditureService.CreateExpenditure(this.expenditure, this.adminData.userId).subscribe({
      next: (response) => {
        this.isLoading = false; // Stop loading
        this.notificationService.showSuccess(
          'Success!',
          'Expenditure created successfully!'
        );
        setTimeout(() => {
          this.router.navigate(['/expenditure-home']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false; // Stop loading on error
        console.error('Failed to create expenditure:', err);
        this.notificationService.showError(
          'Creation Failed',
          'Failed to create expenditure: ' + err.message
        );
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/expenditure-home']);
  }
}

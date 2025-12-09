import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ExpenditureService } from '../../../API-Services/expenditure.service';
import { Iexpenditure } from '../../../Interfaces/iexpenditure';
import { NavBarAdminComponent } from '../../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { NotificationService } from '../../../API-Services/notification.service';
import { NotificationModalComponent } from '../../../Notification/notification.component';

@Component({
  selector: 'app-edit-expenditure',
  standalone: true,
  templateUrl: './edit-expenditure.component.html',
  styleUrls: ['./edit-expenditure.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavBarAdminComponent, NotificationModalComponent]
})
export class EditExpenditureComponent implements OnInit {
  expenditureForm: FormGroup;
  expenditureId: number = 0;
  currentReceiptImage: string = '';
  today: string = new Date().toISOString().split('T')[0];
  private isSubmitting = false;
   userId:any= JSON.parse(sessionStorage.getItem('adminData') || '{}').userId;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private expenditureService: ExpenditureService,
    private notificationService: NotificationService
  ) {
    this.expenditureForm = this.fb.group({
      Purpose: ['', [Validators.required, Validators.maxLength(50)]],
      Description: ['', [Validators.required, Validators.maxLength(200)]],
      Amount: ['', [Validators.required, Validators.min(0.01)]],
      DateOfCreation: ['', Validators.required],
      ReceiptImage: ['']
    });

    // Add real-time validation for purpose and description
    this.expenditureForm.get('Purpose')?.valueChanges.subscribe(() => {
      this.expenditureForm.get('Purpose')?.markAsTouched();
    });

    this.expenditureForm.get('Description')?.valueChanges.subscribe(() => {
      this.expenditureForm.get('Description')?.markAsTouched();
    });

    this.expenditureForm.get('Amount')?.valueChanges.subscribe(() => {
      this.expenditureForm.get('Amount')?.markAsTouched();
    });

  }

  // Role-based access control methods
  canModifyData(): boolean {
    return true; // All admins can edit expenditures
  }

  ngOnInit(): void {
    const data = localStorage.getItem('expenditureToEdit');
    if (data) {
      const expenditure: Iexpenditure = JSON.parse(data);
      this.expenditureId = expenditure.expenditureId;
      this.currentReceiptImage = expenditure.receiptImage || '';

      this.expenditureForm.patchValue({
        Purpose: expenditure.purpose,
        Description: expenditure.description,
        Amount: expenditure.amount,
        DateOfCreation: expenditure.dateOfCreation || new Date().toISOString().split('T')[0],
        ReceiptImage: expenditure.receiptImage || ''
      });
    } else {
      // Fallback if no data found
      this.notificationService.showError(
        'Data Not Found',
        'No expenditure data found. Redirecting to expenditure list.'
      );
      this.router.navigate(['/expenditure-home']);
    }
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
        const base64Result = e.target?.result as string;
        this.currentReceiptImage = base64Result;
        this.expenditureForm.patchValue({ ReceiptImage: base64Result });
        console.log('File converted to base64');
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
    this.expenditureForm.patchValue({ ReceiptImage: '' });
    this.currentReceiptImage = '';
    const fileInput = document.getElementById('receipt') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  isImage(): boolean {
    return this.currentReceiptImage ? this.currentReceiptImage.startsWith('data:image/') : false;
  }

  isPDF(): boolean {
    return this.currentReceiptImage ? this.currentReceiptImage.startsWith('data:application/pdf') : false;
  }

  downloadPDF(): void {
    if (this.isPDF() && this.currentReceiptImage) {
      const link = document.createElement('a');
      link.href = this.currentReceiptImage;
      link.download = 'receipt.pdf';
      link.click();
    }
  }

  onSave(): void {
    if (this.isSubmitting) {
      return; // Prevent multiple submissions
    }

    if (this.expenditureForm.valid) {
      this.isSubmitting = true;
      const formValue = this.expenditureForm.value;

      const updatedExpenditure: Iexpenditure = {
        expenditureId: this.expenditureId,
        purpose: formValue.Purpose.trim(),
        description: formValue.Description.trim(),
        amount: formValue.Amount,
        dateOfCreation: formValue.DateOfCreation,
        receiptImage: formValue.ReceiptImage || ''
      };

      console.log('Updating expenditure:', updatedExpenditure);

      this.expenditureService.EditExpenditurebyId(this.expenditureId, updatedExpenditure,this.userId).subscribe({
        next: (response) => {
          console.log('Expenditure updated:', response);
          localStorage.removeItem('expenditureToEdit');
          this.notificationService.showSuccess(
            'Success!',
            'Expenditure updated successfully!'
          );
          // Navigate after a short delay to allow user to see the success message
          setTimeout(() => {
            this.router.navigate(['/expenditure-home']);
          }, 2000);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Update failed:', err);
          this.notificationService.showError(
            'Update Failed',
            'Failed to update expenditure: ' + (err.error?.message || err.message)
          );
        }
      });
    } else {
      this.notificationService.showError(
        'Validation Error',
        'Please fill all required fields correctly.'
      );
    }
  }

  onCancel(): void {
    localStorage.removeItem('expenditureToEdit');
    this.router.navigate(['/expenditure-home']);
  }
}

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../API-Services/employee.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { Iemployee } from '../../Interfaces/iemployee';
import { NotificationService } from '../../API-Services/notification.service';
import { NotificationModalComponent } from '../../Notification/notification.component';

// Define the error response interface
interface ApiErrorResponse {
  message: string;
  errors?: { [key: string]: string[] };
}

@Component({
    selector: 'app-update-employee',
    standalone: true,
    imports: [
      ReactiveFormsModule, 
      CommonModule, 
      MatSnackBarModule, 
      NavBarAdminComponent,
      RouterModule,
      NotificationModalComponent
    ],
    templateUrl: './update-employee.component.html',
    styleUrls: ['./update-employee.component.css']
})
export class UpdateEmployeeComponent implements OnInit {
    employeeForm!: FormGroup;
    selectedFile: File | null = null;
    selectedFileName: string = '';
    employeeImagePreview: string = '';
    employeeId!: number;
    employee!: Iemployee;
    originalEmployee!: Iemployee; // Store original data for reset functionality

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private employeeService: EmployeeService,
        private snackBar: MatSnackBar,
        private notificationService: NotificationService
    ) {}

    ngOnInit(): void {
        this.employeeId = Number(this.route.snapshot.paramMap.get('id'));
        this.employeeForm = this.fb.group({
            firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
            lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
            email: ['', [Validators.required, Validators.email, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'), Validators.maxLength(50)]],
            cellPhone: ['', [Validators.required, Validators.pattern('^[0-9]{1,20}$')]],
        });

        this.loadEmployeeData();
    }

    private loadEmployeeData(): void {
        this.employeeService.getById(this.employeeId).subscribe({
            next: (employee: Iemployee) => {
                this.employee = employee;
                this.originalEmployee = { ...employee }; // Store original data
                this.employeeForm.patchValue({
                    firstName: employee.firstName,
                    lastName: employee.lastName,
                    email: employee.email,
                    cellPhone: employee.cellPhone
                });
                // Set the preview to the existing employee image (or default if none)
                this.employeeImagePreview = this.getImageUrl(employee.employeeImage || '');
            },
            error: (error) => {
                console.error('Error loading employee:', error);
                this.snackBar.open('❌ Failed to load employee data', 'Close', {
                    duration: 3000,
                    panelClass: ['error-snackbar']
                });
                this.router.navigate(['/employees']);
            }
        });
    }

    getImageUrl(imageName: string): string {
        if (!imageName?.trim()) {
            return 'assets/Images/default-avatar.png';
        }
        // Remove any leading slashes and construct the full URL
        const cleanImageName = imageName.replace(/^\/+/, '');
        return `https://localhost:7158/${cleanImageName}`;
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            this.selectedFileName = file.name;

            // Validate file size (5MB limit)
            const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSizeInBytes) {
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
            if (!validTypes.includes(file.type)) {
                this.snackBar.open('⚠️ Please select a valid image file (JPG, PNG, GIF)', 'Close', {
                    duration: 3000,
                    panelClass: ['warn-snackbar']
                });
                this.selectedFile = null;
                this.selectedFileName = '';
                return;
            }

            this.selectedFile = file;
            const reader = new FileReader();
            reader.onload = () => {
                this.employeeImagePreview = reader.result as string;
            };
            reader.readAsDataURL(file);
        } else {
            // If no file selected, keep the existing image
            this.selectedFile = null;
            this.selectedFileName = '';
            this.employeeImagePreview = this.getImageUrl(this.employee.employeeImage || '');
        }
    }

    resetImage(): void {
        this.selectedFile = null;
        this.selectedFileName = '';
        this.employeeImagePreview = this.getImageUrl(this.originalEmployee.employeeImage || '');
        // Clear the file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
        this.snackBar.open('📷 Image reset to original', 'Close', {
            duration: 2000,
            panelClass: ['warn-snackbar']
        });
    }

    onSubmit(): void {
        if (this.employeeForm.valid) {
            const formData = new FormData();
            formData.append('FirstName', this.employeeForm.get('firstName')?.value.trim());
            formData.append('LastName', this.employeeForm.get('lastName')?.value.trim());
            formData.append('Email', this.employeeForm.get('email')?.value.trim().toLowerCase());
            formData.append('CellPhone', this.employeeForm.get('cellPhone')?.value.trim());

            // Only append the image file if one was selected
            if (this.selectedFile) {
                formData.append('EmployeeImageFile', this.selectedFile, this.selectedFile.name);
            }

            // Show loading state
            const updateButton = document.querySelector('.btn-primary') as HTMLButtonElement;
            if (updateButton) {
                updateButton.classList.add('loading');
                updateButton.disabled = true;
            }

            this.employeeService.update(this.employeeId, formData).subscribe({
                next: (response: Iemployee) => {
                    this.employee = response;
                    this.snackBar.open('✅ Employee updated successfully', 'Close', {
                        duration: 3000,
                        panelClass: ['success-snackbar']
                    });

                    // Add success animation to form
                    const formGroups = document.querySelectorAll('.form-group');
                    formGroups.forEach(group => group.classList.add('success'));

                    setTimeout(() => {
                        this.router.navigate(['/employees']);
                    }, 1000);
                },
                error: (err) => {
                    console.error('Update failed:', err);
                    let errorMessage = 'Failed to update employee';
                    
                    const errorResponse = err.error as ApiErrorResponse;
                    if (errorResponse?.errors) {
                        console.log('Validation errors:', errorResponse.errors);
                        errorMessage = Object.entries(errorResponse.errors)
                            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                            .join('; ');
                    } else if (errorResponse?.message) {
                        errorMessage = errorResponse.message;
                    }
                    
                    this.snackBar.open(`❌ ${errorMessage}`, 'Close', {
                        duration: 4000,
                        panelClass: ['error-snackbar']
                    });
                },
                complete: () => {
                    // Remove loading state
                    const updateButton = document.querySelector('.btn-primary') as HTMLButtonElement;
                    if (updateButton) {
                        updateButton.classList.remove('loading');
                        updateButton.disabled = false;
                    }
                }
            });
        } else {
            Object.keys(this.employeeForm.controls).forEach(key => {
                this.employeeForm.get(key)?.markAsTouched();
            });
            this.snackBar.open('⚠️ Please fix all validation errors before submitting.', 'Close', {
                duration: 3000,
                panelClass: ['warn-snackbar']
            });
        }
    }

    cancel(): void {
        // Check for unsaved changes
        const hasFormChanges = this.employeeForm.dirty;
        const hasImageChanges = this.selectedFile !== null;
        
        if (hasFormChanges || hasImageChanges) {
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

    handleImageError(event: Event): void {
        const target = event.target as HTMLImageElement;
        target.onerror = null; // Prevent infinite loop
        target.src = 'assets/Images/default-avatar.png';
    }
}
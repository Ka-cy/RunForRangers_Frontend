import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { Irunner } from '../../Interfaces/irunner';
import { Country } from '../../Interfaces/icountry';
import { RunnerService, Runner } from '../../API-Services/runner.service';
import { CountryService } from '../../API-Services/country.service';
import { HttpErrorResponse } from '@angular/common/http';
import { NavBarDefaultComponent } from '../../nav-bar-default/nav-bar-default.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-update-runner',
  templateUrl: './update-runner.component.html',
  styleUrls: ['./update-runner.component.css'],
  standalone: true,
  imports: [FormsModule, NgSelectModule, CommonModule, NavBarDefaultComponent]
})
export class UpdateRunnerComponent implements OnInit {
  runner: Irunner & { user?: { firstName: string; surname: string } } = {
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
  countries: Country[] = [];
  selectedFile: File | null = null;
  selectedImagePreview: string | null = null;
  errorMessages: { [key: string]: string } = {};
  isSubmitted: boolean = false;
  isLoading: boolean = false;
  userInfoLoading: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private runnerService: RunnerService,
    private countryService: CountryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const userId = +this.route.snapshot.paramMap.get('id')!;
    if (userId) {
      this.fetchRunnerDetails(userId);
      this.fetchCountries();
    } else {
      this.errorMessages['general'] = 'Invalid runner ID.';
      this.router.navigate(['/runners']);
    }
  }

  fetchRunnerDetails(userId: number): void {
    this.isLoading = true;
    this.userInfoLoading = true;
    this.runnerService.getRunnerById(userId).subscribe({
      next: (res: Runner) => {
        this.runner = {
          userId: res.userId,
          countryOfResidence: res.countryOfResidence,
          nationality: res.nationality,
          allergies: res.allergies || '',
          shoeSize: res.shoeSize || '',
          medicalHistory: res.medicalHistory || '',
          clothingSize: res.clothingSize || '',
          runnerImage: res.runnerImage || '',
          idNumber: res.idNumber || '',
          user: res.user ? { firstName: res.user.firstName, surname: res.user.surname } : undefined
        };
        if (res.runnerImage) {
          this.selectedImagePreview = res.runnerImage;
        }
        this.isLoading = false;
        this.userInfoLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessages['general'] = err.error?.Message || 'Failed to load runner information.';
        this.snackBar.open(`❌ ${this.errorMessages['general']}`, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
        this.userInfoLoading = false;
      }
    });
  }

  fetchCountries(): void {
    this.countryService.getAllCountries().subscribe({
      next: (res) => (this.countries = res),
      error: (err: HttpErrorResponse) => {
        this.errorMessages['general'] = 'Failed to load countries. Please ensure the server is running.';
        this.snackBar.open(`❌ ${this.errorMessages['general']}`, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.countries = [];
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessages['ProfileImage'] = 'Only JPG, PNG, or GIF files are allowed';
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
        reader.onload = (e: any) => (this.selectedImagePreview = e.target.result);
        reader.readAsDataURL(file);
      }
    }
  }

  triggerFileInput(): void {
    (document.getElementById('runnerImage') as HTMLInputElement).click();
  }

  removeImage(): void {
    this.selectedFile = null;
    this.selectedImagePreview = null;
    const fileInput = document.getElementById('runnerImage') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    this.errorMessages['ProfileImage'] = 'RunnerImage is required';
  }

  validateInputs(): boolean {
    let isValid = true;
    this.errorMessages = {};

    if (!this.runner.countryOfResidence) {
      this.errorMessages['CountryOfResidence'] = 'Country of Residence is required';
      isValid = false;
    }
    if (!this.runner.nationality) {
      this.errorMessages['Nationality'] = 'Nationality is required';
      isValid = false;
    }
    if (this.runner.shoeSize && !/^\d+$/.test(this.runner.shoeSize)) {
      this.errorMessages['ShoeSize'] = 'Shoe Size must be a number';
      isValid = false;
    }
    if (this.runner.clothingSize && !/^(S|M|L|XL|XXL)$/.test(this.runner.clothingSize)) {
      this.errorMessages['ClothingSize'] = 'Clothing Size must be S, M, L, XL, or XXL';
      isValid = false;
    }
    if (!this.runner.idNumber || !/^\d{13}$/.test(this.runner.idNumber)) {
      this.errorMessages['IDNumber'] = 'ID Number must be a 13-digit number';
      isValid = false;
    }
    if (!this.selectedFile && !this.runner.runnerImage) {
      this.errorMessages['ProfileImage'] = 'RunnerImage is required';
      isValid = false;
    }
    return isValid;
  }

  saveRunner(): void {
    this.isSubmitted = true;
    if (!this.validateInputs()) return;

    this.isLoading = true;
    this.runnerService.updateRunner(this.runner.userId, this.runner, this.selectedFile).subscribe({
      next: () => {
        this.snackBar.open('✅ Runner updated successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/runner-page']);
      },
      error: (err: HttpErrorResponse) => {
        if (err.error && err.error.errors) {
          this.errorMessages['general'] = Object.values(err.error.errors).flat().join(' ');
        } else {
          this.errorMessages['general'] = err.error?.Message || 'Something went wrong. Please try again.';
        }
        this.snackBar.open(`❌ ${this.errorMessages['general']}`, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      },
      complete: () => (this.isLoading = false)
    });
  }

  cancel(): void {
    this.router.navigate(['/runner-page']);
  }

  getInputClass(field: keyof Irunner | 'ProfileImage'): string {
    return this.isSubmitted && this.errorMessages[field] ? 'error-input' : '';
  }

  getLabelClass(field: keyof Irunner | 'ProfileImage'): string {
    return this.isSubmitted && this.errorMessages[field] ? 'error-label' : '';
  }
}

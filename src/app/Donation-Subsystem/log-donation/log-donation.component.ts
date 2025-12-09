import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DonationService, Donation } from '../../API-Services/donation.service';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';

// DTO interface to match the backend CreateDonationDto
export interface CreateDonationDto {
  type: string;
  amount: number;
  donorName: string;
  loggedByAdminId: number;
  userId?: number;
}

interface Runner {
  userId: number;
  user: {
    firstName: string;
    surname: string;
  };
}

@Component({
  selector: 'app-log-donation',
  standalone: true,
  imports: [CommonModule, FormsModule, NavBarAdminComponent],
  templateUrl: './log-donation.component.html',
  styleUrls: ['./log-donation.component.css']
})
export class LogDonationComponent implements OnInit {
  // Using the DTO structure for the form
  donation: CreateDonationDto = {
    type: 'Runner',
    amount: 0,
    donorName: '',
    loggedByAdminId: 0,
    userId: undefined
  };

  donationTypes = ['Runner', 'Organisation'];
  selectedType: string = this.donation.type;
  runners: { userId: number, firstName: string, surname: string }[] = [];
  selectedRunnerId: number | null = null;
  currentAdminId: number = 0;
  private apiUrl = 'https://localhost:7158/api/Runner/GetAllRunners';

  constructor(
    private donationService: DonationService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentAdmin();
    this.loadRunners();
  }

  /**
   * Load the currently logged-in admin from session storage
   */
  loadCurrentAdmin(): void {
    try {
      const adminData = sessionStorage.getItem('adminData');
      console.log('Raw session data:', adminData);

      if (adminData) {
        const admin = JSON.parse(adminData);
        console.log('Parsed admin data:', admin);

        this.currentAdminId = admin.userId || admin.id || 0;
        this.donation.loggedByAdminId = this.currentAdminId;

        console.log('Set admin ID to:', this.currentAdminId);

        if (this.currentAdminId === 0) {
          console.warn('Admin ID not found in session storage');
          alert('Unable to identify current admin. Please log in again.');
          this.router.navigate(['/login']);
          return;
        }
      } else {
        console.warn('No admin data found in session storage');
        alert('Please log in to continue.');
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Error parsing admin data from session storage:', error);
      alert('Session data corrupted. Please log in again.');
      this.router.navigate(['/login']);
    }
  }

  /**
   * Load available runners for Runner donation type
   */
  loadRunners(): void {
    this.http.get<Runner[]>(this.apiUrl)
      .subscribe({
        next: (runners: Runner[]) => {
          this.runners = runners.map((r: Runner) => ({
            userId: r.userId,
            firstName: r.user.firstName ?? '',
            surname: r.user.surname ?? ''
          }));
          if (this.runners.length === 0) {
            console.warn('No runners found.');
          }
        },
        error: (error: Error) => {
          console.error('Error loading runners:', error);
          alert('Failed to load runners. Please try again.');
        }
      });
  }
  /**
   * Handle donation type selection
   */
  selectDonationType(type: string): void {
    this.selectedType = type;
    this.donation.type = type;

    if (type === 'Organisation') {
      // For organisation donations, userId will be set to 1 by the backend
      this.donation.userId = undefined;
      this.selectedRunnerId = null;
    } else {
      // For runner donations, userId should be set to the selected runner
      this.donation.userId = this.selectedRunnerId ?? undefined;
    }
  }

  /**
   * Handle runner selection for Runner donation type
   */
  onRunnerSelect(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedRunnerId = selectElement.value ? +selectElement.value : null;
    this.donation.userId = this.selectedRunnerId ?? undefined;
  }

  /**
   * Validate and submit the donation
   */
  onSubmit(): void {
    // Validate donation amount
    if (!this.donation.amount || this.donation.amount <= 0) {
      alert('Please enter a valid donation amount greater than 0.');
      return;
    }

    // Validate donation type
    if (!this.donation.type) {
      alert('Please select a donation type.');
      return;
    }

    // Validate donor name
    if (!this.donation.donorName || this.donation.donorName.trim().length === 0) {
      alert('Please enter a donor name.');
      return;
    }

    if (this.donation.donorName.length > 100) {
      alert('Donor name cannot exceed 100 characters.');
      return;
    }

    // Validate runner selection for Runner donations
    if (this.donation.type === 'Runner' && !this.donation.userId) {
      alert('Please select a runner for Runner donation.');
      return;
    }

    // Validate admin ID
    if (!this.donation.loggedByAdminId || this.donation.loggedByAdminId === 0) {
      alert('Admin session expired. Please log in again.');
      this.router.navigate(['/login']);
      return;
    }

    // Cleans up donation object before sending
    const donationToSubmit: CreateDonationDto = {
      type: this.donation.type,
      amount: this.donation.amount,
      donorName: this.donation.donorName.trim(),
      loggedByAdminId: this.donation.loggedByAdminId,
      userId: this.donation.type === 'Organisation' ? undefined : this.donation.userId
    };

    console.log('Submitting donation:', donationToSubmit);

  
    this.donationService.createDonation(donationToSubmit).subscribe({
      next: (response) => {
        console.log('Donation created successfully:', response);
        alert('Donation saved successfully!');
        this.router.navigate(['/donations']);
      },
      error: (err) => {
        console.error('Error creating donation:', err);
        let errorMessage = 'Failed to save donation.';

        if (err.error?.errors) {
          // Handle validation errors
          const errors = Object.values(err.error.errors).flat();
          errorMessage += ' ' + errors.join(' ');
        } else if (err.error?.error) {
          errorMessage += ' ' + err.error.error;
        } else if (err.message) {
          errorMessage += ' ' + err.message;
        }

        alert(errorMessage);
      }
    });
  }

  /**
   * Cancel and navigate back to donations list
   */
  cancel(): void {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      this.router.navigate(['/donations']);
    }
  }

  /**
   * Reset the form to initial state
   */
  resetForm(): void {
    this.donation = {
      type: 'Runner',
      amount: 0,
      donorName: '',
      loggedByAdminId: this.currentAdminId,
      userId: undefined
    };
    this.selectedType = 'Runner';
    this.selectedRunnerId = null;
  }
}

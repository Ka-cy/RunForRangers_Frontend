import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { DonationService, Donation, UpdateDonationDto } from '../../API-Services/donation.service';
import { HttpClient } from '@angular/common/http';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';

@Component({
  selector: 'app-edit-donation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    NavBarAdminComponent
  ],
  templateUrl: './edit-donation.component.html',
  styleUrls: ['./edit-donation.component.css']
})
export class EditDonationComponent implements OnInit {
  donation: Partial<Donation> = {
    type: 'Runner',
    amount: 0,
    date: new Date(),
    userId: undefined
  };
  donationTypes = ['Runner', 'Organisation'];
  donationId: number | null = null;
  selectedType: string = this.donation.type || 'Runner';
  runners: { userId: number, firstName: string, surname: string }[] = [];
  selectedRunnerId: number | null = null;
  private apiUrl = 'https://localhost:7158/api/Runner/GetRunners';

  constructor(
    private donationService: DonationService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadRunners();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.donationId = +id;
        this.donationService.getDonation(this.donationId).subscribe({
          next: (donation: Donation) => {
            this.donation = { ...donation, date: new Date(donation.date) };
            this.selectedType = donation.type;
            this.selectedRunnerId = donation.userId ?? null;
          },
          error: () => {
            alert('Donation not found');
            this.router.navigate(['/donations']);
          }
        });
      }
    });
  }

  loadRunners(): void {
    this.http.get<{ userId: number, firstName: string, surname: string }[]>(this.apiUrl)
      .subscribe({
        next: (runners) => {
          this.runners = runners;
          if (runners.length === 0) {
            console.warn('No runners found.');
          }
        },
        error: (error) => {
          console.error('Error loading runners:', error);
          alert('Failed to load runners.');
        }
      });
  }

  selectDonationType(type: string): void {
    this.selectedType = type;
    this.donation.type = type;
    if (type === 'Organisation') {
      this.donation.userId = undefined;
      this.selectedRunnerId = null;
    } else {
      this.donation.userId = this.selectedRunnerId ?? undefined;
    }
  }

  onRunnerSelect(event: MatSelectChange): void {
    this.selectedRunnerId = event.value ? +event.value : null;
    this.donation.userId = this.selectedRunnerId ?? undefined;
  }

  onSubmit(): void {
    if (!this.donation.amount || this.donation.amount <= 0) {
      alert('Please enter a valid donation amount.');
      return;
    }

    if (!this.donation.type) {
      alert('Please select a donation type.');
      return;
    }

    if (this.donation.type === 'Runner' && !this.donation.userId) {
      alert('Please select a runner for Runner donation.');
      return;
    }

    if (this.donationId === null) {
      alert('Invalid donation ID.');
      return;
    }

    // Construct UpdateDonationDto
    const donationDto: UpdateDonationDto = {
      donationID: this.donationId,
      type: this.donation.type,
      amount: this.donation.amount,
      donorName: this.donation.donorName || 'Anonymous', // Fallback if undefined
      loggedByAdminId: this.donation.loggedByAdminId || 1, // Default admin ID fallback
      userId: this.donation.userId
    };

    this.donationService.updateDonation(this.donationId, donationDto).subscribe({
      next: () => {
        alert('Donation updated successfully!');
        this.router.navigate(['/donations']);
      },
      error: () => {
        alert('Failed to update donation.');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/donations']);
  }
}

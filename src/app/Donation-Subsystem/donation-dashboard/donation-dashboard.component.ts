import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DonationService, Donation } from '../../API-Services/donation.service';
import { RouterLink } from '@angular/router';
import { NavBarAdminComponent } from "../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component";
import { HelpButtonComponent } from "../../Admin-Subsystem/help-button/help-button/help-button.component";

@Component({
  selector: 'app-donation-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, NavBarAdminComponent, HelpButtonComponent],
  templateUrl: './donation-dashboard.component.html',
  styleUrls: ['./donation-dashboard.component.css']
})
export class DonationDashboardComponent implements OnInit {
  donations: Donation[] = [];
  filteredDonations: Donation[] = [];
  currentFilter: string = 'all';
  searchQuery: string = '';

  constructor(private donationService: DonationService, private router: Router) {}

  ngOnInit(): void {
    this.loadDonations();
  }

  loadDonations(): void {
    this.donationService.getAllDonations().subscribe({
      next: (donations: Donation[]) => {
        this.donations = donations;
        this.applyFiltersAndSearch();
      },
      error: (error) => {
        console.error('Error loading donations:', error);
        alert('Failed to load donations.');
      }
    });
  }

  filterDonations(filterType: string): void {
    this.currentFilter = filterType.toLowerCase();
    this.applyFiltersAndSearch();
  }

  searchDonations(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.applyFiltersAndSearch();
  }

  private applyFiltersAndSearch(): void {
    let result = [...this.donations];

    // Apply type filter
    if (this.currentFilter !== 'all') {
      result = result.filter(donation => donation.type.toLowerCase() === this.currentFilter);
    }

    // Apply search filter if query exists
    if (this.searchQuery) {
      result = result.filter(donation =>
        (donation.donorName?.toLowerCase().includes(this.searchQuery) || // Changed from user properties
        donation.donationID.toString().includes(this.searchQuery))
      );
    }

    this.filteredDonations = result;
  }

  editDonation(donationId: number): void {
    this.router.navigate(['/edit-donation', donationId]);
  }
 //Fix here if something goes wrong
 ownerId: any = JSON.parse(sessionStorage.getItem('adminData')!)


  deleteDonation(donationId: number): void {
    if (confirm('Are you sure you want to delete this donation?')) {
     this.donationService.deleteDonation(donationId, this.ownerId.userId).subscribe({
        next: () => {
          this.loadDonations();
          alert('Donation deleted successfully');
           console.log(this.ownerId.userId);
        },
        error: () => {
          alert('Failed to delete donation');
        }
      });
    }
  }

  navigateToUpload() {
  this.router.navigate(['/file-upload']);
}

  logDonation(): void {
    this.router.navigate(['/log-donation']);
  }
}

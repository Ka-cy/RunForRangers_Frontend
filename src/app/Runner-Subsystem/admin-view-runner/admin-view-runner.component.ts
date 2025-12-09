import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RunnerService } from '../../API-Services/runner.service';
import { UserService } from '../../API-Services/user.service';
import { CommonModule } from '@angular/common';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';

@Component({
  selector: 'app-admin-view-runner',
  standalone: true,
  imports: [CommonModule, NavBarAdminComponent],
  templateUrl: './admin-view-runner.component.html',
  styleUrls: ['./admin-view-runner.component.css']
})
export class AdminViewRunnerComponent implements OnInit {
  runner: any;
  donations: any[] = [];
  totalDonations: number = 0;
  progress: number = 0;
  milestoneReached: boolean = false;
  isLoading: boolean = true;
  currentMilestone: number = 0;

  radius = 65;
  circumference = 2 * Math.PI * this.radius;

  currentUser: any = null;

  constructor(
    private route: ActivatedRoute,
    private runnerService: RunnerService,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();

    const userId = Number(this.route.snapshot.paramMap.get('id'));
    if (!userId) {
      console.error('Invalid runner ID in route');
      this.isLoading = false;
      return;
    }

    this.runnerService.getCurrentMilestone().subscribe({
      next: (milestone) => {
        this.currentMilestone = milestone?.milestoneNumber || 0;
        console.log('Current milestone:', this.currentMilestone);
      },
      error: (err) => {
        console.error('Error loading milestone:', err);
        this.currentMilestone = 0;
      }
    });

    this.runnerService.getRunnerWithDonations(userId).subscribe({
      next: (data) => {
        console.log('Runner data received:', data);
        this.runner = data.runner;
        this.donations = data.donations || [];
        this.totalDonations = data.totalDonations || 0;
        this.progress = data.progressPercentage || 0;
        this.milestoneReached = data.milestoneReached || false;

        if (!this.runner.targetAmount) {
          this.runner.targetAmount =
            data.targetAmount || this.currentMilestone || 10000;
        }

        console.log('Runner object:', this.runner);
        console.log('Target Amount:', this.runner?.targetAmount);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading runner:', err);
        this.isLoading = false;
      }
    });
  }

  getImageUrl(path: string): string {
    if (!path?.trim()) {
      return 'assets/Images/default-avatar.png';
    }
    return `https://localhost:7158/${path}`;
  }

  handleImageError(event: Event): void {
    if (event.target) {
      const target = event.target as HTMLImageElement;
      target.onerror = null;
      target.src = 'assets/Images/default-avatar.png';
    }
  }

  get progressOffset(): number {
    return this.circumference - (this.progress / 100) * this.circumference;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByDonationId(index: number, donation: any): number {
    return donation.donationID || donation.id || index;
  }

  loadCurrentUser(): void {
    const adminDataString = sessionStorage.getItem('adminData');
    this.currentUser = adminDataString
      ? JSON.parse(adminDataString)
      : {
          firstName: 'Admin',
          surname: 'User',
          role: 'Administrator'
        };

    console.log('Loaded admin data:', this.currentUser);
  }

  getCurrentUserName(): string {
    if (this.currentUser) {
      return `${this.currentUser.firstName || ''} ${
        this.currentUser.surname || ''
      }`.trim();
    }
    return 'Administrator';
  }

  getCurrentUserRole(): string {
    return this.currentUser?.role || 'Administrator';
  }

  getCurrentUserInitials(): string {
    if (this.currentUser) {
      const firstName = this.currentUser.firstName || '';
      const surname = this.currentUser.surname || '';
      return `${firstName.charAt(0)}${surname.charAt(0)}`.toUpperCase();
    }
    return 'AD';
  }

  goBack() {
    this.router.navigate(['/runners']);
  }
}

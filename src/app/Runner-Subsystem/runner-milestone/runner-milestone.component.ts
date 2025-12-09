import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RunnerService } from '../../API-Services/runner.service';
import { DonationService, RunnerSelfDonationDto } from '../../API-Services/donation.service';
import { UserDataService } from '../../API-Services/user-data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavBarDefaultComponent } from "../../nav-bar-default/nav-bar-default.component";
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-runner-milestone',
  standalone: true,
  imports: [CommonModule, FormsModule, NavBarDefaultComponent],
  templateUrl: './runner-milestone.component.html',
  styleUrls: ['./runner-milestone.component.css']
})
export class RunnerMilestoneComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  runner: any;
  donations: any[] = [];
  processedDonations: any[] = [];
  totalDonations: number = 0;
  progressPercentage: number = 0;
  milestoneReached: boolean = false;
  isLoading: boolean = true;
  donationAmount: number = 0;
  isDonating: boolean = false;
  currentMilestone: number = 0;
  private userDataSubscription: Subscription | null = null;

  // For circular progress bar
  radius = 65;
  circumference = 2 * Math.PI * this.radius;

  constructor(
    private route: ActivatedRoute,
    private runnerService: RunnerService,
    private donationService: DonationService,
    private userDataService: UserDataService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = JSON.parse(sessionStorage.getItem('userData') || 'null');
    console.log('Current User:', this.currentUser);

    this.userDataSubscription = this.userDataService.userDataUpdated$.subscribe((userData: any) => {
      console.log('Runner Milestone: Received user data update', userData);
      this.currentUser = userData;
      if (this.runner && this.runner.user) {
        this.runner.user.firstName = userData.firstName || this.runner.user.firstName || 'Unknown';
        this.runner.user.surname = userData.surname || this.runner.user.surname || 'Runner';
        this.runner.user.cellphone = userData.cellphone || this.runner.user.cellphone || '';
        this.runner.user.email = userData.email || this.runner.user.email || '';
        this.processedDonations = this.processDonations(this.donations);
      }
    });

    const userId = this.currentUser?.userId ?? Number(this.route.snapshot.paramMap.get('id'));

    if (!userId || isNaN(userId)) {
      console.error('Invalid runner ID:', userId);
      this.isLoading = false;
      this.snackBar.open('No valid user ID found. Please log in again.', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
      this.router.navigate(['/sign-in']);
      return;
    }

    if (this.currentUser && this.currentUser.roleId && this.currentUser.roleId !== 2) {
      console.error('User is not a runner. Role ID:', this.currentUser.roleId);
      this.isLoading = false;
      this.snackBar.open('Access denied. This page is only available for runners.', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
      this.router.navigate(['/home']);
      return;
    }

    console.log('Loading runner data for user ID:', userId);
    this.loadRunnerData(userId);
  }

  ngOnDestroy(): void {
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
  }

  private processDonations(donations: any[]): any[] {
    return donations.map(donation => ({
      ...donation,
      donorName: this.cleanDonorName(donation),
      formattedDate: this.getDonationDate(donation),
      createdAt: donation.date ? new Date(donation.date) : new Date()
    }));
  }

  private cleanDonorName(donation: any): string {
    if (!donation) return 'Anonymous';

    if (donation.donorName && donation.donorName !== 'undefined' && donation.donorName.trim() !== '') {
      return donation.donorName.replace(/\bundefined\b/g, '').replace(/\s+/g, ' ').trim().toLowerCase() || 'Anonymous';
    }

    if (donation.donorFirstName || donation.donorLastName) {
      return `${donation.donorFirstName || ''} ${donation.donorLastName || ''}`.trim().toLowerCase() || 'Anonymous';
    }

    if (donation.user) {
      return `${donation.user.firstName || ''} ${donation.user.surname || donation.user.lastName || 'Runner'}`.trim().toLowerCase() || 'Anonymous';
    }

    return 'Anonymous';
  }

  loadRunnerData(userId: number): void {
    console.log('Starting to load runner data for userId:', userId);
    this.isLoading = true;

    this.runnerService.getCurrentMilestone(userId).subscribe({
      next: (milestone) => {
        this.currentMilestone = milestone?.milestoneNumber || 10000;
        console.log('Current milestone for userId:', userId, this.currentMilestone);
      },
      error: (err) => {
        console.error('Error loading milestone:', err);
        this.currentMilestone = 10000;
        console.log('Using default milestone value:', this.currentMilestone);
      }
    });

    this.runnerService.getRunnerWithDonations(userId).subscribe({
      next: (data) => {
        console.log('✅ Runner data with donations:', data);
        this.runner = data.runner;
        if (this.currentUser && this.runner?.user) {
          this.runner.user.firstName = this.currentUser.firstName || this.runner.user.firstName || 'Unknown';
          this.runner.user.surname = this.currentUser.surname || this.runner.user.surname || 'Runner';
          this.runner.user.cellphone = this.currentUser.cellphone || this.runner.user.cellphone || '';
          this.runner.user.email = this.currentUser.email || this.runner.user.email || '';
        }
        this.donations = data.donations || [];
        this.processedDonations = this.processDonations(this.donations);
        this.totalDonations = data.totalDonations || this.processedDonations.reduce((sum, d) => sum + (d.amount || 0), 0);

        // Use backend-provided progressPercentage if available, otherwise calculate locally
        const targetAmount = this.runner?.targetAmount ?? data.targetAmount ?? this.currentMilestone ?? 10000;
        this.runner.targetAmount = targetAmount;
        this.progressPercentage = Number.isFinite(data.progressPercentage) 
          ? Number(data.progressPercentage.toFixed(2))
          : this.totalDonations > 0 && targetAmount > 0 
            ? Number(((this.totalDonations / targetAmount) * 100).toFixed(2))
            : 0;
        this.milestoneReached = data.milestoneReached || this.progressPercentage >= 100;

        console.log('Target Amount Source:', {
          runnerTarget: this.runner?.targetAmount,
          dataTarget: data.targetAmount,
          currentMilestone: this.currentMilestone,
          finalTarget: targetAmount
        });
        console.log('Progress Calculation:', {
          totalDonations: this.totalDonations,
          targetAmount: targetAmount,
          backendProgress: data.progressPercentage,
          finalProgress: this.progressPercentage,
          milestoneReached: this.milestoneReached
        });

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading runner data:', err);
        this.runner = {
          userId: this.currentUser?.userId,
          user: {
            firstName: this.currentUser?.firstName || 'Unknown',
            surname: this.currentUser?.surname || 'Runner',
            email: this.currentUser?.email || '',
            cellphone: this.currentUser?.cellphone || ''
          },
          nationality: 'Not specified',
          countryOfResidence: 'Not specified',
          shoeSize: 'Not specified',
          clothingSize: 'Not specified',
          allergies: 'None reported',
          medicalHistory: 'None reported',
          runnerImage: '',
          targetAmount: this.currentMilestone || 10000
        };
        this.donations = [];
        this.processedDonations = [];
        this.totalDonations = 0;
        this.progressPercentage = 0;
        this.milestoneReached = false;
        this.isLoading = false;
        this.snackBar.open('Failed to load runner data. Using fallback data.', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
      }
    });
  }

  private getDonationDate(donation: any): string {
    const possibleDateFields = [
      donation.donationDate,
      donation.createdAt,
      donation.dateCreated,
      donation.date,
      donation.timestamp
    ];
    for (const dateField of possibleDateFields) {
      if (dateField) return this.formatDate(dateField);
    }
    return 'Date not available';
  }

  setQuickAmount(amount: number): void {
    this.donationAmount = amount;
  }

  async submitSelfDonation(): Promise<void> {
    if (!this.donationAmount || this.donationAmount <= 0) {
      this.snackBar.open('Please enter a valid donation amount.', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
      return;
    }
    if (!this.runner?.userId) {
      console.error('Runner data missing:', this.runner);
      this.snackBar.open('Runner information not found. Please try refreshing the page.', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
      return;
    }
    if (!this.currentUser?.userId) {
      console.error('Current user data missing:', this.currentUser);
      this.snackBar.open('User session not found. Please log in again.', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
      this.router.navigate(['/sign-in']);
      return;
    }

    console.log('Submitting donation:', { userId: this.runner.userId, amount: this.donationAmount, donorName: `${this.currentUser.firstName} ${this.currentUser.surname}` });
    this.isDonating = true;

    const donationDto: RunnerSelfDonationDto = {
      userId: this.runner.userId,
      amount: this.donationAmount,
      donorName: `${this.currentUser.firstName} ${this.currentUser.surname || ''}`.trim() || 'Anonymous'
    };

    try {
      await this.donationService.createRunnerSelfDonationWithFallback(donationDto).toPromise();
      this.snackBar.open('Thank you for supporting your own cause!', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
      this.donationAmount = 0;
      this.loadRunnerData(this.currentUser.userId);
    } catch (error: any) {
      console.error('Error submitting donation:', error);
      let errorMessage = 'Failed to process donation. Please try again.';
      if (error.error?.errors) errorMessage += ' ' + Object.values(error.error.errors).flat().join(' ');
      else if (error.error?.error) errorMessage += ' ' + error.error.error;
      else if (error.message) errorMessage += ' ' + error.message;
      this.snackBar.open(errorMessage, 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
    } finally {
      this.isDonating = false;
    }
  }

  getInitials(firstName: string | undefined, surname: string | undefined): string {
    const first = (firstName || '').trim();
    const last = (surname || '').trim();
    return (first.charAt(0) + last.charAt(0)).toUpperCase() || 'U';
  }

  getDonorInitials(donorName: string): string {
    if (!donorName) return 'A';
    const names = donorName.split(' ').filter(part => part && part !== 'undefined');
    return names.length >= 2 ? (names[0][0] + names[1][0]).toUpperCase() : names[0]?.[0]?.toUpperCase() || 'A';
  }

  getImageUrl(path: string): string {
    if (this.currentUser?.profileImageBase64 || this.currentUser?.profileImageData || this.currentUser?.profileImage) {
      const image = this.currentUser.profileImageBase64 || this.currentUser.profileImageData || this.currentUser.profileImage;
      return image.startsWith('data:image/') ? image : `data:image/jpeg;base64,${image}`;
    }
    if (this.currentUser?.roleId === 2) {
      const runnerImageFields = [
        this.currentUser?.runnerImage,
        this.currentUser?.RunnerImage,
        this.currentUser?.runnerImageBase64,
        this.currentUser?.RunnerImageBase64
      ];
      for (const imageField of runnerImageFields) {
        if (imageField && imageField !== 'null' && imageField !== '') {
          return imageField.startsWith('data:image/') ? imageField : `data:image/jpeg;base64,${imageField}`;
        }
      }
    }
    return path && path.trim() && path !== 'null' ? `https://localhost:7158/${path}` : 'assets/Images/default-avatar.png';
  }

  hasProfileImage(): boolean {
    return !!(
      (this.currentUser?.profileImageBase64 && this.currentUser.profileImageBase64 !== 'null' && this.currentUser.profileImageBase64 !== '') ||
      (this.currentUser?.profileImageData && this.currentUser.profileImageData !== 'null' && this.currentUser.profileImageData !== '') ||
      (this.currentUser?.profileImage && this.currentUser.profileImage !== 'null' && this.currentUser.profileImage !== '') ||
      (this.currentUser?.roleId === 2 && [
        this.currentUser?.runnerImage,
        this.currentUser?.RunnerImage,
        this.currentUser?.runnerImageBase64,
        this.currentUser?.RunnerImageBase64
      ].some(field => field && field !== 'null' && field !== '')) ||
      (this.runner?.runnerImage && this.runner.runnerImage !== 'null' && this.runner.runnerImage !== '')
    );
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.onerror = null;
    target.style.display = 'none';
    const container = target.parentElement;
    if (container) {
      const avatar = container.querySelector('.default-avatar') as HTMLElement;
      if (avatar) avatar.style.display = 'flex';
    }
  }

  get progressOffset(): number {
    return this.circumference - (this.progressPercentage / 100) * this.circumference;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-ZA', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Date format error';
    }
  }

  getDonorName(donation: any): string {
    return donation.donorName || 'Anonymous';
  }

  trackByDonationId(index: number, donation: any): number {
    return donation.donationID || donation.id || index;
  }

  getProgressColor(): string {
    if (this.progressPercentage >= 100) return '#10b981';
    if (this.progressPercentage >= 50) return '#f59e0b';
    return '#ef4444';
  }

  getCompletionStatus(): string {
    if (this.progressPercentage >= 100) return 'Goal Achieved! 🎉';
    if (this.progressPercentage >= 75) return 'Almost There! 💪';
    if (this.progressPercentage >= 50) return 'Halfway Mark! 🏃‍♂️';
    if (this.progressPercentage >= 25) return 'Good Progress! 👍';
    return 'Just Getting Started! 🌟';
  }

  isUserLoggedIn(): boolean {
    return !!this.currentUser;
  }

  openEditProfile(): void {
    this.router.navigate(['/edit-runner-profile']);
  }

  goBack(): void {
    this.router.navigate(['/runner-page']);
  }

  logout(): void {
    sessionStorage.removeItem('userData');
    this.currentUser = null;
    this.router.navigate(['/home']);
  }

  navigateToRunnerpage(): void {
    this.router.navigate(['/runner-page']);
  }

  navigateToAbout(): void {
    this.router.navigate(['/about']);
  }

  navigateYToHelp(): void {
    this.router.navigate(['/help-section']);
  }

  navigateToShop(): void {
    this.router.navigate(['/shop']);
  }

  navigateToSignIn(): void {
    this.router.navigate(['/signIn']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  navigateToRunnerMilestone(): void {
    this.router.navigate(['/runner-milestone']);
  }
}
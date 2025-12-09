import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RunnerService, Runner } from '../../API-Services/runner.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';

@Component({
  selector: 'app-update-milestone',
  standalone: true,
  imports: [CommonModule, FormsModule, NavBarAdminComponent],
  templateUrl: './update-milestone.component.html',
  styleUrls: ['./update-milestone.component.css']
})
export class UpdateMilestoneComponent implements OnInit {
  milestoneValue: number = 0;
  currentMilestone: number = 0;
  lastUpdatedDate: Date = new Date();
  isLoading = false;

  runners: Runner[] = [];
  selectedRunnerId: number | null = null; // null = global milestone

  constructor(
    private runnerService: RunnerService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentMilestone();
    this.loadAllRunners();
  }

  loadAllRunners() {
    this.runnerService.getAllRunners().subscribe({
      next: (data) => this.runners = data,
      error: (err) => console.error('Failed to load runners', err)
    });
  }

  loadCurrentMilestone() {
    this.isLoading = true;
    this.runnerService.getCurrentMilestone(this.selectedRunnerId ?? undefined).subscribe({
      next: (data) => {
        this.currentMilestone = data?.milestoneNumber || 40000;
        this.lastUpdatedDate = data?.setDate ? new Date(data.setDate) : new Date();
        this.isLoading = false;
      },
      error: () => {
        this.currentMilestone = 40000; // Default fallback
        this.isLoading = false;
      }
    });
  }

  updateMilestone() {
    if (!this.milestoneValue || this.milestoneValue <= 0) {
      this.snackBar.open('Please enter a valid milestone amount', 'Close', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isLoading = true;
    this.runnerService.setMilestone(this.milestoneValue, this.selectedRunnerId ?? undefined).subscribe({
      next: (res) => {
        this.snackBar.open('✅ Milestone updated successfully!', 'Close', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.currentMilestone = res?.milestoneNumber || this.milestoneValue;
        this.lastUpdatedDate = new Date(res?.setDate || new Date());
        this.milestoneValue = 0; // reset form
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('❌ Failed to update milestone', 'Close', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  resetToCurrentMilestone(): void {
    this.milestoneValue = this.currentMilestone;
  }

  onRunnerSelectionChange(): void {
    // Reload current milestone when a different runner or global is selected
    this.loadCurrentMilestone();
  }

  goBack() {
    this.router.navigate(['/runners']);
  }

  getFormattedDate(): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return this.lastUpdatedDate.toLocaleDateString('en-US', options);
  }
}

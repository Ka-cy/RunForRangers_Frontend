import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RunnerService, Runner } from '../../API-Services/runner.service';
import { SystemNotificationService, SystemNotification } from '../../API-Services/system-notification.service';
import { NotificationService } from '../../API-Services/notification.service';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription, of, interval } from 'rxjs';
import { debounceTime, switchMap, tap, catchError, filter } from 'rxjs/operators';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../Employee-Subsystem/confirm-dialog/confirm-dialog.component';
import { RunnerListComponent } from '../runner-list/runner-list.component';
import { NotificationDetailComponent } from '../../notification-detail/notification-detail.component';
import { NotificationModalComponent } from '../../Notification/notification.component';

// Extended Runner interface to include UI-specific properties
export interface ExtendedRunner extends Runner {
  showMedical?: boolean;
}

@Component({
  selector: 'app-runner-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavBarAdminComponent, RunnerListComponent, NotificationModalComponent],
  templateUrl: './runner-dashboard.component.html',
  styleUrls: ['./runner-dashboard.component.css']
})
export class RunnerDashboardComponent implements OnInit, OnDestroy {
  runners: ExtendedRunner[] = [];
  filteredRunners: ExtendedRunner[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  showNotifications: boolean = false;
  showProfileMenu: boolean = false;
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: 'name' | 'progress' | 'nationality' | 'milestone' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  filterBy: 'all' | 'active' | 'inactive' | 'milestone-reached' | 'milestone-pending' = 'all';
  
  systemNotifications: SystemNotification[] = [];
  unreadCount: number = 0;

  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;
  private routerSubscription!: Subscription;
  private notificationSubscription!: Subscription;

  constructor(
    private runnerService: RunnerService,
    private systemNotificationService: SystemNotificationService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadRunners();
    this.refreshNotifications();

    // Reload runners and notifications on route change
    this.routerSubscription = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadRunners();
      this.refreshNotifications();
    });

    // Search debounce
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      tap(() => this.isLoading = true),
      switchMap(term => term.trim() === '' ? this.runnerService.getAllRunners() : this.runnerService.search(term.trim())),
      tap(() => this.isLoading = false),
      catchError(err => {
        console.error('Search failed:', err);
        this.isLoading = false;
        return of([]);
      })
    ).subscribe(results => {
      this.runners = results.map(runner => ({ ...runner, showMedical: false })) as ExtendedRunner[];
      this.applySortAndFilter();
    });

    // Poll notifications every 60s
    this.notificationSubscription = interval(60000).subscribe(() => this.refreshNotifications());
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
    this.notificationSubscription?.unsubscribe();
  }

  /** ---------------------- RUNNERS ---------------------- */
  loadRunners(): void {
    this.isLoading = true;
    this.runnerService.getAllRunners().subscribe({
      next: data => {
        this.runners = data.map(runner => ({ ...runner, showMedical: false })) as ExtendedRunner[];
        this.applySortAndFilter();
        this.isLoading = false;
      },
      error: err => {
        console.error('Error loading runners:', err);
        this.isLoading = false;
        this.notificationService.showError('Error', 'Failed to load runners');
      }
    });
  }

  toggleMedicalInfo(userId: number): void {
    const runner = this.runners.find(r => r.userId === userId);
    if (runner) runner.showMedical = !runner.showMedical;
  }

  viewRunner(userId: number): void {
    this.router.navigate(['/runners/view', userId]);
  }

  deleteRunner(userId: number): void {
    this.notificationService.showWarning(
      'Confirm Deletion',
      'Are you sure you want to delete this runner?',
      'Delete',
      'Cancel'
    );

    // Subscribe to confirmation result
    const confirmationSub = this.notificationService.confirmation$.subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.runnerService.deleteRunner(userId).subscribe({
          next: () => {
            this.runners = this.runners.filter(r => r.userId !== userId);
            this.applySortAndFilter();
            this.notificationService.showSuccess('Success', 'Runner deleted successfully');
            this.isLoading = false;
          },
          error: err => {
            console.error('Delete failed:', err);
            this.notificationService.showError('Error', 'Failed to delete runner');
            this.isLoading = false;
            this.loadRunners();
          }
        });
      }
      confirmationSub.unsubscribe(); // Clean up subscription
    });
  }

  getImageUrl(path: string): string {
    return path?.trim() ? `https://localhost:7158/${path}` : 'assets/Images/default-avatar.png';
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.onerror = null;
    target.src = 'assets/Images/default-avatar.png';
  }

  /** ---------------------- CURRENT USER INFO ---------------------- */
getCurrentUserInitials(): string {
  try {
    const adminRaw = sessionStorage.getItem('adminData');
    if (adminRaw) {
      const a: any = JSON.parse(adminRaw);
      const first = (a.firstName || a.firstname || a.name || '').toString();
      const last = (a.lastName || a.surname || '').toString();
      const initials = ((first[0] || '') + (last[0] || '')).toUpperCase();
      if (initials.trim()) return initials;
    }

    const uRaw = localStorage.getItem('currentUserLoggedIn');
    if (uRaw) {
      const u: any = JSON.parse(uRaw);
      const first = (u.firstName || u.firstname || u.name || '').toString();
      const last = (u.lastName || u.surname || '').toString();
      const initials = ((first[0] || '') + (last[0] || '')).toUpperCase();
      if (initials.trim()) return initials;
    }
  } catch (e) {}
  return 'AD';
}

getCurrentUserName(): string {
  try {
    const adminRaw = sessionStorage.getItem('adminData');
    if (adminRaw) {
      const a: any = JSON.parse(adminRaw);
      const name = `${a.firstName || a.firstname || a.name || ''} ${a.lastName || a.surname || ''}`.trim();
      if (name) return name;
    }

    const uRaw = localStorage.getItem('currentUserLoggedIn');
    if (uRaw) {
      const u: any = JSON.parse(uRaw);
      const name = `${u.firstName || u.firstname || u.name || ''} ${u.lastName || u.surname || ''}`.trim();
      if (name) return name;
    }
  } catch (e) {}
  return 'Admin';
}

getCurrentUserRole(): string {
  try {
    const adminRaw = sessionStorage.getItem('adminData');
    if (adminRaw) {
      const a: any = JSON.parse(adminRaw);
      if (a.role) return a.role;
    }

    const uRaw = localStorage.getItem('currentUserLoggedIn');
    if (uRaw) {
      const u: any = JSON.parse(uRaw);
      if (u.role || u.userRole) return u.role || u.userRole;
    }
  } catch (e) {}
  return 'Administrator';
}


  /** ---------------------- NOTIFICATIONS ---------------------- */
  refreshNotifications(): void {
  const currentUser = this.runnerService.getCurrentUser();
  if (!currentUser) return;

  const userId = currentUser.userId;
  const roleId = currentUser.roleId || 1; // default to 1 if missing

  this.systemNotificationService.getNotifications(userId, roleId).subscribe({
    next: notifications => {
      this.systemNotifications = notifications.slice(0, 5);
      this.unreadCount = notifications.filter(n => !n.isRead).length;
    },
    error: err => {
      console.error('Failed to load notifications:', err);
      this.snackBar.open('❌ Failed to load notifications. You might not be a Head Admin.', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
      this.systemNotifications = [];
      this.unreadCount = 0;
    }
  });
}

  viewNotification(notification: SystemNotification): void {
    if (!notification.isRead) {
      this.systemNotificationService.markAsRead(notification.notificationId).subscribe({
        next: () => {
          notification.isRead = true;
          this.unreadCount = this.systemNotifications.filter(n => !n.isRead).length;
        },
        error: err => console.error('Failed to mark notification as read:', err)
      });
    }
    this.showNotifications = false;
    this.dialog.open(NotificationDetailComponent, { width: '400px', data: notification });
  }

  viewAllNotifications(): void {
    this.showNotifications = false;
    this.router.navigate(['/notifications']);
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false;
  }

  markAllAsRead(): void {
    this.systemNotifications.filter(n => !n.isRead).forEach(n => {
      this.systemNotificationService.markAsRead(n.notificationId).subscribe(() => n.isRead = true);
    });
    this.unreadCount = 0;
  }

  /** ---------------------- SEARCH & UI ---------------------- */
  onSearchInput(term: string): void { this.searchSubject.next(term); }
  clearSearch(): void { this.searchTerm = ''; this.searchSubject.next(''); }
  setViewMode(mode: 'grid' | 'list'): void { this.viewMode = mode; }
  toggleSortOrder(): void { this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'; this.applySortAndFilter(); }
  toggleProfileMenu(): void { this.showProfileMenu = !this.showProfileMenu; this.showNotifications = false; }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-bell, .user-info')) {
      this.showNotifications = false;
      this.showProfileMenu = false;
    }
  }

  /** ---------------------- SORT & FILTER ---------------------- */
  applySortAndFilter(): void {
    let filtered = [...this.runners];

    switch (this.filterBy) {
      case 'active': filtered = filtered.filter(r => r.progressPercentage > 0); break;
      case 'inactive': filtered = filtered.filter(r => r.progressPercentage === 0); break;
      case 'milestone-reached': filtered = filtered.filter(r => r.milestoneReached); break;
      case 'milestone-pending': filtered = filtered.filter(r => !r.milestoneReached); break;
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (this.sortBy) {
        case 'name':
          comparison = `${a.user?.firstName} ${a.user?.surname}`.localeCompare(`${b.user?.firstName} ${b.user?.surname}`);
          break;
        case 'progress': comparison = a.progressPercentage - b.progressPercentage; break;
        case 'nationality': comparison = a.nationality.localeCompare(b.nationality); break;
        case 'milestone': comparison = (a.milestoneReached ? 1 : 0) - (b.milestoneReached ? 1 : 0); break;
      }
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredRunners = filtered;
  }

  /** ---------------------- DASHBOARD STATS ---------------------- */
  getActiveRunners(): number { return this.runners.filter(r => r.progressPercentage > 0).length; }
  getMilestoneReachedCount(): number { return this.runners.filter(r => r.milestoneReached).length; }
  getAverageProgress(): number {
    if (this.runners.length === 0) return 0;
    return Math.round(this.runners.reduce((sum, r) => sum + (r.progressPercentage || 0), 0) / this.runners.length);
  }

  /** ---------------------- NAVIGATION ---------------------- */
  editProfile(): void { this.showProfileMenu = false; this.router.navigate(['/update-admin']); }
  viewSettings(): void { this.showProfileMenu = false; this.router.navigate(['/otp-configure']); }
  navigateToEmployees() { this.router.navigate(['/employees']); }
  navigateToProducts() { this.router.navigate(['/products']); }
  navigateToRunner() { this.router.navigate(['/runners']); }
  navigateToDonation() { this.router.navigate(['/donations']); }
  navigateToInventory() { this.router.navigate(['/inventory']); }
  navigateToUpdateMilestone() { this.router.navigate(['/milestone/update']); }

  logout() {
    localStorage.removeItem('currentUserLoggedIn');
    sessionStorage.clear();
    this.router.navigate(['/home']);
  }
}

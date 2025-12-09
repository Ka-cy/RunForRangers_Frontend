import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd,RouterEvent } from '@angular/router'; 
import { CommonModule } from '@angular/common';
import { Iemployee } from '../../Interfaces/iemployee';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, switchMap, tap, catchError, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../Employee-Subsystem/confirm-dialog/confirm-dialog.component';
import { EmployeeService } from '../../API-Services/employee.service';
import { NotificationService } from '../../API-Services/notification.service';
import { NotificationModalComponent } from '../../Notification/notification.component';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    NavBarAdminComponent,
    NotificationModalComponent
  ],
  templateUrl: './employee-dashboard.component.html',
  styleUrl: './employee-dashboard.component.css'
})
export class EmployeeDashboardComponent implements OnInit, OnDestroy {
  employees: Iemployee[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  showUserDropdown: boolean = false;
  currentUser: any = {};

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor(
    private http: HttpClient,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private employeeService: EmployeeService,
    private notificationService: NotificationService
  ) {}
 ownerId = JSON.parse(sessionStorage.getItem('adminData')!).userId;
  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadEmployees();

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      tap(() => this.isLoading = true),
      switchMap(term => {
        const trimmed = term.trim();
        if (trimmed === '') {
          return this.employeeService.getAll();
        } else {
          return this.employeeService.search(trimmed);
        }
      }),
      tap(() => this.isLoading = false),
      catchError(err => {
        console.error('Search failed:', err);
        this.isLoading = false;
        return of([]);
      })
    ).subscribe(results => {
      this.employees = results;
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (event) => {
      if (!event.target || !(event.target as Element).closest('.user-info')) {
        this.showUserDropdown = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  private loadCurrentUser(): void {
    // Try to get current user from session storage or local storage
    const adminData = sessionStorage.getItem('adminData');
    const currentUserData = sessionStorage.getItem('currentUserLoggedIn');
    
    if (adminData) {
      this.currentUser = JSON.parse(adminData);
    } else if (currentUserData) {
      this.currentUser = JSON.parse(currentUserData);
    } else {
      // Fallback to a default admin user if no data is found
      this.currentUser = {
        firstName: 'Admin',
        surname: 'User',
        role: 'Administrator'
      };
    }
  }

  getCurrentUserName(): string {
    if (this.currentUser?.firstName && this.currentUser?.surname) {
      return `${this.currentUser.firstName} ${this.currentUser.surname}`;
    }
    return this.currentUser?.name || 'Admin User';
  }

  getCurrentUserRole(): string {
    return this.currentUser?.role || 'Administrator';
  }

  getCurrentUserInitials(): string {
    const name = this.getCurrentUserName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.employeeService.getAll().subscribe({
      next: (data) => {
        this.employees = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading employees:', err);
        this.isLoading = false;
      }
    });
  }

  editEmployee(employeeId: number): void {
    this.router.navigate(['employees/edit', employeeId]);
  }

  editProfile(): void {
    this.showUserDropdown = false;
    this.router.navigate(['/update-admin']);
  }

  viewSettings(): void {
    this.showUserDropdown = false;
    this.router.navigate(['/otp-configure']);
  }

  deleteEmployee(employeeId: number): void {
    this.notificationService.showWarning(
      'Confirm Deletion',
      'Are you sure you want to delete this employee?',
      'Delete',
      'Cancel'
    );

    // Subscribe to confirmation result
    const confirmationSub = this.notificationService.confirmation$.subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.employeeService.delete(employeeId,this.ownerId).subscribe({
          next: () => {
            this.employees = this.employees.filter(e => e.employeeId !== employeeId);
            this.notificationService.showSuccess('Success', 'Employee deleted successfully');
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Delete failed:', err);
            this.notificationService.showError('Error', 'Failed to delete employee');
            this.isLoading = false;
            this.loadEmployees();
          }
        });
      }
      confirmationSub.unsubscribe(); // Clean up subscription
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

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (target) {
      target.onerror = null; // Prevent infinite loop
      target.src = 'assets/Images/default-avatar.png';
    }
  }

  onSearchInput(term: string): void {
    this.searchSubject.next(term);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchSubject.next('');
  }

  // Navigation methods
  navigateToEmployees() { this.router.navigate(['/employees']); }
  navigateToProducts() { this.router.navigate(['/products']); }
  navigateToRunner() { this.router.navigate(['/runners']); }
  navigateToUser() { this.router.navigate(['/viewUsers']); }
  navigateToDonation() { this.router.navigate(['/donations']); }
  navigateToInventory() { this.router.navigate(['/inventory']); }

  logout() {
    localStorage.removeItem('currentUserLoggedIn');
    sessionStorage.clear();
    this.router.navigate(['/home']);
  }
}

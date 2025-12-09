// ...existing code...
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { EventService } from '../../API-Services/event.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { Ievent } from '../../Interfaces/ievent';
import { NotificationService } from '../../API-Services/notification.service';
import { NotificationModalComponent } from '../../Notification/notification.component';
import { Subscription } from 'rxjs';
import { HelpButtonComponent } from "../../Admin-Subsystem/help-button/help-button/help-button.component";
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-events-home',
  standalone: true,
  templateUrl: './event-home.component.html',
  styleUrls: ['./event-home.component.css'],
  imports: [CommonModule, FormsModule, DatePipe, NavBarAdminComponent, NotificationModalComponent, HelpButtonComponent]
})
export class EventHomeComponent implements OnInit, OnDestroy {
  viewRegisteredRunners(eventId: number): void {
    this.router.navigate(['/event-registration', eventId]);
  }
  events: Ievent[] = [];
  filteredEvents: Ievent[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  actionLoading: { [key: number]: boolean } = {};
  showProfileMenu: boolean = false;
  private confirmationSubscription?: Subscription;
  private pendingDeleteEventId?: number;
  private pendingCompleteEventId?: number;

  constructor(
    private router: Router,
    private eventService: EventService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
  this.loadEvents();
  }

  ngOnDestroy(): void {
    if (this.confirmationSubscription) {
      this.confirmationSubscription.unsubscribe();
    }
  }

  // Robust header helpers: check sessionStorage.adminData, localStorage.currentUserLoggedIn
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

  // Add HostListener to close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-info')) {
      this.showProfileMenu = false;
    }
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout(): void {
    localStorage.removeItem('currentUserLoggedIn');
    sessionStorage.removeItem('adminData');
    this.showProfileMenu = false;
    this.router.navigate(['/home']);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearchChange();
  }

  // Role-based access control methods
  isHeadAdmin(): boolean {
    const adminData = sessionStorage.getItem('adminData');
    if (adminData) {
      const admin = JSON.parse(adminData);
      return admin.roleId === 4;
    }
    return false;
  }

  isNormalAdmin(): boolean {
    const adminData = sessionStorage.getItem('adminData');
    if (adminData) {
      const admin = JSON.parse(adminData);
      return admin.roleId === 3;
    }
    return false;
  }

  canModifyData(): boolean {
    return this.isHeadAdmin(); // Restrict to head admins
  }

  loadEvents(): void {
    this.isLoading = true;
    this.eventService.GetAllEvents().subscribe({
      next: (data) => {
        console.log('Events received:', data);

        // Backend should already filter out completed events, but double-check
        this.events = data
          .filter(event => !event.isCompleted && event.eventStatusId !== 3)
          .map(event => {
            const jobs = event.jobs ? event.jobs
              .map(job => ({
                ...job,
                employees: job.employees || [] // Ensure employees array exists
              })) : [];

            return {
              ...event,
              jobs: jobs
            };
          });

        // Debug logging to check employee data
        this.events.forEach(event => {
          console.log(`Event: ${event.eventName}`);
          event.jobs?.forEach(job => {
            console.log(`  Job: ${job.jobTitle}`);
            console.log(`  Employees:`, job.employees);
            if (job.employees && job.employees.length > 0) {
              job.employees.forEach(emp => {
                console.log(`    - ${emp.firstName} ${emp.lastName}`);
              });
            }
          });
        });

        this.filteredEvents = this.events; // Initialize filtered list
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading events:', err);
        this.isLoading = false;
        this.notificationService.showError(
          'Loading Failed',
          'Failed to load events: ' + (err.error?.Message || err.message)
        );
      }
    });
  }

  onSearchChange(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredEvents = this.events;
    } else {
      const searchLower = this.searchTerm.toLowerCase().trim();
      this.filteredEvents = this.events.filter(event =>
        event.eventName?.toLowerCase().includes(searchLower)
      );
    }
  }

  markComplete(event: Ievent): void {
    if (!this.canModifyData()) {
      this.notificationService.showError(
        'Access Denied',
        'Only Head Admins can mark events as complete.'
      );
      return;
    }

    this.pendingCompleteEventId = event.id;
    this.notificationService.showWarning(
      'Confirm Complete',
      `Are you sure you want to mark "${event.eventName}" as complete?`,
      'Mark Complete',
      'Cancel'
    );

    if (this.confirmationSubscription) {
      this.confirmationSubscription.unsubscribe();
    }

    this.confirmationSubscription = this.notificationService.confirmation$.subscribe(confirmed => {
      if (confirmed && this.pendingCompleteEventId) {
        this.performMarkComplete(this.pendingCompleteEventId);
      }
      this.pendingCompleteEventId = undefined;
      if (this.confirmationSubscription) {
        this.confirmationSubscription.unsubscribe();
        this.confirmationSubscription = undefined;
      }
    });
  }

  private performMarkComplete(eventId: number): void {
    this.actionLoading[eventId] = true;

    this.eventService.MarkComplete(eventId).subscribe({
      next: () => {
        this.actionLoading[eventId] = false;
        console.log(`Event ${eventId} marked as complete`);
        this.events = this.events.filter(e => e.id !== eventId);
        this.onSearchChange();
        this.notificationService.showSuccess(
          'Success!',
          'Event marked as complete successfully! It will now appear in the completed events section.'
        );
      },
      error: (err) => {
        this.actionLoading[eventId] = false;
        console.error('Error marking event as complete:', err);
        this.notificationService.showError(
          'Update Failed',
          'Failed to mark event as complete: ' + (err.error?.Message || err.message)
        );
      }
    });
  }

  deleteEvent(event: Ievent): void {
    if (!this.canModifyData()) {
      this.notificationService.showError(
        'Access Denied',
        'Only Head Admins can delete events.'
      );
      return;
    }

    this.pendingDeleteEventId = event.id;
    this.notificationService.showWarning(
      'Confirm Delete',
      `Are you sure you want to delete "${event.eventName}" and all associated jobs? This action cannot be undone.`,
      'Delete',
      'Cancel'
    );

    if (this.confirmationSubscription) {
      this.confirmationSubscription.unsubscribe();
    }

    this.confirmationSubscription = this.notificationService.confirmation$.subscribe(confirmed => {
      if (confirmed && this.pendingDeleteEventId) {
        this.performDeleteEvent(this.pendingDeleteEventId);
      }
      this.pendingDeleteEventId = undefined;
      if (this.confirmationSubscription) {
        this.confirmationSubscription.unsubscribe();
        this.confirmationSubscription = undefined;
      }
    });
  }

  private performDeleteEvent(eventId: number): void {
    this.actionLoading[eventId] = true;

    this.eventService.DeleteEvent(eventId,this.userId).subscribe({
      next: () => {
        this.actionLoading[eventId] = false;
        console.log(`Event ${eventId} deleted`);
        this.events = this.events.filter(e => e.id !== eventId);
        this.onSearchChange();
        this.notificationService.showSuccess(
          'Success!',
          'Event deleted successfully!'
        );
      },
      error: (err) => {
        this.actionLoading[eventId] = false;
        console.error('Error deleting event:', err);
        this.notificationService.showError(
          'Delete Failed',
          'Failed to delete event: ' + (err.error?.Message || err.message)
        );
      }
    });
  }
  userId:any = JSON.parse(sessionStorage.getItem('adminData') || '{}').userId;

  moreInfo(event: Ievent): void {
    if (!this.canModifyData()) {
      this.notificationService.showError(
        'Access Denied',
        'Only Head Admins can edit events.'
      );
      return;
    }
    this.router.navigate(['/update-event', event.id]);
  }

  addNew(): void {
    if (!this.canModifyData()) {
      this.notificationService.showError(
        'Access Denied',
        'Only Head Admins can create events.'
      );
      return;
    }
    this.router.navigate(['/create-event']);
  }

  viewCompleted(): void {
    this.router.navigate(['/completed-events']);
  }

  viewCalendar(): void {
    this.router.navigate(['/events/calendar']);
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { SystemNotificationService, SystemNotification } from '../API-Services/system-notification.service';
import { NotificationDetailComponent } from '../notification-detail/notification-detail.component';
import { NavBarDefaultComponent } from '../nav-bar-default/nav-bar-default.component';

@Component({
  selector: 'app-runner-notifications-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NavBarDefaultComponent], // Removed NotificationDetailComponent
  templateUrl: './runner-notifications-list.component.html',
  styleUrls: ['./runner-notifications-list.component.css']
})
export class RunnerNotificationsListComponent implements OnInit, OnDestroy {
  notifications: SystemNotification[] = [];
  filteredNotifications: SystemNotification[] = [];
  isLoading: boolean = false;
  filterBy: 'all' | 'read' | 'unread' = 'all';
  sortBy: 'date' | 'title' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  private subscription: Subscription = new Subscription();

  constructor(
    private systemNotificationService: SystemNotificationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private getCurrentUserId(): number {
    try {
      const userRaw = sessionStorage.getItem('userData');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        return user.userId || 1;
      }
    } catch (e) {
      console.error('Error getting current user ID', e);
    }
    return 1; // Fallback
  }

  loadNotifications(): void {
    this.isLoading = true;
    const userId = this.getCurrentUserId();

    this.subscription.add(
      this.systemNotificationService.getRunnerNotifications(userId).subscribe({
        next: (notifications: SystemNotification[]) => {
          this.notifications = notifications;
          this.applySortAndFilter();
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          console.error('Failed to load notifications:', err);
          this.snackBar.open('❌ Failed to load notifications', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
        }
      })
    );
  }

  applySortAndFilter(): void {
    let filtered = [...this.notifications];

    // Filter
    if (this.filterBy === 'read') filtered = filtered.filter(n => n.isRead);
    if (this.filterBy === 'unread') filtered = filtered.filter(n => !n.isRead);

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (this.sortBy === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (this.sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredNotifications = filtered;
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applySortAndFilter();
  }

  viewNotification(notification: SystemNotification): void {
    if (!notification.isRead) {
      this.subscription.add(
        this.systemNotificationService.markAsRead(notification.notificationId).subscribe({
          next: () => {
            this.notifications = this.notifications.map(n =>
              n.notificationId === notification.notificationId ? { ...n, isRead: true } : n
            );
            this.applySortAndFilter();
          },
          error: (err: HttpErrorResponse) => {
            console.error('Failed to mark notification as read:', err);
            this.snackBar.open('❌ Failed to mark notification as read', 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        })
      );
    }

    this.dialog.open(NotificationDetailComponent, {
      width: '400px',
      data: notification
    });
  }

  markAllAsRead(): void {
    const unreadNotifications = this.notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) {
      this.snackBar.open('All notifications are already read', 'Close', {
        duration: 3000,
        panelClass: ['info-snackbar']
      });
      return;
    }

    unreadNotifications.forEach(notification => {
      this.subscription.add(
        this.systemNotificationService.markAsRead(notification.notificationId).subscribe({
          next: () => {
            this.notifications = this.notifications.map(n =>
              n.notificationId === notification.notificationId ? { ...n, isRead: true } : n
            );
            this.applySortAndFilter();
          },
          error: (err: HttpErrorResponse) => {
            console.error('Failed to mark all as read:', err);
            this.snackBar.open('❌ Failed to mark all as read', 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        })
      );
    });

    this.snackBar.open('✅ All notifications marked as read', 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}
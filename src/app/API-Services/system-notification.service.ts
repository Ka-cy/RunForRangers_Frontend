import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface SystemNotification {
  notificationId: number;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  userId: number;
  userName?: string;
  notificationTypeId: number;
  notificationType: { notificationTypeName: string; description: string };
}

@Injectable({
  providedIn: 'root'
})
export class SystemNotificationService {
  private baseUrl = 'https://localhost:7158/api/Notifications';

  constructor(private http: HttpClient) {}

  // ============================
  // 🔹 Head Admin methods
  // ============================

  getNotifications(userId: number, roleId: number = 4): Observable<SystemNotification[]> {
    return this.http
      .get<SystemNotification[]>(`${this.baseUrl}?userId=${userId}&roleId=${roleId}`)
      .pipe(catchError(this.handleError));
  }

  getAllNotifications(roleId: number = 4, userId: number = 1): Observable<SystemNotification[]> {
    return this.http
      .get<SystemNotification[]>(`${this.baseUrl}/all?roleId=${roleId}&userId=${userId}`)
      .pipe(catchError(this.handleError));
  }

  getUnreadCount(userId: number, roleId: number = 4): Observable<number> {
    return this.http
      .get<number>(`${this.baseUrl}/unread-count?userId=${userId}&roleId=${roleId}`)
      .pipe(catchError(this.handleError));
  }

  getAllUnreadCount(roleId: number = 4, userId: number = 1): Observable<number> {
    return this.http
      .get<number>(`${this.baseUrl}/all-unread-count?roleId=${roleId}&userId=${userId}`)
      .pipe(catchError(this.handleError));
  }

  markAsRead(notificationId: number): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/${notificationId}/mark-read`, {})
      .pipe(catchError(this.handleError));
  }

  // ============================
  // 🔹 Runner-specific methods
  // ============================

  getRunnerNotifications(runnerId: number): Observable<SystemNotification[]> {
    return this.http
      .get<SystemNotification[]>(`${this.baseUrl}/runner?userId=${runnerId}`)
      .pipe(catchError(this.handleError));
  }

  getAllRunnerNotifications(runnerId: number): Observable<SystemNotification[]> {
    return this.http
      .get<SystemNotification[]>(`${this.baseUrl}/runner/all?userId=${runnerId}`)
      .pipe(catchError(this.handleError));
  }

  getRunnerUnreadCount(runnerId: number): Observable<number> {
    return this.http
      .get<number>(`${this.baseUrl}/runner/unread-count?userId=${runnerId}`)
      .pipe(catchError(this.handleError));
  }

  markRunnerNotificationAsRead(notificationId: number): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/runner/${notificationId}/mark-read`, {})
      .pipe(catchError(this.handleError));
  }

  // ============================
  // 🔹 Error handler
  // ============================

  private handleError(error: any) {
    console.error('SystemNotificationService Error:', error);
    return throwError(() => new Error(error.error?.Message || 'Server error occurred'));
  }
}

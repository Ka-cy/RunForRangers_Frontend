import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface NotificationData {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  showModal: boolean;
  actionButton?: string;
  cancelButton?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new BehaviorSubject<NotificationData>({
    type: 'info',
    title: '',
    message: '',
    showModal: false
  });

  // Separate subject for confirmation results
  private confirmationSubject = new Subject<boolean>();

  notification$ = this.notificationSubject.asObservable();
  confirmation$ = this.confirmationSubject.asObservable();

  showSuccess(title: string, message: string, actionButton: string = 'Continue') {
    this.notificationSubject.next({
      type: 'success',
      title,
      message,
      showModal: true,
      actionButton
    });
  }

  showError(title: string, message: string, actionButton: string = 'OK') {
    this.notificationSubject.next({
      type: 'error',
      title,
      message,
      showModal: true,
      actionButton
    });
  }

  showWarning(title: string, message: string, actionButton: string = 'Continue', cancelButton: string = 'Cancel') {
    this.notificationSubject.next({
      type: 'warning',
      title,
      message,
      showModal: true,
      actionButton,
      cancelButton
    });
  }

  confirmAction() {
    this.hideNotification();
    this.confirmationSubject.next(true);
  }

  cancelAction() {
    this.hideNotification();
    this.confirmationSubject.next(false);
  }

  hideNotification() {
    this.notificationSubject.next({
      type: 'info',
      title: '',
      message: '',
      showModal: false
    });
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationData } from '../API-Services/notification.service';

@Component({
  selector: 'app-notification-modal',
  standalone: true,
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css'],
  imports: [CommonModule]
})
export class NotificationModalComponent implements OnInit, OnDestroy {
  notification: NotificationData = {
    type: 'info',
    title: '',
    message: '',
    showModal: false
  };
  
  private subscription: Subscription = new Subscription();

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.subscription = this.notificationService.notification$.subscribe(
      notification => this.notification = notification
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onAction() {
    if (this.notification.type === 'warning' && this.notification.cancelButton) {
      // For confirmation dialogs, confirm the action
      this.notificationService.confirmAction();
    } else {
      // For other notifications, just hide
      this.notificationService.hideNotification();
    }
  }

  onCancel() {
    if (this.notification.type === 'warning' && this.notification.cancelButton) {
      // For confirmation dialogs, cancel the action
      this.notificationService.cancelAction();
    } else {
      this.notificationService.hideNotification();
    }
  }

  onClose() {
    if (this.notification.type === 'warning' && this.notification.cancelButton) {
      // Clicking outside treats as cancel for confirmations
      this.notificationService.cancelAction();
    } else {
      this.notificationService.hideNotification();
    }
  }
}

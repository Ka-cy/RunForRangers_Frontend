import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SystemNotification } from '../API-Services/system-notification.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-notification-detail',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './notification-detail.component.html',
  styleUrls: ['./notification-detail.component.css']
})
export class NotificationDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<NotificationDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SystemNotification
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}

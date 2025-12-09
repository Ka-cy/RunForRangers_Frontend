import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationModalComponent } from './Notification/notification.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationModalComponent],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'RunForRangersApp';
}

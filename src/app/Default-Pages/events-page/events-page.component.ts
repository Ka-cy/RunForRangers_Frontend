import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavBarDefaultComponent } from "../../nav-bar-default/nav-bar-default.component";
import { UserEventCalendarComponent } from "../../events/user-event-calendar/user-event-calendar.component";
import { EventService } from '../../API-Services/event.service';
import { NotificationService } from '../../API-Services/notification.service';

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [CommonModule, FormsModule, NavBarDefaultComponent, UserEventCalendarComponent],
  templateUrl: './events-page.component.html',
  styleUrls: ['./events-page.component.css']
})
export class EventsPageComponent implements OnInit {
  registeredEventIds: number[] = [];
  registeredRunners: any[] = [];

  // Fetch registered runners for the selected event
  fetchRegisteredRunners(eventId: number): void {
    this.eventService.getRegisteredRunners(eventId).subscribe({
      next: (runners: any[]) => {
        this.registeredRunners = runners;
      },
      error: () => {
        this.registeredRunners = [];
      }
    });
  }
  isRunner: boolean = false;
  showDropdown: boolean = false;
  publicEvents: any[] = [];
  selectedEventId: number | null = null;

  constructor(private eventService: EventService, private notificationService: NotificationService) {}

  ngOnInit(): void {
    // Ensure userId and roleId are set from userData if missing
    let userId = sessionStorage.getItem('userId');
    let roleId = sessionStorage.getItem('roleId');
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (!roleId && (user.roleId === 2 || user.roleId === '2')) {
          sessionStorage.setItem('roleId', '2');
          roleId = '2';
        }
        if (!userId && user.userId) {
          sessionStorage.setItem('userId', user.userId.toString());
          userId = user.userId.toString();
        }
      } catch {}
    }
    this.isRunner = roleId === '2';
    if (this.isRunner && userId) {
      this.eventService.getRegisteredEventsForUser(Number(userId)).subscribe({
        next: (registrations: any[]) => {
          this.registeredEventIds = registrations.map(r => r.eventId);
        },
        error: () => {
          this.registeredEventIds = [];
        }
      });
      this.eventService.GetAllEvents().subscribe({
        next: (events: any[]) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          this.publicEvents = events.filter(event => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return !event.isCompleted && eventDate >= today && event.isPublic === true;
          });
        }
      });
    }
  }

  onRegisterEvent(): void {
  const userId = sessionStorage.getItem('userId');
    console.log('Register button clicked. userId:', userId, 'selectedEventId:', this.selectedEventId);
    if (!userId || !this.selectedEventId) {
      console.warn('Registration aborted: missing userId or selectedEventId');
      return;
    }
    this.notificationService.showWarning(
      'Confirm Registration',
      'Are you sure you want to register for this event?',
      'Confirm',
      'Cancel'
    );
    const sub = this.notificationService.confirmation$.subscribe(confirmed => {
      console.log('Confirmation dialog result:', confirmed);
      if (confirmed) {
  this.eventService.registerForEvent(Number(this.selectedEventId!), userId!).subscribe({
          next: () => {
            console.log('Registration API call succeeded');
            this.notificationService.showSuccess(
              'Registration Successful',
              'You have successfully registered for the event. You will receive further communication.'
            );
            this.fetchRegisteredRunners(this.selectedEventId!);
            this.showDropdown = false;
            this.selectedEventId = null;
          },
          error: (err) => {
            console.error('Registration API call failed:', err);
            this.notificationService.showError(
              'Registration Failed',
              'Registration failed. Please try again.'
            );
          }
        });
      }
      sub.unsubscribe();
    });
  // Optionally, fetch runners for the first event if you want to show a table by default
  }
}
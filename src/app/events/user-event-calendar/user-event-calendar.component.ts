import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../API-Services/notification.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { EventService } from '../../API-Services/event.service';
import { Ievent } from '../../Interfaces/ievent';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Ievent[];
  hasEvents: boolean;
}

@Component({
  selector: 'app-user-event-calendar',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="calendar-container" *ngIf="!isLoading">
      <div class="calendar-header">
        <button (click)="previousMonth()" class="nav-btn">&lt;</button>
        <h2>{{ currentDate | date:'MMMM yyyy' }}</h2>
        <button (click)="nextMonth()" class="nav-btn">&gt;</button>
      </div>
      
      <div class="weekdays">
        <div *ngFor="let day of weekDays" class="weekday">{{ day }}</div>
      </div>

      <div class="calendar-grid">
        <div *ngFor="let day of calendarDays" 
             class="calendar-day" 
             [class.not-current-month]="!day.isCurrentMonth"
             [class.today]="day.isToday"
             [class.has-events]="day.hasEvents">
          <div class="day-number">{{ day.day }}</div>
          <div class="event-indicator" *ngIf="day.hasEvents">
            <div class="event-count">{{ day.events.length }} event{{ day.events.length > 1 ? 's' : '' }}</div>
          </div>
          <div class="event-list" *ngIf="day.hasEvents">
            <div *ngFor="let event of day.events" class="event-item">
              {{ event.eventName }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./user-event-calendar.component.css']
})
export class UserEventCalendarComponent implements OnInit {
  currentDate: Date = new Date();
  calendarDays: CalendarDay[] = [];
  weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  events: Ievent[] = [];
  filteredEvents: Ievent[] = [];
  isLoading: boolean = true;
  isRunner: boolean = false;
  registeredEventIds: number[] = [];

  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  years: number[] = [];
  selectedMonth: number = new Date().getMonth();
  selectedYear: number = new Date().getFullYear();

  constructor(
    private eventService: EventService,
    private router: Router,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  onRegisterClick(event: Ievent): void {
    const userId = sessionStorage.getItem('userId');
    const roleId = sessionStorage.getItem('roleId');
    if (!userId || roleId !== '2') {
      this.notificationService.showWarning(
        'Sign Up Required',
        'You must sign up as a runner before registering for an event.',
        'OK'
      );
      return;
    }
    if (this.registeredEventIds.includes(event.id)) {
      this.notificationService.showWarning(
        'Already Registered',
        'You are already registered for this event.',
        'OK'
      );
      return;
    }
    this.notificationService.showWarning(
      'Confirm Registration',
      'Are you sure you want to register for this event?',
      'Confirm',
      'Cancel'
    );
    const sub = this.notificationService.confirmation$.subscribe(confirmed => {
      if (confirmed) {
        this.eventService.registerForEvent(event.id, userId!).subscribe({
          next: () => {
            this.registeredEventIds.push(event.id);
            this.notificationService.showSuccess(
              'Registration Successful',
              'You have successfully registered for the event. You will shortly receive an email.'
            );
          },
          error: (err) => {
            if (!userId || roleId !== '2') {
              this.notificationService.showWarning(
                'Sign Up Required',
                'You must sign up as a runner before registering for an event.',
                'OK'
              );
            } else if (err.error && (typeof err.error === 'string') && err.error.includes('already registered')) {
              this.notificationService.showWarning(
                'Already Registered',
                'You are already registered for this event.',
                'OK'
              );
            } else {
              this.notificationService.showError(
                'Registration Failed',
                'Registration failed. Please try again.'
              );
            }
          }
        });
      }
      sub.unsubscribe();
    });
  }

  ngOnInit(): void {
    this.updateRunnerStatus();
    // Populate years for dropdown (e.g., 10 years before and after current)
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 10; y <= currentYear + 10; y++) {
      this.years.push(y);
    }
    this.selectedMonth = this.currentDate.getMonth();
    this.selectedYear = this.currentDate.getFullYear();
    if (this.isRunner) {
      const userId = sessionStorage.getItem('userId');
      if (userId) {
        this.eventService.getRegisteredEventsForUser(+userId).subscribe({
          next: (ids: number[]) => {
            this.registeredEventIds = ids;
            this.loadEvents();
          },
          error: () => {
            this.loadEvents();
          }
        });
        return;
      }
    }
    this.loadEvents();
  }

  ngDoCheck(): void {
    this.updateRunnerStatus();
  }

  updateRunnerStatus(): void {
    const roleId = sessionStorage.getItem('roleId');
    this.isRunner = roleId === '2';
  }

  onDateChange(): void {
    this.currentDate = new Date(this.selectedYear, this.selectedMonth, 1);
    this.generateCalendar();
    this.cdr.markForCheck();
  }

  loadEvents(): void {
    this.isLoading = true;

    this.eventService.GetAllEvents().subscribe({
      next: (data: Ievent[]) => {
        console.log('All events received:', data);

        // Get today's date for future events check
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter events that are:
        // 1. Not completed
        // 2. In the future
        // 3. Marked as public or don't have the isPublic property
        this.events = data.filter(event => {
          const eventDate = new Date(event.date);
          eventDate.setHours(0, 0, 0, 0);
          
          // Log each event's filtering criteria
          console.log('Event:', {
            name: event.eventName,
            date: eventDate,
            isCompleted: event.isCompleted,
            isPublic: event.isPublic,
            isFuture: eventDate >= today
          });
          
          // Only show events that are:
          // 1. Not completed
          // 2. In the future
          // 3. Explicitly marked as public (isPublic === true)
          return !event.isCompleted && 
                 eventDate >= today && 
                 event.isPublic === true;
        });
        
        this.filteredEvents = this.events;
        this.generateCalendar();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading events:', err);
        this.isLoading = false;
      }
    });
  }

  generateCalendar(): void {
    this.calendarDays = [];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the dates for the calendar grid
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const endDate = new Date(lastDay);
    if (endDate.getDay() !== 6) {
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayEvents = this.getEventsForDate(new Date(date));
      
      const calendarDay: CalendarDay = {
        date: new Date(date),
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        events: dayEvents,
        hasEvents: dayEvents.length > 0
      };
      
      this.calendarDays.push(calendarDay);
    }
  }

  getEventsForDate(date: Date): Ievent[] {
    return this.filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  }

  previousMonth(): void {
    if (this.selectedMonth === 0) {
      this.selectedMonth = 11;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
    this.onDateChange();
  }

  nextMonth(): void {
    if (this.selectedMonth === 11) {
      this.selectedMonth = 0;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
    this.onDateChange();
  }
}

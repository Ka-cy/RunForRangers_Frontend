import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../API-Services/notification.service';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { EventService } from '../../API-Services/event.service';
import { Ievent } from '../../Interfaces/ievent';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Ievent[];
  hasCompletedEvents: boolean;
  hasPendingEvents: boolean;
  hasActiveEvents: boolean;
  hasMixedEvents: boolean;
}

@Component({
  selector: 'app-event-calendar',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, NavBarAdminComponent],
  templateUrl: './event-calendar.component.html',
  styleUrls: ['./event-calendar.component.css'],
})
export class EventCalendarComponent implements OnInit {
  currentDate: Date = new Date();
  calendarDays: CalendarDay[] = [];
  events: Ievent[] = [];
  filteredEvents: Ievent[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  selectedDay: CalendarDay | null = null;

  // Date selector properties
  selectedMonth: number = new Date().getMonth();
  selectedYear: number = new Date().getFullYear();
  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  years: number[] = [];

  constructor(
    private router: Router,
    private eventService: EventService,
    private notificationService: NotificationService
  ) {
    // Generate years array (current year ± 10 years)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 10; year <= currentYear + 10; year++) {
      this.years.push(year);
    }
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading = true;
    
    // Use forkJoin to call both endpoints simultaneouslyy
    const activeEvents$ = this.eventService.GetAllEvents();
    const completedEvents$ = this.eventService.GetCompletedEvents();
    
    // Combine both observables
    forkJoin({
      activeEvents: activeEvents$,
      completedEvents: completedEvents$
    }).subscribe({
      next: (data) => {
        console.log('Active events data:', data.activeEvents);
        console.log('Completed events data:', data.completedEvents);
        
        // Combine both arrays
        this.events = [...data.activeEvents, ...data.completedEvents];
        this.filteredEvents = this.events; // Initialize filtered events
        
        console.log('Total events combined:', this.events.length);
        
        // Log each event details for debugging
        this.events.forEach((event, index) => {
          console.log(`Event ${index + 1}:`, {
            name: event.eventName,
            date: event.date,
            isCompleted: event.isCompleted,
            eventID: event.id
          });
        });
        
        this.generateCalendar();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading events:', error);
        this.isLoading = false;
      }
    });
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Get first day of the month
    const firstDay = new Date(year, month, 1);
    // Get last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the first day of the week (Sunday) for the calendar grid
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Get the last day of the week (Saturday) for the calendar grid
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    this.calendarDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Generate all days for the calendar grid
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayEvents = this.getEventsForDate(new Date(date));
      
      const hasCompleted = dayEvents.some((event: Ievent) => event.isCompleted);
      const hasPending = dayEvents.some((event: Ievent) => !event.isCompleted);
      const hasActive = dayEvents.some((event: Ievent) => !event.isCompleted && this.isEventActive(event));
      const hasMixed = hasCompleted && hasPending;
      
      const calendarDay: CalendarDay = {
        date: new Date(date),
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        events: dayEvents,
        hasCompletedEvents: hasCompleted && !hasMixed,
        hasPendingEvents: hasPending && !hasMixed,
        hasActiveEvents: hasActive && !hasMixed,
        hasMixedEvents: hasMixed
      };
      
      this.calendarDays.push(calendarDay);
    }
    
    console.log('Generated calendar days:', this.calendarDays);
  }

  getEventsForDate(date: Date): Ievent[] {
    const foundEvents = this.filteredEvents.filter((event: Ievent) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);
      const matches = eventDate.getTime() === compareDate.getTime();
      
      // Debug logging for each event check
      if (matches) {
        console.log(`Found event for ${compareDate.toDateString()}:`, event.eventName, 'Completed:', event.isCompleted);
      }
      
      return matches;
    });
    
    return foundEvents;
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
    this.generateCalendar(); // Regenerate calendar with filtered events
  }

  isEventActive(event: Ievent): boolean {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    // Consider event active if it's today or in the future and not completed
    return eventDate.getTime() >= today.getTime() && !event.isCompleted;
  }

  previousMonth(): void {
    this.selectedMonth = this.selectedMonth === 0 ? 11 : this.selectedMonth - 1;
    if (this.selectedMonth === 11) {
      this.selectedYear--;
    }
    this.updateCurrentDate();
  }

  nextMonth(): void {
    this.selectedMonth = this.selectedMonth === 11 ? 0 : this.selectedMonth + 1;
    if (this.selectedMonth === 0) {
      this.selectedYear++;
    }
    this.updateCurrentDate();
  }

  onDateChange(): void {
    this.updateCurrentDate();
  }

  private updateCurrentDate(): void {
    this.currentDate = new Date(this.selectedYear, this.selectedMonth, 1);
    this.generateCalendar();
  }

  onDayClick(day: CalendarDay): void {
    this.selectedDay = day;
    console.log('Selected day:', day);
  }

  onEventClick(event: Ievent): void {
    // Navigate to event details or edit page
    this.router.navigate(['/events/update-event', event.id]);
  }

  closeDayModal(): void {
    this.selectedDay = null;
  }

  editEvent(event: Ievent): void {
    this.router.navigate(['/update-event', event.id]);
  }

  goBack(): void {
    this.router.navigate(['/events']);
  }


    // View Registered Runners logic
    onViewRegisteredRunners(eventId: number): void {
      // TODO: Open modal or route to show RegisteredRunnersTableComponent for eventId
      // Example: this.router.navigate(['/events/registered-runners', eventId]);
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
    return this.isHeadAdmin();
  }
}

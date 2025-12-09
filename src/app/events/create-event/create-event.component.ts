import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventService } from '../../API-Services/event.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { Ievent } from '../../Interfaces/ievent';
import { Ijob } from '../../Interfaces/ijob';
import { NotificationService } from '../../API-Services/notification.service';
import { NotificationModalComponent } from '../../Notification/notification.component';

@Component({
  selector: 'app-create-event',
  standalone: true,
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css'],
  imports: [CommonModule, FormsModule, NavBarAdminComponent, NotificationModalComponent]
})
export class CreateEventComponent implements OnInit {
  event: Ievent = {
    id: 0,
    eventName: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    isCompleted: false,
    eventStatusId: 2,
    eventStatusName: 'Upcoming',
    isPublic: false, // Default to not visible for new events
    jobs: []
  };

  pendingJobs: Ijob[] = [];
  isLoading: boolean = false;
  private isSubmitting = false;

  constructor(
    private router: Router, 
    private eventService: EventService,
    private notificationService: NotificationService
  ) {}

  // Role-based access control methods
  canModifyData(): boolean {
    return true; // All admins can create/edit/delete events
  }

  ngOnInit(): void {
    // Load any pending job data from localStorage
    const savedJobData = localStorage.getItem('pendingEventJobs');
    if (savedJobData) {
      const rawJobs = JSON.parse(savedJobData);
      // Ensure proper structure, handling both camelCase and PascalCase
      this.pendingJobs = rawJobs.map((job: any) => ({
        jobId: job.jobId || 0,
        jobTitle: job.jobTitle || job.JobTitle || '',
        jobDescription: job.jobDescription || job.JobDescription || '',
        eventId: job.eventId || 0,
        jobStatusId: job.jobStatusId || job.JobStatusId || 2,
        jobStatusName: job.jobStatusName || job.JobStatusName || 'Upcoming',
        employees: job.employees || job.Employees || []
      }));
    }
    
    // Load any saved event data
    const savedEventData = localStorage.getItem('pendingEventData');
    if (savedEventData) {
      this.event = { ...this.event, ...JSON.parse(savedEventData) };
    }
    
    this.updateEventStatus();

    // Gets admin Id
     const adminData = sessionStorage.getItem('adminData');
  }

  onDateChange(newDate: string): void {
    this.event.date = newDate;
    this.updateEventStatus();
    this.saveEventData();
  }

  updateEventStatus(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(this.event.date);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate.getTime() === today.getTime()) {
      this.event.eventStatusId = 1;
      this.event.eventStatusName = 'Active';
    } else if (eventDate < today) {
      this.event.eventStatusId = 3;
      this.event.eventStatusName = 'Completed';
      this.event.isCompleted = true;
    } else {
      this.event.eventStatusId = 2;
      this.event.eventStatusName = 'Upcoming';
      this.event.isCompleted = false;
    }
  }

  saveEventData(): void {
    localStorage.setItem('pendingEventData', JSON.stringify({
      eventName: this.event.eventName,
      description: this.event.description,
      date: this.event.date
    }));
  }

  assignJob(): void {
    this.saveEventData();
    localStorage.setItem('pendingEventJobs', JSON.stringify(this.pendingJobs));
    this.router.navigate(['/create-job'], { queryParams: { returnTo: 'create-event' } });
  }

  removeJob(index: number): void {
    this.pendingJobs.splice(index, 1);
    localStorage.setItem('pendingEventJobs', JSON.stringify(this.pendingJobs));
  }

  validateEventName(): void {
    // This method triggers when user types in event name field
    // Validation styling will be applied automatically through the template
  }

  validateEventDescription(): void {
    // This method triggers when user types in event description field  
    // Validation styling will be applied automatically through the template
  }

  saveEvent(): void {
    if (this.isSubmitting) {
      return; // Prevent multiple submissions
    }

    if (!this.event.eventName.trim()) {
      this.notificationService.showError(
        'Validation Error',
        'Event name is required'
      );
      return;
    }

    if (this.event.eventName.length > 50) {
      this.notificationService.showError(
        'Event Name Too Long',
        'Event name must not exceed 50 characters.'
      );
      return;
    }

    if (!this.event.description.trim()) {
      this.notificationService.showError(
        'Validation Error',
        'Event description is required'
      );
      return;
    }

    if (this.event.description.length > 200) {
      this.notificationService.showError(
        'Description Too Long',
        'Event description must not exceed 200 characters.'
      );
      return;
    }

    if (!this.event.date) {
      this.notificationService.showError(
        'Validation Error',
        'Event date is required'
      );
      return;
    }

    // Create the request object that matches your backend
    console.log('Creating event with visibility:', this.event.isPublic);
    
    const createEventRequest = {
      eventName: this.event.eventName.trim(),
      description: this.event.description.trim(),
      date: this.event.date,
      isPublic: this.event.isPublic === true, // Ensure it's a boolean
      jobs: this.pendingJobs.map(job => ({
        jobTitle: job.jobTitle,
        jobDescription: job.jobDescription,
        employeeIds: job.employees ? job.employees.map(emp => emp.employeeId) : []
      }))
    };

    console.log('Creating event with data:', createEventRequest);

    const adminDataString = sessionStorage.getItem('adminData');
    const adminData = adminDataString ? JSON.parse(adminDataString) : null;

    this.isSubmitting = true;
    this.isLoading = true;

    this.eventService.CreateEvent(createEventRequest, adminData?.userId).subscribe({
      next: (createdEvent) => {
        this.isLoading = false;
        console.log('Event created successfully:', createdEvent);
        this.notificationService.showSuccess(
          'Success!',
          'Event created successfully!'
        );
        setTimeout(() => {
          this.clearStorageAndNavigate();
        }, 2000);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.isLoading = false;
        console.error('Error creating event:', err);
        this.notificationService.showError(
          'Creation Failed',
          'Failed to create event: ' + (err.error?.message || err.message || 'Unknown error')
        );
      }
    });
  }

  clearStorageAndNavigate(): void {
    localStorage.removeItem('pendingEventData');
    localStorage.removeItem('pendingEventJobs');
    localStorage.removeItem('createdEventId');
    this.router.navigate(['/events']);
  }

  cancel(): void {
    this.clearStorageAndNavigate();
  }
}

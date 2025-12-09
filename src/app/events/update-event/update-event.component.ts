import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../API-Services/event.service';
import { JobService } from '../../API-Services/job.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { Ievent } from '../../Interfaces/ievent';
import { Ijob } from '../../Interfaces/ijob';
import { NotificationService } from '../../API-Services/notification.service';
import { NotificationModalComponent } from '../../Notification/notification.component';

@Component({
  selector: 'app-update-event',
  standalone: true,
  templateUrl: './update-event.component.html',
  styleUrls: ['./update-event.component.css'],
  imports: [CommonModule, FormsModule, NavBarAdminComponent, NotificationModalComponent]
})
export class UpdateEventComponent implements OnInit {
  event: Ievent = {
    id: 0,
    eventName: '',
    description: '',
    date: '',
    isCompleted: false,
    eventStatusId: 2,
    eventStatusName: 'Upcoming',
    isPublic: true,
    jobs: []
  };
  pendingJobs: Ijob[] = [];
  isLoading: boolean = false;
  private isSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private jobService: JobService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const eventId = +this.route.snapshot.paramMap.get('id')!;
    if (eventId) {
      this.loadEvent(eventId);
    }

    // Load any pending job updates from localStorage
    const savedJobData = localStorage.getItem('pendingUpdateJobs');
    if (savedJobData) {
      console.log('Loading pending jobs from localStorage:', savedJobData);
      const rawJobs = JSON.parse(savedJobData);
      // Ensure proper structure, handling both camelCase and PascalCase
      this.pendingJobs = rawJobs.map((job: any) => ({
        jobId: job.jobId || job.JobId || 0,
        jobTitle: job.jobTitle || job.JobTitle || '',
        jobDescription: job.jobDescription || job.JobDescription || '',
        eventId: job.eventId || job.EventId || 0,
        jobStatusId: job.jobStatusId || job.JobStatusId || 2,
        jobStatusName: job.jobStatusName || job.JobStatusName || 'Upcoming',
        employees: job.employees || job.Employees || []
      }));

      console.log('Mapped pending jobs:', this.pendingJobs);
      // Log employee data for each pending job
      this.pendingJobs.forEach(job => {
        console.log(`Pending Job: ${job.jobTitle}`);
        console.log(`  Employees:`, job.employees);
      });
    }
  }

  loadEvent(eventId: number): void {
    this.eventService.GetEvent(eventId).subscribe({
      next: (event) => {
        console.log('Received event from server:', event);
        
        // Create a new event object, preserving the visibility state
        this.event = {
          ...event,
          date: new Date(event.date).toISOString().split('T')[0],
          isPublic: true // Default to true for existing events
        };
        console.log('Loaded event from API:', this.event);
        console.log('Event jobs:', this.event.jobs);

        // Only load jobs from API if we don't have pending updates
        if (!localStorage.getItem('pendingUpdateJobs')) {
          this.pendingJobs = [...(event.jobs || [])];
          console.log('Set pendingJobs from event:', this.pendingJobs);

          // Log employee data for each job
          this.pendingJobs.forEach(job => {
            console.log(`Job: ${job.jobTitle}`);
            console.log(`  Employees:`, job.employees);
          });
        } else {
          console.log('Using pendingJobs from localStorage instead of API data');
        }
      },
      error: (err) => {
        console.error('Error loading event:', err);
        this.notificationService.showError(
          'Loading Failed',
          'Failed to load event: ' + (err.error?.Message || err.message)
        );
        this.router.navigate(['/events']);
      }
    });
  }

  updateEventStatus(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(this.event.date);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate.getTime() === today.getTime()) {
      this.event.eventStatusId = 1;
      this.event.eventStatusName = 'Active';
      this.event.isCompleted = false;
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

  onDateChange(newDate: string): void {
    this.event.date = newDate;
    this.updateEventStatus();
    this.saveEventData();
  }

  saveEventData(): void {
    localStorage.setItem('updateEventData', JSON.stringify({
      eventName: this.event.eventName,
      description: this.event.description,
      date: this.event.date,
      isPublic: this.event.isPublic, // Preserve visibility state
    }));
  }

  addJob(): void {
    this.saveEventData();
    localStorage.setItem('pendingUpdateJobs', JSON.stringify(this.pendingJobs));
    this.router.navigate(['/create-job'], {
      queryParams: {
        eventId: this.event.id,
        returnTo: 'update-event'
      }
    });
  }

  updateJob(job: Ijob): void {
    this.saveEventData();
    localStorage.setItem('pendingUpdateJobs', JSON.stringify(this.pendingJobs));
    localStorage.setItem('jobToUpdate', JSON.stringify(job));
    this.router.navigate(['/update-job', job.jobId], {
      queryParams: {
        eventId: this.event.id,
        returnTo: 'update-event'
      }
    });
  }

  removeJob(index: number): void {
    this.pendingJobs.splice(index, 1);
    localStorage.setItem('pendingUpdateJobs', JSON.stringify(this.pendingJobs));
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

    // Ensure we're sending the correct visibility state
    console.log('Current visibility state:', this.event.isPublic);
    
    // Log the current event state
    console.log('Current event state:', {
      ...this.event,
      isPublicType: typeof this.event.isPublic
    });

    const updateEventRequest = {
      eventName: this.event.eventName.trim(),
      description: this.event.description.trim(),
      date: this.event.date,
      isPublic: this.event.isPublic === true, // Ensure it's a boolean
      jobs: this.pendingJobs.map(job => ({
        jobId: job.jobId || 0,
        jobTitle: job.jobTitle,
        jobDescription: job.jobDescription,
        employeeIds: job.employees ? job.employees.map(emp => emp.employeeId) : []
      }))
    };

    console.log('Updating event with data:', updateEventRequest);

    this.isSubmitting = true;
    this.isLoading = true;

    this.eventService.UpdateEventWithJobs(this.event.id, updateEventRequest).subscribe({
      next: (updatedEvent) => {
        this.isLoading = false;
        console.log('Event updated:', updatedEvent);
        setTimeout(() => {
          this.notificationService.showSuccess(
            'Success!',
            'Event updated successfully!'
          );
          localStorage.removeItem('updateEventData');
          localStorage.removeItem('pendingUpdateJobs');
          localStorage.removeItem('jobToUpdate');
          this.router.navigate(['/events']);
        }, 200);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.isLoading = false;
        console.error('Error updating event:', err);
        this.notificationService.showError(
          'Update Failed',
          'Failed to update event: ' + (err.error?.Message || err.message)
        );
      }
    });
  }

  clearStorageAndNavigate(): void {
    localStorage.removeItem('updateEventData');
    localStorage.removeItem('pendingUpdateJobs');
    localStorage.removeItem('jobToUpdate');
    this.router.navigate(['/events']);
  }

  cancel(): void {
    this.clearStorageAndNavigate();
  }
}

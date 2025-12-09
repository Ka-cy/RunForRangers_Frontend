import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JobService } from '../../API-Services/job.service';
import { EmployeeService } from '../../API-Services/employee.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ijob } from '../../Interfaces/ijob';
import { Iemployee } from '../../Interfaces/iemployee';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../../API-Services/notification.service';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { NotificationModalComponent } from '../../Notification/notification.component';

@Component({
  selector: 'app-create-job',
  standalone: true,
  templateUrl: './create-job.component.html',
  styleUrls: ['./create-job.component.css'],
  imports: [CommonModule, FormsModule, NavBarAdminComponent, NotificationModalComponent]
})
export class CreateJobComponent implements OnInit {
  onEmployeeDropdownChange(event: Event): void {
  const selectElem = event.target as HTMLSelectElement;
  const selectedIds = Array.from(selectElem.selectedOptions).map(opt => Number(opt.value));
  this.job.employees = this.availableEmployees.filter(emp => selectedIds.includes(emp.employeeId));
  }
  job: Ijob = {
    jobId: 0,
    jobTitle: '',
    jobDescription: '',
    eventId: 0,
    jobStatusId: 2,
    jobStatusName: 'Upcoming',
    employees: []
  };

  availableEmployees: any[] = [];
  showEmployeeList: boolean = false;
  returnTo: string = '';
  private isSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobService: JobService,
    private employeeService: EmployeeService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.returnTo = this.route.snapshot.queryParamMap.get('returnTo') || 'events';
    this.job.eventId = +this.route.snapshot.queryParamMap.get('eventId')! || 0;
    this.loadAvailableEmployees();
  }

  loadAvailableEmployees(): void {
    this.employeeService.GetAllEmployees().subscribe({
      next: (employees) => {
        this.availableEmployees = employees.map(emp => ({ ...emp, selected: false }));
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading employees:', err);
        this.notificationService.showError(
          'Loading Failed',
          'Failed to load employees'
        );
      }
    });
  }

  toggleEmployeeList(): void {
    this.showEmployeeList = !this.showEmployeeList;
  }

  selectEmployee(employee: Iemployee): void {
    if (!employee.selected) {
      employee.selected = true;
      this.job.employees.push({ ...employee });
    }
  }

  removeEmployee(employee: Iemployee): void {
    const index = this.job.employees.findIndex(emp => emp.employeeId === employee.employeeId);
    if (index > -1) {
      this.job.employees.splice(index, 1);
      // Mark as unselected in available employees
      const availableEmp = this.availableEmployees.find(emp => emp.employeeId === employee.employeeId);
      if (availableEmp) {
        availableEmp.selected = false;
      }
    }
  }

  validateJobTitle(): void {
    // This method triggers when user types in job title field
    // Validation styling will be applied automatically through the template
  }

  validateJobDescription(): void {
    // This method triggers when user types in job description field  
    // Validation styling will be applied automatically through the template
  }

  saveJob(): void {
    if (this.isSubmitting) {
      return; // Prevent multiple submissions
    }

    if (!this.job.jobTitle.trim()) {
      this.notificationService.showError(
        'Validation Error',
        'Job title is required'
      );
      return;
    }

    if (this.job.jobTitle.length > 50) {
      this.notificationService.showError(
        'Job Title Too Long',
        'Job title must not exceed 50 characters.'
      );
      return;
    }

    if (!this.job.jobDescription.trim()) {
      this.notificationService.showError(
        'Validation Error',
        'Job description is required'
      );
      return;
    }

    if (this.job.jobDescription.length > 200) {
      this.notificationService.showError(
        'Description Too Long',
        'Job description must not exceed 200 characters.'
      );
      return;
    }

    this.isSubmitting = true;

    if (this.returnTo === 'create-event') {
      // Save to localStorage for create-event flow
      const pendingJobs = JSON.parse(localStorage.getItem('pendingEventJobs') || '[]');
      const jobToAdd = {
        jobId: 0,
        jobTitle: this.job.jobTitle,
        jobDescription: this.job.jobDescription,
        eventId: 0,
        jobStatusId: 2,
        jobStatusName: 'Upcoming',
        employees: this.job.employees
      };
      pendingJobs.push(jobToAdd);
      localStorage.setItem('pendingEventJobs', JSON.stringify(pendingJobs));
      setTimeout(() => {
        this.notificationService.showSuccess(
          'Success!',
          'Job added successfully! You can see it in the event creation form.'
        );
        this.router.navigate(['/create-event']);
      }, 200);
    } else if (this.returnTo === 'update-event') {
      // Save to localStorage for update-event flow
      const pendingJobs = JSON.parse(localStorage.getItem('pendingUpdateJobs') || '[]');
      const jobToAdd = {
        jobId: 0, // New job
        jobTitle: this.job.jobTitle,
        jobDescription: this.job.jobDescription,
        eventId: this.job.eventId,
        jobStatusId: 2,
        jobStatusName: 'Upcoming',
        employees: this.job.employees
      };
      pendingJobs.push(jobToAdd);
      localStorage.setItem('pendingUpdateJobs', JSON.stringify(pendingJobs));
      setTimeout(() => {
        this.notificationService.showSuccess(
          'Success!',
          'Job added successfully! You can see it in the event update form.'
        );
        this.router.navigate(['/update-event', this.job.eventId]);
      }, 200);
    } else {
      // Direct job creation (existing event)
      const jobToCreate = {
        jobTitle: this.job.jobTitle,
        jobDescription: this.job.jobDescription,
        eventId: this.job.eventId,
        employeeIds: this.job.employees.map(emp => emp.employeeId)
      };

      this.jobService.createJob(jobToCreate).subscribe({
        next: (createdJob) => {
          console.log('Job created successfully:', createdJob);
          this.notificationService.showSuccess(
            'Success!',
            'Job created successfully!'
          );
          setTimeout(() => {
            this.router.navigate(['/events']);
          }, 2000);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Error creating job:', err);
          this.notificationService.showError(
            'Creation Failed',
            'Failed to create job. Please try again.'
          );
        }
      });
    }
  }

  cancel(): void {
    if (this.returnTo === 'create-event') {
      this.router.navigate(['/create-event']);
    } else if (this.returnTo === 'update-event') {
      this.router.navigate(['/update-event', this.job.eventId]);
    } else {
      this.router.navigate(['/events']);
    }
  }
}

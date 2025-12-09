import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeService } from '../../API-Services/employee.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { Ijob } from '../../Interfaces/ijob';
import { Iemployee } from '../../Interfaces/iemployee';
import { JobService } from '../../API-Services/job.service'
import { NotificationService } from '../../API-Services/notification.service';
import { NotificationModalComponent } from '../../Notification/notification.component';

@Component({
  selector: 'app-update-job',
  standalone: true,
  templateUrl: './update-job.component.html',
  styleUrls: ['./update-job.component.css'],
  imports: [CommonModule, FormsModule, NavBarAdminComponent, NotificationModalComponent]
})
export class UpdateJobComponent implements OnInit {
  job: Ijob = {
    jobId: 0,
    jobTitle: '',
    jobDescription: '',
    eventId: 0,
    jobStatusId: 2,
    jobStatusName: 'Upcoming',
    employees: []
  };

  availableEmployees: Iemployee[] = [];
  showEmployeeList: boolean = false;
  eventId: number = 0;
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
    const jobId = +this.route.snapshot.paramMap.get('id')!;
    this.eventId = +this.route.snapshot.queryParamMap.get('eventId')! || 0;
    this.returnTo = this.route.snapshot.queryParamMap.get('returnTo') || 'events';

    // Check if we're coming from update-event with job data in localStorage
    const jobToUpdate = localStorage.getItem('jobToUpdate');
    if (jobToUpdate && this.returnTo === 'update-event') {
      this.job = JSON.parse(jobToUpdate);
      console.log('Loaded job from localStorage:', this.job);
      console.log('Job employees:', this.job.employees);
      localStorage.removeItem('jobToUpdate'); // Clear after loading
      this.loadAvailableEmployees(); // Load after setting job data
    } else if (jobId) {
      this.loadJob(jobId);
    } else {
      this.loadAvailableEmployees();
    }
  }

  loadJob(jobId: number): void {
    this.jobService.getJob(jobId).subscribe({
      next: (job) => {
        this.job = job;
        console.log('Loaded job from API:', this.job);
        console.log('Job employees from API:', this.job.employees);
        this.loadAvailableEmployees(); // Load employees after job is loaded
      },
      error: (err) => {
        console.error('Error loading job:', err);
        this.notificationService.showError(
          'Loading Failed',
          'Failed to load job details'
        );
        this.cancel();
      }
    });
  }

  loadAvailableEmployees(): void {
    console.log('Loading available employees, current job employees:', this.job.employees);
    this.employeeService.GetAllEmployees().subscribe({
      next: (employees) => {
        this.availableEmployees = employees.map(emp => {
          const isAssigned = this.job.employees && this.job.employees.some(assignedEmp => assignedEmp.employeeId === emp.employeeId);
          console.log(`Employee ${emp.firstName} ${emp.lastName} (ID: ${emp.employeeId}) - Assigned: ${isAssigned}`);
          return {
            ...emp,
            employeeId: emp.employeeId as number, // Ensure employeeId is always a number
            selected: isAssigned
          };
        });
        console.log('Available employees with selection status:', this.availableEmployees);
      },
      error: (err) => {
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
      if (!this.job.employees) {
        this.job.employees = [];
      }
      this.job.employees.push({ ...employee });
    }
  }

  removeEmployee(employee: Iemployee): void {
    if (!this.job.employees) return;

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

    if (this.job.jobDescription && this.job.jobDescription.length > 200) {
      this.notificationService.showError(
        'Description Too Long',
        'Job description must not exceed 200 characters.'
      );
      return;
    }

    this.isSubmitting = true;

    if (this.returnTo === 'update-event') {
      // Update job in localStorage for update-event flow
      const pendingJobs = JSON.parse(localStorage.getItem('pendingUpdateJobs') || '[]');
      const jobIndex = pendingJobs.findIndex((j: any) => j.JobId === this.job.jobId);

      const updatedJob = {
        JobId: this.job.jobId,
        JobTitle: this.job.jobTitle,
        JobDescription: this.job.jobDescription,
        JobStatusId: this.job.jobStatusId,
        JobStatusName: this.job.jobStatusName,
        Employees: this.job.employees || []
      };

      if (jobIndex > -1) {
        pendingJobs[jobIndex] = updatedJob;
      } else {
        pendingJobs.push(updatedJob);
      }

      localStorage.setItem('pendingUpdateJobs', JSON.stringify(pendingJobs));
      this.router.navigate(['/update-event', this.eventId]);
    } else {
      // Direct job update (standalone operation)
      const jobToUpdate = {
        JobTitle: this.job.jobTitle,
        JobDescription: this.job.jobDescription,
        EventId: this.job.eventId,
        EmployeeIds: this.job.employees ? this.job.employees.map(emp => emp.employeeId) : []
      };

      this.jobService.updateJob(this.job.jobId, jobToUpdate).subscribe({
        next: () => {
          console.log('Job updated successfully');
          this.notificationService.showSuccess(
            'Success!',
            'Job updated successfully!'
          );
          setTimeout(() => {
            this.router.navigate(['/events']);
          }, 2000);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Error updating job:', err);
          this.notificationService.showError(
            'Update Failed',
            'Failed to update job. Please try again.'
          );
        }
      });
    }
  }

  cancel(): void {
    if (this.returnTo === 'update-event') {
      this.router.navigate(['/update-event', this.eventId]);
    } else {
      this.router.navigate(['/events']);
    }
  }
}

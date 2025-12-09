import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../API-Services/event.service';
import { CommonModule } from '@angular/common';
import { IEventRegistration } from '../Interfaces/iEventRegistration';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-event-registration',
  templateUrl: './event-registration.component.html',
  styleUrls: ['./event-registration.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class EventRegistrationComponent implements OnInit {
  eventRegistrations: IEventRegistration[] = [];
  eventId!: number;

  constructor(private route: ActivatedRoute, private eventService: EventService, private router: Router) {}
  onBackToEvents(): void {
    this.router.navigate(['/events']);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('eventId');
      if (id) {
        this.eventId = +id;
        this.fetchRegistrations();
      }
    });
  }

  fetchRegistrations(): void {
    this.eventService.getRegisteredRunners(this.eventId).subscribe({
      next: (registrations: IEventRegistration[]) => {
        this.eventRegistrations = registrations;
      },
      error: () => {
        // Optionally handle error
      }
    });
  }

  exportToExcel(): void {
    const header = ['Event Name', 'First Name', 'Surname', 'Cellphone', 'Email'];
    const rows = this.eventRegistrations.map(reg => [
      reg.eventName,
      reg.firstName,
      reg.surname,
      reg.cellphone,
      reg.email
    ]);
    let csvContent = header.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(field => '"' + (field ?? '') + '"').join(',') + '\n';
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'registered_runners.csv');
  }
}

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventService } from '../../API-Services/event.service';
import { CommonModule, DatePipe } from '@angular/common';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { Ievent } from '../../Interfaces/ievent';

@Component({
  selector: 'app-view-completed-events',
  standalone: true,
  templateUrl: './completed-events.component.html',
  styleUrls: ['./completed-events.component.css'],
  imports: [CommonModule, DatePipe, NavBarAdminComponent]
})
export class CompletedEventsComponent implements OnInit {
  events: Ievent[] = [];
  isLoading: boolean = false;

  constructor(private router: Router, private eventService: EventService) {}

  ngOnInit(): void {
    this.loadCompletedEvents();
  }

  loadCompletedEvents(): void {
    this.isLoading = true;
    this.eventService.GetCompletedEvents().subscribe({
      next: (data) => {
        console.log('Completed events received:', data);
        // Ensure we only show truly completed events
        this.events = data.filter(event => event.isCompleted || event.eventStatusId === 3);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading completed events:', err);
        this.isLoading = false;
        alert('Failed to load completed eventss: ' + (err.error?.Message || err.message));
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/events']);
  }
}
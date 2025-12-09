// ...existing code...
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Ievent } from '../Interfaces/ievent';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  // Get all event IDs a user has registered for
  getRegisteredEventsForUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetRegisteredEventsForUser/${userId}`).pipe(
      catchError(this.handleError)
    );
  }
  // Register runner for event
  registerForEvent(eventId: number, userId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/RegisterForEvent`, { eventId, userId }).pipe(
      catchError(this.handleError)
    );
  }

  // Get registered runners for an event
  getRegisteredRunners(eventId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetRegisteredRunners/${eventId}`).pipe(
      catchError(this.handleError)
    );
  }
  private baseUrl = 'https://localhost:7158/api/Events';

  constructor(private http: HttpClient) {}

  GetAllEvents(): Observable<Ievent[]> {
    return this.http.get<Ievent[]>(`${this.baseUrl}/GetAllEvents`).pipe(
      map((events: Ievent[]) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return events.map(event => {
          const eventDate = new Date(event.date);
          eventDate.setHours(0, 0, 0, 0);
          
          // If event date is in the past and not already completed
          if (eventDate < today && !event.isCompleted) {
            this.MarkEventComplete(event.id).subscribe();
            event.isCompleted = true;
          }
          return event;
        });
      }),
      catchError(this.handleError)
    );
  }

  private MarkEventComplete(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/MarkEventComplete/${id}`, {}).pipe(
      catchError(this.handleError)
    );
  }

  GetCompletedEvents(): Observable<Ievent[]> {
    return this.http.get<Ievent[]>(`${this.baseUrl}/GetCompletedEvents`).pipe(
      catchError(this.handleError)
    );
  }

  GetEvent(id: number): Observable<Ievent> {
    return this.http.get<Ievent>(`${this.baseUrl}/GetEventById/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  CreateEvent(event: any, userId?: number): Observable<Ievent> {
    // Send userId as query parameter, not in URL path
    const url = userId ? `${this.baseUrl}/CreateEvent?userid=${userId}` : `${this.baseUrl}/CreateEvent`;
    return this.http.post<Ievent>(url, event).pipe(
      catchError(this.handleError)
    );
  }

  UpdateEvent(id: number, event: any): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/UpdateEvent/${id}`, event).pipe(
      catchError(this.handleError)
    );
  }

  UpdateEventWithJobs(id: number, event: any): Observable<Ievent> {
    return this.http.put<Ievent>(`${this.baseUrl}/UpdateEventWithJobs/${id}`, event).pipe(
      catchError(this.handleError)
    );
  }

  MarkComplete(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/MarkEventComplete/${id}`, {}).pipe(
      catchError(this.handleError)
    );
  }

DeleteEvent(id: number, userId: number): Observable<void> {
  return this.http.delete<void>(`${this.baseUrl}/DeleteEvent/${id}?userId=${userId}`).pipe(
    catchError(this.handleError)
  );
}

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      errorMessage = `Server error: ${error.status} - ${error.message || error.error}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
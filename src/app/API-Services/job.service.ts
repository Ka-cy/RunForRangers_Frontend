import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Ijob } from '../Interfaces/ijob';

@Injectable({
  providedIn: 'root'
})

export class JobService {
  private baseUrl = 'https://localhost:7158/api/Jobs';

  constructor(private http: HttpClient) {}

  createJob(job: any): Observable<Ijob> {
    return this.http.post<Ijob>(`${this.baseUrl}/CreateJob`, job).pipe(
      catchError(this.handleError)
    );
  }

  updateJob(id: number, job: any): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/UpdateJobbyID/${id}`, job).pipe(
      catchError(this.handleError)
    );
  }

  MarkJobComplete(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/MarkJobComplete/${id}`, {}).pipe(
      catchError(this.handleError)
    );
  }

  getJob(id: number): Observable<Ijob> {
    return this.http.get<Ijob>(`${this.baseUrl}/GetJobbyID/${id}`).pipe(
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

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Iexpenditure } from '../Interfaces/iexpenditure';
@Injectable({
  providedIn: 'root'
})
export class ExpenditureService {
  private baseUrl = 'https://localhost:7158/api/expenditure'; 

  constructor(private http: HttpClient) {}

  GetAllExpenditures(): Observable<Iexpenditure[]> {
    return this.http.get<Iexpenditure[]>(`${this.baseUrl}/GetAllExpenditures`).pipe(
      catchError(this.handleError)
    );
  }

  uploadReceipt(formData: FormData): Observable<any> {
    // Upload endpoint - ensure your backend has this endpoint implemented
    return this.http.post(`${this.baseUrl}/uploadReceipt`, formData, {
      // Don't set Content-Type header, let browser set it with boundary for FormData
    }).pipe(
      catchError(this.handleError)
    );
  }

  CreateExpenditure(expenditure: Iexpenditure, userId: number): Observable<Iexpenditure> {
    return this.http.post<Iexpenditure>(`${this.baseUrl}/CreateExpenditure?userid=${userId}`, expenditure).pipe(
      catchError(this.handleError)
    );
  }

EditExpenditurebyId(id: number, expenditure: Iexpenditure, userId: number): Observable<void> {
  return this.http.put<void>(`${this.baseUrl}/EditExpenditurebyId/${id}?userId=${userId}`, expenditure).pipe(
    catchError(this.handleError)
  );
}

DeleteExpenditurebyId(id: number, userId: number): Observable<string> {
  return this.http.delete(`${this.baseUrl}/DeleteExpenditurebyId/${id}?userId=${userId}`, { responseType: 'text' }).pipe(
    catchError(this.handleError)
  );
}

  // Additional utility method to check if file is valid
  isValidFileType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    return validTypes.includes(file.type);
  }

  // Additional utility method to check file size
  isValidFileSize(file: File, maxSizeMB: number = 5): boolean {
    const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
    return file.size <= maxSize;
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
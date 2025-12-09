import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Country } from '../Interfaces/icountry';

@Injectable({
  providedIn: 'root'
})
export class CountryService {
  private apiUrl = 'https://localhost:7158/api/Country'; // Updated to port 7158

  constructor(private http: HttpClient) {}

  getAllCountries(): Observable<Country[]> {
    console.log('Fetching countries from:', `${this.apiUrl}/GetAllCountries`); // Debug URL
    return this.http.get<Country[]>(`${this.apiUrl}/GetAllCountries`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Country API error:', error);
        return throwError(() => new Error('Failed to load countries. Please check the server or ensure the correct port is used (e.g., 7158).'));
      })
    );
  }
}
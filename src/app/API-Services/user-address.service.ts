import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface CreateUserAddressDto {
  streetAddress: string;
  suburb: string;
  postalCode: string;
  cityId: number;
  provinceId: number;
  isDefault: boolean;
}

export interface UserAddressDto {
  userAddressId: number;
  streetAddress: string;
  suburb: string;
  postalCode: string;
  cityId: number;
  cityName: string;
  provinceId: number;
  provinceName: string;
  countryId: number;
  countryName: string;
  isDefault: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserAddressService {
  private apiUrl = 'https://localhost:7158/api/OnlineStore';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('currentUserLoggedIn');
    console.log('Raw token from localStorage:', token);

    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      try {
        const parsedToken = JSON.parse(token);
        console.log('Parsed token object:', parsedToken);

        if (parsedToken.token) {
          headers = headers.set('Authorization', `Bearer ${parsedToken.token}`);
          console.log('Authorization header set with token');
        } else {
          console.warn('No token property found in parsed token object');
        }
      } catch (error) {
        console.error('Error parsing token from localStorage:', error);
      }
    } else {
      console.warn('No token found in localStorage');
    }

    return headers;
  }

  private handleError(error: HttpErrorResponse) {
    console.error('HTTP Error:', error);
    console.error('Status:', error.status);
    console.error('Error body:', error.error);

    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.errors) {
        // Handle validation errors from ASP.NET Core
        const validationErrors = Object.values(error.error.errors).flat();
        errorMessage = validationErrors.join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = `Server Error: ${error.status} ${error.statusText}`;
      }
    }

    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error
    }));
  }

  // GET: api/OnlineStore/Users/{userId}/Addresses
  getUserAddresses(userId: number): Observable<UserAddressDto[]> {
    const headers = this.getHeaders();
    console.log('Getting user addresses for userId:', userId);
    console.log('Using headers:', headers);

    return this.http.get<UserAddressDto[]>(
      `${this.apiUrl}/Users/${userId}/Addresses`,
      { headers }
    ).pipe(
      tap(response => console.log('getUserAddresses response:', response)),
      catchError(this.handleError.bind(this))
    );
  }

  // POST: api/OnlineStore/Users/{userId}/Addresses
  createUserAddress(userId: number, address: CreateUserAddressDto): Observable<UserAddressDto> {
    const headers = this.getHeaders();
    const url = `${this.apiUrl}/Users/${userId}/Addresses`;

    console.log('Creating user address:');
    console.log('- URL:', url);
    console.log('- UserId:', userId);
    console.log('- Address DTO:', address);
    console.log('- Headers:', headers);

    // Validate the DTO before sending
    if (!address.streetAddress?.trim()) {
      return throwError(() => ({ message: 'Street address is required' }));
    }
    if (!address.suburb?.trim()) {
      return throwError(() => ({ message: 'Suburb is required' }));
    }
    if (!address.postalCode?.trim()) {
      return throwError(() => ({ message: 'Postal code is required' }));
    }
    if (!address.cityId || address.cityId <= 0) {
      return throwError(() => ({ message: 'Valid city is required' }));
    }
    if (!address.provinceId || address.provinceId <= 0) {
      return throwError(() => ({ message: 'Valid province is required' }));
    }

    return this.http.post<UserAddressDto>(url, address, { headers }).pipe(
      tap(response => console.log('createUserAddress response:', response)),
      catchError(this.handleError.bind(this))
    );
  }

  // GET: api/OnlineStore/Users/{userId}/Addresses/{addressId}
  getUserAddress(userId: number, addressId: number): Observable<UserAddressDto> {
    return this.http.get<UserAddressDto>(
      `${this.apiUrl}/Users/${userId}/Addresses/${addressId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }
}

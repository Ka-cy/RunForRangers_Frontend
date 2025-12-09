import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DeliveryAddress } from '../Interfaces/idelivery';

@Injectable({
  providedIn: 'root'
})
export class DeliveryAddressService {
  private apiUrl = 'https://localhost:7158/api/OnlineStore/DeliveryAddresses';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('currentUserLoggedIn');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${JSON.parse(token).token}` : ''
    });
  }

  createDeliveryAddress(address: DeliveryAddress): Observable<any> {
      console.log('=== DELIVERY ADDRESS CREATION DEBUG ===');
      console.log('Creating delivery address with data:', address);
      console.log('Detailed address breakdown:');
      console.log('- streetAddress:', address.streetAddress);
      console.log('- suburb:', address.suburb);
      console.log('- postalCode:', address.postalCode);
      console.log('- provinceId:', address.provinceId);
      console.log('- cityId:', address.cityId);
      console.log('- countryId:', address.countryId);
      console.log('API URL:', this.apiUrl);
      console.log('Headers:', this.getHeaders());    return this.http
      .post<any>(this.apiUrl, address, { headers: this.getHeaders() })
      .pipe(
        catchError((error) => {
          console.error('=== DELIVERY ADDRESS ERROR DEBUG ===');
          console.error('Error creating delivery address:', error);
          console.error('Error status:', error.status);
          console.error('Error status text:', error.statusText);
          console.error('Request data was:', address);
          console.error('Response body:', error.error);
          
          // Log specific validation errors if available
          if (error.error && error.error.errors) {
            console.error('Specific validation errors:', error.error.errors);
            
            // Log each field error
            Object.keys(error.error.errors).forEach(field => {
              console.error(`Field '${field}' errors:`, error.error.errors[field]);
            });
          }
          
          if (error.error && error.error.title) {
            console.error('Error title:', error.error.title);
          }
          
          return throwError(() => new Error(`Failed to create delivery address: ${error.status} - ${error.error?.message || error.message}`));
        })
      );
  }
}

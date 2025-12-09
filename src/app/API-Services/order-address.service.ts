import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface OrderAddress {
  orderAddressId?: number;
  orderId: number; // Required but can be 0 for initial creation
  streetAddress: string;
  suburb: string;
  postalCode: string;
  cityId: number;
  provinceId: number;
  countryId: number;
}


@Injectable({
  providedIn: 'root'
})
export class OrderAddressService {
  private apiUrl = 'https://localhost:7158/api/OnlineStore/OrderAddresses'; // Matches updated OnlineStoreController

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('currentUserLoggedIn');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${JSON.parse(token).token}` : ''
    });
  }

  createOrderAddress(address: OrderAddress): Observable<OrderAddress> {
    return this.http.post<OrderAddress>(this.apiUrl, address, { headers: this.getHeaders() });
  }

  updateOrderAddressOrderId(addressId: number, orderId: number): Observable<any> {
    const url = `${this.apiUrl}/${addressId}/UpdateOrderId`;
    return this.http.put(url, orderId, { headers: this.getHeaders() });
  }
}

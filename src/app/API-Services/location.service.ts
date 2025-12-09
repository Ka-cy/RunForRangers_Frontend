import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IProvince, ICity, ISuburb, ICountry } from '../Interfaces/idelivery';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private baseUrl = 'https://localhost:7158/api'; // Adjust based on your actual API base URL

  constructor(private http: HttpClient) { }

  // Province operations
  getProvinces(): Observable<IProvince[]> {
    return this.http.get<IProvince[]>(`${this.baseUrl}/Province/GetProvinces`);
  }

  getProvinceById(id: number): Observable<IProvince> {
    return this.http.get<IProvince>(`${this.baseUrl}/Province/GetProvince/${id}`);
  }

  // City operations
  getCities(): Observable<ICity[]> {
    return this.http.get<ICity[]>(`${this.baseUrl}/City/GetCities`);
  }

  getCitiesByProvince(provinceId: number): Observable<ICity[]> {
    return this.http.get<ICity[]>(`${this.baseUrl}/City/GetCitiesByProvince/${provinceId}`);
  }

  getCityById(id: number): Observable<ICity> {
    return this.http.get<ICity>(`${this.baseUrl}/City/GetCity/${id}`);
  }

  // Suburb operations
  getSuburbs(): Observable<ISuburb[]> {
    return this.http.get<ISuburb[]>(`${this.baseUrl}/Suburb/GetSuburbs`);
  }

  getSuburbsByCity(cityId: number): Observable<ISuburb[]> {
    return this.http.get<ISuburb[]>(`${this.baseUrl}/Suburb/GetSuburbsByCity/${cityId}`);
  }

  getSuburbById(id: number): Observable<ISuburb> {
    return this.http.get<ISuburb>(`${this.baseUrl}/Suburb/GetSuburb/${id}`);
  }

  // Country operations
  getCountries(): Observable<ICountry[]> {
    return this.http.get<ICountry[]>(`${this.baseUrl}/Country/GetCountries`);
  }

  getCountryById(id: number): Observable<ICountry> {
    return this.http.get<ICountry>(`${this.baseUrl}/Country/GetCountry/${id}`);
  }
}

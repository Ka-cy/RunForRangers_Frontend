import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Province, City } from '../Interfaces/icountry';

@Injectable({
  providedIn: 'root'
})
export class CityService {
  private baseUrl = 'https://localhost:7158/api';

  constructor(private http: HttpClient) {}

  getAllProvinces(): Observable<Province[]> {
    return this.http.get<Province[]>(`${this.baseUrl}/Province/GetAllProvinces`);
  }

  getAllCities(): Observable<City[]> {
    return this.http.get<City[]>(`${this.baseUrl}/City/GetAllCities`);
  }

  getCitiesByProvince(provinceId: number): Observable<City[]> {
    return this.http.get<City[]>(`${this.baseUrl}/City/GetCitiesByProvince?provinceId=${provinceId}`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Iemployee } from '../Interfaces/iemployee';

export interface Employee {
  employeeId?: number;
  firstName: string;
  lastName: string;
  email: string;
  cellPhone: string;
  employeeImage: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private baseUrl = 'https://localhost:7158/api/Employee';

  constructor(private http: HttpClient) {}

  GetAllEmployees(): Observable<Iemployee[]> {
    return this.http.get<Iemployee[]>(`${this.baseUrl}/GetAllEmployees`);
  }

  getAll(): Observable<Iemployee[]> {
    return this.http.get<Iemployee[]>(`${this.baseUrl}/GetAllEmployees`);
  }

  getById(id: number): Observable<Iemployee> {
    return this.http.get<Iemployee>(`${this.baseUrl}/GetEmployeeById/${id}`);
  }

create(employee: FormData, ownerId: number): Observable<Iemployee> {
    return this.http.post<Iemployee>(`${this.baseUrl}/CreateEmployee?ownerId=${ownerId}`, employee);
}

  update(id: number, employee: FormData): Observable<Iemployee> {
    return this.http.put<Iemployee>(`${this.baseUrl}/UpdateEmployeeById/${id}`, employee);
  }

  delete(id: number,ownerId:number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/DeleteEmployeeById/${id}?ownerId=${ownerId}`);
  }

  search(term: string): Observable<Iemployee[]> {
    return this.http.get<Iemployee[]>(`${this.baseUrl}/SearchEmployees?searchTerm=${term}`);
  }
}
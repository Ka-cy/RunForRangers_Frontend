import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IEmail } from '../Interfaces/IEmail';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
 private apiUrl = 'https://localhost:7158/api/Email';

  constructor(private http: HttpClient) {}

  sendEmail(request: IEmail): Observable<void> {
    return this.http.post<void>(this.apiUrl,request);
  }


}

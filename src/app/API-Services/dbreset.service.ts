import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DBResetService {
  
  constructor(private http:HttpClient) { }

  private apiUrl = 'https://localhost:7158/api/DBReset/';



  ResetDatabase(): any {
    return this.http.get<any>(this.apiUrl );
  }
}

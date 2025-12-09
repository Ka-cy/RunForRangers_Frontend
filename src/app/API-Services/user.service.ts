import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IUser } from '../Interfaces/IUser';
import { IForgetPassword } from '../Interfaces/IForgetPassword';

@Injectable({
  providedIn: 'root'
})
export class UserService {

private apiUrl = 'https://localhost:7158/api/User/';
  constructor( private httpClient:HttpClient) { }



//2FA related methods
TwoFAVerfication(userId: number, code: string): Observable<any> {
  return this.httpClient.post<any>(this.apiUrl + 'TwoFAVerification?userId=' + userId + '&code=' + code, null);
}

/*

User Related Endpoint Methods


*/
  CreateUser(user: any): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + 'CreateUser', user);
  }

  // New method for creating user with image upload
  CreateUserWithImage(formData: FormData): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + 'CreateUser', formData);
  }

  UpdateUser(userUpdate:any): Observable<any> {
    return this.httpClient.put<any>(this.apiUrl + 'UpdateUser',userUpdate)
      .pipe(
               
      );
  }

  // New method for updating user with image upload
  UpdateUserWithImage(formData: FormData): Observable<any> {
    return this.httpClient.put<any>(this.apiUrl + 'UpdateUser', formData)
      .pipe(
               
      );
  }

  DeleteUser(): Observable<any> {
    return this.httpClient.delete<any>(this.apiUrl + 'DeleteUser' )
      .pipe(
               
      );
  }

  GetAllUsers(): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + 'GetAllUsers')
      .pipe(
               
      );
  }
SearchUser(value: string): Observable<any> {
  return this.httpClient.get<any>(this.apiUrl + 'SearchUser?value=' + value)
    .pipe();
}


 Login(email: string, password: string): Observable<any> {
    const loginData = { email: email, password: password };
    return this.httpClient.post<any>(this.apiUrl + 'Login', loginData);
}

  /*


   Admin Related Endpoint Methods


  */
  CreateAdmin(admin: any,ownerId:number): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + 'CreateAdmin?ownerId='+ownerId, admin);
  }

  // New method for creating admin with image upload
  // Remove the old CreateAdmin method and keep only this one
// Updated service method - ensure no Content-Type header is set for FormData
CreateAdminWithImage(formData: FormData, ownerId: number): Observable<any> {
  console.log('Sending FormData to API...');
  
  // Log FormData contents for debugging
  for (let pair of formData.entries()) {
    console.log(pair[0] + ': ' + pair[1]);
  }
  
  // Don't set Content-Type header - let the browser set it automatically for FormData
  // This ensures proper boundary is set for multipart/form-data
  return this.httpClient.post<any>(
    this.apiUrl + "CreateAdmin?ownerId=" + ownerId, 
    formData
    // Note: No headers object - let Angular handle Content-Type automatically
  );
}

  UpdateAdmin(admin: IUser): Observable<any> {
    return this.httpClient.put<any>(this.apiUrl + 'UpdateAdmin', admin)
      .pipe(
               
      );
  }

  // New method for updating admin with image upload
  UpdateAdminWithImage(formData: FormData): Observable<any> {
    return this.httpClient.put<any>(this.apiUrl + 'UpdateAdmin', formData)
      .pipe(
               
      );
  }

  UpdateAdminRole(adminRoleUpdate: any): Observable<any> {
    return this.httpClient.put<any>(this.apiUrl + 'UpdateAdminRole', adminRoleUpdate)
      .pipe()

      }



  DeleteAdmin(email: string,ownerId:number): Observable<any> {
    return this.httpClient.delete<any>(this.apiUrl + 'DeleteAdmin?email='+email+'&ownerId='+ownerId)
      .pipe(
               
      );
  }  

  GetAllAdmins(): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + 'GetAllAdmins')
      .pipe(
               
      );
  }

  GetAdmin(value: string): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + 'GetAdmin?value=' + value)
      .pipe();
    }

 AuditLogHistory(dateString: string): Observable<any> {
  // This should call the "AuditLogHistory" endpoint
  return this.httpClient.get(this.apiUrl + 'AuditLogHistory?providedDate=' + dateString);
}

AuditLogHistoryRange(startDate: string, endDate: string): Observable<any> {
  // This should call the "AuditLogHistoryRange" endpoint (different route!)
  return this.httpClient.get(this.apiUrl + 'AuditLogHistoryRange?startDate=' + startDate + '&endDate=' + endDate);
}

Search(value: string): Observable<any>{
  return this.httpClient.get<any>(this.apiUrl + 'SearchAudtiLog?value='+value) //updated
}




// Forget Password Functionallity
ForgetPassword(email:string):Observable<any>{
  return this.httpClient.post<any>(this.apiUrl + 'ForgetPassword?accountEmail='+email,email);

}


ForgetPasswordLogin(value:IForgetPassword):Observable<any>{
  return this.httpClient.post<any>(this.apiUrl+'ForgetPasswordLogin',value);
}

/*
2-FA Timer
*/
ChangeOTPTimer(timer: number): Observable<any> {
  return this.httpClient.put<any>(this.apiUrl + 'ChangeOTPTimer?updateTimeMinutes=' + timer, null);

}

GetOTPTimer(): Observable<any> {
  return this.httpClient.get<any>(this.apiUrl + 'GetOTPTimer')
    .pipe();
}


/*
    Update Password Endpoint Method
*/
UpdatePassword(email:string,password:string): Observable<any> {
    return this.httpClient.put<any>(this.apiUrl + 'UpdatePassword?email='+email+'&password='+ password,null)
      .pipe()
}










}

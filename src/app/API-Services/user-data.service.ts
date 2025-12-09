import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  private userDataUpdated = new Subject<any>();

  // Observable for components to subscribe to
  userDataUpdated$ = this.userDataUpdated.asObservable();

  constructor() { }

  // Method to notify all components that user data has been updated
  notifyUserDataUpdate(userData: any): void {
    console.log('UserDataService: Notifying user data update', userData);
    this.userDataUpdated.next(userData);
  }

  // Method to get current user data from session storage
  getCurrentUserData(): any {
    const userData = sessionStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  // Method to update user data in session storage and notify components
  updateUserData(userData: any): void {
    sessionStorage.setItem('userData', JSON.stringify(userData));
    this.notifyUserDataUpdate(userData);
  }
}

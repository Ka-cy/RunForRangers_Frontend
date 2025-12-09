import { Injectable } from '@angular/core';

export interface User {
  userId: number;
  id?: number; // Alternative field name
  email?: string;
  userName?: string;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor() {}

  getCurrentUser(): User | null {
  try {
    const userString = sessionStorage.getItem('userData');
    if (!userString) {
      return null;
    }
    return JSON.parse(userString);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }

  logout(): void {
    localStorage.removeItem('currentUserLoggedIn');
  }
}

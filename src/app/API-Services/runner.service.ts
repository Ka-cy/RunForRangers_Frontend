import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Irunner } from '../Interfaces/irunner';

export interface Runner {
  userId: number;
  countryOfResidence: string;
  nationality: string;
  allergies: string;
  shoeSize: string;
  medicalHistory: string;
  clothingSize: string;
  runnerImage: string;
  idNumber: string;
  user?: {
    firstName: string;
    surname: string;
    email?: string;
    cellphone?: string;
    lastLoginYear?: number;
  };
  totalDonations: number;
  targetAmount: number;
  progressPercentage: number;
  milestoneReached: boolean;
}

export interface RunnerWithDonations {
  runner: Runner;
  donations: {
    donationID: number;
    type: string;
    amount: number;
    donorName: string;
    loggedByAdminId: number;
    date: string;
  }[];
  totalDonations: number;
  targetAmount: number;
  progressPercentage: number;
  milestoneReached: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RunnerService {
  private baseUrl = 'https://localhost:7158/api/Runner';
  private milestoneBaseUrl = 'https://localhost:7158/api/Milestone';

  constructor(private http: HttpClient) {}

  getCurrentUser(): { userId: number; roleId: number; firstName?: string; surname?: string } | null {
    const userData = sessionStorage.getItem('userData') || sessionStorage.getItem('adminData');
    if (userData) {
      const parsedData = JSON.parse(userData);
      return {
        userId: parsedData.userId || parsedData.UserId,
        roleId: parsedData.roleId || parsedData.RoleId,
        firstName: parsedData.firstName || parsedData.FirstName,
        surname: parsedData.surname || parsedData.Surname
      };
    }
    return null;
  }

  createRunner(runner: Irunner, imageFile: File | null): Observable<Runner> {
    const formData = this.buildFormData(runner, imageFile);
    return this.http.post<Runner>(`${this.baseUrl}/CreateRunner`, formData)
      .pipe(catchError(this.handleError));
  }

  getRunnerById(userId: number): Observable<Runner> {
    return this.http.get<Runner>(`${this.baseUrl}/${userId}`)
      .pipe(catchError(this.handleError));
  }

  getAllRunners(): Observable<Runner[]> {
    return this.http.get<Runner[]>(`${this.baseUrl}/GetAllRunners`)
      .pipe(catchError(this.handleError));
  }

  search(term: string): Observable<Runner[]> {
    const params = new HttpParams().set('keyword', term);
    return this.http.get<Runner[]>(`${this.baseUrl}/Search`, { params })
      .pipe(catchError(this.handleError));
  }

  updateRunner(userId: number, runner: Irunner, imageFile: File | null): Observable<Runner> {
    const formData = this.buildFormData(runner, imageFile);
    return this.http.put<Runner>(`${this.baseUrl}/UpdateRunner/${userId}`, formData)
      .pipe(catchError(this.handleError));
  }

  deleteRunner(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/DeleteRunner/${userId}`)
      .pipe(catchError(this.handleError));
  }

  getRunnerWithDonations(userId: number): Observable<RunnerWithDonations> {
    return this.http.get<RunnerWithDonations>(`${this.baseUrl}/${userId}/WithDonations`)
      .pipe(catchError(this.handleError));
  }

  getCurrentMilestone(userId: number | null = null): Observable<{ milestoneNumber: number; setDate: string; isAchieved: boolean }> {
  const url = userId !== null && userId !== undefined
    ? `${this.milestoneBaseUrl}/GetCurrentMilestone?userId=${userId}`
    : `${this.milestoneBaseUrl}/GetCurrentMilestone`;
  return this.http.get<{ milestoneNumber: number; setDate: string; isAchieved: boolean }>(url)
    .pipe(catchError(this.handleError));
}

setMilestone(milestone: number, userId: number | null = null): Observable<{ userId?: number; milestoneNumber: number; setDate: string; isAchieved: boolean }> {
  let params = new HttpParams().set('milestone', milestone.toString());

  if (userId !== null && userId !== undefined) {
    params = params.set('userId', userId.toString());
  }

  return this.http.post<any>(`${this.milestoneBaseUrl}/SetMilestone`, {}, { params })
    .pipe(catchError(this.handleError));
}

  getImageUrl(imagePath: string | null): string {
    return imagePath ? `https://localhost:7158/${imagePath}` : 'assets/default-runner.jpg';
  }

  private buildFormData(runner: Irunner, imageFile: File | null): FormData {
    const formData = new FormData();
    formData.append('userId', runner.userId.toString());
    formData.append('countryOfResidence', runner.countryOfResidence || '');
    formData.append('nationality', runner.nationality || '');
    if (runner.allergies) formData.append('allergies', runner.allergies);
    if (runner.shoeSize) formData.append('shoeSize', runner.shoeSize);
    if (runner.medicalHistory) formData.append('medicalHistory', runner.medicalHistory);
    if (runner.clothingSize) formData.append('clothingSize', runner.clothingSize);
    if (runner.idNumber) formData.append('idNumber', runner.idNumber);
    if (imageFile) formData.append('runnerImage', imageFile, imageFile.name);
    return formData;
  }

  private handleError(error: HttpErrorResponse) {
    console.error('RunnerService Error:', error);
    return throwError(() => new Error(error.error?.Message || 'Server error occurred'));
  }
}
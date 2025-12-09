import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';

export interface Donation {
  donationID: number;
  userId?: number;
  type: string;
  date: Date;
  amount: number;
  loggedByAdminId: number;
  donorName: string;
}

export interface CreateDonationDto {
  type: string;
  amount: number;
  donorName: string;
  loggedByAdminId: number;
  userId?: number;
}

export interface RunnerSelfDonationDto {
  amount: number;
  donorName: string;
  userId: number;
}

export interface UpdateDonationDto {
  donationID: number;
  type: string;
  amount: number;
  donorName: string;
  loggedByAdminId: number;
  userId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DonationService {
  private donationUrl = 'https://localhost:7158/api/Donation/';

  constructor(private httpClient: HttpClient) { }

  createDonation(donation: CreateDonationDto): Observable<Donation> {
    // Remove the ownerId from the body - just send as query parameter
    return this.httpClient.post<Donation>('https://localhost:7158/api/Donation', donation);
}

  createRunnerSelfDonation(selfDonation: RunnerSelfDonationDto): Observable<Donation> {
    const donationData: CreateDonationDto = {
      type: 'Runner',
      amount: selfDonation.amount,
      donorName: selfDonation.donorName,
      loggedByAdminId: 1,
      userId: selfDonation.userId
    };
    return this.httpClient.post<Donation>(this.donationUrl, donationData);
  }

  createRunnerSelfDonationWithFallback(selfDonation: RunnerSelfDonationDto): Observable<Donation> {
    const donationData: CreateDonationDto = {
      type: 'Runner',
      amount: selfDonation.amount,
      donorName: selfDonation.donorName,
      loggedByAdminId: 1,
      userId: selfDonation.userId
    };
    return this.httpClient.post<Donation>(this.donationUrl, donationData);
  }

  createRunnerSelfDonationMultipleAttempts(selfDonation: RunnerSelfDonationDto): Observable<Donation> {
    const adminIds = [1, 2, 3, 4, 5];

    const tryWithAdminId = (index: number): Observable<Donation> => {
      if (index >= adminIds.length) {
        return throwError(() => new Error('No valid admin ID found for logging donation'));
      }

      const donationData: CreateDonationDto = {
        type: 'Runner',
        amount: selfDonation.amount,
        donorName: selfDonation.donorName,
        loggedByAdminId: adminIds[index],
        userId: selfDonation.userId
      };

      return this.httpClient.post<Donation>(this.donationUrl, donationData).pipe(
        catchError((error) => {
          if (error.status === 400 && error.error?.error?.includes('LoggedByAdminId')) {
            return tryWithAdminId(index + 1); // Try next admin ID
          }
          return throwError(() => error); // Re-throw other errors
        })
      );
    };

    return tryWithAdminId(0);
  }

  getAllDonations(): Observable<Donation[]> {
    return this.httpClient.get<Donation[]>(this.donationUrl);
  }

  getDonation(id: number): Observable<Donation> {
    return this.httpClient.get<Donation>(`${this.donationUrl}${id}`);
  }

  getRunnerDonationsByDateRange(startDate: string, endDate: string): Observable<Donation[]> {
    return this.httpClient.get<Donation[]>(
      `${this.donationUrl}by-date-range/runner?startDate=${startDate}&endDate=${endDate}`
    );
  }

  getOrgDonationsByDateRange(startDate: string, endDate: string): Observable<Donation[]> {
    return this.httpClient.get<Donation[]>(
      `${this.donationUrl}by-date-range/organisation?startDate=${startDate}&endDate=${endDate}`
    );
  }

  updateDonation(id: number, donation: UpdateDonationDto): Observable<void> {
    return this.httpClient.put<void>(`${this.donationUrl}${id}`, donation);
  }

  // Delete a donation 

  bulkUploadDonations(donations: any[], loggedByAdminId: number): Observable<any> {
  const payload = {
    loggedByAdminId: loggedByAdminId,
    donations: donations
  };

  console.log('Service sending payload to:', `${this.donationUrl}/bulk`);
  console.log('Service payload:', payload);

  // Use `/bulk` with a leading slash - this will create the correct URL
  return this.httpClient.post(`${this.donationUrl}bulk`, payload, {
    headers: {
      'Content-Type': 'application/json'
    }
  }).pipe(
    tap(response => console.log('Service received response:', response)),
    catchError((error: Error) => {
      console.error('Service error:', error);
      return throwError(() => error);
    })
  );
}

deleteDonation(id: number, ownerId: number): Observable<void> {
  
  return this.httpClient.delete<void>(`${this.donationUrl}${id}/ownerId/${ownerId}`);
}
//7158/api/Donation/59?ownerId=17
  getRunners(): Observable<any> {
    return this.httpClient.get<any>('https://localhost:7158/api/Runner/GetAllRunners');
  }
}
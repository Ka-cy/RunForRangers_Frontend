import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface UploadResponse {
  imageUrl: string;
  fileName: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private baseUrl = 'https://localhost:7158/api/Product';
  
  constructor(private http: HttpClient) { }

  uploadImage(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(`${this.baseUrl}/UploadProductImage`, formData);
  }

  uploadImageWithProgress(file: File): Observable<{ progress: number; response?: UploadResponse }> {
    const formData = new FormData();
    formData.append('file', file);

    const req = new HttpRequest('POST', `${this.baseUrl}/UploadProductImage`, formData, {
      reportProgress: true
    });

    return this.http.request<UploadResponse>(req).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round(100 * event.loaded / (event.total || 1));
          return { progress };
        } else if (event.type === HttpEventType.Response) {
          return { progress: 100, response: event.body! };
        }
        return { progress: 0 };
      })
    );
  }

  deleteImage(fileName: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/DeleteProductImage/${fileName}`);
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it starts with /, it's a relative path from server root - try direct access first
    if (imagePath.startsWith('/')) {
      return `https://localhost:7158${imagePath}`;
    }
    
    // For GUID-format filenames (server uploads), try direct static file access first
    // If this fails, the frontend will show error and you can switch to API endpoint
    return `https://localhost:7158/uploads/products/${imagePath}`;
    
    // Alternative: Use API endpoint instead (uncomment if static files don't work)
    // return `${this.baseUrl}/GetProductImage/${imagePath}`;
  }
}

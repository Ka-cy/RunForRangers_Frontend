import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  IDelivery,
  IDeliveryStatus,
  ICourier,
  IDeliveryAddress,
  IDeliveryFee,
  IProvince,
  ICity,
  ISuburb,
  ICountry,
  IOrder,
  IUser
} from '../Interfaces/idelivery';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private baseUrl = 'https://localhost:7149/api/Delivery';

  constructor(private http: HttpClient) { }

  // Delivery Status Operations
  getDeliveryStatuses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetDeliveryStatuses`).pipe(
      catchError(error => {
        console.warn('Delivery statuses endpoint not available, using mock data:', error);
        return of([
          { deliveryStatusId: 1, statusName: 'Pending', description: 'Order is being prepared', lastUpdated: new Date() },
          { deliveryStatusId: 2, statusName: 'Processing', description: 'Order is being processed', lastUpdated: new Date() },
          { deliveryStatusId: 3, statusName: 'In Transit', description: 'Package is on its way', lastUpdated: new Date() },
          { deliveryStatusId: 4, statusName: 'Delivered', description: 'Package has been delivered', lastUpdated: new Date() },
          { deliveryStatusId: 5, statusName: 'Failed', description: 'Delivery attempt failed', lastUpdated: new Date() }
        ]);
      })
    );
  }

  createDeliveryStatus(deliveryStatus: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/CreateDeliveryStatus`, deliveryStatus);
  }

  updateDeliveryStatus(id: number, deliveryStatus: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/UpdateDeliveryStatus/${id}`, deliveryStatus);
  }

  // Delivery Management Operations
  getDeliveryById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetDeliveryById/${id}`);
  }

  getAllDeliveries(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetDeliveries`).pipe(
      catchError(error => {
        console.warn('Deliveries endpoint not available, using mock data:', error);
        return of([
          {
            deliveryId: 1,
            orderId: 101,
            trackingNumber: 'RFR202409231001',
            deliveryStatus: 'In Transit',
            deliveryDate: new Date(),
            customerName: 'John Smith',
            destination: 'Sandton, Johannesburg'
          },
          {
            deliveryId: 2,
            orderId: 102,
            trackingNumber: 'RFR202409231002',
            deliveryStatus: 'Delivered',
            deliveryDate: new Date(Date.now() - 86400000),
            customerName: 'Sarah Johnson',
            destination: 'Cape Town, Cape Town'
          }
        ]);
      })
    );
  }

  createDelivery(delivery: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/CreateDelivery`, delivery);
  }

  updateDelivery(delivery: any): Observable<any>;
  updateDelivery(id: number, delivery: any): Observable<any>;
  updateDelivery(deliveryOrId: any, delivery?: any): Observable<any> {
    if (typeof deliveryOrId === 'number' && delivery) {
      // Called with (id, delivery) signature
      return this.http.put(`${this.baseUrl}/UpdateDelivery/${deliveryOrId}`, delivery);
    } else {
      // Called with (delivery) signature - legacy support
      const deliveryData = deliveryOrId;
      return this.http.put(`${this.baseUrl}/UpdateDelivery/${deliveryData.deliveryId}`, deliveryData);
    }
  }

  deleteDelivery(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/DeleteDelivery/${id}`);
  }

  getDeliveryFeeByProvince(provinceId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetDeliveryFeeByProvince/${provinceId}`);
  }

  // Analytics and Dashboard Operations
  getDeliveryStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/GetDeliveryStats`).pipe(
      catchError(error => {
        console.warn('Delivery stats endpoint not available, using mock data:', error);
        return of({
          totalDeliveries: 45,
          pendingDeliveries: 8,
          inTransitDeliveries: 12,
          deliveredCount: 23,
          failedDeliveries: 2,
          deliverySuccessRate: 85.7
        });
      })
    );
  }

  getRecentDeliveries(limit: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetRecentDeliveries?limit=${limit}`).pipe(
      catchError(error => {
        console.warn('Recent deliveries endpoint not available, using mock data:', error);
        return of([
          {
            deliveryId: 1,
            orderId: 101,
            trackingNumber: 'RFR202501011234',
            deliveryStatus: 'In Transit',
            deliveryDate: new Date('2025-01-15'),
            customerName: 'John Smith',
            destination: 'Sandton, Johannesburg'
          },
          {
            deliveryId: 2,
            orderId: 102,
            trackingNumber: 'RFR202501015678',
            deliveryStatus: 'Delivered',
            deliveryDate: new Date('2025-01-14'),
            customerName: 'Sarah Johnson',
            destination: 'Cape Town, Cape Town'
          }
        ]);
      })
    );
  }

  getPendingDeliveries(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetPendingDeliveries`).pipe(
      catchError(error => {
        console.warn('Pending deliveries endpoint not available, using mock data:', error);
        return of([
          {
            deliveryId: 3,
            orderId: 103,
            trackingNumber: 'RFR202501019999',
            deliveryStatus: 'Pending',
            deliveryDate: new Date('2025-01-16'),
            customerName: 'Mike Wilson',
            customerEmail: 'mike.wilson@email.com',
            destination: '123 Oak Street, Pretoria, Pretoria',
            courierAssigned: false
          }
        ]);
      })
    );
  }

  // Courier Management Operations
  getCourierById(id: number): Observable<ICourier> {
    return this.http.get<ICourier>(`${this.baseUrl}/GetCourierById/${id}`);
  }

  createCourier(courier: ICourier): Observable<ICourier> {
    return this.http.post<ICourier>(`${this.baseUrl}/CreateCourier`, courier);
  }

  getAllCouriers(): Observable<ICourier[]> {
    return this.http.get<ICourier[]>(`${this.baseUrl}/GetCouriers`).pipe(
      catchError(error => {
        console.warn('Couriers endpoint not available, using mock data:', error);
        return of([
          { courierId: 1, courierName: 'FastTrack Couriers', contactNumber: '011-123-4567', email: 'dispatch@fasttrack.co.za', imageUrl: '' },
          { courierId: 2, courierName: 'SpeedPost Express', contactNumber: '021-987-6543', email: 'bookings@speedpost.co.za', imageUrl: '' },
          { courierId: 3, courierName: 'Lightning Delivery', contactNumber: '031-555-0123', email: 'info@lightning.co.za', imageUrl: '' }
        ]);
      })
    );
  }

  updateCourier(courier: ICourier): Observable<any>;
  updateCourier(id: number, courier: ICourier): Observable<any>;
  updateCourier(courierOrId: any, courier?: ICourier): Observable<any> {
    if (typeof courierOrId === 'number' && courier) {
      // Called with (id, courier) signature
      return this.http.put(`${this.baseUrl}/UpdateCourier/${courierOrId}`, courier);
    } else {
      // Called with (courier) signature - legacy support
      const courierData = courierOrId;
      return this.http.put(`${this.baseUrl}/UpdateCourier/${courierData.courierId}`, courierData);
    }
  }

  deleteCourier(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/DeleteCourier/${id}`);
  }

  // Order Management Operations
  getAllOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetAllOrders`).pipe(
      catchError(error => {
        console.warn('Orders endpoint not available, using mock data:', error);
        return of([
          {
            orderId: 1001,
            userId: 1,
            userName: 'John Doe',
            totalAmount: 299.99,
            createdAt: new Date(Date.now() - 86400000),
            orderStatus: 'Confirmed'
          },
          {
            orderId: 1002,
            userId: 2,
            userName: 'Jane Smith',
            totalAmount: 149.50,
            createdAt: new Date(Date.now() - 172800000),
            orderStatus: 'Delivered'
          }
        ]);
      })
    );
  }

  getOrdersWithoutDeliveries(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetOrdersWithoutDeliveries`).pipe(
      catchError(error => {
        console.warn('Orders without deliveries endpoint not available, using mock data:', error);
        return of([
          {
            orderId: 1003,
            userId: 3,
            userName: 'Mike Johnson',
            totalAmount: 89.99,
            createdAt: new Date(),
            orderStatus: 'Confirmed'
          }
        ]);
      })
    );
  }

  createDeliveryFromOrder(orderId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/CreateDeliveryFromOrder/${orderId}`, {});
  }

  // Update Operations
  updateWaybill(deliveryId: number, waybill: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/UpdateWaybill/${deliveryId}`, { waybill });
  }

  assignCourier(deliveryId: number, courierId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/AssignCourier/${deliveryId}`, { courierId });
  }

  // Search and Filter Operations
  searchDeliveriesByStatus(status: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/SearchByStatus/${status}`);
  }

  filterDeliveriesByStatus(status: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/FilterByStatus?status=${status}`);
  }

  filterDeliveriesByDateRange(startDate: string, endDate: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/FilterByDateRange?startDate=${startDate}&endDate=${endDate}`);
  }

  filterDeliveriesByCourier(courierId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/FilterByCourier/${courierId}`);
  }

  // Legacy method aliases for compatibility
  getDeliveries(): Observable<any[]> {
    return this.getAllDeliveries();
  }

  getCouriers(): Observable<ICourier[]> {
    return this.getAllCouriers();
  }

  getOrders(): Observable<any[]> {
    return this.getAllOrders();
  }

  // Utility methods
  generateTrackingNumber(): string {
    return 'RFR' + new Date().getFullYear() + 
           String(new Date().getMonth() + 1).padStart(2, '0') + 
           String(new Date().getDate()).padStart(2, '0') + 
           Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';

// Dashboard specific DTOs
export interface UserDto {
  userId: number;
  firstName: string;
  surname: string;
  email: string;
}

import { IUser } from '../Interfaces/IUser';

export interface OrderDashboardDto {
  orderId: number;
  userId: number;
  user: UserDto;
  cartId: number;
  shippingAddressId: number;
  billingAddressId?: number;
  orderStatusId: number;
  orderStatusName: string;
  orderInvoiceId: number;
  deliveryAmountId: number;
  deliveryAmount: number;
  totalAmount: number;
  createdAt: Date;
  shippingAddress: UserAddressDto;
  billingAddress?: UserAddressDto;
  message?: string;
}

export interface OrderInvoiceDto {
  orderInvoiceId: number;
  orderId: number;
  invoiceNumber: string;
  billingAddress: string;
  issuedAt: Date;
  dueDate: Date;
  tax: number;
  deliveryAmount: number;
  paymentStatus: string;
  paymentReference: string;
  vatRate: number;
}

// Initial Order DTOs
export interface CreateInitialOrderDto {
  userId: number;
  cartId: number;
}

export interface InitialOrderResponseDto {
  orderId: number;
  userId: number;
  cartId: number;
  orderStatusId: number;
  orderStatusName: string;
  createdAt: Date;
  message: string;
}

// Address Selection DTOs
export interface SelectAddressDto {
  useExistingAddress: boolean;
  userAddressId?: number;
  streetAddress?: string;
  suburb?: string;
  postalCode?: string;
  cityId: number;
  provinceId: number;
}

export interface SelectBillingAddressDto {
  useSameAsShipping: boolean;
  userAddressId?: number;
}

export interface AddressSelectionResponseDto {
  orderId: number;
  shippingAddressId: number;
  deliveryAmount: number;
  totalAmount: number;
  orderStatusId: number;
  message: string;
}

// Payment DTOs
export interface ProcessPaymentDto {
  paymentMethod: string;
  billingDetails: string;
  paymentReference?: string;
}

export interface UpdatePaymentDto {
  paymentMethod: string;
  billingDetails: string;
  paymentReference?: string;
  paymentStatus: string;
}

export interface PaymentUpdateResponseDto {
  orderId: number;
  invoiceId: number;
  invoiceNumber: string;
  orderStatusId: number;
  totalAmountPaid: number;
  paymentDate: Date;
  message: string;
}

// Complete Checkout DTOs
export interface CreateUserAddressDto {
  streetAddress: string;
  suburb: string;
  postalCode: string;
  cityId: number;
  provinceId: number;
  isDefault: boolean;
}

export interface CompleteCheckoutDto {
  userId: number;
  cartId: number;
  useExistingShippingAddress: boolean;
  shippingAddressId?: number;
  shippingAddress?: CreateUserAddressDto;
  useSameAddressForBilling: boolean;
  useExistingBillingAddress: boolean;
  billingAddressId?: number;
  billingAddress?: CreateUserAddressDto;
  paymentMethod: string;
  paymentReference?: string;
  customerNotes?: string;
}

export interface CheckoutAddressDto {
  addressId: number;
  streetAddress: string;
  suburb: string;
  postalCode: string;
  cityId: number;
  provinceId: number;
  countryId: number;
}

export interface CheckoutOrderItemDto {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productColorId: number;
  productSizeId: number;
}

export interface CompleteCheckoutResponseDto {
  orderId: number;
  orderNumber: string;
  userId: number;
  cartId: number;
  orderStatus: string;
  orderStatusId: number;
  shippingAddress: CheckoutAddressDto;
  billingAddressId?: number;
  useSameAddressForBilling: boolean;
  subTotal: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
  invoiceId: number;
  invoiceNumber: string;
  orderItems: CheckoutOrderItemDto[];
  paymentMethod: string;
  paymentReference: string;
  paymentStatus: string;
  orderDate: Date;
  paymentDate: Date;
  message: string;
}

// Order Response DTO (for checkout)
export interface UserAddressDto {
  userAddressId: number;
  streetAddress: string;
  suburb: string;
  postalCode: string;
  cityId: number;
  cityName: string;
  provinceId: number;
  provinceName: string;
  countryId: number;
  countryName: string;
  isDefault: boolean;
}

export interface OrderResponseDto {
  orderId: number;
  userId: number;
  cartId: number;
  shippingAddressId: number;
  billingAddressId?: number;
  orderStatusId: number;
  orderStatusName: string;
  orderInvoiceId: number;
  deliveryAmountId: number;
  deliveryAmount: number;
  totalAmount: number;
  createdAt: Date;
  shippingAddress: UserAddressDto;
  billingAddress?: UserAddressDto;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'https://localhost:7158/api/OnlineStore';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('currentUserLoggedIn');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${JSON.parse(token).token}` : ''
    });
  }

  // GET: api/OnlineStore/Orders - Returns OrderDashboardDto[]
  getAllOrders(): Observable<OrderDashboardDto[]> {
    return this.http.get<OrderDashboardDto[]>(
      `${this.apiUrl}/Orders`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.warn('Orders endpoint not available, using sample data:', error);
        // Return sample orders for testing
        const sampleOrders: OrderDashboardDto[] = [
          {
            orderId: 1,
            userId: 1,
            user: { userId: 1, firstName: 'John', surname: 'Doe', email: 'john.doe@example.com' },
            cartId: 1,
            shippingAddressId: 1,
            orderStatusId: 3,
            orderStatusName: 'Payment Received',
            orderInvoiceId: 1,
            deliveryAmountId: 1,
            deliveryAmount: 50.00,
            totalAmount: 150.00,
            createdAt: new Date('2024-01-15'),
            shippingAddress: {
              userAddressId: 1,
              streetAddress: '123 Main St',
              suburb: 'Downtown',
              postalCode: '12345',
              cityId: 1,
              cityName: 'Sample City',
              provinceId: 1,
              provinceName: 'Sample Province',
              countryId: 1,
              countryName: 'Sample Country',
              isDefault: true
            }
          },
          {
            orderId: 2,
            userId: 2,
            user: { userId: 2, firstName: 'Jane', surname: 'Smith', email: 'jane.smith@example.com' },
            cartId: 2,
            shippingAddressId: 2,
            orderStatusId: 4,
            orderStatusName: 'Processing',
            orderInvoiceId: 2,
            deliveryAmountId: 2,
            deliveryAmount: 50.00,
            totalAmount: 275.50,
            createdAt: new Date('2024-01-20'),
            shippingAddress: {
              userAddressId: 2,
              streetAddress: '456 Oak Ave',
              suburb: 'Westside',
              postalCode: '67890',
              cityId: 2,
              cityName: 'Another City',
              provinceId: 2,
              provinceName: 'Another Province',
              countryId: 1,
              countryName: 'Sample Country',
              isDefault: false
            }
          }
        ];
        return of(sampleOrders);
      })
    );
  }

  // GET: api/OnlineStore/Orders/{orderId}/Invoice
  getOrderInvoice(orderId: number): Observable<OrderInvoiceDto> {
    return this.http.get<OrderInvoiceDto>(
      `${this.apiUrl}/Orders/${orderId}/Invoice`,
      { headers: this.getHeaders() }
    );
  }

  // POST: api/OnlineStore/InitialOrder
  createInitialOrder(dto: CreateInitialOrderDto): Observable<InitialOrderResponseDto> {
    return this.http.post<InitialOrderResponseDto>(
      `${this.apiUrl}/InitialOrder`,
      dto,
      { headers: this.getHeaders() }
    );
  }

  // GET: api/OnlineStore/Orders/{id}
  getOrder(orderId: number): Observable<OrderResponseDto> {
    return this.http.get<OrderResponseDto>(
      `${this.apiUrl}/Orders/${orderId}`,
      { headers: this.getHeaders() }
    );
  }

  // POST: api/OnlineStore/Orders/{orderId}/SelectShippingAddress
  selectShippingAddress(orderId: number, dto: SelectAddressDto): Observable<AddressSelectionResponseDto> {
    return this.http.post<AddressSelectionResponseDto>(
      `${this.apiUrl}/Orders/${orderId}/SelectShippingAddress`,
      dto,
      { headers: this.getHeaders() }
    );
  }

  // POST: api/OnlineStore/Orders/{orderId}/SelectBillingAddress
  selectBillingAddress(orderId: number, dto: SelectBillingAddressDto): Observable<AddressSelectionResponseDto> {
    return this.http.post<AddressSelectionResponseDto>(
      `${this.apiUrl}/Orders/${orderId}/SelectBillingAddress`,
      dto,
      { headers: this.getHeaders() }
    );
  }

  // POST: api/OnlineStore/Orders/{orderId}/ProcessPayment
  processPayment(orderId: number, dto: ProcessPaymentDto): Observable<PaymentUpdateResponseDto> {
    return this.http.post<PaymentUpdateResponseDto>(
      `${this.apiUrl}/Orders/${orderId}/ProcessPayment`,
      dto,
      { headers: this.getHeaders() }
    );
  }

  // PUT: api/OnlineStore/Orders/{orderId}/ProcessPayment
  updatePayment(orderId: number, dto: UpdatePaymentDto): Observable<PaymentUpdateResponseDto> {
    return this.http.put<PaymentUpdateResponseDto>(
      `${this.apiUrl}/Orders/${orderId}/ProcessPayment`,
      dto,
      { headers: this.getHeaders() }
    );
  }

  // POST: api/OnlineStore/CompleteCheckout
  completeCheckout(dto: CompleteCheckoutDto): Observable<CompleteCheckoutResponseDto> {
    return this.http.post<CompleteCheckoutResponseDto>(
      `${this.apiUrl}/CompleteCheckout`,
      dto,
      { headers: this.getHeaders() }
    );
  }

  // Legacy methods to maintain backwards compatibility
  createOrder(order: any): Observable<any> {
    console.warn('createOrder is deprecated, use completeCheckout or createInitialOrder instead');
    return this.completeCheckout(order);
  }

  updateOrderStatus(orderId: number, orderStatusId: number): Observable<any> {
    console.warn('updateOrderStatus may need backend implementation for direct status updates');
    // Try a different endpoint structure that might exist
    return this.http.put(`${this.apiUrl}/Orders/${orderId}`,
      { orderStatusId },
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.warn('Order status update endpoint not available:', error);
        return of({ success: false, message: 'Status update endpoint not implemented' });
      })
    );
  }

  updatePaymentStatus(orderId: number, paymentStatusId: number): Observable<any> {
    console.warn('updatePaymentStatus should use updatePayment method instead');
    return this.updatePayment(orderId, {
      paymentMethod: 'Unknown',
      billingDetails: 'Status update',
      paymentStatus: paymentStatusId.toString()
    });
  }

  getOrderStatuses(): Observable<any[]> {
    console.warn('getOrderStatuses may need backend implementation');
    return this.http.get<any[]>(`${this.apiUrl}/OrderStatuses`, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.warn('Order statuses endpoint not available, using mock data:', error);
        return of([
          { orderStatusId: 1, orderStatusName: 'Pending' },
          { orderStatusId: 2, orderStatusName: 'Processing' },
          { orderStatusId: 3, orderStatusName: 'Payment Received' },
          { orderStatusId: 4, orderStatusName: 'Completed' },
          { orderStatusId: 5, orderStatusName: 'Cancelled' }
        ]);
      })
    );
  }

  getPaymentStatuses(): Observable<any[]> {
    console.warn('getPaymentStatuses may need backend implementation');
    return this.http.get<any[]>(`${this.apiUrl}/GetPaymentStatuses`, { headers: this.getHeaders() });
  }
}
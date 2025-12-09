import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

export interface CreateCartDto {
  userId: number;
  cartItems: CreateCartItemDto[];
}

export interface CreateCartItemDto {
  productId: number;
  productColorId: number;
  productSizeId: number;
  quantity: number;
  price: number;
}

export interface CartDto {
  cartId: number;
  userId: number;
  cartItems: CartItemDto[];
}

export interface CartItemDto {
  cartItemId: number;
  cartId: number;
  productId: number;
  productColorId: number;
  productSizeId: number;
  quantity: number;
  price: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'https://localhost:7158/api/OnlineStore';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('currentUserLoggedIn');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${JSON.parse(token).token}` : ''
    });
  }

  // GET: api/OnlineStore/Carts/{userId}
  getCart(userId: number): Observable<CartDto> {
    if (!userId) {
      return throwError(() => new Error('userId must be provided'));
    }
    return this.http
      .get<CartDto>(`${this.apiUrl}/Carts/${userId}`, { headers: this.getHeaders() })
      .pipe(
        catchError((error) => {
          console.error('Error fetching cart:', error);
          return throwError(() => new Error('Failed to fetch cart'));
        })
      );
  }

  // POST: api/OnlineStore/Carts
  createCart(createCartDto: CreateCartDto): Observable<CartDto> {
    if (!createCartDto.userId) {
      return throwError(() => new Error('userId must be provided'));
    }
    return this.http
      .post<CartDto>(`${this.apiUrl}/Carts`, createCartDto, { headers: this.getHeaders() })
      .pipe(
        catchError((error) => {
          console.error('Error creating cart:', error);
          return throwError(() => new Error('Failed to create cart'));
        })
      );
  }

  // POST: api/OnlineStore/Carts/{cartId}/Items
  addCartItem(cartId: number, item: CreateCartItemDto): Observable<CartItemDto> {
    if (!cartId || !item) {
      return throwError(() => new Error('cartId and item must be provided'));
    }
    return this.http
      .post<CartItemDto>(`${this.apiUrl}/Carts/${cartId}/Items`, item, { headers: this.getHeaders() })
      .pipe(
        catchError((error) => {
          console.error('Error adding item to cart:', error);
          return throwError(() => new Error('Failed to add item to cart'));
        })
      );
  }

  // PUT: api/OnlineStore/Carts/{cartId}/Items/{cartItemId}
  updateCartItem(cartId: number, cartItemId: number, item: CreateCartItemDto): Observable<CartItemDto> {
    if (!cartId || !cartItemId || !item) {
      return throwError(() => new Error('cartId, cartItemId, and item must be provided'));
    }
    return this.http
      .put<CartItemDto>(`${this.apiUrl}/Carts/${cartId}/Items/${cartItemId}`, item, { headers: this.getHeaders() })
      .pipe(
        catchError((error) => {
          console.error('Error updating cart item:', error);
          return throwError(() => new Error('Failed to update cart item'));
        })
      );
  }

  // DELETE: api/OnlineStore/Carts/{cartId}/Items/{cartItemId}
  removeCartItem(cartId: number, cartItemId: number): Observable<void> {
    if (!cartId || !cartItemId) {
      return throwError(() => new Error('cartId and cartItemId must be provided'));
    }
    return this.http
      .delete<void>(`${this.apiUrl}/Carts/${cartId}/Items/${cartItemId}`, { headers: this.getHeaders() })
      .pipe(
        catchError((error) => {
          console.error('Error removing cart item:', error);
          return throwError(() => new Error('Failed to remove cart item'));
        })
      );
  }

  // DELETE: api/OnlineStore/Carts/{cartId}/Clear
  clearCart(cartId: number): Observable<void> {
    if (!cartId) {
      return throwError(() => new Error('cartId must be provided'));
    }
    return this.http
      .delete<void>(`${this.apiUrl}/Carts/${cartId}/Clear`, { headers: this.getHeaders() })
      .pipe(
        catchError((error) => {
          console.error('Error clearing cart:', error);
          return throwError(() => new Error('Failed to clear cart'));
        })
      );
  }

  // Helper method to create cart with items for a user
  createCartWithItems(userId: number, items: CreateCartItemDto[]): Observable<CartDto> {
    const createCartDto: CreateCartDto = {
      userId: userId,
      cartItems: items
    };
    return this.createCart(createCartDto);
  }

  // Helper method to add single item to user's cart
  addItemToUserCart(userId: number, item: CreateCartItemDto): Observable<CartItemDto> {
    return this.getCart(userId).pipe(
      switchMap((cart) => {
        if (cart.cartId === 0) {
          // Create cart with this item
          return this.createCartWithItems(userId, [item]).pipe(
            map(newCart => newCart.cartItems[0])
          );
        } else {
          // Add to existing cart
          return this.addCartItem(cart.cartId, item);
        }
      })
    );
  }
}

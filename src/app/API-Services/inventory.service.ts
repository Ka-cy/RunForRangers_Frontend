import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IInventory } from '../Interfaces/iinventory';
import { Observable } from 'rxjs';
import { IProductColour } from '../Interfaces/iproductcolour';
import { IProductSize } from '../Interfaces/iproductsize';
import { ProductService } from './product.service';
import { Iproduct } from '../Interfaces/iproduct';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private baseUrl = 'https://localhost:7158/api/Inventory';

  constructor(private http: HttpClient, private productService: ProductService) {}

  getAll(): Observable<IInventory[]> {
    return this.http.get<IInventory[]>(`${this.baseUrl}/GetAllInventory`);
  }

  getById(id: number): Observable<IInventory> {
    return this.http.get<IInventory>(`${this.baseUrl}/GetInventory/${id}`);
  }

  create(data: IInventory): Observable<any> {
    return this.http.post(`${this.baseUrl}/CreateInventory`, data);
  }

 update(id: number, data: IInventory, userId: number): Observable<any> {
  return this.http.put(`${this.baseUrl}/UpdateInventory/${id}?userId=${userId}`, data);
}
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/DeleteInventory/${id}`);
  }

  receiveStock(data: any, userId:number): Observable<any> {
     return this.http.post(`${this.baseUrl}/ReceiveStock?userId=${userId}`, data)
  }

 writeOff(data: any, userId: number): Observable<any> {
  return this.http.post(`${this.baseUrl}/WriteOffInventory?userId=${userId}`, data).pipe(
               
      );;
}

  stockTake(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/StockTake`, data);
  }

  getProductColours(): Observable<IProductColour[]> {
    return this.http.get<IProductColour[]>(`${this.baseUrl}/GetProductColours`);
  }

  getProductSizes(): Observable<IProductSize[]> {
    return this.http.get<IProductSize[]>(`${this.baseUrl}/GetProductSizes`);
  }

  // ===== PRODUCT SYSTEM INTEGRATION METHODS =====
  
  /**
   * Get all available products for inventory management
   * Uses the product service for consistency
   */
  getAvailableProducts(): Observable<Iproduct[]> {
    return this.productService.GetAllProducts();
  }

  /**
   * Get available colors for a specific product
   * Integrates with the product system color management
   */
  getProductColorsForProduct(productId: number): Observable<IProductColour[]> {
    return new Observable(observer => {
      this.productService.GetProductById(productId).subscribe({
        next: (product) => {
          // Map from product's availableColors to IProductColour format
          const colors: IProductColour[] = (product.availableColors || []).map((color: any) => ({
            productColorId: color.productColorId || color.productColorId,
            colorName: color.colorName || color.colourName,
            colorDescription: color.colorDescription || color.colourDescription || ''
          }));
          observer.next(colors);
          observer.complete();
        },
        error: (error) => {
          console.error('Error getting product colors for product:', error);
          // Fallback to all colors if product-specific fetch fails
          this.getProductColours().subscribe({
            next: (colors) => observer.next(colors),
            error: (err) => observer.error(err)
          });
        }
      });
    });
  }

  /**
   * Get available sizes for a specific product
   * Integrates with the product system size management
   */
  getProductSizesForProduct(productId: number): Observable<IProductSize[]> {
    return new Observable(observer => {
      this.productService.GetProductById(productId).subscribe({
        next: (product) => {
          // Map from product's availableSizes to IProductSize format
          const sizes: IProductSize[] = (product.availableSizes || []).map((size: any) => ({
            productSizeId: size.productSizeId,
            sizeName: size.sizeName,
            sizeDescription: size.sizeDescription || ''
          }));
          observer.next(sizes);
          observer.complete();
        },
        error: (error) => {
          console.error('Error getting product sizes for product:', error);
          // Fallback to all sizes if product-specific fetch fails
          this.getProductSizes().subscribe({
            next: (sizes) => observer.next(sizes),
            error: (err) => observer.error(err)
          });
        }
      });
    });
  }

  /**
   * Check if a product-color-size combination already exists in inventory
   * Prevents duplicate inventory entries
   */
  checkInventoryExists(productId: number, colorId: number, sizeId: number): Observable<boolean> {
    return new Observable(observer => {
      this.getAll().subscribe({
        next: (inventory) => {
          const exists = inventory.some(item => 
            item.productId === productId && 
            item.productColorId === colorId && 
            item.productSizeId === sizeId
          );
          observer.next(exists);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Get current stock level for a specific product-color-size combination
   */
  getStockLevel(productId: number, colorId: number, sizeId: number): Observable<number> {
    return new Observable(observer => {
      this.getAll().subscribe({
        next: (inventory) => {
          const item = inventory.find(inv => 
            inv.productId === productId && 
            inv.productColorId === colorId && 
            inv.productSizeId === sizeId
          );
          observer.next(item ? item.quantity : 0);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import {
  Iproduct,
  IproductCategory,
  IproductType,
  Iproductcolor,
  Iproductsize,
  IsizeType,
  ICreateProductDto,
  IUpdateProductDto,
  IProductWithDetails,
  ICreateCategoryDto,
  ICreateTypeDto,
  ICreateSizeTypeDto,
  ICreateSizeDto,
  ICreateColorDto,
  IAssignSizesDto,
  IAssignColorsDto,
  ISizesByTypeDto,
  ITypesByCategoryDto
} from '../Interfaces/iproduct';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'https://localhost:7158/api/Product/';

  constructor(private httpClient: HttpClient) { }

   private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('currentUserLoggedIn');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${JSON.parse(token).token}` : ''
    });
  }

  // ====================================================================
  // PRODUCT OPERATIONS
  // ====================================================================

  // Create a new product with size and color assignments
  CreateProduct(product: ICreateProductDto): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + 'AddProduct', product);
  }

  // Get all products
  GetAllProducts(): Observable<Iproduct[]> {
    return this.httpClient.get<Iproduct[]>(this.apiUrl + 'GetAllProducts');
  }

  // Get a product by ID with details
  GetProductById(productId: number): Observable<IProductWithDetails> {
    return this.httpClient.get<IProductWithDetails>(this.apiUrl + 'GetProductById/' + productId);
  }

  // Update a product
  UpdateProduct(product: IUpdateProductDto): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + 'UpdateProduct', product);
  }

  // Delete a product (soft delete)
  DeleteProduct(productId: number): Observable<any> {
    return this.httpClient.delete(this.apiUrl + 'DeleteProduct/' + productId, { responseType: 'text' });
  }

  // ====================================================================
  // CATEGORY OPERATIONS
  // ====================================================================

  // Get all categories
  GetProductCategories(): Observable<IproductCategory[]> {
    return this.httpClient.get<IproductCategory[]>(this.apiUrl + 'GetProductCategories');
  }

  // Create a new category with initial types (BUSINESS RULE)
  CreateProductCategory(category: ICreateCategoryDto): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + 'AddProductCategory', category);
  }

  // Update a category
  UpdateProductCategory(category: IproductCategory): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + 'UpdateProductCategory', category);
  }

  // Delete a category
  DeleteProductCategory(categoryId: number): Observable<any> {
    return this.httpClient.delete<any>(this.apiUrl + 'DeleteProductCategory/' + categoryId);
  }

  // Get types for a specific category (BUSINESS RULE: Types belong to categories)
  GetTypesByCategory(categoryId: number): Observable<ITypesByCategoryDto> {
    return this.httpClient.get<ITypesByCategoryDto>(this.apiUrl + 'GetTypesByCategory/' + categoryId);
  }

  // ====================================================================
  // TYPE OPERATIONS
  // ====================================================================

  // Get all product types
  GetProductTypes(): Observable<IproductType[]> {
    return this.httpClient.get<IproductType[]>(this.apiUrl + 'GetProductTypes');
  }

  // Create a new product type (must belong to a category)
  CreateProductType(productType: ICreateTypeDto): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + 'AddProductType', productType);
  }

  // Update a product type
  UpdateProductType(productType: IproductType): Observable<any> {
    console.log('Updating product type:', productType);

    // Transform to PascalCase to match backend ProductType model
    // Send full object with ID in body as expected by backend
    const updatePayload = {
      ProductTypeId: productType.productTypeId,
      TypeName: productType.typeName,
      TypeDescription: productType.typeDescription,
      ProductCategoryId: productType.productCategoryId,
      IsActive: productType.isActive
    };

    console.log('UpdateProductType payload being sent:', updatePayload);
    console.log('Full request details:', {
      url: this.apiUrl + 'UpdateProductType',
      method: 'PUT',
      headers: this.getHeaders(),
      payload: updatePayload
    });

    // Backend expects PUT method with full ProductType object in body
    return this.httpClient.put<any>(this.apiUrl + 'UpdateProductType', updatePayload, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('HTTP Error Response:', error);
          console.error('Error status:', error.status);
          console.error('Error body:', error.error);
          throw error;
        })
      );
  }

  // Delete a product type
  DeleteProductType(productTypeId: number): Observable<any> {
    return this.httpClient.delete<any>(this.apiUrl + 'DeleteProductType/' + productTypeId);
  }

  // ====================================================================
  // SIZE TYPE OPERATIONS (NEW)
  // ====================================================================

  // Get all size types
  GetSizeTypes(): Observable<IsizeType[]> {
    return this.httpClient.get<IsizeType[]>(this.apiUrl + 'GetSizeTypes');
  }

  // Create a new size type with initial sizes (BUSINESS RULE)
  CreateSizeType(sizeType: ICreateSizeTypeDto): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + 'AddSizeType', sizeType);
  }

  // Update a size type
  UpdateSizeType(sizeType: IsizeType): Observable<any> {
    // Transform to match backend expectations
    const updatePayload = {
      SizeTypeId: sizeType.sizeTypeId,
      SizeTypeName: sizeType.sizeTypeName,
      SizeTypeDescription: sizeType.sizeTypeDescription,
      IsActive: sizeType.isActive
    };
    return this.httpClient.put<any>(this.apiUrl + 'UpdateSizeType', updatePayload, { headers: this.getHeaders() });
  }

  // Delete a size type
  DeleteSizeType(sizeTypeId: number): Observable<any> {
    return this.httpClient.delete<any>(this.apiUrl + 'DeleteSizeType/' + sizeTypeId);
  }

  // Get sizes for a specific size type (BUSINESS RULE: Sizes belong to size types)
  GetSizesBySizeType(sizeTypeId: number): Observable<ISizesByTypeDto> {
    return this.httpClient.get<ISizesByTypeDto>(this.apiUrl + 'GetSizesBySizeType/' + sizeTypeId);
  }

  // ====================================================================
  // SIZE OPERATIONS
  // ====================================================================

  // Get all product sizes
  GetProductSizes(): Observable<Iproductsize[]> {
    return this.httpClient.get<Iproductsize[]>(this.apiUrl + 'GetProductSizes');
  }

  // Create a new product size (must belong to a size type)
  CreateProductSize(size: ICreateSizeDto): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + 'AddProductSize', size);
  }

  // Update a product size
  UpdateProductSize(productSize: Iproductsize): Observable<any> {
    console.log('Updating product size:', productSize);

    // Transform to PascalCase to match backend ProductSize model
    // Note: Backend only updates SizeName and SizeDescription, not SizeTypeId
    const updatePayload = {
      ProductSizeId: productSize.productSizeId,
      SizeName: productSize.sizeName,
      SizeDescription: productSize.sizeDescription,
      IsActive: productSize.isActive
    };

    console.log('UpdateProductSize payload:', updatePayload);

    // Backend expects POST method with PascalCase properties
    return this.httpClient.post<any>(this.apiUrl + 'UpdateProductSize', updatePayload, { headers: this.getHeaders() });
  }

  // Delete a product size
  DeleteProductSize(productSizeId: number): Observable<any> {
    return this.httpClient.delete<any>(this.apiUrl + 'DeleteProductSize/' + productSizeId);
  }

  // ====================================================================
  // COLOR OPERATIONS
  // ====================================================================

  // Get all product colors
  GetProductColors(): Observable<Iproductcolor[]> {
    return this.httpClient.get<Iproductcolor[]>(this.apiUrl + 'GetProductColours');
  }

  // Get a product color by ID
  GetProductColorById(productColorId: number): Observable<Iproductcolor> {
    return this.httpClient.get<Iproductcolor>(this.apiUrl + 'GetProductColorById/' + productColorId);
  }

  // Create a new product color
  CreateProductColor(color: ICreateColorDto): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + 'AddProductColour', color);
  }

  // Update a product color
  UpdateProductColor(productColor: Iproductcolor): Observable<any> {
    // Transform to match backend expectations
    const updatePayload = {
      ProductColorId: productColor.productColorId,
      ColorName: productColor.colorName,
      ColorDescription: productColor.colorDescription,
      HexCode: productColor.hexCode,
      IsActive: productColor.isActive
    };
    return this.httpClient.post<any>(this.apiUrl + 'UpdateProductColour', updatePayload, { headers: this.getHeaders() });
  }

  // Delete a product color
  DeleteProductColor(productColorId: number): Observable<any> {
    return this.httpClient.delete<any>(this.apiUrl + 'DeleteProductColour/' + productColorId);
  }

  // ====================================================================
  // ASSIGNMENT OPERATIONS (Many-to-Many)
  // ====================================================================

  // Assign multiple colors to a product
  AssignColorsToProduct(assignmentData: IAssignColorsDto): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + 'AssignColoursToProduct', assignmentData);
  }

  // Assign multiple sizes to a product
  AssignSizesToProduct(assignmentData: IAssignSizesDto): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + 'AssignSizesToProduct', assignmentData);
  }

  // Remove size assignment from product
  RemoveSizeFromProduct(productId: number, sizeId: number): Observable<any> {
    return this.httpClient.delete<any>(this.apiUrl + `RemoveSizeFromProduct/${productId}/${sizeId}`);
  }

  // Remove color assignment from product
  RemoveColorFromProduct(productId: number, colorId: number): Observable<any> {
    return this.httpClient.delete<any>(this.apiUrl + `RemoveColorFromProduct/${productId}/${colorId}`);
  }

  // ====================================================================
  // HELPER METHODS FOR COMPONENT INTEGRATION
  // ====================================================================

  // Legacy method for backward compatibility - will be removed eventually
  AssignColoursToProduct(productId: number, colourIds: number[]): Observable<any> {
    const assignmentData: IAssignColorsDto = {
      productId: productId,
      colorIds: colourIds
    };
    return this.AssignColorsToProduct(assignmentData);
  }

  // Legacy method for backward compatibility - will be removed eventually
  AssignSizesToProductLegacy(productId: number, sizeIds: number[]): Observable<any> {
    const assignmentData: IAssignSizesDto = {
      productId: productId,
      sizeIds: sizeIds
    };
    return this.AssignSizesToProduct(assignmentData);
  }

  // ====================================================================
  // LEGACY METHODS FOR EXISTING COMPONENTS
  // ====================================================================

  // Legacy method for existing components - Create Category
  AddProductCategory(category: IproductCategory): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + 'AddProductCategory', category);
  }

  // Legacy method for existing components - Add Product Type
  AddProductType(productType: IproductType): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + 'AddProductType', productType);
  }

  // Legacy method for existing components - Add Product Size
  AddProductSize(size: Iproductsize): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + 'AddProductSize', size);
  }

  getProduct(productId: number): Observable<IProductWithDetails> {
    return this.httpClient.get<IProductWithDetails>(`${this.apiUrl}/Products/${productId}`, { headers: this.getHeaders() });
  }
}

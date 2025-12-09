import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../API-Services/inventory.service';
import { ProductService } from '../../API-Services/product.service';
import { IInventory } from '../../Interfaces/iinventory';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { IProductColour } from '../../Interfaces/iproductcolour';
import { IProductSize } from '../../Interfaces/iproductsize';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavBarAdminComponent],
  templateUrl: './add-inventory.component.html',
  styleUrls: ['./add-inventory.component.css']
})
export class AddInventoryComponent implements OnInit {
  productList: any[] = [];
  colourList: IProductColour[] = [];
  sizeList: IProductSize[] = [];
  isLoading: boolean = false;
  isEditMode: boolean = false;
  editingInventoryId?: number;
  
  newInventory: IInventory = {
    productId: 0,
    productColorId: 0,
    productSizeId: 0,
    description: '', // Will be populated from product system
    quantity: 0,
    imageUrl: '' // Will be populated from product system
  };

  // Product information from product system
  selectedProductDetails: any = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private inventoryService: InventoryService,
    private productService: ProductService,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}
      // Get userId from session storage
userId: any = JSON.parse(sessionStorage.getItem('adminData') || '{}').userId;
  ngOnInit(): void {
    this.loadProducts();
    
    // Check if this is edit mode
    this.route.params.subscribe((params: any) => {
      if (params['id']) {
        this.isEditMode = true;
        this.editingInventoryId = +params['id'];
        this.loadInventoryItem(this.editingInventoryId);
      }
    });
  }

  loadProducts() {
    this.isLoading = true;
    this.inventoryService.getAvailableProducts().subscribe({
      next: (res) => {
        this.productList = res.map(p => ({ productId: p.productId, productName: p.productName }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.isLoading = false;
        this.snackBar.open('❌ Failed to load products', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * Called when a product is selected from the dropdown
   * Loads the specific colors and sizes for that product
   */
  onProductSelected() {
    if (this.newInventory.productId && this.newInventory.productId > 0) {
      this.loadProductDetails();
      this.loadColorsForProduct(this.newInventory.productId);
      this.loadSizesForProduct(this.newInventory.productId);
      
      // Reset color and size selections
      this.newInventory.productColorId = 0;
      this.newInventory.productSizeId = 0;
    } else {
      // Clear data if no product selected
      this.colourList = [];
      this.sizeList = [];
      this.selectedProductDetails = null;
      this.newInventory.productColorId = 0;
      this.newInventory.productSizeId = 0;
    }
  }

  /**
   * Load complete product details including description and image
   */
  loadProductDetails() {
    this.productService.GetProductById(this.newInventory.productId).subscribe({
      next: (product) => {
        this.selectedProductDetails = product;
        // Auto-populate description and image from product
        this.newInventory.description = product.productDescription || '';
        this.newInventory.imageUrl = product.productImage || '';
      },
      error: (err) => {
        console.error('Failed to load product details:', err);
      }
    });
  }

  /**
   * Load colors available for the selected product
   */
  loadColorsForProduct(productId: number) {
    this.isLoading = true;
    this.inventoryService.getProductColorsForProduct(productId).subscribe({
      next: (colors) => {
        this.colourList = colors;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load product colors:', err);
        this.isLoading = false;
        this.snackBar.open('❌ Failed to load product colors', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * Load sizes available for the selected product  
   */
  loadSizesForProduct(productId: number) {
    this.isLoading = true;
    this.inventoryService.getProductSizesForProduct(productId).subscribe({
      next: (sizes) => {
        this.sizeList = sizes;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load product sizes:', err);
        this.isLoading = false;
        this.snackBar.open('❌ Failed to load product sizes', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  addInventory() {
    console.log('🔄 Starting inventory creation process...');
    console.log('📦 Inventory data:', this.newInventory);
    
    this.isLoading = true;
    
    if (this.isEditMode) {
      console.log('✏️ Edit mode - updating inventory');
      
      // Convert to backend InventoryVM format (PascalCase property names)
      const inventoryData = {
        ProductId: +this.newInventory.productId,
        ProductColorId: +this.newInventory.productColorId,
        ProductSizeId: +this.newInventory.productSizeId,
        Description: this.newInventory.description || '',
        Quantity: +this.newInventory.quantity,
        ImageUrl: this.newInventory.imageUrl || ''
      };
      


// Update your service call
this.inventoryService.update(this.editingInventoryId!, inventoryData as any, this.userId).subscribe({
        next: () => {
          this.snackBar.open('✅ Inventory updated successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/inventory']);
        },
        error: (err) => {
          console.error('❌ Error updating inventory:', err);
          this.snackBar.open('❌ Failed to update inventory: ' + err.message, 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
        }
      });
    } else {
      console.log('➕ Create mode - checking for existing inventory');
      // Check for existing inventory with the same product-color-size combination
      this.inventoryService.checkInventoryExists(
        +this.newInventory.productId,
        +this.newInventory.productColorId,
        +this.newInventory.productSizeId
      ).subscribe({
        next: (exists) => {
          if (exists) {
            // If combination exists, offer to update quantity instead
            this.snackBar.open('⚠️ This product-color-size combination already exists in inventory. Consider updating existing stock instead.', 'Close', {
              duration: 5000,
              panelClass: ['warning-snackbar']
            });
            this.isLoading = false;
          } else {
            console.log('✅ No existing inventory found - proceeding with creation');
            
            // Convert to backend InventoryVM format (PascalCase property names)
            const inventoryData = {
              ProductId: +this.newInventory.productId,
              ProductColorId: +this.newInventory.productColorId,  // Backend uses ProductColorId (no 'u')
              ProductSizeId: +this.newInventory.productSizeId,
              Description: this.newInventory.description || '',
              Quantity: +this.newInventory.quantity,
              ImageUrl: this.newInventory.imageUrl || ''
            };
            
            console.log('📤 Sending to API (InventoryVM format):', inventoryData);
            console.log('🔍 Object keys:', Object.keys(inventoryData));
            console.log('🔍 Object values:', Object.values(inventoryData));
            // Create new inventory item
            this.inventoryService.create(inventoryData as any).subscribe({
              next: (response) => {
                console.log('🎉 Inventory created successfully:', response);
                this.snackBar.open('✅ Inventory created successfully - Product system synced!', 'Close', {
                  duration: 4000,
                  panelClass: ['success-snackbar']
                });
                this.newInventory = { productId: 0, productColorId: 0, productSizeId: 0, description: '', quantity: 0, imageUrl: '' };
                this.router.navigate(['/inventory']);
              },
              error: (err) => {
                console.error('❌ Error creating inventory:', err);
                console.error('💔 Full error object:', err);
                console.error('🔍 Error status:', err.status);
                console.error('🔍 Error statusText:', err.statusText);
                console.error('🔍 Error message:', err.message);
                console.error('🔍 Error details:', err.error);
                
                let errorMessage = 'Unknown error';
                if (err.error && typeof err.error === 'string') {
                  errorMessage = err.error;
                } else if (err.error && err.error.message) {
                  errorMessage = err.error.message;
                } else if (err.error && err.error.title) {
                  errorMessage = err.error.title;
                } else if (err.message) {
                  errorMessage = err.message;
                }
                
                this.snackBar.open('❌ Failed to create inventory: ' + errorMessage, 'Close', {
                  duration: 8000,
                  panelClass: ['error-snackbar']
                });
                this.isLoading = false;
              }
            });
          }
        },
        error: (err) => {
          console.error('⚠️ Error checking inventory exists:', err);
          console.log('🔄 Continuing with creation despite check failure');
          
          // Convert to backend InventoryVM format (PascalCase property names)
          const inventoryData = {
            ProductId: +this.newInventory.productId,
            ProductColorId: +this.newInventory.productColorId,
            ProductSizeId: +this.newInventory.productSizeId,
            Description: this.newInventory.description || '',
            Quantity: +this.newInventory.quantity,
            ImageUrl: this.newInventory.imageUrl || ''
          };
          
          console.log('📤 Sending to API (fallback, InventoryVM format):', inventoryData);
          // Continue with creation if check fails
          this.inventoryService.create(inventoryData as any).subscribe({
            next: (response) => {
              console.log('🎉 Inventory created successfully (fallback):', response);
              this.snackBar.open('✅ Inventory created successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.newInventory = { productId: 0, productColorId: 0, productSizeId: 0, description: '', quantity: 0, imageUrl: '' };
              this.router.navigate(['/inventory']);
            },
            error: (err) => {
              console.error('❌ Error creating inventory (fallback):', err);
              console.error('💔 Full error object (fallback):', err);
              console.error('🔍 Fallback error status:', err.status);
              console.error('🔍 Fallback error details:', err.error);
              
              let errorMessage = 'Unknown error';
              if (err.error && typeof err.error === 'string') {
                errorMessage = err.error;
              } else if (err.error && err.error.message) {
                errorMessage = err.error.message;
              } else if (err.error && err.error.title) {
                errorMessage = err.error.title;
              } else if (err.message) {
                errorMessage = err.message;
              }
              
              this.snackBar.open('❌ Failed to create inventory: ' + errorMessage, 'Close', {
                duration: 8000,
                panelClass: ['error-snackbar']
              });
              this.isLoading = false;
            }
          });
        }
      });
    }
  }

  loadInventoryItem(id: number) {
    this.isLoading = true;
    this.inventoryService.getById(id).subscribe({
      next: (item: any) => {
        this.newInventory = {
          productId: item.productId,
          productColorId: item.productColorId,
          productSizeId: item.productSizeId,
          description: item.description,
          quantity: item.quantity,
          imageUrl: item.imageUrl
        };
        
        // Load the product-specific colors and sizes for editing
        if (this.newInventory.productId) {
          this.onProductSelected();
        }
        
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading inventory item:', err);
        this.snackBar.open('❌ Failed to load inventory item', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
        this.router.navigate(['/inventory']);
      }
    });
  }

  cancel() {
    this.newInventory = { productId: 0, productColorId: 0, productSizeId: 0, description: '', quantity: 0, imageUrl: '' };
    this.router.navigate(['/inventory']);
  }
}

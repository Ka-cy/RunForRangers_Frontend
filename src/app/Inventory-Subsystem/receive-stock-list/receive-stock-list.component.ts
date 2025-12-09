import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventoryService } from '../../API-Services/inventory.service';
import { IInventory } from '../../Interfaces/iinventory';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { J } from '@angular/cdk/keycodes';

interface ReceiveStockItem extends IInventory {
  receiveQuantity: number; // Quantity to receive (0 means no receipt)
  hasChanges: boolean; // Track if this item has been modified
}

@Component({
  selector: 'app-receive-stock-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NavBarAdminComponent],
  templateUrl: './receive-stock-list.component.html',
  styleUrls: ['./receive-stock-list.component.css']
})
export class ReceiveStockListComponent implements OnInit {
  inventoryList: ReceiveStockItem[] = [];
  filteredInventoryList: ReceiveStockItem[] = [];
  isLoading: boolean = false;
  searchTerm: string = '';
  userId: number = JSON.parse(sessionStorage.getItem('adminData') || '{}').userId;
  constructor(
    private inventoryService: InventoryService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.isLoading = true;
    this.inventoryService.getAll().subscribe({
      next: (data) => {
        this.inventoryList = data.map(item => ({
          ...item,
          receiveQuantity: 0, // Default to 0 (no receipt)
          hasChanges: false
        }));
        this.filteredInventoryList = [...this.inventoryList];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading inventory:', error);
        this.snackBar.open('Error loading inventory data', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  onReceiveQuantityChange(item: ReceiveStockItem): void {
    // Mark item as having changes if receive quantity > 0
    item.hasChanges = item.receiveQuantity > 0;
    
    // Ensure receive quantity is not negative
    if (item.receiveQuantity < 0) {
      item.receiveQuantity = 0;
    }
  }

  filterInventory(): void {
    if (!this.searchTerm.trim()) {
      this.filteredInventoryList = [...this.inventoryList];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredInventoryList = this.inventoryList.filter(item =>
      item.productName?.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.colorName?.toLowerCase().includes(searchLower) ||
      item.sizeName?.toLowerCase().includes(searchLower)
    );
  }

  submitReceiveStock(): void {
    // Get only items with changes (receiveQuantity > 0)
    const receiveItems = this.inventoryList.filter(item => item.hasChanges);
    
    if (receiveItems.length === 0) {
      this.snackBar.open('No stock receipts to submit', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    // Prepare receive stock data for each item
    const receivePromises = receiveItems.map(item => {
      const receiveData = {
        inventoryId: item.inventoryId,
        productId: item.productId,
        productColorId: item.productColorId,
        productSizeId: item.productSizeId,
        quantity: item.receiveQuantity, // Quantity to add
        description: `Stock received - Added ${item.receiveQuantity} units`,
        date: new Date(),
        userId: JSON.parse(sessionStorage.getItem('adminData') || '{}').userId 
      };
      
      return this.inventoryService.receiveStock(receiveData,this.userId);
    });

    // Execute all receive stock operations
    Promise.all(receivePromises.map(p => p.toPromise()))
      .then(() => {
        const totalReceived = receiveItems.reduce((sum, item) => sum + item.receiveQuantity, 0);
        this.snackBar.open(`Stock received: ${totalReceived} units for ${receiveItems.length} items`, 'Close', { duration: 4000 });
        this.loadInventory(); // Reload to get updated quantities
      })
      .catch(error => {
        console.error('Error during stock receipt:', error);
        this.snackBar.open('Error during stock receipt operation', 'Close', { duration: 3000 });
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  resetChanges(): void {
    this.inventoryList.forEach(item => {
      item.receiveQuantity = 0;
      item.hasChanges = false;
    });
    this.filteredInventoryList = [...this.inventoryList];
  }

  goBack(): void {
    this.router.navigate(['/inventory']);
  }

  getReceiveItemsCount(): number {
    return this.inventoryList.filter(item => item.hasChanges).length;
  }

  getTotalReceiveQuantity(): number {
    return this.inventoryList
      .filter(item => item.hasChanges)
      .reduce((sum, item) => sum + item.receiveQuantity, 0);
  }

  getNewTotalQuantity(item: ReceiveStockItem): number {
    return item.quantity + item.receiveQuantity;
  }

  /**
   * TrackBy function for ngFor to improve performance
   */
  trackByInventoryId(index: number, item: ReceiveStockItem): number {
    return item.inventoryId || index;
  }

  /**
   * Check if there are any items with low stock and changes for priority notice
   */
  hasLowStockWithChanges(): boolean {
    return this.filteredInventoryList.some(item => 
      item.quantity <= 5 && item.hasChanges
    );
  }
}

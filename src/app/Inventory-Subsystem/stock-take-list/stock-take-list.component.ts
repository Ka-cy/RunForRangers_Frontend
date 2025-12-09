import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventoryService } from '../../API-Services/inventory.service';
import { IInventory } from '../../Interfaces/iinventory';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';

interface StockTakeItem extends IInventory {
  adjustmentQuantity: number; // The new quantity to set (0 means no change)
  currentQuantity: number; // Store original quantity
  hasChanges: boolean; // Track if this item has been modified
}

@Component({
  selector: 'app-stock-take-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NavBarAdminComponent],
  templateUrl: './stock-take-list.component.html',
  styleUrls: ['./stock-take-list.component.css']
})
export class StockTakeListComponent implements OnInit {
  inventoryList: StockTakeItem[] = [];
  filteredInventoryList: StockTakeItem[] = [];
  isLoading: boolean = false;
  searchTerm: string = '';
  // Get userId from session storage
  userId: any = JSON.parse(sessionStorage.getItem('adminData') || '{}').userId;
  
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
          adjustmentQuantity: 0, // Default to 0 (no change)
          currentQuantity: item.quantity, // Store original quantity
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

  onQuantityChange(item: StockTakeItem): void {
    // Mark item as having changes if adjustment quantity is not 0
    item.hasChanges = item.adjustmentQuantity !== 0;
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

  submitStockTake(): void {
    // Get only items with changes (adjustmentQuantity !== 0)
    const changedItems = this.inventoryList.filter(item => item.hasChanges);

    if (changedItems.length === 0) {
      this.snackBar.open('No changes to submit', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    // Prepare update observables for each changed item (only items with valid inventoryId)
    const updateObservables = changedItems
      .filter(item => item.inventoryId) // Filter out items without inventoryId
      .map(item => {
        const updateData = {
          inventoryId: item.inventoryId,
          productId: item.productId,
          productColorId: item.productColorId,
          productSizeId: item.productSizeId,
          quantity: item.adjustmentQuantity, // The new quantity to set
          description: `Stock take adjustment - was ${item.currentQuantity}, now ${item.adjustmentQuantity}`,
          productName: item.productName,
          colorName: item.colorName,
          sizeName: item.sizeName,
          imageUrl: item.imageUrl
        };

        return this.inventoryService.update(item.inventoryId!, updateData, this.userId);
      });

    // Execute all update operations using forkJoin
    forkJoin(updateObservables).subscribe({
      next: (results) => {
        this.snackBar.open(`Stock take completed for ${changedItems.length} items`, 'Close', { duration: 3000 });
        this.loadInventory(); // Reload to get updated quantities
      },
      error: (error) => {
        console.error('Error during stock take:', error);
        this.snackBar.open('Error during stock take operation', 'Close', { duration: 3000 });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  resetChanges(): void {
    this.inventoryList.forEach(item => {
      item.adjustmentQuantity = 0;
      item.hasChanges = false;
    });
    this.filteredInventoryList = [...this.inventoryList];
  }

  goBack(): void {
    this.router.navigate(['/inventory']);
  }

  getChangedItemsCount(): number {
    return this.inventoryList.filter(item => item.hasChanges).length;
  }

  /**
   * TrackBy function for ngFor to improve performance
   */
  trackByInventoryId(index: number, item: StockTakeItem): number {
    return item.inventoryId || index;
  }
}

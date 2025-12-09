import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventoryService } from '../../API-Services/inventory.service';
import { IInventory } from '../../Interfaces/iinventory';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';

interface WriteOffItem extends IInventory {
  writeOffQuantity: number; // Quantity to write off (0 means no write off)
  writeOffReason: string; // Reason for write off
  hasChanges: boolean; // Track if this item has been modified
}

@Component({
  selector: 'app-write-off-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NavBarAdminComponent],
  templateUrl: './write-off-list.component.html',
  styleUrls: ['./write-off-list.component.css']
})
export class WriteOffListComponent implements OnInit {
  inventoryList: WriteOffItem[] = [];
  filteredInventoryList: WriteOffItem[] = [];
  isLoading: boolean = false;
  searchTerm: string = '';
  // Get userId from session storage
userId: any = JSON.parse(sessionStorage.getItem('adminData') || '{}').userId;
  // Write off reasons
  writeOffReasons = [
    'Damaged',
    'Expired', 
    'Lost',
    'Stolen',
    'Quality Issues',
    'Incorrect Delivery',
    'Customer Return - Damaged',
    'Defective',
    'Other'
  ];
  
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
          writeOffQuantity: 0, // Default to 0 (no write off)
          writeOffReason: '', // Default empty reason
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

  onWriteOffChange(item: WriteOffItem): void {
    // Mark item as having changes if write off quantity > 0 and reason is selected
    item.hasChanges = item.writeOffQuantity > 0 && item.writeOffReason.trim() !== '';
    
    // Validate write off quantity doesn't exceed current quantity
    if (item.writeOffQuantity > item.quantity) {
      item.writeOffQuantity = item.quantity;
      this.snackBar.open('Write off quantity cannot exceed current quantity', 'Close', { duration: 3000 });
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

  submitWriteOff(): void {
    // Get only items with changes (writeOffQuantity > 0 and reason provided)
    const writeOffItems = this.inventoryList.filter(item => item.hasChanges);

    if (writeOffItems.length === 0) {
      this.snackBar.open('No write offs to submit', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    // Prepare write off observables for each item
    const writeOffObservables = writeOffItems.map(item => {
      const writeOffData = {
        inventoryId: item.inventoryId,
        productId: item.productId,
        productColorId: item.productColorId,
        productSizeId: item.productSizeId,
        quantity: item.writeOffQuantity, // Quantity to write off
        reason: item.writeOffReason,
        description: `Write off: ${item.writeOffReason} - Quantity: ${item.writeOffQuantity}`,
        date: new Date()
      };
      console.log(this.userId);

      return this.inventoryService.writeOff(writeOffData, this.userId);
    });

    // Execute all write off operations using forkJoin
    forkJoin(writeOffObservables).subscribe({
      next: (results) => {
        const totalWrittenOff = writeOffItems.reduce((sum, item) => sum + item.writeOffQuantity, 0);
        this.snackBar.open(`Write off completed: ${totalWrittenOff} units from ${writeOffItems.length} items`, 'Close', { duration: 4000 });
        this.loadInventory(); // Reload to get updated quantities
      },
      error: (error) => {
        console.error('Error during write off:', error);
        this.snackBar.open('Error during write off operation', 'Close', { duration: 3000 });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  resetChanges(): void {
    this.inventoryList.forEach(item => {
      item.writeOffQuantity = 0;
      item.writeOffReason = '';
      item.hasChanges = false;
    });
    this.filteredInventoryList = [...this.inventoryList];
  }

  goBack(): void {
    this.router.navigate(['/inventory']);
  }

  getWriteOffItemsCount(): number {
    return this.inventoryList.filter(item => item.hasChanges).length;
  }

  getTotalWriteOffQuantity(): number {
    return this.inventoryList
      .filter(item => item.hasChanges)
      .reduce((sum, item) => sum + item.writeOffQuantity, 0);
  }

  /**
   * TrackBy function for ngFor to improve performance
   */
  trackByInventoryId(index: number, item: WriteOffItem): number {
    return item.inventoryId || index;
  }
}

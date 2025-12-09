import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../API-Services/inventory.service';
import { ProductService } from '../../API-Services/product.service';
import { NotificationService } from '../../API-Services/notification.service';
import { IInventory } from '../../Interfaces/iinventory';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { NotificationModalComponent } from '../../Notification/notification.component';
import { IProductColour } from '../../Interfaces/iproductcolour';
import { IProductSize } from '../../Interfaces/iproductsize';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../Employee-Subsystem/confirm-dialog/confirm-dialog.component';
import { DynamicImageComponent } from '../../shared/dynamic-image/dynamic-image.component';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ExportService } from '../../API-Services/export.service';
import { ExportFormat } from '../../Interfaces/export.interfaces';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavBarAdminComponent, DynamicImageComponent, NotificationModalComponent],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit {
  inventoryList: IInventory[] = [];
  filteredInventoryList: IInventory[] = [];
  productList: any[] = [];
  colourList: IProductColour[] = [];
  sizeList: IProductSize[] = [];
  isLoading: boolean = false;

  // Filter properties
  searchTerm: string = '';
  selectedProduct: string = '0';
  selectedColor: string = '0';
  selectedSize: string = '0';
  minQuantity: number = 0;
  maxQuantity: number = 1000;
  showLowStock: boolean = false;
  lowStockThreshold: number = 10;

  // Report properties
  showReport: boolean = false;
  reportData: any = {};

  // User header properties
  showProfileMenu: boolean = false;

  newInventory: IInventory = {
    productId: 0,
    productColorId: 0,
    productSizeId: 0,
    description: '',
    quantity: 0,
    imageUrl: ''
  };

  constructor(
    private router: Router,
    private inventoryService: InventoryService,
    private productService: ProductService,
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private exportService: ExportService,
    private notificationService: NotificationService
  ) {}

  // Add HostListener to close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-info')) {
      this.showProfileMenu = false;
    }
  }

  // Robust header helpers: check sessionStorage.adminData, localStorage.currentUserLoggedIn, then UserService.currentUser
  getCurrentUserInitials(): string {
    try {
      const adminRaw = sessionStorage.getItem('adminData');
      if (adminRaw) {
        const a: any = JSON.parse(adminRaw);
        const first = (a.firstName || a.firstname || a.name || '').toString();
        const last = (a.lastName || a.surname || '').toString();
        const initials = ((first[0] || '') + (last[0] || '')).toUpperCase();
        if (initials.trim()) return initials;
      }

      const uRaw = localStorage.getItem('currentUserLoggedIn');
      if (uRaw) {
        const u: any = JSON.parse(uRaw);
        const first = (u.firstName || u.firstname || u.name || '').toString();
        const last = (u.lastName || u.surname || '').toString();
        const initials = ((first[0] || '') + (last[0] || '')).toUpperCase();
        if (initials.trim()) return initials;
      }
    } catch (e) {}
    return 'AD';
  }

  getCurrentUserName(): string {
    try {
      const adminRaw = sessionStorage.getItem('adminData');
      if (adminRaw) {
        const a: any = JSON.parse(adminRaw);
        const name = `${a.firstName || a.firstname || a.name || ''} ${a.lastName || a.surname || ''}`.trim();
        if (name) return name;
      }

      const uRaw = localStorage.getItem('currentUserLoggedIn');
      if (uRaw) {
        const u: any = JSON.parse(uRaw);
        const name = `${u.firstName || u.firstname || u.name || ''} ${u.lastName || u.surname || ''}`.trim();
        if (name) return name;
      }
    } catch (e) {}
    return 'Admin';
  }

  getCurrentUserRole(): string {
    try {
      const adminRaw = sessionStorage.getItem('adminData');
      if (adminRaw) {
        const a: any = JSON.parse(adminRaw);
        if (a.role) return a.role;
      }

      const uRaw = localStorage.getItem('currentUserLoggedIn');
      if (uRaw) {
        const u: any = JSON.parse(uRaw);
        if (u.role || u.userRole) return u.role || u.userRole;
      }
    } catch (e) {}
    return 'Administrator';
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData() {
    this.isLoading = true;
    
    forkJoin({
      inventory: this.inventoryService.getAll(),
      products: this.productService.GetAllProducts(),
      colours: this.productService.GetProductColors(),
      sizes: this.productService.GetProductSizes(),
      categories: this.productService.GetProductCategories(),
      types: this.productService.GetProductTypes()
    }).subscribe({
      next: (result) => {
        this.productList = result.products.map(p => ({
          productId: p.productId,
          productName: p.productName,
          productTypeId: p.productTypeId,
          productImage: p.productImage
        }));
        
        this.colourList = result.colours.map(c => ({
          productColorId: c.productColorId,
          colorName: c.colorName,
          colorDescription: c.colorDescription || '',
          hexCode: c.hexCode
        }));
        
        this.sizeList = result.sizes.map(s => ({
          productSizeId: s.productSizeId,
          sizeName: s.sizeName,
          sizeDescription: s.sizeDescription || ''
        }));
        
        console.log('Successfully loaded:', {
          products: this.productList.length,
          colors: this.colourList.length,
          sizes: this.sizeList.length,
          inventory: result.inventory.length
        });
        
        console.log('Actual color names from database:', this.colourList.map(c => c.colorName));
        console.log('Color objects with hex codes:', this.colourList.map(c => ({ 
          name: c.colorName, 
          hasHex: !!c.hexCode, 
          hex: c.hexCode 
        })));
        
        console.log('Available color IDs and names:', this.colourList.map(c => ({
          id: c.productColorId,
          idType: typeof c.productColorId,
          name: c.colorName
        })));
        
        if (result.inventory.length > 0) {
          const sampleItem = result.inventory[0];
          console.log('Inventory item structure:', Object.keys(sampleItem));
          console.log('Color ID properties:', {
            productColorId: sampleItem.productColorId,
            hasColorId: 'productColorId' in sampleItem
          });
        }
        
        this.inventoryList = result.inventory.map(item => {
          const itemColorId = item.productColorId;
          const itemSizeId = item.productSizeId;
          
          const colorMatch = this.colourList.find(c => 
            c.productColorId === itemColorId
          );
          
          const sizeMatch = this.sizeList.find(s => 
            s.productSizeId === itemSizeId
          );
          
          const productMatch = this.productList.find(p => p.productId === item.productId);
          
          const productType = result.types.find(t => t.productTypeId === productMatch?.productTypeId);
          const productCategory = result.categories.find(c => c.productCategoryId === productType?.productCategoryId);
          
          return {
            ...item,
            productName: productMatch?.productName || 'Unknown Product',
            colorName: colorMatch?.colorName || `Missing Color (ID: ${itemColorId})`,
            sizeName: sizeMatch?.sizeName || `Missing Size (ID: ${itemSizeId})`,
            productImage: productMatch?.productImage || item.imageUrl,
            productType: productType?.typeName,
            productCategory: productCategory?.categoryName
          };
        });
        
        this.filteredInventoryList = [...this.inventoryList];
        this.generateReportData();
        
        this.isLoading = false;
        
        (window as any).inventoryComponent = this;
        
        console.log('Data loading test:', {
          hasColors: this.colourList.length > 0,
          hasSizes: this.sizeList.length > 0,
          hasProducts: this.productList.length > 0,
          hasInventory: this.inventoryList.length > 0
        });
        
        this.snackBar.open('✅ Product-Inventory system synchronized successfully!', 'Close', {
          duration: 4000,
          panelClass: ['success-snackbar']
        });
      },
      error: (err) => {
        console.error('Failed to load data:', err);
        console.log('Attempting fallback data loading...');
        
        this.loadDataFallback();
      }
    });
  }

  loadDataFallback() {
    this.inventoryService.getAll().subscribe({
      next: (inventory) => {
        this.inventoryList = inventory.map(item => ({
          ...item,
          productName: 'Loading...',
          colorName: 'Loading...',
          sizeName: 'Loading...',
          productImage: item.imageUrl,
          productType: undefined,
          productCategory: undefined
        }));
        this.filteredInventoryList = [...this.inventoryList];
        
        this.loadReferenceData();
      },
      error: (error) => {
        console.error('Error loading inventory:', error);
        this.isLoading = false;
        this.snackBar.open('❌ Failed to load inventory data', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadReferenceData() {
    this.productService.GetAllProducts().subscribe({
      next: (products) => {
        this.productList = products.map(p => ({
          productId: p.productId,
          productName: p.productName,
          productTypeId: p.productTypeId,
          productImage: p.productImage
        }));
        this.updateInventoryWithProductNames();
      },
      error: (error) => console.error('Error loading products:', error)
    });

    this.productService.GetProductColors().subscribe({
      next: (colors) => {
        this.colourList = colors.map(c => ({
          productColorId: c.productColorId,
          colorName: c.colorName,
          colorDescription: c.colorDescription || '',
          hexCode: c.hexCode
        }));
        this.updateInventoryWithColorNames();
      },
      error: (error) => console.error('Error loading colors:', error)
    });

    this.productService.GetProductSizes().subscribe({
      next: (sizes) => {
        this.sizeList = sizes.map(s => ({
          productSizeId: s.productSizeId,
          sizeName: s.sizeName,
          sizeDescription: s.sizeDescription || ''
        }));
        this.updateInventoryWithSizeNames();
      },
      error: (error) => console.error('Error loading sizes:', error)
    });
  }

  updateInventoryWithProductNames() {
    this.inventoryList = this.inventoryList.map(item => ({
      ...item,
      productName: this.productList.find(p => p.productId === item.productId)?.productName || 'Unknown Product'
    }));
    this.filteredInventoryList = [...this.inventoryList];
    this.applyFilters();
  }

  updateInventoryWithColorNames() {
    this.inventoryList = this.inventoryList.map(item => ({
      ...item,
      colorName: this.colourList.find(c => {
        if (!c.productColorId || !item.productColorId) return false;
        return c.productColorId === item.productColorId || 
               c.productColorId.toString() === item.productColorId.toString();
      })?.colorName || 'Unknown Colour'
    }));
    this.filteredInventoryList = [...this.inventoryList];
    this.applyFilters();
  }

  updateInventoryWithSizeNames() {
    this.inventoryList = this.inventoryList.map(item => ({
      ...item,
      sizeName: this.sizeList.find(s => {
        if (!s.productSizeId || !item.productSizeId) return false;
        return s.productSizeId === item.productSizeId ||
               s.productSizeId.toString() === item.productSizeId.toString();
      })?.sizeName || 'Unknown Size'
    }));
    this.filteredInventoryList = [...this.inventoryList];
    this.applyFilters();
    this.isLoading = false;
    
    this.snackBar.open('✅ Data loaded successfully with fallback method', 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  loadInventory() {
    this.isLoading = true;
    this.inventoryService.getAll().subscribe({
      next: (data) => {
        this.inventoryList = data.map(item => ({
          ...item,
          productName: this.productList.find(p => p.productId === item.productId)?.productName || 'N/A',
          colorName: this.colourList.find(c => c.productColorId === item.productColorId)?.colorName || 'N/A',
          sizeName: this.sizeList.find(s => s.productSizeId === item.productSizeId)?.sizeName || 'N/A',
          imageUrl: item.imageUrl ? `/assets/Images/${item.imageUrl.replace('/images/', '')}` : ''
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load inventory:', err);
        this.isLoading = false;
        this.snackBar.open('❌ Failed to load inventory', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadProducts() {
    this.inventoryService.getAvailableProducts().subscribe({
      next: (res) => {
        this.productList = res.map(p => ({
          productId: p.productId,
          productName: p.productName
        }));
      },
      error: (err) => console.error('Failed to load products:', err)
    });
  }

  loadColours() {
    this.inventoryService.getProductColours().subscribe({
      next: (res) => this.colourList = res,
      error: (err) => console.error('Failed to load colours:', err)
    });
  }

  loadSizes() {
    this.inventoryService.getProductSizes().subscribe({
      next: (res) => this.sizeList = res,
      error: (err) => console.error('Failed to load sizes:', err)
    });
  }

  applyFilters(): void {
    this.filteredInventoryList = this.inventoryList.filter(item => {
      const matchesSearch = !this.searchTerm || 
        item.productName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.colorName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.sizeName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesProduct = this.selectedProduct === '0' || 
        String(item.productId) === String(this.selectedProduct);

      const matchesColor = this.selectedColor === '0' || 
        String(item.productColorId) === String(this.selectedColor);

      const matchesSize = this.selectedSize === '0' || 
        String(item.productSizeId) === String(this.selectedSize);

      const quantity = item.quantity || 0;
      const matchesQuantityRange = quantity >= this.minQuantity && quantity <= this.maxQuantity;

      const matchesLowStock = !this.showLowStock || quantity <= this.lowStockThreshold;

      return matchesSearch && matchesProduct && matchesColor && matchesSize && matchesQuantityRange && matchesLowStock;
    });
    
    console.log('Filter Debug:', {
      selectedProduct: this.selectedProduct,
      selectedColor: this.selectedColor,
      selectedSize: this.selectedSize,
      totalItems: this.inventoryList.length,
      filteredItems: this.filteredInventoryList.length
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedProduct = '0';
    this.selectedColor = '0';
    this.selectedSize = '0';
    this.minQuantity = 0;
    this.maxQuantity = 1000;
    this.showLowStock = false;
    this.applyFilters();
  }

  generateReportData(): void {
    const totalItems = this.inventoryList.length;
    const totalQuantity = this.inventoryList.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const lowStockItems = this.inventoryList.filter(item => (item.quantity || 0) <= this.lowStockThreshold);
    const outOfStockItems = this.inventoryList.filter(item => (item.quantity || 0) === 0);

    const productSummary = this.inventoryList.reduce((acc, item) => {
      const key = item.productName || 'Unknown Product';
      if (!acc[key]) {
        acc[key] = { totalQuantity: 0, variants: 0 };
      }
      acc[key].totalQuantity += item.quantity || 0;
      acc[key].variants += 1;
      return acc;
    }, {} as any);

    const colorSummary = this.inventoryList.reduce((acc, item) => {
      const key = item.colorName || 'Unknown Color';
      if (!acc[key]) {
        acc[key] = { totalQuantity: 0, items: 0 };
      }
      acc[key].totalQuantity += item.quantity || 0;
      acc[key].items += 1;
      return acc;
    }, {} as any);

    this.reportData = {
      totalItems,
      totalQuantity,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      lowStockItems: lowStockItems,
      outOfStockItems: outOfStockItems,
      productSummary: Object.entries(productSummary).map(([name, data]: [string, any]) => ({
        productName: name,
        totalQuantity: data.totalQuantity,
        variants: data.variants
      })),
      colorSummary: Object.entries(colorSummary).map(([name, data]: [string, any]) => ({
        colorName: name,
        totalQuantity: data.totalQuantity,
        items: data.items
      })),
      generatedDate: new Date().toLocaleString()
    };
  }

  toggleReport(): void {
    this.showReport = !this.showReport;
    if (this.showReport) {
      this.generateReportData();
    }
  }

  exportReport(): void {
    this.notificationService.showWarning(
      'Choose export format',
      'Click Continue for PDF export, Cancel for Text export'
    );
    
    this.notificationService.confirmation$.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.exportToPDF();
      } else {
        this.exportToText();
      }
    });
  }

  exportToText(): void {
    const reportContent = this.generateReportContent();
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-report-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INVENTORY ON-HAND REPORT', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${this.reportData.generatedDate}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Items: ${this.reportData.totalItems}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Total Quantity: ${this.reportData.totalQuantity}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Low Stock Items: ${this.reportData.lowStockCount}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Out of Stock Items: ${this.reportData.outOfStockCount}`, 20, yPosition);
    yPosition += 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCT SUMMARY', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Product Name', 20, yPosition);
    doc.text('Variants', 120, yPosition);
    doc.text('Total Qty', 160, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    this.reportData.productSummary.forEach((item: any) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      const productName = item.productName.length > 25 ? 
        item.productName.substring(0, 25) + '...' : item.productName;
      
      doc.text(productName, 20, yPosition);
      doc.text(item.variants.toString(), 120, yPosition);
      doc.text(item.totalQuantity.toString(), 160, yPosition);
      yPosition += 6;
    });

    if (this.reportData.lowStockItems.length > 0) {
      yPosition += 15;
      
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('LOW STOCK ITEMS', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Product', 20, yPosition);
      doc.text('Color', 80, yPosition);
      doc.text('Size', 120, yPosition);
      doc.text('Qty', 160, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      this.reportData.lowStockItems.forEach((item: any) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        const productName = (item.productName || '').length > 15 ? 
          (item.productName || '').substring(0, 15) + '...' : (item.productName || '');
        const colorName = (item.colourName || '').length > 15 ? 
          (item.colourName || '').substring(0, 15) + '...' : (item.colourName || '');
        
        doc.text(productName, 20, yPosition);
        doc.text(colorName, 80, yPosition);
        doc.text(item.sizeName || '', 120, yPosition);
        doc.text((item.quantity || 0).toString(), 160, yPosition);
        yPosition += 6;
      });
    }

    doc.save(`inventory-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  private generateReportContent(): string {
    let content = `INVENTORY ON-HAND REPORT\n`;
    content += `Generated: ${this.reportData.generatedDate}\n`;
    content += `${'='.repeat(50)}\n\n`;
    
    content += `SUMMARY:\n`;
    content += `Total Items: ${this.reportData.totalItems}\n`;
    content += `Total Quantity: ${this.reportData.totalQuantity}\n`;
    content += `Low Stock Items: ${this.reportData.lowStockCount}\n`;
    content += `Out of Stock Items: ${this.reportData.outOfStockCount}\n\n`;

    content += `PRODUCT SUMMARY:\n`;
    content += `${'Product Name'.padEnd(30)} ${'Variants'.padEnd(10)} ${'Total Qty'.padEnd(10)}\n`;
    content += `${'-'.repeat(50)}\n`;
    this.reportData.productSummary.forEach((item: any) => {
      content += `${item.productName.padEnd(30)} ${item.variants.toString().padEnd(10)} ${item.totalQuantity.toString().padEnd(10)}\n`;
    });

    if (this.reportData.lowStockItems.length > 0) {
      content += `\nLOW STOCK ITEMS:\n`;
      content += `${'Product'.padEnd(20)} ${'Color'.padEnd(15)} ${'Size'.padEnd(10)} ${'Qty'.padEnd(5)}\n`;
      content += `${'-'.repeat(50)}\n`;
      this.reportData.lowStockItems.forEach((item: any) => {
        content += `${(item.productName || '').padEnd(20)} ${(item.colourName || '').padEnd(15)} ${(item.sizeName || '').padEnd(10)} ${(item.quantity || 0).toString().padEnd(5)}\n`;
      });
    }

    return content;
  }

  addInventory() {
    this.isLoading = true;
    this.inventoryService.create(this.newInventory).subscribe({
      next: () => {
        this.snackBar.open('✅ Inventory created successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.newInventory = { productId: 0, productColorId: 0, productSizeId: 0, description: '', quantity: 0, imageUrl: '' };
        this.loadAllData();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error creating inventory:', err);
        this.snackBar.open('❌ Failed to create inventory', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  navigateToEmployees() { this.router.navigate(['/employees']); }
  navigateToProducts() { this.router.navigate(['/products']); }
  navigateToRunner() { this.router.navigate(['/runners']); }
  navigateToUser() { this.router.navigate(['/viewUsers']); }
  navigateToDonation() { this.router.navigate(['/donations']); }
  navigateToInventory() { this.router.navigate(['/inventory']); }
  logout() {
    localStorage.removeItem('currentUserLoggedIn');
    sessionStorage.removeItem('adminData');
    this.showProfileMenu = false;
    this.router.navigate(['/home']);
  }

  // Add Inventory Navigation
  navigateToAddInventory() {
    this.router.navigate(['/inventory/add']);
  }

  // Bulk Operations Navigation - Only these are visible now
  navigateToBulkReceiveStock() {
    this.router.navigate(['/inventory/receive-stock-list']);
  }

  navigateToBulkStockTake() {
    this.router.navigate(['/inventory/stock-take-list']);
  }

  navigateToBulkWriteOff() {
    this.router.navigate(['/inventory/write-off-list']);
  }

  getSelectedColorName(): string {
    if (!this.selectedColor || this.selectedColor === '0') return '';
    const selectedColorObj = this.colourList.find(c => c.productColorId.toString() === this.selectedColor);
    return selectedColorObj?.colorName || '';
  }

  debugColors() {
    console.log('=== COLOR DEBUG INFO ===');
    console.log('Total colors loaded:', this.colourList.length);
    console.log('Colors with details:', this.colourList);
    console.log('Total inventory items:', this.inventoryList.length);
    
    console.log('=== INVENTORY COLOR MAPPING ===');
    this.inventoryList.slice(0, 5).forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        colorName: item.colorName,
        colorFromDatabase: this.colourList.find(c => c.colorName === item.colorName),
        hexFromMethod: this.getItemColorHex(item),
        hexFromMapping: this.getColorHex(item.colorName || '')
      });
    });
    
    console.log('=== MANUAL COLOR TESTS ===');
    ['red', 'blue', 'green', 'black', 'white'].forEach(color => {
      console.log(`Testing "${color}":`, this.getColorHex(color));
    });
  }

  getItemColorHex(item: any): string {
    if (!item.colorName) return '#6b7280';
    
    const colorObj = this.colourList.find(c => 
      c.colorName === item.colorName ||
      c.colorName.toLowerCase() === item.colorName.toLowerCase()
    );
    
    if (colorObj?.hexCode) {
      console.log('Using database hex code for', item.colorName, ':', colorObj.hexCode);
      return colorObj.hexCode;
    }
    
    return this.getColorHex(item.colourName);
  }

  getColorHex(colorName: string): string {
    if (!colorName) return '#6b7280';
    
    const colorMap: { [key: string]: string } = {
      'red': '#ef4444',
      'blue': '#3b82f6', 
      'green': '#10b981',
      'yellow': '#f59e0b',
      'black': '#1f2937',
      'white': '#ffffff',
      'gray': '#6b7280',
      'grey': '#6b7280',
      'purple': '#8b5cf6',
      'pink': '#ec4899',
      'orange': '#f97316',
      'brown': '#92400e',
      'navy': '#1e40af',
      'maroon': '#7f1d1d',
      'lime': '#65a30d',
      'cyan': '#06b6d4',
      'magenta': '#d946ef',
      'olive': '#84cc16',
      'teal': '#14b8a6',
      'silver': '#d1d5db',
      'gold': '#fbbf24',
      'beige': '#f5f5dc',
      'cream': '#fffdd0',
      'tan': '#d2b48c',
      'khaki': '#f0e68c',
      'coral': '#ff7875',
      'salmon': '#fa8072',
      'turquoise': '#40e0d0',
      'violet': '#8a2be2',
      'indigo': '#4b0082',
      'crimson': '#dc143c',
      'azure': '#f0ffff',
      'ivory': '#fffff0',
      'light blue': '#87ceeb',
      'dark blue': '#00008b',
      'light green': '#90ee90',
      'dark green': '#006400',
      'light red': '#ffcccb',
      'dark red': '#8b0000',
      'light grey': '#d3d3d3',
      'dark grey': '#a9a9a9',
      'light gray': '#d3d3d3',
      'dark gray': '#a9a9a9',
      'bright red': '#ff0000',
      'bright blue': '#0000ff',
      'bright green': '#00ff00',
      'bright yellow': '#ffff00',
      'royal blue': '#4169e1',
      'forest green': '#228b22',
      'sky blue': '#87ceeb',
      'powder blue': '#b0e0e6',
      'steel blue': '#4682b4',
      'mint green': '#98fb98',
      'olive green': '#808000',
      'sea green': '#2e8b57',
      'hot pink': '#ff69b4',
      'deep pink': '#ff1493',
      'light pink': '#ffb6c1',
      'burnt orange': '#cc5500',
      'golden yellow': '#ffd700',
      'lemon yellow': '#fff44f',
      'chocolate': '#d2691e',
      'mahogany': '#c04000',
      'burgundy': '#800020',
      'wine': '#722f37',
      'rose': '#ff66cc',
      'lavender': '#e6e6fa',
      'plum': '#dda0dd',
      'slate': '#708090',
      'charcoal': '#36454f'
    };

    const cleanColorName = colorName.toLowerCase().trim().replace(/\s+/g, ' ');
    
    console.log('Looking up color:', cleanColorName);
    
    if (colorMap[cleanColorName]) {
      console.log('Direct match found:', colorMap[cleanColorName]);
      return colorMap[cleanColorName];
    }
    
    for (const [key, value] of Object.entries(colorMap)) {
      if (cleanColorName.includes(key) || key.includes(cleanColorName)) {
        console.log('Partial match found:', key, '→', value);
        return value;
      }
    }
    
    const words = cleanColorName.split(' ');
    for (const word of words) {
      if (colorMap[word]) {
        console.log('Word match found:', word, '→', colorMap[word]);
        return colorMap[word];
      }
    }
    
    console.log('No color match found for:', colorName, 'using default grey');
    
    const firstLetter = colorName.toLowerCase().charAt(0);
    const letterColors: { [key: string]: string } = {
      'a': '#ff6b6b', 'b': '#4ecdc4', 'c': '#45b7d1', 'd': '#f9ca24',
      'e': '#f0932b', 'f': '#eb4d4b', 'g': '#6ab04c', 'h': '#9980fa',
      'i': '#74b9ff', 'j': '#0984e3', 'k': '#a29bfe', 'l': '#fd79a8',
      'm': '#fdcb6e', 'n': '#e17055', 'o': '#81ecec', 'p': '#fab1a0',
      'q': '#ff7675', 'r': '#fd79a8', 's': '#fdcb6e', 't': '#e17055',
      'u': '#74b9ff', 'v': '#a29bfe', 'w': '#6c5ce7', 'x': '#fd79a8',
      'y': '#f39c12', 'z': '#9b59b6'
    };
    
    if (letterColors[firstLetter]) {
      console.log('Using letter-based color for:', colorName, '→', letterColors[firstLetter]);
      return letterColors[firstLetter];
    }
    
    return '#6b7280';
  }

  // Export functionality
  exportToExcel(): void {
    try {
      const exportData = this.prepareInventoryDataForExport();
      this.exportService.exportToExcel(
        exportData, 
        `inventory-report-${new Date().toISOString().split('T')[0]}`,
        'Inventory Report'
      );
      console.log('✅ Inventory exported to Excel successfully!');
      this.notificationService.showSuccess('Inventory exported to Excel successfully!', 'Export Success');
    } catch (error) {
      console.error('Export to Excel failed:', error);
      this.notificationService.showError('Failed to export inventory to Excel', 'Export Error');
    }
  }

  exportToCSV(): void {
    try {
      const exportData = this.prepareInventoryDataForExport();
      this.exportService.exportToCSV(
        exportData, 
        `inventory-report-${new Date().toISOString().split('T')[0]}`
      );
      console.log('✅ Inventory exported to CSV successfully!');
      this.notificationService.showSuccess('Inventory exported to CSV successfully!', 'Export Success');
    } catch (error) {
      console.error('Export to CSV failed:', error);
      this.notificationService.showError('Failed to export inventory to CSV', 'Export Error');
    }
  }

  private prepareInventoryDataForExport(): any[] {
    return this.inventoryList.map(item => ({
      'Product ID': item.productId,
      'Description': item.description,
      'Quantity': item.quantity,
      'Color': this.getColorName(item.productColorId),
      'Size': this.getSizeName(item.productSizeId),
      'Image URL': item.imageUrl || 'No image'
    }));
  }

  private getColorName(colorId: number): string {
    const color = this.colourList.find((c: IProductColour) => c.productColorId === colorId);
    return color ? color.colorName : 'Unknown';
  }

  private getSizeName(sizeId: number): string {
    const size = this.sizeList.find((s: IProductSize) => s.productSizeId === sizeId);
    return size ? size.sizeName : 'Unknown';
  }
}
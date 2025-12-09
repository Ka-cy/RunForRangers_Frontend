import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryService } from '../../API-Services/inventory.service';
import { NotificationService } from '../../API-Services/notification.service';
import { NgForm } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IProductColour } from '../../Interfaces/iproductcolour';
import { IProductSize } from '../../Interfaces/iproductsize';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { NotificationModalComponent } from '../../Notification/notification.component';

@Component({
  selector: 'app-stock-take',
  standalone: true,
  templateUrl: './stock-take.component.html',
  styleUrls: ['./stock-take.component.css'],
  imports: [CommonModule, FormsModule, RouterModule, NavBarAdminComponent, NotificationModalComponent],
})
export class StockTakeComponent implements OnInit {
  productId: number = 0;
  productColorId: number = 0;
  productSizeId: number = 0;
  quantity: number = 0;
  description: string = '';
  productName: string = '';
  imageUrl: string = '';
  colourList: IProductColour[] = [];
  sizeList: IProductSize[] = [];
  productList: { productId: number; productName: string }[] = [];
  availableImages: string[] = [];
  isLoading: boolean = true; // Start with loading true to wait for data

  // Define image options for each product
  private imageOptions: { [key: number]: string[] } = {
    1: [ // Assuming productId 1 is "Cool T-Shirt"
      'cool-tshirt-red-small.jpg', 'cool-tshirt-blue-small.jpg', 'cool-tshirt-green-small.jpg',
      'cool-tshirt-red-medium.jpg', 'cool-tshirt-blue-medium.jpg', 'cool-tshirt-green-medium.jpg',
      'cool-tshirt-red-large.jpg', 'cool-tshirt-blue-large.jpg', 'cool-tshirt-green-large.jpg'
    ],
    2: [ // Assuming productId 2 is "Stylish Hoodie"
      'stylish-hoodie-red-small.jpg', 'stylish-hoodie-blue-small.jpg', 'stylish-hoodie-green-small.jpg',
      'stylish-hoodie-red-medium.jpg', 'stylish-hoodie-blue-medium.jpg', 'stylish-hoodie-green-medium.jpg',
      'stylish-hoodie-red-large.jpg', 'stylish-hoodie-blue-large.jpg', 'stylish-hoodie-green-large.jpg'
    ]
    // Add more products as needed
  };

  constructor(
    private route: ActivatedRoute,
    private inventoryService: InventoryService,
    public router: Router,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.productId = +params['productId'] || 0;
      this.productColorId = +params['productColorId'] || 0;
      this.productSizeId = +params['productSizeId'] || 0;
    });
    this.loadProducts();
    this.loadColours();
    this.loadSizes();
  }

  loadProducts() {
    this.http.get<any[]>('https://localhost:7158/api/Product/GetAllProducts').subscribe({
      next: (res: any[]) => {
        console.log('Products loaded:', res);
        this.productList = res.map((p: any) => ({ productId: p.productId, productName: p.productName }));
        this.updateAvailableImages();
        this.checkDataLoaded();
      },
      error: (err: any) => {
        console.error('Failed to load products:', err);
        this.isLoading = false;
        this.snackBar.open('❌ Failed to load products.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadColours() {
    this.inventoryService.getProductColours().subscribe({
      next: (res: IProductColour[]) => {
        console.log('Colours loaded:', res);
        this.colourList = res;
        this.checkDataLoaded();
      },
      error: (err: any) => {
        console.error('Failed to load colours:', err);
        this.snackBar.open('❌ Failed to load colours.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadSizes() {
    this.inventoryService.getProductSizes().subscribe({
      next: (res: IProductSize[]) => {
        console.log('Sizes loaded:', res);
        this.sizeList = res;
        this.checkDataLoaded();
      },
      error: (err: any) => {
        console.error('Failed to load sizes:', err);
        this.snackBar.open('❌ Failed to load sizes.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  updateAvailableImages() {
    this.availableImages = this.imageOptions[this.productId] || [];
    if (this.availableImages.length > 0 && this.imageUrl && !this.availableImages.includes(this.imageUrl)) {
      this.imageUrl = this.availableImages[0];
    } else if (this.availableImages.length > 0 && !this.imageUrl) {
      this.imageUrl = this.availableImages[0];
    }
  }

  checkDataLoaded() {
    if (this.productList.length > 0 && this.colourList.length > 0 && this.sizeList.length > 0) {
      this.isLoading = false;
    }
  }

  onSubmit(form: NgForm) {
    if (!form.valid || this.quantity < 0 || !this.productId || !this.productColorId || !this.productSizeId) {
      this.snackBar.open('Please fill all required fields correctly.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isLoading = true;
    const payload = {
      productId: this.productId,
      productColorId: this.productColorId,
      productSizeId: this.productSizeId,
      productName: this.productName,
      quantity: this.quantity,
      description: this.description,
      imageUrl: this.imageUrl
    };

    this.inventoryService.stockTake(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('✅ Stock take submitted successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/inventory']);
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error(err);
        this.snackBar.open('❌ Error submitting stock take.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  navigateToProducts() { this.router.navigate(['/products']); }
  navigateToUser() { this.router.navigate(['/users']); }
  navigateToDonation() { this.router.navigate(['/donations']); }
  navigateToRunner() { this.router.navigate(['/runner']); }
  navigateToEmployees() { this.router.navigate(['/employees']); }
  navigateToInventory() { this.router.navigate(['/inventory']); }
  logout() { this.router.navigate(['/login']); }
}

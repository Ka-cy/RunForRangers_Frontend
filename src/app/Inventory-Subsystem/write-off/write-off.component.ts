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
import { NotificationModalComponent } from '../../Notification/notification.component';

@Component({
  selector: 'app-write-off',
  templateUrl: './write-off.component.html',
  styleUrls: ['./write-off.component.css'],
  imports: [CommonModule, FormsModule, RouterModule, NotificationModalComponent],
  standalone: true,
})
export class WriteOffComponent implements OnInit {
  productId: number = 0;
  productColourId: number = 0;
  productSizeId: number = 0;
  quantity: number = 0;
  description: string = '';
  productName: string = '';
  colourList: IProductColour[] = [];
  sizeList: IProductSize[] = [];
userId: any = JSON.parse(sessionStorage.getItem('adminData') || '{}').userId;
  constructor(
    private route: ActivatedRoute,
    private inventoryService: InventoryService,
    public router: Router,
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.productId = +params['productId'] || 0;
      this.productColourId = +params['productColourId'] || 0;
      this.productSizeId = +params['productSizeId'] || 0;
    });
    this.loadColours();
    this.loadSizes();
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

  onSubmit(form: NgForm) {
    if (!this.productId || !this.productColourId || !this.productSizeId || this.quantity <= 0) return;

    const payload = {
      productId: this.productId,
      productColourId: this.productColourId,
      productSizeId: this.productSizeId,
      quantity: this.quantity,
      description: this.description
    };

    this.inventoryService.writeOff(payload,this.userId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Stock written off successfully', 'Write-off Success');
        this.router.navigate(['/inventory']);
      },
      error: err => {
        console.error(err);
        this.notificationService.showError('Error writing off stock', 'Write-off Error');
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
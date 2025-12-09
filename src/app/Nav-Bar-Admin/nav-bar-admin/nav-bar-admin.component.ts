  // admin-nav.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { CommonModule } from '@angular/common';
import { IUser } from '../../Interfaces/IUser';


@Component({
  selector: 'app-nav-bar-admin',
  imports: [CommonModule],
  templateUrl: './nav-bar-admin.component.html',
  styleUrl: './nav-bar-admin.component.css'
})


export class NavBarAdminComponent implements OnInit{

  @Input() activeRoute: string = '';
  showReportsDropdown: boolean = false;

  constructor(private router: Router) { }
adminData: any;
  ngOnInit(): void {
    // Get current route if not provided
    if (!this.activeRoute) {
      this.activeRoute = this.router.url;
    }
    
    // Get admin data from session storage with null check
    const adminDataString = sessionStorage.getItem('adminData');
    this.adminData = adminDataString ? JSON.parse(adminDataString) : {
      firstName: 'Admin',
      surname: 'User',
      enableProductCRUD: true,
      enableOrderCRUD: true,
      enableEventCRUD: true,
      enableExpenditureCRUD: true,
      enableDonationCRUD: true,
      enableRunnerCRUD: true,
      enableEmployeeCRUD: true,
      enableInventoryCRUD: true,
      enableDeliveryCRUD: true,
      enableReportCRUD: true
    };
  }

toggleReportsDropdown(): void {
    this.showReportsDropdown = !this.showReportsDropdown;
  }



// Change to all necessary navigation  routes

navigateToHelp() {
this.router.navigate(['admin-help']);
}


 navigateToManagement(): void {
  this.router.navigate(['/admin-home']);
 }
  navigateToDonation(): void {
    this.router.navigate(['/donations']);
  }

  navigateToRunner(): void {
    this.router.navigate(['/runners']);
  }

  navigateToEmployees(): void {
    this.router.navigate(['/employees']);
  }


  navigateToProducts(): void {
    this.router.navigate(['/products']);
  }

  navigateToExpenditures(): void {
this.router.navigate(['expenditure-home']);
  }

navigateToDashboard(): void {

    this.router.navigate(['/dashboard']);
}

navigateToSettings(): void {
    this.router.navigate(['/update-admin']);
}
navigateToOTP(): void {
    this.router.navigate(['/otp-configure']);
}

//reports
navigateToReports(): void {
this.router.navigate(['reports']);
}

//dropdown navigation pages

navigateToDonationReport(): void {
    this.router.navigate(['/reports/donation']);
}

navigateToOrganisationDonationReport(): void {
    this.router.navigate(['/reports/organisation-donation']);
}

navigateToRunnerDonationReport(): void {
    this.router.navigate(['/reports/runner-donation']);
}

navigateToSalesReport(): void {
    this.router.navigate(['/reports/sales']);
}

navigateToExpenditureReport(): void {
    this.router.navigate(['/reports/expenditure']);
}




navigateToOrders(): void {
this.router.navigate(['/admin/orders']);
}

nagivateToEvents(): void {
this.router.navigate(['events']);
}

navigateToInventory(): void {
this.router.navigate(['/inventory']);
}

navigateToDelivery(): void {
this.router.navigate(['/delivery']);
}



  logout(): void {
    // Add your logout logic here
    // For example: clear tokens, redirect to login
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    this.router.navigate(['/home']);
  }

  isActiveRoute(route: string): boolean {
    return this.activeRoute.includes(route);
  }
}

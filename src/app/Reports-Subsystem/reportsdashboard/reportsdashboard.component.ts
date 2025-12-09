import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';

@Component({
  selector: 'app-reportsdashboard',
  imports: [NavBarAdminComponent],
  templateUrl: './reportsdashboard.component.html',
  styleUrls: ['./reportsdashboard.component.css']
})
export class ReportsdashboardComponent {

  showUserDropdown: boolean = false;

  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
  }

  getCurrentUserInitials(): string {
    const u = localStorage.getItem('currentUserLoggedIn');
    if (!u) return 'AD';
    try { const obj = JSON.parse(u); const first = obj.firstName || obj.firstname || ''; const last = obj.lastName || obj.surname || ''; return ((first[0] || '') + (last[0] || '')).toUpperCase() || 'AD'; } catch { return 'AD'; }
  }

  getCurrentUserName(): string { const u = localStorage.getItem('currentUserLoggedIn'); if (!u) return 'Admin'; try { const obj = JSON.parse(u); return obj.firstName + ' ' + (obj.lastName || ''); } catch { return 'Admin'; } }

  getCurrentUserRole(): string { const u = localStorage.getItem('currentUserLoggedIn'); if (!u) return 'Administrator'; try { const obj = JSON.parse(u); return obj.role || obj.userRole || 'Administrator'; } catch { return 'Administrator'; } }

  constructor(private router: Router) {}

  navigateToExpenditureReport(): void {
    this.router.navigate(['/expenditure-report']);
  }

  navigateToOrganisationDonationReport(): void {
    // TODO: Implement when ready
    alert('Organisation Donation Report - Coming Soon');
  }

  navigateToRunnerDonationReport(): void {
    // TODO: Implement when ready
    alert('Runner Donation Report - Coming Soon');
  }

  navigateToSalesReport(): void {
    // TODO: Implement when ready
    alert('Sales Report - Coming Soon');
  }

  navigateToProductOnHandReport(): void {
    // TODO: Implement when ready
    alert('Product on Hand Report - Coming Soon');
  }
}

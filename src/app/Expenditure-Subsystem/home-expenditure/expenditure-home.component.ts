import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ExpenditureService } from '../../API-Services/expenditure.service';
import { DatePipe } from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { Iexpenditure } from '../../Interfaces/iexpenditure';
import { NotificationService } from '../../API-Services/notification.service';
import { NotificationModalComponent } from '../../Notification/notification.component';
import { Subscription } from 'rxjs';
import { HelpButtonComponent } from "../../Admin-Subsystem/help-button/help-button/help-button.component";

@Component({
  selector: 'app-expenditure-home',
  standalone: true,
  templateUrl: './expenditure-home.component.html',
  styleUrls: ['./expenditure-home.component.css'],
  imports: [DatePipe, CurrencyPipe, CommonModule, FormsModule, NavBarAdminComponent, NotificationModalComponent, HelpButtonComponent]
})
export class ExpenditureHomeComponent implements OnInit, OnDestroy {
  expenditures: Iexpenditure[] = [];
  filteredExpenditures: Iexpenditure[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  actionLoading: { [key: number]: boolean } = {};
  pendingDeleteId: number | null = null;
  private confirmationSubscription?: Subscription;

  constructor(private router: Router, private expenditureService: ExpenditureService, private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadExpenditures();
  }

  ngOnDestroy(): void {
    if (this.confirmationSubscription) {
      this.confirmationSubscription.unsubscribe();
    }
  }

  // Role-based access control methods (all admins have full access)
  isHeadAdmin(): boolean {
    return true;
  }

  isNormalAdmin(): boolean {
    return true;
  }

  canModifyData(): boolean {
    return true; // All admins can create/edit/delete
  }

  loadExpenditures(): void {
    this.isLoading = true;
    this.expenditureService.GetAllExpenditures().subscribe({
      next: (data) => {
        console.log('Expenditures received:', data);
        if (data.length > 0) {
          console.log('First expenditure structure:', data[0]);
          console.log('First expenditure ID:', data[0].expenditureId);
          console.log('All property names:', Object.keys(data[0]));
        }
        this.expenditures = data;
        this.filteredExpenditures = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading expenditures:', err);
        this.isLoading = false;
        this.notificationService.showError(
          'Loading Failed',
          'Failed to load expenditures. Please check the console for details.'
        );
      }
    });
  }

  onSearchChange(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredExpenditures = this.expenditures;
    } else {
      const searchLower = this.searchTerm.toLowerCase().trim();
      this.filteredExpenditures = this.expenditures.filter(expenditure =>
        expenditure.purpose?.toLowerCase().includes(searchLower)
      );
    }
  }
userId:any= JSON.parse(sessionStorage.getItem('adminData') || '{}').userId;
  deleteExpenditure(expenditureId: number): void {
    this.notificationService.showWarning(
      'Confirm Delete',
      'Are you sure you want to delete this expenditure? This action cannot be undone.',
      'Delete',
      'Cancel'
    );

    // Subscribe to confirmation result
    if (this.confirmationSubscription) {
      this.confirmationSubscription.unsubscribe();
    }

    this.confirmationSubscription = this.notificationService.confirmation$.subscribe(confirmed => {
      if (confirmed) {
        this.performDelete(expenditureId);
      }
      // Unsubscribe after handling the confirmation
      if (this.confirmationSubscription) {
        this.confirmationSubscription.unsubscribe();
        this.confirmationSubscription = undefined;
      }
    });
  }

  private performDelete(expenditureId: number): void {
    this.actionLoading[expenditureId] = true;

    this.expenditureService.DeleteExpenditurebyId(expenditureId,this.userId).subscribe({
      next: (response) => {
        this.actionLoading[expenditureId] = false;
        this.notificationService.showSuccess(
          'Success!',
          'Expenditure deleted successfully!'
        );
        setTimeout(() => {
          this.loadExpenditures();
        }, 1000);
      },
      error: (err) => {
        this.actionLoading[expenditureId] = false;
        console.error('Delete failed:', err);
        this.notificationService.showError(
          'Delete Failed',
          'Failed to delete expenditure: ' + (err.error?.message || err.message)
        );
      }
    });
  }

  EditExpenditureById(item: Iexpenditure): void {
    // Pass the complete expenditure data including dateOfCreation
    const expenditureToEdit = {
      expenditureId: item.expenditureId,
      purpose: item.purpose,
      description: item.description,
      amount: item.amount,
      dateOfCreation: item.dateOfCreation,
      receiptImage: item.receiptImage || ''
    };
    
    localStorage.setItem('expenditureToEdit', JSON.stringify(expenditureToEdit));
    this.router.navigate(['/edit-expenditure']);
  }

  addNew(): void {
    this.router.navigate(['/create-expenditure']);
  }

  isImage(receiptImage: string): boolean {
    return receiptImage ? receiptImage.startsWith('data:image/') : false;
  }

  isPDF(receiptImage: string): boolean {
    return receiptImage ? receiptImage.startsWith('data:application/pdf') : false;
  }

  downloadPDF(receiptImage: string): void {
    if (this.isPDF(receiptImage)) {
      const link = document.createElement('a');
      link.href = receiptImage;
      link.download = 'receipt.pdf';
      link.click();
    }
  }
}

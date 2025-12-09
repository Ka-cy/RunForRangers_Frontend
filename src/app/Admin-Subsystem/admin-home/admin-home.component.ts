import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IadminRoleUpdate, IUser } from '../../Interfaces/IUser';
import { UserService } from '../../API-Services/user.service';
import { NavBarAdminComponent } from "../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component";
import { IAuditLog } from '../../Interfaces/IAuditLog';

@Component({
  selector: 'app-admin-home',
  imports: [FormsModule, CommonModule, NavBarAdminComponent],
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.css']
})
export class AdminHomeComponent implements OnInit {


  constructor(private router: Router, private userService: UserService) { };

  userlist: any[] = [];
  adminlist: any[] = [];
  searchlist: any[] = [];
  auditLog: IAuditLog[] = [];

  adminData: any = sessionStorage.getItem('adminData') ? JSON.parse(sessionStorage.getItem('adminData')!) : null;
  currentView: string = 'user';
  showUserDropdown = false;
  showEditProfile: boolean = false;
  // Header search term (for header search input)
  searchTerm: string = '';



  


  headAdmin = this.adminData && this.adminData.roleId === 4 ? true : false;
  

  ngOnInit(): void {
    this.userService.GetAllUsers().subscribe({
      next: (data) => {
        this.userlist = data;
        console.log('Users fetched successfully:', this.userlist);
        console.log(this.headAdmin);
      },
      error: (error: any) => {
        console.error('Error fetching users:', error);
      }
    });

    this.userService.GetAllAdmins().subscribe({
      next: (data: IUser[]) => {
        this.adminlist = data;
        console.log('Admin fetched successfully:', this.adminlist);
      },
      error: (error: any) => {
        console.error('Error fetching admins:', error);
      }
    });

    // Default date: today
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];

    this.userService.AuditLogHistory(formattedDate).subscribe({
      next: (data) => {
        this.auditLog = data;
        console.log('AuditLog history fetched successfully:',data);
      },
      error: (error: any) => {
        console.error('Error fetching login history:', error);
      }
    });

    this.currentView = 'admin';

  }

  // Header search handlers (match employee dashboard behavior)
  onHeaderSearchInput() {
    const term = this.searchTerm?.trim();
    if (!term) return;
    // Reuse existing Search behavior to perform a general search
    // We'll place results into searchlist and switch view to 'search'
    this.userService.Search(term).subscribe({
      next: (data) => {
        this.searchlist = data;
        this.currentView = 'search';
        console.log('Header search results:', data);
      },
      error: (err) => console.error('Header search error', err)
    });
  }

  clearHeaderSearch() {
    this.searchTerm = '';
    // Optionally reset view
    // this.currentView = 'admin';
  }

  getCurrentUserInitials(): string {
    if (!this.adminData) return '';
    const f = this.adminData.firstName || '';
    const s = this.adminData.surname || '';
    return (f.charAt(0) + s.charAt(0)).toUpperCase();
  }

  toggleUserDropdown() {
    this.showUserDropdown = !this.showUserDropdown;
  }


 fetchAuditlog(start: Date) {
    const startDate = start.toISOString().split('T')[0];
  this.userService.AuditLogHistory(startDate).subscribe({
      next: (data) => {
        this.auditLog = data;
        console.log('AuditLog fetched successfully:', this.auditLog);
      },
      error: (error: any) => {
        console.error('Error fetching login history:', error);
      }
    });

    
  }

  fetchauditLogRange(start: Date, end: Date) {
    const startDate = start.toISOString().split('T')[0];
    const endDate = end.toISOString().split('T')[0];

    this.userService.AuditLogHistoryRange(startDate, endDate).subscribe({
      next: (data:any) => {
        this.auditLog = data;
        console.log('Login history fetched successfully:', this.auditLog);
      },
      error: (err:any) => {
        console.error('Error fetching login range:', err);
      }
    });
  }


  Search(){
    const searchInput = (document.querySelector('.search') as HTMLInputElement).value;
    if (searchInput) {
      this.userService.Search(searchInput).subscribe({
        next: (data) => {
          this.searchlist = data;
          this.currentView = 'search';
          
          console.log('Search results:', this.userlist);
        },
        error: (error: any) => {
          console.error('Error searching users:', error);
        }

      })
      ;
    } else {
      console.warn('Search input is empty');
    }
(document.querySelector('.search') as HTMLInputElement).value = '';
  }

  onDateFilterChange(event: any) {
    const selectedValue = event.target.value;
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (selectedValue) {
      case 'today':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        this.fetchAuditlog(endDate);
        break;
      case 'last7days':
        startDate = new Date();
        startDate.setDate(today.getDate() - 6);
        this.fetchauditLogRange(startDate, endDate);
        break;
      case 'last30days':
        startDate = new Date();
        startDate.setDate(today.getDate() - 29);
        this.fetchauditLogRange(startDate, endDate);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        this.fetchauditLogRange(startDate, endDate);
        break;
      default:
        break;
    }
  }

  DisplayUsers() {
    this.currentView = 'user';
    console.log('Displaying users:', this.currentView);
  }

  DisplayAdmins() {
    this.currentView = 'admin';
    console.log('Displaying admins:', this.currentView);
  }

  DisplayLogin() {
    this.currentView = 'login';
    console.log('Displaying Audit logs:', this.currentView);
  }
/*
  DeleteUser(email: string) {

    this.userService.DeleteUser(email).subscribe({
      next: (data) => {
        console.log('User deleted successfully:', data);
        this.userlist = this.userlist.filter(user => user.Email !== email);
      },
      error: (error: any) => {
        console.error('Error deleting user:', error);
      }
    });
  }*/


SearchUser(){
 const searchInput = (document.querySelector('.searchUser') as HTMLInputElement).value;
    if (searchInput) {
      this.userService.SearchUser(searchInput).subscribe({
        next: (data) => {
          this.searchlist = Array.isArray(data) ? data : [data];
          this.currentView = 'searchUser';
          
          console.log('Search results:', this.userlist);
        },
        error: (error: any) => {
          console.error('Error searching users:', error);
        }

      })
      ;
    } else {
      console.warn('Search input is empty');
    }
(document.querySelector('.searchAdmin') as HTMLInputElement).value = '';
}



SearchAdmin(){
    const searchInput = (document.querySelector('.searchAdmin') as HTMLInputElement).value;
    if (searchInput) {
      this.userService.GetAdmin(searchInput).subscribe({
        next: (data) => {
          this.searchlist = Array.isArray(data) ? data : [data];
          this.currentView = 'searchAdmin';
          
          console.log('Search results:', this.searchlist);
        },
        error: (error: any) => {
          console.error('Error searching users:', error);
        }

      })
      ;
    } else {
      console.warn('Search input is empty');
    }
(document.querySelector('.searchAdmin') as HTMLInputElement).value = '';
}




// Impelement of Delete Admin

isDeleteDialogOpen: boolean = false;
adminEmailToDelete: string | null = null;
adminOwnerId: number | null = null;
adminName: string | null = null;

openDeleteDialog(email:string,id: number, name: string) {
  this.adminEmailToDelete = email;
  this.adminOwnerId = id;
  this.adminName = name;
  console.log('Opening delete dialog for admin:', email, id, name);
  this.isDeleteDialogOpen = true;
}

closeDeleteDialog() {
  this.isDeleteDialogOpen = false;
  this.adminOwnerId = null;
}

confirmDelete() {
  this.DeleteAdmin(this.adminEmailToDelete!, this.adminOwnerId!);
  this.closeDeleteDialog();
}



  DeleteAdmin(email: string,owernId:number) {
    this.userService.DeleteAdmin(email,this.adminData.userId).subscribe({
      next: (data) => {
        console.log('Admin deleted successfully:', data);
        this.adminlist = this.adminlist.filter(admin => admin.Email !== email);
       this.ngOnInit();
      },
      error: (error: any) => {
        console.error('Error deleting admin:', error);
      }
    });
  }




  // Navigation methods


navigateToRoleUpdate(admin:IadminRoleUpdate) {
    sessionStorage.setItem('adminRoleUpdate', JSON.stringify(admin));
    this.router.navigate(['/update-role']);
}
  navigateToUpdateAdmin() {
    this.router.navigate(['/update-admin']);
  }

  navigateToCreateAdmin() {
    this.router.navigate(['/create-admin']);
  }

  

  logout() {
    sessionStorage.removeItem('adminData');
    sessionStorage.removeItem('adminRoleUpdate');
    this.router.navigate(['/home']);
  }
}

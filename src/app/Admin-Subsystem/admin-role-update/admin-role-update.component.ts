import { Component, OnInit } from '@angular/core';
import { IadminRoleUpdate } from '../../Interfaces/IUser';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../API-Services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-role-update',
  imports: [FormsModule, CommonModule],
  standalone: true,
  templateUrl: './admin-role-update.component.html',
  styleUrl: './admin-role-update.component.css'
})
export class AdminRoleUpdateComponent implements OnInit {

  constructor(private router:Router,private userService:UserService) { }
 
  // Define properties for the component
  adminRoleData: IadminRoleUpdate = sessionStorage.getItem('adminRoleUpdate') ? JSON.parse(sessionStorage.getItem('adminRoleUpdate')!) : null;
  showSuccess: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  
ngOnInit(): void {
  this.adminRoleData = sessionStorage.getItem('adminRoleUpdate') ? JSON.parse(sessionStorage.getItem('adminRoleUpdate')!) : null;
  this.showSuccess= false;
  this.successMessage = '';
  this.errorMessage= '';
}


//
updateAdminRole() {
  this.userService.UpdateAdminRole(this.adminRoleData).subscribe({
    next: (response: any) => {
      this.showSuccess = true;
      this.successMessage = 'Admin role updated successfully';
      this.errorMessage = '';
      //sessionStorage.removeItem('adminRoleUpdate');
      console.log('Admin role updated successfully:', this.showSuccess);

      
      // Hide the message after 3 seconds
      setTimeout(() => {
        this.showSuccess = false;
      }, 3000);
    },
    error: (error: any) => {
      this.errorMessage = 'Failed to update admin role: ' + error.message;
       console.log(this.errorMessage);
      this.showSuccess = false;
    }
  });
}


// navigate back to admin home
  back() {
    this.router.navigate(['/admin-home']);
  }



}

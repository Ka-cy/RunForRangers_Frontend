import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IUser } from '../../Interfaces/IUser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../API-Services/user.service';
import { NavBarDefaultComponent } from "../../nav-bar-default/nav-bar-default.component";
import { finalize } from 'rxjs';

@Component({
  selector: 'app-sign-in',
  imports: [CommonModule, FormsModule, NavBarDefaultComponent],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent implements OnInit {
  constructor(private router: Router, private userService: UserService) { }

  loading: boolean = false;
  loginInput: IUser = { email: '', password: '' };
  loginErrors = {
    emailRequired: false,
    passwordRequired: false,
    loginFailed: ''
  };

  ngOnInit() {
    this.clearForm();
    this.loading = false;
  }

  clearForm() {
    this.loginInput.email = '';
    this.loginInput.password = '';
  }

  Login() {
    // Reset errors
    this.loginErrors = {
      emailRequired: false,
      passwordRequired: false,
      loginFailed: ''
    };

    // Client-side validation
    let hasError = false;
    if (!this.loginInput.email) {
      this.loginErrors.emailRequired = true;
      hasError = true;
    }
    if (!this.loginInput.password) {
      this.loginErrors.passwordRequired = true;
      hasError = true;
    }

    if (hasError) return;

    // Start loading
    this.loading = true;

    // Make API call
    this.userService.Login(this.loginInput.email, this.loginInput.password)
      .pipe(
        finalize(() => {
          // Stop loading when API call completes (success or error)
          this.loading = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response && (response.roleId === 1 || response.roleId === 2)) {
            sessionStorage.setItem('userData', JSON.stringify(response));
            // Small delay to show success before navigation
            setTimeout(() => {
            this.nagigateTo2FA();
            }, 500);
          } else if (response && (response.roleId === 3 || response.roleId === 4)) {
            sessionStorage.setItem('adminData', JSON.stringify(response));
            // Small delay to show success before navigation
            setTimeout(() => {
              this.nagigateTo2FA()
            }, 500);
          }
        },
        error: (error: any) => {
          console.error('Sign-in error:', error);
          this.loginErrors.loginFailed = 'Invalid email or password.';
        }
      });
  }

  ForgetPassword() {
    this.router.navigate(['/forget-password']);
  }

  // Navigation methods
  navigateToAbout() {
    this.router.navigate(['/about']);
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }
nagigateTo2FA() {

this.router.navigate(['/twoFA-page']);
}
  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  navigateToUserDashboard() {
    this.router.navigate(['/admin-home']);
  }
}
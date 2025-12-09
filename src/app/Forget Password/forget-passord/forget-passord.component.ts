import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavBarDefaultComponent } from "../../nav-bar-default/nav-bar-default.component";
import { UserService } from '../../API-Services/user.service';
import { Router } from '@angular/router';
import { IForgetPassword } from '../../Interfaces/IForgetPassword';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [CommonModule, FormsModule, NavBarDefaultComponent],
  templateUrl: './forget-passord.component.html',
  styleUrls: ['./forget-passord.component.css']
})
export class ForgetPasswordComponent implements OnInit {
  
  email: string = '';
  showCodeInput: boolean = false;
  code: string[] = ['', '', '', '', ''];
  loading: boolean = false;
  
  // Error handling
  emailError: boolean = false;
  codeError: string = '';
  submitError: string = '';

  credentials: IForgetPassword = { email: "", code: "" };

  constructor(private userService: UserService, private router: Router) { }

  ngOnInit(): void {
    this.clearForm();
  }

  clearForm() {
    this.email = '';
    this.showCodeInput = false;
    this.code = ['', '', '', '', ''];
    this.loading = false;
    this.emailError = false;
    this.codeError = '';
    this.submitError = '';
  }

  verifyEmail() {
    // Reset errors
    this.emailError = false;
    this.submitError = '';

    // Validation
    if (!this.email) {
      this.emailError = true;
      return;
    }

    // Start loading
    this.loading = true;

    this.userService.ForgetPassword(this.email)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Reset email sent successfully:', response);
          this.credentials = response;
          this.showCodeInput = true;
          // Small delay for better UX
          setTimeout(() => {
            const firstInput = document.querySelector('input[name="code1"]') as HTMLInputElement;
            if (firstInput) {
              firstInput.focus();
            }
          }, 100);
        },
        error: (err) => {
          console.error('Error sending reset email:', err);
          this.submitError = 'Failed to send verification code. Please try again.';
        }
      });
  }

  onCodeInput(event: any, index: number) {
    const value = event.target.value;

    // Reset code error when user starts typing
    this.codeError = '';

    // Only allow digits
    if (!/^\d*$/.test(value)) {
      event.target.value = '';
      this.code[index] = '';
      return;
    }

    this.code[index] = value;

    // Auto-focus next input
    if (value && index < 4) {
      const nextInput = document.querySelector(`input[name="code${index + 2}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onKeyDown(event: any, index: number) {
    // Handle backspace to go to previous input
    if (event.key === 'Backspace' && !this.code[index] && index > 0) {
      const prevInput = document.querySelector(`input[name="code${index}"]`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  onCodeSubmit() {
    // Reset errors
    this.codeError = '';

    if (!this.isCodeComplete()) {
      this.codeError = 'Please enter the complete verification code';
      return;
    }

    const fullCode = this.code.join('');
    this.credentials = { email: this.email, code: fullCode };
    
    // Start loading
    this.loading = true;

    this.userService.ForgetPasswordLogin(this.credentials)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          console.log("Verification successful:", response);
          
          if (response.roleId < 3) {
            sessionStorage.setItem('userData', JSON.stringify(response));
            // Small delay to show success before navigation
            setTimeout(() => {
              this.navigateToUserProfile();
            }, 500);
          } else {
            sessionStorage.setItem('adminData', JSON.stringify(response));
            // Small delay to show success before navigation
            setTimeout(() => {
              this.navigateToAdminProfile();
            }, 500);
          }
        },
        error: (error: any) => {
          console.error('Error with Forget Password Code:', error);
          this.codeError = 'Invalid verification code. Please try again.';
        }
      });
  }

  isCodeComplete(): boolean {
    return this.code.every(digit => digit !== '');
  }

  goBack() {
    this.showCodeInput = false;
    this.code = ['', '', '', '', ''];
    this.codeError = '';
    // Focus back to email input
    setTimeout(() => {
      const emailInput = document.getElementById('email') as HTMLInputElement;
      if (emailInput) {
        emailInput.focus();
      }
    }, 100);
  }

  navigateToUserProfile() {
    this.router.navigate(['/edit-user-profile']);
  }

  navigateToAdminProfile() {
    this.router.navigate(['/update-admin']);
  }
}
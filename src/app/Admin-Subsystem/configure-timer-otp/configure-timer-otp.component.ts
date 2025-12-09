import { Component, OnInit } from '@angular/core';
import { NavBarAdminComponent } from '../../Nav-Bar-Admin/nav-bar-admin/nav-bar-admin.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../API-Services/user.service';
import { DBResetService } from '../../API-Services/dbreset.service';

@Component({
  selector: 'app-configure-timer-otp',
  imports: [NavBarAdminComponent, CommonModule, FormsModule],
  templateUrl: './configure-timer-otp.component.html',
  styleUrls: ['./configure-timer-otp.component.css']
})
export class ConfigureTimerOtpComponent implements OnInit {
  TimerLimit: number = 0;
  NewTimerLimit: number | string = '';
  minutes: number[] = [5, 10, 15, 30];
  
  // Message handling properties
  isMessageVisible: boolean = false;  // Changed from showMessage to avoid conflict
  message: string = '';
  messageType: string = '';
  
  // Loading state
  isLoading: boolean = false;

  constructor(private userService: UserService,private dbresetService:DBResetService) { }

  // Minimal header helpers
  showUserDropdown: boolean = false;

  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
  }
  getCurrentUserInitials(): string {
    try { const u = (this as any).userService?.currentUser; return (u && (u.firstName||'').charAt(0) + (u.surname||'').charAt(0)).toUpperCase() || 'AD'; } catch { return 'AD'; }
  }

  getCurrentUserName(): string { try { const u=(this as any).userService?.currentUser; return u? `${u.firstName||''} ${u.surname||''}`.trim() : 'Admin'; } catch { return 'Admin'; } }

  getCurrentUserRole(): string { try { const u=(this as any).userService?.currentUser; return u?.role || 'Administrator'; } catch { return 'Administrator'; } }

  ngOnInit(): void {
    this.GetTimerLimit();
  }

  logout(): void {
    try { localStorage.removeItem('currentUserLoggedIn'); } catch { }
    // No router injected here; use location fallback or let NavBar/Admin handle navigation
    window.location.href = '/signin';
  }

  GetTimerLimit(): void {
    this.isLoading = true;
    this.userService.GetOTPTimer().subscribe(
      (response: any) => {
        this.TimerLimit = response.timerMinutes;
        this.isLoading = false;
        console.log('Current timer limit:', this.TimerLimit);
      },
      (error: any) => {
        console.error('Error fetching timer limit:', error);
        this.isLoading = false;
        this.displayMessage('Error fetching current timer limit', 'alert-danger');
      }
    );
  }

  ChangeTimerLimit(): void {
    if (!this.NewTimerLimit) {
      this.userService.ChangeOTPTimer(this.TimerLimit).subscribe(
        (response: any) => {
          console.log('Timer limit reset successfully:', response);
        }
      );
      return;
    }

    // Convert to number if it's a string
    const newLimit = typeof this.NewTimerLimit === 'string' 
      ? parseInt(this.NewTimerLimit, 10) 
      : this.NewTimerLimit;

    if (newLimit === this.TimerLimit) {
      this.displayMessage('The selected time limit is the same as current limit', 'alert-danger');
      return;
    }

    this.isLoading = true;
    this.userService.ChangeOTPTimer(newLimit).subscribe(
      (response: any) => {
        console.log('Timer limit updated successfully:', response);
        this.TimerLimit = newLimit;
        this.NewTimerLimit = '';
        this.isLoading = false;
        this.displayMessage(`Timer limit updated successfully to ${newLimit} minutes`, 'alert-success');
      },
      (error: any) => {
        console.error('Error updating timer limit:', error);
        this.isLoading = false;
        this.displayMessage('Error updating timer limit. Please try again.', 'alert-danger');
      }
    );
  }

  ResetSelection(): void {
    this.NewTimerLimit = '';
    this.hideMessage();
  }

  displayMessage(message: string, type: string): void {  // Renamed from showMessage to avoid conflict
    this.message = message;
    this.messageType = type;
    this.isMessageVisible = true;
    
    // Auto hide message after 5 seconds
    setTimeout(() => {
      this.hideMessage();
    }, 5000);
  }

  hideMessage(): void {
    this.isMessageVisible = false;
    this.message = '';
    this.messageType = '';
  }

  isValidSelection(): boolean {
    return this.NewTimerLimit !== '' && 
           this.NewTimerLimit !== null && 
           this.NewTimerLimit !== undefined;
  }

  // Database Reset Functionality (Placeholder)
  ResetDatabase(): void {
    // Implement database reset logic here
  this.dbresetService.ResetDatabase().subscribe(
    (response: any) => {
      console.log('Database reset successfully:', response);
      this.displayMessage('Database reset successfully', 'alert-success');
    },
    (error: any) => {
      console.error('Error resetting database:', error);
      this.displayMessage('Error resetting database. Please try again.', 'alert-danger');
    }
  );
  }

}
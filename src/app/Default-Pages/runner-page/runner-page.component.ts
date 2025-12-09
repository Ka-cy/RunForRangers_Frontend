import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavBarDefaultComponent } from "../../nav-bar-default/nav-bar-default.component";

@Component({
  selector: 'app-runner-page',
  imports: [CommonModule, FormsModule, NavBarDefaultComponent],
  templateUrl: './runner-page.component.html',
  styleUrl: './runner-page.component.css'
})
export class RunnerPageComponent implements OnInit {

  currentUser: any = null;
  userIsLoggedIn: boolean = false;
  runnerStats = {
    eventsJoined: 0,
    milestonesCompleted: 0,
    totalDistance: '0km',
    achievements: 0
  };

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.currentUser = JSON.parse(sessionStorage.getItem('userData') || 'null');
    console.log("Current User:", this.currentUser);
    
    // Initialize runner stats (in real app, would fetch from API)
    this.loadRunnerStats();
  }

  loadRunnerStats(): void {
    // TODO: Replace with actual API call to get runner statistics
    // For now, using placeholder values
    this.runnerStats = {
      eventsJoined: 3,
      milestonesCompleted: 7,
      totalDistance: '42.5km',
      achievements: 2
    };
  }

  isUserLoggedIn(): boolean {
    return this.currentUser != null;
  }

  // Navigation methods
  navigateToRunnerMilestone(): void {
    this.router.navigate(['/runner-milestone']);
  }

  navigateYToHelp(): void {
    this.router.navigate(['/help-section']);
  }

  navigateToRunnerpage(): void {
    this.router.navigate(['/runner-page']);
  }

  navigateToSignIn(): void {
    this.router.navigate(['/signIn']);
  }

  navigateToAbout(): void {
    this.router.navigate(['/about']);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateToShop(): void {
    this.router.navigate(['/shop']);
  }

  navigateToEvents(): void {
    this.router.navigate(['/events-page']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  openEditProfile(): void {
    this.router.navigate(['/edit-runner-profile']);
  }

  logout(): void {
    sessionStorage.removeItem('userData');
    this.currentUser = null;
    this.userIsLoggedIn = false;
    this.router.navigate(['/home']);
  }

  // Utility methods
  getInitials(firstName: string, lastName?: string): string {
    if (!firstName) return 'U';
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  }
}
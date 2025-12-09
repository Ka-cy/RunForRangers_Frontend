import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavBarDefaultComponent } from '../../nav-bar-default/nav-bar-default.component';

@Component({
  selector: 'app-about',
  imports: [NavBarDefaultComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {

  constructor(private router: Router) {}

  // Navigation methods
  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  navigateToShop(): void {
    this.router.navigate(['/shop']);
  }

  navigateToHelp(): void {
    this.router.navigate(['/help-section']);
  }

  navigateToContact(): void {
    this.router.navigate(['/contact']);
  }

  // Image error handlers
  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.onerror = null; // Prevent infinite loop
    target.src = 'assets/Images/default-rangers.jpg';
  }

  handleTeamImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.onerror = null; // Prevent infinite loop
    target.src = 'assets/Images/default-avatar.png';
  }
}
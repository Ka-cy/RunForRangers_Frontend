import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-help-button',
  template: `
    <button class="help-btn" (click)="goToHelp()">
      Help
    </button>
  `,
  styles: [`
    .help-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      background-color: #007bff;
      color: white;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .help-btn:hover {
      background-color: #0056b3;
    }
  `]
})
export class HelpButtonComponent {
  @Input() category: string = 'all';

  constructor(private router: Router) {}

  goToHelp() {
    this.router.navigate(['/admin-help'], { queryParams: { category: this.category } });
  }
}

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExtendedRunner } from '../runner-dashboard/runner-dashboard.component';

@Component({
  selector: 'app-runner-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './runner-list.component.html',
  styleUrl: './runner-list.component.css'
})
export class RunnerListComponent {
  @Input() runners: ExtendedRunner[] = [];
  @Output() viewRunner = new EventEmitter<number>();
  @Output() deleteRunner = new EventEmitter<number>();
  @Output() toggleMedical = new EventEmitter<number>();

  getImageUrl(path: string): string {
    if (!path?.trim()) {
      return 'assets/Images/default-avatar.png';
    }
    return `https://localhost:7158/${path}`;
  }

  handleImageError(event: Event): void {
    if (event.target) {
      const target = event.target as HTMLImageElement;
      target.onerror = null;
      target.src = 'assets/Images/default-avatar.png';
    }
  }

  onViewRunner(userId: number): void {
    this.viewRunner.emit(userId);
  }

  onDeleteRunner(userId: number): void {
    this.deleteRunner.emit(userId);
  }

  onToggleMedical(userId: number): void {
    this.toggleMedical.emit(userId);
  }
}

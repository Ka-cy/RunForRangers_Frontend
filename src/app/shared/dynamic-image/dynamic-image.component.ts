import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageService } from '../../API-Services/image.service';


@Component({
  selector: 'app-dynamic-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="image-container" [ngClass]="imageClass">
      <img
        [src]="currentImageSrc"
        [alt]="alt"
        [class]="'dynamic-image ' + size"
        (error)="onImageError($event)"
        (load)="onImageLoad()"
        [style.width]="width"
        [style.height]="height"
      />
      <div *ngIf="showLoader && isLoading" class="image-loader">
        <div class="spinner"></div>
      </div>
      <div *ngIf="showFallbackText && hasError" class="fallback-text">
        {{ fallbackText || 'No Image' }}
      </div>
    </div>
  `,
  styles: [`
    .image-container {
      position: relative;
      display: inline-block;
      overflow: hidden;
    }

    .dynamic-image {
      display: block;
      object-fit: cover;
      transition: opacity 0.3s ease;
    }

    .dynamic-image.small {
      width: 50px;
      height: 50px;
    }

    .dynamic-image.medium {
      width: 100px;
      height: 100px;
    }

    .dynamic-image.large {
      width: 200px;
      height: 200px;
    }

    .dynamic-image.full {
      width: 100%;
      height: auto;
    }

    .image-loader {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .fallback-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
    }

    .error-state {
      background-color: #f8f9fa;
      border: 1px dashed #dee2e6;
    }

    .loading-state {
      opacity: 0.7;
    }
  `]
})
export class DynamicImageComponent implements OnInit {
  @Input() src?: string;
  @Input() alt: string = 'Product Image';
  @Input() productType?: string;
  @Input() productCategory?: string;
  @Input() size: string = 'medium'; // small, medium, large, full
  @Input() width?: string;
  @Input() height?: string;
  @Input() showLoader: boolean = true;
  @Input() showFallbackText: boolean = false;
  @Input() fallbackText?: string;
  @Input() imageClass?: string;

  currentImageSrc: string = '';
  isLoading: boolean = true;
  hasError: boolean = false;

  constructor(private imageService: ImageService) {}

  ngOnInit(): void {
    this.loadImage();
  }

  private loadImage(): void {
    this.isLoading = true;
    this.hasError = false;

    this.imageService.getProductImageUrl(this.src, this.productType, this.productCategory)
      .subscribe(imageSrc => {
        this.currentImageSrc = imageSrc;
      });
  }

  onImageError(event: any): void {
    this.isLoading = false;
    this.hasError = true;

    // Use the image service to handle the error
    this.imageService.handleImageError(event);
  }

  onImageLoad(): void {
    this.isLoading = false;
    this.hasError = false;
  }

  // Method to refresh the image (useful for dynamic updates)
  refreshImage(): void {
    this.loadImage();
  }
}

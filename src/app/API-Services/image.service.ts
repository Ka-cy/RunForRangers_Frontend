import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { FileUploadService } from './file-upload.service';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  
  // Default placeholder images for different product types
  private defaultImages: { [key: string]: string } = {
    'clothing': 'assets/Images/t-shirt.png',
    'electronics': 'assets/Images/Headphones.webp',
    'accessories': 'assets/Images/Jacket.png',
    'default': 'assets/Images/default-product.svg'
  };

  constructor(private fileUploadService: FileUploadService) { }

  /**
   * Get the appropriate image URL for a product
   * @param productImage - The product image path/URL from the database
   * @param productType - The product type to determine fallback image
   * @param productCategory - The product category for additional context
   * @returns Observable<string> - The image URL to use
   */
  getProductImageUrl(productImage?: string, productType?: string, productCategory?: string): Observable<string> {
    // If we have a valid product image, determine how to handle it
    if (productImage && this.isValidImagePath(productImage)) {
      // Check if this is a server-uploaded image (GUID format) or an old asset path
      if (this.isServerUploadedImage(productImage)) {
        // Use FileUploadService for server-uploaded images
        const imageUrl = this.fileUploadService.getImageUrl(productImage);
        return of(imageUrl);
      } else {
        // For old asset images, construct the asset path
        const assetPath = this.constructAssetPath(productImage);
        return of(assetPath);
      }
    }

    // Otherwise, return appropriate default image
    const defaultImage = this.getDefaultImageByType(productType, productCategory);
    return of(defaultImage);
  }

  /**
   * Check if an image exists and can be loaded
   * @param imagePath - The image path to check
   * @returns Promise<boolean> - Whether the image exists
   */
  checkImageExists(imagePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = imagePath;
    });
  }

  /**
   * Get fallback image based on product type or category
   * @param productType - The product type
   * @param productCategory - The product category
   * @returns string - The fallback image path
   */
  getDefaultImageByType(productType?: string, productCategory?: string): string {
    // Check category first
    if (productCategory) {
      const categoryLower = productCategory.toLowerCase();
      if (categoryLower.includes('clothing') || categoryLower.includes('apparel')) {
        return this.defaultImages['clothing'];
      }
      if (categoryLower.includes('electronic') || categoryLower.includes('tech')) {
        return this.defaultImages['electronics'];
      }
      if (categoryLower.includes('accessory') || categoryLower.includes('accessorie')) {
        return this.defaultImages['accessories'];
      }
    }

    // Check type
    if (productType) {
      const typeLower = productType.toLowerCase();
      if (typeLower.includes('shirt') || typeLower.includes('clothing')) {
        return this.defaultImages['clothing'];
      }
      if (typeLower.includes('headphone') || typeLower.includes('electronic')) {
        return this.defaultImages['electronics'];
      }
      if (typeLower.includes('jacket') || typeLower.includes('accessory')) {
        return this.defaultImages['accessories'];
      }
    }

    return this.defaultImages['default'];
  }

  /**
   * Normalize image path to ensure proper format
   * @param imagePath - The original image path
   * @returns string - The normalized path
   */
  private normalizeImagePath(imagePath: string): string {
    // Use FileUploadService to get the correct URL
    return this.fileUploadService.getImageUrl(imagePath);
  }

  /**
   * Check if the image path looks valid
   * @param imagePath - The image path to validate
   * @returns boolean - Whether the path looks valid
   */
  private isValidImagePath(imagePath: string): boolean {
    if (!imagePath || imagePath.trim() === '') {
      return false;
    }

    // Check for common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const hasValidExtension = imageExtensions.some(ext => 
      imagePath.toLowerCase().includes(ext)
    );

    return hasValidExtension;
  }

  /**
   * Check if this is a server-uploaded image (has GUID format)
   * @param imagePath - The image path to check
   * @returns boolean - Whether this is a server-uploaded image
   */
  private isServerUploadedImage(imagePath: string): boolean {
    // Server-uploaded images have GUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\./i;
    return guidPattern.test(imagePath);
  }

  /**
   * Construct asset path for old images
   * @param imagePath - The original image filename
   * @returns string - The asset path
   */
  private constructAssetPath(imagePath: string): string {
    // If it already starts with assets/, return as is
    if (imagePath.startsWith('assets/')) {
      return imagePath;
    }
    
    // If it starts with /, treat as absolute asset path
    if (imagePath.startsWith('/')) {
      return `assets${imagePath}`;
    }
    
    // Otherwise, assume it's in the Images folder
    return `assets/Images/${imagePath}`;
  }

  /**
   * Handle image loading errors
   * @param event - The error event
   * @param fallbackSrc - The fallback image source
   */
  handleImageError(event: any, fallbackSrc?: string): void {
    if (fallbackSrc) {
      event.target.src = fallbackSrc;
    } else {
      event.target.src = this.defaultImages['default'];
    }
  }

  /**
   * Get all available default images
   * @returns object - Available default images
   */
  getDefaultImages(): { [key: string]: string } {
    return { ...this.defaultImages };
  }

  /**
   * Add or update a default image for a specific type
   * @param type - The product type
   * @param imagePath - The image path
   */
  setDefaultImage(type: string, imagePath: string): void {
    this.defaultImages[type] = imagePath;
  }
}

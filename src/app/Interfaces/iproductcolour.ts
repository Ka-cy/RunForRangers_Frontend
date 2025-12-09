export interface IProductColour {
  productColorId: number;
  colorName: string;
  colorDescription: string;
  hexCode?: string; // Optional hex color code for visual display
  isActive?: boolean; // Added for consistency with backend
}
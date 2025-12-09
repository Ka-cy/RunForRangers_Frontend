
export interface IInventory {
  inventoryId?: number;
  productId: number;
  productColorId: number;
  productSizeId: number;
  description: string;
  quantity: number;
  imageUrl?: string;
  date?: Date;
  productName?: string; 
  colorName?: string;  
  sizeName?: string;    
  productImage?: string; // Image from product table
  productType?: string; // Product type name
  productCategory?: string; // Product category name
}
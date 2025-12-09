// ====================================================================
// PRODUCT INTERFACES WITH PROPER BUSINESS LOGIC
// ====================================================================

// Main Product Interface
export interface Iproduct {
    productId: number;
    productName: string;
    productDescription: string;
    price: number;
    productImage: string;
    productTypeId: number;
    sizeTypeId: number; // BUSINESS RULE: Product must have a size type assigned
    isActive: boolean;
    createdDate?: Date;
    updatedDate?: Date;
}

// Product Category Interface (Root level - e.g., "Clothing", "Crockery", "Electronics")
export interface IproductCategory {
    productCategoryId: number;
    categoryName: string;
    categoryDescription?: string;
    isActive: boolean;
    createdDate?: Date;
    updatedDate?: Date;
}

// Product Type Interface (BUSINESS RULE: Types belong to specific categories only)
export interface IproductType {
    productTypeId: number;
    typeName: string;
    typeDescription?: string;
    productCategoryId: number; // BUSINESS RULE: Cannot assign "Men's Clothing" to "Crockery"
    isActive: boolean;
    createdDate?: Date;
    updatedDate?: Date;
}

// Size Type Interface (NEW: Different sizing systems - e.g., "Clothing Sizes", "Shoe Sizes", "Pants Sizes")
export interface IsizeType {
    sizeTypeId: number;
    sizeTypeName: string;
    sizeTypeDescription?: string;
    isActive: boolean;
    createdDate?: Date;
    updatedDate?: Date;
}

// Product Size Interface (BUSINESS RULE: Sizes belong to a specific size type)
export interface Iproductsize {
    productSizeId: number;
    sizeName: string;
    sizeDescription?: string;
    sizeTypeId: number; // BUSINESS RULE: Size must belong to a size type
    sortOrder?: number; // For ordering (XS=1, S=2, M=3, L=4, XL=5, etc.)
    isActive: boolean;
    createdDate?: Date;
    updatedDate?: Date;
}

// Product Color Interface (Global colors that can be used by any product)
export interface Iproductcolor {
    productColorId: number;
    colorName: string;
    colorDescription?: string;
    hexCode?: string; // For color display
    isActive: boolean;
    createdDate?: Date;
    updatedDate?: Date;
}

// Product Size Assignment Interface (BUSINESS RULE: Many products can have many sizes)
export interface IproductSizeAssignment {
    productSizeAssignmentId: number;
    productId: number;
    productSizeId: number;
    isActive: boolean;
    createdDate?: Date;
}

// Product Color Assignment Interface (BUSINESS RULE: Many products can have many colors)
export interface IproductColorAssignment {
    productColorAssignmentId: number;
    productId: number;
    productColorId: number;
    isActive: boolean;
    createdDate?: Date;
}

// ====================================================================
// DTOs for API Operations
// ====================================================================

// DTO for creating products
export interface ICreateProductDto {
    productName: string;
    productDescription: string;
    price: number;
    productImage?: string;
    productTypeId: number;
    sizeTypeId: number; // BUSINESS RULE: Must assign a size type when creating product
    sizeIds: number[]; // BUSINESS RULE: Must select sizes from the assigned size type
    colorIds: number[]; // BUSINESS RULE: Must select at least one color
   userId?: number; // Admin creating the product
}

// DTO for updating products
export interface IUpdateProductDto extends ICreateProductDto {
    productId: number;
}

// Response DTO with related data
export interface IProductWithDetails extends Iproduct {
    productType?: IproductTypeWithCategory;
    sizeType?: IsizeType;
    availableSizes?: Iproductsize[];
    availableColors?: Iproductcolor[];
}

// Product Type with Category information
export interface IproductTypeWithCategory extends IproductType {
    productCategory?: IproductCategory;
}

// Request DTOs for assignments
export interface IAssignSizesDto {
    productId: number;
    sizeIds: number[];
}

export interface IAssignColorsDto {
    productId: number;
    colorIds: number[];
}

// ====================================================================
// DTOs for Creating Lookup Data (BUSINESS RULES)
// ====================================================================

// BUSINESS RULE: When creating a category, must assign types to it
export interface ICreateCategoryDto {
    categoryName: string;
    categoryDescription?: string;
    initialTypes: ICreateTypeDto[]; // Must provide initial types for the category
}

// DTO for creating types
export interface ICreateTypeDto {
    typeName: string;
    typeDescription?: string;
    productCategoryId?: number; // Will be set when creating with category
}

// BUSINESS RULE: When creating a size type, must define sizes for it
export interface ICreateSizeTypeDto {
    sizeTypeName: string;
    sizeTypeDescription?: string;
    initialSizes: ICreateSizeDto[]; // Must provide initial sizes for the size type
}

// DTO for creating sizes
export interface ICreateSizeDto {
    sizeName: string;
    sizeDescription?: string;
    sortOrder?: number;
    sizeTypeId?: number; // Will be set when creating with size type
}

// DTO for creating colors
export interface ICreateColorDto {
    colorName: string;
    colorDescription?: string;
    hexCode?: string;
}

// ====================================================================
// Response DTOs for Dropdown Data
// ====================================================================

// Response DTO for getting sizes by size type
export interface ISizesByTypeDto {
    sizeTypeId: number;
    sizeTypeName: string;
    sizes: Iproductsize[];
}

// Response DTO for getting types by category
export interface ITypesByCategoryDto {
    productCategoryId: number;
    categoryName: string;
    types: IproductType[];
}


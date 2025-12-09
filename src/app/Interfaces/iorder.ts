export interface IOrder {
  orderId: number;
  userId: number;
  cartId: number;
  shippingAddressId: number;
  billingAddressId?: number;
  orderStatusId: number;
  orderStatus?: {
    orderStatusId: number;
    orderStatusName: string;
  };
  paymentStatusId?: number;  // Add this
  paymentStatus?: {
    paymentStatusId: number;
    paymentStatusName: string;
  };
  orderInvoiceId: number;
  deliveryAmountId: number;
  deliveryAmount: number;
  totalAmount: number;
  orderTotal?: number;
  createdAt: Date;
  orderDate?: Date;
  shippingAddress: IUserAddress;
  billingAddress?: IUserAddress;
  message?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export interface IUserAddress {
  userAddressId: number;
  streetAddress: string;
  suburb: string;
  postalCode: string;
  cityId: number;
  cityName: string;
  provinceId: number;
  provinceName: string;
  countryId: number;
  countryName: string;
  isDefault: boolean;
}

export interface IOrderStatus {
  orderStatusId: number;
  orderStatusName: string;
  description?: string;
}

export interface IPaymentStatus {
  paymentStatusId: number;
  paymentStatusName: string;
  description?: string;
}

export interface IOrderItem {
  orderItemId: number;
  orderId: number;
  productId: number;
  productColorId: number;
  productSizeId: number;
  quantity: number;
  unitPrice: number;

  // Navigation properties
  product?: IProduct;
  productColor?: IProductColor;
  productSize?: IProductSize;
}

export interface IUser {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}

export interface IProduct {
  productId: number;
  productName: string;
  productDescription?: string;
  price: number;
  imageUrl?: string;
}

export interface IProductColor {
  productColorId: number;
  colorName: string;
  hexCode?: string;
}

export interface IProductSize {
  productSizeId: number;
  sizeName: string;
}

export interface IOrderAddress {
  orderAddressId: number;
  orderId?: number; // Optional when creating
  streetAddress: string;
  suburb: string;
  postalCode: string;
  cityId: number;
  provinceId: number;
  countryId: number;

  // Navigation properties
  city?: ICity;
  province?: IProvince;
  country?: ICountry;
}

export interface ICart {
  cartId: number;
  userId: number;
  paymentStatusId: number;
  cartItems?: ICartItem[];
}

export interface ICartItem {
  cartItemId: number;
  cartId: number;
  productId: number;
  productColorId: number;
  productSizeId: number;
  quantity: number;
  price: number; // Matches backend property name
}

export interface IOrderInvoice {
  orderInvoiceId: number;
  orderId: number;
  vatId: number;
  invoiceNumber: string;
  billingAddress: string;
  issuedAt: string;
  dueDate: string;
  tax: number;
  deliveryAmount: number;
  paymentStatus: string;
}

export interface IDeliveryAmount {
  deliveryAmountId: number;
  amount: number;
  description?: string;
}

export interface ICity {
  cityId: number;
  cityName: string;
  provinceId: number;
}

export interface IProvince {
  provinceId: number;
  provinceName: string;
  countryId: number;
}

export interface ICountry {
  countryId: number;
  countryName: string;
}

export interface CreateOrderRequest {
  userId: number;
  cartId: number;
  orderAddressId: number;
  billingAddressId?: number | null; // Optional
  orderStatusId: number;
  paymentStatusId: number;
  orderInvoiceId: number; // Required in backend
  deliveryAmountId: number;
  // totalAmount is calculated by backend
}

export interface OrderResponse {
  orderId: number;
  userId: number;
  cartId: number;
  orderAddressId: number;
  billingAddressId?: number;
  orderStatusId: number;
  paymentStatusId: number;
  deliveryAmountId: number;
  totalAmount: number;
  createdAt: string;
  message?: string;
}

// Updated interfaces to match backend models

export interface IDelivery {
  deliveryId: number;
  deliveryStatusId: number;
  deliveryFeeId: number;
  orderId: number;
  deliveryAddressId: number;
  deliveryDate: Date;
  deliveryStatus: string;
  trackingNumber: string;
  waybill?: string; // Editable when status is "In Transit"
  courierId?: number; // For courier assignment
  // Navigation properties
  order?: IOrder;
  deliveryAddress?: IDeliveryAddress;
  courier?: ICourier;
}

export interface IDeliveryStatus {
  deliveryStatusId: number;
  statusName: string;
  description?: string;
  lastUpdated: Date;
}

export interface IDeliveryAddress {
  deliveryAddressId: number;
  streetAddress: string;
  postalCode: string;
  suburb: string; // Suburb as text attribute
  provinceId: number;
  countryId: number;
  cityId: number;
  // Navigation properties for backend compatibility
  province?: IProvince;
  country?: ICountry;
  city?: ICity;
  orders?: IOrder[];
}

export interface IDeliveryFee {
  deliveryFeeId: number;
  feeAmount: number;
  description: string;
  provinceId: number;
  province?: IProvince;
}

export interface ICourier {
  courierId: number;
  courierName: string;
  contactNumber: string;
  email: string;
  imageUrl?: string;
  orders?: IOrder[];
}

export interface IProvince {
  provinceId: number;
  provinceName: string;
  countryId: number;
  country?: ICountry; // Nested navigation property
  cities?: ICity[];
}

export interface ICity {
  cityId: number;
  cityName: string;
  provinceId: number;
  province?: IProvince;
  suburbs?: ISuburb[];
}

export interface ISuburb {
  suburbId: number;
  suburbName: string;
  cityId: number;
  city?: ICity;
  deliveryAddresses?: IDeliveryAddress[];
}

export interface ICountry {
  countryId: number;
  countryName: string;
}

// Order interface for navigation property
export interface IOrder {
  orderId: number;
  orderDate: Date;
  orderTotal: number;
  userId: number;
  user?: IUser;
  orderStatus: string;
  courierId?: number;
  courier?: ICourier;
  deliveryAddressId?: number;
  deliveryAddress?: IDeliveryAddress;
  // Add other order properties as needed
}

// User interface for order relationships
export interface IUser {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  // Add other user properties as needed
}

// Legacy interfaces for backward compatibility
export interface IDriver {
  driverId: number;
  driverName: string;
  driverPhone: string;
  licenseNumber: string;
  vehicleNumber: string;
  isActive: boolean;
  vehicleType: string;
}

export interface DeliveryAddress {
  deliveryAddressId?: number;
  streetAddress: string; // Required, max 100 characters
  postalCode: string; // Max 10 characters
  suburb: string; // Suburb as text attribute instead of foreign key
  provinceId: number;
  cityId: number;
  countryId: number;
  // Navigation properties for backend compatibility
  province?: IProvince;
  country?: ICountry;
  city?: ICity;
}

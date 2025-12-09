import { I } from "@angular/cdk/keycodes";

export interface IUser {
  userId?:number;
  email: string;
  password: string;
  firstName?: string;
  surname?: string;
  cellphone?: string;
  confirmPassword?: string;
  profileImage?: string; // Optional profile image path or URL
  profileImageFile?: File; // Optional for handling file uploads
  ProfileImageBase64?: string;
  createdDate?: Date;
  lastModified?: Date;
  isActive?: boolean;
  roleId?: number;
  // Enale CRUD operations for different entities
  EnableEventCRUD?: boolean;
  EnableProductCRUD?: boolean;
  EnableDonationCRUD?: boolean;
  EnableExpenditureCRUD?: boolean;
  EnableInventoryCRUD?: boolean;
  EnableReportCRUD?: boolean;
  EnableEmployeeCRUD?: boolean;
  EnableDeliveryCRUD?: boolean;
  EnableRunnerCRUD?: boolean;
  EnableOrderCRUD?: boolean;
  // Additional properties can be added as needed
}
export interface IadminRoleUpdate {
enableEventCRUD?: boolean;
enableProductCRUD?: boolean;
enableDonationCRUD?: boolean;
enableExpenditureCRUD?: boolean;
enableInventoryCRUD?: boolean;
enableReportCRUD?:boolean;
enableEmployeeCRUD?:boolean;
enableDeliveryCRUD?:boolean;
enableRunnerCRUD?:boolean;
enableOrderCRUD?:boolean;


userId?: number;

}

//For Creat Admin
export interface IUserVM {
    UserId : number;
   FirstName: string;
   Surname: string;
   Email:string
   Cellphone:string
   Password: string;
   ConfirmPassword:string;
   RoleId:number;  
   ProfileImage: string
   
}


// Additional interface for image upload response
export interface IImageUploadResponse {
  success: boolean;
  message: string;
  imagePath?: string;
  imageUrl?: string;
}

// Interface for form data when updating with image
export interface IUpdateAdminRequest {
  email: string;
  firstName: string;
  surname: string;
  cellphone: string;
  password: string;
  confirmPassword: string;
  profileImage?: File;
}
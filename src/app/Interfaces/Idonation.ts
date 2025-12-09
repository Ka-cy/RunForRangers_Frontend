export interface IDonation {
  donationID: number;
  userId?: number;
  type: string;
  date: Date;
  amount: number;
  loggedByAdminId: number;
  donorName: string;
  user?: {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface IDonationType {
  donationTypeID: number;
  donationType: string;
}

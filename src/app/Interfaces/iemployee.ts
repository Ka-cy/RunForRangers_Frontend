export interface Iemployee {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string;
  cellPhone: string;
  employeeImage: string;
  selected?: boolean; // Optional property to track selection status
   userId?:number,
}

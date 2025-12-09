import { IUser } from "./IUser";
import { Ievent } from "./ievent";

export interface IEventRegistration {
  eventName: string;
  firstName: string;
  surname: string;
  cellphone: string;
  email: string;
  user: IUser[];
  event: Ievent[];
}

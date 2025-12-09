import { Ijob } from "./ijob";
export interface Ievent {
  id: number;
  eventName: string;
  description: string;
  date: string; // For frontend compatibility
  isCompleted: boolean;
  eventStatusId: number;
  eventStatusName: string;
  isPublic: boolean; // Controls visibility on user calendar
  jobs: Ijob[];
}
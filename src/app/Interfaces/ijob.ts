import { Iemployee } from "./iemployee";
import { IemployeeJob } from "./iemployeejob";

export interface Ijob {
  jobId: number;
  jobTitle: string;
  jobDescription: string;
  eventId: number;
  jobStatusId: number;
  jobStatusName: string;
  employees: Iemployee[];
}
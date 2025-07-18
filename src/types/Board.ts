import { Timestamp } from "firebase/firestore";

export interface Board {
  id: string;
  name: string;
  createdBy: string;
  members?: string[];
  isPublic: boolean;
  createdAt: Timestamp;
}

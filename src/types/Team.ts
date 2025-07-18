import { Timestamp } from "firebase/firestore";

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  createdAt: Timestamp;
}

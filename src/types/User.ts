import type { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  createdAt: Timestamp;
}

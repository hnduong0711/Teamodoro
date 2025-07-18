import type { Timestamp } from "firebase/firestore";


export interface Notification {
  id: string;
  type: "deadline" | "comment";
  message: string;
  taskId: string;
  timestamp: Timestamp;
}
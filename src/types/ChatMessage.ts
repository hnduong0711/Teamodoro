import { Timestamp } from "firebase/firestore";

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: Timestamp;
}


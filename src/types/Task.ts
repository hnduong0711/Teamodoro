import { Timestamp } from "firebase/firestore";

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string[];
  startDate: Timestamp;
  dueDate?: Timestamp;
  isStart: boolean;
  isDone: boolean;
  createdAt: Timestamp;
  createdBy: string;
  position: number;
  focusCount: number;
  focusType: string;
  columnId: string;
}

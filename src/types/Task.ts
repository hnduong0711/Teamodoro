import type { ChecklistItem } from "./ChecklistItem";

export interface Task {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  assignedTo?: string[];
  dueDate?: string;
  checklist?: ChecklistItem[];
  createdAt: string;
  createdBy: string;
  position: number;
  focusCount: number;
  focusType: string;
}

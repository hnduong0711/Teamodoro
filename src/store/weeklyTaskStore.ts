import {create} from 'zustand';
import { type Task } from '../types/Task';

interface WeeklyTaskState {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  clearTasks: () => void;
}

export const useWeeklyTaskStore = create<WeeklyTaskState>((set) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  clearTasks: () => set({ tasks: [] }),
}));
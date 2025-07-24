import { create } from "zustand";
import { type Task } from "../types/Task";

interface TaskState {
  tasksByColumn: Record<string, Task[]>;
  currentTask: Task | null;
  setTasks: (columnId: string, tasks: Task[]) => void;
  setCurrentTask: (task: Task | null) => void;
  addTask: (columnId: string, task: Task) => void;
  updateTaskInState: (
    columnId: string,
    taskId: string,
    updates: Partial<Task>
  ) => void;
  deleteTask: (columnId: string, taskId: string) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasksByColumn: {},
  currentTask: null,
  setTasks: (columnId, tasks) =>
    set((state) => ({
      tasksByColumn: { ...state.tasksByColumn, [columnId]: tasks },
    })),
  setCurrentTask: (task) => set({ currentTask: task }),
  addTask: (columnId, task) =>
    set((state) => ({
      tasksByColumn: {
        ...state.tasksByColumn,
        [columnId]: [...(state.tasksByColumn[columnId] || []), task],
      },
    })),
  updateTaskInState: (columnId, taskId, updates) =>
    set((state) => ({
      tasksByColumn: {
        ...state.tasksByColumn,
        [columnId]:
          state.tasksByColumn[columnId]?.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          ) || [],
      },
    })),
  deleteTask: (columnId, taskId) =>
    set((state) => ({
      tasksByColumn: {
        ...state.tasksByColumn,
        [columnId]:
          state.tasksByColumn[columnId]?.filter((task) => task.id !== taskId) ||
          [],
      },
    })),
}));
